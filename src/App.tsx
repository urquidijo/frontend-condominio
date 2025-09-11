import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import ConfirmAccount from "./pages/ConfirmAccount";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/confirm" element={<ConfirmAccount />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
