const CustomerAddress = require("../models/customerAddressModel");
const Booking = require("../models/bookingModel");
const Transaction = require("../models/transactionModel");
const moment = require("moment"); 
exports.bookProduct = async (req, res) => {
  const {
    customerId,
    products,
    totalPrice,
    discountType,
    discountValue,
    offerType,
    offerRefId,
    customerAddressId,
    paymentType,
    scheduleFor,
  } = req.body;

  try {
    // Array to collect missing fields
    const missingFields = [];

    // Check for required fields
    if (!customerId) missingFields.push("customerId");
    if (!products || products.length === 0) missingFields.push("products");
    if (!totalPrice) missingFields.push("totalPrice");
    if (!paymentType) missingFields.push("paymentType");

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

    // Create transaction record
    const transaction = new Transaction({
      customerId,
      transactionType: paymentType === "wallet" ? "wallet_booking" : "gateway_booking",
      amount: finalPrice,
      paymentGateway: paymentType,
    });

    const savedTransaction = await transaction.save();

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
      transaction: savedTransaction._id,
      scheduleFor,
      isActive: true,
      isDeleted: false,
    });

    await newBooking.save();

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

exports.fetchBookings = async (req, res) => {
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
    const bookings = await Booking.find({ customer: customerId, isDeleted: false })
      .populate("product.product")
      .populate("partner.partner");

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found",
      });
    }

    // Current date for comparison
    const now = moment();

    // Categorize bookings
    const categorized = {
      Ongoing: [],
      Upcoming: [],
      Previous: []
    };

    bookings.forEach(booking => {
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
    categorized.Upcoming.sort((a, b) => moment(a.scheduleFor.date).diff(moment(b.scheduleFor.date)));
    categorized.Previous.sort((a, b) => moment(b.scheduleFor.date).diff(moment(a.scheduleFor.date)));

    res.status(200).json({
      success: true,
      message: "Bookings fetched and categorized successfully",
      data: categorized
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      errorMessage: error.message,
    });
  }
};

exports.cancelBooking = async (req, res) => {
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
    const booking = await Booking.findOne({ _id: bookingId, isDeleted: false });

    // Check if the booking exists
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Update the booking status and service status to cancelled
    booking.serviceStatus = "cancelled";
    booking.status = "cancelled";

    await booking.save();

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

