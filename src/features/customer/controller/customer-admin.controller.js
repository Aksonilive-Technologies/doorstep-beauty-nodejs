import Customer from "../model/customer.model.js";
import CustomerAddress from "../../customer-address/model/customer-address.model.js";
import XLSX from "xlsx";
import Booking from "../../booking/model/booking.model.js";

export const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, query } = req.query; // Get the page number from the query, default to 1
    const limit = 10; // Limit to 10 customers per page
    const skip = (page - 1) * limit; // Calculate how many documents to skip

    //search condition
    const searchCondition = query
      ? { isDeleted: false, name: { $regex: query, $options: "i" } }
      : { isDeleted: false };

    const customers = await Customer.find(searchCondition)
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

    const totalCustomers = customers.length; // Get the total number of customers
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

//delete customer
export const deleteCustomer = async (req, res) => {
  const { id } = req.query;
  try {
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (customer.isDeleted) {
      return res.status(404).json({
        success: false,
        message:
          "Your account is already deleted. Please contact the support team for assistance.",
      });
    }

    // if (!customer.isActive) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "Your account is currently inactive.",
    //   });
    // }

    const customerDeleted = await Customer.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!customerDeleted) {
      return res.status(500).json({
        success: false,
        message: "Error deleting customer",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Your account has been successfully deleted.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the customer.",
      errorMessage: error.message,
    });
  }
};

//change status of deleted customer
export const changeStatusDeletedCustomer = async (req, res) => {
  const { id } = req.query;
  try {
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!customer.isActive) {
      customer.isActive = true;
      await customer.save();
      return res.status(200).json({
        success: true,
        message: "Your account is activated now",
      });
    } else {
      customer.isActive = false;
      await customer.save();
      return res.status(200).json({
        success: true,
        message:
          "Your account has been temporarily deactivated. Please contact the support team.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while changing the status of the customer.",
      errorMessage: error.message,
    });
  }
};

export const downloadExcelSheet = async (req, res) => {
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

//need to do changes
export const getCustomerStats = async (req, res) => {
  try {
    const { range, from, to } = req.body;
    let startDate, endDate;
    const currentDate = new Date();

    // Helper function to parse `dd/mm/yyyy` format
    const parseDate = (dateStr) => {
      const [day, month, year] = dateStr.split("/").map(Number);
      return new Date(year, month - 1, day); // Months are zero-indexed in JS Date
    };

    // Calculate date ranges based on provided `from` date or default to previous periods
    if (range === "weekly") {
      if (from) {
        startDate = parseDate(from);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // 7 days from startDate
      } else {
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - 7); // 1 week before current date
        endDate = currentDate;
      }
    } else if (range === "monthly") {
      if (from) {
        startDate = parseDate(from);
        endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 1); // 1 month from startDate
        endDate.setDate(endDate.getDate() - 1); // End of the month from startDate
      } else {
        startDate = new Date(currentDate);
        startDate.setMonth(currentDate.getMonth() - 1); // 1 month before current date
        startDate.setDate(1); // Start of the previous month
        endDate = new Date(currentDate);
        endDate.setDate(0); // End of the previous month
      }
    } else if (range === "yearly") {
      // If 'from' date is provided, use it; otherwise, default to one year before the current month
      if (from) {
        startDate = parseDate(from);
        endDate = new Date(startDate);
        endDate.setFullYear(startDate.getFullYear() + 1);
        endDate.setDate(endDate.getDate() - 1); // Set to the end of the year from the startDate
      } else {
        // Set startDate to the first day of the same month, one year ago
        startDate = new Date(
          currentDate.getFullYear() - 1,
          currentDate.getMonth(),
          1
        );

        // Set endDate to the last day of the previous month
        endDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          0
        );
      }
    } else {
      return res.status(400).json({
        success: false,
        message:
          "Invalid range. Please specify 'weekly', 'monthly', or 'yearly'.",
      });
    }

    // Aggregate customer data within the specified date range
    const customerStats = await Customer.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            week: { $week: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.week": 1,
        },
      },
    ]);

    // Initialize the data structure based on the selected range
    let results = [];
    let currentDateIter = new Date(startDate);

    if (range === "weekly") {
      while (currentDateIter <= endDate) {
        const dayData = {
          year: currentDateIter.getFullYear(),
          month: currentDateIter.getMonth() + 1,
          day: currentDateIter.getDate(),
          count: 0,
        };

        const match = customerStats.find(
          (stat) =>
            stat._id.year === dayData.year &&
            stat._id.month === dayData.month &&
            stat._id.day === dayData.day
        );

        if (match) {
          dayData.count = match.count;
        }

        results.push(dayData);
        currentDateIter.setDate(currentDateIter.getDate() + 1); // Move to next day
      }
    } else if (range === "monthly") {
      let weekCounter = 0;

      while (currentDateIter <= endDate && weekCounter < 4) {
        const weekStart = new Date(currentDateIter);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Calculate end of the week

        const weekData = {
          year: currentDateIter.getFullYear(),
          month: currentDateIter.getMonth() + 1,
          week: Math.ceil(currentDateIter.getDate() / 7), // Calculate week of the month
          count: 0,
          range: {
            start: weekStart.toISOString().split("T")[0], // Week start date
            end: weekEnd.toISOString().split("T")[0], // Week end date
          },
        };

        const match = customerStats.find(
          (stat) =>
            stat._id.year === weekData.year &&
            stat._id.month === weekData.month &&
            stat._id.week === weekData.week
        );

        if (match) {
          weekData.count = match.count;
        }

        results.push(weekData);
        currentDateIter.setDate(currentDateIter.getDate() + 7); // Move to next week
        weekCounter++; // Increment week counter
      }
    } else if (range === "yearly") {
      while (currentDateIter <= endDate) {
        const monthData = {
          year: currentDateIter.getFullYear(),
          month: currentDateIter.getMonth() + 1,
          count: 0,
        };

        const match = customerStats.find(
          (stat) =>
            stat._id.year === monthData.year &&
            stat._id.month === monthData.month
        );

        if (match) {
          monthData.count = match.count;
        }

        results.push(monthData);
        currentDateIter.setMonth(currentDateIter.getMonth() + 1); // Move to the next month
      }
    }

    res.status(200).json({
      success: true,
      message: "Customer stats retrieved successfully",
      data: results,
    });
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer stats",
      errorMessage: error.message,
    });
  }
};

export const getTopCustomerByBookings = async (req, res) => {
  try {
    // Aggregate bookings to get count per customer
    const topCustomerBooking = await Booking.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$customer",
          bookingCount: { $sum: 1 },
        },
      },
      {
        $sort: { bookingCount: -1 }, // Sort by highest booking count
      },
      {
        $limit: 1, // Get the top customer only
      },
    ]);

    if (topCustomerBooking.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found",
        data: null,
      });
    }

    // Get the customer details for the top customer by bookings
    const topCustomer = await Customer.findById(
      topCustomerBooking[0]._id
    ).select("image name mobile");

    if (!topCustomer) {
      return res.status(404).json({
        success: false,
        message: "Top customer not found",
        data: null,
      });
    }

    // Prepare the response with customer details and booking count
    res.status(200).json({
      success: true,
      message: "Top customer by bookings retrieved successfully",
      data: {
        image: topCustomer.image,
        name: topCustomer.name,
        mobile: topCustomer.mobile,
        bookingCount: topCustomerBooking[0].bookingCount,
      },
    });
  } catch (error) {
    console.error("Error fetching top customer by bookings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching top customer by bookings",
      errorMessage: error.message,
    });
  }
};
