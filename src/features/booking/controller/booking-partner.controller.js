import Booking from "../model/booking.model.js";
import Partner from "../../partner/model/partner.model.js";
import ServicablePincode from "../../servicable-pincode/model/servicable-pincode.model.js";
import Transaction from "../../transaction/model/transaction.model.js";
import PartnerTransaction from "../../partner-transaction/model/partner-transaction.model.js";
import mongoose from "mongoose";
import * as CustomerFCMService from "../../../../helper/customerFcmService.js";
import * as PartnerFCMService from "../../../../helper/partnerFcmService.js";
import FirebaseTokens from "../../firebase-token/model/firebase-token.model.js";
import { calculatePartnerCommission } from "../../../../helper/calculatePartnerCommission.js";
import { calculateCancellationCharge } from "../../../../helper/refundCalculator.js";
import { addCancellationChargesRecord } from "../../../../helper/addCancellationChargesRecord.js";
import { processPartnerRefund } from "../../../../helper/processPartnerRefund.js";
import { processCustomerRefund } from "../../../../helper/processCustomerRefund.js";
import { calculateTimeDifference } from "../../../../helper/calculateTimeDifference.js";

export const fetchUnconfirmedBookings = async (req, res) => {
  const { id } = req.body;

  try {
    if (!id) {
      // console.log("Partner ID is missing");
      return res.status(400).json({
        success: false,
        message: "Partner ID is required",
      });
    }

    // Fetch the current partner details
    // console.log("Fetching partner with ID:", id);
    const partner = await Partner.findOne({
      _id: id,
      isDeleted: false,
      isActive: true,
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }
    const servicablePincode = await ServicablePincode.find({
      partner: id,
      isDeleted: false,
      isActive: true,
    })
      .select("pincode -_id")
      .lean();

    // console.log("Serviceable pincodes:", servicablePincode);

    // Set the 15-minute threshold
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Booking query with conditional logic based on partner's rating
    const bookingQuery = {
      serviceStatus: "pending",
      // status: "pending",
      isDeleted: false,
      isActive: true,
    };

    // If partner's rating is less than 4, add the condition to the query
    if (partner.rating < 4) {
      bookingQuery.createdAt = { $lt: fifteenMinutesAgo };
    }

    // Fetch bookings with the modified query
    const bookings = await Booking.find(bookingQuery)
      .populate("product.product")
      .populate("customer")
      .sort({ "scheduleFor.date": 1 })
      .lean();

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No unconfirmed bookings found",
      });
    }

    bookings.forEach((booking) => {
      booking.product.forEach((productItem) => {
        // Check if there is an option selected for this product
        if (productItem.option && productItem.product.options) {
          const selectedOption = productItem.product.options.find((opt) =>
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
          // Remove the options field from the product to clean up the response
          // delete productItem.product.options;
          // delete productItem.option;
        }
      });
    });

    const pincodeArray = new Set(
      servicablePincode.map((pincodeObj) => pincodeObj.pincode.toString())
    );
    // console.log(pincodeArray);

    const filteredBookings = bookings.filter((booking) => {
      // Extract the pincode using a regular expression (assuming the pincode is a 6-digit number)
      const match = booking.customerAddress.match(/\b\d{6}\b/);
      const customerPincode = match ? match[0] : null;

      // Check if the customer's pincode exists in the serviceable pincodes array (using Set for O(1) lookup)
      return customerPincode && pincodeArray.has(customerPincode);
    });

    const groupedBookings = filteredBookings.reduce((groups, booking) => {
      const status = booking.status;
      if (!Array.isArray(groups[status])) {
        groups[status] = []; // Initialize as an empty array if not already initialized
      }
      groups[status].push(booking);
      return groups;
    }, {});

    if (filteredBookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No unconfirmed bookings found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Unconfirmed bookings fetched successfully",
      data: groupedBookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching unconfirmed bookings",
      errorMessage: error.message,
    });
  }
};

