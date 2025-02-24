import PartnerCart from "../../partner-cart/model/partner-cart.model.js";
import Stock from "../model/stock.model.js";

export const fetchAllStocks = async (req, res) => {
  try {
    const { partnerId } = req.query;
    // Fetch stocks with pagination, filtering by isActive and isDeleted
    let stocks = await Stock.find({
      currentStock: {
        $gt: 0,
      },
      isActive: true,
      isDeleted: false,
    }).select("-currentStock -__v -entryStock").sort({ position: 1 }).lean();

    // If no stocks found
    if (stocks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No item found",
      });
    }

    if (partnerId) {
      const cartProducts = await PartnerCart.find({ partner: partnerId }).select(
        "-__v"
      );

      stocks = stocks.map((stock) => {
        const cartItem = cartProducts.find(
          (cartProduct) =>
            cartProduct.stockItem.toString() === stock._id.toString()
        );

        return {
          ...stock,
          cartQuantity: cartItem ? cartItem.quantity : 0, // Set cartQuantity to 0 if not in cart
          cartItemID: cartItem ? cartItem._id : null,
        };
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

export const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.query;

    // console.log(barcode);

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
