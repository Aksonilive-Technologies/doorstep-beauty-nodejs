const express = require('express');
const router = express.Router();
const packageController = require('../controller/packageController');

// Route to create a new package
router.post('/create', packageController.createPackage);
router.get('/all', packageController.getAllPackages);
// router.get('/:id', packageController.getPackageById);
router.put('/update', packageController.updatePackage);
router.put('/delete', packageController.deletePackage);


module.exports = router;
