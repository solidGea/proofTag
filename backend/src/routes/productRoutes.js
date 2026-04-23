const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Verify product by barcode
router.get('/verify/:barcode', productController.verifyProduct);

// Get all products
router.get('/', productController.getAllProducts);

// Search products
router.get('/search', productController.searchProducts);

// Create new product
router.post('/', productController.createProduct);

// Update product
router.put('/:id', productController.updateProduct);

// Delete product
router.delete('/:id', productController.deleteProduct);

module.exports = router;
