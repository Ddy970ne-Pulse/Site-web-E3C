import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/components/auth/Login";
import Register from "@/components/auth/Register";
import AdminDashboard from "@/components/admin/AdminDashboard";
import ClientDashboard from "@/components/client/ClientDashboard";
import ContactPage from "@/pages/ContactPage";
import DevisWizard from "@/pages/DevisWizard";
import MentionsLegales from "@/pages/MentionsLegales";
import CGV from "@/pages/CGV";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Values from "@/components/Values";
import Gallery from "@/components/Gallery";
import Testimonials from "@/components/Testimonials";
import ZoneIntervention from "@/components/ZoneIntervention";
import Contact from "@/components/Contact";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

const WHATSAPP_NUMBER = "590690449714";

function AutoRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  if (user?.role === "client") return <Navigate to="/espace-client" replace />;
  return null;
}

import { SEO } from "@/components/SEO";

const Home = () => (
  <div className="bg-[#FAFAF8] dark:bg-[#0A0A0A] min-h-screen">
    <SEO
      title="Entreprise de Constructions BTP"
      description="E3C, votre entreprise de construction BTP en Guadeloupe. Maçonnerie, toiture, rénovation, carrelage, peinture. Devis gratuit en ligne."
      url="/"
    />
    <Navbar whatsapp={WHATSAPP_NUMBER} />
    <Hero whatsapp={WHATSAPP_NUMBER} />
    <Services whatsapp={WHATSAPP_NUMBER} />
    <Values />
    <Gallery />
    <Testimonials />
    <ZoneIntervention whatsapp={WHATSAPP_NUMBER} />
    <Contact whatsapp={WHATSAPP_NUMBER} />
    <FAQ />
    <Footer whatsapp={WHATSAPP_NUMBER} />
    <FloatingWhatsApp whatsapp={WHATSAPP_NUMBER} />
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/connexion" element={<><AutoRedirect /><Login /></>} />
      <Route path="/inscription" element={<><AutoRedirect /><Register /></>} />
      <Route path="/devis" element={<DevisWizard />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/mentions-legales" element={<MentionsLegales />} />
      <Route path="/cgv" element={<CGV />} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/espace-client" element={<ProtectedRoute role="client"><ClientDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
