const Customer = require("../models/customerModel");
const Transaction = require("../models/transactionModel");
const Partner = require("../models/partnerModel");
const {calculatePartnerCommission} = require("../helper/calculatePartnerCommission.js");
const PartnerTransaction = require("../models/partnerTransactionModel.js");
/**
 * Process a refund for wallet-based transactions and update the customer's wallet balance.
 * @param {Object} booking - The booking object containing necessary information.
 * @param {Number} cancellationCharges - The cancellation charges to be deducted.
 * @returns {String} - The updated status of the cancellation fee (either 'paid' or 'pending').
 */
const processWalletRefund = async (booking, customerCancellationCharges, partnerCancellationCharges) => {
  try {
    
    const customerRefundAmount = booking.finalPrice - customerCancellationCharges + partnerCancellationCharges;
    const partnerRefundAmount = calculatePartnerCommission(booking.finalPrice) - partnerCancellationCharges + customerCancellationCharges;

    
      const customer = await Customer.findById(booking.customer);
      const partner = await Partner.findOne({ _id: booking.partner[0].partner });
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      if (!partner) {
        throw new Error('Partner not found');
      }

      // Update the customer's wallet balance
      customer.walletBalance += customerRefundAmount;
      partner.walletBalance += partnerRefundAmount;
      customer.save();
      partner.save();

      // Create a new transaction record for the refund
      if(customerRefundAmount > 0){
      new Transaction({
        customerId: booking.customer,
        transactionType: "booking_refund",
        amount: customerRefundAmount,
        paymentGateway: "wallet",
        status: "completed",  // Refund is completed
      }).save();
    }
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
  processWalletRefund,
};
