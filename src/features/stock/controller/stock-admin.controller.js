import Stock from "../model/stock.model.js";
import StockBooking from "../../stock-booking/model/stock-booking.model.js";
import mongoose from "mongoose";
import { cloudinary } from "../../../../config/cloudinary.js";
import XLSX from "xlsx";

// export const createStock = async (req, res) => {
//   const requiredFields = [
//     "name",
//     // "brand",
//     "size",
//     "currentStock",
//     // "mrp",
//     // "purchasingRate",
//     // "barcodeNumber",
//   ];

//   // Check for missing fields
//   const missingFields = requiredFields.filter((field) => !req.body[field]);

//   if (missingFields.length > 0) {
//     return res.status(400).json({
//       success: false,
//       error: `${missingFields.join(", ")} are required fields`,
//     });
//   }

//   let imageUrl = null;
//   if (req.file) {
//     try {
//       const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || "";

//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: baseFolder + "Stock",
//         public_id: `${Date.now()}_${req.file.originalname.split(".")[0]}`,
//         overwrite: true,
//       });
//       imageUrl = result.secure_url;
//     } catch (error) {
//       return res.status(500).json({
//         success: false,
//         error: "An error occurred while uploading the image",
//         details: error.message,
//       });
//     }
//   }

//   try {
//     // Extract fields from req.body
//     const {
//       name,
//       brand,
//       size,
//       currentStock,
//       mrp,
//       purchasingRate,
//       barcodeNumber,
//     } = req.body;

//     // Create the stock item
//     const stock = await Stock.create({
//       name,
//       brand,
//       size,
//       entryStock: currentStock,
//       currentStock,
//       mrp,
//       purchasingRate,
//       barcodeNumber,
//       image: imageUrl, // Add imageUrl if available
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Stock created successfully",
//       data: stock,
//     });
//   } catch (error) {
//     // Handle potential errors, e.g., validation errors or database errors
//     return res.status(500).json({
//       success: false,
//       error: "An error occurred while creating the stock",
//       details: error.message,
//     });
//   }
// };

export const createStock = async (req, res) => {
  const requiredFields = [
    "name",
    // "brand",
    "size",
    "currentStock",
    // "mrp",
    // "purchasingRate",
    // "barcodeNumber",
  ];

  // Check for missing fields
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      error: `${missingFields.join(", ")} are required fields`,
    });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      error: "At least one image is required.",
    });
  }

  let images = [];
  // Upload each image to Cloudinary
  const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || "";
  for (const file of req.files) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: baseFolder + "Stock",
        public_id: `${Date.now()}_${file.originalname.split(".")[0]}`,
        overwrite: true,
      });
      images.push(result.secure_url);
    } catch (uploadError) {
      return res.status(500).json({
        success: false,
        error: "An error occurred while uploading an image.",
        details: uploadError.message,
      });
    }
  }

  try {
    // Extract fields from req.body
    const {
      name,
      brand,
      size,
      currentStock,
      mrp,
      purchasingRate,
      barcodeNumber,
    } = req.body;

    // Create the stock item
    const stock = await Stock.create({
      name,
      brand,
      size,
      entryStock: currentStock,
      currentStock,
      mrp,
      purchasingRate,
      barcodeNumber,
      image: images,
    });

    return res.status(201).json({
      success: true,
      message: "Stock created successfully",
      data: stock,
    });
  } catch (error) {
    // Handle potential errors, e.g., validation errors or database errors
    return res.status(500).json({
      success: false,
      error: "An error occurred while creating the stock",
      details: error.message,
    });
  }
};

export const fetchAllStocks = async (req, res) => {
  try {
    // Set default pagination values if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch stocks with pagination
    const stocks = await Stock.find().skip(skip).limit(limit);

    // Count the total number of documents for pagination calculation
    const totalStocks = await Stock.countDocuments();
    const totalPages = Math.ceil(totalStocks / limit);

    // If no stocks found
    // if (stocks.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "No stocks found",
    //   });
    // }

    // Return successful response
    return res.status(200).json({
      success: true,
      message: "Successfully retrieved all the stocks",
      data: stocks,
      currentPage: page,
      totalPages,
      totalStocks,
    });
  } catch (error) {
    // Handle potential errors
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the stocks",
      details: error.message,
    });
  }
};

// update stocks
// export const updateStock = async (req, res) => {
//   const { id } = req.query; // Assuming stock ID is passed via query params
//   const stockData = req.body; // The fields to update
//   const file = req.file; // Image file, if provided

