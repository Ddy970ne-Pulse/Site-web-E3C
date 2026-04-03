import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const WHATSAPP = "590690449714";

export default function CGV() {
  return (
    <div className="bg-[#0A0A0A] min-h-screen">
      <Navbar whatsapp={WHATSAPP} />

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] text-sm mb-8 transition-colors">
          <ChevronLeft size={14} /> Retour à l'accueil
        </Link>

        <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-2">Conditions générales</p>
        <h1 className="font-outfit font-bold text-3xl text-white mb-8">Conditions Générales de Vente</h1>
        <div className="section-divider mb-10" />

        <div className="space-y-10 text-gray-400 text-sm leading-relaxed">

          <section>
            <h2 className="font-outfit font-semibold text-white text-base mb-3">1. Objet</h2>
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre
              E3C — Entreprise de Constructions (ci-après « E3C ») et tout client faisant appel à ses services
              de construction, rénovation et travaux tous corps d'état en Guadeloupe.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-semibold text-white text-base mb-3">2. Devis et commandes</h2>
            <p>
              Tout projet fait l'objet d'un devis gratuit, détaillé et personnalisé. Le devis est valable
              <strong className="text-gray-200"> 30 jours</strong> à compter de sa date d'émission.
            </p>
            <p className="mt-3">
              La commande est ferme et définitive dès la signature du devis par le client, accompagnée de la
              mention « Bon pour accord » et du versement de l'acompte défini dans le devis.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-semibold text-white text-base mb-3">3. Prix et TVA</h2>
            <p>
              Les prix sont exprimés en euros (€) hors taxes (HT). La TVA applicable en Guadeloupe est
              de <strong className="text-gray-200">8,5%</strong> (taux DOM). Le montant TTC est indiqué sur
              chaque devis.
            </p>
            <p className="mt-3">
              E3C se réserve le droit de modifier ses tarifs en cas de variation significative du coût des
              matières premières ou des charges, sous réserve d'en informer le client.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-semibold text-white text-base mb-3">4. Modalités de paiement</h2>
            <div className="bg-[#121212] border border-white/5 rounded-sm p-5 space-y-2">
              <p><span className="text-[#D4AF37] font-semibold">Acompte :</span> <span className="text-gray-200">30% du montant TTC à la signature du devis</span></p>
              <p><span className="text-[#D4AF37] font-semibold">Situation :</span> <span className="text-gray-200">Selon avancement des travaux (sur facturation intermédiaire)</span></p>
              <p><span className="text-[#D4AF37] font-semibold">Solde :</span> <span className="text-gray-200">À la réception des travaux</span></p>
            </div>
            <p className="mt-3">
              Les paiements s'effectuent par virement bancaire, chèque ou paiement en ligne sécurisé (Stripe)
              via l'espace client du site. Tout retard de paiement entraîne des pénalités de retard au taux
              légal en vigueur.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-semibold text-white text-base mb-3">5. Délais d'exécution</h2>
            <p>
              Les délais d'exécution sont indiqués à titre prévisionnel dans le devis. E3C s'engage à respecter
              ces délais, sous réserve de cas de force majeure (intempéries, retard de livraison de matériaux,
              conditions climatiques propres à la Guadeloupe, etc.).
            </p>
            <p className="mt-3">
              En cas de retard imputable à E3C et dépassant 15 jours ouvrés, le client pourra, après mise en
              demeure restée sans effet, demander une révision des conditions.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-semibold text-white text-base mb-3">6. Réception des travaux</h2>
            <p>
              La réception des travaux est prononcée contradictoirement entre E3C et le client à l'achèvement
              des travaux. Un procès-verbal de réception est établi. Les réserves éventuelles doivent être
              formulées par écrit lors de la réception.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-semibold text-white text-base mb-3">7. Garanties légales</h2>
            <div className="space-y-3">
              <div className="bg-[#121212] border border-white/5 rounded-sm p-4">
                <p className="text-gray-200 font-semibold text-xs uppercase tracking-wider mb-1">Garantie décennale (10 ans)</p>
                <p className="text-xs">Couvre les dommages qui compromettent la solidité de l'ouvrage ou le rendent impropre à sa destination (art. 1792 du Code civil).</p>
              </div>
              <div className="bg-[#121212] border border-white/5 rounded-sm p-4">
                <p className="text-gray-200 font-semibold text-xs uppercase tracking-wider mb-1">Garantie de parfait achèvement (1 an)</p>
                <p className="text-xs">Couvre tous les désordres signalés lors de la réception ou apparaissant dans l'année suivante.</p>
              </div>
              <div className="bg-[#121212] border border-white/5 rounded-sm p-4">
                <p className="text-gray-200 font-semibold text-xs uppercase tracking-wider mb-1">Garantie biennale (2 ans)</p>
                <p className="text-xs">Couvre les éléments d'équipement dissociables de l'ouvrage.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-outfit font-semibold text-white text-base mb-3">8. Litiges</h2>
            <p>
              En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours
              judiciaire. À défaut d'accord amiable, le tribunal compétent sera celui du ressort du siège
              social de E3C en Guadeloupe.
            </p>
            <p className="mt-3">
              Les présentes CGV sont soumises au droit français.
            </p>
          </section>

          <p className="text-xs text-gray-600 border-t border-white/5 pt-6">
            Dernière mise à jour : Avril 2026
          </p>
        </div>
      </main>

      <Footer whatsapp={WHATSAPP} />
    </div>
  );
}
