import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Users, FileText, Receipt, CreditCard, Plus, LogOut, ChevronRight, Clock, CheckCircle, XCircle, AlertCircle, Eye, Send, RefreshCw, TrendingUp, Inbox, Image, MessageSquare, Trash2, Upload } from "lucide-react";
import QuoteForm from "@/components/admin/QuoteForm";
import InvoiceDetail from "@/components/admin/InvoiceDetail";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = () => axios.create({ withCredentials: true });

const STATUS_LABELS = {
  draft: { label: "Brouillon", color: "text-gray-400 bg-gray-400/10" },
  sent: { label: "Envoyé", color: "text-blue-400 bg-blue-400/10" },
  accepted: { label: "Accepté", color: "text-green-400 bg-green-400/10" },
  refused: { label: "Refusé", color: "text-red-400 bg-red-400/10" },
  converted: { label: "Converti", color: "text-purple-400 bg-purple-400/10" },
  pending: { label: "En attente", color: "text-yellow-400 bg-yellow-400/10" },
  partial: { label: "Partiel", color: "text-orange-400 bg-orange-400/10" },
  paid: { label: "Payé", color: "text-green-400 bg-green-400/10" },
};

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || { label: status, color: "text-gray-400 bg-gray-400/10" };
  return <span className={`text-xs font-semibold px-2 py-1 rounded-sm uppercase tracking-wide ${s.color}`}>{s.label}</span>;
}

function StatCard({ icon: Icon, label, value, color = "text-[#D4AF37]" }) {
  return (
    <div className="bg-[#121212] border border-white/5 p-6 rounded-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 uppercase tracking-widest">{label}</span>
        <Icon size={18} className={color} />
      </div>
      <p className={`font-outfit font-bold text-3xl ${color}`}>{value}</p>
    </div>
  );
}

