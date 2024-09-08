const Cart = require("../models/cartModel");

// Add item to cart
exports.addItemToCart = async (req, res) => {
  const { customerId, itemId} = req.body;

  try {
    if (!customerId || !itemId) {
      return res.status(400).json({
        success: false,
        message: "feilds like customerId, itemId are required",
      });
    }
    let cart = await Cart.findOne({ customer:customerId, product: itemId});

    if (!cart) {
      cart = new Cart({ customer:customerId, product: itemId});
    }else{
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