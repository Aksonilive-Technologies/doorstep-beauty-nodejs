const Service = require("../models/serviceModel");

// Create a new service
exports.createService = async (req, res) => {
    const { name, image } = req.body;
  
    try {
      if (!name || name.trim() === "" || !image || image.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Name and image is required",
        });
      }

      const existingService = await Service.findOne({ name ,isActive: true, isDeleted: false});
      if(existingService) {
        return res.status(400).json({
          success: false,
          message: "Service with name "+name+" already exists",
        });
      }

      const newService = new Service({ name, image});
      await newService.save();
  
      res.status(201).json({
        success: true,
        message: "Service created successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error creating service",
        errorMessage: error.message,
      });
    }
  };

// Fetch all services
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find({isActive: true, isDeleted: false}).select("-__v");
    res.status(200).json({
      success: true,
      message: "All services fetched successfully",
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching services",
      errorMessage: error.message,
    });
  }
};

// Fetch a service by ID
exports.getServiceById = async (req, res) => {
  const { id } = req.query;

  try {
    const service = await Service.findById(id).select("-__v");

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (service.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Service not found,this service is deleted",
      });
    }

    if (!service.isActive) {
      return res.status(404).json({
        success: false,
        message: "Service not found.this service is not active",
      });
    }
    res.status(200).json({
      success: true,
      message: "Service fetched successfully",
      data: service,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching service",
      errorMessage: error.message,
    });
  }
};

// Update a service
exports.updateService = async (req, res) => {
  const { id } = req.query;
  const serviceData = req.body;

  try {
    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Update only the fields that are provided
    const updatedFields = {};
    for (let key in serviceData) {
      if (serviceData[key] !== undefined) {
        updatedFields[key] = serviceData[key];
      }
    }

    const updatedService = await Service.findByIdAndUpdate(id, { $set: updatedFields }, { new: true });

    if (!updatedService) {
      return res.status(500).json({
        success: false,
        message: "Error updating service",
      });
    }

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating service",
      errorMessage: error.message,
    });
  }
};

// Delete a service
exports.deleteService = async (req, res) => {
    const { id } = req.query;
  
    try {
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Service ID is required",
        });
      }
  
      const service = await Service.findById(id);
  
      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }
  
      if (service.isDeleted) {
        return res.status(404).json({
          success: false,
          message: "Service is already deleted",
        });
      }
  
      const deletedService = await Service.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  
      if (!deletedService) {
        return res.status(500).json({
          success: false,
          message: "Error deleting service",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Service deleted successfully",
        data: deletedService,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting service",
        errorMessage: error.message,
      });
    }
  };
  