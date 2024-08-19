const { default: mongoose } = require("mongoose");
const Membership = require("../models/membershipModel.js");
// const logger = require("../utility/logger.js");

// const createMembership = async (req, res) => {
//   try {
//     const requiredFields = ["tenure", "price"];
//     const missingFields = requiredFields.filter(
//       (field) => !req.body[field] || req.body[field] === null
//     );

//     if (missingFields.length) {
//       return res.status(400).json({
//         success: false,
//         message: `Missing or invalid required fields: ${missingFields.join(
//           ", "
//         )}`,
//       });
//     }

//     // Create a new membership
//     const membership = new Membership(req.body);
//     await membership.save();

//     res.status(201).json({
//       success: true,
//       message: "Membership created successfully",
//       data: membership,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

const fetchMemberships = async (req, res) => {
  const { id, page = 1, limit = 10 } = req.query;

  try {
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    // Check if the membership exists
    const membership = await Membership.findById(id);
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    // Fetch memberships with pagination, sorting, and conditions
    const memberships = await Membership.find({
      _id: id,
      isActive: true,
      isDeleted: false,
    })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }) // Sort by most recent
      .lean();

    // Get the total count of memberships that match the query
    const total = await Membership.countDocuments({
      _id: id,
      isActive: true,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      data: memberships,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      message: "Membership plans fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching membership plans:", error);
    res.status(500).json({
      success: false,
      message: "Error while fetching membership plans",
      error: error.message,
    });
  }
};

module.exports = {
  fetchMemberships,
};
