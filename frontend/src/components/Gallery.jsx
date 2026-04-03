import { useState } from "react";
import { X, ZoomIn } from "lucide-react";

const galleryImages = [
  {
    url: "https://images.unsplash.com/photo-1685425355454-9f96c58de679?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwyfHxCVFAlMjBjb25zdHJ1Y3Rpb24lMjByZW5vdmF0aW9uJTIwQ2FyaWJiZWFuJTIwdHJvcGljYWwlMjBidWlsZGluZ3xlbnwwfHx8fDE3NzUyMzE0MjN8MA&ixlib=rb-4.1.0&q=85",
    label: "Construction",
    tag: "Gros Oeuvre",
  },
  {
    url: "https://images.unsplash.com/photo-1747056711958-9d8c3b97b578?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHw0fHxjb25zdHJ1Y3Rpb24lMjB3b3JrZXJzJTIwbWFzb25yeSUyMGJ1aWxkaW5nJTIwdHJvcGljYWx8ZW58MHx8fHwxNzc1MjMxNjEwfDA&ixlib=rb-4.1.0&q=85",
    label: "Maçonnerie",
    tag: "Chantier",
  },
  {
    url: "https://images.unsplash.com/photo-1767950470198-c9cd97f8ed87?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBtb2Rlcm4lMjBhcmNoaXRlY3R1cmUlMjBuaWdodHxlbnwwfHx8fDE3NzUyMzE0Nzh8MA&ixlib=rb-4.1.0&q=85",
    label: "Architecture Moderne",
    tag: "Réalisation",
  },
  {
    url: "https://images.unsplash.com/photo-1756949313571-cee2d2bb3d9c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwyfHxjb25zdHJ1Y3Rpb24lMjB3b3JrZXJzJTIwbWFzb25yeSUyMGJ1aWxkaW5nJTIwdHJvcGljYWx8ZW58MHx8fHwxNzc1MjMxNjEwfDA&ixlib=rb-4.1.0&q=85",
    label: "Peinture Façade",
    tag: "Finition",
  },
  {
    url: "https://images.unsplash.com/photo-1772567733034-f483af656d1a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMHJlbm92YXRpb24lMjBwYWludGluZyUyMG1vZGVybiUyMGhvbWV8ZW58MHx8fHwxNzc1MjMxNjEwfDA&ixlib=rb-4.1.0&q=85",
    label: "Rénovation Intérieure",
    tag: "Rénovation",
  },
  {
    url: "https://images.unsplash.com/photo-1648475237029-7f853809ca14?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwzfHxpbnRlcmlvciUyMHJlbm92YXRpb24lMjBwYWludGluZyUyMG1vZGVybiUyMGhvbWV8ZW58MHx8fHwxNzc1MjMxNjEwfDA&ixlib=rb-4.1.0&q=85",
    label: "Aménagement Intérieur",
    tag: "Intérieur",
  },
  {
    url: "https://images.unsplash.com/photo-1673645652350-6a4c31c1c78f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NDh8MHwxfHNlYXJjaHwyfHxyb29maW5nJTIwdGlsZXMlMjBob3VzZSUyMGNvbnN0cnVjdGlvbnxlbnwwfHx8fDE3NzUyMzE2MTB8MA&ixlib=rb-4.1.0&q=85",
    label: "Toiture",
    tag: "Couverture",
  },
  {
    url: "https://images.unsplash.com/photo-1700490984959-c12d6cc78692?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwzfHxjb25zdHJ1Y3Rpb24lMjB3b3JrZXJzJTIwbWFzb25yeSUyMGJ1aWxkaW5nJTIwdHJvcGljYWx8ZW58MHx8fHwxNzc1MjMxNjEwfDA&ixlib=rb-4.1.0&q=85",
    label: "Construction Neuve",
    tag: "Construction",
  },
];

export default function Gallery() {
  const [lightbox, setLightbox] = useState(null);

  return (
    <section id="gallery" data-testid="gallery-section" className="py-20 md:py-32 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-3">
            Nos Réalisations
          </p>
          <h2 className="font-outfit font-bold text-3xl md:text-4xl text-white mb-4">
            Un travail soigné, visible à chaque chantier
          </h2>
          <div className="section-divider mb-4" />
          <p className="text-gray-400 text-base max-w-xl">
            Découvrez quelques-uns de nos chantiers et réalisations en
            Guadeloupe. Chaque projet reflète notre engagement pour la qualité.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {galleryImages.map((img, i) => (
            <div
              key={i}
              data-testid={`gallery-item-${i}`}
              className={`gallery-item relative cursor-pointer rounded-sm overflow-hidden ${
                i === 0 ? "col-span-2 row-span-2" : ""
              }`}
              style={{ aspectRatio: i === 0 ? "1/1" : "4/3" }}
              onClick={() => setLightbox(img)}
            >
              <img
                src={img.url}
                alt={img.label}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block">
                    {img.tag}
                  </span>
                  <span className="text-white text-sm font-medium">{img.label}</span>
                </div>
                <div className="absolute top-3 right-3">
                  <ZoomIn size={18} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="mt-10 text-center">
          <p className="text-gray-400 text-sm">
            Vos photos de chantiers seront intégrées ici pour valoriser vos réalisations.
          </p>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          data-testid="gallery-lightbox"
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-white hover:text-[#D4AF37] transition-colors"
            >
              <X size={28} />
            </button>
            <img
              src={lightbox.url}
              alt={lightbox.label}
              className="w-full max-h-[80vh] object-contain"
            />
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                {lightbox.tag}
              </span>
              <span className="text-white font-medium">{lightbox.label}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
