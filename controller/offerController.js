const Offer = require("../models/offersModel.js");

// Create Offer
const createOffer = async (req, res) => {
  try {
    const {
      offerName,
      offerDescription,
      applicableOn,
      offerValidOn ,
      offerType,
      offerValue,
      offerValidity,
    } = req.body;

    // Validate required fields
    if (
      !offerValue ||
      !offerType ||
      !offerValidOn  ||
      !applicableOn
    ) {
      return res.status(400).send({
        success: false,
        message:
          " offerValue, offerType, offerValidOn , and applicableOn are required fields.",
      });
    }

    const newOffer = new Offer({
      offerName,
      offerDescription,
      applicableOn,
      offerValidOn ,
      offerType,
      offerValue,
      offerValidity,
    });

    await newOffer.save();
    res.status(201).send({
      success: true,
      message: "Offer created successfully",
      data: newOffer,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error creating offer",
      error: error.message,
    });
  }
};

// Get All Offers
const getOffers = async (req, res) => {
  try {
    // Get page and limit from query parameters, or set defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Fetch the offers with pagination
    const offers = await Offer.find()
      .skip(skip)
      .limit(limit);

    // Get the total number of offers to calculate total pages
    const totalOffers = await Offer.countDocuments();

    res.status(200).send({
      success: true,
      message:"offer retrieved successfully",
      data:offers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOffers / limit),
        totalOffers,
        limit,
      },
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error fetching offers",
      error: error.message,
    });
  }
};

// Delete Offer by ID
const deleteOffer = async (req, res) => {
  try {
    const { id } = req.query;
    const offer = await Offer.findById(id);

    if (!offer) {
      return res
        .status(404)
        .send({ success: false, message: "Offer not found" });
    }

    if (offer.isDeleted) {
      return res
        .status(400)
        .send({ success: false, message: "Offer is already deleted" });
    }

    offer.isDeleted = true;
    await offer.save();

    return res
      .status(200)
      .send({ success: true, message: "Offer deleted successfully" });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error deleting offer",
      error: error.message,
    });
  }
};

// Change Offer Status
const changeOfferStatus = async (req, res) => {
  try {
    const { id } = req.query;
    const offer = await Offer.findById(id);

    if (!offer) {
      return res
        .status(404)
        .send({ success: false, message: "Offer not found" });
    }

    offer.isActive = !offer.isActive;
    await offer.save(); // Save the updated offer

    res.status(200).send({
      success: true,
      message: `Offer is ${offer.isActive ? "Activated" : "Deactivated"} now`,
      data:offer,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error updating offer status",
      error: error.message,
    });
  }
};

module.exports = {
  createOffer,
  getOffers,
  deleteOffer,
  changeOfferStatus,
};
