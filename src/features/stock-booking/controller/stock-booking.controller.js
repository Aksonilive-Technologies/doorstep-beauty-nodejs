import StockBooking from "../model/stock-booking.model.js";
import Partner from "../../partner/model/partner.model.js";
import Stock from "../../stock/model/stock.model.js";
import PartnerTransaction from "../../partner-transaction/model/partner-transaction.model.js";

export const createStockBooking = async (req, res) => {
  const { partnerId, stockItemId, deliveryAddress, status, paymentMode } =
    req.body;

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
      quantity: 1,
      status: status || "pending", // Default to "pending" if not provided
      paymentMode, // Optional field
    });

    // Save the stock booking to the database
    const savedBooking = await newStockBooking.save();

    // Now handle payment initiation based on paymentMode
    const finalPrice = stockItem.price * 1; // Assuming stockItem has a price field

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

      stockItem.currentStock -= 1;
      await stockItem.save();

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

export const fetchAllStockBookings = async (req, res) => {
  const { partnerId } = req.query;

  try {
    // Check if partner ID is provided
    if (!partnerId) {
      // console.log("Partner ID is missing");
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
      .populate("product.product") // Assuming 'name' is a field in the Stock model
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
    let groupedBookings = stockBookings.reduce((acc, booking) => {
      const status = booking.status;

      if (!acc[status]) {
        acc[status] = [];
      }

      acc[status].push(booking);
      return acc;
    }, {});

    // other than booked, delivered and cancelled, remove others
    groupedBookings = Object.keys(groupedBookings).reduce((acc, key) => {
      if (["booked", "delivered", "cancelled"].includes(key)) {
        acc[key] = groupedBookings[key];
      }
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

export const cancelBooking = async (req, res) => {
  const { bookingId } = req.body;

  try {
    // Validate the bookingId
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    // Find the booking by bookingId
    const booking = await StockBooking.findOne({
      _id: bookingId,
      status: "booked",
      isActive: true,
      isDeleted: false,
    });

    // Check if the booking exists
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const productIds = booking.product.map((item) => item.product);

    // Find all related stock items in one query
    const stockItems = await Stock.find({ _id: { $in: productIds } });

    // Map the stock items to their corresponding product and update stock in one pass
    const stockUpdates = stockItems.map((stockItem) => {
      const bookedProduct = booking.product.find((item) =>
        item.product.equals(stockItem._id)
      );
      if (bookedProduct) {
        stockItem.currentStock += bookedProduct.quantity;
        return stockItem.save(); // Return a promise to be resolved
      }
    });

    // Update all stock items concurrently
    await Promise.all(stockUpdates);

    booking.status = "cancelled";
    booking.statusUpdatedAt = new Date();

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error cancelling booking",
      errorMessage: error.message,
    });
  }
};
