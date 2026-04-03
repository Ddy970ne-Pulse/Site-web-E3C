import {
  Building2,
  Home,
  Layers,
  PaintBucket,
  Wrench,
  Hammer,
  Droplets,
  Zap,
  Trees,
  ArrowRight,
} from "lucide-react";

const services = [
  {
    icon: Building2,
    title: "Maçonnerie & Gros Oeuvre",
    desc: "Fondations, murs porteurs, dalles béton, agglos. Construction de A à Z.",
    size: "tall",
  },
  {
    icon: Home,
    title: "Charpente & Ossature",
    desc: "Charpente bois, ossature métallique, structure bâtiment.",
    size: "normal",
  },
  {
    icon: Layers,
    title: "Toiture & Couverture",
    desc: "Pose, réparation et entretien de toitures tous types.",
    size: "normal",
  },
  {
    icon: PaintBucket,
    title: "Carrelage & Revêtements",
    desc: "Pose carrelage intérieur/extérieur, faïence, parquet.",
    size: "wide",
  },
  {
    icon: Wrench,
    title: "Rénovation Intérieure",
    desc: "Rénovation complète, aménagement, cloisons, faux plafond.",
    size: "normal",
  },
  {
    icon: Hammer,
    title: "Peinture & Enduits",
    desc: "Enduit, peinture intérieure et extérieure, finitions soignées.",
    size: "normal",
  },
  {
    icon: Trees,
    title: "Terrassement & VRD",
    desc: "Terrassement, nivellement, voiries et réseaux divers.",
    size: "wide",
  },
  {
    icon: Droplets,
    title: "Plomberie & Sanitaire",
    desc: "Installation et réparation de réseaux d'eau, sanitaires.",
    size: "normal",
  },
  {
    icon: Zap,
    title: "Électricité Générale",
    desc: "Installations électriques, tableaux, prises, éclairage.",
    size: "normal",
  },
];

export default function Services({ whatsapp }) {
  return (
    <section id="services" data-testid="services-section" className="py-20 md:py-32 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-3">
            Nos Prestations
          </p>
          <h2 className="font-outfit font-bold text-3xl md:text-4xl text-white mb-4">
            Tous travaux BTP
          </h2>
          <div className="section-divider mb-4" />
          <p className="text-gray-400 text-base max-w-xl">
            De la construction neuve à la rénovation complète, E3C intervient
            sur tous types de travaux en Guadeloupe pour particuliers et
            professionnels.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {services.map((service, i) => {
            const Icon = service.icon;
            const isWide = service.size === "wide";
            const isTall = service.size === "tall";

            return (
              <div
                key={service.title}
                data-testid={`service-card-${i}`}
                className={`service-card bg-[#121212] border border-white/5 p-6 md:p-8 rounded-sm ${
                  isWide ? "sm:col-span-2" : ""
                } ${isTall ? "lg:row-span-2" : ""}`}
              >
                <div className="flex flex-col h-full gap-4">
                  <div className="w-12 h-12 bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center rounded-sm">
                    <Icon size={22} strokeWidth={1.5} className="text-[#D4AF37]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-outfit font-semibold text-white text-lg mb-2">
                      {service.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {service.desc}
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/${whatsapp}?text=Bonjour%20E3C%2C%20je%20souhaite%20un%20devis%20pour%20${encodeURIComponent(service.title)}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#D4AF37] text-sm font-semibold hover:gap-3 transition-all duration-200 group"
                  >
                    Demander un devis
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4 text-sm">
            Vous ne trouvez pas votre prestation ? Contactez-nous directement.
          </p>
          <a
            href={`https://wa.me/${whatsapp}?text=Bonjour%20E3C%2C%20j'ai%20un%20projet%20BTP%20et%20j'aimerais%20discuter.`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="services-cta"
            className="inline-flex items-center gap-2 border border-[#D4AF37] text-[#D4AF37] font-semibold px-8 py-3 hover:bg-[#D4AF37] hover:text-black transition-all duration-200 text-sm tracking-wide"
          >
            Parlez-nous de votre projet
          </a>
        </div>
      </div>
    </section>
  );
}
