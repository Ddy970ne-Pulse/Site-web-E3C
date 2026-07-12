import { useState } from "react";
import axios from "axios";
import { Plus, Trash2, Save, ArrowLeft, FileText, Zap } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PAYMENT_METHOD_LABELS = { carte: "Carte", virement: "Virement", especes: "Espèces", cheque: "Chèque" };

const emptyTranche = (index) => ({
  id: crypto.randomUUID(),
  label: `Tranche ${index + 1}`,
  amount: 0,
  due_date: "",
  status: "pending",
});

const PRESETS = [
  { id: "full",     label: "100%",       parts: [{ pct: 100,   days: 30, name: "Paiement unique" }] },
  { id: "50-50",   label: "50 / 50",    parts: [{ pct: 50,    days: 7,  name: "Acompte 50%" },   { pct: 50,    days: 45, name: "Solde 50%" }] },
  { id: "30-70",   label: "30 / 70",    parts: [{ pct: 30,    days: 7,  name: "Acompte 30%" },   { pct: 70,    days: 45, name: "Solde 70%" }] },
  { id: "30-30-40",label: "30/30/40",   parts: [{ pct: 30,    days: 7,  name: "Acompte 30%" },   { pct: 30,    days: 30, name: "2ème tranche" }, { pct: 40, days: 60, name: "Solde 40%" }] },
  { id: "33-33-33",label: "1/3 · 1/3 · 1/3", parts: [{ pct: 33.34, days: 7,  name: "1ère tranche" }, { pct: 33.33, days: 30, name: "2ème tranche" }, { pct: 33.33, days: 60, name: "3ème tranche" }] },
];

