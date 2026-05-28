'use client';

interface CandidateFiltersProps {
  selectedDiscipline: string;
  onDisciplineChange: (discipline: string) => void;
}

const DISCIPLINES = ['Tous', 'Musique', 'Danse', 'Humour', 'Art_Oratoire', 'Digital', 'Cirque', 'Sport', 'Arts_Visuels'];

export default function CandidateFilters({ selectedDiscipline, onDisciplineChange }: CandidateFiltersProps) {
  return (
    <div className="border-b border-zinc-200/60 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-8 px-4 sm:px-6 lg:px-8 py-4">
        {DISCIPLINES.map((discipline) => (
          <button
            key={discipline}
            onClick={() => onDisciplineChange(discipline)}
            className={`font-mono text-[11px] uppercase tracking-widest transition-all whitespace-nowrap ${
              selectedDiscipline === discipline
                ? 'text-[#050505] font-bold border-b-2 border-[#050505] pb-4'
                : 'text-zinc-400 hover:text-zinc-600 pb-4'
            }`}
          >
            {discipline}
          </button>
        ))}
      </div>
    </div>
  );
}
