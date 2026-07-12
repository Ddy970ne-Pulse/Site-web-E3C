import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "Intervenez-vous en urgence sur les chantiers ?",
    a: "Oui, E3C peut intervenir en urgence selon la nature des travaux. Contactez-nous directement par téléphone ou WhatsApp pour évaluer les délais possibles selon votre situation.",
  },
  {
    q: "Proposez-vous des devis gratuits ?",
    a: "Absolument. Tous nos devis sont entièrement gratuits et sans aucun engagement de votre part. Remplissez le formulaire de contact ou appelez-nous directement pour obtenir votre devis.",
  },
  {
    q: "Quelles zones de Guadeloupe couvrez-vous ?",
    a: "E3C intervient sur l'ensemble de la Guadeloupe : Grande-Terre, Basse-Terre et les communes environnantes. Contactez-nous pour confirmer notre disponibilité dans votre secteur.",
  },
  {
    q: "Travaillez-vous pour les particuliers et les professionnels ?",
    a: "Oui, nous intervenons aussi bien pour les particuliers que pour les professionnels et les entreprises. Nos équipes s'adaptent à tous types de projets, petits ou grands.",
  },
  {
    q: "Quels types de travaux réalisez-vous ?",
    a: "E3C prend en charge tous les corps d'état du BTP : maçonnerie, charpente, toiture, carrelage, peinture, rénovation intérieure, terrassement, plomberie et électricité générale.",
  },
  {
    q: "Comment se passe une demande de devis ?",
    a: "C'est simple ! Remplissez notre formulaire de contact, envoyez un message WhatsApp ou appelez-nous. Nous étudions votre projet et vous contactons rapidement pour convenir d'un rendez-vous.",
  },
  {
    q: "Utilisez-vous des matériaux de qualité ?",
    a: "Oui, nous travaillons exclusivement avec des matériaux certifiés et de qualité, adaptés au climat tropical de la Guadeloupe. La durabilité de nos travaux est une priorité.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" data-testid="faq-section" className="py-20 md:py-32 bg-[#F5F4F0] dark:bg-[#0D0D0D]">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[#D4AF37] text-sm font-bold uppercase tracking-widest mb-3">
            FAQ
          </p>
          <h2 className="font-outfit font-bold text-4xl md:text-5xl text-[#1A1A1A] dark:text-white mb-4">
            Questions fréquentes
          </h2>
          <div className="section-divider mx-auto mb-4" />
          <p className="text-[#737373] dark:text-gray-400 text-lg">
            Vos questions, nos réponses. Besoin d'autre chose ? Contactez-nous.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3" data-testid="faq-list">
          {faqs.map((faq, i) => (
            <div
              key={i}
              data-testid={`faq-item-${i}`}
              className="border border-black/8 dark:border-white/8 bg-white dark:bg-[#121212] rounded-sm overflow-hidden shadow-sm dark:shadow-none"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left group hover:bg-black/3 dark:hover:bg-white/2 transition-colors"
                data-testid={`faq-toggle-${i}`}
              >
                <span className="text-[#1A1A1A] dark:text-white font-medium text-base md:text-lg pr-4 group-hover:text-[#D4AF37] transition-colors">
                  {faq.q}
                </span>
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  {open === i ? (
                    <Minus size={16} className="text-[#D4AF37]" />
                  ) : (
                    <Plus size={16} className="text-[#D4AF37]" />
                  )}
                </div>
              </button>
              {open === i && (
                <div
                  data-testid={`faq-answer-${i}`}
                  className="px-6 pb-5 border-t border-black/7 dark:border-white/5"
                >
                  <p className="text-[#737373] dark:text-gray-400 text-base leading-relaxed pt-4">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center p-8 border border-black/7 dark:border-white/5 bg-white dark:bg-[#121212] rounded-sm shadow-sm dark:shadow-none">
          <p className="text-[#1A1A1A] dark:text-white font-outfit font-semibold text-xl mb-2">
            Vous avez d'autres questions ?
          </p>
          <p className="text-[#737373] dark:text-gray-400 text-base mb-6">
            Contactez-nous directement par WhatsApp ou téléphone.
          </p>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
            }}
            data-testid="faq-contact-link"
            className="inline-flex items-center gap-2 bg-[#D4AF37] text-black font-bold px-8 py-3 hover:bg-[#E6C65A] transition-colors text-base tracking-wide"
          >
            Nous contacter
          </a>
        </div>
      </div>
    </section>
  );
}
