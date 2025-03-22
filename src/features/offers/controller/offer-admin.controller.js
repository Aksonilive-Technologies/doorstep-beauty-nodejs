import { cloudinary } from "../../../../config/cloudinary.js";
import Offer from "../model/offers.model.js";

// Create Offer
export const createOffer = async (req, res) => {
  try {
    const offerData = req.body;


    // Validate required fields
    if (
      !offerData.offerValue ||
      !offerData.offerType ||
      !offerData.offerCode ||
      !offerData.offerValidOn ||
      !offerData.applicableOn
    ) {
      return res.status(400).send({
        success: false,
        message:
          " offerValue, offerType, offerValidOn, offerCode and applicableOn are required fields.",
      });
    }

    let imageUrl;

    if (req.file) {
      const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || "";
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: baseFolder + "offer",
          public_id: `${Date.now()}_${req.file.originalname.split(".")[0]}`,
          overwrite: true,
        });
        imageUrl = result.secure_url;
      } catch (error) {
        console.error(`Error uploading image to Cloudinary:`, error.message);
        return res.status(500).json({
          success: false,
          message: "Error uploading image",
          errorMessage: error.message,
        });
      }
    }

    // Create a new product with the image URL if available else with the default image

    const newOffer = new Offer({ ...offerData, offerImage: imageUrl });

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
  const { query } = req.query;
  try {
    // Get page and limit from query parameters, or set defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    //search condition
    const searchCondition = query
      ? { isDeleted: false, offerName: { $regex: query, $options: "i" } }
      : { isDeleted: false };

    // Fetch the offers with pagination
    const offers = await Offer.find(searchCondition)
      .skip(skip)
      .limit(limit);

    // Get the total number of offers to calculate total pages
    const totalOffers = offers.length;

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

export default {
  createOffer,
  getOffers,
  deleteOffer,
  changeOfferStatus,
};
