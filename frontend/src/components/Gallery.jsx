import { useState, useEffect } from "react";
import axios from "axios";
import { X, ZoomIn, Grid3X3 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FILTERS = ["Tout", "Maçonnerie", "Toiture", "Rénovation", "Peinture", "Carrelage"];

// Images statiques (fallback et base de la galerie)
const STATIC_IMAGES = [
  { id: "s1", url: "https://images.unsplash.com/photo-1685425355454-9f96c58de679?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwyfHxCVFAlMjBjb25zdHJ1Y3Rpb24lMjByZW5vdmF0aW9uJTIwQ2FyaWJiZWFuJTIwdHJvcGljYWwlMjBidWlsZGluZ3xlbnwwfHx8fDE3NzUyMzE0MjN8MA&ixlib=rb-4.1.0&q=85", label: "Fondations béton", tag: "Gros Oeuvre", category: "Maçonnerie" },
  { id: "s2", url: "https://images.unsplash.com/photo-1747056711958-9d8c3b97b578?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHw0fHxjb25zdHJ1Y3Rpb24lMjB3b3JrZXJzJTIwbWFzb25yeSUyMGJ1aWxkaW5nJTIwdHJvcGljYWx8ZW58MHx8fHwxNzc1MjMxNjEwfDA&ixlib=rb-4.1.0&q=85", label: "Maçonnerie agglo", tag: "Murs porteurs", category: "Maçonnerie" },
  { id: "s3", url: "https://images.unsplash.com/photo-1767950470198-c9cd97f8ed87?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBtb2Rlcm4lMjBhcmNoaXRlY3R1cmUlMjBuaWdodHxlbnwwfHx8fDE3NzUyMzE0Nzh8MA&ixlib=rb-4.1.0&q=85", label: "Résidence neuve", tag: "Construction", category: "Maçonnerie" },
  { id: "s4", url: "https://images.unsplash.com/photo-1700490984959-c12d6cc78692?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwzfHxjb25zdHJ1Y3Rpb24lMjB3b3JrZXJzJTIwbWFzb25yeSUyMGJ1aWxkaW5nJTIwdHJvcGljYWx8ZW58MHx8fHwxNzc1MjMxNjEwfDA&ixlib=rb-4.1.0&q=85", label: "Dalle béton armé", tag: "Structure", category: "Maçonnerie" },
  { id: "s5", url: "https://images.unsplash.com/photo-1696344185454-caf39e418eec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwyfHxyb29maW5nJTIwdGlsZXMlMjB0cm9waWNhbCUyMGhvdXNlJTIwY29uc3RydWN0aW9ufGVufDB8fHx8MTc3NTI0MzEzOXww&ixlib=rb-4.1.0&q=85", label: "Couverture tuiles", tag: "Toiture", category: "Toiture" },
  { id: "s6", url: "https://images.unsplash.com/photo-1673645652350-6a4c31c1c78f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NDh8MHwxfHNlYXJjaHwyfHxyb29maW5nJTIwdGlsZXMlMjBob3VzZSUyMGNvbnN0cnVjdGlvbnxlbnwwfHx8fDE3NzUyMzE2MTB8MA&ixlib=rb-4.1.0&q=85", label: "Charpente & toiture", tag: "Couverture", category: "Toiture" },
  { id: "s7", url: "https://images.unsplash.com/photo-1772567733034-f483af656d1a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMHJlbm92YXRpb24lMjBwYWludGluZyUyMG1vZGVybiUyMGhvbWV8ZW58MHx8fHwxNzc1MjMxNjEwfDA&ixlib=rb-4.1.0&q=85", label: "Rénovation intérieure", tag: "Rénovation", category: "Rénovation" },
  { id: "s8", url: "https://images.unsplash.com/photo-1648475237029-7f853809ca14?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwzfHxpbnRlcmlvciUyMHJlbm92YXRpb24lMjBwYWludGluZyUyMG1vZGVybiUyMGhvbWV8ZW58MHx8fHwxNzc1MjMxNjEwfDA&ixlib=rb-4.1.0&q=85", label: "Aménagement intérieur", tag: "Intérieur", category: "Rénovation" },
  { id: "s9", url: "https://images.unsplash.com/photo-1613844044163-1ad2f2d0b152?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxleHRlcmlvciUyMGhvdXNlJTIwcGFpbnRpbmclMjBmYWNhZGUlMjByZW5vdmF0aW9ufGVufDB8fHx8MTc3NTI0MzEzOXww&ixlib=rb-4.1.0&q=85", label: "Peinture façade", tag: "Peinture extérieure", category: "Peinture" },
  { id: "s10", url: "https://images.unsplash.com/photo-1756949313571-cee2d2bb3d9c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwyfHxjb25zdHJ1Y3Rpb24lMjB3b3JrZXJzJTIwbWFzb25yeSUyMGJ1aWxkaW5nJTIwdHJvcGljYWx8ZW58MHx8fHwxNzc1MjMxNjEwfDA&ixlib=rb-4.1.0&q=85", label: "Finitions peinture", tag: "Enduit & peinture", category: "Peinture" },
  { id: "s11", url: "https://images.unsplash.com/photo-1560005627-c96e0aeb6eaa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHwyfHxmbG9vciUyMHRpbGUlMjBpbnN0YWxsYXRpb24lMjBjYXJyZWxhZ2UlMjBpbnRlcmlvcnxlbnwwfHx8fDE3NzUyNDMxMzl8MA&ixlib=rb-4.1.0&q=85", label: "Carrelage décoratif", tag: "Revêtement sol", category: "Carrelage" },
  { id: "s12", url: "https://images.unsplash.com/photo-1568545895426-ce552802b55f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHwxfHxmbG9vciUyMHRpbGUlMjBpbnN0YWxsYXRpb24lMjBjYXJyZWxhZ2UlMjBpbnRlcmlvcnxlbnwwfHx8fDE3NzUyNDMxMzl8MA&ixlib=rb-4.1.0&q=85", label: "Carrelage intérieur", tag: "Faïence & pose", category: "Carrelage" },
];

export default function Gallery() {
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [lightbox, setLightbox] = useState(null);
  const [apiImages, setApiImages] = useState([]);

  useEffect(() => {
    axios.get(`${API}/gallery`)
      .then(r => setApiImages(r.data))
      .catch(() => setApiImages([]));
  }, []);

  const allImages = [...apiImages, ...STATIC_IMAGES];
  const filtered = activeFilter === "Tout"
    ? allImages
    : allImages.filter(img => img.category === activeFilter);

  return (
    <section id="gallery" data-testid="gallery-section" className="py-16 md:py-24 bg-[#FAFAF8] dark:bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <p className="text-[#D4AF37] text-sm font-bold uppercase tracking-widest mb-2">
              Nos Réalisations
            </p>
            <h2 className="font-outfit font-bold text-4xl md:text-5xl text-[#1A1A1A] dark:text-white mb-3">
              Un travail soigné, chantier après chantier
            </h2>
            <div className="section-divider" />
          </div>
          <div className="flex items-center gap-2 text-[#9E9E9E] dark:text-gray-500 text-sm md:text-right flex-shrink-0">
            <Grid3X3 size={12} />
            <span>{filtered.length} réalisation{filtered.length > 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide" data-testid="gallery-filters">
          {FILTERS.map(filter => (
            <button
              key={filter}
              data-testid={`filter-${filter.toLowerCase()}`}
              onClick={() => setActiveFilter(filter)}
              className={`flex-shrink-0 px-4 py-1.5 text-sm font-semibold rounded-sm border transition-all duration-150 ${
                activeFilter === filter
                  ? "bg-[#D4AF37] border-[#D4AF37] text-black"
                  : "bg-transparent border-black/10 dark:border-white/10 text-[#737373] dark:text-gray-400 hover:border-black/25 dark:hover:border-white/25 hover:text-[#1A1A1A] dark:hover:text-gray-200"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Grille */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {filtered.map((img, i) => (
            <div
              key={img.label}
              data-testid={`gallery-item-${i}`}
              className="gallery-item relative cursor-pointer rounded-sm overflow-hidden bg-[#E8E5DD] dark:bg-[#141414]"
              style={{ aspectRatio: "4/3" }}
              onClick={() => setLightbox(img)}
            >
              <img
                src={img.url}
                alt={img.label}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-250">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <span className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] block mb-0.5">
                    {img.tag}
                  </span>
                  <span className="text-white text-sm font-medium leading-snug">{img.label}</span>
                </div>
                <div className="absolute top-2.5 right-2.5 w-7 h-7 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-sm">
                  <ZoomIn size={13} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="py-16 text-center border border-black/7 dark:border-white/5 rounded-sm">
            <p className="text-[#9E9E9E] dark:text-gray-500 text-base">Aucune réalisation dans cette catégorie pour le moment.</p>
          </div>
        )}

        <p className="text-[#ADADAD] dark:text-gray-600 text-sm text-center mt-6">
          Vos photos de chantiers seront intégrées ici pour valoriser vos réalisations.
        </p>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          data-testid="gallery-lightbox"
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <img
              src={lightbox.url}
              alt={lightbox.label}
              className="w-full max-h-[80vh] object-contain rounded-sm"
            />
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm font-bold uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-1 rounded-sm">
                {lightbox.tag}
              </span>
              <span className="text-white text-base font-medium">{lightbox.label}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
