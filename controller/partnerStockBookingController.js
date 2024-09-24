const Stock = require("../models/stockModel");
const Partner = require("../models/partnerModel");
const StockBooking = require("../models/stockBookingModel");
const PartnerTransaction = require("../models/partnerTransactionModel");

exports.createStockBooking = async (req, res) => {
  const {
    partnerId,
    stockItemId,
    deliveryAddress,
    quantity,
    status,
    paymentMode,
  } = req.body;

  try {
    // Validate that the partner exists and is active
    const partner = await Partner.findOne({
      _id: partnerId,
      isActive: true,
      isDeleted: false,
    });
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found or inactive",
      });
    }

    // Validate that the stock item exists
    const stockItem = await Stock.findOne({ _id: stockItemId });
    if (!stockItem) {
      return res.status(404).json({
        success: false,
        message: "Stock item not found",
      });
    }

    // Use the partner's address as the delivery address if not provided
    const finalDeliveryAddress = deliveryAddress || partner.address || "NA"; // Fallback to "NA" if neither is available

    // Create a new stock booking
    const newStockBooking = new StockBooking({
      partner: partnerId,
      stockItem: stockItemId,
      deliveryAddress: finalDeliveryAddress, // Either the new address or the partner's address
      quantity: quantity || 1, // Default to 1 if not provided
      status: status || "pending", // Default to "pending" if not provided
      paymentMode, // Optional field
    });

    // Save the stock booking to the database
    const savedBooking = await newStockBooking.save();

    // Now handle payment initiation based on paymentMode
    const finalPrice = stockItem.price * (quantity || 1); // Assuming stockItem has a price field

    const transactionData = {
      partnerId: partnerId,
      amount: finalPrice,
      paymentGateway: paymentMode,
      transactionType: "stock_item_booking",
    };

    if (paymentMode === "wallet") {
      // Deduct from wallet and create a debit transaction
      if (partner.walletBalance < finalPrice) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficient wallet balance" });
      }

      partner.walletBalance -= finalPrice; // Make sure this value is valid
      await partner.save();

      transactionData.status = "completed"; // Wallet payments complete immediately

      // Create a completed transaction for wallet payments
      const transaction = new PartnerTransaction(transactionData);
      await transaction.save();

      // Update stock booking with payment status
      savedBooking.paymentStatus = "completed";
      savedBooking.transaction = transaction._id;
      await savedBooking.save();

      // Notify via FCM (if needed)
      const partnerToken = await FirebaseTokens.find({
        userId: partnerId,
        userType: "partner",
      });
      if (partnerToken) {
        for (let i = 0; i < partnerToken.length; i++) {
          PartnerFCMService.sendStockBookingConfirmationMessage(
            partnerToken[i].token
          );
        }
      }

      return res.status(200).json({
        success: true,
        message:
          "Payment processed successfully via wallet and stock booking updated",
        data: savedBooking,
      });
    } else if (["cashfree", "razorpay", "cash"].includes(paymentMode)) {
      // Create a pending transaction for gateway payments or cash
      transactionData.status = "pending";

      const transaction = new PartnerTransaction(transactionData);
      await transaction.save();

      // Update stock booking with transaction reference
      savedBooking.transaction = transaction._id;
      await savedBooking.save();

      return res.status(200).json({
        success: true,
        message: "Transaction initiated successfully via " + paymentMode,
        data: savedBooking,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid payment gateway",
      });
    }
  } catch (error) {
    console.error("Error creating stock booking:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error creating stock booking",
      errorMessage: error.message,
    });
  }
};

exports.fetchAllStockBookings = async (req, res) => {
  const { partnerId } = req.query;

  try {
    // Check if partner ID is provided
    if (!partnerId) {
      console.log("Partner ID is missing");
      return res.status(400).json({
        success: false,
        message: "Partner ID is required",
      });
    }

    // Validate partner: Ensure the partner exists and is active
    const partner = await Partner.findOne({
      _id: partnerId,
      isDeleted: false,
      isActive: true,
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    // Fetch stock bookings for the given partner
    const stockBookings = await StockBooking.find({
      partner: partnerId,
      isDeleted: false,
      isActive: true,
    })
      .populate("stockItem", "name") // Assuming 'name' is a field in the Stock model
      .populate("partner", "name") // Populate partner details (assuming 'name' is relevant)
      .sort({ createdAt: -1 }) // Sort by the creation date, latest first
      .lean(); // Convert to plain JavaScript object

    // If no stock bookings found, return a 404 response
    if (stockBookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No stock bookings found",
      });
    }

    // Group bookings by their status (pending, processing, etc.)
    const groupedBookings = stockBookings.reduce((acc, booking) => {
      const status = booking.status;

      if (!acc[status]) {
        acc[status] = [];
      }

      acc[status].push(booking);
      return acc;
    }, {});

    // Return the grouped stock bookings
    return res.status(200).json({
      success: true,
      message: "Stock bookings fetched successfully",
      data: groupedBookings,
    });
  } catch (error) {
    console.error("Error fetching stock bookings:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching stock bookings",
      errorMessage: error.message,
    });
  }
};
