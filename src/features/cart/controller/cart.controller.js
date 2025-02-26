import Cart from "../model/cart.model.js";
import CustomerAddress from "../../customer-address/model/customer-address.model.js";
import Booking from "../../booking/model/booking.model.js";
import MostBookedProduct from "../../most-booked-product/model/most-booked-product.model.js";
import Transaction from "../../transaction/model/transaction.model.js";
import Customer from "../../customer/model/customer.model.js";

// Add item to cart
export const addItemToCart = async (req, res) => {
  const { customerId, itemId, optionId, price } = req.body;

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
      query.productOption = optionId; // Add productOption only if optionId is provided
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
        newCartItem.productOption = optionId; // Add productOption if provided
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

export const bookCart = async (req, res) => {
  const {
    customerId,
    discountType,
    discountValue,
    offerType,
    offerRefId,
    customerAddressId,
    scheduleFor,
    bookingTransactionId,
    paymentStatus,
    paymentGatewayId,
  } = req.body;

  try {
    // Validate required fields
    const requiredFields = { customerId, customerAddressId, scheduleFor, bookingTransactionId };
    const missingFields = Object.keys(requiredFields).filter((key) => !requiredFields[key]);
    if (missingFields.length)
      return res.status(400).json({ success: false, message: `Missing fields: ${missingFields.join(", ")}` });

    // Fetch customer address
    const customerAddressData = await CustomerAddress.findOne({ _id: customerAddressId, isActive: true, isDeleted: false });
    if (!customerAddressData) return res.status(404).json({ success: false, message: "Customer address not found" });

    const { address } = customerAddressData;
    const customerAddress = `${address.fullAddress}, near ${address.landmark}, ${address.locality}, ${address.city}, ${address.state}, ${address.pincode}, ${address.country}`;

    // Fetch cart items
    const cart = await Cart.find({ customer: customerId }).populate("product").select("-__v");
    if (!cart.length) return res.status(404).json({ success: false, message: "No items in the cart" });

    const products = cart.map(({ product, quantity, price, productOption }) => ({
      product: product._id,
      quantity,
      price,
      ...(productOption && { option: productOption }),
    }));

    const totalPrice = products.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = discountType === "percentage" ? (totalPrice * discountValue) / 100 : discountValue || 0;
    const finalPrice = totalPrice - discount;

    // Validate transaction
    const transactionData = await Transaction.findOne({ _id: bookingTransactionId, isDeleted: false });
    if (!transactionData) return res.status(404).json({ success: false, message: "Transaction not found" });
    if (["completed", "failed"].includes(transactionData.status.toLowerCase()))
      return res.status(400).json({ success: false, message: `Transaction already marked as ${transactionData.status}` });

    // Handle different payment types
    if (transactionData.transactionType === "gateway_booking") {
      if (["completed", "failed"].includes(paymentStatus)) {
        transactionData.status = paymentStatus;
        if (paymentStatus === "completed") transactionData.transactionRefId = paymentGatewayId;
        await transactionData.save();
        if (paymentStatus === "failed") return res.status(400).json({ success: true, message: "Cart booking failed" });
      }
    } else if (transactionData.transactionType === "wallet_booking") {
      const customer = await Customer.findOne({ _id: customerId, isDeleted: false });
      if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
      if (customer.walletBalance < finalPrice)
        return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
      customer.walletBalance -= finalPrice;
      await customer.save();
      transactionData.status = "completed";
      await transactionData.save();
    }

    // Create booking
    const newBooking = await Booking.create({
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
      transaction: transactionData._id,
      paymentStatus: transactionData.status,
      isActive: true,
      isDeleted: false,
    });

    // Update MostBookedProduct
    await Promise.all(
      products.map(async ({ product }) => {
        const existingRecord = await MostBookedProduct.findOne({ product, isActive: true, isDeleted: false });
        existingRecord ? existingRecord.count++ : await MostBookedProduct.create({ product, count: 1 });
        await existingRecord?.save();
      })
    );

    // Clear cart
    await Cart.deleteMany({ customer: customerId });
    res.status(200).json({ success: true, message: "Cart booked successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error booking cart", errorMessage: error.message });
  }
};

// Fetch cart by customer ID
export const getCartByCustomerId = async (req, res) => {
  const { id } = req.body;

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }
    const cart = await Cart.find({ customer: id })
      .populate("product")
      .select("-__v")
      .lean();

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart for customerId " + id + " not found",
      });
    }

    cart.forEach((cartItem) => {
      const productItem = cartItem.product;

      // Check if there is an option selected for this product
      if (cartItem.productOption && productItem.options) {
        const selectedOption = productItem.options.find((opt) =>
          opt._id.equals(cartItem.productOption)
        );

        if (selectedOption) {
          let clonedProduct = JSON.parse(JSON.stringify(productItem.product));

          // Update product image with option's image
          clonedProduct.image = selectedOption.image;

          // Update product name by concatenating the option name with the original product name
          clonedProduct.name = `${selectedOption.option} ${clonedProduct.name}`;

          // Update product price with option price
          clonedProduct.price = selectedOption.price;

          // Update product details with option's details
          clonedProduct.details = selectedOption.details;

          // Assign the cloned product back to the productItem
          productItem.product = clonedProduct;
        }
      }

      // delete cartItem.productOption;
      // delete cartItem.price;
      // delete cartItem.product.options;
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
export const removeItemFromCart = async (req, res) => {
  const { cartItemId } = req.body;

  try {
    if (!cartItemId) {
      return res.status(400).json({
        success: false,
        message: "cartItemId is required",
      });
    }
    const cart = await Cart.findOne({ _id: cartItemId });

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

// Empty cart
export const emptyCart = async (req, res) => {
  const { id } = req.body;

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "customerId is required",
      });
    }
    const cart = await Cart.find({ customer: id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "There is no item in the cart",
      });
    }

    await Cart.deleteMany({ customer: id });

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

export const incrementItemQuantity = async (req, res) => {
  const { cartItemId } = req.body;
  try {
    if (!cartItemId) {
      return res.status(400).json({
        success: false,
        message: "cartItemId is required",
      });
    }
    let cart = await Cart.findOne({ _id: cartItemId });

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
    let cart = await Cart.findOne({ _id: cartItemId });

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
