const Customer = require("../models/customerModel");
const Transaction = require("../models/transactionModel");
/**
 * Process a refund for wallet-based transactions and update the customer's wallet balance.
 * @param {Object} booking - The booking object containing necessary information.
 * @param {Number} cancellationCharges - The cancellation charges to be deducted.
 * @returns {String} - The updated status of the cancellation fee (either 'paid' or 'pending').
 */
let processCustomerRefund = async (booking, customerCancellationCharges, partnerCancellationCharges, paymentMode) => {
  try {
    
    let customerRefundAmount = partnerCancellationCharges - customerCancellationCharges;
    let customer = await Customer.findById(booking.customer);
    
    if (!customer) {
    throw new Error('Customer not found');
    }
    if(paymentMode === "cash" && partnerCancellationCharges > 0){
    // Update the customer's wallet balance
    customer.walletBalance += customerRefundAmount;

    customer.save();
    paymentMode = "wallet";
    }else if(paymentMode === "wallet"){
      paymentMode = "wallet";
      customerRefundAmount += booking.finalPrice;
      customer.walletBalance += customerRefundAmount;

      customer.save();
    }else if(paymentMode === "razorpay"){
      customerRefundAmount += booking.finalPrice;
      // Logic to refund the amount to the customer's bank account using Razorpay

    }

      // Create a new transaction record for the refund
      if(paymentMode === "wallet" || paymentMode === "razorpay"){
      new Transaction({
        customerId: booking.customer,
        transactionType: "booking_refund",
        amount: customerRefundAmount,
        paymentGateway: paymentMode,
        status: "completed",  // Refund is completed
      }).save();
    }
    
  } catch (error) {
    console.error('Error processing wallet refund:', error);
    throw new Error('Failed to process wallet refund');
  }
};

module.exports = {
    processCustomerRefund,
};
