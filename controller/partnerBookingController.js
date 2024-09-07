const Booking = require("../models/bookingModel");
const Partner = require("../models/partnerModel.js");
const ServicablePincode = require("../models/servicablePincodeModel.js");


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

exports.fetchUnconfirmedBookings = async (req, res) => {
  const { id } = req.body;

try {

  if (!id) {
    console.log("Partner ID is missing");
    return res.status(400).json({
      success: false,
      message: "Partner ID is required",
    });
  }

  // Fetch the current partner details
  console.log("Fetching partner with ID:", id);
  const partner = await Partner.findOne({_id:id, isDeleted: false, isActive: true});

  if (!partner) {
    return res.status(404).json({
      success: false,
      message: "Partner not found",
    });
  }
const servicablePincode = await ServicablePincode.find({partner: id, isDeleted: false, isActive: true}).select("pincode -_id").lean();

console.log("Serviceable pincodes:", servicablePincode);

const bookings = await Booking.find({ serviceStatus: "pending", isDeleted: false, isActive: true })
  .populate("product.product")
  .populate("customer")
  .sort({ "scheduleFor.date": 1 })
  .lean();

  const pincodeArray = new Set(servicablePincode.map(pincodeObj => pincodeObj.pincode.toString()));
  console.log(pincodeArray);

const filteredBookings = bookings.filter(booking => {
  // Extract the pincode using a regular expression (assuming the pincode is a 6-digit number)
  const match = booking.customerAddress.match(/\b\d{6}\b/);
  const customerPincode = match ? match[0] : null;


  // Check if the customer's pincode exists in the serviceable pincodes array (using Set for O(1) lookup)
  return customerPincode && pincodeArray.has(customerPincode);
});


  if (filteredBookings.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No unconfirmed bookings found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Unconfirmed bookings fetched successfully",
    data: filteredBookings,
  });

} catch (error) {
  res.status(500).json({
    success: false,
    message: "Error fetching unconfirmed bookings",
    errorMessage: error.message,
  });
}
};
