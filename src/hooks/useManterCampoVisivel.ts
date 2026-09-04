import { useEffect, useState } from 'react';
import { deslocamentoParaCampoVisivel, isCampoEditavel, tecladoEstaAberto } from '../utils/teclado';

function alturaViewport(): number {
  return window.visualViewport?.height ?? window.innerHeight;
}

function puxarCampoFocado() {
  const el = document.activeElement;
  if (!isCampoEditavel(el)) return;
  el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
  const delta = deslocamentoParaCampoVisivel(el.getBoundingClientRect(), {
    offsetTop: 0,
    height: alturaViewport(),
  });
  if (Math.abs(delta) < 2) return;
  window.scrollBy({ top: delta, behavior: 'auto' });
}

function definirEspacoTeclado(px: number) {
  document.documentElement.style.paddingBottom = px > 0 ? `${px}px` : '';
}

export function useManterCampoVisivel() {
  const [tecladoAberto, setTecladoAberto] = useState(false);

  useEffect(() => {
    let alturaRepouso = alturaViewport();

    const atualizar = () => {
      const atual = alturaViewport();
      if (!isCampoEditavel(document.activeElement)) {
        alturaRepouso = atual;
        definirEspacoTeclado(0);
        setTecladoAberto(false);
        return;
      }
      const overlay = Math.max(0, window.innerHeight - atual);
      const aberto =
        tecladoEstaAberto(atual, alturaRepouso) || tecladoEstaAberto(atual, window.innerHeight);
      definirEspacoTeclado(overlay);
      setTecladoAberto(aberto);
      puxarCampoFocado();
    };

    const noFoco = () => {
      requestAnimationFrame(atualizar);
      if (!window.visualViewport) window.setTimeout(atualizar, 300);
    };

    const noFocoOut = () => {
      window.setTimeout(atualizar, 0);
    };

    document.addEventListener('focusin', noFoco);
    document.addEventListener('focusout', noFocoOut);
    window.addEventListener('resize', atualizar);
    window.visualViewport?.addEventListener('resize', atualizar);

    return () => {
      definirEspacoTeclado(0);
      document.removeEventListener('focusin', noFoco);
      document.removeEventListener('focusout', noFocoOut);
      window.removeEventListener('resize', atualizar);
      window.visualViewport?.removeEventListener('resize', atualizar);
    };
  }, []);

  return tecladoAberto;
}
