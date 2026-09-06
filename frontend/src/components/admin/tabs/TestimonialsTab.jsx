import { CheckCircle, XCircle } from "lucide-react";
import { testimonialsApi } from "@/api";

export default function TestimonialsTab({ testimonials, onRefresh }) {
  const updateStatus = async (id, status) => {
    try { await testimonialsApi.updateStatus(id, status); onRefresh(); }
    catch { alert("Erreur lors de la mise à jour."); }
  };

  const pending = testimonials.filter(t => t.status === "pending");
  const approved = testimonials.filter(t => t.status === "approved");
  const rejected = testimonials.filter(t => t.status === "rejected");

  return (
    <div>
      <h1 className="font-outfit font-bold text-2xl text-white mb-2">Témoignages</h1>
      <div className="flex gap-4 mb-6">
        <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-sm">{pending.length} en attente</span>
        <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-sm">{approved.length} publiés</span>
        <span className="text-xs text-gray-400 bg-gray-400/10 px-2 py-1 rounded-sm">{rejected.length} rejetés</span>
      </div>
      <div className="space-y-3">
        {testimonials.map(t => (
          <div key={t.id}
            className={`bg-[#121212] border rounded-sm p-5 ${t.status === "pending" ? "border-yellow-400/20" : t.status === "approved" ? "border-green-500/15" : "border-white/5"}`}
            data-testid={`testimonial-admin-${t.id}`}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  {t.commune && <span className="text-xs text-gray-500">{t.commune}</span>}
                  {t.service && <span className="text-xs text-[#D4AF37]/70">{t.service}</span>}
                  <div className="flex gap-0.5 ml-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-[10px] ${i < t.stars ? "text-[#D4AF37]" : "text-gray-700"}`}>★</span>
                    ))}
                  </div>
                </div>
                {t.email && <p className="text-gray-600 text-xs mb-2">{t.email}</p>}
                <p className="text-gray-300 text-sm leading-relaxed">"{t.text}"</p>
                <p className="text-gray-600 text-xs mt-2">{new Date(t.created_at).toLocaleDateString("fr-FR")}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {t.status !== "approved" && (
                  <button onClick={() => updateStatus(t.id, "approved")} data-testid={`approve-${t.id}`}
                    className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/20 px-3 py-1.5 rounded-sm transition-colors">
                    <CheckCircle size={12} /> Publier
                  </button>
                )}
                {t.status !== "rejected" && (
                  <button onClick={() => updateStatus(t.id, "rejected")} data-testid={`reject-${t.id}`}
                    className="flex items-center gap-1 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/15 px-3 py-1.5 rounded-sm transition-colors">
                    <XCircle size={12} /> Rejeter
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {testimonials.length === 0 && (
          <div className="bg-[#121212] border border-white/5 rounded-sm p-12 text-center">
            <p className="text-gray-500 text-sm">Aucun témoignage reçu pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
