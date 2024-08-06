const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // next();
  if (!req.headers.authorization) {
    return res
      .status(403)
      .json({
        success: false,
        message: "Login must required!",
        errorMessage: "Authorization key must be added in header",
      });
  }

  const authHeader = req.headers.authorization;


  jwt.verify(authHeader, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to authenticate token",
      });
    }

    // If everything is good, save the decoded info to request for use in other routes
    req.userId = decoded.id;
    next();
  });
};

module.exports = verifyToken;
