import CustomerAddress from "../../customer-address/model/customer-address.model.js";
import Booking from "../model/booking.model.js";
import Transaction from "../../transaction/model/transaction.model.js";
import moment from "moment";
import Product from "../../product/model/product.model.js";
import MostBookedProduct from "../../most-booked-product/model/most-booked-product.model.js";
import Customer from "../../customer/model/customer.model.js";
import * as CustomerFCMService from "../../../../helper/customerFcmService.js";
import * as PartnerFCMService from "../../../../helper/partnerFcmService.js";
import FirebaseTokens from "../../firebase-token/model/firebase-token.model.js";
import { calculateCancellationCharge } from "../../../../helper/refundCalculator.js";
import { addCancellationChargesRecord } from "../../../../helper/addCancellationChargesRecord.js";
import { processPartnerRefund } from "../../../../helper/processPartnerRefund.js";
import { processCustomerRefund } from "../../../../helper/processCustomerRefund.js";
import XLSX from "xlsx";
import waMsgService from "../../../../utility/waMsgService.js";
import { createOrder } from "../../../../helper/razorpayHelper.js";

export const bookProduct = async (req, res) => {
  const {
    customerId,
    products,
    totalPrice,
    discountType,
    discountValue,
    offerType,
    offerRefId,
    customerAddressId,
    scheduleFor,
  } = req.body;

  try {
    // Array to collect missing fields
    const missingFields = [];

    // Check for required fields
    if (!customerId) missingFields.push("customerId");
    if (!products || products.length === 0) missingFields.push("products");
    if (!totalPrice) missingFields.push("totalPrice");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Missing fields: " + missingFields.join(", "),
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

    // Calculate discount
    let discount = 0;
    if (discountType === "percentage") {
      discount = totalPrice * (discountValue / 100);
    } else if (discountType === "flat_amount" || discountType === "product") {
      discount = discountValue;
    }

    const finalPrice = totalPrice - discount;

    // Create Booking
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

    // Update MostBookedProduct Schema
    for (const product of products) {
      const existingRecord = await MostBookedProduct.findOne({
        product: product.product,
        isActive: true,
        isDeleted: false,
      });

      if (existingRecord) {
        existingRecord.count += 1;
        await existingRecord.save();
      } else {
        await MostBookedProduct.create({
          product: product.product,
          count: 1,
        });
      }
    }

    // Send FCM to partner
    const partnerToken = await FirebaseTokens.find({ userType: "partner" });
    if (partnerToken) {
      for (let i = 0; i < partnerToken.length; i++) {
        PartnerFCMService.sendNewBookingMessage(partnerToken[i].token);
      }
    }

    res.status(201).json({
      success: true,
      message: "Product booked successfully and transaction has initiated",
      data: newBooking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error booking product",
      errorMessage: error.message,
    });
  }
};

export const fetchBookings = async (req, res) => {
  const { customerId } = req.query;

  try {
    // Validate the customerId
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    // Fetch bookings with populated fields
    const bookings = await Booking.find({
      customer: customerId,
      isDeleted: false,
      childBooking: { $exists: false },
    })
      .populate("product.product")
      .populate("partner.partner")
      .lean();

    // Populate productTool only if serviceStatus is 'ongoing' or 'completed' and productTool is not null
    for (let booking of bookings) {
      if (
        (booking.serviceStatus === "ongoing" ||
          booking.serviceStatus === "completed") &&
        booking.productTool &&
        booking.productTool.length > 0
      ) {
        await Booking.populate(booking, {
          path: "productTool.productTool",
          model: "Stock",
        });
      }
    }

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found",
      });
    }

    bookings.forEach((booking) => {
      // console.log("booking", booking.product);
      booking.product.forEach((productItem) => {
        // Check if there is an option selected for this product
        // console.log("productItem", productItem);
        if (productItem.option && productItem.product.options) {
          let selectedOption = productItem.product.options.find((opt) =>
            opt._id.equals(productItem.option)
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
      });
      // console.log("booking", booking.product);
    });

    // Current date for comparison
    const now = moment();

    // Categorize bookings
    const categorized = {
      Ongoing: [],
      Upcoming: [],
      Previous: [],
    };

    bookings.forEach((booking) => {
      if (booking.serviceStatus === "ongoing") {
        // Ongoing bookings
        categorized.Ongoing.push(booking);
      } else if (booking.scheduleFor && booking.scheduleFor.date) {
        const scheduleDate = moment(booking.scheduleFor.date);
        if (scheduleDate.isAfter(now)) {
          // Upcoming bookings
          categorized.Upcoming.push(booking);
        } else {
          // Previous bookings
          categorized.Previous.push(booking);
        }
      } else {
        // If no scheduleFor date but completed or other statuses, consider them as Previous
        categorized.Previous.push(booking);
      }
    });

    // Sort categories
    categorized.Upcoming.sort((a, b) =>
      moment(a.scheduleFor.date).diff(moment(b.scheduleFor.date))
    );
    categorized.Previous.sort((a, b) =>
      moment(b.scheduleFor.date).diff(moment(a.scheduleFor.date))
    );

    res.status(200).json({
      success: true,
      message: "Bookings fetched and categorized successfully",
      data: categorized,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      errorMessage: error.message,
    });
  }
};

