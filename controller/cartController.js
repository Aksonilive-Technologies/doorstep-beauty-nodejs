const Cart = require("../models/cartModel");
const CustomerAddress = require("../models/customerAddressModel");
const Booking = require("../models/bookingModel");
const MostBookedProduct = require("../models/mostBookedProductModel");

// Add item to cart
exports.addItemToCart = async (req, res) => {
  const { customerId, itemId, optionId, price} = req.body;

  try {
    if (!customerId || !itemId || !price) {
      return res.status(400).json({
        success: false,
        message: "feilds like customerId, itemId, price are required",
      });
    }
    let cart;
    const query = { customer: customerId, product: itemId };

    if (optionId) {
      query.productOption = optionId;  // Add productOption only if optionId is provided
    }

    cart = await Cart.findOne(query);

    // If cart item doesn't exist, create a new one
    if (!cart) {
      const newCartItem = {
        customer: customerId,
        product: itemId,
        price,
      };

      if (optionId) {
        newCartItem.productOption = optionId;  // Add productOption if provided
      }

      cart = new Cart(newCartItem);
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
  const {
    customerId,
    discountType,
    discountValue,
    offerType,
    offerRefId,
    customerAddressId,
    scheduleFor,
  } = req.body;

  try {
    // Check for required fields in one place
    const missingFields = [];
    if (!customerId) missingFields.push("customerId");
    if (!customerAddressId) missingFields.push("customerAddressId");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing fields: ${missingFields.join(", ")}`,
      });
    }

    // Fetch customer address and concatenate it
    const customerAddressData = await CustomerAddress.findOne({
      _id: customerAddressId,
      isActive: true,
      isDeleted: false,
    });

    if (!customerAddressData) {
      return res.status(404).json({
        success: false,
        message: "Customer address not found",
      });
    }

    const customerAddress = `${customerAddressData.address.houseNo}, ${customerAddressData.address.buildingName}, ${customerAddressData.address.street}, ${customerAddressData.address.city}, ${customerAddressData.address.state}, ${customerAddressData.address.pincode}, ${customerAddressData.address.country}`;

    // Fetch cart items for the customer
    const cart = await Cart.find({ customer: customerId })
    .populate('product')
    .select('-__v');

    if (!cart || cart.length === 0) {
      return res.status(404).json({
        success: false,
        message: "There is no item in the cart",
      });
    }

    const products = cart.map(item => {
      const productData = {
        product: item.product._id,
        quantity: item.quantity,
        price: item.price,
      };
    
      // Include productOption only if it's present
      if (item.productOption) {
        productData.option = item.productOption;
      }
    
      return productData;
    });

    const totalPrice = products.reduce(
      (sum, item) => sum + item.price * item.quantity, 0
    );

    // Calculate discount
    let discount = 0;
    if (discountType === "percentage") {
      discount = totalPrice * (discountValue / 100);
    } else if (["flat_amount", "product"].includes(discountType)) {
      discount = discountValue;
    }

    const finalPrice = totalPrice - discount;

    // Create a new booking
    const newBooking = new Booking({
      customer: customerId,
      product: products,
      totalPrice,
      discountType,
      discountValue,
      discount,
      finalPrice,
      offerType,
      offerRefId,
      customerAddress,
      scheduleFor,
      isActive: true,
      isDeleted: false,
    });

    await newBooking.save();

    // Update MostBookedProduct in parallel using Promise.all
    await Promise.all(
      products.map(async (item) => {
        const existingRecord = await MostBookedProduct.findOne({
          product: item.product,
          isActive: true,
          isDeleted: false,
        });

        if (existingRecord) {
          existingRecord.count += 1;
          await existingRecord.save();
        } else {
          await MostBookedProduct.create({
            product: item.product,
            count: 1,
          });
        }
      })
    );

    // Delete cart items for the customer
    await Cart.deleteMany({ customer: customerId });

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
exports.getCartByCustomerId = async (req, res) => {
  const { id } = req.body;

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });}
    const cart = await Cart.find({ customer:id}).populate('product').select('-__v');

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart for customerId "+customerId+" not found",
      });
    }

      cart.product.forEach(productItem => {
        // Check if there is an option selected for this product
        if (productItem.option && productItem.product.options) {
          const selectedOption = productItem.product.options.find(opt => opt._id.equals(productItem.option));
    
          if (selectedOption) {
            // Update product image with option's image
            productItem.product.image = selectedOption.image;
    
            // Concatenate option's name with product's name
            productItem.product.name = `${selectedOption.option} ${productItem.product.name}`;
    
            // Update product details with option's details
            productItem.product.details = selectedOption.details;
          }
        }
      });
    
    cart.sort((a, b) => b.product.price - a.product.price);

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
    const cart = await Cart.findOne({ _id:cartItemId});

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

// Empty cart
exports.emptyCart = async (req, res) => {
  const { id } = req.body;

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }
    const cart = await Cart.find({ customer:id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "There is no item in the cart",
      });
    }

    await Cart.deleteMany({ customer:id });

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error clearing cart",
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
    let cart = await Cart.findOne({ _id: cartItemId});

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
    let cart = await Cart.findOne({ _id: cartItemId});

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