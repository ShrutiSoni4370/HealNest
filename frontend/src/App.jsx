import { useState, React } from "react";
import "./App.css";
import UserRouters from "./routes/UserRoutes";

function App() {
  return (
    // Remove BrowserRouter wrapper - it's already in index.jsx
    <UserRouters />
  );
}

export default App;
