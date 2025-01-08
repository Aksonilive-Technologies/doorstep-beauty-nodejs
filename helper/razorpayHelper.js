const Razorpay = require('razorpay');

// Initialize Razorpay instance
const instance = new Razorpay({
  key_id: 'YOUR_KEY_ID', // Replace with your Razorpay Key ID
  key_secret: 'YOUR_KEY_SECRET', // Replace with your Razorpay Key Secret
});

// Function to create an order
exports.createOrder = async (amount) => {
  const options = {
    amount, // Amount in paise (e.g., ₹500 is 50000)
    currency: "INR",
    payment_capture: 1, // Auto-capture payment
  };

  try {
    const order = await instance.orders.create(options);
    return order.id; // Return the created order object
  } catch (error) {
    console.error("Error creating order:", error);
    throw new Error("Error creating order"); // Propagate error to the caller
  }
};