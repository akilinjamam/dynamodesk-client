import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import WakingNotice from "./components/WakingNotice.jsx";
import AppShell from "./layouts/AppShell.jsx";
import Clients from "./pages/Clients.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DocumentEditor from "./pages/DocumentEditor.jsx";
import DocumentList from "./pages/DocumentList.jsx";
import Login from "./pages/Login.jsx";
import NewDocument from "./pages/NewDocument.jsx";
import SettingsPage from "./pages/Settings.jsx";
import TemplateGallery from "./pages/TemplateGallery.jsx";
import SystemStatus from "./pages/SystemStatus.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WakingNotice />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/documents" element={<DocumentList />} />
              <Route path="/documents/new" element={<NewDocument />} />
              <Route path="/documents/:id" element={<DocumentEditor />} />
              <Route path="/templates" element={<TemplateGallery />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/status" element={<SystemStatus />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
// page updated
