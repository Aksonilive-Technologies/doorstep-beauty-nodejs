import Banner from "../model/banner.model.js";

//fetch all banner for App
export const getBannerForApp = async (req, res) => {
  try {
    const banners = await Banner.find({
      isDeleted: false,
      isActive: true,
    }).sort({ position: 1 });
    if (!banners || banners.length === 0) {
      return res.status(404).json({
        success: "false",
        message: "No banners found",
      });
    }
    return res.status(200).json({
      success: "true",
      message: "Banners fetched successfully",
      data: banners,
    });
  } catch (err) {
    return res.status(500).json({
      success: "false",
      message: "Error fetching banners",
      errorMessage: err.message,
    });
  }
};
