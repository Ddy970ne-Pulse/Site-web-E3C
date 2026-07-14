import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Clock, MessageSquare, Send, CheckCircle, AlertCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { SEO } from "@/components/SEO";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WHATSAPP = "590690449714";

const WHATSAPP_SVG = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const SERVICES = [
  "Maçonnerie & Gros Oeuvre", "Charpente & Ossature", "Toiture & Couverture",
  "Carrelage & Revêtements", "Rénovation Intérieure", "Peinture & Enduits",
  "Terrassement & VRD", "Plomberie & Sanitaire", "Électricité Générale", "Autre",
];

const SUBJECTS = [
  "Demande de devis", "Renseignement sur une prestation", "Suivi de chantier",
  "Urgence travaux", "Partenariat / Sous-traitance", "Autre",
];

const contactChannels = [
  {
    icon: WHATSAPP_SVG,
    title: "WhatsApp",
    subtitle: "Message instantané",
    value: "Réponse rapide garantie",
    href: `https://wa.me/${WHATSAPP}?text=Bonjour%20E3C%2C%20je%20souhaite%20un%20renseignement.`,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    external: true,
  },
  {
    icon: MapPin,
    title: "Zone d'intervention",
    subtitle: "Toute la Guadeloupe",
    value: "Guadeloupe (971)",
    href: null,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: Clock,
    title: "Disponibilité",
    subtitle: "Jours ouvrables",
    value: "Lun–Ven : 7h30–17h30",
    href: null,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
];

export default function ContactPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", commune: "", subject: "", service: "", message: "",
  });
  const [status, setStatus] = useState(null); // null | "success" | "error"
  const [loading, setLoading] = useState(false);
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const buildWhatsAppText = () =>
    `Bonjour E3C !%0A%0ANom : ${encodeURIComponent(form.name)}%0ATél : ${encodeURIComponent(form.phone)}%0AEmail : ${encodeURIComponent(form.email)}%0ACommune : ${encodeURIComponent(form.commune)}%0ASujet : ${encodeURIComponent(form.subject)}%0APrestation : ${encodeURIComponent(form.service)}%0AMessage : ${encodeURIComponent(form.message)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await axios.post(`${API}/contact`, {
        name: form.name,
        phone: form.phone || "—",
        commune: form.commune || "—",
        service: form.service || form.subject,
        message: `[${form.subject}] Email: ${form.email} | ${form.message}`,
      });
      setStatus("success");
      if (sendViaWhatsApp) {
        window.open(`https://wa.me/${WHATSAPP}?text=${buildWhatsAppText()}`, "_blank");
      }
      setForm({ name: "", email: "", phone: "", commune: "", subject: "", service: "", message: "" });
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FAFAF8] dark:bg-[#0A0A0A] min-h-screen">
      <SEO title="Contactez-nous" description="Contactez E3C en Guadeloupe. WhatsApp, formulaire de contact. Réponse rapide garantie." url="/contact" />
      <Navbar whatsapp={WHATSAPP} />

      {/* Hero */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-[#D4AF37]/50 to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#D4AF37] text-sm font-bold uppercase tracking-widest mb-3">
            Contactez-nous
          </p>
          <h1 className="font-outfit font-bold text-5xl sm:text-6xl text-[#1A1A1A] dark:text-white mb-4 leading-tight">
            Parlons de votre projet
          </h1>
          <p className="text-[#737373] dark:text-gray-400 text-lg md:text-xl leading-relaxed max-w-xl mx-auto">
            Devis gratuit, réponse rapide. Plusieurs moyens de nous joindre —
            choisissez celui qui vous convient le mieux.
          </p>
        </div>
      </section>

      {/* Contact Channels */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 pb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {contactChannels.map((ch) => {
            const Icon = ch.icon;
            const CardContent = (
              <div
                key={ch.title}
                data-testid={`contact-channel-${ch.title.toLowerCase().replace(/\s+/g, "-")}`}
                className={`p-5 border rounded-sm ${ch.bg} ${ch.href ? "hover:-translate-y-1 cursor-pointer" : ""} transition-all duration-200`}
              >
                <div className={`w-9 h-9 flex items-center justify-center mb-3 ${ch.color}`}>
                  <Icon />
                </div>
                <p className={`font-outfit font-semibold text-[#1A1A1A] dark:text-white text-base mb-0.5`}>{ch.title}</p>
                <p className="text-[#9E9E9E] dark:text-gray-500 text-sm mb-1">{ch.subtitle}</p>
                <p className={`font-medium text-base ${ch.color}`}>{ch.value}</p>
              </div>
            );
            if (ch.href && ch.external)
              return <a key={ch.title} href={ch.href} target="_blank" rel="noopener noreferrer">{CardContent}</a>;
            if (ch.href)
              return <a key={ch.title} href={ch.href}>{CardContent}</a>;
            return <div key={ch.title}>{CardContent}</div>;
          })}
        </div>

        {/* Main content: Form + Info */}
        <div className="grid lg:grid-cols-5 gap-10 md:gap-16">
          {/* Left — Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="font-outfit font-bold text-3xl text-[#1A1A1A] dark:text-white mb-2">
                E3C — Entreprise de constructions
              </h2>
              <div className="section-divider mb-4" />
              <p className="text-[#737373] dark:text-gray-400 text-base leading-relaxed">
                Entreprise de construction et rénovation tous corps d'état,
                implantée en Guadeloupe. Notre équipe intervient rapidement sur
                l'ensemble du territoire pour tous vos projets BTP.
              </p>
            </div>

            {/* Quick contact buttons */}
            <div className="space-y-3">
              <p className="text-sm text-[#9E9E9E] dark:text-gray-500 uppercase tracking-widest font-semibold">
                Contact rapide
              </p>
              <a
                href={`https://wa.me/${WHATSAPP}?text=Bonjour%20E3C%2C%20je%20souhaite%20un%20renseignement.`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="contact-page-whatsapp"
                className="flex items-center gap-3 w-full p-4 bg-white dark:bg-[#121212] border border-black/7 dark:border-white/5 hover:border-green-500/30 transition-all rounded-sm group"
              >
                <div className="w-9 h-9 bg-green-500/10 flex items-center justify-center rounded-sm group-hover:bg-green-500/20 transition-colors flex-shrink-0">
                  <span className="text-green-400"><WHATSAPP_SVG /></span>
                </div>
                <div>
                  <p className="text-[#1A1A1A] dark:text-white text-base font-medium">WhatsApp</p>
                  <p className="text-[#9E9E9E] dark:text-gray-500 text-sm">Devis gratuit · Réponse rapide</p>
                </div>
              </a>
            </div>

            {/* Espace client promo */}
            <div className="p-5 bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-sm">
              <p className="font-outfit font-semibold text-[#1A1A1A] dark:text-white text-base mb-1">
                Vous êtes déjà client ?
              </p>
              <p className="text-[#737373] dark:text-gray-400 text-sm leading-relaxed mb-3">
                Accédez à votre espace personnel pour consulter vos devis,
                factures et effectuer vos paiements.
              </p>
              <button
                onClick={() => navigate("/connexion")}
                className="text-[#D4AF37] text-sm font-bold hover:underline"
              >
                Accéder à mon espace →
              </button>
            </div>
          </div>

          {/* Right — Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-[#121212] border border-black/7 dark:border-white/5 p-7 md:p-10 rounded-sm shadow-sm dark:shadow-none">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-[#D4AF37]/10 flex items-center justify-center rounded-sm">
                  <MessageSquare size={16} className="text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-[#1A1A1A] dark:text-white text-xl leading-tight">
                    Formulaire de contact
                  </h3>
                  <p className="text-[#9E9E9E] dark:text-gray-500 text-sm">Réponse sous 24h — Devis gratuit</p>
                </div>
              </div>

              {status === "success" && (
                <div
                  data-testid="contact-page-success"
                  className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 text-green-400 p-4 mb-5 rounded-sm"
                >
                  <CheckCircle size={16} />
                  <div>
                    <p className="text-base font-medium">Message envoyé avec succès !</p>
                    <p className="text-sm opacity-80">Nous vous répondrons dans les plus brefs délais.</p>
                  </div>
                </div>
              )}
              {status === "error" && (
                <div
                  data-testid="contact-page-error"
                  className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 p-4 mb-5 rounded-sm"
                >
                  <AlertCircle size={16} />
                  <p className="text-base">Une erreur est survenue. Appelez-nous directement.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} data-testid="contact-page-form" className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#737373] dark:text-gray-400 uppercase tracking-wider mb-1.5">Nom complet *</label>
                    <input
                      type="text" name="name" value={form.name} onChange={handleChange} required
                      placeholder="Votre nom" data-testid="contact-page-name"
                      className="w-full bg-[#F5F4F0] dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1A1A1A] dark:text-white placeholder-[#ADADAD] dark:placeholder-gray-600 px-4 py-2.5 text-base rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#737373] dark:text-gray-400 uppercase tracking-wider mb-1.5">Email *</label>
                    <input
                      type="email" name="email" value={form.email} onChange={handleChange} required
                      placeholder="votre@email.com" data-testid="contact-page-email"
                      className="w-full bg-[#F5F4F0] dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1A1A1A] dark:text-white placeholder-[#ADADAD] dark:placeholder-gray-600 px-4 py-2.5 text-base rounded-sm"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#737373] dark:text-gray-400 uppercase tracking-wider mb-1.5">Téléphone</label>
                    <input
                      type="tel" name="phone" value={form.phone} onChange={handleChange}
                      placeholder="0690 XX XX XX" data-testid="contact-page-phone-input"
                      className="w-full bg-[#F5F4F0] dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1A1A1A] dark:text-white placeholder-[#ADADAD] dark:placeholder-gray-600 px-4 py-2.5 text-base rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#737373] dark:text-gray-400 uppercase tracking-wider mb-1.5">Commune</label>
                    <input
                      type="text" name="commune" value={form.commune} onChange={handleChange}
                      placeholder="Votre commune" data-testid="contact-page-commune"
                      className="w-full bg-[#F5F4F0] dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1A1A1A] dark:text-white placeholder-[#ADADAD] dark:placeholder-gray-600 px-4 py-2.5 text-base rounded-sm"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#737373] dark:text-gray-400 uppercase tracking-wider mb-1.5">Sujet *</label>
                    <select
                      name="subject" value={form.subject} onChange={handleChange} required
                      data-testid="contact-page-subject"
                      className="w-full bg-[#F5F4F0] dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 text-[#1A1A1A] dark:text-white px-4 py-2.5 text-base rounded-sm"
                    >
                      <option value="">Choisir un sujet</option>
                      {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#737373] dark:text-gray-400 uppercase tracking-wider mb-1.5">Prestation</label>
                    <select
                      name="service" value={form.service} onChange={handleChange}
                      data-testid="contact-page-service"
                      className="w-full bg-[#F5F4F0] dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 text-[#1A1A1A] dark:text-white px-4 py-2.5 text-base rounded-sm"
                    >
                      <option value="">Sélectionner (optionnel)</option>
                      {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#737373] dark:text-gray-400 uppercase tracking-wider mb-1.5">Message *</label>
                  <textarea
                    name="message" value={form.message} onChange={handleChange} required rows={5}
                    placeholder="Décrivez votre projet, vos besoins, délais souhaités..."
                    data-testid="contact-page-message"
                    className="w-full bg-[#F5F4F0] dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#1A1A1A] dark:text-white placeholder-[#ADADAD] dark:placeholder-gray-600 px-4 py-2.5 text-base rounded-sm resize-none"
                  />
                </div>

                {/* WhatsApp option toggle */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setSendViaWhatsApp(!sendViaWhatsApp)}
                    className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 flex items-center px-0.5 ${sendViaWhatsApp ? "bg-green-500" : "bg-black/10 dark:bg-white/10"}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${sendViaWhatsApp ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                  <span className="text-[#737373] dark:text-gray-400 text-base group-hover:text-[#1A1A1A] dark:group-hover:text-gray-200 transition-colors">
                    Envoyer aussi via WhatsApp
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  data-testid="contact-page-submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] text-black font-bold py-4 hover:bg-[#E6C65A] transition-colors disabled:opacity-60 text-base tracking-wide rounded-sm"
                >
                  <Send size={15} />
                  {loading ? "Envoi en cours..." : "Envoyer mon message"}
                </button>

                <p className="text-center text-sm text-[#ADADAD] dark:text-gray-600">
                  Vos données sont traitées conformément au RGPD · Réponse garantie sous 24h
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer whatsapp={WHATSAPP} />
      <FloatingWhatsApp whatsapp={WHATSAPP} />
    </div>
  );
}
