import Razorpay from "razorpay";

// Initialize Razorpay instance
const instance = new Razorpay({
  key_id: process.env.PG_Key, // Replace with your Razorpay Key ID
  key_secret: process.env.PG_Secret, // Replace with your Razorpay Key Secret
});

// Function to create an order
export const createOrder = async (amount) => {
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
