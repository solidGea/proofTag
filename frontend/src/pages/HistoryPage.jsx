import { useState, useEffect } from 'react';
import { getScanHistory } from '../services/api';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getScanHistory(50);
      if (response.success) {
        setHistory(response.data);
      }
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <h2>Scan History</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <h2>Scan History</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={loadHistory}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Scan History</h2>
        <button onClick={loadHistory} style={{
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}>
          Refresh
        </button>
      </div>

      {history.length === 0 ? (
        <p>No scan history yet.</p>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={tableHeaderStyle}>Date/Time</th>
                <th style={tableHeaderStyle}>Barcode</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Product</th>
              </tr>
            </thead>
            <tbody>
              {history.map((scan) => (
                <tr key={scan.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={tableCellStyle}>{formatDate(scan.scannedAt)}</td>
                  <td style={tableCellStyle}>{scan.barcode}</td>
                  <td style={tableCellStyle}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: scan.found ? '#d4edda' : '#f8d7da',
                      color: scan.found ? '#155724' : '#721c24',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}>
                      {scan.found ? '✓ Found' : '✗ Not Found'}
                    </span>
                  </td>
                  <td style={tableCellStyle}>
                    {scan.product ? scan.product.productName : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const tableHeaderStyle = {
  padding: '12px',
  textAlign: 'left',
  fontWeight: 'bold',
};

const tableCellStyle = {
  padding: '12px',
};

export default HistoryPage;
