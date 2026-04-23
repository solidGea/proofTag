import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import ScannerPage from './pages/ScannerPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Header />
        <Routes>
          <Route path="/" element={<ScannerPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