const GALLERY_CATEGORIES = ["Maçonnerie", "Toiture", "Rénovation", "Peinture", "Carrelage"];
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function GalleryTab({ images, onRefresh }) {
  const [file, setFile] = useState(null);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("Maçonnerie");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (!label) setLabel(f.name.replace(/\.[^.]+$/, "").replace(/-|_/g, " "));
  };

  const upload = async e => {
    e.preventDefault();
    if (!file || !label.trim()) { setError("Fichier et libellé requis."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("label", label.trim());
      fd.append("category", category);
      await ax().post(`${API}/gallery`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSuccess("Photo ajoutée avec succès !");
      setFile(null); setLabel(""); setPreview(null);
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'upload.");
    } finally { setLoading(false); }
  };

  const deleteImg = async id => {
    if (!window.confirm("Supprimer cette photo ?")) return;
    try { await ax().delete(`${API}/gallery/${id}`); onRefresh(); }
    catch { alert("Erreur lors de la suppression."); }
  };

  return (
    <div>
      <h1 className="font-outfit font-bold text-2xl text-white mb-6">Galerie ({images.length} photos admin)</h1>

      {/* Upload form */}
      <div className="bg-[#121212] border border-white/5 rounded-sm p-6 mb-8">
        <h3 className="font-outfit font-semibold text-white text-sm mb-4 flex items-center gap-2"><Upload size={14} className="text-[#D4AF37]" /> Ajouter une photo</h3>
        <form onSubmit={upload} className="space-y-4">
          {/* Drop zone */}
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-[#D4AF37]/30 rounded-sm p-8 cursor-pointer transition-colors group">
            {preview
              ? <img src={preview} alt="preview" className="max-h-40 object-contain mb-3 rounded-sm" />
              : <><Upload size={28} className="text-gray-600 group-hover:text-[#D4AF37]/60 mb-2 transition-colors" /><p className="text-gray-500 text-sm">Cliquer pour choisir une photo (JPEG, PNG, WEBP · max 10 Mo)</p></>
            }
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" data-testid="gallery-file-input" />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest mb-1.5 block">Libellé *</label>
              <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Résidence Martin, Rénovation cuisine…"
                className="w-full bg-[#0A0A0A] border border-white/10 text-white text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-[#D4AF37]/40" data-testid="gallery-label-input" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest mb-1.5 block">Catégorie *</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/10 text-white text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-[#D4AF37]/40" data-testid="gallery-category-select">
                {GALLERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-green-400 text-xs">{success}</p>}
          <button type="submit" disabled={loading} data-testid="gallery-upload-btn"
            className="flex items-center gap-2 bg-[#D4AF37] text-black font-bold text-sm px-6 py-2.5 hover:bg-[#E6C65A] transition-colors rounded-sm disabled:opacity-60">
            {loading ? "Upload…" : <><Upload size={14}/> Publier dans la galerie</>}
          </button>
        </form>
      </div>

      {/* Photo list */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map(img => (
          <div key={img.id} className="relative group bg-[#141414] border border-white/5 rounded-sm overflow-hidden">
            <img src={`${BACKEND_URL}${img.url}`} alt={img.label} className="w-full aspect-video object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
              <button onClick={() => deleteImg(img.id)} className="self-end w-7 h-7 bg-red-500/80 hover:bg-red-500 rounded-sm flex items-center justify-center" data-testid={`delete-gallery-${img.id}`}>
                <Trash2 size={13} className="text-white" />
              </button>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#D4AF37]">{img.category}</span>
                <p className="text-white text-xs font-medium leading-snug">{img.label}</p>
              </div>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <div className="col-span-4 py-12 text-center border border-dashed border-white/10 rounded-sm">
            <p className="text-gray-500 text-sm">Aucune photo uploadée. Les photos statiques sont toujours visibles dans la galerie publique.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TestimonialsTab({ testimonials, onRefresh }) {
  const updateStatus = async (id, status) => {
    try { await ax().patch(`${API}/testimonials/${id}`, { status }); onRefresh(); }
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
          <div key={t.id} className={`bg-[#121212] border rounded-sm p-5 ${t.status === "pending" ? "border-yellow-400/20" : t.status === "approved" ? "border-green-500/15" : "border-white/5"}`} data-testid={`testimonial-admin-${t.id}`}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  {t.commune && <span className="text-xs text-gray-500">{t.commune}</span>}
                  {t.service && <span className="text-xs text-[#D4AF37]/70">{t.service}</span>}
                  <div className="flex gap-0.5 ml-1">
                    {Array.from({length:5}).map((_,i) => <span key={i} className={`text-[10px] ${i < t.stars ? "text-[#D4AF37]" : "text-gray-700"}`}>★</span>)}
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
                    <CheckCircle size={12}/> Publier
                  </button>
                )}
                {t.status !== "rejected" && (
                  <button onClick={() => updateStatus(t.id, "rejected")} data-testid={`reject-${t.id}`}
                    className="flex items-center gap-1 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/15 px-3 py-1.5 rounded-sm transition-colors">
                    <XCircle size={12}/> Rejeter
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

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard");
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [editQuote, setEditQuote] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [q, inv, cl, pay, qr, gal, testi] = await Promise.all([
        ax().get(`${API}/quotes`),
        ax().get(`${API}/invoices`),
        ax().get(`${API}/clients`),
        ax().get(`${API}/payments`),
        ax().get(`${API}/quote-requests`),
        ax().get(`${API}/gallery`),
        ax().get(`${API}/testimonials/admin`),
      ]);
      setQuotes(q.data); setInvoices(inv.data); setClients(cl.data); setPayments(pay.data);
      setQuoteRequests(qr.data); setGalleryImages(gal.data); setTestimonials(testi.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleLogout = async () => { await logout(); navigate("/"); };

  const sendQuote = async (id) => {
    await ax().post(`${API}/quotes/${id}/send`);
    fetchAll();
  };

  const convertToInvoice = async (id) => {
    await ax().post(`${API}/quotes/${id}/convert`);
    fetchAll();
    setTab("invoices");
  };

  const tabs = [
    { id: "dashboard", label: "Tableau de bord", icon: Receipt },
    { id: "analytics", label: "Analytiques", icon: TrendingUp },
    { id: "requests", label: "Demandes devis", icon: Inbox },
    { id: "gallery", label: "Galerie", icon: Image },
    { id: "testimonials", label: "Témoignages", icon: MessageSquare },
    { id: "clients", label: "Clients", icon: Users },
    { id: "quotes", label: "Devis", icon: FileText },
    { id: "invoices", label: "Factures", icon: Receipt },
    { id: "payments", label: "Paiements", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-[#050505] border-r border-white/5 fixed h-full z-40">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D4AF37] flex items-center justify-center">
              <span className="font-outfit font-black text-black text-xs">E3C</span>
            </div>
            <div>
              <p className="font-outfit font-bold text-white text-sm">Administration</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-colors ${tab === t.id ? "bg-[#D4AF37]/10 text-[#D4AF37] font-semibold" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-red-400 transition-colors rounded-sm">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-60 p-6">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between mb-6 pb-4 border-b border-white/5">
          <span className="font-outfit font-bold text-white">Admin E3C</span>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-400"><LogOut size={18}/></button>
        </div>
        {/* Mobile tabs */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-4 mb-4">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${tab === t.id ? "bg-[#D4AF37] text-black" : "bg-[#121212] text-gray-400 border border-white/5"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {tab === "dashboard" && (
          <div>
            <h1 className="font-outfit font-bold text-2xl text-white mb-6">Tableau de bord</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={FileText} label="Devis total" value={quotes.length} />
              <StatCard icon={CheckCircle} label="Acceptés" value={quotes.filter(q => q.status === "accepted").length} color="text-green-400" />
              <StatCard icon={Receipt} label="Factures" value={invoices.length} />
              <StatCard icon={CreditCard} label="Paiements encaissés" value={`${payments.filter(p => p.payment_status === "paid").length}`} color="text-green-400" />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#121212] border border-white/5 rounded-sm p-5">
                <h3 className="font-outfit font-semibold text-white mb-4 flex items-center justify-between">
                  Devis récents
                  <button onClick={() => setTab("quotes")} className="text-xs text-[#D4AF37] hover:underline">Voir tout</button>
                </h3>
                <div className="space-y-3">
                  {quotes.slice(0, 5).map(q => (
                    <div key={q.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-white text-sm font-medium">{q.quote_number}</p>
                        <p className="text-gray-400 text-xs">{q.client_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{q.total_ttc?.toFixed(2)} €</span>
                        <StatusBadge status={q.status} />
                      </div>
                    </div>
                  ))}
                  {quotes.length === 0 && <p className="text-gray-500 text-sm">Aucun devis</p>}
                </div>
              </div>
              <div className="bg-[#121212] border border-white/5 rounded-sm p-5">
                <h3 className="font-outfit font-semibold text-white mb-4 flex items-center justify-between">
                  Factures récentes
                  <button onClick={() => setTab("invoices")} className="text-xs text-[#D4AF37] hover:underline">Voir tout</button>
                </h3>
                <div className="space-y-3">
                  {invoices.slice(0, 5).map(inv => (
                    <div key={inv.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-white text-sm font-medium">{inv.invoice_number}</p>
                        <p className="text-gray-400 text-xs">{inv.client_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{inv.total_ttc?.toFixed(2)} €</span>
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  ))}
                  {invoices.length === 0 && <p className="text-gray-500 text-sm">Aucune facture</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {tab === "analytics" && (() => {
          const now = new Date();
          const thisMonth = now.getMonth();
          const thisYear = now.getFullYear();

          const caTotal = payments.filter(p => p.payment_status === "paid").reduce((s, p) => s + (p.amount || 0), 0);
          const caMois = payments.filter(p => {
            if (p.payment_status !== "paid") return false;
            const d = new Date(p.created_at);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
          }).reduce((s, p) => s + (p.amount || 0), 0);

          const totalQuotes = quotes.length;
          const convertedQuotes = quotes.filter(q => ["accepted", "converted"].includes(q.status)).length;
          const tauxConversion = totalQuotes > 0 ? Math.round((convertedQuotes / totalQuotes) * 100) : 0;

          // CA par mois (6 derniers mois)
          const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(thisYear, thisMonth - (5 - i), 1);
            return { label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }), month: d.getMonth(), year: d.getFullYear() };
          });
          const monthlyCA = months.map(m => ({
            ...m,
            ca: payments.filter(p => {
              if (p.payment_status !== "paid") return false;
              const d = new Date(p.created_at);
              return d.getMonth() === m.month && d.getFullYear() === m.year;
            }).reduce((s, p) => s + (p.amount || 0), 0),
          }));
          const maxCA = Math.max(...monthlyCA.map(m => m.ca), 1);

          return (
            <div>
              <h1 className="font-outfit font-bold text-2xl text-white mb-6">Analytiques</h1>

              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#121212] border border-white/5 p-5 rounded-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">CA Total encaissé</p>
                  <p className="font-outfit font-bold text-2xl text-[#D4AF37]">{caTotal.toLocaleString("fr-FR", { minimumFractionDigits: 0 })} €</p>
                </div>
                <div className="bg-[#121212] border border-white/5 p-5 rounded-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">CA ce mois</p>
                  <p className="font-outfit font-bold text-2xl text-green-400">{caMois.toLocaleString("fr-FR", { minimumFractionDigits: 0 })} €</p>
                </div>
                <div className="bg-[#121212] border border-white/5 p-5 rounded-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Taux de conversion</p>
                  <p className="font-outfit font-bold text-2xl text-blue-400">{tauxConversion}%</p>
                  <p className="text-xs text-gray-600 mt-1">{convertedQuotes}/{totalQuotes} devis</p>
                </div>
                <div className="bg-[#121212] border border-white/5 p-5 rounded-sm">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Demandes wizard</p>
                  <p className="font-outfit font-bold text-2xl text-purple-400">{quoteRequests.length}</p>
                  <p className="text-xs text-gray-600 mt-1">via formulaire /devis</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* CA mensuel — barres CSS */}
                <div className="bg-[#121212] border border-white/5 rounded-sm p-5">
                  <h3 className="font-outfit font-semibold text-white mb-5 text-sm">CA encaissé — 6 derniers mois</h3>
                  <div className="space-y-3">
                    {monthlyCA.map(m => (
                      <div key={`${m.month}-${m.year}`} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-14 flex-shrink-0 capitalize">{m.label}</span>
                        <div className="flex-1 bg-white/5 rounded-sm h-5 overflow-hidden">
                          <div
                            className="h-full bg-[#D4AF37]/70 rounded-sm transition-all duration-500"
                            style={{ width: `${maxCA > 0 ? (m.ca / maxCA) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-300 w-20 text-right flex-shrink-0">{m.ca.toLocaleString("fr-FR")} €</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Statuts devis */}
                <div className="bg-[#121212] border border-white/5 rounded-sm p-5">
                  <h3 className="font-outfit font-semibold text-white mb-5 text-sm">Répartition des devis</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Brouillons", count: quotes.filter(q => q.status === "draft").length, color: "bg-gray-500/60" },
                      { label: "Envoyés", count: quotes.filter(q => q.status === "sent").length, color: "bg-blue-500/60" },
                      { label: "Acceptés", count: quotes.filter(q => q.status === "accepted").length, color: "bg-green-500/60" },
                      { label: "Convertis", count: quotes.filter(q => q.status === "converted").length, color: "bg-purple-500/60" },
                      { label: "Refusés", count: quotes.filter(q => q.status === "refused").length, color: "bg-red-500/60" },
                    ].map(s => (
                      <div key={s.label} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-20 flex-shrink-0">{s.label}</span>
                        <div className="flex-1 bg-white/5 rounded-sm h-5 overflow-hidden">
                          <div
                            className={`h-full ${s.color} rounded-sm transition-all duration-500`}
                            style={{ width: `${totalQuotes > 0 ? (s.count / totalQuotes) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-300 w-6 text-right flex-shrink-0">{s.count}</span>
                      </div>
                    ))}
                    {totalQuotes === 0 && <p className="text-gray-500 text-sm">Aucun devis</p>}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Quote Requests Tab */}
        {tab === "requests" && (
          <div>
            <h1 className="font-outfit font-bold text-2xl text-white mb-6">Demandes de devis via Wizard ({quoteRequests.length})</h1>
            <div className="space-y-3">
              {quoteRequests.map((r, i) => (
                <div key={r.id || i} className="bg-[#121212] border border-white/5 rounded-sm p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-outfit font-semibold text-white text-sm">{r.name || "—"}</p>
                        <span className="text-xs text-gray-500">{r.email}</span>
                        {r.phone && <span className="text-xs text-gray-500">{r.phone}</span>}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {r.project_type && <span className="text-xs bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-sm">{r.project_type}</span>}
                        {r.commune && <span className="text-xs bg-white/5 text-gray-300 px-2 py-0.5 rounded-sm">{r.commune}</span>}
                        {r.budget_range && <span className="text-xs bg-white/5 text-gray-300 px-2 py-0.5 rounded-sm">{r.budget_range}</span>}
                        {r.desired_delay && <span className="text-xs bg-white/5 text-gray-300 px-2 py-0.5 rounded-sm">{r.desired_delay}</span>}
                      </div>
                      {r.services?.length > 0 && (
                        <p className="text-xs text-gray-400">Prestations : {r.services.join(", ")}</p>
                      )}
                      {r.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.description}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-sm mt-1 inline-block ${r.status === "new" ? "bg-blue-400/10 text-blue-400" : "bg-gray-400/10 text-gray-400"}`}>
                        {r.status === "new" ? "Nouveau" : r.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {quoteRequests.length === 0 && (
                <div className="bg-[#121212] border border-white/5 rounded-sm p-12 text-center">
                  <p className="text-gray-500 text-sm">Aucune demande via le wizard pour le moment</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gallery Tab */}
        {tab === "gallery" && (
          <GalleryTab images={galleryImages} onRefresh={fetchAll} />
        )}

        {/* Testimonials Tab */}
        {tab === "testimonials" && (
          <TestimonialsTab testimonials={testimonials} onRefresh={fetchAll} />
        )}

        {/* Clients Tab */}
        {tab === "clients" && (
          <div>
            <h1 className="font-outfit font-bold text-2xl text-white mb-6">Clients ({clients.length})</h1>
            <div className="bg-[#121212] border border-white/5 rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-white/5">
                  <tr className="text-left">
                    {["Nom", "Email", "Téléphone", "Inscrit le"].map(h => (
                      <th key={h} className="px-4 py-3 text-xs text-gray-400 uppercase tracking-wider font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-gray-300">{c.email}</td>
                      <td className="px-4 py-3 text-gray-300">{c.phone || "—"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(c.created_at).toLocaleDateString("fr-FR")}</td>
                    </tr>
                  ))}
                  {clients.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Aucun client</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quotes Tab */}
        {tab === "quotes" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-outfit font-bold text-2xl text-white">Devis ({quotes.length})</h1>
              <button onClick={() => { setEditQuote(null); setShowQuoteForm(true); }}
                data-testid="create-quote-btn"
                className="flex items-center gap-2 bg-[#D4AF37] text-black font-bold px-5 py-2.5 hover:bg-[#E6C65A] transition-colors text-sm">
                <Plus size={16}/> Nouveau devis
              </button>
            </div>
            {showQuoteForm && (
              <QuoteForm clients={clients} quote={editQuote}
                onSaved={() => { setShowQuoteForm(false); setEditQuote(null); fetchAll(); }}
                onCancel={() => { setShowQuoteForm(false); setEditQuote(null); }} />
            )}
            <div className="bg-[#121212] border border-white/5 rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-white/5">
                  <tr className="text-left">
                    {["Numéro", "Client", "Montant TTC", "Statut", "Date", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-xs text-gray-400 uppercase tracking-wider font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quotes.map(q => (
                    <tr key={q.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3 text-[#D4AF37] font-medium">{q.quote_number}</td>
                      <td className="px-4 py-3 text-white">{q.client_name}</td>
                      <td className="px-4 py-3 text-white font-medium">{q.total_ttc?.toFixed(2)} €</td>
                      <td className="px-4 py-3"><StatusBadge status={q.status}/></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(q.created_at).toLocaleDateString("fr-FR")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {q.status === "draft" && (
                            <button onClick={() => sendQuote(q.id)} title="Envoyer au client"
                              className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-sm transition-colors">
                              <Send size={13}/>
                            </button>
                          )}
                          {q.status === "accepted" && (
                            <button onClick={() => convertToInvoice(q.id)} title="Convertir en facture"
                              className="p-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-sm transition-colors">
                              <Receipt size={13}/>
                            </button>
                          )}
                          {(q.status === "draft") && (
                            <button onClick={() => { setEditQuote(q); setShowQuoteForm(true); }} title="Modifier"
                              className="p-1.5 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 rounded-sm transition-colors">
                              <Eye size={13}/>
                            </button>
                          )}
                          <a href={`${API}/quotes/${q.id}/pdf`} target="_blank" rel="noreferrer" title="Télécharger PDF"
                            className="p-1.5 bg-white/5 text-gray-400 hover:bg-white/10 rounded-sm transition-colors">
                            <FileText size={13}/>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {quotes.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucun devis</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {tab === "invoices" && (
          <div>
            <h1 className="font-outfit font-bold text-2xl text-white mb-6">Factures ({invoices.length})</h1>
            {selectedInvoice ? (
              <InvoiceDetail invoice={selectedInvoice} onBack={() => { setSelectedInvoice(null); fetchAll(); }} />
            ) : (
              <div className="bg-[#121212] border border-white/5 rounded-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/5">
                    <tr className="text-left">
                      {["Numéro", "Client", "Montant TTC", "Tranches", "Statut", "Date", "Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-xs text-gray-400 uppercase tracking-wider font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3 text-[#D4AF37] font-medium">{inv.invoice_number}</td>
                        <td className="px-4 py-3 text-white">{inv.client_name}</td>
                        <td className="px-4 py-3 text-white font-medium">{inv.total_ttc?.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-gray-300">{inv.payment_tranches?.length || 0} tranche(s)</td>
                        <td className="px-4 py-3"><StatusBadge status={inv.status}/></td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(inv.created_at).toLocaleDateString("fr-FR")}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => setSelectedInvoice(inv)} title="Gérer"
                              className="p-1.5 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 rounded-sm transition-colors">
                              <Eye size={13}/>
                            </button>
                            <a href={`${API}/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer" title="PDF"
                              className="p-1.5 bg-white/5 text-gray-400 hover:bg-white/10 rounded-sm transition-colors">
                              <FileText size={13}/>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Aucune facture</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {tab === "payments" && (
          <div>
            <h1 className="font-outfit font-bold text-2xl text-white mb-6">Paiements ({payments.length})</h1>
            <div className="bg-[#121212] border border-white/5 rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-white/5">
                  <tr className="text-left">
                    {["Facture", "Client", "Tranche", "Montant", "Statut", "Date"].map(h => (
                      <th key={h} className="px-4 py-3 text-xs text-gray-400 uppercase tracking-wider font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} className="border-b border-white/3 hover:bg-white/2">
                      <td className="px-4 py-3 text-[#D4AF37] font-medium">{p.invoice_number}</td>
                      <td className="px-4 py-3 text-white">{p.client_name}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{p.tranche_label}</td>
                      <td className="px-4 py-3 text-white font-medium">{p.amount?.toFixed(2)} €</td>
                      <td className="px-4 py-3"><StatusBadge status={p.payment_status}/></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(p.created_at).toLocaleDateString("fr-FR")}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucun paiement</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
