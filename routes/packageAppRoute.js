const express = require('express');
const router = express.Router();
const packageController = require('../controller/packageController');

// Route to create a new package

// router.get('/all', packageController.getAllPackages);
// router.get('/:id', packageController.getPackageById);
// router.put('/update/:id', packageController.updatePackage);
// router.delete('/delete/:id', packageController.deletePackage);
router.get('/category/all', packageController.getPackageByCategoryId);

module.exports = router;
