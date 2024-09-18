const Booking = require("../models/bookingModel");


exports.fetchBookings = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

  try {

    // Fetch bookings with populated fields
    const bookings = await Booking.find()
      .populate("product.product")
      .populate("partner.partner")
      .populate("customer")
      .sort({ "scheduleFor.date": 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const totalBookings = await Booking.countDocuments();

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bookings fetched successfully",
      data: bookings,
      totalBookings,
        currentPage: page,
        totalPages: Math.ceil(totalBookings / limit),
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      errorMessage: error.message,
    });
  }
};
