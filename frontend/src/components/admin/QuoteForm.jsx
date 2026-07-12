import { useState } from "react";
import axios from "axios";
import { Plus, Trash2, Save, X } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TVA_DEFAULT = 8.5;

const emptyItem = () => ({ description: "", quantity: 1, unit_price: 0, tva_rate: TVA_DEFAULT });

export default function QuoteForm({ clients, quote, onSaved, onCancel }) {
  const [form, setForm] = useState({
    client_id: quote?.client_id || "",
    project_description: quote?.project_description || "",
    valid_until: quote?.valid_until || "",
    notes: quote?.notes || "",
    client_address: quote?.client_address || "",
    line_items: quote?.line_items?.map(i => ({ ...i })) || [emptyItem()],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setItem = (i, k, v) => {
    const items = [...form.line_items];
    items[i] = { ...items[i], [k]: k === "description" ? v : parseFloat(v) || 0 };
    setForm(p => ({ ...p, line_items: items }));
  };
  const addItem = () => setForm(p => ({ ...p, line_items: [...p.line_items, emptyItem()] }));
  const removeItem = i => setForm(p => ({ ...p, line_items: p.line_items.filter((_, idx) => idx !== i) }));

  const totalHT = form.line_items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const totalTVA = form.line_items.reduce((s, i) => s + (i.quantity * i.unit_price * i.tva_rate / 100), 0);
  const totalTTC = totalHT + totalTVA;

  const submit = async e => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (quote?.id) {
        await axios.put(`${API}/quotes/${quote.id}`, form, { withCredentials: true });
      } else {
        await axios.post(`${API}/quotes`, form, { withCredentials: true });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-[#121212] border border-[#D4AF37]/20 rounded-sm p-6 mb-6" data-testid="quote-form">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-outfit font-bold text-white text-xl">{quote ? "Modifier le devis" : "Nouveau devis"}</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-white"><X size={20}/></button>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 mb-4 text-base rounded-sm">{error}</div>}
      <form onSubmit={submit} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 uppercase tracking-wider mb-2">Client *</label>
            <select value={form.client_id} onChange={e => setField("client_id", e.target.value)} required
              data-testid="quote-client"
              className="w-full bg-[#1A1A1A] border border-white/10 text-white px-4 py-3 text-base rounded-sm">
              <option value="">Sélectionnez un client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 uppercase tracking-wider mb-2">Valable jusqu'au *</label>
            <input type="date" value={form.valid_until} onChange={e => setField("valid_until", e.target.value)} required
              data-testid="quote-valid-until"
              className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-base rounded-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 uppercase tracking-wider mb-2">Description du projet *</label>
          <textarea value={form.project_description} onChange={e => setField("project_description", e.target.value)} required rows={3}
            data-testid="quote-description"
            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 px-4 py-3 text-base rounded-sm resize-none" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 uppercase tracking-wider mb-2">Adresse du chantier</label>
          <input type="text" value={form.client_address} onChange={e => setField("client_address", e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-base rounded-sm" />
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-gray-400 uppercase tracking-wider">Lignes de devis</label>
            <button type="button" onClick={addItem} className="flex items-center gap-1 text-[#D4AF37] text-sm font-semibold hover:underline">
              <Plus size={13}/> Ajouter une ligne
            </button>
          </div>
          <div className="space-y-3">
            {form.line_items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center bg-white/3 border border-white/5 p-3 rounded-sm">
                <div className="col-span-12 md:col-span-5">
                  <input placeholder="Description de la prestation" value={item.description}
                    onChange={e => setItem(i, "description", e.target.value)} required
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 px-3 py-2 text-sm rounded-sm" />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <input type="number" placeholder="Qté" value={item.quantity} min="0" step="0.1"
                    onChange={e => setItem(i, "quantity", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm rounded-sm" />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <input type="number" placeholder="Prix HT" value={item.unit_price} min="0" step="0.01"
                    onChange={e => setItem(i, "unit_price", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm rounded-sm" />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <input type="number" placeholder="TVA%" value={item.tva_rate} min="0" step="0.1"
                    onChange={e => setItem(i, "tva_rate", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm rounded-sm" />
                </div>
                <div className="col-span-1 flex justify-end">
                  {form.line_items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-300 p-1">
                      <Trash2 size={13}/>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right space-y-1">
            <p className="text-gray-400 text-base">Total HT : <span className="text-white font-medium">{totalHT.toFixed(2)} €</span></p>
            <p className="text-gray-400 text-base">TVA : <span className="text-white font-medium">{totalTVA.toFixed(2)} €</span></p>
            <p className="text-[#D4AF37] font-bold text-xl">TOTAL TTC : {totalTTC.toFixed(2)} €</p>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 uppercase tracking-wider mb-2">Notes / Conditions</label>
          <textarea value={form.notes} onChange={e => setField("notes", e.target.value)} rows={2}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 px-4 py-3 text-base rounded-sm resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} data-testid="quote-save-btn"
            className="flex items-center gap-2 bg-[#D4AF37] text-black font-bold px-6 py-3 hover:bg-[#E6C65A] transition-colors disabled:opacity-60 text-base">
            <Save size={15}/> {loading ? "Sauvegarde..." : "Sauvegarder"}
          </button>
          <button type="button" onClick={onCancel} className="px-6 py-3 border border-white/20 text-gray-300 hover:border-white/40 text-base transition-colors">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
