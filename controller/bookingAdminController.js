const Booking = require("../models/bookingModel");
const Customer = require("../models/customerModel");

exports.fetchBookings = async (req, res) => {
  try {
    // Set default pagination values if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch bookings with populated fields and pagination
    const bookings = await Booking.find()
      .populate("product.product")
      .populate("partner.partner")
      .populate("customer")
      .sort({ "scheduleFor.date": 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Count the total number of bookings for pagination calculation
    const totalBookings = await Booking.countDocuments();
    const totalPages = Math.ceil(totalBookings / limit);

    // If no bookings found
    // if (bookings.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "No bookings found",
    //   });
    // }

    // Return successful response with pagination info
    return res.status(200).json({
      success: true,
      message: "Bookings fetched successfully",
      data: bookings,
      totalBookings,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    // Handle potential errors
    return res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      details: error.message,
    });
  }
};

exports.downloadExcelSheet = async (req, res) => {
  try {
    // Step 1: Fetch the booking data from MongoDB
    const bookings = await Booking.find({ isDeleted: false })
      .populate("customer", "name email")
      .populate("partner.partner", "name")
      .populate("product.product", "name price") // populate product details
      .populate("transaction");

    // Step 2: Prepare the data for Excel
    const data = bookings.map((booking) => ({
      CustomerName: booking.customer?.name || "N/A",
      CustomerEmail: booking.customer?.email || "N/A",
      PartnerName: booking.partner[0]?.partner?.name || "N/A",
      ProductDetails: booking.product
        .map(
          (p) =>
            `${p.product?.name} (Quantity: ${p.quantity}, Price: ${p.price})`
        )
        .join(", "),
      TotalPrice: booking.totalPrice,
      Discount: booking.discount,
      FinalPrice: booking.finalPrice,
      PaymentStatus: booking.paymentStatus,
      BookingStatus: booking.status,
      ScheduledFor: `${booking.scheduleFor?.date || "N/A"} ${
        booking.scheduleFor?.time || ""
      } ${booking.scheduleFor?.format || ""}`,
      ServiceStatus: booking.serviceStatus,
      CreatedAt: booking.createdAt.toISOString(),
      UpdatedAt: booking.updatedAt.toISOString(),
    }));

    // Step 3: Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

    // Step 4: Generate the Excel file as a buffer (in-memory)
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    // Step 5: Set the appropriate headers for file download
    res.setHeader("Content-Disposition", "attachment; filename=bookings.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Step 6: Send the buffer as the response
    res.send(excelBuffer);
  } catch (error) {
    res.status(500).json({ message: "Error generating Excel file", error });
  }
};

exports.searchBookings = async (req, res) => {
  const { query, page = 1, limit = 10 } = req.query;

  try {
    // Define the search condition dynamically based on the query
    let searchCondition = {};

    if (query) {
      const queryRegex = { $regex: query, $options: "i" }; // Case-insensitive regex for all fields

      // If the query is exactly "true" or "false", handle it as a search for isActive or isDeleted
      if (query.toLowerCase() === "true" || query.toLowerCase() === "false") {
        searchCondition.isActive = query.toLowerCase() === "true"; // Example using isActive; you can also use isDeleted if needed
      } else {
        // Search by customer name, email, number, or discountType if it's not a boolean query
        const customerSearchCondition = {
          $or: [
            { name: queryRegex }, // Search by customer name
            { email: queryRegex }, // Search by customer email
            { number: queryRegex }, // Search by customer phone number
          ],
        };

        // Find matching customers by name, email, or number
        const matchingCustomers = await Customer.find(
          customerSearchCondition
        ).select("_id");
        const customerIds = matchingCustomers.map((customer) => customer._id);

        // Search condition for customerId, discountType, or other fields
        searchCondition = {
          $or: [
            { customer: { $in: customerIds } }, // Match by customerId
            { discountType: queryRegex }, // Match discountType
          ],
        };
      }
    }

    // Fetch bookings with pagination and populated customer details
    const bookings = await Booking.find(searchCondition)
      .populate("customer", "name email mobile") // Populate specific fields from customer details
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Get total count of bookings matching the search condition
    const totalBookings = await Booking.countDocuments(searchCondition);

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found matching the search criteria",
      });
    }

    // Return the search results along with pagination details
    res.status(200).json({
      success: true,
      message: "Bookings retrieved successfully",
      data: bookings,
      totalBookings,
      currentPage: page,
      totalPages: Math.ceil(totalBookings / limit),
    });
  } catch (error) {
    console.error("Error searching bookings:", error);

    res.status(500).json({
      success: false,
      message: "Error occurred while searching bookings",
      error: error.message,
    });
  }
};
