const Stock = require("../model/stock.model.js");

exports.fetchAllStocks = async (req, res) => {
  try {
    // Fetch stocks with pagination, filtering by isActive and isDeleted
    const stocks = await Stock.find({
      currentStock: {
        $gt: 0,
      },
      isActive: true,
      isDeleted: false,
    }).select("-currentStock -__v -entryStock");

    // If no stocks found
    if (stocks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No item found",
      });
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      message: "Successfully retrieved all the items",
      data: stocks,
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

exports.getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.query;

    console.log(barcode);

    // Fetch stock by barcode
    const stock = await Stock.findOne({ barcodeNumber: barcode }).select(
      "-currentStock -__v -entryStock"
    );

    // If no stock found
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: "No item found",
      });
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      message: "Successfully retrieved the item",
      data: stock,
    });
  } catch (error) {
    // Handle potential errors
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the item",
      details: error.message,
    });
  }
};