export const fetchAllBookings = async (req, res) => {
  const { id } = req.body;

  try {
    if (!id) {
      // console.log("Partner ID is missing");
      return res.status(400).json({
        success: false,
        message: "Partner ID is required",
      });
    }

    const partner = await Partner.findOne({
      _id: id,
      isDeleted: false,
      isActive: true,
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    const bookings = await Booking.find({
      // serviceStatus: {$ne:"pending"},
      partner: {
        // Use $elemMatch to find the partner by ID
        $elemMatch: {
          partner: id,
        },
      },
      isDeleted: false,
      isActive: true,
    })
      .populate("product.product")
      .populate("customer")
      .sort({ "scheduleFor.date": 1 })
      .lean();

    // console.log("Bookings:", bookings);

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
      booking.product.forEach((productItem) => {
        // Check if there is an option selected for this product
        if (productItem.option && productItem.product.options) {
          const selectedOption = productItem.product.options.find((opt) =>
            opt._id.equals(productItem.option)
          );

          if (selectedOption) {
            // Store the original product name in a temporary variable
            const originalProductName = productItem.product.name;

            // Update product image with option's image
            productItem.product.image = selectedOption.image;

            // Update product name by concatenating the option name with the original product name
            productItem.product.name = `${selectedOption.option} ${originalProductName}`;

            // Update product price with option price
            productItem.product.price = selectedOption.price;

            // Update product details with option's details
            productItem.product.details = selectedOption.details;
          }
          delete productItem.product.options;
          delete productItem.option;
        }

        // Remove the options field from the product to clean up the response
      });
    });

    const groupedBookings = bookings.reduce((acc, booking) => {
      // Get the current service status
      let status = booking.serviceStatus;
      // if (booking.status === "processing") {
      //   status = "processing";
      // }

      // If the group doesn't exist yet, initialize it as an array
      if (!acc[status]) {
        acc[status] = [];
      }

      // Add the booking to the corresponding group
      acc[status].push(booking);

      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: "Bookings fetched successfully",
      data: groupedBookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      errorMessage: error.message,
    });
  }
};

export const acceptBooking = async (req, res) => {
  const { partnerId, bookingId } = req.body;

  try {
    // Validate required fields
    if (!partnerId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: "Partner ID and Booking ID are required",
      });
    }

    // Fetch partner and check status
    let partner = await Partner.findOne({
      _id: partnerId,
      isDeleted: false,
      isActive: true,
    });
    if (!partner) {
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });
    }

    // Fetch booking and check status
    const booking = await Booking.findOne({
      _id: bookingId,
      serviceStatus: "pending",
      isDeleted: false,
      isActive: true,
    });
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Get the commission percentage based on the booking price
    const commission = calculatePartnerCommission(booking.finalPrice);
    const minimumWalletBalance = 500 + booking.finalPrice * (commission / 100);

    // Check if partner's wallet balance is sufficient
    if (partner.walletBalance < minimumWalletBalance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    // Check if partner is already assigned to the booking
    const partnerExists = booking.partner.some(
      (p) => p.partner.toString() === partnerId
    );
    if (partnerExists) {
      return res.status(400).json({
        success: false,
        message: "Partner already exists in the booking",
      });
    }

    // Assign partner to booking and deduct wallet balance
    const newPartner = {
      partner: new mongoose.Types.ObjectId(partnerId),
      rating: 0,
    };
    booking.partner.push(newPartner);
    partner.walletBalance -= booking.finalPrice * (commission / 100);
    partner.save();

    // Create a transaction log for the wallet deduction
    const transaction = new PartnerTransaction({
      partnerId: partnerId,
      transactionType: "booking_confirmation",
      amount: booking.finalPrice * (commission / 100),
      paymentGateway: "wallet",
      status: "completed",
    });
    await transaction.save();

    // Update booking status to processing
    booking.status = "processing";
    if (booking.paymentStatus === "completed") {
      booking.serviceStatus = "scheduled";
    }
    await booking.save();

    // Notify customer via FCM
    const customerTokens = await FirebaseTokens.find({
      userId: booking.customer,
      userType: "customer",
    });
    if (customerTokens) {
      customerTokens.forEach((token) => {
        CustomerFCMService.sendPartnerAllocationConfirmationMessage(
          token.token
        );
      });
    }

    // Respond with success
    res
      .status(200)
      .json({ success: true, message: "Booking accepted successfully" });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      success: false,
      message: "Error accepting booking",
      errorMessage: error.message,
    });
  }
};

