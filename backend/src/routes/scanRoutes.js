const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');

// Get scan history
router.get('/history', scanController.getScanHistory);

// Get scan statistics
router.get('/stats', scanController.getScanStats);

// Record a scan manually
router.post('/', scanController.recordScan);

module.exports = router;
