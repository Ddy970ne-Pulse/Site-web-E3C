const stats = [
  { value: "10+", label: "Années d'expérience" },
  { value: "200+", label: "Chantiers réalisés" },
  { value: "100%", label: "Devis gratuit" },
  { value: "971", label: "Guadeloupe" },
];

export default function Stats() {
  return (
    <section
      data-testid="stats-section"
      className="relative bg-[#D4AF37] py-8 md:py-10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              data-testid={`stat-item-${i}`}
              className="flex flex-col items-center text-center"
            >
              <span className="font-outfit font-black text-3xl md:text-4xl text-black leading-tight">
                {stat.value}
              </span>
              <span className="text-xs md:text-sm font-semibold text-black/70 uppercase tracking-wider mt-1">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
