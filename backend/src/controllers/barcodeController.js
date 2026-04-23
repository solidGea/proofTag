const { readBarcodeFromImage } = require('../services/barcodeReaderService');
const productService = require('../services/productService');

/**
 * Scan barcode from uploaded image
 * POST /api/barcode/scan-image
 */
async function scanBarcodeFromImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    console.log('📸 Received image upload:', req.file.originalname, `(${req.file.size} bytes)`);

    // Read barcode from the uploaded image
    const barcode = await readBarcodeFromImage(req.file.buffer);

    if (!barcode) {
      return res.status(404).json({
        success: false,
        message: 'No barcode detected in image. Please ensure the barcode is clear and well-lit.'
      });
    }

    console.log('✓ Barcode extracted:', barcode);

    // Verify the barcode against database
    const product = await productService.findByBarcode(barcode);

    if (product) {
      return res.json({
        success: true,
        barcode,
        product,
        message: `Product found: ${product.productName}`
      });
    } else {
      return res.json({
        success: true,
        barcode,
        product: null,
        message: `Barcode ${barcode} detected but not found in database`
      });
    }

  } catch (error) {
    console.error('Error scanning barcode from image:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing image: ' + error.message
    });
  }
}

module.exports = {
  scanBarcodeFromImage
};
