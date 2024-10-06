const Customer = require("../models/customerModel.js");
const CustomerAddress = require("../models/customerAddressModel");
const XLSX = require("xlsx");

exports.getAllCustomers = async (req, res) => {
  try {
    const { page = 1 } = req.query; // Get the page number from the query, default to 1
    const limit = 10; // Limit to 10 customers per page
    const skip = (page - 1) * limit; // Calculate how many documents to skip

    const customers = await Customer.find()
      .select("-__v")
      .skip(skip)
      .limit(limit)
      .lean();

    for (let i = 0; i < customers.length; i++) {
      const address = await CustomerAddress.findOne({
        customer: customers[i]._id,
        isDeleted: false,
        isActive: true,
        isPrimary: true,
      });
      if (address) {
        customers[i].address = address.address;
      }
    }

    const totalCustomers = await Customer.countDocuments(); // Get the total number of customers
    const totalPages = Math.ceil(totalCustomers / limit); // Calculate total pages

    res.status(200).json({
      success: "true",
      message: "All customers are fetched successfully",
      data: customers,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching customers",
      errorMessage: error.message,
    });
  }
};

exports.downloadExcelSheet = async (req, res) => {
  try {
    // Step 1: Fetch data from MongoDB
    const customers = await Customer.find({ isDeleted: false }).populate(
      "referredBy"
    );

    // Step 2: Prepare the data for Excel
    const data = customers.map((customer) => ({
      Name: customer.name,
      Email: customer.email,
      Mobile: customer.mobile,
      ReferralCode: customer.referralCode || "N/A",
      ReferredBy: customer.referredBy ? customer.referredBy.name : "N/A",
      WalletBalance: customer.walletBalance,
      Active: customer.isActive ? "Active" : "Inactive",
      CreatedAt: customer.createdAt.toISOString(),
      UpdatedAt: customer.updatedAt.toISOString(),
    }));

    // Step 3: Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

    // Step 4: Generate the Excel file as a buffer (in-memory)
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    // Step 5: Set the appropriate headers for file download
    res.setHeader("Content-Disposition", "attachment; filename=customers.xlsx");
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

exports.searchCustomer = async (req, res) => {
  try {
    const { query } = req.query;

    // Handle pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Define search conditions for customer fields (name, email, mobile) using case-insensitive regex
    const searchCondition = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } }, // Case-insensitive search
            { email: { $regex: query, $options: "i" } },
            { mobile: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    // Find matching addresses in the CustomerAddress model
    const matchingAddresses = await CustomerAddress.find({
      $or: [
        { "address.houseNo": { $regex: query, $options: "i" } },
        { "address.floorNo": { $regex: query, $options: "i" } },
        { "address.buildingName": { $regex: query, $options: "i" } },
        { "address.street": { $regex: query, $options: "i" } },
        { "address.city": { $regex: query, $options: "i" } },
        { "address.locality": { $regex: query, $options: "i" } },
        { "address.landmark": { $regex: query, $options: "i" } },
        { "address.state": { $regex: query, $options: "i" } },
        { "address.pincode": { $regex: query, $options: "i" } },
        { "address.country": { $regex: query, $options: "i" } },
      ],
      isDeleted: false, // Only active and non-deleted addresses
      isActive: true,
    }).select("customer");

    // If any addresses match, add those customer IDs to the search condition
    if (matchingAddresses.length > 0) {
      const customerIdsFromAddresses = matchingAddresses.map(
        (addr) => addr.customer
      );
      searchCondition.$or.push({ _id: { $in: customerIdsFromAddresses } });
    }

    // Find the customers matching the search condition
    const customers = await Customer.find(searchCondition)
      .limit(limit)
      .skip(skip)
      .lean();

    // Check if no customers are found
    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No data found",
      });
    }

    // Fetch primary addresses for each customer
    for (let i = 0; i < customers.length; i++) {
      const address = await CustomerAddress.findOne({
        customer: customers[i]._id,
        isDeleted: false,
        isActive: true,
        isPrimary: true,
      });
      if (address) {
        customers[i].address = address.address;
      }
    }

    const totalCustomers = await Customer.countDocuments(searchCondition);

    // Return the search results along with pagination details
    res.status(200).json({
      success: true,
      message: "Customers retrieved successfully",
      data: customers,
      totalCustomers,
      totalPages: Math.ceil(totalCustomers / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error while searching customers:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while searching customers",
      errorMessage: error.message,
    });
  }
};
