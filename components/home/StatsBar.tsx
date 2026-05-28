export default function StatsBar() {
  const stats = ['12 Départements', 'Toutes Disciplines', 'Candidature Ouverte', 'Édition 2026'];

  return (
    <section className="bg-white text-zinc-900 px-4 sm:px-6 py-6 sm:py-5 border-b border-zinc-100">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <div key={stat} className="text-center lg:text-left">
            <span className="font-heading text-[9px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-zinc-600">
              {stat}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