//   try {
//     // Validate stock ID
//     if (!id) {
//       return res.status(400).json({
//         success: false,
//         message: "Stock ID is required",
//       });
//     }

//     // Fetch the existing stock record
//     const stock = await Stock.findById(id);

//     if (!stock) {
//       return res.status(404).json({
//         success: false,
//         message: "Stock not found",
//       });
//     }

//     // Upload the image if a new file is provided
//     let imageUrl = stock.image; // Retain the existing image
//     if (file) {
//       try {
//       const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || "";

//         const result = await cloudinary.uploader.upload(file.path, {
//           folder: baseFolder + "Stock",
//           public_id: `${Date.now()}_${file.originalname.split(".")[0]}`,
//           overwrite: true,
//         });
//         imageUrl = result.secure_url; // Update the image URL with the new uploaded image
//       } catch (error) {
//         return res.status(500).json({
//           success: false,
//           message: "Error uploading image",
//           details: error.message,
//         });
//       }
//     }

//     // Update only the fields that are provided and exclude 'currentStock'
//     const updatedFields = {};
//     for (let key in stockData) {
//       if (stockData[key] !== undefined && key !== "currentStock") {
//         updatedFields[key] = stockData[key];
//       }
//     }

//     // Include the updated image URL
//     updatedFields["image"] = imageUrl;

//     // Update the stock item in the database
//     const updatedStock = await Stock.findByIdAndUpdate(
//       id,
//       { $set: updatedFields },
//       { new: true }
//     );

//     if (!updatedStock) {
//       return res.status(500).json({
//         success: false,
//         message: "Error updating stock",
//       });
//     }

//     // Save the updated stock record
//     updatedStock.save();

//     // Return a success response
//     res.status(200).json({
//       success: true,
//       message: "Stock updated successfully",
//       data: updatedStock,
//     });
//   } catch (error) {
//     // Handle errors
//     res.status(500).json({
//       success: false,
//       message: "Error updating stock",
//       details: error.message,
//     });
//   }
// };

export const updateStock = async (req, res) => {
  const { id } = req.query; // Assuming stock ID is passed via query params
  let { oldImages } = req.body;
  const stockData = req.body; // The fields to update

  if (typeof oldImages === "string") {
    try {
      oldImages = JSON.parse(oldImages);
    } catch (error) {
      console.error("Error parsing oldImages:", error);
      oldImages = [];
    }
  }

  try {
    // Validate stock ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Stock ID is required",
      });
    }

    if (!oldImages) {
      return res.status(400).json({
        success: false,
        message: "Old images array is required",
      });
    }

    // Fetch the existing stock record
    const stock = await Stock.findById(id);

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock not found",
      });
    }

    const updatedFields = {};
    const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || "";
    // If new images are uploaded
    if (req.files && req.files.length > 0) {
      try {
        let uploadedImages = [];

        // **Step 1: Upload new images to Cloudinary**
        for (let file of req.files) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: baseFolder + "Stock",
            public_id: `${Date.now()}_${file.originalname.split(".")[0]}`,
            overwrite: true,
          });
          uploadedImages.push(result.secure_url);
        }

        for (let imageUrl of uploadedImages) {
          if (oldImages.includes("")) {
            const index = oldImages.indexOf("");
            const publicId = stock.image[index].split("/").pop().split(".")[0]; // Extract public_id from URL
            oldImages[index] = imageUrl;

            // **Step 2: Delete old image from Cloudinary**
            await cloudinary.uploader.destroy(
              `${baseFolder}Stock/${publicId.replace(/%20/g, " ")}`
            );
          } else {
            oldImages.push(imageUrl);
          }
        }
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Error uploading images",
          details: error.message,
        });
      }
    } else if (oldImages.length < stock.image.length) {
      let temp = [];
      for (let imageUrl of stock.image) {
        const index = oldImages.indexOf(imageUrl);
        if (!oldImages.includes(imageUrl)) {
          const publicId = imageUrl.split("/").pop().split(".")[0]; // Extract public_id from URL

          // **Step 2: Delete old image from Cloudinary**
          await cloudinary.uploader.destroy(
            `${baseFolder}Stock/${publicId.replace(/%20/g, " ")}`
          );
        } else {
          temp.push(imageUrl);
        }
      }
      oldImages = temp;
    }

    // Update stock images
    updatedFields.image = oldImages;

    // Update only the fields that are provided and exclude 'currentStock'
    for (let key in stockData) {
      if (stockData[key] !== undefined && key !== "currentStock") {
        updatedFields[key] = stockData[key];
      }
    }

    // Update the stock item in the database
    const updatedStock = await Stock.findByIdAndUpdate(
      id,
      { $set: updatedFields },
      { new: true }
    );

    if (!updatedStock) {
      return res.status(500).json({
        success: false,
        message: "Error updating stock",
      });
    }

    // Save the updated stock record
    updatedStock.save();

    // Return a success response
    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data: updatedStock,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      success: false,
      message: "Error updating stock",
      details: error.message,
    });
  }
};

