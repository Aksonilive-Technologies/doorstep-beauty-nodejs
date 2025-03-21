import Cart from "../model/cart.model.js";
import CustomerAddress from "../../customer-address/model/customer-address.model.js";
import Booking from "../../booking/model/booking.model.js";
import MostBookedProduct from "../../most-booked-product/model/most-booked-product.model.js";
import Transaction from "../../transaction/model/transaction.model.js";
import Customer from "../../customer/model/customer.model.js";
import FirebaseToken from "../../firebase-token/model/firebase-token.model.js";
import * as CustomerFCMService from "../../../../helper/customerFcmService.js";
import Product from "../../product/model/product.model.js";
import waMsgService from "../../../../utility/waMsgService.js";
import moment from "moment";

// Add item to cart
export const addItemToCart = async (req, res) => {
  const { customerId, itemId} = req.body;

  try {
    if (!customerId || !itemId) {
      return res.status(400).json({
        success: false,
        message: "feilds like customerId and itemId are required",
      });
    }
    let cart;
    const query = { customer: customerId, product: itemId };
    const product = await Product
      .findById(itemId)
      .select("-__v");

    cart = await Cart.findOne(query);

    // If cart item doesn't exist, create a new one
    if (!cart) {
      const newCartItem = {
        customer: customerId,
        product: itemId,
        price: product.price,
      };

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
    membershipId,
    membershipTransactionId,
  } = req.body;

  try {
    // Validate required fields
    const requiredFields = {
      customerId,
      customerAddressId,
      scheduleFor,
      bookingTransactionId,
    };
    const missingFields = Object.keys(requiredFields).filter(
      (key) => !requiredFields[key]
    );
    if (missingFields.length)
      return res.status(400).json({
        success: false,
        message: `Missing fields: ${missingFields.join(", ")}`,
      });

    // Fetch customer address
    const customerAddressData = await CustomerAddress.findOne({
      _id: customerAddressId,
      isActive: true,
      isDeleted: false,
    });
    if (!customerAddressData)
      return res
        .status(404)
        .json({ success: false, message: "Customer address not found" });

    const { address } = customerAddressData;
    const customerAddress = `${address.fullAddress}, near ${address.landmark}, ${address.locality}, ${address.city}, ${address.state}, ${address.pincode}, ${address.country}`;

    // Fetch cart items
    const cart = await Cart.find({ customer: customerId })
      .populate("product")
      .select("-__v");
    if (!cart.length)
      return res
        .status(404)
        .json({ success: false, message: "No items in the cart" });

    const products = cart.map(({ product, quantity, price }) => ({
      product: product._id,
      quantity,
      price,
    }));

    const totalPrice = products.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const discount =
      discountType === "percentage"
        ? (totalPrice * discountValue) / 100
        : discountValue || 0;
    const taxes = totalPrice * 0.04;
    let finalPrice = totalPrice + taxes - discount;

    // Validate transaction
    const transactionData = await Transaction.findOne({
      _id: bookingTransactionId,
      isActive: true,
      isDeleted: false,
    });

    const customer = await Customer.findOne({
      _id: customerId,
      isActive: true,
      isDeleted: false,
    });
    if (!transactionData)
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });

    if (["completed", "failed"].includes(transactionData.status.toLowerCase()))
      return res.status(400).json({
        success: false,
        message: `Transaction already marked as ${transactionData.status}`,
      });

    let membershipTransactionData;
    if (membershipId) {
      membershipTransactionData = await Transaction.findOne({
        _id: membershipTransactionId,
        isActive: true,
        isDeleted: false,
      });
      if (!membershipTransactionData)
        return res.status(404).json({
          success: false,
          message: "Membership transaction not found",
        });

      if (
        ["completed", "failed"].includes(
          membershipTransactionData.status.toLowerCase()
        )
      )
        return res.status(400).json({
          success: false,
          message: `Transaction already marked as ${membershipTransactionData.status}`,
        });
    }
    // Handle different payment types
    if (transactionData.transactionType === "gateway_booking") {
      if (["completed", "failed"].includes(paymentStatus)) {
        transactionData.status = paymentStatus;
        if (paymentStatus === "completed")
          transactionData.transactionRefId = paymentGatewayId;
        await transactionData.save();

        if (membershipId) {
          membershipTransactionData.status = paymentStatus;
          if (paymentStatus === "completed")
            membershipTransactionData.transactionRefId = paymentGatewayId;
          await membershipTransactionData.save();
        }
        if (paymentStatus === "failed")
          return res
            .status(400)
            .json({ success: true, message: "Cart booking failed" });
      }
    } else if (transactionData.transactionType === "wallet_booking") {
      if (!customer)
        return res
          .status(404)
          .json({ success: false, message: "Customer not found" });
      if (customer.walletBalance < finalPrice)
        return res
          .status(400)
          .json({ success: false, message: "Insufficient wallet balance" });
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

    const bookings = await Booking.find({ customer: customerId });
    // Process referaal bonus on 1st booking
    if (bookings.length == 1) {
      const refereeCustomerId = customer.referredBy;
      const refereeCustomer = await Customer.findById(refereeCustomerId);

      const transaction = new Transaction({
        customerId: refereeCustomer._id,
        transactionType: "referral_bonus",
        amount: 100,
        paymentGateway: "system",
        status: "completed"
      });
      await transaction.save();
      refereeCustomer.walletBalance+=100;
      await refereeCustomer.save();
    }

    // Update MostBookedProduct
    await Promise.all(
      products.map(async ({ product }) => {
        if((await Product.findById(product)).isFree === false){
        const existingRecord = await MostBookedProduct.findOne({
          product,
          isActive: true,
          isDeleted: false,
        });
        existingRecord
          ? existingRecord.count++
          : await MostBookedProduct.create({ product, count: 1 });
        await existingRecord?.save();
      }
      })
    );

    // Clear cart
    await Cart.deleteMany({ customer: customerId });

    const customerToken = await FirebaseToken.find({
      userId: customerId,
      userType: "customer",
    });
    if (customerToken) {
      for (let i = 0; i < customerToken.length; i++) {
        CustomerFCMService.sendBookingConfirmationMessage(
          customerToken[i].token
        );
      }
    }

    const product = await Product.findById(newBooking.product[0].product);

    await waMsgService.sendCusBoookingConfirmationMessage(
      customer.mobile,
      customer.name,
      product.name,
      newBooking.product.length,
      moment(newBooking.scheduleFor.date).format("DD/MM/YYYY"),
      newBooking.scheduleFor.time + " " + newBooking.scheduleFor.format,
      newBooking.customerAddress,
      newBooking.finalPrice
    );
    res
      .status(200)
      .json({ success: true, message: "Cart booked successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error booking cart",
      errorMessage: error.message,
    });
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
