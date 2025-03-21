import { calculatePartnerCommission } from "../../../../helper/calculatePartnerCommission.js";
import Booking from "../model/booking.model.js";
import Customer from "../../customer/model/customer.model.js";
import FirebaseToken from "../../firebase-token/model/firebase-token.model.js";
import * as CustomerFCMService from "../../../../helper/customerFcmService.js";
import Partner from "../../partner/model/partner.model.js";
import PartnerTransaction from "../../partner-transaction/model/partner-transaction.model.js";
import mongoose from "mongoose";

export const fetchBookings = async (req, res) => {
  try {
    // Set default pagination values if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch bookings with populated fields and pagination
    const bookings = await Booking.find({isDeleted: false})
      .populate("product.product")
      .populate("partner.partner")
      .populate("customer")
      .sort({ "scheduleFor.date": 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Count the total number of bookings for pagination calculation
    const totalBookings = await Booking.countDocuments();
    const totalPages = Math.ceil(totalBookings / limit);

    // If no bookings found
    // if (bookings.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "No bookings found",
    //   });
    // }

    // Return successful response with pagination info
    return res.status(200).json({
      success: true,
      message: "Bookings fetched successfully",
      data: bookings,
      totalBookings,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    // Handle potential errors
    return res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      details: error.message,
    });
  }
};

export const downloadExcelSheet = async (req, res) => {
  try {
    // Step 1: Fetch the booking data from MongoDB
    const bookings = await Booking.find({ isDeleted: false })
      .populate("customer", "name email")
      .populate("partner.partner", "name")
      .populate("product.product", "name price") // populate product details
      .populate("transaction");

    // Step 2: Prepare the data for Excel
    const data = bookings.map((booking) => ({
      CustomerName: booking.customer?.name || "N/A",
      CustomerEmail: booking.customer?.email || "N/A",
      PartnerName: booking.partner[0]?.partner?.name || "N/A",
      ProductDetails: booking.product
        .map(
          (p) =>
            `${p.product?.name} (Quantity: ${p.quantity}, Price: ${p.price})`
        )
        .join(", "),
      TotalPrice: booking.totalPrice,
      Discount: booking.discount,
      FinalPrice: booking.finalPrice,
      PaymentStatus: booking.paymentStatus,
      BookingStatus: booking.status,
      ScheduledFor: `${booking.scheduleFor?.date || "N/A"} ${
        booking.scheduleFor?.time || ""
      } ${booking.scheduleFor?.format || ""}`,
      ServiceStatus: booking.serviceStatus,
      CreatedAt: booking.createdAt.toISOString(),
      UpdatedAt: booking.updatedAt.toISOString(),
    }));

    // Step 3: Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

    // Step 4: Generate the Excel file as a buffer (in-memory)
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    // Step 5: Set the appropriate headers for file download
    res.setHeader("Content-Disposition", "attachment; filename=bookings.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Step 6: Send the buffer as the response
    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({ message: "Error generating Excel file", error });
  }
};

export const searchBookings = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const query = req.query.query;

  try {
    // Define the search condition dynamically based on the query
    let searchCondition = {};

    if (query) {
      const queryRegex = { $regex: query, $options: "i" }; // Case-insensitive regex for all fields

        // Search by customer name, email, number, or discountType if it's not a boolean query
        const customerSearchCondition = {
          $or: [
            { name: queryRegex }, // Search by customer name
            // { email: queryRegex }, // Search by customer email
            // { number: queryRegex }, // Search by customer phone number
          ],
        };

        // Find matching customers by name, email, or number
        const matchingCustomers = await Customer.find(
          customerSearchCondition
        ).select("_id");
        const customerIds = matchingCustomers.map((customer) => customer._id);

        // Search condition for customerId, discountType, or other fields
        searchCondition = {
          customer: { $in: customerIds }, // Match by customerId
          isDeleted: false
            // { discountType: queryRegex }, // Match discountType
        };
      }

    // Fetch bookings with pagination and populated customer details
      const bookings = await Booking.find(searchCondition)
      .populate("product.product")
      .populate("partner.partner")
      .populate("customer")
      .sort({ "scheduleFor.date": 1 })
      .skip(skip)
      .limit(limit);

    // Get total count of bookings matching the search condition
    const totalBookings = await Booking.countDocuments(searchCondition);

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found matching the search criteria",
      });
    }

    // Return the search results along with pagination details
    res.status(200).json({
      success: true,
      message: "Bookings retrieved successfully",
      data: bookings,
      totalBookings,
      currentPage: page,
      totalPages: Math.ceil(totalBookings / limit),
    });
  } catch (error) {
    console.error("Error searching bookings:", error);

    res.status(500).json({
      success: false,
      message: "Error occurred while searching bookings",
      error: error.message,
    });
  }
};

export const assignPartnerToBooking = async (req, res) => {
  const { bookingId, partnerId } = req.query;

  try {
    // Validate required fields
    if (!partnerId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: "Partner ID and Booking ID are required",
      });
    }

    // Check if the partner exists
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

    // Find the booking by ID
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

    // Check if a partner is already assigned
    if (booking.partner && booking.partner.length > 0) {
      return res
        .status(400)
        .json({ message: "Partner is already assigned to this booking" });
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
    const customerTokens = await FirebaseToken.find({
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

    return res
      .status(200)
      .json({ message: "Partner assigned successfully", booking });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