//delete stocks
export const deleteStock = async (req, res) => {
  try {
    const { id } = req.query;

    // Check if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    // Find the stock by ID
    const stock = await Stock.findById(id);

    // Check if the stock exists
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock not found",
      });
    }

    // Check if the stock is already marked as deleted
    if (stock.isDeleted) {
      return res.status(400).json({
        success: false,
        message: "Stock is already deleted. Please contact the support team.",
      });
    }

    // Mark the stock as deleted
    stock.isDeleted = true;
    await stock.save();

    // Return successful response
    return res.status(200).json({
      success: true,
      message: "Stock deleted successfully",
    });
  } catch (error) {
    // Handle potential errors
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the stock",
      details: error.message,
    });
  }
};

export const changeStatus = async (req, res) => {
  try {
    const { id } = req.query;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Stock ID",
      });
    }

    // Find the stock
    const stock = await Stock.findById(id);

    // Check if the stock exists
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "Stock not found",
      });
    }

    // Toggle the isActive status
    stock.isActive = !stock.isActive;
    const updatedStock = await stock.save();

    // Success response
    return res.status(200).json({
      success: true,
      message: `Stock is now ${
        updatedStock.isActive ? "active" : "deactivated"
      }`,
    });
  } catch (err) {
    // Log the error and send a generic error message
    console.error("Error updating stock status:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating stock status",
      errorMessage: err.message,
    });
  }
};

export const downloadExcelSheet = async (req, res) => {
  try {
    // Step 1: Fetch the stock data from MongoDB
    const stocks = await Stock.find({ isDeleted: false });

    // Step 2: Prepare the data for Excel
    const data = stocks.map((stock) => ({
      Name: stock.name,
      Brand: stock.brand || "N/A",
      Size: stock.size,
      CurrentStock: stock.currentStock,
      MRP: stock.mrp || "N/A",
      PurchasingRate: stock.purchasingRate || "N/A",
      BarcodeNumber: stock.barcodeNumber || "N/A",
      Image: stock.image || "N/A",
      IsActive: stock.isActive ? "Active" : "Inactive",
      CreatedAt: stock.createdAt.toISOString(),
      UpdatedAt: stock.updatedAt.toISOString(),
    }));

    // Step 3: Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock");

    // Step 4: Generate the Excel file as a buffer (in-memory)
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    // Step 5: Set the appropriate headers for file download
    res.setHeader("Content-Disposition", "attachment; filename=stocks.xlsx");
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

export const searchStock = async (req, res) => {
  try {
    const { query } = req.query;

    // Handle pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Define search conditions using case-insensitive regex to match multiple fields
    const searchCondition = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } }, // Case-insensitive search
            { brand: { $regex: query, $options: "i" } },
            { size: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    // Find the stocks matching the search condition, including both deleted and non-deleted stocks
    const stocks = await Stock.find(searchCondition)
      .limit(limit) // Convert string to number
      .skip(skip)
      .lean();

    // Check if no stocks are found
    if (stocks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No data found",
      });
    }

    const totalStocks = await Stock.countDocuments(searchCondition);

    // Return the search results along with pagination details
    res.status(200).json({
      success: true,
      message: "Stock retrieved successfully",
      data: stocks,
      totalStocks,
      totalPages: Math.ceil(totalStocks / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error while searching stocks:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while searching stocks",
      errorMessage: error.message,
    });
  }
};

export const fetahAllStockBooking = async (req, res) => {
  try {
    // Set default pagination values if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch bookings with populated fields and pagination
    const bookings = await StockBooking.find()
      .populate("product.product")
      .populate("partner", "name email phone")
      // .populate("customer")
      // .sort({ "scheduleFor.date": 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Count the total number of bookings for pagination calculation
    const totalBookings = await StockBooking.countDocuments();
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
