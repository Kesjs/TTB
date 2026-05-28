'use client';

interface RoleSimulatorProps {
  role?: string;
  onRoleChange?: (role: string) => void;
  currentRole?: string;
  setCurrentRole?: (role: string) => void;
}

export default function RoleSimulator({ role, onRoleChange, currentRole, setCurrentRole }: RoleSimulatorProps) {
  // SECURITY: Only render in development environment
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const activeRole = currentRole ?? role ?? 'Visiteur';
  const handleRoleChange = setCurrentRole ?? onRoleChange;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/85 p-1 text-[9px] shadow-sm backdrop-blur-xl">
        {['Visiteur', 'Jury', 'Administrateur'].map((item) => (
          <button
            key={item}
            onClick={() => handleRoleChange?.(item)}
            className={`h-7 min-w-7 rounded-full px-2 font-heading font-bold uppercase tracking-[0.18em] transition-all ${
              activeRole === item ? 'bg-slate-950 text-white' : 'text-slate-400 hover:text-slate-950'
            }`}
            aria-label={`Mode ${item}`}
          >
            {item === 'Visiteur' ? 'V' : item === 'Jury' ? 'J' : 'A'}
          </button>
        ))}
      </div>
    </div>
  );
}