export default function InvoiceDetail({ invoice, onBack }) {
  const [inv, setInv] = useState(invoice);
  const [tranches, setTranches] = useState(inv.payment_tranches?.length ? inv.payment_tranches : [emptyTranche(0)]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const addTranche = () => setTranches(p => [...p, emptyTranche(p.length)]);
  const removeTranche = i => setTranches(p => p.filter((_, idx) => idx !== i));
  const setTranche = (i, k, v) => {
    const t = [...tranches];
    t[i] = { ...t[i], [k]: k === "amount" ? parseFloat(v) || 0 : v };
    setTranches(t);
  };

  const applyPreset = (preset) => {
    const total = inv.total_ttc;
    const today = new Date();
    let remaining = total;
    const newTranches = preset.parts.map((p, idx) => {
      const due = new Date(today);
      due.setDate(today.getDate() + p.days);
      const isLast = idx === preset.parts.length - 1;
      const amount = isLast
        ? Math.round(remaining * 100) / 100
        : Math.round(total * p.pct / 100 * 100) / 100;
      if (!isLast) remaining -= amount;
      return {
        id: crypto.randomUUID(),
        label: p.name,
        amount,
        due_date: due.toISOString().split("T")[0],
        status: "pending",
      };
    });
    setTranches(newTranches);
  };

  const totalTranches = tranches.reduce((s, t) => s + (t.amount || 0), 0);
  const diff = Math.abs(totalTranches - inv.total_ttc);

  const save = async () => {
    setError(""); setMsg(""); setSaving(true);
    try {
      const res = await axios.put(`${API}/invoices/${inv.id}/tranches`, { tranches }, { withCredentials: true });
      setInv(res.data);
      setTranches(res.data.payment_tranches);
      setMsg("Calendrier de règlement sauvegardé et envoyé au client.");
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la sauvegarde");
    } finally { setSaving(false); }
  };

  const markPaidManually = async (trancheId, method) => {
    if (!method) return;
    setError(""); setMsg("");
    try {
      await axios.post(`${API}/invoices/${inv.id}/tranches/${trancheId}/mark-paid`,
        { payment_method: method }, { withCredentials: true });
      setTranches(p => p.map(t => t.id === trancheId ? { ...t, status: "paid", payment_method: method } : t));
      setMsg("Tranche marquée comme payée.");
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors du pointage du paiement");
    }
  };

  return (
    <div data-testid="invoice-detail">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white text-base mb-5 transition-colors">
        <ArrowLeft size={16}/> Retour aux factures
      </button>
      <div className="bg-[#121212] border border-white/5 rounded-sm p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-outfit font-bold text-white text-2xl">{inv.invoice_number}</h2>
            <p className="text-gray-400 text-base">Devis ref : {inv.quote_number}</p>
          </div>
          <a href={`${API}/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 border border-white/20 text-gray-300 px-4 py-2 text-sm hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors">
            <FileText size={13}/> PDF
          </a>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-base">
          <div><p className="text-gray-500 text-sm uppercase tracking-wider mb-1">Client</p><p className="text-white font-medium">{inv.client_name}</p></div>
          <div><p className="text-gray-500 text-sm uppercase tracking-wider mb-1">Email</p><p className="text-gray-300">{inv.client_email}</p></div>
          <div><p className="text-gray-500 text-sm uppercase tracking-wider mb-1">Montant TTC</p><p className="text-[#D4AF37] font-bold text-xl">{inv.total_ttc?.toFixed(2)} €</p></div>
        </div>
      </div>

      {/* Tranches */}
      <div className="bg-[#121212] border border-white/5 rounded-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-outfit font-bold text-white text-lg">Calendrier de règlement</h3>
          <button onClick={addTranche} className="flex items-center gap-1 text-[#D4AF37] text-sm font-semibold hover:underline">
            <Plus size={13}/> Ajouter une tranche
          </button>
        </div>

        {/* Preset templates */}
        <div className="mb-5 p-4 bg-white/2 border border-white/5 rounded-sm">
          <p className="text-sm text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Zap size={11} className="text-[#D4AF37]"/> Modèles d'acomptes
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(preset => (
              <button
                key={preset.id}
                data-testid={`preset-${preset.id}`}
                onClick={() => applyPreset(preset)}
                className="px-3 py-1.5 text-sm font-semibold border border-white/10 text-gray-300 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all rounded-sm">
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {msg && <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 mb-4 text-base rounded-sm">{msg}</div>}
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 mb-4 text-base rounded-sm">{error}</div>}

        <div className="space-y-3 mb-4">
          {tranches.map((t, i) => (
            <div key={t.id} className="grid grid-cols-12 gap-3 items-center bg-white/3 border border-white/5 p-3 rounded-sm">
              <div className="col-span-12 md:col-span-4">
                <input placeholder="Libellé (ex: Acompte 30%)" value={t.label}
                  onChange={e => setTranche(i, "label", e.target.value)}
                  disabled={t.status === "paid"}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 px-3 py-2 text-sm rounded-sm disabled:opacity-60" />
              </div>
              <div className="col-span-5 md:col-span-3">
                <input type="number" placeholder="Montant €" value={t.amount} min="0" step="0.01"
                  onChange={e => setTranche(i, "amount", e.target.value)}
                  disabled={t.status === "paid"}
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm rounded-sm disabled:opacity-60" />
              </div>
              <div className="col-span-5 md:col-span-3">
                <input type="date" value={t.due_date}
                  onChange={e => setTranche(i, "due_date", e.target.value)}
                  disabled={t.status === "paid"}
                  className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm rounded-sm disabled:opacity-60" />
              </div>
              <div className="col-span-12 md:col-span-2">
                {t.status === "paid" ? (
                  <span className="text-sm font-semibold px-2 py-1 rounded-sm text-green-400 bg-green-400/10">
                    Payé{t.payment_method ? ` · ${PAYMENT_METHOD_LABELS[t.payment_method] || t.payment_method}` : ""}
                  </span>
                ) : (
                  <select
                    defaultValue=""
                    data-testid={`mark-paid-${t.id}`}
                    onChange={e => markPaidManually(t.id, e.target.value)}
                    className="w-full bg-yellow-400/10 text-yellow-400 text-sm font-semibold px-2 py-1.5 rounded-sm border-0">
                    <option value="" disabled>En attente</option>
                    <option value="virement">Marquer payé — Virement</option>
                    <option value="especes">Marquer payé — Espèces</option>
                    <option value="cheque">Marquer payé — Chèque</option>
                  </select>
                )}
              </div>
              <div className="col-span-12 md:col-span-1 flex justify-end">
                {t.status !== "paid" && tranches.length > 1 && (
                  <button onClick={() => removeTranche(i)} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 size={13}/>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <div>
            <p className="text-base text-gray-400">Total tranches : <span className={`font-bold ${diff < 0.01 ? "text-green-400" : "text-red-400"}`}>{totalTranches.toFixed(2)} €</span></p>
            <p className="text-sm text-gray-500">Total facture : {inv.total_ttc?.toFixed(2)} €</p>
            {diff >= 0.01 && <p className="text-red-400 text-sm mt-1">Différence : {diff.toFixed(2)} € — Le total doit correspondre au TTC</p>}
          </div>
          <button onClick={save} disabled={saving || diff >= 0.01}
            data-testid="save-tranches-btn"
            className="flex items-center gap-2 bg-[#D4AF37] text-black font-bold px-6 py-3 hover:bg-[#E6C65A] transition-colors disabled:opacity-50 text-base">
            <Save size={15}/> {saving ? "Sauvegarde..." : "Valider & Notifier le client"}
          </button>
        </div>
      </div>
    </div>
  );
}
