import Offer from "../model/offers.model.js";

// Create Offer
export const createOffer = async (req, res) => {
  try {
    const {
      offerName,
      offerDescription,
      applicableOn,
      offerValidOn,
      offerType,
      offerValue,
      offerValidity,
    } = req.body;

    // Validate required fields
    if (!offerValue || !offerType || !offerValidOn || !applicableOn) {
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
      offerValidOn,
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
export const getOffers = async (req, res) => {
  try {
    // Get page and limit from query parameters, or set defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Fetch the offers with pagination
    const offers = await Offer.find().skip(skip).limit(limit);

    // Get the total number of offers to calculate total pages
    const totalOffers = await Offer.countDocuments();

    res.status(200).send({
      success: true,
      message: "offer retrieved successfully",
      data: offers,
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
export const deleteOffer = async (req, res) => {
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
export const changeOfferStatus = async (req, res) => {
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
      data: offer,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error updating offer status",
      error: error.message,
    });
  }
};

export const searchOffers = async (req, res) => {
  const { query, page = 1, limit = 10 } = req.query;

  try {
    // Create an empty search condition object
    let searchCondition = {};

    // If the `query` param is provided, search across multiple fields
    if (query) {
      searchCondition.$or = [
        { offerName: { $regex: query, $options: "i" } }, // Search in offerName (case-insensitive)
        { offerDescription: { $regex: query, $options: "i" } }, // Search in offerDescription (case-insensitive)
        { applicableOn: { $regex: query, $options: "i" } }, // Search in applicableOn (case-insensitive)
        { offerValidOn: isNaN(Number(query)) ? undefined : Number(query) }, // Search in offerValidOn (must be a number)
        { offerType: { $regex: query, $options: "i" } }, // Search in offerType (case-insensitive)
      ];
    }

    // Fetch data based on the search condition with pagination
    const offers = await Offer.find(searchCondition)
      .sort({ createdAt: -1 }) // Sort by latest offers
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    if (offers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No offer found matching the search criteria",
      });
    }

    // Get the total count of matching offers
    const totalOffers = await Offer.countDocuments(searchCondition);

    // Send the result back to the client
    res.status(200).json({
      success: true,
      message: "Offers retrieved successfully",
      data: offers,
      totalOffers,
      currentPage: page,
      totalPages: Math.ceil(totalOffers / limit),
    });
  } catch (error) {
    // Handle any error during the search process
    console.error("Error searching offers:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while searching offers",
      error: error.message,
    });
  }
};

export default {
  createOffer,
  getOffers,
  deleteOffer,
  changeOfferStatus,
  searchOffers,
};
