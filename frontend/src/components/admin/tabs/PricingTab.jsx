import { useState } from "react";
import { Receipt } from "lucide-react";
import { pricingApi } from "@/api";

const PRICING_UNITS = ["m²", "ml", "m³", "pièce", "heure", "forfait", "jour", "kg", "sac"];
const PRICING_CATEGORIES = ["Maçonnerie", "Toiture", "Rénovation", "Peinture", "Carrelage", "Charpente", "Terrassement", "Plomberie", "Électricité", "Divers"];
const TVA_DOM = 8.5;

export default function PricingTab({ items, onRefresh }) {
  const EMPTY = { category: "Maçonnerie", description: "", unit: "m²", unit_price_ht: "", tva_rate: TVA_DOM, active: true };
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterCat, setFilterCat] = useState("Tout");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async e => {
    e.preventDefault();
    if (!form.description.trim() || form.unit_price_ht === "") { setError("Description et prix requis."); return; }
    setLoading(true); setError("");
    try {
      const payload = { ...form, unit_price_ht: parseFloat(form.unit_price_ht) };
      if (editId) {
        await pricingApi.update(editId, payload);
      } else {
        await pricingApi.create(payload);
      }
      setForm(EMPTY); setEditId(null);
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur.");
    } finally { setLoading(false); }
  };

  const startEdit = item => {
    setForm({ category: item.category, description: item.description, unit: item.unit, unit_price_ht: item.unit_price_ht, tva_rate: item.tva_rate, active: item.active });
    setEditId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleActive = async item => {
    await pricingApi.update(item.id, { active: !item.active });
    onRefresh();
  };

  const deleteItem = async id => {
    if (!window.confirm("Supprimer cet article ?")) return;
    await pricingApi.delete(id);
    onRefresh();
  };

  const filtered = filterCat === "Tout" ? items : items.filter(i => i.category === filterCat);
  const groupedCats = [...new Set(items.map(i => i.category))];

  return (
    <div>
      <h1 className="font-outfit font-bold text-2xl text-white mb-2">Grille tarifaire</h1>
      <p className="text-gray-500 text-sm mb-6">Les articles actifs sont utilisés par les clients pour construire leur devis estimatif.</p>

      <div className="bg-[#121212] border border-[#D4AF37]/20 rounded-sm p-6 mb-8">
        <h3 className="font-outfit font-semibold text-white text-sm mb-4 flex items-center gap-2">
          <Receipt size={14} className="text-[#D4AF37]" />
          {editId ? "Modifier l'article" : "Ajouter un article"}
        </h3>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest mb-1.5 block">Catégorie *</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/10 text-white text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:border-[#D4AF37]/40" data-testid="pricing-category">
                {PRICING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="text-xs text-gray-500 uppercase tracking-widest mb-1.5 block">Description *</label>
              <input value={form.description} onChange={e => set("description", e.target.value)}
                placeholder="Ex : Mur en agglos 15cm…"
                className="w-full bg-[#0A0A0A] border border-white/10 text-white text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:border-[#D4AF37]/40" data-testid="pricing-description" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest mb-1.5 block">Unité *</label>
              <select value={form.unit} onChange={e => set("unit", e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/10 text-white text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:border-[#D4AF37]/40" data-testid="pricing-unit">
                {PRICING_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest mb-1.5 block">Prix HT (€) *</label>
              <input type="number" min="0" step="0.01" value={form.unit_price_ht} onChange={e => set("unit_price_ht", e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0A0A0A] border border-white/10 text-white text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:border-[#D4AF37]/40" data-testid="pricing-price" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest mb-1.5 block">TVA (%)</label>
              <input type="number" min="0" max="100" step="0.5" value={form.tva_rate} onChange={e => set("tva_rate", parseFloat(e.target.value))}
                className="w-full bg-[#0A0A0A] border border-white/10 text-white text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:border-[#D4AF37]/40" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active-chk" checked={form.active} onChange={e => set("active", e.target.checked)} className="accent-[#D4AF37]" />
            <label htmlFor="active-chk" className="text-gray-300 text-sm">Actif (visible dans le wizard devis)</label>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={loading} data-testid="pricing-save-btn"
              className="flex items-center gap-2 bg-[#D4AF37] text-black font-bold text-sm px-6 py-2.5 hover:bg-[#E6C65A] rounded-sm disabled:opacity-60 transition-colors">
              {loading ? "Enregistrement…" : editId ? "Mettre à jour" : "Ajouter à la grille"}
            </button>
            {editId && (
              <button type="button" onClick={() => { setForm(EMPTY); setEditId(null); }}
                className="text-gray-400 hover:text-white text-sm px-4 py-2.5 border border-white/10 rounded-sm transition-colors">
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {["Tout", ...groupedCats].map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-sm border transition-all ${filterCat === c ? "bg-[#D4AF37] border-[#D4AF37] text-black" : "border-white/10 text-gray-400 hover:border-white/20"}`}>
            {c}
          </button>
        ))}
        <span className="text-gray-600 text-xs ml-2 flex-shrink-0">{filtered.length} article{filtered.length > 1 ? "s" : ""}</span>
      </div>

      <div className="bg-[#121212] border border-white/5 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Description</th>
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Catégorie</th>
              <th className="text-right text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Prix HT</th>
              <th className="text-center text-xs text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Unité</th>
              <th className="text-center text-xs text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">TVA</th>
              <th className="text-center text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => (
              <tr key={item.id} className={`border-b border-white/5 last:border-0 hover:bg-white/2 ${!item.active ? "opacity-50" : ""}`} data-testid={`pricing-row-${i}`}>
                <td className="px-4 py-3"><p className="text-white font-medium">{item.description}</p></td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-[#D4AF37]/80 bg-[#D4AF37]/8 px-2 py-0.5 rounded-sm">{item.category}</span>
                </td>
                <td className="px-4 py-3 text-right"><span className="text-white font-semibold">{item.unit_price_ht.toFixed(2)} €</span></td>
                <td className="px-4 py-3 text-center hidden sm:table-cell"><span className="text-gray-400 text-xs">{item.unit}</span></td>
                <td className="px-4 py-3 text-center hidden sm:table-cell"><span className="text-gray-400 text-xs">{item.tva_rate}%</span></td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleActive(item)}
                    className={`text-xs px-2 py-1 rounded-sm border transition-colors ${item.active ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                    {item.active ? "Actif" : "Inactif"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => startEdit(item)} data-testid={`edit-pricing-${item.id}`} className="text-xs text-[#D4AF37] hover:underline">Modifier</button>
                    <button onClick={() => deleteItem(item.id)} data-testid={`delete-pricing-${item.id}`} className="text-xs text-red-400 hover:underline">Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500 text-sm">Aucun article. Ajoutez vos premières prestations ci-dessus.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
