const BookingCancellationFees = require("../models/bookingCancellationFeesModel.js");

/**
 * Creates a new BookingCancellationFees record.
 * @param {Object} booking - The booking object containing necessary information.
 * @param {String} userType - The type of user being charged (e.g., 'customer' or 'partner').
 * @param {Number} charges - The amount of cancellation charges to be applied.
 * @param {String} status - The status of the cancellation fee (e.g., 'pending', 'paid', etc.).
 */
const addCancellationChargesRecord = async (booking, userType, charges, status) => {
  try {
    const cancellationFeeRecord = new BookingCancellationFees({
      booking: booking._id,
      userType: userType,
      charges: charges,
      status: status,
    });
    if (userType === 'customer') {
      cancellationFeeRecord.userId = booking.customerId;
    } else if (userType === 'partner') {
        cancellationFeeRecord.userId = booking.partner[0].partner;
    }

    // Save the cancellation fee record to the database
    await cancellationFeeRecord.save();

  } catch (error) {
    console.error('Error creating cancellation fee record:', error);
    throw new Error('Failed to create cancellation fee record');
  }
};

module.exports = {
  addCancellationChargesRecord,
};
