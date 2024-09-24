const PartnerCart = require("../models/partnerCartModel");
const StockBooking = require("../models/stockBookingModel");
const PartnerTransaction = require("../models/partnerTransactionModel");
const Partner = require("../models/partnerModel");

// Add item to cart
exports.addItemToCart = async (req, res) => {
  const { partnerId, itemId} = req.body;

  try {
    if (!partnerId || !itemId) {
      return res.status(400).json({
        success: false,
        message: "feilds like partnerId, itemId are required",
      });
    }

    let cart = await PartnerCart.findOne({partner: partnerId, stockItem: itemId});

    // If cart item doesn't exist, create a new one
    if (!cart) {

      cart = new PartnerCart({
        partner: partnerId,
        stockItem: itemId,
      });
    } else {
      // If the cart item exists, increment the quantity
      cart.quantity += 1;
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding item to cart",
      errorMessage: error.message,
    });
  }
};

exports.bookCart = async (req, res) => {
    let { partnerId, paymentMode, transactionStatus, paymentGatewayId } = req.body;
  
    try {
      // Validate required fields
      const missingFields = [];
      if (!partnerId) missingFields.push("partnerId");
      if (!paymentMode) missingFields.push("paymentMode");
  
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing fields: ${missingFields.join(", ")}`,
        });
      }
  
      // Fetch cart items for the partner
      const cart = await PartnerCart.find({ partner: partnerId })
        .populate('stockItem')
        .populate('partner')
        .select('-__v');
  
      if (!cart || cart.length === 0) {
        return res.status(404).json({
          success: false,
          message: "There is no item in the cart",
        });
      }
  
      // Calculate total cart amount
      const totalAmount = cart.reduce(
        (sum, item) => sum + item.stockItem.mrp * item.quantity, 0
      );
  
      let transactionType = "stock_booking";
  
      if (paymentMode === "wallet") {
        // Check if the partner has sufficient wallet balance
        const partner = await Partner.findById(partnerId).select('wallet').lean();
        
        if (partner.wallet < totalAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient wallet balance",
          });
        }
  
        // Deduct amount from wallet and update partner's balance
        await Partner.findByIdAndUpdate(partnerId, { $inc: { wallet: -totalAmount } });
        transactionType = "stock_wallet_booking";
        transactionStatus = "completed";
      }
      else if (paymentMode === "cash") {
        transactionStatus = "pending";
      }

      console.log(partnerId, transactionType, totalAmount, transactionStatus, paymentMode, paymentGatewayId);
  
      // Create new transaction
      let newTransaction = new PartnerTransaction({
        partnerId: partnerId,
        transactionType: transactionType,
        amount: totalAmount,
        status: transactionStatus,
        paymentGateway: paymentMode,
        transactionRefId: paymentGatewayId || undefined,
      });
  
      newTransaction = await newTransaction.save();
  
      // Create a new booking
      const newBooking = new StockBooking({
        partner: partnerId,
        product: cart.map(item => ({
          product: item.stockItem._id,
          quantity: item.quantity,
        })),
        totalPrice: totalAmount,
        deliveryAddress: cart[0].partner.address, // Assuming all items have the same delivery address
        transaction: newTransaction._id,
      });
  
      await newBooking.save();
  
      // Delete all cart items for the partner
      await PartnerCart.deleteMany({ partner: partnerId });
  
      res.status(200).json({
        success: true,
        message: "Cart booked successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error booking cart",
        errorMessage: error.message,
      });
    }
  };

// Fetch cart by customer ID
exports.getCartByPartnerId = async (req, res) => {
  const { id } = req.body;

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "partnerId is required",
      });}
    const cart = await PartnerCart.find({ partner:id}).populate('stockItem').select('-__v').lean();

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart for partnerId "+id+" not found",
      });
    }
    
    cart.sort((a, b) => b.stockItem.mrp - a.stockItem.mrp);

    res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching cart",
      errorMessage: error.message,
    });
  }
};

// Remove item from cart
exports.removeItemFromCart = async (req, res) => {
  const { cartItemId } = req.body;

  try {
    if (!cartItemId) {
      return res.status(400).json({
        success: false,
        message: "cartItemId is required",
      });
    }
    const cart = await PartnerCart.findOne({ _id:cartItemId});

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }else{
      await cart.deleteOne();
      return res.status(200).json({
        success: true,
        message: "Item removed from cart successfully",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error removing item from cart",
      errorMessage: error.message,
    });
  }
};

exports.incrementItemQuantity = async (req, res) => {
  const { cartItemId} = req.body;
  try {
    if (!cartItemId) {
      return res.status(400).json({
        success: false,
        message: "cartItemId is required",
      });
    }
    let cart = await PartnerCart.findOne({ _id: cartItemId});

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }else{
      cart.quantity += 1;
      await cart.save();
      res.status(200).json({
        success: true,
        message: "Item quantity incremented successfully",
      });
    }
  } catch (error) {
    console.error("Error incrementing item quantity:", error);
    return res.status(500).json({ success: false, message: "Internal server error", errorMessage: error.message });
  }
};

// Decrement Item Quantity in Cart
exports.decrementItemQuantity = async (req, res) => {
  const { cartItemId} = req.body;
  try {
    if (!cartItemId) {
      return res.status(400).json({
        success: false,
        message: "cartItemId is required",
      });
    }
    let cart = await PartnerCart.findOne({ _id: cartItemId});

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }else{
      if(cart.quantity === 1){
        await cart.deleteOne();
      }else{
        cart.quantity -= 1;
        await cart.save();
      }
      res.status(200).json({
        success: true,
        message: "Item quantity decremented successfully",
      });
    }
  } catch (error) {
    console.error("Error decrementing item quantity:", error);
    return res.status(500).json({success: false, message: "Internal server error", errorMessage: error.message });
  }
};