export const startBooking = async (req, res) => {
  const { partnerId, bookingId, stockItems } = req.body;

  try {
    if (!bookingId || !partnerId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and Partner ID is required",
      });
    }

    // Check if stockItems is an array and has at least one item
    if (!Array.isArray(stockItems) || stockItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "stock Items are required and should be an array",
      });
    }
    const booking = await Booking.findOne({
      _id: bookingId,
      serviceStatus: "scheduled",
      isDeleted: false,
      isActive: true,
    });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Push product tools into booking and perform bulk updates
    booking.productTool.push(
      ...stockItems.map((item) => ({
        productTool: new mongoose.Types.ObjectId(item),
      }))
    );
    booking.serviceStatus = "ongoing";
    booking.serviceStartedAt = new Date();

    await booking.save();
    res.status(200).json({
      success: true,
      message: "Booking started successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error starting booking",
      errorMessage: error.message,
    });
  }
};

export const completeBooking = async (req, res) => {
  const { bookingId } = req.body;

  try {
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }
    const booking = await Booking.findOne({
      _id: bookingId,
      serviceStatus: "ongoing",
      isDeleted: false,
      isActive: true,
    });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }
    booking.status = "completed";
    booking.serviceStatus = "completed";
    booking.serviceEndedAt = new Date();
    await booking.save();
    res.status(200).json({
      success: true,
      message: "Booking completed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error completing booking",
      errorMessage: error.message,
    });
  }
};

export const cancelBooking = async (req, res) => {
  const { bookingId } = req.body;

  try {
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }
    const booking = await Booking.findOne({
      _id: bookingId,
      serviceStatus: { $in: ["pending", "scheduled"] },
      isDeleted: false,
      isActive: true,
    });
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
        "partner"
      );

      //step2: refund back to customer using the same payment mode and also to partner
      //step3: create a transaction record for refund in both customer and partner

      // Fetch the associated transaction
      const transaction = await Transaction.findById(booking.transaction);

      if (!transaction) {
        throw new Error("Transaction not found");
      }
      const timeDifferenceInHours = calculateTimeDifference(booking);
      // If the payment method is "wallet_booking"
      if (transaction.paymentGateway === "wallet") {
        // processWalletRefund(booking, cancellationCharges, 0);
        if (timeDifferenceInHours < 3)
          processCustomerRefund(booking, 0, cancellationCharges, "wallet");
        processPartnerRefund(booking, 0, cancellationCharges);
      } else if (transaction.paymentGateway === "cash") {
        if (timeDifferenceInHours < 3)
          processCustomerRefund(booking, 0, cancellationCharges, "cash");
        processPartnerRefund(booking, 0, cancellationCharges);
      } else {
        if (timeDifferenceInHours < 3)
          processCustomerRefund(
            booking,
            0,
            cancellationCharges,
            transaction.paymentGateway
          );
        processPartnerRefund(booking, 0, cancellationCharges);
      }

      //step4: add cancellation charges to partner and customer transaction
      if (cancellationCharges > 0) {
        addCancellationChargesRecord(
          booking,
          "partner",
          cancellationCharges,
          "paid"
        );
      }

      booking.status = "cancelled";
      booking.serviceStatus = "cancelled";
      booking.cancelledBy = "partner";

      if (timeDifferenceInHours > 3) {
        const newChildBooking = new Booking({
          customer: booking.customer,
          product: booking.product,
          totalPrice: booking.totalPrice,
          discount: booking.discount,
          finalPrice: booking.finalPrice,
          discountType: booking.discountType,
          discountValue: booking.discountValue,
          offerType: booking.offerType,
          offerRefId: booking.offerRefId,
          transaction: booking.transaction,
          status: "pending", // Initial status for the new booking
          serviceStatus: "pending", // Initial service status for the new booking
          customerAddress: booking.customerAddress,
          paymentStatus: booking.paymentStatus, // Reset payment status
          scheduleFor: booking.scheduleFor, // You may reset or update this
        });

        const savedChildBooking = await newChildBooking.save();

        // Step 6: Update the parent booking with the new child booking's ID
        booking.childBooking = savedChildBooking._id;
      }
    }

    await booking.save();

    const customerTokens = await FirebaseTokens.find({
      userId: booking.customer,
      userType: "customer",
    });
    const partnerTokens = await FirebaseTokens.find({
      userId: booking.partner[0].partner,
      userType: "partner",
    });

    if (customerTokens) {
      // Handle customer tokens
      for (let i = 0; i < customerTokens.length; i++) {
        const sendMessages = [
          CustomerFCMService.sendBookingCancellationMessage(
            customerTokens[i].token
          ),
        ];

        // Check if the cancellation fee status is paid and add refund message if so
        // if (cancellationFeeStatus === "paid") {
        sendMessages.push(
          CustomerFCMService.sendBookingRefundMessage(customerTokens[i].token)
        );
        // }
        await Promise.all(sendMessages);
      }
    }
    if (partnerTokens) {
      for (let i = 0; i < partnerTokens.length; i++) {
        PartnerFCMService.sendBookingCancellationMessage(
          partnerTokens[i].token
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling booking",
      errorMessage: error.message,
    });
  }
};

