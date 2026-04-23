const prisma = require('../utils/prismaClient');

// Record a scan event
exports.recordScan = async (barcode, found, productId = null) => {
  return await prisma.scanHistory.create({
    data: {
      barcode,
      found,
      productId,
    },
  });
};

// Get scan history
exports.getScanHistory = async (limit = 50) => {
  return await prisma.scanHistory.findMany({
    take: limit,
    orderBy: { scannedAt: 'desc' },
    include: {
      product: true,
    },
  });
};

// Get scan statistics
exports.getScanStats = async () => {
  const total = await prisma.scanHistory.count();
  const found = await prisma.scanHistory.count({
    where: { found: true },
  });
  const notFound = total - found;

  return {
    total,
    found,
    notFound,
    successRate: total > 0 ? ((found / total) * 100).toFixed(2) : 0,
  };
};
