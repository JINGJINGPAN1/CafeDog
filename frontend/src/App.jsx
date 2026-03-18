import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import CafeDetail from './CafeDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

function App() {
  return (
    // BrowserRouter is the overall routing context, Routes holds all route definitions
    <BrowserRouter>
      <Routes>
        {/* When the URL is the root "/", render the Home component */}
        <Route path="/" element={<Home />} />

        {/* When the URL is "/cafe/someID", render the CafeDetail component. ":id" is a dynamic parameter */}
        <Route path="/cafe/:id" element={<CafeDetail />} />

        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
