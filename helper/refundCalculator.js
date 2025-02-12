import { calculateTimeDifference } from "../helper/calculateTimeDifference.js";

/**
 * Function to calculate cancellation charges.
 * @param {Object} booking - The booking object with relevant details.
 * @param {String} cancelledBy - Indicates whether the booking is cancelled by 'customer' or 'partner'.
 * @returns {Number} - The cancellation charge based on the case.
 */
export const calculateCancellationCharge = (booking, cancelledBy) => {
  // Convert time difference to hours
  const timeDifferenceInHours = calculateTimeDifference(booking);

  let cancellationCharge = 0;

  if (cancelledBy === "customer") {
    if (timeDifferenceInHours <= 1) {
      // Case 1: <= 1 hour left, customer pays 100 Rs
      cancellationCharge = 100;
    } else if (timeDifferenceInHours > 1) {
      // Case 2: > 1 hour left, customer pays 0 Rs
      cancellationCharge = 0;
    }
  } else if (cancelledBy === "partner") {
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

export default calculateCancellationCharge;
