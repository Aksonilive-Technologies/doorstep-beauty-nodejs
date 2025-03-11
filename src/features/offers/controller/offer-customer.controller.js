import Offer from "../model/offers.model.js";

export const getOfferByCode = async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ message: "Offer code is required" });
  }
  try {
    const offer = await Offer.findOne({
      offerCode: code,
      isActive: true,
      isDeleted: false,
    });
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }
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
    offers.forEach((offer) => {
      offer.isEligible = true;
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
