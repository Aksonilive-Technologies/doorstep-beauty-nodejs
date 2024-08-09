const express = require('express');
const router = express.Router();
const customerAddressController = require('../controller/addressController');

// Route to create a new address
router.post('/add', customerAddressController.createAddress);
router.get('/fetch/all', customerAddressController.getAddressesByCustomer);
// router.get('/', customerAddressController.getAddressById);
router.post('/update', customerAddressController.updateAddress);
router.delete('/delete', customerAddressController.deleteAddress);

module.exports = router;
