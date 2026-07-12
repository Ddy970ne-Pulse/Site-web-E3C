import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, ChevronLeft, CheckCircle, Building2, Home, Layers, Hammer, PaintBucket, Wrench, Zap, Droplets, Trees, HelpCircle, Check, Loader, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WHATSAPP = "590690449714";

const PROJECT_TYPES = [
  { id: "construction_neuve", label: "Construction neuve", icon: Building2, desc: "Maison, immeuble, local..." },
  { id: "renovation", label: "Rénovation complète", icon: Home, desc: "Réhabilitation, remise à neuf" },
  { id: "extension", label: "Extension / Agrandissement", icon: Layers, desc: "Ajouter des pièces, surface" },
  { id: "travaux_specifiques", label: "Travaux spécifiques", icon: Hammer, desc: "Corps de métier précis" },
  { id: "terrassement", label: "Terrassement / VRD", icon: Trees, desc: "Terrain, voirie, réseaux" },
  { id: "autre", label: "Autre projet", icon: HelpCircle, desc: "Je décrirai mon projet" },
];

const SERVICES_LIST = [
  { id: "maçonnerie", label: "Maçonnerie & Gros Oeuvre", icon: Building2 },
  { id: "charpente", label: "Charpente & Ossature", icon: Home },
  { id: "toiture", label: "Toiture & Couverture", icon: Layers },
  { id: "carrelage", label: "Carrelage & Revêtements", icon: Layers },
  { id: "renovation", label: "Rénovation Intérieure", icon: Wrench },
  { id: "peinture", label: "Peinture & Enduits", icon: PaintBucket },
  { id: "terrassement", label: "Terrassement & VRD", icon: Trees },
  { id: "plomberie", label: "Plomberie & Sanitaire", icon: Droplets },
  { id: "electricite", label: "Électricité Générale", icon: Zap },
];

const BUDGET_RANGES = [
  "Moins de 5 000 €", "5 000 – 15 000 €", "15 000 – 30 000 €",
  "30 000 – 60 000 €", "60 000 – 100 000 €", "Plus de 100 000 €", "À définir ensemble",
];

const DELAYS = [
  "Dès que possible", "Dans 1 mois", "Dans 2-3 mois",
  "Dans 6 mois", "Dans 1 an", "Date flexible",
];

const COMMUNES = [
  "Pointe-à-Pitre", "Les Abymes", "Baie-Mahault", "Le Gosier", "Sainte-Anne",
  "Saint-François", "Capesterre-Belle-Eau", "Basse-Terre", "Saint-Claude",
  "Gourbeyre", "Petit-Bourg", "Lamentin", "Morne-à-l'Eau", "Port-Louis",
  "Anse-Bertrand", "Deshaies", "Bouillante", "Vieux-Habitants", "Trois-Rivières",
  "Saint-Louis (Marie-Galante)", "Autre commune",
];

