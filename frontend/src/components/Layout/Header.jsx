import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header style={{
      backgroundColor: '#343a40',
      color: 'white',
      padding: '15px 20px',
      marginBottom: '20px',
    }}>
      <nav style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px',
        }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>ProofTag Scanner</h1>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link to="/" style={linkStyle}>
              Scanner
            </Link>
            <Link to="/history" style={linkStyle}>
              History
            </Link>
            <Link to="/admin" style={linkStyle}>
              Admin
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

const linkStyle = {
  color: 'white',
  textDecoration: 'none',
  padding: '8px 15px',
  borderRadius: '4px',
  transition: 'background-color 0.3s',
};

export default Header;