//need to do changes
export const getTopPartnerByServiceCount = async (req, res) => {
  try {
    // Aggregation to find the partner with the highest number of completed services provided
    const topPartner = await Booking.aggregate([
      // Only include active bookings with completed status in the aggregation
      {
        $match: {
          isDeleted: false,
          status: "completed", // Ensure the booking status is completed
          "partner.partner": { $exists: true }, // Ensure bookings have partners
        },
      },
      // Unwind the partner array to count each service provided by a partner
      {
        $unwind: "$partner",
      },
      // Group by partner to count total completed services provided by each
      {
        $group: {
          _id: "$partner.partner", // Group by partner ID
          serviceCount: { $sum: 1 }, // Count each completed booking for the partner
        },
      },
      // Sort by service count in descending order and limit to the highest
      {
        $sort: { serviceCount: -1 },
      },
      {
        $limit: 1,
      },
      // Lookup to fetch complete partner details
      {
        $lookup: {
          from: "partners",
          localField: "_id",
          foreignField: "_id",
          as: "partnerDetails",
        },
      },
      {
        $unwind: "$partnerDetails", // Unwind the partner details to get a single object
      },
      // Project the necessary fields for the response
      {
        $project: {
          _id: 0,
          partnerId: "$_id",
          name: "$partnerDetails.name",
          email: "$partnerDetails.email",
          image: "$partnerDetails.image",
          phone: "$partnerDetails.phone",
          contactNumber: "$partnerDetails.contactNumber",
          serviceCount: 1,
        },
      },
    ]);

    // Check if topPartner is found and send response accordingly
    if (!topPartner.length) {
      return res.status(404).json({
        success: false,
        message: "No completed services found for any partner",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Partner with the highest number of completed services retrieved successfully",
      data: topPartner[0], // Since we limited to 1 result
    });
  } catch (error) {
    console.error(
      "Error fetching partner with the highest number of completed services:",
      error
    );
    res.status(500).json({
      success: false,
      message:
        "Error fetching partner with the highest number of completed services",
      errorMessage: error.message,
    });
  }
};
