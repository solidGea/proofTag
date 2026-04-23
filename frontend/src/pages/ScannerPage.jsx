import { useState, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BarcodeScanner from '../components/Scanner/BarcodeScanner';
import ManualEntry from '../components/Scanner/ManualEntry';
import ProductDisplay from '../components/ProductDisplay';
import { verifyProduct } from '../services/api';

const ScannerPage = () => {
  const [scanMode, setScanMode] = useState('camera');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const scannerRef = useRef(null);

  const getCameraErrorMessage = (err) => {
    if (!window.isSecureContext) {
      return 'Camera needs HTTPS on mobile. Open the HTTPS dev URL and allow the browser certificate first.';
    }

    const errorName = err?.name || err?.message || '';
    if (String(errorName).includes('NotAllowedError')) {
      return 'Camera permission was blocked. Allow camera access in the browser and try again.';
    }

    if (String(errorName).includes('NotFoundError')) {
      return 'No camera was found on this device.';
    }

    return 'Camera access failed. Check browser permission and use the HTTPS dev URL on mobile.';
  };

  const handleScan = async (barcode) => {
    if (scanMode === 'camera' && scannerRef.current) {
      await scannerRef.current.stopScanning();
    }

    setLoading(true);
    setResult(null);

    const loadingToast = toast.loading(`Verifying barcode ${barcode}...`);

    try {
      const response = await verifyProduct(barcode);

      if (response.success) {
        setResult({
          found: true,
          product: response.data,
          barcode,
        });

        toast.update(loadingToast, {
          render: `Product found: ${response.data.productName}`,
          type: 'success',
          isLoading: false,
          autoClose: 5000,
          closeButton: true,
        });
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setResult({
          found: false,
          barcode,
        });

        toast.update(loadingToast, {
          render: `Detected but not found in database: ${barcode}`,
          type: 'warning',
          isLoading: false,
          autoClose: 5000,
          closeButton: true,
        });
      } else {
        console.error('Error verifying product:', error);

        toast.update(loadingToast, {
          render: 'Error verifying product. Please try again.',
          type: 'error',
          isLoading: false,
          autoClose: 5000,
          closeButton: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Scan Product</h2>

      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          borderBottom: '2px solid #ddd',
          paddingBottom: '10px',
        }}
      >
        <button
          onClick={() => setScanMode('camera')}
          style={{
            padding: '10px 20px',
            backgroundColor: scanMode === 'camera' ? '#007bff' : '#f8f9fa',
            color: scanMode === 'camera' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Camera Scan
        </button>
        <button
          onClick={() => setScanMode('manual')}
          style={{
            padding: '10px 20px',
            backgroundColor: scanMode === 'manual' ? '#007bff' : '#f8f9fa',
            color: scanMode === 'manual' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Manual Entry
        </button>
      </div>

      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        {scanMode === 'camera' ? (
          <BarcodeScanner
            ref={scannerRef}
            onScanSuccess={handleScan}
            onScanError={(err) => {
              console.error('Scanner error:', err);
              toast.error(getCameraErrorMessage(err));
            }}
          />
        ) : (
          <ManualEntry onSubmit={handleScan} />
        )}
      </div>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {loading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Verifying product...</p>
        </div>
      )}

      {result && !loading && (
        <ProductDisplay
          product={result.product}
          barcode={result.barcode}
          found={result.found}
        />
      )}
    </div>
  );
};

export default ScannerPage;
