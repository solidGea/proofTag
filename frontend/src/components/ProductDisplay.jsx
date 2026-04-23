const ProductDisplay = ({ product, barcode, found }) => {
  if (!found) {
    return (
      <div className="product-display not-found" style={{
        padding: '20px',
        marginTop: '20px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px',
      }}>
        <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>Detected But Not Found</h3>
        <p style={{ margin: 0, color: '#856404' }}>
          Barcode <strong>{barcode}</strong> was detected successfully, but it is not in the database yet.
        </p>
      </div>
    );
  }

  return (
    <div className="product-display found" style={{
      padding: '20px',
      marginTop: '20px',
      backgroundColor: '#d4edda',
      border: '1px solid #28a745',
      borderRadius: '8px',
    }}>
      <h3 style={{ color: '#155724', margin: '0 0 15px 0' }}>✓ Product Verified</h3>
      
      <div style={{ color: '#155724' }}>
        <div style={{ marginBottom: '10px' }}>
          <strong>Barcode:</strong> {product.barcode}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <strong>Product Name:</strong> {product.productName}
        </div>
        {product.measure && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Measure:</strong> {product.measure}
          </div>
        )}
        {product.rating !== null && product.rating !== undefined && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Rating:</strong> {'⭐'.repeat(product.rating)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDisplay;
