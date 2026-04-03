import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const Home = () => {
  return (
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
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
