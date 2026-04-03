import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/components/auth/Login";
import Register from "@/components/auth/Register";
import AdminDashboard from "@/components/admin/AdminDashboard";
import ClientDashboard from "@/components/client/ClientDashboard";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Services from "@/components/Services";
import Values from "@/components/Values";
import Gallery from "@/components/Gallery";
import ZoneIntervention from "@/components/ZoneIntervention";
import Contact from "@/components/Contact";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

const WHATSAPP_NUMBER = "590690449714";
const PHONE_NUMBER = "0690 44 97 14";

function AutoRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  if (user?.role === "client") return <Navigate to="/espace-client" replace />;
  return null;
}

const Home = () => (
  <div className="bg-[#0A0A0A] min-h-screen">
    <Navbar whatsapp={WHATSAPP_NUMBER} phone={PHONE_NUMBER} />
    <Hero whatsapp={WHATSAPP_NUMBER} />
    <Stats />
    <Services whatsapp={WHATSAPP_NUMBER} />
    <Values />
    <Gallery />
    <ZoneIntervention whatsapp={WHATSAPP_NUMBER} phone={PHONE_NUMBER} />
    <Contact whatsapp={WHATSAPP_NUMBER} />
    <FAQ />
    <Footer whatsapp={WHATSAPP_NUMBER} phone={PHONE_NUMBER} />
    <FloatingWhatsApp whatsapp={WHATSAPP_NUMBER} />
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/connexion" element={<><AutoRedirect /><Login /></>} />
      <Route path="/inscription" element={<><AutoRedirect /><Register /></>} />
      <Route path="/admin" element={
        <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/espace-client" element={
        <ProtectedRoute role="client"><ClientDashboard /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