export const cancelBooking = async (req, res) => {
  const { bookingId } = req.body;

  try {
    // Validate the bookingId
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Find the booking by bookingId
    const booking = await Booking.findOne({
      _id: bookingId,
      serviceStatus: { $in: ["pending", "scheduled"] },
      isDeleted: false,
    });

    // Check if the booking exists
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }
    if (booking.serviceStatus === "scheduled") {
      //step1: calculate cancellation charges
      const cancellationCharges = calculateCancellationCharge(
        booking,
        "customer"
      );
      let customerCancellationFeeStatus = "";

      //step2: refund back to customer using the same payment mode and also to partner
      //step3: create a transaction record for refund in both customer and partner

      // Fetch the associated transaction
      const transaction = await Transaction.findById(booking.transaction);

      if (!transaction) {
        throw new Error("Transaction not found");
      }
      // If the payment method is "wallet_booking"
      if (transaction.paymentGateway === "wallet") {
        // processWalletRefund(booking, cancellationCharges, 0);
        processCustomerRefund(booking, cancellationCharges, 0, "wallet");
        processPartnerRefund(booking, cancellationCharges, 0);
        customerCancellationFeeStatus = "paid";
      } else if (transaction.paymentGateway === "cash") {
        processCustomerRefund(booking, cancellationCharges, 0, "cash");
        processPartnerRefund(booking, cancellationCharges, 0);
        customerCancellationFeeStatus = "pending";
      } else {
        processCustomerRefund(
          booking,
          cancellationCharges,
          0,
          transaction.paymentGateway
        );
        processPartnerRefund(booking, cancellationCharges, 0);
        customerCancellationFeeStatus = "paid";
      }

      //step4: add cancellation charges to partner and customer transaction
      if (cancellationCharges > 0) {
        addCancellationChargesRecord(
          booking,
          "customer",
          cancellationCharges,
          customerCancellationFeeStatus
        );
      }
    }

    //step5: update booking status to cancelled
    booking.serviceStatus = "cancelled";
    booking.status = "cancelled";
    booking.cancelledBy = "customer";

    await booking.save();

    const customerTokens = await FirebaseTokens.find({
      userId: booking.customer,
      userType: "customer",
    });
    if (booking.partner.length > 0) {
      const partnerTokens = await FirebaseTokens.find({
        userId: booking.partner[0].partner,
        userType: "partner",
      });
      if (partnerTokens) {
        for (let i = 0; i < partnerTokens.length; i++) {
          PartnerFCMService.sendBookingCancellationMessage(
            partnerTokens[i].token
          );
        }
      }
    }
    if (customerTokens) {
      for (let i = 0; i < customerTokens.length; i++) {
        const sendMessages = [
          CustomerFCMService.sendBookingCancellationMessage(
            customerTokens[i].token
          ),
        ];

        // Check if the cancellation fee status is paid and add refund message if so
        if (customerCancellationFeeStatus === "paid") {
          sendMessages.push(
            CustomerFCMService.sendBookingRefundMessage(customerTokens[i].token)
          );
        }

        await Promise.all(sendMessages);
      }
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling booking",
      errorMessage: error.message,
    });
  }
};

export const fetchRecentBookedProducts = async (req, res) => {
  const { customerId } = req.query;

  try {
    // Validate the customerId
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    // Fetch bookings for the customer and populate products
    const bookings = await Booking.find({
      customer: customerId,
      isDeleted: false,
    })
      .populate("product.product")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(); // Sort by most recent bookings

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found",
      });
    }

    // bookings.forEach(booking => {
    //   booking.product.forEach(productItem => {
    //     // Check if there is an option selected for this product
    //     if (productItem.option && productItem.product.options) {
    //       const selectedOption = productItem.product.options.find(opt => opt._id.equals(productItem.option));

    //       if (selectedOption) {
    //         // Store the original product name in a temporary variable
    //         const originalProductName = productItem.product.name;

    //         // Update product image with option's image
    //         productItem.product.image = selectedOption.image;

    //         // Update product name by concatenating the option name with the original product name
    //         productItem.product.name = `${selectedOption.option} ${originalProductName}`;

    //         // Update product price with option price
    //         productItem.product.price = selectedOption.price;

    //         // Update product details with option's details
    //         productItem.product.details = selectedOption.details;
    //       }
    //     }

    //     // Remove the options field from the product to clean up the response
    //     delete productItem.product.options;
    //     delete productItem.option;
    //   });
    // });

    // Extract recent booked products from the bookings
    const recentProducts = bookings.flatMap((booking) =>
      booking.product.map((p) => p.product)
    );

    // Limit the result to the last 10 products
    const limitedProducts = recentProducts.slice(0, 10);

    res.status(200).json({
      success: true,
      message: "Recent booked products fetched successfully",
      data: limitedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching recent booked products",
      errorMessage: error.message,
    });
  }
};

