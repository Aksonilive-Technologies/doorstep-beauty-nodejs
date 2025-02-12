import multer from "multer";
import path from "path";

// Configure storage for multer
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});

// Multer configuration
const upload = multer({
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB file size limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only .jpeg, .jpg, .webp and .png files are allowed!"));
    }
  },
});

// Export the middleware to handle single image upload
export const uploadSingleImage = upload.single("image");

// Export the middleware to handle multiple image upload
export const uploadMultipleImages = upload.array("images", 10);
