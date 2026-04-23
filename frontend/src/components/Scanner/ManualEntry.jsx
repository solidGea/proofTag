import { useState } from 'react';

const ManualEntry = ({ onSubmit }) => {
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!barcode.trim()) {
      setError('Please enter a barcode');
      return;
    }

    if (!/^\d+$/.test(barcode)) {
      setError('Barcode should contain only numbers');
      return;
    }

    onSubmit(barcode.trim());
    setBarcode('');
  };

  return (
    <div className="manual-entry">
      <h3>Manual Barcode Entry</h3>
      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Enter barcode number"
            inputMode="numeric"
            pattern="[0-9]*"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '10px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Verify Barcode
        </button>
      </form>

      <p style={{ marginTop: '15px', color: '#666', fontSize: '14px' }}>
        Enter the barcode manually if camera scanning is not available
      </p>
    </div>
  );
};

export default ManualEntry;
