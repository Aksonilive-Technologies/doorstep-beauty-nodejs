const Cart = require("../models/cartModel");

// Add item to cart
exports.addItemToCart = async (req, res) => {
  const { customerId, itemType, itemId, quantity } = req.body;

  try {
    if (!customerId || !itemType || !itemId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "feilds like customerId, itemType, itemId, quantity are required",
      });
    }
    let cart = await Cart.findOne({ customerId, isActive: true ,isDeleted: false});

    if (!cart) {
      cart = new Cart({ customerId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.itemType === itemType && item.itemId.toString() === itemId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ itemType, itemId, quantity });
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

  const customerId = id;
  try {
    const cart = await Cart.findOne({ customerId, isActive: true ,isDeleted: false }).populate('items.itemId').select('-__v');

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

// Update item quantity in cart
exports.updateCartItem = async (req, res) => {
    const { customerId, itemType, itemId, quantity } = req.body;
  
    try {
      // Validate required fields
      if (!customerId || !itemType || !itemId) {
        return res.status(400).json({
          success: false,
          message: "Fields customerId, itemType, and itemId are required",
        });
      }
  
      // Fetch the active cart for the customer
      const cart = await Cart.findOne({ customerId, isActive: true });
  
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
        });
      }
  
      // Find the index of the item to be updated
      const itemIndex = cart.items.findIndex(
        (item) => item.itemType === itemType && item.itemId.toString() === itemId
      );
  
      // Check if the item exists in the cart
      if (itemIndex > -1) {
        // Update quantity if provided
        if (quantity !== undefined) {
          if (quantity > 0) {
            cart.items[itemIndex].quantity = quantity;
          } else {
            cart.items.splice(itemIndex, 1); // Remove item if quantity is 0 or less
          }
        }
  
        // Save the updated cart
        await cart.save();
  
        return res.status(200).json({
          success: true,
          message: "Cart item updated successfully",
          data: cart,
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "Item not found in cart",
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error updating cart item",
        errorMessage: error.message,
      });
    }
  };
  
// Remove item from cart
exports.removeItemFromCart = async (req, res) => {
  const { customerId, itemType, itemId } = req.body;

  try {
    if (!customerId || !itemType || !itemId) {
      return res.status(400).json({
        success: false,
        message: "feilds like customerId, itemType, itemId are required",
      });
    }
    const cart = await Cart.findOne({ customerId, isActive: true,isDeleted: false });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.itemType === itemType && item.itemId.toString() === itemId
    );

    if (itemIndex > -1) {
      cart.items.splice(itemIndex, 1);
      await cart.save();

      res.status(200).json({
        success: true,
        message: "Item removed from cart successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Item not found in cart",
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
  const customerId = id ? id : req.user._id;

  try {
    const cart = await Cart.findOne({ customerId, isActive: true,isDeleted: false });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found, may be deleted or deactivated temporarily",
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart emptied successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error emptying cart",
      errorMessage: error.message,
    });
  }
};

exports.incrementItemQuantity = async (req, res) => {
  try {
    const { id, itemId, itemType } = req.body;

    const cart = await Cart.findOne({ customerId : id, isActive: true,isDeleted: false });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found, may be deleted or deactivated temporarily" });
    }

    const item = cart.items.find(
      (item) => item.itemId.toString() === itemId && item.itemType === itemType
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Item With given id " + itemId + " not found in cart" });
    }

    item.quantity += 1;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Item quantity incremented successfully",
    });
  } catch (error) {
    console.error("Error incrementing item quantity:", error);
    return res.status(500).json({ success: false, message: "Internal server error", errorMessage: error.message });
  }
};

// Decrement Item Quantity in Cart
exports.decrementItemQuantity = async (req, res) => {
  try {
    const { id, itemId, itemType } = req.body;

    const cart = await Cart.findOne({ customerId : id, isActive: true ,isDeleted: false });

    if (!cart) {
      return res.status(404).json({success: false, message: "Cart not found, may be deleted or deactivated temporarily" });
    }

    const item = cart.items.find(
      (item) => item.itemId.toString() === itemId && item.itemType === itemType
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Item wiht given id " + itemId + " not found in cart" });
    }

    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      return res
        .status(400)
        .json({success: false, message: "Item quantity cannot be less than 1" });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Item quantity decremented successfully",

    });
  } catch (error) {
    console.error("Error decrementing item quantity:", error);
    return res.status(500).json({success: false, message: "Internal server error", errorMessage: error.message });
  }
};