const TOTAL_STEPS = 7;

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
            i < current ? "bg-[#D4AF37] text-black" :
            i === current ? "bg-[#D4AF37]/20 border-2 border-[#D4AF37] text-[#D4AF37]" :
            "bg-black/5 dark:bg-white/5 text-[#9E9E9E] dark:text-gray-500 border border-black/10 dark:border-white/10"
          }`}>
            {i < current ? <Check size={13} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`flex-1 h-0.5 w-6 sm:w-10 transition-colors ${i < current ? "bg-[#D4AF37]" : "bg-black/10 dark:bg-white/10"}`} />
          )}
        </div>
      ))}
      <span className="ml-2 text-sm text-[#9E9E9E] dark:text-gray-500">{current + 1} / {total}</span>
    </div>
  );
}

export default function DevisWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [pricingItems, setPricingItems] = useState([]);
  const [lineItems, setLineItems] = useState([]); // { pricing_item_id, description, unit, unit_price_ht, tva_rate, quantity }

  useEffect(() => {
    axios.get(`${API}/pricing-grid`).then(r => setPricingItems(r.data.filter(i => i.active))).catch(() => {});
  }, []);

  const [data, setData] = useState({
    project_type: "",
    services: [],
    description: "",
    surface: "",
    commune: "",
    address: "",
    budget_range: "",
    desired_delay: "",
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // Sync form fields when auth resolves after mount (race condition fix)
  useEffect(() => {
    if (user) {
      setData(d => ({
        ...d,
        name: d.name || user.name || "",
        email: d.email || user.email || "",
        phone: d.phone || user.phone || "",
      }));
    }
  }, [user]);

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));
  const toggleService = (id) => {
    setData(p => ({
      ...p,
      services: p.services.includes(id) ? p.services.filter(s => s !== id) : [...p.services, id],
    }));
  };

  // Line items helpers
  const setQty = (itemId, qty) => {
    const num = parseFloat(qty) || 0;
    if (num <= 0) {
      setLineItems(li => li.filter(l => l.pricing_item_id !== itemId));
    } else {
      setLineItems(li => {
        const existing = li.find(l => l.pricing_item_id === itemId);
        if (existing) return li.map(l => l.pricing_item_id === itemId ? { ...l, quantity: num } : l);
        const p = pricingItems.find(p => p.id === itemId);
        if (!p) return li;
        return [...li, { pricing_item_id: p.id, description: p.description, unit: p.unit, unit_price_ht: p.unit_price_ht, tva_rate: p.tva_rate, quantity: num }];
      });
    }
  };
  const getQty = (itemId) => lineItems.find(l => l.pricing_item_id === itemId)?.quantity || "";
  const totalHT = lineItems.reduce((s, l) => s + l.unit_price_ht * l.quantity, 0);
  const totalTVA = lineItems.reduce((s, l) => s + l.unit_price_ht * l.quantity * (l.tva_rate / 100), 0);
  const totalTTC = totalHT + totalTVA;

  // Pricing items filtered by selected services (fuzzy match on category)
  const serviceCategories = data.services.map(s => {
    const map = { "maçonnerie": "Maçonnerie", "charpente": "Charpente", "toiture": "Toiture", "carrelage": "Carrelage", "renovation": "Rénovation", "peinture": "Peinture", "terrassement": "Terrassement", "plomberie": "Plomberie", "electricite": "Électricité" };
    return map[s] || "";
  }).filter(Boolean);
  const relevantItems = pricingItems.filter(p => serviceCategories.includes(p.category));
  const otherItems = pricingItems.filter(p => !serviceCategories.includes(p.category));

  const canNext = () => {
    if (step === 0) return !!data.project_type;
    if (step === 1) return data.services.length > 0;
    if (step === 2) return true; // estimation — toujours optionnelle
    if (step === 3) return data.description.trim().length > 10;
    if (step === 4) return !!data.commune;
    if (step === 5) return true;
    if (step === 6) return data.name.trim() && data.email.trim();
    return true;
  };

  const submit = async () => {
    setSubmitting(true); setError("");
    try {
      const payload = {
        ...data,
        services: data.services.map(id => SERVICES_LIST.find(s => s.id === id)?.label || id),
        project_type: PROJECT_TYPES.find(p => p.id === data.project_type)?.label || data.project_type,
        line_items: lineItems,
        estimated_total_ht: totalHT,
        estimated_total_ttc: totalTTC,
      };
      await axios.post(`${API}/quote-requests`, payload);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'envoi. Veuillez réessayer.");
    } finally { setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div className="bg-[#FAFAF8] dark:bg-[#0A0A0A] min-h-screen">
        <Navbar whatsapp={WHATSAPP} />
        <div className="min-h-screen flex items-center justify-center px-6 pt-20">
          <div className="max-w-lg w-full text-center">
            <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={36} className="text-green-500 dark:text-green-400" />
            </div>
            <h1 className="font-outfit font-bold text-4xl text-[#1A1A1A] dark:text-white mb-3">Demande envoyée !</h1>
            <p className="text-[#737373] dark:text-gray-400 text-lg mb-6 leading-relaxed">
              Votre demande de devis a bien été transmise à l'équipe E3C. Nous vous
              recontacterons dans les plus brefs délais pour établir votre devis personnalisé.
            </p>
            <div className="bg-white dark:bg-[#121212] border border-black/7 dark:border-white/5 p-5 rounded-sm mb-6 text-left">
              <p className="text-sm text-[#9E9E9E] dark:text-gray-500 uppercase tracking-widest mb-3 font-semibold">Récapitulatif</p>
              <div className="space-y-2 text-base">
                <p className="text-[#4B4B4B] dark:text-gray-300"><span className="text-[#9E9E9E] dark:text-gray-500">Projet :</span> {PROJECT_TYPES.find(p => p.id === data.project_type)?.label}</p>
                <p className="text-[#4B4B4B] dark:text-gray-300"><span className="text-[#9E9E9E] dark:text-gray-500">Commune :</span> {data.commune}</p>
                <p className="text-[#4B4B4B] dark:text-gray-300"><span className="text-[#9E9E9E] dark:text-gray-500">Email :</span> {data.email}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {!user && (
                <button onClick={() => navigate("/inscription")}
                  className="flex-1 bg-[#D4AF37] text-black font-bold py-3 hover:bg-[#E6C65A] transition-colors text-base rounded-sm">
                  Créer mon espace client
                </button>
              )}
              <button onClick={() => navigate(user ? "/espace-client" : "/")}
                className="flex-1 border border-black/15 dark:border-white/20 text-[#4B4B4B] dark:text-gray-300 font-semibold py-3 hover:border-black/30 dark:hover:border-white/40 hover:text-[#1A1A1A] dark:hover:text-white transition-colors text-base rounded-sm">
                {user ? "Mon espace client" : "Retour à l'accueil"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAF8] dark:bg-[#0A0A0A] min-h-screen">
      <SEO title="Demande de devis gratuit" description="Obtenez votre devis BTP gratuit en Guadeloupe. Répondez à quelques questions et E3C vous recontacte sous 24h." url="/devis" />
      <Navbar whatsapp={WHATSAPP} />
      <div className="max-w-2xl mx-auto px-5 pt-28 pb-16">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[#D4AF37] text-sm font-bold uppercase tracking-widest mb-2">Devis gratuit</p>
          <h1 className="font-outfit font-bold text-3xl sm:text-4xl text-[#1A1A1A] dark:text-white">Construisez votre demande</h1>
          <p className="text-[#737373] dark:text-gray-400 text-base mt-1">Quelques questions pour préparer votre devis personnalisé</p>
        </div>

        <StepIndicator current={step} total={TOTAL_STEPS} />

        <div className="bg-white dark:bg-[#121212] border border-black/7 dark:border-white/5 rounded-sm p-6 md:p-8">
          {/* Step 0 — Type de projet */}
          {step === 0 && (
            <div>
              <h2 className="font-outfit font-bold text-[#1A1A1A] dark:text-white text-2xl mb-1">Quel type de projet ?</h2>
              <p className="text-[#737373] dark:text-gray-400 text-base mb-6">Sélectionnez la catégorie qui correspond à vos travaux</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROJECT_TYPES.map(pt => {
                  const Icon = pt.icon;
                  return (
                    <button key={pt.id} onClick={() => set("project_type", pt.id)}
                      data-testid={`project-type-${pt.id}`}
                      className={`flex items-center gap-4 p-4 border rounded-sm text-left transition-all duration-200 ${
                        data.project_type === pt.id
                          ? "border-[#D4AF37] bg-[#D4AF37]/10"
                          : "border-black/8 dark:border-white/8 hover:border-black/20 dark:hover:border-white/20 bg-black/3 dark:bg-white/3"
                      }`}>
                      <div className={`w-10 h-10 flex items-center justify-center rounded-sm flex-shrink-0 ${data.project_type === pt.id ? "bg-[#D4AF37]/20" : "bg-black/5 dark:bg-white/5"}`}>
                        <Icon size={18} className={data.project_type === pt.id ? "text-[#D4AF37]" : "text-[#9E9E9E] dark:text-gray-400"} />
                      </div>
                      <div>
                        <p className={`font-semibold text-base ${data.project_type === pt.id ? "text-[#D4AF37]" : "text-[#1A1A1A] dark:text-white"}`}>{pt.label}</p>
                        <p className="text-[#9E9E9E] dark:text-gray-500 text-sm mt-0.5">{pt.desc}</p>
                      </div>
                      {data.project_type === pt.id && <Check size={14} className="text-[#D4AF37] ml-auto flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1 — Corps de métier */}
          {step === 1 && (
            <div>
              <h2 className="font-outfit font-bold text-[#1A1A1A] dark:text-white text-2xl mb-1">Quels corps de métier ?</h2>
              <p className="text-[#737373] dark:text-gray-400 text-base mb-6">Sélectionnez une ou plusieurs prestations <span className="text-[#D4AF37]">({data.services.length} sélectionnée{data.services.length > 1 ? "s" : ""})</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SERVICES_LIST.map(s => {
                  const Icon = s.icon;
                  const selected = data.services.includes(s.id);
                  return (
                    <button key={s.id} onClick={() => toggleService(s.id)}
                      data-testid={`service-check-${s.id}`}
                      className={`flex items-center gap-3 p-3.5 border rounded-sm text-left transition-all duration-200 ${
                        selected ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-black/8 dark:border-white/8 hover:border-black/20 dark:hover:border-white/20 bg-black/3 dark:bg-white/3"
                      }`}>
                      <div className={`w-8 h-8 flex items-center justify-center rounded-sm flex-shrink-0 ${selected ? "bg-[#D4AF37]" : "bg-black/5 dark:bg-white/5"}`}>
                        {selected ? <Check size={14} className="text-black" /> : <Icon size={14} className="text-[#9E9E9E] dark:text-gray-400" />}
                      </div>
                      <span className={`text-base font-medium ${selected ? "text-[#D4AF37]" : "text-[#4B4B4B] dark:text-gray-300"}`}>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2 — Estimation tarifaire */}
          {step === 2 && (
            <div>
              <h2 className="font-outfit font-bold text-[#1A1A1A] dark:text-white text-2xl mb-1">Estimation tarifaire</h2>
              <p className="text-[#737373] dark:text-gray-400 text-base mb-1">
                Sélectionnez des articles et saisissez les quantités pour obtenir une estimation immédiate.
              </p>
              <p className="text-[#D4AF37] text-sm mb-6">Cette étape est facultative — vous pouvez passer directement à la suite.</p>

              {pricingItems.length === 0 ? (
                <div className="border border-dashed border-black/10 dark:border-white/10 rounded-sm p-8 text-center">
                  <p className="text-[#9E9E9E] dark:text-gray-500 text-base">La grille tarifaire n'est pas encore disponible.</p>
                  <p className="text-[#ADADAD] dark:text-gray-600 text-sm mt-1">Passez à l'étape suivante pour soumettre votre demande.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Articles correspondants aux prestations sélectionnées */}
                  {relevantItems.length > 0 && (
                    <div>
                      <p className="text-sm text-[#D4AF37] font-semibold uppercase tracking-widest mb-3">Prestations sélectionnées</p>
                      <div className="space-y-2">
                        {relevantItems.map(item => {
                          const qty = getQty(item.id);
                          const lineTotal = qty ? item.unit_price_ht * parseFloat(qty) : 0;
                          return (
                            <div key={item.id} className={`flex items-center gap-3 p-3 border rounded-sm transition-colors ${qty ? "border-[#D4AF37]/30 bg-[#D4AF37]/5" : "border-black/5 dark:border-white/5 bg-black/2 dark:bg-white/2"}`}>
                              <div className="flex-1 min-w-0">
                                <p className="text-[#1A1A1A] dark:text-white text-base font-medium leading-snug">{item.description}</p>
                                <p className="text-[#9E9E9E] dark:text-gray-500 text-sm">{item.unit_price_ht.toFixed(2)} € HT / {item.unit} · TVA {item.tva_rate}%</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <input
                                  type="number" min="0" step="0.1"
                                  value={qty}
                                  onChange={e => setQty(item.id, e.target.value)}
                                  placeholder="0"
                                  data-testid={`qty-${item.id}`}
                                  className="w-20 bg-[#F5F4F0] dark:bg-[#0A0A0A] border border-black/10 dark:border-white/15 text-[#1A1A1A] dark:text-white text-base px-2 py-1.5 rounded-sm text-right focus:outline-none focus:border-[#D4AF37]/50"
                                />
                                <span className="text-[#9E9E9E] dark:text-gray-500 text-sm w-8">{item.unit}</span>
                                {qty > 0 && <span className="text-[#D4AF37] text-sm font-semibold w-20 text-right">{lineTotal.toFixed(2)} €</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Autres articles */}
                  {otherItems.length > 0 && (
                    <details className="group">
                      <summary className="text-sm text-[#9E9E9E] dark:text-gray-500 cursor-pointer hover:text-[#4B4B4B] dark:hover:text-gray-300 transition-colors list-none flex items-center gap-2">
                        <ChevronRight size={12} className="group-open:rotate-90 transition-transform" />
                        Autres prestations disponibles ({otherItems.length})
                      </summary>
                      <div className="mt-3 space-y-2">
                        {otherItems.map(item => {
                          const qty = getQty(item.id);
                          const lineTotal = qty ? item.unit_price_ht * parseFloat(qty) : 0;
                          return (
                            <div key={item.id} className={`flex items-center gap-3 p-3 border rounded-sm transition-colors ${qty ? "border-[#D4AF37]/30 bg-[#D4AF37]/5" : "border-black/5 dark:border-white/5 bg-black/2 dark:bg-white/2"}`}>
                              <div className="flex-1 min-w-0">
                                <p className="text-[#4B4B4B] dark:text-gray-300 text-base">{item.description}</p>
                                <p className="text-[#9E9E9E] dark:text-gray-500 text-sm">{item.category} · {item.unit_price_ht.toFixed(2)} € HT / {item.unit}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <input type="number" min="0" step="0.1" value={qty} onChange={e => setQty(item.id, e.target.value)}
                                  placeholder="0" className="w-20 bg-[#F5F4F0] dark:bg-[#0A0A0A] border border-black/10 dark:border-white/15 text-[#1A1A1A] dark:text-white text-base px-2 py-1.5 rounded-sm text-right focus:outline-none focus:border-[#D4AF37]/50" />
                                <span className="text-[#9E9E9E] dark:text-gray-500 text-sm w-8">{item.unit}</span>
                                {qty > 0 && <span className="text-[#D4AF37] text-sm font-semibold w-20 text-right">{lineTotal.toFixed(2)} €</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}

                  {/* Récapitulatif */}
                  {lineItems.length > 0 && (
                    <div className="bg-[#F5F4F0] dark:bg-[#0D0D0D] border border-[#D4AF37]/20 rounded-sm p-4">
                      <p className="text-sm text-[#9E9E9E] dark:text-gray-500 uppercase tracking-widest mb-3 font-semibold">Récapitulatif estimation</p>
                      <div className="space-y-1 text-base mb-3">
                        {lineItems.map(l => (
                          <div key={l.pricing_item_id} className="flex justify-between">
                            <span className="text-[#737373] dark:text-gray-400">{l.description} × {l.quantity} {l.unit}</span>
                            <span className="text-[#4B4B4B] dark:text-gray-300">{(l.unit_price_ht * l.quantity).toFixed(2)} €</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-black/7 dark:border-white/5 pt-3 space-y-1">
                        <div className="flex justify-between text-base"><span className="text-[#9E9E9E] dark:text-gray-500">Total HT</span><span className="text-[#4B4B4B] dark:text-gray-300">{totalHT.toFixed(2)} €</span></div>
                        <div className="flex justify-between text-base"><span className="text-[#9E9E9E] dark:text-gray-500">TVA</span><span className="text-[#4B4B4B] dark:text-gray-300">{totalTVA.toFixed(2)} €</span></div>
                        <div className="flex justify-between text-lg font-bold"><span className="text-[#1A1A1A] dark:text-white">Total TTC estimé</span><span className="text-[#D4AF37]">{totalTTC.toFixed(2)} €</span></div>
                      </div>
                      <div className="mt-3 flex items-start gap-2.5 bg-amber-50 dark:bg-[#D4AF37]/5 border border-amber-200 dark:border-[#D4AF37]/20 rounded-sm p-3">
                        <Info size={13} className="text-amber-600 dark:text-[#D4AF37] mt-0.5 flex-shrink-0"/>
                        <p className="text-amber-800 dark:text-[#D4AF37]/80 text-base leading-relaxed">
                          <span className="font-semibold">Estimation prévisionnelle.</span> Ces montants sont calculés sur la base des informations communiquées et restent indicatifs. Une visite technique de l'un de nos experts permettra de confirmer et finaliser le devis définitif.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Description */}
          {step === 3 && (
            <div>
              <h2 className="font-outfit font-bold text-[#1A1A1A] dark:text-white text-2xl mb-1">Décrivez votre projet</h2>
              <p className="text-[#737373] dark:text-gray-400 text-base mb-6">Plus vous êtes précis, plus notre devis sera adapté</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#737373] dark:text-gray-400 uppercase tracking-wider mb-2">Description détaillée *</label>
                  <textarea
                    value={data.description} onChange={e => set("description", e.target.value)}
                    rows={5} placeholder="Décrivez vos travaux, matériaux souhaités, contraintes particulières..."
                    data-testid="wizard-description"
                    className="w-full bg-[#F5F4F0] dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1A1A1A] dark:text-white placeholder-[#ADADAD] dark:placeholder-gray-600 px-4 py-3 text-base rounded-sm resize-none"
                  />
                  <p className={`text-sm mt-1 ${data.description.length < 10 ? "text-[#9E9E9E] dark:text-gray-500" : "text-green-600 dark:text-green-400"}`}>
                    {data.description.length} caractères {data.description.length < 10 ? "(minimum 10)" : "✓"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-[#737373] dark:text-gray-400 uppercase tracking-wider mb-2">Surface approximative</label>
                  <input type="text" value={data.surface} onChange={e => set("surface", e.target.value)}
                    placeholder="Ex: 80 m², 150 m² de terrain..." data-testid="wizard-surface"
                    className="w-full bg-[#F5F4F0] dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1A1A1A] dark:text-white placeholder-[#ADADAD] dark:placeholder-gray-600 px-4 py-2.5 text-base rounded-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Commune */}
          {step === 4 && (
            <div>
              <h2 className="font-outfit font-bold text-[#1A1A1A] dark:text-white text-2xl mb-1">Quelle commune ?</h2>
              <p className="text-[#737373] dark:text-gray-400 text-base mb-6">Indiquez votre commune pour que nous puissions planifier notre déplacement</p>
              <div>
                <label className="block text-sm text-[#737373] dark:text-gray-400 uppercase tracking-wider mb-2">Commune *</label>
                <select
                  value={data.commune} onChange={e => set("commune", e.target.value)} required
                  data-testid="wizard-commune"
                  className="w-full bg-[#F5F4F0] dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 text-[#1A1A1A] dark:text-white px-4 py-2.5 text-base rounded-sm">
                  <option value="">Sélectionner une commune</option>
                  {COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 5 — Budget & Délai */}
          {step === 5 && (
            <div>
              <h2 className="font-outfit font-bold text-[#1A1A1A] dark:text-white text-2xl mb-1">Budget & Délai souhaités</h2>
              <p className="text-[#737373] dark:text-gray-400 text-base mb-6">Ces informations sont indicatives et sans engagement</p>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-[#737373] dark:text-gray-400 uppercase tracking-wider mb-3">Budget estimatif</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BUDGET_RANGES.map(b => (
                      <button key={b} onClick={() => set("budget_range", b)}
                        data-testid={`budget-${b}`}
                        className={`p-2.5 border rounded-sm text-base font-medium transition-all text-center ${
                          data.budget_range === b ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]" : "border-black/8 dark:border-white/8 text-[#737373] dark:text-gray-400 hover:border-black/20 dark:hover:border-white/20 bg-black/3 dark:bg-white/3"
                        }`}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#737373] dark:text-gray-400 uppercase tracking-wider mb-3">Délai souhaité</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DELAYS.map(d => (
                      <button key={d} onClick={() => set("desired_delay", d)}
                        className={`p-2.5 border rounded-sm text-base font-medium transition-all text-center ${
                          data.desired_delay === d ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]" : "border-black/8 dark:border-white/8 text-[#737373] dark:text-gray-400 hover:border-black/20 dark:hover:border-white/20 bg-black/3 dark:bg-white/3"
                        }`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6 — Coordonnées */}
          {step === 6 && (
            <div>
              <h2 className="font-outfit font-bold text-[#1A1A1A] dark:text-white text-2xl mb-1">Vos coordonnées</h2>
              <p className="text-[#737373] dark:text-gray-400 text-base mb-6">Pour vous envoyer votre devis personnalisé</p>
              {user && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-sm mb-4 text-base">
                  <CheckCircle size={14} /> Connecté en tant que {user.name}
                </div>
              )}
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#737373] dark:text-gray-400 uppercase tracking-wider mb-2">Nom complet *</label>
                    <input type="text" value={data.name} onChange={e => set("name", e.target.value)} required
                      placeholder="Votre nom" data-testid="wizard-name"
                      className="w-full bg-[#F5F4F0] dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1A1A1A] dark:text-white placeholder-[#ADADAD] dark:placeholder-gray-600 px-4 py-2.5 text-base rounded-sm" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#737373] dark:text-gray-400 uppercase tracking-wider mb-2">Email *</label>
                    <input type="email" value={data.email} onChange={e => set("email", e.target.value)} required
                      placeholder="votre@email.com" data-testid="wizard-email"
                      className="w-full bg-[#F5F4F0] dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1A1A1A] dark:text-white placeholder-[#ADADAD] dark:placeholder-gray-600 px-4 py-2.5 text-base rounded-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#737373] dark:text-gray-400 uppercase tracking-wider mb-2">Téléphone (optionnel)</label>
                  <input type="tel" value={data.phone} onChange={e => set("phone", e.target.value)}
                    placeholder="0690 XX XX XX" data-testid="wizard-phone"
                    className="w-full bg-[#F5F4F0] dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1A1A1A] dark:text-white placeholder-[#ADADAD] dark:placeholder-gray-600 px-4 py-2.5 text-base rounded-sm" />
                </div>
                {!user && (
                  <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/15 p-4 rounded-sm">
                    <p className="text-[#1A1A1A] dark:text-white text-base font-semibold mb-1">Créez un compte pour suivre votre devis</p>
                    <p className="text-[#737373] dark:text-gray-400 text-sm mb-3">Accédez à votre espace personnel pour consulter et signer votre devis en ligne.</p>
                    <button onClick={() => navigate("/inscription")}
                      className="text-[#D4AF37] text-sm font-bold hover:underline">
                      Créer un compte gratuit →
                    </button>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-black/3 dark:bg-white/3 border border-black/5 dark:border-white/5 rounded-sm space-y-2 text-base">
                <p className="text-sm text-[#9E9E9E] dark:text-gray-500 uppercase tracking-wider font-semibold mb-3">Récapitulatif de votre demande</p>
                <p className="text-[#4B4B4B] dark:text-gray-300"><span className="text-[#9E9E9E] dark:text-gray-500 mr-2">Projet :</span>{PROJECT_TYPES.find(p => p.id === data.project_type)?.label}</p>
                <p className="text-[#4B4B4B] dark:text-gray-300"><span className="text-[#9E9E9E] dark:text-gray-500 mr-2">Prestations :</span>{data.services.map(id => SERVICES_LIST.find(s => s.id === id)?.label).join(", ")}</p>
                <p className="text-[#4B4B4B] dark:text-gray-300"><span className="text-[#9E9E9E] dark:text-gray-500 mr-2">Commune :</span>{data.commune}</p>
                {data.budget_range && <p className="text-[#4B4B4B] dark:text-gray-300"><span className="text-[#9E9E9E] dark:text-gray-500 mr-2">Budget :</span>{data.budget_range}</p>}
              </div>

              {/* Disclaimer estimatif — étape finale */}
              <div className="mt-4 flex items-start gap-2.5 bg-amber-50/60 dark:bg-[#D4AF37]/4 border border-amber-200/70 dark:border-[#D4AF37]/15 rounded-sm p-3.5">
                <Info size={14} className="text-amber-600 dark:text-[#D4AF37] mt-0.5 flex-shrink-0"/>
                <p className="text-amber-800 dark:text-[#D4AF37]/75 text-base leading-relaxed">
                  <span className="font-semibold">Estimation prévisionnelle, non contractuelle.</span> Ce chiffrage est établi à partir des éléments transmis. Afin de garantir la précision du devis définitif, une visite technique <strong>gratuite</strong> par un expert E3C sera programmée. Tout ajustement éventuel vous sera soumis pour validation avant tout engagement.
                </p>
              </div>

              {error && <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-sm text-base">{error}</div>}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-5">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
            className="flex items-center gap-2 text-[#737373] dark:text-gray-400 hover:text-[#1A1A1A] dark:hover:text-white transition-colors text-base font-medium px-4 py-2.5 rounded-sm hover:bg-black/5 dark:hover:bg-white/5">
            <ChevronLeft size={16} /> {step === 0 ? "Retour" : "Précédent"}
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              data-testid="wizard-next"
              className="flex items-center gap-2 bg-[#D4AF37] text-black font-bold px-6 py-2.5 hover:bg-[#E6C65A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-base rounded-sm">
              Suivant <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={submit} disabled={!canNext() || submitting}
              data-testid="wizard-submit"
              className="flex items-center gap-2 bg-[#D4AF37] text-black font-bold px-8 py-2.5 hover:bg-[#E6C65A] transition-colors disabled:opacity-40 text-base rounded-sm">
              {submitting ? <><Loader size={14} className="animate-spin" /> Envoi...</> : <>Envoyer ma demande <ChevronRight size={16} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
