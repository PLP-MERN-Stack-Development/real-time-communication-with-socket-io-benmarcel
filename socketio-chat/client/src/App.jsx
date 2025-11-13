// import React from 'react'
import router from "./routes/AppRoutes"
import { RouterProvider } from "react-router-dom";

const App = () => {
  return (
    <RouterProvider router={router} />
  )
}

export default App
