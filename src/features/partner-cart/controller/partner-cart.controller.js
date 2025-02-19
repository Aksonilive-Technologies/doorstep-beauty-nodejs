import PartnerCart from "../model/partner-cart.model.js";
import StockBooking from "../../stock-booking/model/stock-booking.model.js";
import PartnerTransaction from "../../partner-transaction/model/partner-transaction.model.js";
import Partner from "../../partner/model/partner.model.js";
import Stock from "../../stock/model/stock.model.js";
import { createOrder } from "../../../../helper/razorpayHelper.js";

// Add item to cart
export const addItemToCart = async (req, res) => {
  const { partnerId, itemId } = req.body;

  try {
    if (!partnerId || !itemId) {
      return res.status(400).json({
        success: false,
        message: "feilds like partnerId, itemId are required",
      });
    }

    let cart = await PartnerCart.findOne({
      partner: partnerId,
      stockItem: itemId,
    });

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
      currentQuantity: cart.quantity + 1
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding item to cart",
      errorMessage: error.message,
    });
  }
};

export const createCartBookingTransaction = async (req, res) => {
  let { partnerId, paymentMode } = req.body;

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
      .populate("stockItem")
      .populate("partner")
      .select("-__v");

    if (!cart || cart.length === 0) {
      return res.status(404).json({
        success: false,
        message: "There is no item in the cart",
      });
    }

    const totalAmount = cart.reduce(
      (sum, item) => sum + item.stockItem.mrp * item.quantity,
      0
    );

    let transactionType = "stock_booking";
    let orderId = "";

    if (paymentMode === "wallet") {
      // Check if the partner has sufficient wallet balance
      const partner = await Partner.findById(partnerId).select("wallet").lean();

      if (partner.wallet < totalAmount) {
        return res.status(400).json({
          success: false,
          message: "Insufficient wallet balance",
        });
      }

      transactionType = "stock_wallet_booking";
    } else if (paymentMode === "razorpay") {
      orderId = await createOrder(Number(totalAmount) * 100);
    }

    // Create new transaction
    let newTransaction = new PartnerTransaction({
      partnerId: partnerId,
      transactionType: transactionType,
      amount: Number(totalAmount),
      paymentGateway: paymentMode,
    });

    newTransaction = await newTransaction.save();

    res.status(200).json({
      success: true,
      message: `Cart booking transaction created`,
      data: { Transaction: newTransaction, OrderId: orderId },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating cart booking transaction",
      errorMessage: error.message,
    });
  }
};

export const bookCart = async (req, res) => {
  let { partnerId, transactionId, paymentGatewayId } = req.body;

  try {
    // Validate required fields
    const missingFields = [];
    if (!partnerId) missingFields.push("partnerId");
    if (!transactionId) missingFields.push("transactionId");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing fields: ${missingFields.join(", ")}`,
      });
    }

    // Fetch cart items for the partner
    const cart = await PartnerCart.find({ partner: partnerId })
      .populate("stockItem")
      .populate("partner")
      .select("-__v");

    console.log(cart);

    if (!cart || cart.length === 0) {
      return res.status(404).json({
        success: false,
        message: "There is no item in the cart",
      });
    }

    // Extract product IDs from the cart
    const productIds = cart.map((item) => item.stockItem._id);

    // Fetch all stock items in a single query
    const stockItems = await Stock.find({ _id: { $in: productIds } });

    // Validate stock availability for each item in the cart
    for (let i = 0; i < stockItems.length; i++) {
      const cartItem = cart.find((item) =>
        item.stockItem._id.equals(stockItems[i]._id)
      );
      if (stockItems[i].currentStock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for item ${stockItems[i].name}`,
        });
      }
    }

    // Deduct stock for each item in the cart
    const stockUpdates = stockItems.map((stockItem) => {
      const cartItem = cart.find((item) =>
        item.stockItem._id.equals(stockItem._id)
      );
      if (cartItem) {
        stockItem.currentStock -= cartItem.quantity;
        return stockItem.save(); // Return a promise for each save
      }
    });

    // Wait for all stock items to be updated
    await Promise.all(stockUpdates);

    // Calculate total cart amount
    const totalAmount = cart.reduce(
      (sum, item) => sum + item.stockItem.mrp * item.quantity,
      0
    );

    const partnertransactionRecord = await PartnerTransaction.findOne({
      _id: transactionId,
      isDeleted: false,
    });

    if (!partnertransactionRecord) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found with given ID" + transactionId,
      });
    }

    if (partnertransactionRecord.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Transaction is already marked as ${partnertransactionRecord.status}`,
      });
    }

    if (partnertransactionRecord.paymentGateway === "wallet") {
      // Deduct amount from wallet and update partner's balance
      await Partner.findByIdAndUpdate(partnerId, {
        $inc: { wallet: -totalAmount },
      });
      partnertransactionRecord.status = "completed";
      await partnertransactionRecord.save();
    } else if (
      partnertransactionRecord.paymentGateway === "razorpay" &&
      paymentGatewayId
    ) {
      partnertransactionRecord.status = "completed";
      partnertransactionRecord.transactionRefId = paymentGatewayId;
      await partnertransactionRecord.save();
    } else {
      partnertransactionRecord.status = "failed";
      await partnertransactionRecord.save();
      return res.status(404).json({
        success: false,
        message: "Cart booking failed due to payment failure",
      });
    }

    // Create a new booking
    const newBooking = new StockBooking({
      partner: partnerId,
      product: cart.map((item) => ({
        product: item.stockItem._id,
        quantity: item.quantity,
      })),
      totalPrice: totalAmount,
      deliveryAddress: cart[0].partner.address, // Assuming all items have the same delivery address
      transaction: transactionId,
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
export const getCartByPartnerId = async (req, res) => {
  const { id } = req.body;

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "partnerId is required",
      });
    }
    const cart = await PartnerCart.find({ partner: id })
      .populate("stockItem")
      .select("-__v")
      .lean();

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart for partnerId " + id + " not found",
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
export const removeItemFromCart = async (req, res) => {
  const { cartItemId } = req.body;

  try {
    if (!cartItemId) {
      return res.status(400).json({
        success: false,
        message: "cartItemId is required",
      });
    }
    const cart = await PartnerCart.findOne({ _id: cartItemId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    } else {
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

export const incrementItemQuantity = async (req, res) => {
  const { cartItemId } = req.body;
  try {
    if (!cartItemId) {
      return res.status(400).json({
        success: false,
        message: "cartItemId is required",
      });
    }
    let cart = await PartnerCart.findOne({ _id: cartItemId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    } else {
      cart.quantity += 1;
      await cart.save();
      res.status(200).json({
        success: true,
        message: "Item quantity incremented successfully",
        currentQuantity: cart.quantity + 1,
      });
    }
  } catch (error) {
    console.error("Error incrementing item quantity:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errorMessage: error.message,
    });
  }
};

// Decrement Item Quantity in Cart
export const decrementItemQuantity = async (req, res) => {
  const { cartItemId } = req.body;
  try {
    if (!cartItemId) {
      return res.status(400).json({
        success: false,
        message: "cartItemId is required",
      });
    }
    let cart = await PartnerCart.findOne({ _id: cartItemId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    } else {
      if (cart.quantity === 1) {
        await cart.deleteOne();
      } else {
        cart.quantity -= 1;
        await cart.save();
      }
      res.status(200).json({
        success: true,
        message: "Item quantity decremented successfully",
        currentQuantity: cart.quantity - 1,
      });
    }
  } catch (error) {
    console.error("Error decrementing item quantity:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errorMessage: error.message,
    });
  }
};
