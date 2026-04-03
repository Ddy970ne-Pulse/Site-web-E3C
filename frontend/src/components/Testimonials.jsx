import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Marie-Claire D.",
    commune: "Les Abymes",
    service: "Rénovation complète",
    stars: 5,
    text: "Équipe sérieuse et professionnelle. Chantier propre, délais respectés. Ma maison est méconnaissable ! Je recommande E3C sans hésiter.",
    initials: "MC",
  },
  {
    name: "Jean-Philippe M.",
    commune: "Baie-Mahault",
    service: "Maçonnerie & Extension",
    stars: 5,
    text: "Très satisfait de l'extension de ma maison. Travail soigné, équipe à l'écoute. Le devis était précis et le résultat conforme à nos attentes.",
    initials: "JP",
  },
  {
    name: "Sylviane B.",
    commune: "Le Gosier",
    service: "Toiture & Peinture",
    stars: 5,
    text: "Intervention rapide après un dégât des eaux. Toiture refaite et peinture extérieure impeccable. Prix correct pour un travail de qualité.",
    initials: "SB",
  },
  {
    name: "Robert L.",
    commune: "Sainte-Anne",
    service: "Construction neuve",
    stars: 5,
    text: "Construction de notre villa de A à Z. E3C a su gérer l'ensemble des corps de métier avec efficacité. Résultat au-delà de nos espérances.",
    initials: "RL",
  },
  {
    name: "Patricia C.",
    commune: "Pointe-à-Pitre",
    service: "Carrelage & Rénovation",
    stars: 5,
    text: "Carrelage posé avec soin, rénovation de la salle de bain parfaite. L'équipe est ponctuelle et le chantier toujours bien rangé.",
    initials: "PC",
  },
  {
    name: "Thierry F.",
    commune: "Capesterre",
    service: "Terrassement",
    stars: 5,
    text: "Terrassement de grande envergure réalisé dans les temps. Matériel adapté, travail propre. E3C connaît parfaitement les sols guadeloupéens.",
    initials: "TF",
  },
];

function StarRating({ count }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          className={i < count ? "fill-[#D4AF37] text-[#D4AF37]" : "text-gray-600"}
        />
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      data-testid="testimonials-section"
      className="py-20 md:py-32 bg-[#0A0A0A] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-3">
            Témoignages
          </p>
          <h2 className="font-outfit font-bold text-3xl md:text-4xl text-white mb-4">
            Ce que disent nos clients
          </h2>
          <div className="section-divider mb-4" />
          <p className="text-gray-400 text-base max-w-xl">
            La satisfaction de nos clients est notre meilleure référence.
            Découvrez leurs retours d'expérience sur nos chantiers en Guadeloupe.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={i}
              data-testid={`testimonial-${i}`}
              className="bg-[#121212] border border-white/5 hover:border-[#D4AF37]/15 transition-all duration-300 hover:-translate-y-1 p-6 rounded-sm flex flex-col"
            >
              {/* Quote icon */}
              <Quote size={20} className="text-[#D4AF37]/30 mb-3" />

              {/* Stars */}
              <StarRating count={t.stars} />

              {/* Text */}
              <p className="text-gray-300 text-sm leading-relaxed mt-3 mb-5 flex-1">
                "{t.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div className="w-9 h-9 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[#D4AF37] text-xs font-bold">{t.initials}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.commune} · {t.service}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-xs">
            * Ces témoignages seront remplacés par vos vrais avis clients dès réception.
          </p>
        </div>
      </div>
    </section>
  );
}
