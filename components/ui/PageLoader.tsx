interface PageLoaderProps {
  text?: string;
}

export const PageLoader = ({ text = 'Chargement en cours...' }: PageLoaderProps) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        {/* Spinner SVG personnalisé doré */}
        <svg
          className="animate-spin"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
            stroke="#e5c47f"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.3"
          />
          <path
            d="M12 2C6.48 2 2 6.48 2 12"
            stroke="#e5c47f"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Barre de progression */}
        <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"
            style={{ width: '60%' }}
          />
        </div>

        {/* Texte de chargement */}
        <p className="text-sm font-medium text-gray-500 animate-pulse">{text}</p>
      </div>
    </div>
  );
};
