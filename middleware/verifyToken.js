const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(403).json({ error: "No credentials sent!" });
  }

  const authHeader = req.headers.authorization;

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
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
