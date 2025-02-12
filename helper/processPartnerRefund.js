import Partner from "../src/features/partner/model/partner.model.js";
import { calculatePartnerCommission } from "../helper/calculatePartnerCommission.js";
import PartnerTransaction from "../src/features/partner-transaction/model/partner-transaction.model.js";
/**
 * Process a refund for wallet-based transactions and update the customer's wallet balance.
 * @param {Object} booking - The booking object containing necessary information.
 * @param {Number} cancellationCharges - The cancellation charges to be deducted.
 * @returns {String} - The updated status of the cancellation fee (either 'paid' or 'pending').
 */
export const processPartnerRefund = async (
  booking,
  customerCancellationCharges,
  partnerCancellationCharges
) => {
  try {
    const partnerCommission = calculatePartnerCommission(booking.finalPrice);
    const partnerRefundAmount =
      partnerCommission +
      customerCancellationCharges -
      partnerCancellationCharges;
    const partner = await Partner.findOne({ _id: booking.partner[0].partner });

    if (!partner) {
      throw new Error("Partner not found");
    }

    // Update the customer's wallet balance
    if (partnerCancellationCharges > partnerCommission) {
      partner.walletBalance -= partnerCancellationCharges - partnerCommission;
    } else {
      partner.walletBalance += partnerRefundAmount;
    }
    partner.save();

    if (partnerRefundAmount > 0) {
      new PartnerTransaction({
        partnerId: partner._id,
        transactionType: "booking_refund",
        amount: partnerRefundAmount,
        paymentGateway: "wallet",
        status: "completed",
      }).save();
    }
  } catch (error) {
    console.error("Error processing wallet refund:", error);
    throw new Error("Failed to process wallet refund");
  }
};
