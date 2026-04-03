import { MapPin, CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const communes = [
  "Pointe-à-Pitre", "Les Abymes", "Baie-Mahault", "Le Gosier", "Sainte-Anne",
  "Saint-François", "Capesterre", "Basse-Terre", "Saint-Claude", "Gourbeyre",
  "Petit-Bourg", "Lamentin", "Morne-à-l'Eau", "Port-Louis", "Anse-Bertrand",
  "Deshaies", "Bouillante", "Vieux-Habitants", "Trois-Rivières", "Saint-Louis (Marie-Galante)",
];

export default function ZoneIntervention({ whatsapp }) {
  const navigate = useNavigate();
  return (
    <section
      id="zone"
      data-testid="zone-section"
      className="py-20 md:py-32 bg-[#0D0D0D] relative overflow-hidden"
    >
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "url(https://static.prod-images.emergentagent.com/jobs/bed7ba01-3d73-4dbb-bf1f-2181e68e96b9/images/017d698e7e8c677b68fdcb7ae0b29fa1a9f8cd2da340b7be420f29ea090488ce.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Left */}
          <div>
            <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-3">
              Zone d'intervention
            </p>
            <h2 className="font-outfit font-bold text-3xl md:text-4xl text-white mb-4">
              Nous intervenons sur
              <br />
              toute la Guadeloupe
            </h2>
            <div className="section-divider mb-6" />
            <p className="text-gray-400 text-base leading-relaxed mb-8">
              Que vous soyez en Grande-Terre, Basse-Terre ou dans les communes
              environnantes, notre équipe E3C se déplace rapidement pour étudier
              votre projet et réaliser vos travaux.
            </p>

            {/* Info cards — no phone */}
            <div className="space-y-4 mb-8">
              {[
                { icon: MapPin, title: "Siège", value: "Guadeloupe (971)" },
                { icon: CheckCircle, title: "Dévis", value: "Gratuit & sans engagement" },
                { icon: CheckCircle, title: "Intervention", value: "Grande-Terre & Basse-Terre" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-center gap-4 p-4 bg-[#121212] border border-white/5 rounded-sm">
                    <div className="w-9 h-9 bg-[#D4AF37]/10 flex items-center justify-center rounded-sm flex-shrink-0">
                      <Icon size={16} strokeWidth={1.5} className="text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{item.title}</p>
                      <p className="text-white font-medium text-sm">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/devis")}
                data-testid="zone-devis-btn"
                className="inline-flex items-center justify-center gap-2 bg-[#D4AF37] text-black font-bold px-6 py-3 hover:bg-[#E6C65A] transition-colors text-sm tracking-wide rounded-sm"
              >
                Demander un devis <ArrowRight size={14} />
              </button>
              <a
                href={`https://wa.me/${whatsapp}?text=Bonjour%20E3C%2C%20je%20souhaite%20v%C3%A9rifier%20votre%20disponibilit%C3%A9%20dans%20ma%20commune.`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="zone-whatsapp-btn"
                className="inline-flex items-center justify-center gap-2 border border-white/20 text-white font-semibold px-6 py-3 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-colors text-sm rounded-sm"
              >
                WhatsApp
              </a>
            </div>
          </div>

          {/* Right — Communes */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-5 font-semibold">
              Communes desservies
            </p>
            <div className="flex flex-wrap gap-2">
              {communes.map((commune) => (
                <span
                  key={commune}
                  data-testid={`commune-tag-${commune}`}
                  className="zone-tag text-xs font-semibold px-3 py-1.5 rounded-sm"
                >
                  {commune}
                </span>
              ))}
              <span className="zone-tag text-xs font-semibold px-3 py-1.5 rounded-sm opacity-70">
                + toutes communes
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              * Un doute ? Appelez-nous, on vous confirme notre
              disponibilit&eacute;.
            </p>

            {/* Map placeholder */}
            <div className="mt-8 relative rounded-sm overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1641425387303-2b3c1fb1f3c4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwxfHxCVFAlMjBjb25zdHJ1Y3Rpb24lMjByZW5vdmF0aW9uJTIwQ2FyaWJiZWFuJTIwdHJvcGljYWwlMjBidWlsZGluZ3xlbnwwfHx8fDE3NzUyMzE0MjN8MA&ixlib=rb-4.1.0&q=85"
                alt="Guadeloupe construction"
                className="w-full h-48 object-cover opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="text-center">
                  <MapPin size={32} className="text-[#D4AF37] mx-auto mb-2" />
                  <p className="text-white font-outfit font-bold text-lg">
                    Guadeloupe
                  </p>
                  <p className="text-gray-300 text-xs">971 — Antilles françaises</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
