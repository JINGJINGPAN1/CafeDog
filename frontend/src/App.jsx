import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import CafeDetail from './CafeDetail';

function App() {
  return (
    // BrowserRouter is the overall routing context, Routes holds all route definitions
    <BrowserRouter>
      <Routes>
        {/* When the URL is the root "/", render the Home component */}
        <Route path="/" element={<Home />} />

        {/* When the URL is "/cafe/someID", render the CafeDetail component. ":id" is a dynamic parameter */}
        <Route path="/cafe/:id" element={<CafeDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;