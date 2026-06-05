import { useEffect, useRef } from 'react';

/**
 * Hook pour implémenter le focus trap dans une modal
 * Empêche l'utilisateur de naviguer en dehors de la modal avec Tab/Shift+Tab
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus sur le premier élément focusable
    if (firstElement) {
      firstElement.focus();
    }

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // L'événement Escape peut être géré par le composant parent
        // On ne fait rien ici, le parent peut écouter l'événement
      }
    };

    container.addEventListener('keydown', handleTab);
    container.addEventListener('keydown', handleEscape);

    return () => {
      container.removeEventListener('keydown', handleTab);
      container.removeEventListener('keydown', handleEscape);
    };
  }, [isActive]);

  return containerRef;
}
