import { useEffect } from 'react';

/**
 * Impede o scroll da página por detrás de modais/drawers no mobile.
 * Sem isto, no iOS Safari um gesto de swipe sobre o overlay "vaza"
 * e faz a página de fundo deslizar junto com o modal.
 */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const { overflow: htmlOverflow } = document.documentElement.style;
    const { overflow: bodyOverflow } = document.body.style;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, [locked]);
}
