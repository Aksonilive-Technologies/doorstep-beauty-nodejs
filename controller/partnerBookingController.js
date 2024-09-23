const Booking = require("../models/bookingModel");
const Partner = require("../models/partnerModel.js");
const ServicablePincode = require("../models/servicablePincodeModel.js");
const StockAssignment = require("../models/stockAssignmentModel.js");
const Transaction = require("../models/transactionModel.js");
const Customer = require("../models/customerModel.js");
const BookingCancellationFees = require("../models/bookingCancellationFeesModel.js");
const mongoose = require("mongoose");
const CustomerFCMService = require("../helper/customerFcmService.js");
const PartnerFCMService = require("../helper/partnerFcmService.js");
const FirebaseTokens = require("../models/firebaseTokenModel.js");

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

// Set the 15-minute threshold
const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

// Booking query with conditional logic based on partner's rating
const bookingQuery = {
  serviceStatus: "pending",
  status: { $in: ["pending", "processing"] },
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

  bookings.forEach(booking => {
    booking.product.forEach(productItem => {
      // Check if there is an option selected for this product
      if (productItem.option && productItem.product.options) {
        const selectedOption = productItem.product.options.find(opt => opt._id.equals(productItem.option));
  
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
      }

      // Remove the options field from the product to clean up the response
      delete productItem.product.options;
      delete productItem.option;
    });
  });

  const pincodeArray = new Set(servicablePincode.map(pincodeObj => pincodeObj.pincode.toString()));
  console.log(pincodeArray);

const filteredBookings = bookings.filter(booking => {
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

exports.fetchAllBookings = async (req, res) => {
  const { id } = req.body;

try {

  if (!id) {
    console.log("Partner ID is missing");
    return res.status(400).json({
      success: false,
      message: "Partner ID is required",
    });
  }

  const partner = await Partner.findOne({_id:id, isDeleted: false, isActive: true});

  if (!partner) {
    return res.status(404).json({
      success: false,
      message: "Partner not found",
    });
  }

const bookings = await Booking.find({ serviceStatus: {$ne:"pending"}, partner: {                               // Use $elemMatch to find the partner by ID
  $elemMatch: {
    partner: id
  }
}, isDeleted: false, isActive: true })
  .populate("product.product")
  .populate("customer")
  .sort({ "scheduleFor.date": 1 })
  .lean();

  if (bookings.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No bookings found",
    });
  }

  bookings.forEach(booking => {
      booking.product.forEach(productItem => {
        // Check if there is an option selected for this product
        if (productItem.option && productItem.product.options) {
          const selectedOption = productItem.product.options.find(opt => opt._id.equals(productItem.option));
    
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
        }

        // Remove the options field from the product to clean up the response
        delete productItem.product.options;
        delete productItem.option;
      });
    });

  const groupedBookings = bookings.reduce((acc, booking) => {
    // Get the current service status
    const status = booking.serviceStatus;
  
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

const booking = await Booking.findOne({_id:bookingId, serviceStatus:"pending", isDeleted: false, isActive: true});
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
booking.status = "processing";

await booking.save();

const customerToken = await FirebaseTokens.find({ userId: booking.customer , userType: "customer" });
if (customerToken) {
  for (let i = 0; i < customerToken.length; i++) {
  CustomerFCMService.sendPartnerAllocationConfirmationMessage(customerToken[i].token);
}}


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

exports.startBooking = async (req, res) => {
  const {  partnerId, bookingId, stockItems } = req.body;

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
    const booking = await Booking.findOne({_id:bookingId, serviceStatus:"scheduled", isDeleted: false, isActive: true});
    if(!booking){
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Prepare stock assignments update
    const stockAssignments = await StockAssignment.find({
      stock: { $in: stockItems },
      partner: partnerId,
    });

    // Decrease quantity for each stock item and accumulate updates
    const bulkUpdates = stockAssignments.map((assignment) => ({
      updateOne: {
        filter: { _id: assignment._id },
        update: { $inc: { quantity: -1 } },
      },
    }));

    // Push product tools into booking and perform bulk updates
    booking.productTool.push(...stockItems.map((item) => ({ productTool: new mongoose.Types.ObjectId(item) })));
    booking.serviceStatus = "ongoing";
    booking.serviceStartedAt = new Date();

    // Execute both save operations in parallel
    await Promise.all([booking.save(), StockAssignment.bulkWrite(bulkUpdates)]);

    await booking.save();
    res.status(200).json({
      success: true,
      message: "Booking started successfully",
    });
}catch (error) {
  res.status(500).json({
    success: false,
    message: "Error starting booking",
    errorMessage: error.message,
  });}

};

exports.completeBooking = async (req, res) => {
  const { bookingId } = req.body;

try {
  
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }
    const booking = await Booking.findOne({_id:bookingId, serviceStatus:"ongoing", isDeleted: false, isActive: true});
    if(!booking){
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
}
catch (error) {
  res.status(500).json({
    success: false,
    message: "Error completing booking",
    errorMessage: error.message,
  });
}

};

exports.cancelBooking = async (req, res) => {
  const { bookingId } = req.body;

try {
  
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }
    const booking = await Booking.findOne({_id:bookingId, serviceStatus:{$in: ["pending", "scheduled"]}, isDeleted: false, isActive: true});
    if(!booking){
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }
    let cancellationCharges = 0;
    let cancellationFeeStatus = "pending";
    
    if(booking.serviceStatus === "scheduled"){
    // Combine date, time, and format into a single Date object
    const scheduledDate = new Date(booking.scheduleFor.date); // Date part (e.g., 2024-09-21)
    let [hours, minutes] = booking.scheduleFor.time.split(":").map(Number); // Time part (e.g., 10:00)

    // Adjust hours based on AM/PM format
    if (booking.scheduleFor.format === "PM" && hours < 12) {
      hours += 12;
    } else if (booking.scheduleFor.format === "AM" && hours === 12) {
      hours = 0; // Handle 12 AM edge case
    }

    // Set the hours and minutes to the scheduledDate object
    scheduledDate.setHours(hours);
    scheduledDate.setMinutes(minutes);

    // Get the current time
    const currentTime = new Date();

    // Calculate the time difference in milliseconds
    const timeDifference = scheduledDate - currentTime;

    // Convert time difference to hours
    const hoursDifference = timeDifference / (1000 * 60 * 60);


    // Apply cancellation logic
    if (hoursDifference > 1) {
      // If the cancellation is before 1 hour of the scheduled time, flat ₹100 charge
      cancellationCharges = 100;
    } else if (hoursDifference <= 1 && hoursDifference >= 0) {
      // If the cancellation is within 1 hour of the scheduled time, 20% of the final price
      cancellationCharges = booking.finalPrice * 0.2;
    }
    
    const transaction = await Transaction.findById(booking.transaction);
    
    
    // If payment method is wallet
    if (transaction.transactionType === "wallet_booking") {
      const customer = await Customer.findById(booking.customer);
      
      const remainingAmount = booking.finalPrice - cancellationCharges;
      customer.walletBalance += remainingAmount;
      
      // Create a transaction record with status "Pending"
      new Transaction({
        customerId: customer._id,
        transactionType: "booking_refund",
        amount: remainingAmount,
        paymentGateway: "wallet",
        status: "completed"
      }).save();
      
      await customer.save();
      
      // Since the refund is done, mark the cancellation fee as paid
      cancellationFeeStatus = "paid";
    }else{
      cancellationFeeStatus = "pending";
    }
    
    
    
    // Create a new record in BookingCancellationFees
    const cancellationFeeRecord = new BookingCancellationFees({
      booking: booking._id,
      customer: booking.customer,
      charges: cancellationCharges,
      status: cancellationFeeStatus,
    });
    
    await cancellationFeeRecord.save();
  }
    booking.status = "cancelled";
    booking.serviceStatus = "cancelled";
    booking.cancelledBy = "partner";
    await booking.save();

    const customerTokens = await FirebaseTokens.find({ userId: booking.customer, userType: "customer" });
const partnerTokens = await FirebaseTokens.find({ userId: booking.partner[0].partner, userType: "partner" });

if (customerTokens) {
  // Handle customer tokens
  for (let i = 0; i < customerTokens.length; i++) {
    const sendMessages = [
      CustomerFCMService.sendBookingCancellationMessage(customerTokens[i].token)
    ];

    // Check if the cancellation fee status is paid and add refund message if so
    if (cancellationFeeStatus === "paid") {
      sendMessages.push(CustomerFCMService.sendBookingRefundMessage(customerTokens[i].token));
    }
    await Promise.all(sendMessages);
  }}
  if (partnerTokens) {

  for (let i = 0; i < partnerTokens.length; i++) {
      PartnerFCMService.sendBookingCancellationMessage(partnerTokens[i].token);
  }
}

    
    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
    });
}
catch (error) {
  res.status(500).json({
    success: false,
    message: "Error cancelling booking",
    errorMessage: error.message,
  });
}

};
