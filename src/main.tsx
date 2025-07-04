import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import App from "@/App";
import "@/index.css";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        {/*  new  */}
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </AuthProvider>
      </BrowserRouter>
  </React.StrictMode>
);