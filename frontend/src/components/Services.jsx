import { useNavigate } from "react-router-dom";
import {
  Building2, Home, Layers, PaintBucket, Wrench,
  Hammer, Droplets, Zap, Trees, ArrowRight,
} from "lucide-react";

const services = [
  { icon: Building2, title: "Maçonnerie & Gros Oeuvre",   desc: "Fondations, murs porteurs, dalles béton, agglos." },
  { icon: Home,       title: "Charpente & Ossature",       desc: "Charpente bois, ossature métallique, structure bâtiment." },
  { icon: Layers,     title: "Toiture & Couverture",       desc: "Pose, réparation et entretien de toitures tous types." },
  { icon: PaintBucket,title: "Carrelage & Revêtements",    desc: "Pose carrelage intérieur/extérieur, faïence, parquet." },
  { icon: Wrench,     title: "Rénovation Intérieure",      desc: "Rénovation complète, cloisons, faux plafond, aménagement." },
  { icon: Hammer,     title: "Peinture & Enduits",         desc: "Enduit, peinture intérieure et extérieure, finitions soignées." },
  { icon: Trees,      title: "Terrassement & VRD",         desc: "Terrassement, nivellement, voiries et réseaux divers." },
  { icon: Droplets,   title: "Plomberie & Sanitaire",      desc: "Installation et réparation de réseaux d'eau, sanitaires." },
  { icon: Zap,        title: "Électricité Générale",       desc: "Installations électriques, tableaux, prises, éclairage." },
];

export default function Services({ whatsapp }) {
  const navigate = useNavigate();

  return (
    <section id="services" data-testid="services-section" className="py-16 md:py-24 bg-[#FAFAF8] dark:bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-[#D4AF37] text-sm font-bold uppercase tracking-widest mb-2">
              Nos Prestations
            </p>
            <h2 className="font-outfit font-bold text-4xl md:text-5xl text-[#1A1A1A] dark:text-white mb-3">
              Tous travaux BTP
            </h2>
            <div className="section-divider" />
          </div>
          <p className="text-[#737373] dark:text-gray-400 text-base max-w-sm leading-relaxed md:text-right">
            Construction neuve, rénovation, second œuvre — E3C intervient sur
            l'ensemble des corps de métier en Guadeloupe.
          </p>
        </div>

        {/* Grille compacte */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-black/6 dark:bg-white/5 border border-black/6 dark:border-white/5 rounded-sm overflow-hidden">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                data-testid={`service-card-${i}`}
                className="group bg-white hover:bg-[#F8F7F4] dark:bg-[#0E0E0E] dark:hover:bg-[#141414] transition-colors duration-200 p-5 flex items-start gap-4"
              >
                {/* Icône */}
                <div className="w-9 h-9 flex-shrink-0 bg-[#D4AF37]/8 border border-[#D4AF37]/15 flex items-center justify-center rounded-sm mt-0.5 group-hover:bg-[#D4AF37]/15 transition-colors">
                  <Icon size={16} strokeWidth={1.5} className="text-[#D4AF37]" />
                </div>
                {/* Texte */}
                <div className="min-w-0">
                  <h3 className="font-outfit font-semibold text-[#1A1A1A] dark:text-white text-base leading-snug mb-1">
                    {service.title}
                  </h3>
                  <p className="text-[#9E9E9E] dark:text-gray-500 text-sm leading-relaxed">
                    {service.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA bas de section */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-black/7 dark:border-white/5">
          <p className="text-[#9E9E9E] dark:text-gray-500 text-base">
            Votre projet ne rentre pas dans une case ? Décrivez-le nous.
          </p>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => navigate("/devis")}
              data-testid="services-cta"
              className="inline-flex items-center gap-2 bg-[#D4AF37] text-black font-bold text-base px-6 py-2.5 hover:bg-[#E6C65A] transition-colors rounded-sm"
            >
              Demander un devis gratuit
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
