import { useState, useEffect } from 'react';
import { getAllProducts, createProduct, updateProduct, deleteProduct } from '../services/api';

const AdminPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    barcode: '',
    productName: '',
    measure: '',
    rating: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await getAllProducts();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      alert('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.barcode || !formData.productName) {
      alert('Barcode and Product Name are required');
      return;
    }

    try {
      const productData = {
        ...formData,
        rating: formData.rating ? parseInt(formData.rating) : null,
      };

      if (editingId) {
        await updateProduct(editingId, productData);
        alert('Product updated successfully');
      } else {
        await createProduct(productData);
        alert('Product added successfully');
      }

      resetForm();
      loadProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      alert(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setFormData({
      barcode: product.barcode,
      productName: product.productName,
      measure: product.measure || '',
      rating: product.rating?.toString() || '',
    });
    setEditingId(product.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id, productName) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
      return;
    }

    try {
      await deleteProduct(id);
      alert('Product deleted successfully');
      loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      barcode: '',
      productName: '',
      measure: '',
      rating: '',
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <h2>Product Management</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Product Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          {showAddForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px',
        }}>
          <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Barcode *
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                style={inputStyle}
                required
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Product Name *
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                style={inputStyle}
                required
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Measure
              </label>
              <input
                type="text"
                value={formData.measure}
                onChange={(e) => setFormData({ ...formData, measure: e.target.value })}
                style={inputStyle}
                placeholder="e.g., ITEM, PACK, KG"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Rating (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {editingId ? 'Update' : 'Add'} Product
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        {products.length === 0 ? (
          <p style={{ padding: '20px' }}>No products found. Add your first product!</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={tableHeaderStyle}>Barcode</th>
                <th style={tableHeaderStyle}>Product Name</th>
                <th style={tableHeaderStyle}>Measure</th>
                <th style={tableHeaderStyle}>Rating</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={tableCellStyle}>{product.barcode}</td>
                  <td style={tableCellStyle}>{product.productName}</td>
                  <td style={tableCellStyle}>{product.measure || '-'}</td>
                  <td style={tableCellStyle}>
                    {product.rating ? '⭐'.repeat(product.rating) : '-'}
                  </td>
                  <td style={tableCellStyle}>
                    <button
                      onClick={() => handleEdit(product)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#ffc107',
                        color: 'black',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '5px',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.productName)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '14px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  boxSizing: 'border-box',
};

const tableHeaderStyle = {
  padding: '12px',
  textAlign: 'left',
  fontWeight: 'bold',
};

const tableCellStyle = {
  padding: '12px',
};

export default AdminPage;
