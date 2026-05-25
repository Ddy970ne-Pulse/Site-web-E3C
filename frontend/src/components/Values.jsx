import { useNavigate } from "react-router-dom";
import { CheckCircle, Clock, Users, Award, Wrench, MapPin, ArrowRight } from "lucide-react";

const values = [
  { icon: Award,        title: "Qualité Premium",              desc: "Matériaux certifiés, finitions soignées, exigence sur chaque chantier." },
  { icon: Clock,        title: "Réactivité Garantie",          desc: "Délais respectés, urgences gérées, réponse rapide à toute demande." },
  { icon: Users,        title: "Accompagnement Personnalisé",  desc: "Un interlocuteur unique, à l'écoute de votre projet du début à la fin." },
  { icon: CheckCircle,  title: "Travail Aux Normes",           desc: "Respect strict des normes en vigueur. Sécurité et conformité garanties." },
  { icon: Wrench,       title: "Équipe Qualifiée",             desc: "Artisans expérimentés, formés, maîtrisant tous corps d'état du BTP." },
  { icon: MapPin,       title: "Ancrage Local",                desc: "Entreprise guadeloupéenne, connaissance parfaite du terrain et du climat." },
];

export default function Values() {
  const navigate = useNavigate();
  return (
    <section
      id="values"
      data-testid="values-section"
      className="py-16 md:py-24 bg-[#F5F4F0] dark:bg-[#0D0D0D]"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-2">
              Pourquoi nous choisir
            </p>
            <h2 className="font-outfit font-bold text-3xl md:text-4xl text-[#1A1A1A] dark:text-white mb-3">
              La confiance, ça se mérite
            </h2>
            <div className="section-divider" />
          </div>
          <p className="text-[#737373] dark:text-gray-400 text-sm max-w-sm leading-relaxed md:text-right">
            E3C, c'est l'expertise locale, la rigueur d'un artisan et la
            réactivité d'une équipe engagée auprès de ses clients guadeloupéens.
          </p>
        </div>

        {/* Grille compacte */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-black/6 dark:bg-white/5 border border-black/6 dark:border-white/5 rounded-sm overflow-hidden">
          {values.map((value, i) => {
            const Icon = value.icon;
            return (
              <div
                key={value.title}
                data-testid={`value-card-${i}`}
                className="group bg-[#F5F4F0] hover:bg-[#EDEAE3] dark:bg-[#0D0D0D] dark:hover:bg-[#131313] transition-colors duration-200 p-5 flex items-start gap-4"
              >
                <div className="w-9 h-9 flex-shrink-0 bg-[#D4AF37]/8 border border-[#D4AF37]/15 flex items-center justify-center rounded-sm mt-0.5 group-hover:bg-[#D4AF37]/15 transition-colors">
                  <Icon size={16} strokeWidth={1.5} className="text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-outfit font-semibold text-[#1A1A1A] dark:text-white text-sm leading-snug mb-1">
                    {value.title}
                  </h3>
                  <p className="text-[#9E9E9E] dark:text-gray-500 text-xs leading-relaxed">
                    {value.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA bas de section */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-black/7 dark:border-white/5">
          <div>
            <p className="font-outfit font-semibold text-[#1A1A1A] dark:text-white text-base">Prêt à démarrer votre projet ?</p>
            <p className="text-[#9E9E9E] dark:text-gray-500 text-xs mt-0.5">Devis gratuit · Sans engagement · Réponse rapide</p>
          </div>
          <button
            onClick={() => navigate("/devis")}
            data-testid="values-cta"
            className="flex-shrink-0 flex items-center gap-2 bg-[#D4AF37] text-black font-bold px-6 py-2.5 hover:bg-[#E6C65A] transition-colors text-sm rounded-sm"
          >
            Obtenir un devis gratuit <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </section>
  );
}
