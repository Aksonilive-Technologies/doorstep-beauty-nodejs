const Plan = require("../models/customerMembershipPlan.js");
const Membership = require("../models/membershipModel.js");

exports.getAllMembership = async (req, res) => {
  const customerId = req.params.customerId; // Assuming customerId is passed as a route parameter
  const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
  const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided

  try {
    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Fetch memberships from the database
    const memberships = await Membership.find({
      isActive: true,
      isDeleted: false,
    })
      .skip(skip)
      .limit(limit);

    // Count the total number of matching documents
    const totalPlans = await Membership.countDocuments({
      isActive: true,
      isDeleted: false,
    });

    // Add a new key 'isActivePlan' to each membership object
    const updatedMemberships = memberships.map((membership) => {
      return { ...membership.toObject(), isActivePlan: true };
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalPlans / limit);

    // Check if any memberships were found
    if (!updatedMemberships.length) {
      return res.status(404).json({
        success: false,
        message: "No valid plans found for this customer.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        memberships: updatedMemberships,
      },
      pagination: {
        totalPlans,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
