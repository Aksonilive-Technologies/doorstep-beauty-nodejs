const Booking = require("../models/bookingModel");

exports.fetchBookings = async (req, res) => {
  try {
    // Set default pagination values if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch bookings with populated fields and pagination
    const bookings = await Booking.find()
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
