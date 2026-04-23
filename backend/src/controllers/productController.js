const productService = require('../services/productService');
const scanService = require('../services/scanService');

function getBarcodeCandidates(barcode) {
  const cleaned = String(barcode || '').trim();
  const candidates = [];

  if (cleaned) candidates.push(cleaned);
  if (cleaned) candidates.push(cleaned.replace(/\s+/g, ''));

  // Common normalization between EAN-13 and UPC-A representations
  // - Some scanners return EAN-13 with leading "0" for UPC-A codes
  // - Some databases store UPC-A as 12 digits (no leading 0)
  if (/^\d+$/.test(cleaned)) {
    if (cleaned.length === 13 && cleaned.startsWith('0')) {
      candidates.push(cleaned.slice(1));
    }
    if (cleaned.length === 12) {
      candidates.push(`0${cleaned}`);
    }
  }

  // Support alphanumeric barcode families where case or spacing can vary.
  if (/[a-z]/i.test(cleaned)) {
    candidates.push(cleaned.toUpperCase());
    candidates.push(cleaned.toLowerCase());
    candidates.push(cleaned.replace(/\s+/g, '').toUpperCase());
    candidates.push(cleaned.replace(/\s+/g, '').toLowerCase());
  }

  return [...new Set(candidates)];
}

// Verify product by barcode
exports.verifyProduct = async (req, res) => {
  const { barcode } = req.params;
  const record = String(req.query.record ?? '1').toLowerCase() !== '0' &&
    String(req.query.record ?? '1').toLowerCase() !== 'false';

  if (!barcode) {
    return res.status(400).json({
      success: false,
      message: 'Barcode is required',
    });
  }

  const candidates = getBarcodeCandidates(barcode);

  let product = null;
  for (const candidate of candidates) {
    product = await productService.findByBarcode(candidate);
    if (product) break;
  }

  // Record the scan
  if (record) {
    await scanService.recordScan(String(barcode).trim(), !!product, product?.id);
  }

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Barcode detected but not found in database',
      barcode: String(barcode).trim(),
    });
  }

  res.json({
    success: true,
    data: product,
  });
};

// Get all products
exports.getAllProducts = async (req, res) => {
  const products = await productService.getAllProducts();
  res.json({
    success: true,
    data: products,
  });
};

// Create new product
exports.createProduct = async (req, res) => {
  const { barcode, productName, measure, rating } = req.body;

  if (!barcode || !productName) {
    return res.status(400).json({
      success: false,
      message: 'Barcode and product name are required',
    });
  }

  const product = await productService.createProduct({
    barcode,
    productName,
    measure,
    rating: rating ? parseInt(rating) : null,
  });

  res.status(201).json({
    success: true,
    data: product,
  });
};

// Update product
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { barcode, productName, measure, rating } = req.body;

  const product = await productService.updateProduct(id, {
    barcode,
    productName,
    measure,
    rating: rating ? parseInt(rating) : null,
  });

  res.json({
    success: true,
    data: product,
  });
};

// Delete product
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  await productService.deleteProduct(id);

  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
};

// Search products
exports.searchProducts = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Search query is required',
    });
  }

  const products = await productService.searchProducts(q);

  res.json({
    success: true,
    data: products,
  });
};
