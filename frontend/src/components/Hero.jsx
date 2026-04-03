import { Phone, ChevronDown, Shield, Star, Clock } from "lucide-react";

const HERO_BG = "https://static.prod-images.emergentagent.com/jobs/bed7ba01-3d73-4dbb-bf1f-2181e68e96b9/images/8ecb7ed7162572a62486742411ec38a5f21fe215e7d0a88b0123c3723ce818d3.png";

export default function Hero({ whatsapp }) {
  const scrollToContact = () => {
    document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      data-testid="hero-section"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HERO_BG})` }}
      />
      {/* Dark Overlay */}
      <div className="absolute inset-0 hero-overlay" />
      {/* Gold accent line bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full pt-24 pb-16">
        <div className="max-w-3xl">
          {/* Badge */}
          <div
            data-testid="hero-badge"
            className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold uppercase tracking-widest px-4 py-2 mb-6 animate-fade-in"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            Guadeloupe — Tous Travaux BTP
          </div>

          {/* Main Heading */}
          <h1
            data-testid="hero-title"
            className="font-outfit font-bold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight tracking-tight mb-6 animate-fade-in-up"
            style={{ animationDelay: "0.1s", opacity: 0 }}
          >
            Construisons
            <br />
            <span className="gold-gradient-text">votre projet</span>
            <br />
            ensemble.
          </h1>

          {/* Subtitle */}
          <p
            data-testid="hero-subtitle"
            className="text-gray-300 text-base md:text-lg leading-relaxed mb-8 max-w-xl animate-fade-in-up"
            style={{ animationDelay: "0.2s", opacity: 0 }}
          >
            E3C, votre partenaire de confiance pour tous vos travaux de
            construction, rénovation et aménagement en Guadeloupe. Devis
            gratuit, intervention rapide.
          </p>

          {/* Trust badges */}
          <div
            className="flex flex-wrap gap-4 mb-10 animate-fade-in-up"
            style={{ animationDelay: "0.3s", opacity: 0 }}
          >
            {[
              { icon: Shield, label: "Travail aux normes" },
              { icon: Star, label: "Qualité garantie" },
              { icon: Clock, label: "Devis gratuit" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-gray-300 text-sm"
              >
                <Icon size={14} className="text-[#D4AF37]" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row gap-4 animate-fade-in-up"
            style={{ animationDelay: "0.4s", opacity: 0 }}
          >
            <a
              href={`https://wa.me/${whatsapp}?text=Bonjour%20E3C%2C%20je%20souhaite%20obtenir%20un%20devis%20gratuit%20pour%20mes%20travaux.`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="hero-whatsapp-btn"
              className="inline-flex items-center justify-center gap-3 bg-[#D4AF37] text-black font-bold text-base px-8 py-4 hover:bg-[#E6C65A] transition-all duration-200 hover:scale-105 active:scale-95 tracking-wide"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Devis Gratuit WhatsApp
            </a>
            <button
              onClick={scrollToContact}
              data-testid="hero-contact-btn"
              className="inline-flex items-center justify-center gap-2 border border-white/20 text-white font-semibold text-base px-8 py-4 hover:border-[#D4AF37]/60 hover:text-[#D4AF37] transition-all duration-200 hover:scale-105 active:scale-95 tracking-wide backdrop-blur-sm"
            >
              <Phone size={16} />
              Nous contacter
            </button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-xs text-gray-400 uppercase tracking-widest">
          Découvrir
        </span>
        <ChevronDown size={16} className="text-[#D4AF37]" />
      </div>
    </section>
  );
}
