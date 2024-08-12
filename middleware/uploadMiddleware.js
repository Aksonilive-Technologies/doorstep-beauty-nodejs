const multer = require("multer");
const path = require("path");

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
    fileSize: 2 * 1024 * 1024, // 2MB file size limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only .jpeg, .jpg and .png files are allowed!"));
    }
  },
});

// Export the middleware to handle single image upload
exports.uploadSingleImage = upload.single("image");