export const ratePartner = async (req, res) => {
  const { partnerId, bookingId, rating } = req.body;

  try {
    // Validate inputs
    if (!partnerId || !bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Partner ID, Order ID, and Rating are required",
      });
    }

    // Find the booking by bookingId
    const booking = await Booking.findOne({ _id: bookingId, isDeleted: false });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Find the partner within the booking
    const partnerIndex = booking.partner.findIndex(
      (p) => p.partner.toString() === partnerId
    );

    if (partnerIndex !== -1) {
      // Partner found, update the rating
      const existingRating = booking.partner[partnerIndex].rating;
      booking.partner[partnerIndex].rating = (existingRating + rating) / 2;
    } else {
      // Partner not found, push the new partner with the rating
      booking.partner.push({
        partner: partnerId,
        rating: rating,
      });
    }

    // Save the booking
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Partner rated successfully",
      data: booking.partner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error rating partner",
      errorMessage: error.message,
    });
  }
};

export const rateBooking = async (req, res) => {
  try {
    const { bookingId, rating } = req.body;

    // Step 1: Find the booking by ID
    const booking = await Booking.findOne({ _id: bookingId, isDeleted: false });
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Step 2: Update the rating for the booking
    if (booking.rating === 0) {
      booking.rating = rating;
    } else {
      booking.rating = (booking.rating + rating) / 2;
    }

    // Save the updated booking
    await booking.save();

    // Step 3: Update the ratings for each product in the booking
    for (const item of booking.product) {
      const productId = item.product;

      const product = await Product.findById(productId);
      if (product) {
        if (product.rating === 0) {
          product.rating = rating;
        } else {
          product.rating = (product.rating + rating) / 2;
        }
        await product.save();
      }
    }

    // Respond with success
    res.status(200).json({
      success: true,
      message: "Booking and product ratings updated successfully",
      data: { rating: booking.rating },
    });
  } catch (error) {
    console.error("Error updating booking and product ratings:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      errorMessage: error.message,
    });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const { bookingId, transactionStatus, paymentGatewayId } = req.body;

    const booking = await Booking.findOne({
      _id: bookingId,
      status: "processing",
      serviceStatus: "pending",
      isDeleted: false,
    });
    if (!booking) {
      return res.status(404).json({
        Success: false,
        message: "Booking not found for the transaction",
      });
    }

    // Step 1: Find and update the transaction
    const transaction = await Transaction.findOne({
      _id: booking.transaction,
      isDeleted: false,
    });
    if (!transaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
    }
    if (
      transaction.status.toLowerCase() === "completed" ||
      transaction.status.toLowerCase() === "failed"
    ) {
      return res.status(400).json({
        success: false,
        message: "Transaction already marked as " + transaction.status,
      });
    }

    // Update transaction status
    transaction.status = transactionStatus;
    if (transactionStatus === "completed") {
      transaction.transactionRefId = paymentGatewayId;
    }

    await transaction.save();

    // Step 2: Find and update the booking

    // Update booking fields based on the transaction status
    if (transactionStatus === "completed") {
      booking.paymentStatus = "completed";
      booking.serviceStatus = "scheduled";

      const customer = await Customer.findById(booking.customer);

      const customerToken = await FirebaseTokens.find({
        userId: booking.customer,
        userType: "customer",
      });
      const partnerToken = await FirebaseTokens.find({
        userId: booking.partner[0].partner,
        userType: "partner",
      });
      if (customerToken) {
        for (let i = 0; i < customerToken.length; i++) {
          CustomerFCMService.sendBookingConfirmationMessage(
            customerToken[i].token
          );
        }
      }
      if (partnerToken) {
        for (let i = 0; i < partnerToken.length; i++) {
          PartnerFCMService.sendBookingConfirmationMessage(
            partnerToken[i].token
          );
        }
      }
      const product = await Product.findById(booking.product[0].product);

      await waMsgService.sendCusBoookingConfirmationMessage(
        customer.mobile,
        customer.name,
        product.name,
        booking.product.length,
        moment(booking.scheduleFor.date).format("DD/MM/YYYY"),
        booking.scheduleFor.time + " " + booking.scheduleFor.format,
        booking.customerAddress,
        booking.finalPrice
      );
    } else if (transactionStatus === "failed") {
      booking.paymentStatus = "failed";
      booking.status = "failed";
      booking.serviceStatus = "cancelled";
    }

    await booking.save();

    // Respond with success
    res.status(200).json({
      Success: true,
      message: "Transaction and booking updated successfully",
    });
  } catch (error) {
    console.error("Error updating transaction and booking:", error);
    res.status(500).json({
      Success: false,
      message: "Server error",
      errorMessage: error.message,
    });
  }
};

