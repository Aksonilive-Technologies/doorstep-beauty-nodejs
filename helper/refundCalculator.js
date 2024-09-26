const moment = require('moment');

/**
 * Function to calculate cancellation charges.
 * @param {Object} booking - The booking object with relevant details.
 * @param {String} cancelledBy - Indicates whether the booking is cancelled by 'customer' or 'partner'.
 * @returns {Number} - The cancellation charge based on the case.
 */
const calculateCancellationCharge = (booking, cancelledBy) => {

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
  const timeDifferenceInHours = timeDifference / (1000 * 60 * 60);

  let cancellationCharge = 0;

  if (cancelledBy === 'customer') {
    if (timeDifferenceInHours <= 1) {
      // Case 1: <= 1 hour left, customer pays 100 Rs
      cancellationCharge = 100;
    } else if (timeDifferenceInHours > 1) {
      // Case 2: > 1 hour left, customer pays 0 Rs
      cancellationCharge = 0;
    }
  } else if (cancelledBy === 'partner') {
    if (timeDifferenceInHours <= 1) {
      // Case 3: <= 1 hour left, partner pays 250 Rs
      cancellationCharge = 250;
    } else if (timeDifferenceInHours > 3) {
      // Case 4: > 3 hours left, partner pays 0 Rs
      cancellationCharge = 0;
    } else if (timeDifferenceInHours > 1 && timeDifferenceInHours <= 3) {
      // Case 5: > 1 and < 3 hours left, partner pays 150 Rs
      cancellationCharge = 150;
    }
  }

  return cancellationCharge;
};

module.exports = { calculateCancellationCharge };
