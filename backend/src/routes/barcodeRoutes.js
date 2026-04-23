const express = require('express');
const multer = require('multer');
const { scanBarcodeFromImage } = require('../controllers/barcodeController');

const router = express.Router();

// Configure multer for memory storage (store in buffer, not disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Logging middleware for debugging
router.use((req, res, next) => {
  console.log(`🔍 Barcode route hit: ${req.method} ${req.path}`);
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// POST /api/barcode/scan-image - Upload image and scan for barcode
router.post('/scan-image', upload.single('image'), scanBarcodeFromImage);

module.exports = router;