export const initiatePayment = async (req, res) => {
  const { bookingId, paymentMode } = req.body;
  try {
    // Find the booking based on bookingId
    const booking = await Booking.findOne({ _id: bookingId, isDeleted: false });
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Get the final price from the booking
    const finalPrice = booking.finalPrice;

    // Initialize transaction object
    const transactionData = {
      customerId: booking.customer,
      amount: finalPrice,
      paymentGateway: paymentMode,
    };

    if (paymentMode === "wallet") {
      // Deduct from wallet and create a debit transaction
      const customer = await Customer.findOne({
        _id: booking.customer,
        isDeleted: false,
      });
      if (!customer) {
        return res
          .status(404)
          .json({ success: false, message: "Customer not found" });
      }

      if (customer.walletBalance < finalPrice) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficient wallet balance" });
      }

      customer.walletBalance -= finalPrice;
      await customer.save();

      transactionData.transactionType = "wallet_booking";
      transactionData.status = "completed";

      const transaction = new Transaction(transactionData);
      await transaction.save();

      booking.paymentStatus = "completed";
      booking.serviceStatus = "scheduled";
      booking.transaction = transaction._id;
      await booking.save();

      const customerToken = await FirebaseTokens.find({
        userId: booking.customer,
        userType: "customer",
      });
      const partnerToken = await FirebaseTokens.find({
        userId: booking.partner[0].partner,
        userType: "partner",
      });
      if (customerToken) {
        for (let i = 0; i < customerToken.length; i++) {
          CustomerFCMService.sendBookingConfirmationMessage(
            customerToken[i].token
          );
        }
      }
      if (partnerToken) {
        for (let i = 0; i < partnerToken.length; i++) {
          PartnerFCMService.sendBookingConfirmationMessage(
            partnerToken[i].token
          );
        }
      }
      const product = await Product.findById(booking.product[0].product);

      await waMsgService.sendCusBoookingConfirmationMessage(
        customer.mobile,
        customer.name,
        product.name,
        booking.product.length,
        moment(booking.scheduleFor.date).format("DD/MM/YYYY"),
        booking.scheduleFor.time + " " + booking.scheduleFor.format,
        booking.customerAddress,
        booking.finalPrice
      );

      return res.status(200).json({
        success: true,
        message:
          "Payment processed successfully via wallet and booking updated",
        // data: {Booking: booking, OrderId: orderId}
      });
    } else if (["cashfree", "razorpay", "cash"].includes(paymentMode)) {
      // Create a pending transaction for gateway payments
      transactionData.transactionType = "gateway_booking";
      transactionData.status = "pending";

      const orderId = await createOrder(Number(finalPrice) * 100);

      const transaction = new Transaction(transactionData);
      await transaction.save();

      booking.transaction = transaction._id;
      await booking.save();

      return res.status(200).json({
        success: true,
        message: "Transaction initiated successfully via " + paymentMode,
        data: { OrderId: orderId },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid payment gateway",
      });
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      errorMessage: error.message,
    });
  }
};

export const getMostBookedProducts = async (req, res) => {
  try {
    const mostBookedProducts = await MostBookedProduct.find({
      isActive: true,
      isDeleted: false,
    })
      .sort({ count: -1 }) // Sort by count in descending order
      .limit(10) // Limit the response to 10 products
      .populate("product");

    if (!mostBookedProducts) {
      return res.status(404).json({
        success: false,
        message: "No most booked products found",
      });
    }

    if (!mostBookedProducts || mostBookedProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No most booked products found",
      });
    }

    const products = mostBookedProducts.map((item) => item.product);

    res.status(200).json({
      success: true,
      message: "Most booked products fetched successfully",
      data: products,
    });
  } catch (error) {
    console.error("Error fetching most booked products:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching most booked products",
      errorMessage: error.message,
    });
  }
};
