const express = require('express');
const router = express.Router();
const packageController = require('../controller/packageAdminController');

// Route to create a new package
router.post('/create', packageController.createPackage);
router.get('/all', packageController.getAllPackages);
// router.get('/:id', packageController.getPackageById);
router.put('/update', packageController.updatePackage);
router.put('/delete', packageController.deletePackage);
router.put('/change-status', packageController.updatePackageStatus);


module.exports = router;
