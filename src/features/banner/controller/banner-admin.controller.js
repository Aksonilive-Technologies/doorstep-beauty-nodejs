const { default: mongoose } = require("mongoose");
const Banner = require("../model/banner.model.js");
const { cloudinary } = require("../../../../config/cloudinary.js");

exports.addBanner = async (req, res) => {
  const { redirectUrl, bannerImage, position } = req.body; // Required fields to check

  const requiredFields = [
    // { field: redirectUrl, name: "redirectUrl" },
    { field: position, name: "position" },
  ];

  // Check for missing required fields
  for (let i = 0; i < requiredFields.length; i++) {
    if (!requiredFields[i].field) {
      return res.status(400).json({
        success: false,
        message: `${requiredFields[i].name} is required`,
      });
    }
  }

  try {
    // Check if a banner with the same redirectUrl already exists
    // const bannerExist = await Banner.findOne({ redirectUrl });
    // if (bannerExist) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: "Banner already exists" });
    // }

    if (redirectUrl) {
      const bannerExist = await Banner.findOne({ redirectUrl });
      if (bannerExist) {
        return res
          .status(400)
          .json({ success: false, message: "Banner already exists" });
      }
    }

    // Upload the image to Cloudinary if a file is present
    let imageUrl;
    if (req.file) {
      const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || "";
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: baseFolder + "banner",
        public_id: `${Date.now()}_${req.file.originalname.split(".")[0]}`,
        overwrite: true,
      });
      imageUrl = result.secure_url;
    }

    // Create and save the new banner
    const banner = new Banner({
      redirectUrl,
      position,
      image: imageUrl,
    });

    const savedBanner = await banner.save();
    return res.status(201).json({
      success: true,
      message: "Banner added successfully",
      data: savedBanner,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error adding banner",
      errorMessage: err.message,
    });
  }
};

//fetch all banner
exports.getBanner = async (req, res) => {
  try {
    const totalDocuments = await Banner.countDocuments(); // Total number of banners
    const limit = parseInt(req.query.limit) || 10; // Limit of banners per page
    const page = parseInt(req.query.page) || 1; // Current page number
    const startIndex = (page - 1) * limit; // Calculate the starting index

    const banners = await Banner.find()
      .sort({ position: 1 })
      .skip(startIndex)
      .limit(limit);

    const totalPages = Math.ceil(totalDocuments / limit); // Total number of pages

    return res.status(200).json({
      success: "true",
      message: "Banners fetched successfully",
      data: banners,
      totalPages: totalPages,
      currentPage: page,
    });
  } catch (err) {
    return res.status(500).json({
      success: "false",
      message: "Error fetching banners",
      errorMessage: err.message,
    });
  }
};

//update banner
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.query;

    // Validate id
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Banner ID is required",
      });
    }

    // Check if id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Banner ID",
      });
    }

    
    // Upload the image to Cloudinary if a file is present
    let imageUrl;
    if (req.file) {
      const banner = await Banner.findById(id);
      const baseFolder = process.env.CLOUDINARY_BASE_FOLDER || "";
      
      // Delete the existing image from Cloudinary
      const publicId = banner.image.split("/").pop().split(".")[0]; // Extract public_id from URL
      await cloudinary.uploader.destroy(`${baseFolder}banner/${publicId.replace(/%20/g, " ")}`);
          
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: baseFolder+"banner",
        public_id: `${Date.now()}_${req.file.originalname.split(".")[0]}`,
        overwrite: true,
      });
      imageUrl = result.secure_url;
    }

    // Prepare the update object
    const updateData = {
      ...req.body,
    };

    if (imageUrl) {
      updateData.image = imageUrl;
    }
    // console.log(imageUrl);

    // Attempt to update the banner
    const updatedBanner = await Banner.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    // If the banner was not found
    if (!updatedBanner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // Successfully updated
    return res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: updatedBanner,
    });
  } catch (err) {
    // Log error and respond with error message
    console.error("Error updating banner:", err);
    return res.status(500).json({
      success: false,
      message: "Error updating banner",
      errorMessage: err.message,
    });
  }
};

//update status
exports.changeStatus = async (req, res) => {
  try {
    const { id } = req.query;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: "false",
        message: "Invalid Banner ID",
      });
    }

    // Find the banner
    const banner = await Banner.findById(id);

    // Check if the banner exists
    if (!banner) {
      return res.status(404).json({
        success: "false",
        message: "Banner not found",
      });
    }

    // Check if the banner is marked as deleted
    if (banner.isDeleted === true) {
      return res.status(400).json({
        success: "false",
        message: "Your banner is deleted, please contact to support team",
      });
    }

    // Toggle the isActive status
    banner.isActive = !banner.isActive;
    const updatedBanner = await banner.save();

    // Success response
    return res.status(200).json({
      success: "true",
      message: `Banner is now ${
        updatedBanner.isActive ? "active" : "deactivated"
      }`,
    });
  } catch (err) {
    // Log the error and send a generic error message
    console.error("Error updating banner status:", err);
    return res.status(500).json({
      success: "false",
      message: "Error updating banner status",
      errorMessage: err.message,
    });
  }
};

//delete Banner
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.query;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: "false",
        message: "Invalid Banner ID",
      });
    }

    // Find the banner
    const banner = await Banner.findById(id);

    // Check if the banner exists
    if (!banner) {
      return res.status(404).json({
        success: "false",
        message: "Banner not found",
      });
    }

    // Check if the banner is already marked as deleted
    if (banner.isDeleted) {
      return res.status(400).json({
        success: "false",
        message:
          "This banner is already deleted. Please contact the support team.",
      });
    }

    // Mark the banner as deleted
    banner.isDeleted = true;
    await banner.save();

    // Success response
    return res.status(200).json({
      success: "true",
      message: "Banner deleted successfully",
    });
  } catch (err) {
    // Log the error and send a more detailed error response
    console.error("Error deleting banner:", err);
    return res.status(500).json({
      success: "false",
      message: "Error deleting banner",
      errorMessage: err.message,
    });
  }
};
