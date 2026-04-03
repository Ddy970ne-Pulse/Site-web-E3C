import { useState } from "react";
import axios from "axios";
import { Send, Phone, CheckCircle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const services = [
  "Maçonnerie & Gros Oeuvre",
  "Charpente & Ossature",
  "Toiture & Couverture",
  "Carrelage & Revêtements",
  "Rénovation Intérieure",
  "Peinture & Enduits",
  "Terrassement & VRD",
  "Plomberie & Sanitaire",
  "Électricité Générale",
  "Autre",
];

export default function Contact({ whatsapp }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    commune: "",
    service: "",
    message: "",
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/contact`, form);

      const text = `Bonjour E3C !%0A%0ANom : ${encodeURIComponent(form.name)}%0ATéléphone : ${encodeURIComponent(form.phone)}%0ACommune : ${encodeURIComponent(form.commune)}%0APrestation : ${encodeURIComponent(form.service)}%0AMessage : ${encodeURIComponent(form.message || "Pas de message")}`;
      window.open(`https://wa.me/${whatsapp}?text=${text}`, "_blank");

      setStatus("success");
      setForm({ name: "", phone: "", commune: "", service: "", message: "" });
    } catch (err) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    const text = `Bonjour E3C !%0A%0ANom : ${encodeURIComponent(form.name || "Non renseigné")}%0ATéléphone : ${encodeURIComponent(form.phone || "Non renseigné")}%0ACommune : ${encodeURIComponent(form.commune || "Non renseignée")}%0APrestation : ${encodeURIComponent(form.service || "Non sélectionnée")}%0AMessage : ${encodeURIComponent(form.message || "Pas de message")}`;
    window.open(`https://wa.me/${whatsapp}?text=${text}`, "_blank");
  };

  return (
    <section
      id="contact"
      data-testid="contact-section"
      className="py-20 md:py-32 bg-[#0A0A0A] relative overflow-hidden"
    >
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "url(https://static.prod-images.emergentagent.com/jobs/bed7ba01-3d73-4dbb-bf1f-2181e68e96b9/images/017d698e7e8c677b68fdcb7ae0b29fa1a9f8cd2da340b7be420f29ea090488ce.png)",
          backgroundSize: "cover",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20">
          {/* Left Info */}
          <div>
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-3">
              Contact
            </p>
            <h2 className="font-outfit font-bold text-3xl md:text-4xl text-white mb-4">
              Parlons de votre projet
            </h2>
            <div className="section-divider mb-6" />
            <p className="text-gray-400 text-base leading-relaxed mb-8">
              Devis gratuit, réponse rapide. Remplissez le formulaire et votre
              demande sera envoyée directement via WhatsApp. Nous vous répondons
              dans les plus brefs délais.
            </p>

            <div className="space-y-5 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 flex items-center justify-center rounded-sm">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-400">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">WhatsApp</p>
                  <a
                    href={`https://wa.me/${whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-medium text-sm hover:text-[#D4AF37] transition-colors"
                  >
                    0690 44 97 14
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center rounded-sm">
                  <Phone size={16} strokeWidth={1.5} className="text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Téléphone</p>
                  <a
                    href="tel:0690449714"
                    className="text-white font-medium text-sm hover:text-[#D4AF37] transition-colors"
                  >
                    0690 44 97 14
                  </a>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp */}
            <a
              href={`https://wa.me/${whatsapp}?text=Bonjour%20E3C%2C%20je%20souhaite%20un%20devis%20gratuit.`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="contact-whatsapp-direct"
              className="inline-flex items-center gap-3 bg-green-600 text-white font-bold px-6 py-3.5 hover:bg-green-500 transition-colors text-sm rounded-sm animate-pulse-glow"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Contacter directement via WhatsApp
            </a>
          </div>

          {/* Right — Form */}
          <div>
            <div className="glass-card p-8 md:p-10">
              <h3 className="font-outfit font-bold text-xl text-white mb-2">
                Demande de devis gratuit
              </h3>
              <p className="text-gray-400 text-sm mb-8">
                Votre message sera envoyé via WhatsApp. Devis gratuit · Sans
                engagement
              </p>

              {status === "success" && (
                <div
                  data-testid="contact-success"
                  className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 text-green-400 p-4 mb-6 rounded-sm"
                >
                  <CheckCircle size={18} />
                  <span className="text-sm font-medium">
                    Message envoyé ! WhatsApp s'est ouvert.
                  </span>
                </div>
              )}

              {status === "error" && (
                <div
                  data-testid="contact-error"
                  className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 mb-6 rounded-sm text-sm"
                >
                  Une erreur est survenue. Veuillez contacter directement via WhatsApp.
                </div>
              )}

              <form onSubmit={handleSubmit} data-testid="contact-form" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Votre nom"
                      data-testid="contact-name"
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 px-4 py-3 text-sm rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="0690 XX XX XX"
                      data-testid="contact-phone"
                      className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 px-4 py-3 text-sm rounded-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                    Commune *
                  </label>
                  <input
                    type="text"
                    name="commune"
                    value={form.commune}
                    onChange={handleChange}
                    required
                    placeholder="Votre commune"
                    data-testid="contact-commune"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 px-4 py-3 text-sm rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                    Type de prestation *
                  </label>
                  <select
                    name="service"
                    value={form.service}
                    onChange={handleChange}
                    required
                    data-testid="contact-service"
                    className="w-full bg-[#1A1A1A] border border-white/10 text-white px-4 py-3 text-sm rounded-sm appearance-none"
                  >
                    <option value="">Sélectionnez une prestation</option>
                    {services.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                    Message (optionnel)
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Décrivez votre projet..."
                    data-testid="contact-message"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-500 px-4 py-3 text-sm rounded-sm resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    data-testid="contact-submit"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#D4AF37] text-black font-bold py-3.5 hover:bg-[#E6C65A] transition-colors disabled:opacity-60 text-sm tracking-wide rounded-sm"
                  >
                    <Send size={15} />
                    {loading ? "Envoi..." : "Envoyer via WhatsApp"}
                  </button>
                  <button
                    type="button"
                    onClick={openWhatsApp}
                    data-testid="contact-whatsapp-btn"
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3.5 hover:bg-green-500 transition-colors text-sm rounded-sm"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp direct
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center pt-1">
                  Devis 100% gratuit · Sans engagement · Réponse rapide garantie
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
