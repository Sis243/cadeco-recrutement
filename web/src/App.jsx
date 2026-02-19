import React from "react";
import { Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";

import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import Apply from "./pages/Apply";
import Track from "./pages/Track";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAuditLog from "./pages/AdminAuditLog";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/postes" element={<Jobs />} />
        <Route path="/postuler" element={<Apply />} />
        <Route path="/suivi" element={<Track />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/audit" element={<AdminAuditLog />} />
      </Route>
    </Routes>
  );
}
