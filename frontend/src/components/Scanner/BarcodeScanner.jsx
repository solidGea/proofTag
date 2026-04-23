import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

function checksumMod10(digits) {
  let sum = 0;
  for (let index = digits.length - 1, position = 1; index >= 0; index -= 1, position += 1) {
    const n = Number(digits[index]);
    const weight = position % 2 === 1 ? 3 : 1;
    sum += n * weight;
  }
  return (10 - (sum % 10)) % 10;
}

function isValidEan13(code) {
  if (!/^\d{13}$/.test(code)) return false;
  const body = code.slice(0, 12);
  const check = Number(code[12]);
  return checksumMod10(body) === check;
}

function isValidUpcA(code) {
  if (!/^\d{12}$/.test(code)) return false;
  const body = code.slice(0, 11);
  const check = Number(code[11]);
  return checksumMod10(body) === check;
}

function isValidEan8(code) {
  if (!/^\d{8}$/.test(code)) return false;
  const body = code.slice(0, 7);
  const check = Number(code[7]);
  return checksumMod10(body) === check;
}

function normalizeDigits(raw) {
  return String(raw || '').replace(/\D/g, '');
}

function normalizeBarcodeValue(raw) {
  return String(raw || '').trim();
}

function compactBarcodeValue(raw) {
  return normalizeBarcodeValue(raw).replace(/\s+/g, '');
}

function isRetailFormat(formatName) {
  return ['EAN_13', 'EAN_8', 'UPC_A', 'UPC_E'].includes(String(formatName || '').toUpperCase());
}

function getFriendlyFormatName(formatName) {
  const normalized = String(formatName || 'UNKNOWN').toUpperCase();
  if (normalized === 'UNKNOWN') return 'Unknown';
  return normalized.replace(/_/g, '-');
}

function isAcceptedBarcodeValue(code, formatName) {
  const normalized = compactBarcodeValue(code);
  if (!normalized) return false;

  if (isRetailFormat(formatName)) {
    const digits = normalizeDigits(normalized);
    if (digits.length === 13) return isValidEan13(digits);
    if (digits.length === 12) return isValidUpcA(digits);
    if (digits.length === 8) return isValidEan8(digits);
    return false;
  }

  if (/^\d+$/.test(normalized)) {
    return normalized.length >= 4 && normalized.length <= 32;
  }

  if (/^[A-Z0-9\-.$/+% ]+$/i.test(normalized)) {
    return normalized.length >= 3 && normalized.length <= 64;
  }

  return normalized.length >= 3;
}

function pickBestRearCamera(cameras) {
  if (!Array.isArray(cameras) || cameras.length === 0) return null;

  const scoreCameraLabel = (label) => {
    const normalized = String(label || '').toLowerCase();
    let score = 0;
    if (normalized.includes('back') || normalized.includes('rear') || normalized.includes('environment')) score += 4;
    if (normalized.includes('wide')) score += 2;
    if (normalized.includes('main')) score += 1;
    if (normalized.includes('front') || normalized.includes('user')) score -= 5;
    return score;
  };

  return [...cameras].sort((left, right) => {
    return scoreCameraLabel(right.label) - scoreCameraLabel(left.label);
  })[0];
}

