import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import CafeDetail from './CafeDetail';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cafe/:id" element={<CafeDetail />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
