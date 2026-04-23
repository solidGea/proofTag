const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const execAsync = promisify(exec);

/**
 * Read barcode from image buffer using zbarimg
 * @param {Buffer} imageBuffer - Image file buffer
 * @returns {Promise<string|null>} - Decoded barcode value or null
 */
async function readBarcodeFromImage(imageBuffer) {
  let tempPath = null;
  
  try {
    console.log('📷 Processing image for barcode detection...');
    console.log(`📐 Image size: ${imageBuffer.length} bytes`);
    
    // Save temporary file
    tempPath = path.join('/tmp', `barcode-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`);
    await fs.writeFile(tempPath, imageBuffer);
    
    console.log(`💾 Saved temp file: ${tempPath}`);
    
    // Save one test image for debugging (only first one)
    const debugPath = '/tmp/test-barcode-debug.jpg';
    try {
      await fs.access(debugPath);
    } catch {
      await fs.copyFile(tempPath, debugPath);
      console.log(`🔍 Debug image saved to: ${debugPath}`);
    }
    
    // Use zbarimg with all barcode types enabled (-S*.enable for EAN codes)
    try {
      const { stdout, stderr } = await execAsync(`zbarimg -S*.enable --raw "${tempPath}"`);
      
      if (stdout && stdout.trim()) {
        const barcode = stdout.trim().split('\n')[0]; // Get first barcode if multiple
        console.log('✅ Barcode detected:', barcode);
        return barcode;
      }
      
      console.log('⚠ No barcode detected');
      return null;
      
    } catch (zbarError) {
      // zbarimg returns exit code 4 when no barcode found
      if (zbarError.code === 4) {
        console.log('⚠ No barcode found (exit code 4)');
        return null;
      }
      
      console.error('❌ zbarimg error:', zbarError.message);
      throw zbarError;
    }
    
  } catch (error) {
    console.error('Error reading barcode from image:', error);
    throw new Error('Failed to process image: ' + error.message);
  } finally {
    // Clean up temp file
    if (tempPath) {
      try {
        await fs.unlink(tempPath);
        console.log(`🗑️ Cleaned up temp file: ${tempPath}`);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError.message);
      }
    }
  }
}

module.exports = {
  readBarcodeFromImage
};
