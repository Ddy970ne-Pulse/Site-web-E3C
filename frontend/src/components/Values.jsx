import { CheckCircle, Clock, Users, Award, Wrench, MapPin } from "lucide-react";

const values = [
  {
    icon: Award,
    title: "Qualité Premium",
    desc: "Matériaux certifiés, finitions soignées. Chaque chantier est réalisé avec exigence et rigueur professionnelle.",
  },
  {
    icon: Clock,
    title: "Réactivité Garantie",
    desc: "Réponse rapide à vos demandes. Nous respectons les délais convenus et gérons les urgences avec efficacité.",
  },
  {
    icon: Users,
    title: "Accompagnement Personnalisé",
    desc: "Un interlocuteur unique qui prend le temps de comprendre votre projet pour vous proposer la meilleure solution.",
  },
  {
    icon: CheckCircle,
    title: "Travail Aux Normes",
    desc: "Respect strict des normes de construction en vigueur. Sécurité et conformité garanties sur tous nos chantiers.",
  },
  {
    icon: Wrench,
    title: "Équipe Qualifiée",
    desc: "Artisans expérimentés, formés et équipés. Maîtrise technique de tous corps d'état du BTP.",
  },
  {
    icon: MapPin,
    title: "Ancrage Local",
    desc: "Entreprise guadeloupéenne, connaissance parfaite du terrain et des contraintes climatiques locales.",
  },
];

export default function Values() {
  return (
    <section
      id="values"
      data-testid="values-section"
      className="py-20 md:py-32 bg-[#0D0D0D] relative overflow-hidden"
    >
      {/* Background accent */}
      <div
        className="absolute top-0 right-0 w-1/2 h-full opacity-5"
        style={{
          backgroundImage:
            "url(https://static.prod-images.emergentagent.com/jobs/bed7ba01-3d73-4dbb-bf1f-2181e68e96b9/images/47d58932993f59149ebdfb764f3bef56abd5416d3188679f1d7880428952520c.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-12 md:mb-16 max-w-2xl">
          <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-3">
            Pourquoi nous choisir
          </p>
          <h2 className="font-outfit font-bold text-3xl md:text-4xl text-white mb-4">
            La confiance, ça se mérite
          </h2>
          <div className="section-divider mb-4" />
          <p className="text-gray-400 text-base leading-relaxed">
            E3C c'est l'expertise locale, la rigueur d'un artisan et la
            réactivité d'une équipe engagée auprès de ses clients guadeloupéens.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map((value, i) => {
            const Icon = value.icon;
            return (
              <div
                key={value.title}
                data-testid={`value-card-${i}`}
                className="group p-6 md:p-8 bg-[#121212] border border-white/5 hover:border-[#D4AF37]/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0 rounded-sm group-hover:bg-[#D4AF37]/20 transition-colors">
                    <Icon size={18} strokeWidth={1.5} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <h3 className="font-outfit font-semibold text-white text-base mb-2">
                      {value.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {value.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom statement */}
        <div className="mt-16 border-t border-white/5 pt-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-2xl font-outfit font-bold text-white mb-1">
              Prêt à démarrer votre projet ?
            </p>
            <p className="text-gray-400 text-sm">
              Devis gratuit · Sans engagement · Réponse rapide
            </p>
          </div>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
            }}
            data-testid="values-cta"
            className="flex-shrink-0 bg-[#D4AF37] text-black font-bold px-8 py-4 hover:bg-[#E6C65A] transition-colors tracking-wide text-sm"
          >
            Obtenir un devis gratuit
          </a>
        </div>
      </div>
    </section>
  );
}
