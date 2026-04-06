import { useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { galleryApi } from "@/api";

const GALLERY_CATEGORIES = ["Maçonnerie", "Toiture", "Rénovation", "Peinture", "Carrelage"];
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function GalleryTab({ images, onRefresh }) {
  const [file, setFile] = useState(null);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("Maçonnerie");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (!label) setLabel(f.name.replace(/\.[^.]+$/, "").replace(/-|_/g, " "));
  };

  const upload = async e => {
    e.preventDefault();
    if (!file || !label.trim()) { setError("Fichier et libellé requis."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("label", label.trim());
      fd.append("category", category);
      await galleryApi.upload(fd);
      setSuccess("Photo ajoutée avec succès !");
      setFile(null); setLabel(""); setPreview(null);
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'upload.");
    } finally { setLoading(false); }
  };

  const deleteImg = async id => {
    if (!window.confirm("Supprimer cette photo ?")) return;
    try { await galleryApi.delete(id); onRefresh(); }
    catch { alert("Erreur lors de la suppression."); }
  };

  return (
    <div>
      <h1 className="font-outfit font-bold text-2xl text-white mb-6">Galerie ({images.length} photos admin)</h1>

      <div className="bg-[#121212] border border-white/5 rounded-sm p-6 mb-8">
        <h3 className="font-outfit font-semibold text-white text-sm mb-4 flex items-center gap-2">
          <Upload size={14} className="text-[#D4AF37]" /> Ajouter une photo
        </h3>
        <form onSubmit={upload} className="space-y-4">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-[#D4AF37]/30 rounded-sm p-8 cursor-pointer transition-colors group">
            {preview
              ? <img src={preview} alt="preview" className="max-h-40 object-contain mb-3 rounded-sm" />
              : <><Upload size={28} className="text-gray-600 group-hover:text-[#D4AF37]/60 mb-2 transition-colors" /><p className="text-gray-500 text-sm">Cliquer pour choisir (JPEG, PNG, WEBP · max 10 Mo)</p></>
            }
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" data-testid="gallery-file-input" />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest mb-1.5 block">Libellé *</label>
              <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Résidence Martin, Rénovation cuisine…"
                className="w-full bg-[#0A0A0A] border border-white/10 text-white text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-[#D4AF37]/40" data-testid="gallery-label-input" />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest mb-1.5 block">Catégorie *</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/10 text-white text-sm px-4 py-2.5 rounded-sm focus:outline-none focus:border-[#D4AF37]/40" data-testid="gallery-category-select">
                {GALLERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          {success && <p className="text-green-400 text-xs">{success}</p>}
          <button type="submit" disabled={loading} data-testid="gallery-upload-btn"
            className="flex items-center gap-2 bg-[#D4AF37] text-black font-bold text-sm px-6 py-2.5 hover:bg-[#E6C65A] transition-colors rounded-sm disabled:opacity-60">
            {loading ? "Upload…" : <><Upload size={14} /> Publier dans la galerie</>}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map(img => (
          <div key={img.id} className="relative group bg-[#141414] border border-white/5 rounded-sm overflow-hidden">
            <img src={`${BACKEND_URL}${img.url}`} alt={img.label} className="w-full aspect-video object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
              <button onClick={() => deleteImg(img.id)} className="self-end w-7 h-7 bg-red-500/80 hover:bg-red-500 rounded-sm flex items-center justify-center" data-testid={`delete-gallery-${img.id}`}>
                <Trash2 size={13} className="text-white" />
              </button>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#D4AF37]">{img.category}</span>
                <p className="text-white text-xs font-medium leading-snug">{img.label}</p>
              </div>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <div className="col-span-4 py-12 text-center border border-dashed border-white/10 rounded-sm">
            <p className="text-gray-500 text-sm">Aucune photo uploadée.</p>
          </div>
        )}
      </div>
    </div>
  );
}