const BarcodeScanner = forwardRef(({ onScanSuccess, onScanError }, ref) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [statusText, setStatusText] = useState('idle');
  const [lastDecoded, setLastDecoded] = useState(null);
  const [debugEnabled, setDebugEnabled] = useState(true);
  const [debugImage, setDebugImage] = useState(null);
  const [debugMeta, setDebugMeta] = useState({
    fallbackRuns: 0,
    lastDecodeError: null,
    crop: null,
    camera: null,
    lastFormat: null,
  });

  const scannerIdRef = useRef(
    `html5qr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
  const html5QrRef = useRef(null);
  const stoppedRef = useRef(false);
  const rejectedUntilRef = useRef(new Map());
  const fileInputRef = useRef(null);
  const manualDecodeTimerRef = useRef(null);
  const manualDecodeBusyRef = useRef(false);

  const DB_CHECK_COOLDOWN_MS = 3000;
  const FRAME_WIDTH_RATIO = 0.8;
  const FRAME_HEIGHT_RATIO = 0.4;
  const FALLBACK_INTERVAL_MS = 700;

  const clearManualDecodeTimer = () => {
    if (manualDecodeTimerRef.current) {
      clearInterval(manualDecodeTimerRef.current);
      manualDecodeTimerRef.current = null;
    }
  };

  const stopScanning = async () => {
    stoppedRef.current = true;
    setIsScanning(false);
    clearManualDecodeTimer();
    manualDecodeBusyRef.current = false;

    const instance = html5QrRef.current;
    html5QrRef.current = null;

    if (!instance) return;

    try {
      if (instance.isScanning) {
        await instance.stop();
      }
    } catch (e) {
      // ignore stop errors (often happens during teardown)
      console.warn('stop error:', e);
    }

    try {
      instance.clear();
    } catch (e) {
      console.warn('clear error:', e);
    }
  };

  const ensureInstance = () => {
    if (html5QrRef.current) return html5QrRef.current;

    const formatsToSupport = [
      Html5QrcodeSupportedFormats.QR_CODE,
      Html5QrcodeSupportedFormats.AZTEC,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
      Html5QrcodeSupportedFormats.CODE_93,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.CODABAR,
      Html5QrcodeSupportedFormats.ITF,
      Html5QrcodeSupportedFormats.DATA_MATRIX,
      Html5QrcodeSupportedFormats.MAXICODE,
      Html5QrcodeSupportedFormats.PDF_417,
      Html5QrcodeSupportedFormats.RSS_14,
      Html5QrcodeSupportedFormats.RSS_EXPANDED,
    ];

    const html5Qr = new Html5Qrcode(scannerIdRef.current, {
      verbose: false,
      formatsToSupport,
      useBarCodeDetectorIfSupported: false,
    });
    html5QrRef.current = html5Qr;
    return html5Qr;
  };

  const handleDecodedBarcode = async (rawCode, formatName) => {
    const normalized = compactBarcodeValue(rawCode);
    if (!normalized) return;
    const normalizedFormat = String(formatName || 'UNKNOWN').toUpperCase();

    const valueForLookup = isRetailFormat(normalizedFormat) ? normalizeDigits(normalized) : normalized;
    if (!valueForLookup) return;

    setLastDecoded(valueForLookup);
    setDebugMeta((prev) => ({
      ...prev,
      lastFormat: normalizedFormat,
    }));

    if (!isAcceptedBarcodeValue(normalized, normalizedFormat)) {
      setStatusText('invalid read, try steady...');
      return;
    }

    // If we already know this code is not in DB, skip for a short cooldown
    const now = Date.now();
    const rejectedUntil = rejectedUntilRef.current.get(valueForLookup) || 0;
    if (now < rejectedUntil) return;

    setStatusText('checking database...');
    try {
      const resp = await fetch(
        `/api/products/verify/${encodeURIComponent(valueForLookup)}?record=0`,
        { headers: { Accept: 'application/json' } }
      );

      if (resp.ok) {
        setStatusText('verified');
        onScanSuccess(valueForLookup);
        await stopScanning();
        return;
      }

      if (resp.status === 404) {
        setStatusText('detected but not found in DB');
        await stopScanning();
        onScanSuccess(valueForLookup);
        return;
      }

      setStatusText('DB check failed, keep scanning...');
    } catch (e) {
      console.error('DB check error:', e);
      setStatusText('DB check error, keep scanning...');
    }
  };

  const captureCurrentFrameAndDecode = async () => {
    if (stoppedRef.current || manualDecodeBusyRef.current) return;

    const container = document.getElementById(scannerIdRef.current);
    const video = container?.querySelector('video');
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      return;
    }

    manualDecodeBusyRef.current = true;

    try {
      const sourceWidth = video.videoWidth;
      const sourceHeight = video.videoHeight;
      const html5Qr = ensureInstance();
      const guideWidth = Math.floor(sourceWidth * FRAME_WIDTH_RATIO);
      const guideHeight = Math.floor(sourceHeight * FRAME_HEIGHT_RATIO);
      const guideX = Math.floor((sourceWidth - guideWidth) / 2);
      const guideY = Math.floor((sourceHeight - guideHeight) / 2);
      const preprocessAttempts = [
        {
          name: 'raw',
          apply: () => {},
        },
        {
          name: 'grayscale-contrast',
          apply: (attemptContext, width, height) => {
            const imageData = attemptContext.getImageData(0, 0, width, height);
            const { data } = imageData;
            for (let index = 0; index < data.length; index += 4) {
              const gray = Math.round(data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114);
              const boosted = gray > 155 ? 255 : gray < 95 ? 0 : gray;
              data[index] = boosted;
              data[index + 1] = boosted;
              data[index + 2] = boosted;
            }
            attemptContext.putImageData(imageData, 0, 0);
          },
        },
        {
          name: 'binary-threshold',
          apply: (attemptContext, width, height) => {
            const imageData = attemptContext.getImageData(0, 0, width, height);
            const { data } = imageData;
            for (let index = 0; index < data.length; index += 4) {
              const gray = Math.round(data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114);
              const thresholded = gray > 135 ? 255 : 0;
              data[index] = thresholded;
              data[index + 1] = thresholded;
              data[index + 2] = thresholded;
            }
            attemptContext.putImageData(imageData, 0, 0);
          },
        },
      ];

      let decodedText = null;
      let lastErrorMessage = 'No barcode detected from fallback frame';
      let winningDebugImage = null;
      let winningCrop = null;

      const cropCandidates = [
        { widthRatio: 0.56, heightRatio: 0.18, offsetYRatio: -0.08, upscale: 4, name: 'strip-upper' },
        { widthRatio: 0.62, heightRatio: 0.18, offsetYRatio: 0, upscale: 4, name: 'strip-center' },
        { widthRatio: 0.68, heightRatio: 0.2, offsetYRatio: 0.08, upscale: 4, name: 'strip-lower' },
        { widthRatio: 0.58, heightRatio: 0.32, offsetYRatio: 0, upscale: 3, name: 'box-center' },
        { widthRatio: 0.72, heightRatio: 0.34, offsetYRatio: 0, upscale: 3, name: 'box-wide' },
      ];

      for (const candidate of cropCandidates) {
        const cropWidth = Math.floor(guideWidth * candidate.widthRatio);
        const cropHeight = Math.floor(guideHeight * candidate.heightRatio);
        const cropX = Math.floor(guideX + (guideWidth - cropWidth) / 2);
        const cropY = Math.floor(
          guideY + (guideHeight - cropHeight) / 2 + guideHeight * candidate.offsetYRatio
        );

        const baseCanvas = document.createElement('canvas');
        baseCanvas.width = cropWidth * candidate.upscale;
        baseCanvas.height = cropHeight * candidate.upscale;

        const baseContext = baseCanvas.getContext('2d', { willReadFrequently: true });
        if (!baseContext) continue;

        baseContext.drawImage(
          video,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          0,
          0,
          baseCanvas.width,
          baseCanvas.height
        );

        if (debugEnabled && !winningDebugImage) {
          setDebugImage(baseCanvas.toDataURL('image/png'));
          setDebugMeta((prev) => ({
            ...prev,
            fallbackRuns: prev.fallbackRuns + 1,
            crop: {
              sourceWidth,
              sourceHeight,
              cropX,
              cropY,
              cropWidth: baseCanvas.width,
              cropHeight: baseCanvas.height,
            },
          }));
        }

        for (const attempt of preprocessAttempts) {
          const attemptCanvas = document.createElement('canvas');
          attemptCanvas.width = baseCanvas.width;
          attemptCanvas.height = baseCanvas.height;
          const attemptContext = attemptCanvas.getContext('2d', { willReadFrequently: true });
          if (!attemptContext) continue;

          attemptContext.drawImage(baseCanvas, 0, 0);
          attempt.apply(attemptContext, attemptCanvas.width, attemptCanvas.height);

          const blob = await new Promise((resolve) => attemptCanvas.toBlob(resolve, 'image/png', 1));
          if (!blob) continue;

          const frameFile = new File(
            [blob],
            `camera-frame-${candidate.name}-${attempt.name}.png`,
            { type: 'image/png' }
          );

          try {
            const result = await html5Qr.scanFileV2(frameFile, false);
            if (result?.decodedText) {
              decodedText = result.decodedText;
              winningDebugImage = attemptCanvas.toDataURL('image/png');
              winningCrop = {
                sourceWidth,
                sourceHeight,
                cropX,
                cropY,
                cropWidth: baseCanvas.width,
                cropHeight: baseCanvas.height,
              };
              break;
            }
          } catch (decodeAttemptError) {
            lastErrorMessage =
              decodeAttemptError?.message ||
              `No barcode detected from ${candidate.name}/${attempt.name}`;
          }
        }

        if (decodedText) {
          break;
        }
      }

      if (decodedText) {
        setStatusText('decoded from frame...');
        setDebugMeta((prev) => ({
          ...prev,
          lastDecodeError: null,
        }));
        if (debugEnabled && winningDebugImage && winningCrop) {
          setDebugImage(winningDebugImage);
          setDebugMeta((prev) => ({
            ...prev,
            crop: winningCrop,
          }));
        }
        await handleDecodedBarcode(decodedText);
      } else if (debugEnabled) {
        setDebugMeta((prev) => ({
          ...prev,
          lastDecodeError: lastErrorMessage,
        }));
      }
    } catch (decodeError) {
      if (debugEnabled) {
        setDebugMeta((prev) => ({
          ...prev,
          lastDecodeError: decodeError?.message || 'No barcode detected from fallback frame',
        }));
      }
    } finally {
      manualDecodeBusyRef.current = false;
    }
  };

  const startScanning = async () => {
    try {
      await stopScanning();

      stoppedRef.current = false;
      rejectedUntilRef.current = new Map();
      setError(null);
      setStatusText('starting...');
      setLastDecoded(null);
      setDebugImage(null);
      setDebugMeta({
        fallbackRuns: 0,
        lastDecodeError: null,
        crop: null,
        camera: null,
        lastFormat: null,
      });

      const html5Qr = ensureInstance();
      const cameras = await Html5Qrcode.getCameras();
      const preferredCamera = pickBestRearCamera(cameras);

      const qrbox = (viewfinderWidth, viewfinderHeight) => {
        // Match the green box: wide and short area in the middle
        const width = Math.floor(viewfinderWidth * FRAME_WIDTH_RATIO);
        const height = Math.floor(viewfinderHeight * FRAME_HEIGHT_RATIO);
        return { width, height };
      };

      const onSuccess = async (decodedText, result) => {
        if (stoppedRef.current) return;
        await handleDecodedBarcode(
          decodedText,
          result?.result?.format?.formatName || result?.result?.format?.toString?.()
        );
      };

      const onFailure = (errorMessage) => {
        if (stoppedRef.current) return;
        // html5-qrcode calls this continuously for "no code found"—don’t surface it.
        if (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('no code')) {
          setStatusText('scanning...');
          return;
        }
        setStatusText('scanning...');
      };

      await html5Qr.start(
        preferredCamera?.id || { facingMode: 'environment' },
        {
          fps: 18,
          qrbox,
          disableFlip: true,
          aspectRatio: 1.7777778,
          videoConstraints: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        onSuccess,
        onFailure
      );

      try {
        const capabilities = html5Qr.getRunningTrackCapabilities();
        const settings = html5Qr.getRunningTrackSettings();
        const advanced = [];

        if (capabilities.focusMode) advanced.push({ focusMode: 'continuous' });
        if (capabilities.exposureMode) advanced.push({ exposureMode: 'continuous' });
        if (capabilities.whiteBalanceMode) advanced.push({ whiteBalanceMode: 'continuous' });

        if (advanced.length > 0) {
          await html5Qr.applyVideoConstraints({ advanced });
        }

        setDebugMeta((prev) => ({
          ...prev,
          camera: {
            selected: preferredCamera?.label || 'environment',
            width: settings.width || null,
            height: settings.height || null,
            focusModeSupported: Boolean(capabilities.focusMode),
            exposureModeSupported: Boolean(capabilities.exposureMode),
            torchSupported: Boolean(capabilities.torch),
          },
        }));
      } catch (constraintError) {
        setDebugMeta((prev) => ({
          ...prev,
          camera: {
            selected: preferredCamera?.label || 'environment',
            constraintError:
              constraintError?.message || 'Unable to apply smart camera constraints',
          },
        }));
      }

      if (stoppedRef.current) {
        await stopScanning();
        return;
      }

      setIsScanning(true);
      setStatusText('scanning...');
      manualDecodeTimerRef.current = setInterval(() => {
        captureCurrentFrameAndDecode();
      }, FALLBACK_INTERVAL_MS);
    } catch (e) {
      console.error('Error starting scanner:', e);
      setError('Failed to start camera. Please check permissions.');
      setStatusText('error');
      await stopScanning();
      if (onScanError) onScanError(e);
    }
  };

  const scanFromImageFile = async (file) => {
    if (!file) return;

    try {
      await stopScanning();
      stoppedRef.current = false;
      rejectedUntilRef.current = new Map();
      setError(null);
      setLastDecoded(null);
      setStatusText('decoding image...');

      const html5Qr = ensureInstance();
      const result = await html5Qr.scanFileV2(file, false);
      await handleDecodedBarcode(
        result?.decodedText,
        result?.result?.format?.formatName || result?.result?.format?.toString?.()
      );
    } catch (e) {
      console.error('scanFile error:', e);
      setError('Failed to decode image. Try a clearer image or zoom in.');
      setStatusText('error');
      if (onScanError) onScanError(e);
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleScanning = () => {
    if (isScanning) stopScanning();
    else startScanning();
  };

  useImperativeHandle(ref, () => ({
    stopScanning,
    startScanning,
    isScanning,
  }));

  return (
    <div className="barcode-scanner">
      <style>
        {`
          @keyframes scan-line {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          .scan-region {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            height: 40%;
            border: 2px solid #00ff00;
            border-radius: 8px;
            z-index: 10;
            pointer-events: none;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
          }

          .scan-line {
            position: absolute;
            left: 0;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent, #00ff00, transparent);
            animation: scan-line 2s linear infinite;
            box-shadow: 0 0 10px #00ff00;
          }

          .scan-corners {
            position: absolute;
            inset: 0;
          }

          .scan-corner {
            position: absolute;
            width: 20px;
            height: 20px;
            border: 3px solid #00ff00;
          }

          .corner-tl { top: -3px; left: -3px; border-right: none; border-bottom: none; }
          .corner-tr { top: -3px; right: -3px; border-left: none; border-bottom: none; }
          .corner-bl { bottom: -3px; left: -3px; border-right: none; border-top: none; }
          .corner-br { bottom: -3px; right: -3px; border-left: none; border-top: none; }

          .processing-indicator {
            position: absolute;
            top: 60%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 11;
            animation: pulse 1s ease-in-out infinite;
          }

          #${scannerIdRef.current} video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover;
          }
        `}
      </style>

      <div
        className="scanner-container"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '600px',
          height: '400px',
          margin: '0 auto',
          backgroundColor: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <div
          id={scannerIdRef.current}
          style={{ width: '100%', height: '100%' }}
        />

        {isScanning && (
          <>
            <div className="scan-region">
              <div className="scan-line"></div>
              <div className="scan-corners">
                <div className="scan-corner corner-tl"></div>
                <div className="scan-corner corner-tr"></div>
                <div className="scan-corner corner-bl"></div>
                <div className="scan-corner corner-br"></div>
              </div>
            </div>

            <div
              style={{
                position: 'absolute',
                top: '15%',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#00ff00',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                zIndex: 12,
                textAlign: 'center',
                textShadow: '0 0 10px #00ff00',
                whiteSpace: 'nowrap',
              }}
            >
              Align barcode in green box
              <span
                style={{
                  display: 'block',
                  fontSize: '12px',
                  marginTop: '4px',
                  color: '#ffd700',
                }}
              >
                Status: {statusText}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '12px',
                  marginTop: '4px',
                  color: '#9be7ff',
                }}
              >
                Format: {getFriendlyFormatName(debugMeta.lastFormat)}
              </span>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          // reset so the same file can be re-picked
          e.target.value = '';
          scanFromImageFile(file);
        }}
      />

      <button
        onClick={toggleScanning}
        style={{
          marginTop: '15px',
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: isScanning ? '#dc3545' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        {isScanning ? 'Stop Scanner' : error ? 'Start Scanner Again' : 'Start Scanner'}
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        style={{
          marginTop: '10px',
          marginLeft: '10px',
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Scan From Image
      </button>

      <button
        onClick={() => setDebugEnabled((prev) => !prev)}
        style={{
          marginTop: '10px',
          marginLeft: '10px',
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: debugEnabled ? '#495057' : '#adb5bd',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        {debugEnabled ? 'Hide Debug' : 'Show Debug'}
      </button>

      <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
        {isScanning
          ? 'Point your camera at a QR code or barcode'
          : 'Click "Start Scanner" to begin scanning'}
      </p>

      {lastDecoded && (
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#333' }}>
          <strong>Last decoded:</strong> {lastDecoded}
          {debugMeta.lastFormat ? ` (${getFriendlyFormatName(debugMeta.lastFormat)})` : ''}
        </div>
      )}

      {debugEnabled && (
        <div
          style={{
            marginTop: '16px',
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
            Scanner Debug
          </div>

          <div style={{ fontSize: '13px', color: '#333', marginBottom: '6px' }}>
            <strong>Status:</strong> {statusText}
          </div>
          <div style={{ fontSize: '13px', color: '#333', marginBottom: '6px' }}>
            <strong>Fallback runs:</strong> {debugMeta.fallbackRuns}
          </div>
          <div style={{ fontSize: '13px', color: '#333', marginBottom: '10px' }}>
            <strong>Last fallback error:</strong> {debugMeta.lastDecodeError || 'none'}
          </div>
          <div style={{ fontSize: '13px', color: '#333', marginBottom: '10px' }}>
            <strong>Last format:</strong> {getFriendlyFormatName(debugMeta.lastFormat)}
          </div>

          {debugMeta.crop && (
            <div style={{ fontSize: '12px', color: '#555', marginBottom: '10px' }}>
              <strong>Crop:</strong>{' '}
              {`${debugMeta.crop.cropWidth}x${debugMeta.crop.cropHeight} at (${debugMeta.crop.cropX}, ${debugMeta.crop.cropY}) from ${debugMeta.crop.sourceWidth}x${debugMeta.crop.sourceHeight}`}
            </div>
          )}

          {debugMeta.camera && (
            <div style={{ fontSize: '12px', color: '#555', marginBottom: '10px' }}>
              <strong>Camera:</strong>{' '}
              {debugMeta.camera.selected || 'unknown'}
              {debugMeta.camera.width && debugMeta.camera.height
                ? ` | ${debugMeta.camera.width}x${debugMeta.camera.height}`
                : ''}
              {typeof debugMeta.camera.focusModeSupported === 'boolean'
                ? ` | focus:auto=${debugMeta.camera.focusModeSupported}`
                : ''}
              {typeof debugMeta.camera.exposureModeSupported === 'boolean'
                ? ` | exposure:auto=${debugMeta.camera.exposureModeSupported}`
                : ''}
              {typeof debugMeta.camera.torchSupported === 'boolean'
                ? ` | torch=${debugMeta.camera.torchSupported}`
                : ''}
              {debugMeta.camera.constraintError ? ` | ${debugMeta.camera.constraintError}` : ''}
            </div>
          )}

          {debugImage ? (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
                Cropped frame preview
              </div>
              <img
                src={debugImage}
                alt="Scanner crop debug"
                style={{
                  width: '100%',
                  maxWidth: '420px',
                  borderRadius: '8px',
                  border: '1px solid #ced4da',
                  backgroundColor: '#fff',
                }}
              />
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#666' }}>
              Cropped frame preview will appear after fallback decode starts.
            </div>
          )}
        </div>
      )}

      {!isScanning && (
        <div
          style={{
            marginTop: '10px',
            padding: '12px',
            backgroundColor: '#d1ecf1',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#0c5460',
            border: '2px solid #bee5eb',
          }}
        >
          <strong>Pro Tip:</strong> If camera scanning is tricky, use{' '}
          <strong style={{ color: '#007bff' }}>"Manual Entry"</strong> and type the barcode number.
          <div style={{ marginTop: '8px', fontSize: '12px', fontStyle: 'italic' }}>
            Example: 0123456789012
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px' }}>
            The camera scanner also retries decoding from the visible frame automatically.
          </div>
        </div>
      )}
    </div>
  );
});

BarcodeScanner.displayName = 'BarcodeScanner';

export default BarcodeScanner;
