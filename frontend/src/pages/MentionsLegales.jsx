import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const WHATSAPP = "590690449714";

export default function MentionsLegales() {
  return (
    <div className="bg-[#0A0A0A] min-h-screen">
      <Navbar whatsapp={WHATSAPP} />

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] text-sm mb-8 transition-colors">
          <ChevronLeft size={14} /> Retour à l'accueil
        </Link>

        <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-2">Informations légales</p>
        <h1 className="font-outfit font-bold text-3xl text-white mb-8">Mentions légales</h1>
        <div className="section-divider mb-10" />

        <div className="prose-custom space-y-10 text-gray-400 text-sm leading-relaxed">

          <section>
            <h2 className="font-outfit font-semibold text-white text-base mb-3">1. Éditeur du site</h2>
            <div className="bg-[#121212] border border-white/5 rounded-sm p-5 space-y-1.5">
              <p><span className="text-gray-500">Raison sociale :</span> <span className="text-gray-200">E3C — Entreprise de Constructions</span></p>
              <p><span className="text-gray-500">Forme juridique :</span> <span className="text-gray-200">Entreprise individuelle / Société (à préciser)</span></p>
              <p><span className="text-gray-500">Siège social :</span> <span className="text-gray-200">Guadeloupe (971), Antilles françaises</span></p>
              <p><span className="text-gray-500">SIRET / SIREN :</span> <span className="text-gray-200">À compléter</span></p>
              <p><span className="text-gray-500">N° TVA intracommunautaire :</span> <span className="text-gray-200">À compléter</span></p>
              <p><span className="text-gray-500">Contact :</span> <span className="text-gray-200">Via le <Link to="/contact" className="text-[#D4AF37] hover:underline">formulaire de contact</Link></span></p>
            </div>
          </section>

          <section>
            <h2 className="font-outfit font-semibold text-white text-base mb-3">2. Directeur de la publication</h2>
            <p>Le directeur de la publication est le représentant légal de E3C — Entreprise de Constructions.</p>
          </section>

          <section>
            <h2 className="font-outfit font-semibold text-white text-base mb-3">3. Hébergement</h2>
            <div className="bg-[#121212] border border-white/5 rounded-sm p-5 space-y-1.5">
              <p><span className="text-gray-500">Hébergeur :</span> <span className="text-gray-200">Emergent Labs Inc.</span></p>
              <p><span className="text-gray-500">Site :</span> <span className="text-gray-200"><a href="https://emergent.sh" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline">emergent.sh</a></span></p>
            </div>
          </section>

          <section>
            <h2 className="font-outfit font-semibold text-white text-base mb-3">4. Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site (textes, images, logos, graphismes) est la propriété exclusive de
              E3C — Entreprise de Constructions ou de ses fournisseurs de contenu, et est protégé par les lois
              françaises et internationales relatives à la propriété intellectuelle.
            </p>
            <p className="mt-3">
              Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des
              éléments du site est interdite sans autorisation écrite préalable de E3C.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-semibold text-white text-base mb-3">5. Protection des données personnelles (RGPD)</h2>
            <p>
              E3C collecte des données personnelles uniquement dans le cadre de demandes de devis et de contact
              (nom, email, téléphone, commune). Ces données sont utilisées exclusivement pour traiter votre demande
              et ne sont jamais cédées à des tiers.
            </p>
            <p className="mt-3">
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et
              Libertés, vous disposez d'un droit d'accès, de rectification, d'opposition et de suppression de vos
              données personnelles. Pour exercer ces droits, contactez-nous via le{" "}
              <Link to="/contact" className="text-[#D4AF37] hover:underline">formulaire de contact</Link>.
            </p>
            <p className="mt-3">
              Les données sont conservées pour une durée maximale de 3 ans à compter du dernier contact.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-semibold text-white text-base mb-3">6. Cookies</h2>
            <p>
              Ce site utilise des cookies techniques nécessaires à son bon fonctionnement (session, authentification).
              Aucun cookie publicitaire ou de traçage tiers n'est utilisé sans votre consentement.
            </p>
          </section>

          <section>
            <h2 className="font-outfit font-semibold text-white text-base mb-3">7. Limitation de responsabilité</h2>
            <p>
              E3C s'efforce de fournir des informations exactes et à jour sur ce site. Toutefois, E3C ne saurait
              être tenu responsable des omissions, inexactitudes ou carences dans la mise à jour des informations.
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
