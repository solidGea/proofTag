const prisma = require('../utils/prismaClient');

// Find product by barcode
exports.findByBarcode = async (barcode) => {
  return await prisma.product.findUnique({
    where: { barcode },
  });
};

// Get all products
exports.getAllProducts = async () => {
  return await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  });
};

// Create new product
exports.createProduct = async (data) => {
  return await prisma.product.create({
    data,
  });
};

// Update product
exports.updateProduct = async (id, data) => {
  return await prisma.product.update({
    where: { id: parseInt(id) },
    data,
  });
};

// Delete product
exports.deleteProduct = async (id) => {
  return await prisma.product.delete({
    where: { id: parseInt(id) },
  });
};

// Search products
exports.searchProducts = async (query) => {
  return await prisma.product.findMany({
    where: {
      OR: [
        { barcode: { contains: query } },
        { productName: { contains: query } },
      ],
    },
    take: 20,
  });
};
