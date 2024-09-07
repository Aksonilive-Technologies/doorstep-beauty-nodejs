const Booking = require("../models/bookingModel");
const Partner = require("../models/partnerModel.js");
const ServicablePincode = require("../models/servicablePincodeModel.js");
const mongoose = require("mongoose");

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

exports.acceptBooking = async (req, res) => {
  const { partnerId, bookingId } = req.body;

try {

  if (!partnerId || !bookingId) {
    return res.status(400).json({
      success: false,
      message: "Partner ID and Booking ID is required",
    });
  }

  const partner = await Partner.findOne({_id:partnerId, isDeleted: false, isActive: true});

  if (!partner) {
    return res.status(404).json({
      success: false,
      message: "Partner not found",
    });
  }

const booking = await Booking.findOne({_id:bookingId, serviceStatus: "pending",isDeleted: false, isActive: true});
if(!booking){
  return res.status(404).json({
    success: false,
    message: "Booking not found",
  });
}

const newPartner = {
  partner: new mongoose.Types.ObjectId(partnerId),
  rating: 0,
};

// Check if the partner already exists in the array
const partnerIndex = booking.partner.findIndex(p => p.partner.toString() === partnerId);

if (partnerIndex > -1) {
  return res.status(400).json({
    success: false,
    message: "Partner already exists in the booking",
  });
} else {
  // If partner does not exist, add it to the array
  booking.partner.push(newPartner);
}

// Save the updated booking
await booking.save();


  res.status(200).json({
    success: true,
    message: "Booking accepted successfully",
  });

} catch (error) {
  res.status(500).json({
    success: false,
    message: "Error accepting booking",
    errorMessage: error.message,
  });
}
};
