const Order = require("../models/orderModel");

exports.createOrder = async (req, res) => {
  const { customerId, items, totalPrice, discount, finalPrice, paymentMethod, shippingAddress, billingAddress } = req.body;

  try {
    // Array of required fields with corresponding field names
    const requiredFields = [
        { key: 'customerId', name: 'Customer ID' },
        { key: 'items', name: 'Items' },
        { key: 'totalPrice', name: 'Total Price' },
        { key: 'discount', name: 'Discount' },
        { key: 'finalPrice', name: 'Final Price' },
        { key: 'paymentMethod', name: 'Payment Method' },
        { key: 'shippingAddress', name: 'Shipping Address' },
        { key: 'billingAddress', name: 'Billing Address' },
    ];

    // Collect missing fields
    const missingFields = requiredFields
        .filter(field => !req.body[field.key])
        .map(field => field.name);

    if (missingFields.length > 0) {
        return res.status(400).json({
        success: false,
        message: "Missing fields: " + missingFields.join(", "),
        });
    }

    const newOrder = new Order({
      customerId,
      items,
      totalPrice,
      discount,
      finalPrice,
      paymentMethod,
      shippingAddress,
      billingAddress,
    });

    await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating order",
      errorMessage: error.message,
    });
  }
};

//**Do Not Use*** */
exports.updateOrder = async (req, res) => {
  const { id } = req.query;
  const updateData = req.body;

  try {
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedOrder) {
      return res.status(500).json({
        success: false,
        message: "Error updating order",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating order",
      errorMessage: error.message,
    });
  }
};

exports.getOrderById = async (req, res) => {
  const { id } = req.query;

  try {
    if(id === 'undefined') {
      return res.status(404).json({
        success: false,
        message: "Order id is required",
      });
    }
    const order = await Order.findById(id).populate("customerId items.itemId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      errorMessage: error.message,
    });
  }
};

exports.deleteOrder = async (req, res) => {
  const { id } = req.query;

  try {
    if(id === 'undefined') {
        return res.status(404).json({
          success: false,
          message: "Order id is required",
        });
      }
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Order already deleted",
      });
    }

    await Order.findByIdAndUpdate(id, { isDeleted: true });

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting order",
      errorMessage: error.message,
    });
  }
};
