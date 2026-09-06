import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-[#D4AF37] text-8xl font-bold font-outfit mb-4">404</p>
        <h1 className="text-white text-2xl font-semibold mb-3">Page introuvable</h1>
        <p className="text-gray-400 mb-8">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-6 py-3 hover:border-[#D4AF37]/40 transition-colors text-sm"
          >
            <ArrowLeft size={15} /> Retour
          </button>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center justify-center gap-2 bg-[#D4AF37] text-black font-semibold px-6 py-3 hover:bg-[#E6C65A] transition-colors text-sm"
          >
            <Home size={15} /> Accueil
          </button>
        </div>
      </div>
    </div>
  );
}
