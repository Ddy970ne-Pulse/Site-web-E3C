import "@/App.css";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SEO } from "@/components/SEO";

// ── Composants de la home chargés immédiatement (above-the-fold)
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

// ── Sections below-the-fold : lazy-loaded
const Services = lazy(() => import("@/components/Services"));
const Values = lazy(() => import("@/components/Values"));
const Gallery = lazy(() => import("@/components/Gallery"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
const ZoneIntervention = lazy(() => import("@/components/ZoneIntervention"));
const Contact = lazy(() => import("@/components/Contact"));
const FAQ = lazy(() => import("@/components/FAQ"));
const Footer = lazy(() => import("@/components/Footer"));

// ── Pages / dashboards : lazy-loaded (gros bundles)
const Login = lazy(() => import("@/components/auth/Login"));
const Register = lazy(() => import("@/components/auth/Register"));
const AdminDashboard = lazy(() => import("@/components/admin/AdminDashboard"));
const ClientDashboard = lazy(() => import("@/components/client/ClientDashboard"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const DevisWizard = lazy(() => import("@/pages/DevisWizard"));
const MentionsLegales = lazy(() => import("@/pages/MentionsLegales"));
const CGV = lazy(() => import("@/pages/CGV"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const WHATSAPP_NUMBER = "590690449714";

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AutoRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  if (user?.role === "client") return <Navigate to="/espace-client" replace />;
  return null;
}

const Home = () => (
  <div className="bg-[#0A0A0A] min-h-screen">
    <SEO
      title="Entreprise de Constructions BTP"
      description="E3C, votre entreprise de construction BTP en Guadeloupe. Maçonnerie, toiture, rénovation, carrelage, peinture. Devis gratuit en ligne."
      url="/"
    />
    <Navbar whatsapp={WHATSAPP_NUMBER} />
    <Hero whatsapp={WHATSAPP_NUMBER} />
    <Suspense fallback={null}>
      <Services whatsapp={WHATSAPP_NUMBER} />
      <Values />
      <Gallery />
      <Testimonials />
      <ZoneIntervention whatsapp={WHATSAPP_NUMBER} />
      <Contact whatsapp={WHATSAPP_NUMBER} />
      <FAQ />
      <Footer whatsapp={WHATSAPP_NUMBER} />
    </Suspense>
    <FloatingWhatsApp whatsapp={WHATSAPP_NUMBER} />
  </div>
);

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
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
