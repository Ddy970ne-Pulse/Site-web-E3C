import { useNavigate } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";

const WHATSAPP_SVG = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function Contact({ whatsapp }) {
  const navigate = useNavigate();

  const channels = [
    {
      icon: WHATSAPP_SVG,
      label: "WhatsApp",
      value: "Réponse instantanée",
      cta: "Écrire sur WhatsApp",
      href: `https://wa.me/${whatsapp}?text=Bonjour%20E3C%2C%20je%20souhaite%20un%20devis%20gratuit.`,
      external: true,
      style: "border-green-500/20 hover:border-green-500/40",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-600 dark:text-green-400",
      btnStyle: "bg-green-600 text-white hover:bg-green-500",
    },
    {
      icon: Mail,
      label: "Formulaire de contact",
      value: "Réponse sous 24h",
      cta: "Accéder au formulaire",
      href: null,
      onClick: true,
      style: "border-blue-500/20 hover:border-blue-500/40",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
      btnStyle: "bg-blue-600 text-white hover:bg-blue-500",
    },
  ];

  return (
    <section
      id="contact"
      data-testid="contact-section"
      className="py-20 md:py-32 bg-[#F5F4F0] dark:bg-[#0D0D0D] relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D4AF37]/2 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-12">
          <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-3">Contact</p>
          <h2 className="font-outfit font-bold text-3xl md:text-4xl text-[#1A1A1A] dark:text-white mb-4">
            Contactez-nous
          </h2>
          <div className="section-divider mx-auto mb-4" />
          <p className="text-[#737373] dark:text-gray-400 text-base max-w-lg mx-auto">
            Plusieurs moyens de nous joindre. Choisissez celui qui vous convient,
            devis gratuit et sans engagement.
          </p>
        </div>

        {/* 2 contact channels */}
        <div className="grid md:grid-cols-2 gap-5 mb-10 max-w-2xl mx-auto">
          {channels.map((ch) => {
            const Icon = ch.icon;
            return (
              <div
                key={ch.label}
                data-testid={`contact-channel-${ch.label}`}
                className={`bg-white dark:bg-[#121212] border rounded-sm p-7 flex flex-col items-center text-center transition-all duration-200 shadow-sm dark:shadow-none ${ch.style}`}
              >
                <div className={`w-14 h-14 ${ch.iconBg} flex items-center justify-center rounded-full mb-4 ${ch.iconColor}`}>
                  <Icon />
                </div>
                <p className="font-outfit font-semibold text-[#1A1A1A] dark:text-white text-lg mb-1">{ch.label}</p>
                <p className="text-[#737373] dark:text-gray-400 text-sm mb-5">{ch.value}</p>
                {ch.onClick ? (
                  <button
                    onClick={() => navigate("/contact")}
                    data-testid="contact-form-link"
                    className={`inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-sm transition-colors ${ch.btnStyle}`}
                  >
                    {ch.cta} <ArrowRight size={14} />
                  </button>
                ) : (
                  <a
                    href={ch.href}
                    target={ch.external ? "_blank" : undefined}
                    rel={ch.external ? "noopener noreferrer" : undefined}
                    className={`inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-sm transition-colors ${ch.btnStyle}`}
                  >
                    {ch.cta} <ArrowRight size={14} />
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA full contact page */}
        <div className="text-center">
          <button
            onClick={() => navigate("/contact")}
            data-testid="contact-page-cta"
            className="inline-flex items-center gap-2 border border-[#D4AF37]/40 text-[#D4AF37] font-semibold px-8 py-3 hover:bg-[#D4AF37] hover:text-black transition-all duration-200 text-sm tracking-wide rounded-sm"
          >
            Voir la page contact complète <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
