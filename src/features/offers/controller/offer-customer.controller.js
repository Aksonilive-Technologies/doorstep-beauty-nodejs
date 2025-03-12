import Cart from "../../cart/model/cart.model.js";
import Offer from "../model/offers.model.js";

export const getOfferByCode = async (req, res) => {
  const { code, customerId } = req.query;
  if (!code || !customerId) {
    return res.status(400).json({ message: "Offer code and customerId is required" });
  }
  try {
    const offer = await Offer.findOne({
      offerCode: code,
      isActive: true,
      isDeleted: false,
    }).lean();
    if (!offer) {
      return res.status(404).json({ success: false, message: "No such coupon found" });
    }
    offer.isEligible = true;
    return res.status(200).json({
      success: true,
      message: "offer retrieved successfully",
      data: offer,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Error fetching offer",
        error: error.message,
      });
  }
};
export const getOffers = async (req, res) => {
    const { customerId } = req.query;
    if (!customerId) {
        return res.status(400).json({ message: "Customer ID is required" });
    }
  try {
    const offers = await Offer.find({
      isActive: true,
      isDeleted: false,
      applicableOn: {
        $in: [
          "wallet_booking",
          "package_booking",
          "credit_card",
          "debit_card",
          "upi",
        ],
      },
    })
      .select("-isDeleted -isActive -__v")
      .lean();
      // Fetch cart items
    const cart = await Cart.find({ customer: customerId }).populate("product").select("-__v");

    const products = cart.map(({ product, quantity, price}) => ({
      product: product._id,
      quantity,
      price,
    }));

    const totalPrice = products.reduce((sum, item) => sum + item.price * item.quantity, 0);
    offers.forEach((offer) => {
        if (offer.applicableOn === "package_booking") {
            if(totalPrice >= offer.offerValidOn && cart.length >= offer.offerValue+2){
                offer.isEligible = true;
            }
        }else{
      offer.isEligible = false;
        }
    });
    return res.status(200).json({ success: true,
        message: "offers retrieved successfully",
        data: offers });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Error fetching offers",
        error: error.message,
      });
  }
};
