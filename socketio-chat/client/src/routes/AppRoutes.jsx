import { createBrowserRouter, createRoutesFromElements , Route} from "react-router-dom";

import Login from "../pages/Login.jsx";
import Register from "../pages/Signup.jsx";
import Chat from "../components/Chat/ChatInterface.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import Home from "../pages/Home.jsx";
// import AuthProvider from "../context/contextProvider.jsx"

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
    </>
  )
);

export default router;