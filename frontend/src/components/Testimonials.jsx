import { useState, useEffect } from "react";
import axios from "axios";
import { Star, Quote, Send, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Témoignages de référence (affichés si aucun approuvé en base)
const FALLBACK = [
  { name: "Marie-Claire D.", commune: "Les Abymes",    service: "Rénovation complète",     stars: 5, text: "Équipe sérieuse et professionnelle. Chantier propre, délais respectés. Ma maison est méconnaissable ! Je recommande E3C sans hésiter.", initials: "MC" },
  { name: "Jean-Philippe M.", commune: "Baie-Mahault", service: "Maçonnerie & Extension",   stars: 5, text: "Très satisfait de l'extension de ma maison. Travail soigné, équipe à l'écoute. Le devis était précis et le résultat conforme.", initials: "JP" },
  { name: "Sylviane B.",       commune: "Le Gosier",   service: "Toiture & Peinture",       stars: 5, text: "Intervention rapide après un dégât des eaux. Toiture refaite et peinture extérieure impeccable. Prix correct pour un travail de qualité.", initials: "SB" },
  { name: "Robert L.",         commune: "Sainte-Anne", service: "Construction neuve",        stars: 5, text: "Construction de notre villa de A à Z. E3C a su gérer l'ensemble des corps de métier avec efficacité. Résultat au-delà de nos espérances.", initials: "RL" },
  { name: "Patricia C.",       commune: "Pointe-à-Pitre", service: "Carrelage & Rénovation", stars: 5, text: "Carrelage posé avec soin, rénovation de la salle de bain parfaite. L'équipe est ponctuelle et le chantier toujours bien rangé.", initials: "PC" },
  { name: "Thierry F.",        commune: "Capesterre",  service: "Terrassement",              stars: 5, text: "Terrassement de grande envergure réalisé dans les temps. Matériel adapté, travail propre. E3C connaît parfaitement les sols guadeloupéens.", initials: "TF" },
];

function StarRating({ count }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} className={i < count ? "fill-[#D4AF37] text-[#D4AF37]" : "text-gray-600"} />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="focus:outline-none"
        >
          <Star size={22} className={(hovered || value) >= s ? "fill-[#D4AF37] text-[#D4AF37]" : "text-gray-600"} />
        </button>
      ))}
    </div>
  );
}

function SubmitForm({ onSuccess }) {
  const [form, setForm] = useState({ name: "", commune: "", service: "", stars: 5, text: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) { setError("Nom et témoignage requis."); return; }
    setLoading(true); setError("");
    try {
      await axios.post(`${API}/testimonials`, form);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'envoi.");
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="testimonial-form">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-widest mb-1.5 block">Votre nom *</label>
          <input
            value={form.name} onChange={e => set("name", e.target.value)}
            placeholder="Marie D." maxLength={60}
            className="w-full bg-[#0E0E0E] border border-white/10 text-white text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder-gray-600"
            data-testid="testimonial-name"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-widest mb-1.5 block">Commune</label>
          <input
            value={form.commune} onChange={e => set("commune", e.target.value)}
            placeholder="Les Abymes" maxLength={60}
            className="w-full bg-[#0E0E0E] border border-white/10 text-white text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder-gray-600"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-widest mb-1.5 block">Prestation concernée</label>
          <input
            value={form.service} onChange={e => set("service", e.target.value)}
            placeholder="Rénovation, Toiture…" maxLength={80}
            className="w-full bg-[#0E0E0E] border border-white/10 text-white text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder-gray-600"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-widest mb-1.5 block">Email (non publié)</label>
          <input
            type="email" value={form.email} onChange={e => set("email", e.target.value)}
            placeholder="votre@email.com"
            className="w-full bg-[#0E0E0E] border border-white/10 text-white text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder-gray-600"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-widest mb-1.5 block">Votre note *</label>
        <StarPicker value={form.stars} onChange={v => set("stars", v)} />
      </div>
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-widest mb-1.5 block">Votre témoignage *</label>
        <textarea
          value={form.text} onChange={e => set("text", e.target.value)}
          placeholder="Décrivez votre expérience avec E3C…" rows={4} maxLength={500}
          className="w-full bg-[#0E0E0E] border border-white/10 text-white text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder-gray-600 resize-none"
          data-testid="testimonial-text"
        />
        <p className="text-right text-xs text-gray-600 mt-1">{form.text.length}/500</p>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button
        type="submit" disabled={loading}
        data-testid="testimonial-submit"
        className="flex items-center gap-2 bg-[#D4AF37] text-black font-bold text-sm px-6 py-2.5 hover:bg-[#E6C65A] transition-colors rounded-sm disabled:opacity-60"
      >
        {loading ? "Envoi…" : <><Send size={14} /> Soumettre mon avis</>}
      </button>
    </form>
  );
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    axios.get(`${API}/testimonials`)
      .then(r => setTestimonials(r.data))
      .catch(() => setTestimonials([]))
      .finally(() => setLoading(false));
  }, []);

  const display = testimonials.length > 0 ? testimonials : FALLBACK;
  const isFallback = testimonials.length === 0;

  return (
    <section id="testimonials" data-testid="testimonials-section" className="py-16 md:py-24 bg-[#0A0A0A] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-2">Témoignages</p>
            <h2 className="font-outfit font-bold text-3xl md:text-4xl text-white mb-3">Ce que disent nos clients</h2>
            <div className="section-divider" />
          </div>
          <button
            onClick={() => { setShowForm(f => !f); setSubmitted(false); }}
            data-testid="toggle-testimonial-form"
            className="flex-shrink-0 flex items-center gap-2 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold px-4 py-2.5 hover:bg-[#D4AF37]/10 transition-colors rounded-sm"
          >
            {showForm ? <><ChevronUp size={13}/> Masquer</> : <><ChevronDown size={13}/> Laisser un avis</>}
          </button>
        </div>

        {/* Formulaire dépliable */}
        {showForm && !submitted && (
          <div className="mb-10 bg-[#111111] border border-white/8 rounded-sm p-6">
            <h3 className="font-outfit font-semibold text-white text-sm mb-5">Partagez votre expérience</h3>
            <SubmitForm onSuccess={() => { setSubmitted(true); setShowForm(false); }} />
          </div>
        )}

        {/* Confirmation */}
        {submitted && (
          <div className="mb-10 flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-sm px-5 py-4" data-testid="testimonial-success">
            <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
            <p className="text-green-300 text-sm">Merci pour votre avis ! Il sera publié après validation par notre équipe.</p>
          </div>
        )}

        {/* Grille */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {display.map((t, i) => (
            <div
              key={t.id || i}
              data-testid={`testimonial-${i}`}
              className="bg-[#121212] border border-white/5 hover:border-[#D4AF37]/15 transition-all duration-300 p-6 rounded-sm flex flex-col"
            >
              <Quote size={18} className="text-[#D4AF37]/25 mb-3" />
              <StarRating count={t.stars} />
              <p className="text-gray-300 text-sm leading-relaxed mt-3 mb-5 flex-1">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div className="w-8 h-8 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[#D4AF37] text-xs font-bold">{t.initials || (t.name?.split(" ").map(w => w[0]).join("").substring(0, 2))}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-gray-500 text-xs">{[t.commune, t.service].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {isFallback && !loading && (
          <p className="text-gray-600 text-xs text-center mt-6">
            * Exemples de témoignages — les vrais avis clients s'afficheront ici après validation.
          </p>
        )}
      </div>
    </section>
  );
}
