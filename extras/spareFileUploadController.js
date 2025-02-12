import { cloudinary } from "../config/cloudinary.js";
export const uploadProfileImage = async (req, res) => {
  try {
    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "spare_files",
        public_id: `${Date.now()}_${req.file.originalname.split(".")[0]}`,
        overwrite: true,
      });
      imageUrl = result.secure_url;
    }
    return res.json({ link: imageUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({ error: "Image upload failed" });
  }
};
