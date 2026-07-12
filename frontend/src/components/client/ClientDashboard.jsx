import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LogOut, FileText, Receipt, CreditCard, CheckCircle, XCircle, Download, AlertCircle, Landmark, Copy, Wallet } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ax = () => axios.create({ withCredentials: true });

const STATUS_LABELS = {
  draft: { label: "En préparation", color: "text-gray-400 bg-gray-400/10" },
  sent: { label: "À signer", color: "text-blue-400 bg-blue-400/10 animate-pulse" },
  accepted: { label: "Accepté", color: "text-green-400 bg-green-400/10" },
  refused: { label: "Refusé", color: "text-red-400 bg-red-400/10" },
  converted: { label: "Facturé", color: "text-purple-400 bg-purple-400/10" },
  pending: { label: "En attente", color: "text-yellow-400 bg-yellow-400/10" },
  partial: { label: "Partiel", color: "text-orange-400 bg-orange-400/10" },
  paid: { label: "Payé", color: "text-green-400 bg-green-400/10" },
};

function StatusBadge({ status }) {
  const s = STATUS_LABELS[status] || { label: status, color: "text-gray-400 bg-gray-400/10" };
  return <span className={`text-sm font-semibold px-2 py-1 rounded-sm uppercase tracking-wide ${s.color}`}>{s.label}</span>;
}

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState("quotes");
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMsg, setPaymentMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [bankInfo, setBankInfo] = useState(null);
  const [bankTrancheId, setBankTrancheId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [q, inv] = await Promise.all([ax().get(`${API}/quotes`), ax().get(`${API}/invoices`)]);
      setQuotes(q.data); setInvoices(inv.data);
    } catch (err) {
      if (err?.response?.status === 401) {
        logout();
        navigate("/connexion");
      }
    } finally { setLoading(false); }
  }, [logout, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Handle payment return (Stripe)
  useEffect(() => {
    const payment = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");
    if (payment === "success" && sessionId) {
      setPaymentMsg(""); setTab("invoices");
      pollPaymentStatus(sessionId);
    } else if (payment === "cancelled") {
      setPaymentMsg("Paiement annulé.");
    }
  }, [searchParams]);

  // Handle payment return (PayPal) — PayPal appends its own "token" (= order id)
  // to the return_url alongside the query params we set.
  useEffect(() => {
    const paypalStatus = searchParams.get("paypal");
    const orderId = searchParams.get("token");
    if (paypalStatus === "success" && orderId) {
      setPaymentMsg(""); setTab("invoices");
      capturePayPalOrder(orderId);
    } else if (paypalStatus === "cancelled") {
      setPaymentMsg("Paiement PayPal annulé.");
    }
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    if (attempts >= 5) return;
    try {
      const res = await ax().get(`${API}/payments/status/${sessionId}`);
      if (res.data.payment_status === "paid") {
        setPaymentMsg("Paiement réussi ! Votre facture a été mise à jour.");
        fetchData();
      } else {
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000);
      }
    } catch { setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), 2000); }
  };

  const capturePayPalOrder = async (orderId) => {
    try {
      const res = await ax().post(`${API}/payments/paypal/capture/${orderId}`);
      if (res.data.payment_status === "paid") {
        setPaymentMsg("Paiement PayPal réussi ! Votre facture a été mise à jour.");
        fetchData();
      } else {
        setPaymentMsg("Paiement PayPal en attente de confirmation.");
      }
    } catch (err) {
      setPaymentMsg(err.response?.data?.detail || "Erreur lors de la validation du paiement PayPal");
    }
  };

  const handleLogout = async () => { await logout(); navigate("/"); };

  const acceptQuote = async (quoteId) => {
    setActionLoading(true);
    try {
      await ax().post(`${API}/quotes/${quoteId}/accept`);
      fetchData();
      setSelectedQuote(null);
    } finally { setActionLoading(false); }
  };

  const refuseQuote = async (quoteId) => {
    setActionLoading(true);
    try {
      await ax().post(`${API}/quotes/${quoteId}/refuse`, { reason: "" });
      fetchData();
      setSelectedQuote(null);
    } finally { setActionLoading(false); }
  };

  const payTranche = async (invoice, tranche) => {
    try {
      const res = await ax().post(`${API}/payments/checkout`, {
        invoice_id: invoice.id, tranche_id: tranche.id,
        origin_url: window.location.origin
      });
      if (res.data.checkout_url) window.location.href = res.data.checkout_url;
    } catch (err) {
      setPaymentMsg(err.response?.data?.detail || "Erreur lors du paiement");
    }
  };

  const payTranchePayPal = async (invoice, tranche) => {
    try {
      const res = await ax().post(`${API}/payments/paypal/create-order`, {
        invoice_id: invoice.id, tranche_id: tranche.id,
        origin_url: window.location.origin
      });
      if (res.data.approve_url) window.location.href = res.data.approve_url;
    } catch (err) {
      setPaymentMsg(err.response?.data?.detail || "Erreur lors du paiement PayPal");
    }
  };

  const toggleBankTransfer = async (tranche) => {
    if (bankTrancheId === tranche.id) { setBankTrancheId(null); return; }
    if (!bankInfo) {
      try {
        const res = await ax().get(`${API}/payments/bank-transfer-info`);
        setBankInfo(res.data);
      } catch {
        setPaymentMsg("Impossible de charger les coordonnées bancaires");
        return;
      }
    }
    setBankTrancheId(tranche.id);
  };

  const tabs = [
    { id: "quotes", label: "Mes Devis", icon: FileText, badge: quotes.filter(q => q.status === "sent").length },
    { id: "invoices", label: "Mes Factures", icon: Receipt, badge: invoices.filter(i => i.status !== "paid").length },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="bg-[#050505] border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#D4AF37] flex items-center justify-center">
              <span className="font-outfit font-black text-black text-sm">E3C</span>
            </div>
            <div>
              <p className="font-outfit font-bold text-white text-base">Espace Client</p>
              <p className="text-sm text-gray-500 hidden sm:block">{user?.name}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-red-400 text-base transition-colors">
            <LogOut size={15}/> <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="font-outfit font-bold text-2xl text-white">Bonjour, {user?.name} 👋</h1>
          <p className="text-gray-400 text-base mt-1">Gérez vos devis et factures E3C — Entreprise de constructions</p>
        </div>

        {/* Payment notification */}
        {paymentMsg && (
          <div className={`flex items-center gap-3 p-4 mb-5 rounded-sm border text-base ${paymentMsg.includes("réussi") ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"}`}>
            {paymentMsg.includes("réussi") ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
            {paymentMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/5 pb-0">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setSelectedQuote(null); setSelectedInvoice(null); }}
                className={`flex items-center gap-2 px-4 py-3 text-base font-medium border-b-2 transition-colors -mb-px ${tab === t.id ? "border-[#D4AF37] text-[#D4AF37]" : "border-transparent text-gray-400 hover:text-white"}`}>
                <Icon size={15}/> {t.label}
                {t.badge > 0 && <span className="bg-[#D4AF37] text-black text-sm font-bold w-5 h-5 flex items-center justify-center rounded-full">{t.badge}</span>}
              </button>
            );
          })}
        </div>

        {/* Quotes Tab */}
        {tab === "quotes" && (
          <div>
            {selectedQuote ? (
              <QuoteDetailView quote={selectedQuote} onBack={() => setSelectedQuote(null)}
                onAccept={acceptQuote} onRefuse={refuseQuote} loading={actionLoading} />
            ) : (
              <div className="space-y-3">
                {quotes.map(q => (
                  <div key={q.id} data-testid={`client-quote-${q.id}`}
                    className="bg-[#121212] border border-white/5 hover:border-white/10 p-5 rounded-sm transition-colors cursor-pointer"
                    onClick={() => setSelectedQuote(q)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[#D4AF37] font-outfit font-bold text-lg">{q.quote_number}</span>
                          <StatusBadge status={q.status}/>
                        </div>
                        <p className="text-white text-base">{q.project_description}</p>
                        <p className="text-gray-400 text-sm mt-1">Créé le {new Date(q.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-xl">{q.total_ttc?.toFixed(2)} €</p>
                        <p className="text-gray-400 text-sm">TTC</p>
                      </div>
                    </div>
                    {q.status === "sent" && (
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-blue-400 text-sm font-semibold">
                        <AlertCircle size={13}/> En attente de votre signature — Cliquez pour consulter
                      </div>
                    )}
                  </div>
                ))}
                {quotes.length === 0 && !loading && (
                  <div className="text-center py-16 text-gray-500">
                    <FileText size={40} className="mx-auto mb-3 opacity-30"/>
                    <p>Aucun devis disponible</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {tab === "invoices" && (
          <div className="space-y-4">
            {invoices.map(inv => (
              <div key={inv.id} data-testid={`client-invoice-${inv.id}`}
                className="bg-[#121212] border border-white/5 rounded-sm overflow-hidden">
                <div className="p-5 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[#D4AF37] font-outfit font-bold text-lg">{inv.invoice_number}</span>
                      <StatusBadge status={inv.status}/>
                    </div>
                    <p className="text-white text-base">{inv.project_description}</p>
                    <p className="text-gray-400 text-sm mt-1">Créé le {new Date(inv.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-white font-bold text-xl">{inv.total_ttc?.toFixed(2)} €</p>
                    <a href={`${API}/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-sm text-gray-400 hover:text-[#D4AF37] transition-colors border border-white/10 px-2 py-1 rounded-sm">
                      <Download size={11}/> PDF
                    </a>
                  </div>
                </div>
                {inv.payment_tranches?.length > 0 && (
                  <div className="border-t border-white/5 px-5 pb-5">
                    <p className="text-sm text-gray-500 uppercase tracking-wider mt-4 mb-3 font-semibold">Calendrier de règlement</p>
                    <div className="space-y-2">
                      {inv.payment_tranches.map(t => (
                        <div key={t.id} className="bg-white/3 border border-white/5 rounded-sm overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3">
                            <div>
                              <p className="text-white text-base font-medium">{t.label}</p>
                              <p className="text-gray-400 text-sm">Échéance : {t.due_date ? new Date(t.due_date).toLocaleDateString("fr-FR") : "—"}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-white font-bold">{t.amount?.toFixed(2)} €</span>
                              {t.status === "paid" ? (
                                <span className="flex items-center gap-1 text-green-400 text-sm font-semibold">
                                  <CheckCircle size={13}/> Payé
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                  <button onClick={() => toggleBankTransfer(t)}
                                    data-testid={`bank-transfer-tranche-${t.id}`}
                                    className="flex items-center gap-1 border border-white/15 text-gray-300 font-semibold text-sm px-3 py-1.5 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-colors rounded-sm">
                                    <Landmark size={12}/> Virement
                                  </button>
                                  <button onClick={() => payTranchePayPal(inv, t)}
                                    data-testid={`paypal-tranche-${t.id}`}
                                    className="flex items-center gap-1 bg-[#0070BA] text-white font-bold text-sm px-3 py-1.5 hover:bg-[#005ea6] transition-colors rounded-sm">
                                    <Wallet size={12}/> PayPal
                                  </button>
                                  <button onClick={() => payTranche(inv, t)}
                                    data-testid={`pay-tranche-${t.id}`}
                                    className="flex items-center gap-1 bg-[#D4AF37] text-black font-bold text-sm px-3 py-1.5 hover:bg-[#E6C65A] transition-colors rounded-sm">
                                    <CreditCard size={12}/> Payer par carte
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {bankTrancheId === t.id && (
                            <BankTransferPanel bankInfo={bankInfo} reference={`${inv.invoice_number} — ${t.label}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {inv.payment_tranches?.length === 0 && (
                  <div className="border-t border-white/5 px-5 py-3">
                    <p className="text-gray-500 text-sm">Le calendrier de règlement sera défini prochainement par E3C.</p>
                  </div>
                )}
              </div>
            ))}
            {invoices.length === 0 && !loading && (
              <div className="text-center py-16 text-gray-500">
                <Receipt size={40} className="mx-auto mb-3 opacity-30"/>
                <p>Aucune facture disponible</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuoteDetailView({ quote, onBack, onAccept, onRefuse, loading }) {
  const [refuseMode, setRefuseMode] = useState(false);

  return (
    <div data-testid="quote-detail-view">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white text-base mb-5 transition-colors">
        ← Retour à mes devis
      </button>
      <div className="bg-[#121212] border border-white/5 rounded-sm p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-outfit font-bold text-white text-2xl">{quote.quote_number}</h2>
            <p className="text-gray-400 text-base mt-1">{quote.project_description}</p>
          </div>
          <StatusBadge status={quote.status}/>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-5 text-base">
          <div><p className="text-gray-500 text-sm uppercase tracking-wider mb-1">Valable jusqu'au</p>
            <p className="text-white">{quote.valid_until ? new Date(quote.valid_until).toLocaleDateString("fr-FR") : "—"}</p></div>
          <div><p className="text-gray-500 text-sm uppercase tracking-wider mb-1">Adresse chantier</p>
            <p className="text-white">{quote.client_address || "—"}</p></div>
        </div>

        {/* Line items */}
        <div className="mb-5">
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-3 font-semibold">Détail des prestations</p>
          <div className="border border-white/5 rounded-sm overflow-hidden">
            <table className="w-full text-base">
              <thead className="bg-white/3">
                <tr className="text-left">
                  {["Description", "Qté", "Prix HT", "TVA", "Total TTC"].map(h => (
                    <th key={h} className="px-4 py-2 text-sm text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quote.line_items?.map((item, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-4 py-3 text-white">{item.description}</td>
                    <td className="px-4 py-3 text-gray-300">{item.quantity}</td>
                    <td className="px-4 py-3 text-gray-300">{item.unit_price?.toFixed(2)} €</td>
                    <td className="px-4 py-3 text-gray-300">{item.tva_rate}%</td>
                    <td className="px-4 py-3 text-white font-medium">{item.total_ttc?.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-right space-y-1 mb-4">
          <p className="text-gray-400 text-base">Total HT : <span className="text-white">{quote.total_ht?.toFixed(2)} €</span></p>
          <p className="text-gray-400 text-base">TVA : <span className="text-white">{quote.total_tva?.toFixed(2)} €</span></p>
          <p className="text-[#D4AF37] font-bold text-2xl">TOTAL TTC : {quote.total_ttc?.toFixed(2)} €</p>
        </div>

        {/* Disclaimer estimatif */}
        <div className="flex items-start gap-2.5 bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-sm p-3.5 mb-5">
          <AlertCircle size={13} className="text-[#D4AF37]/70 mt-0.5 flex-shrink-0"/>
          <p className="text-[#D4AF37]/65 text-sm leading-relaxed" data-testid="quote-disclaimer">
            <span className="font-semibold text-[#D4AF37]/80">Estimation prévisionnelle.</span> Ce chiffrage est établi sur la base des informations communiquées et reste indicatif. Une visite technique gratuite de l'un de nos experts permettra de confirmer et finaliser ce devis. Tout ajustement éventuel sera soumis à votre accord avant tout engagement.
          </p>
        </div>

        {quote.notes && (
          <div className="bg-white/3 border border-white/5 p-4 mb-5 rounded-sm">
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-gray-300 text-base">{quote.notes}</p>
          </div>
        )}

        {quote.status === "sent" && (
          <div className="border-t border-white/5 pt-5">
            <p className="text-white font-semibold mb-4">Votre réponse :</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => onAccept(quote.id)} disabled={loading}
                data-testid="accept-quote-btn"
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 hover:bg-green-500 transition-colors disabled:opacity-60 text-base rounded-sm">
                <CheckCircle size={16}/> {loading ? "..." : "Bon pour accord — Accepter"}
              </button>
              <button onClick={() => setRefuseMode(true)} disabled={loading}
                data-testid="refuse-quote-btn"
                className="flex-1 flex items-center justify-center gap-2 border border-red-500/30 text-red-400 font-bold py-3 hover:bg-red-500/10 transition-colors disabled:opacity-60 text-base rounded-sm">
                <XCircle size={16}/> Refuser
              </button>
            </div>
            {refuseMode && (
              <div className="mt-3">
                <button onClick={() => onRefuse(quote.id)} disabled={loading}
                  className="w-full bg-red-600 text-white font-bold py-2.5 text-base hover:bg-red-500 transition-colors rounded-sm disabled:opacity-60">
                  Confirmer le refus
                </button>
              </div>
            )}
          </div>
        )}
        {quote.status === "accepted" && (
          <div className="border-t border-white/5 pt-4 flex items-center gap-2 text-green-400 text-base font-semibold">
            <CheckCircle size={16}/> Vous avez accepté ce devis — Une facture a été générée.
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/5">
          <a href={`${API}/quotes/${quote.id}/pdf`} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] text-sm transition-colors">
            <Download size={13}/> Télécharger le devis PDF
          </a>
        </div>
      </div>
    </div>
  );
}

function BankTransferPanel({ bankInfo, reference }) {
  const [copied, setCopied] = useState("");

  const copy = (field, value) => {
    navigator.clipboard?.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(""), 1500);
  };

  if (!bankInfo) return null;

  if (!bankInfo.configured) {
    return (
      <div className="border-t border-white/5 px-4 py-3 bg-black/20">
        <p className="text-gray-500 text-sm">Le paiement par virement n'est pas encore disponible pour cette facture.</p>
      </div>
    );
  }

  const rows = [
    ["Titulaire", bankInfo.account_holder],
    ["IBAN", bankInfo.iban],
    ["BIC", bankInfo.bic],
    ["Banque", bankInfo.bank_name],
  ].filter(([, v]) => v);

  return (
    <div className="border-t border-white/5 px-4 py-4 bg-black/20 space-y-2" data-testid="bank-transfer-panel">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3">
          <div>
            <p className="text-gray-500 text-sm uppercase tracking-wider">{label}</p>
            <p className="text-white text-base font-mono">{value}</p>
          </div>
          <button onClick={() => copy(label, value)}
            className="flex items-center gap-1 text-gray-400 hover:text-[#D4AF37] text-sm transition-colors flex-shrink-0">
            <Copy size={12}/> {copied === label ? "Copié" : "Copier"}
          </button>
        </div>
      ))}
      <p className="text-gray-500 text-sm pt-2 border-t border-white/5">
        Merci d'indiquer la référence <span className="text-gray-300 font-medium">« {reference} »</span> lors
        de votre virement. Le paiement sera confirmé par notre équipe après réception, sous quelques jours ouvrés.
      </p>
    </div>
  );
}
