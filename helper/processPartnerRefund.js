const Partner = require("../models/partnerModel");
const {calculatePartnerCommission} = require("../helper/calculatePartnerCommission.js");
const PartnerTransaction = require("../models/partnerTransactionModel.js");
/**
 * Process a refund for wallet-based transactions and update the customer's wallet balance.
 * @param {Object} booking - The booking object containing necessary information.
 * @param {Number} cancellationCharges - The cancellation charges to be deducted.
 * @returns {String} - The updated status of the cancellation fee (either 'paid' or 'pending').
 */
const processPartnerRefund = async (booking, customerCancellationCharges) => {
  try {
    
    const partnerRefundAmount = calculatePartnerCommission(booking.finalPrice) + customerCancellationCharges;
    const partner = await Partner.findOne({ _id: booking.partner[0].partner });
      
    if (!partner) {
    throw new Error('Partner not found');
    }

    // Update the customer's wallet balance
    partner.walletBalance += partnerRefundAmount;
    partner.save();

    
    if(partnerRefundAmount > 0){
      new PartnerTransaction({
        partnerId: partner._id,
        transactionType: "booking_refund",
        amount: partnerRefundAmount,
        paymentGateway: "wallet",
        status: "completed",
      }).save();
    }
    
  } catch (error) {
    console.error('Error processing wallet refund:', error);
    throw new Error('Failed to process wallet refund');
  }
};

module.exports = {
    processPartnerRefund,
};