const CustomerAddress = require("../models/customerAddressModel");
const Booking = require("../models/bookingModel");
const Transaction = require("../models/transactionModel");

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

