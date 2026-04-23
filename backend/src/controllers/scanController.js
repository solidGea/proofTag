const scanService = require('../services/scanService');

// Get scan history
exports.getScanHistory = async (req, res) => {
  const { limit } = req.query;
  const history = await scanService.getScanHistory(limit ? parseInt(limit) : 50);

  res.json({
    success: true,
    data: history,
  });
};

// Record a scan (manual record endpoint)
exports.recordScan = async (req, res) => {
  const { barcode, found, productId } = req.body;

  if (!barcode) {
    return res.status(400).json({
      success: false,
      message: 'Barcode is required',
    });
  }

  const scan = await scanService.recordScan(
    barcode,
    found || false,
    productId || null
  );

  res.status(201).json({
    success: true,
    data: scan,
  });
};

// Get scan statistics
exports.getScanStats = async (req, res) => {
  const stats = await scanService.getScanStats();

  res.json({
    success: true,
    data: stats,
  });
};
