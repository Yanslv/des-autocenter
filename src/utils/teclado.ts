const MARGEM = 24;
const LIMIAR_TECLADO = 120;

export function isCampoEditavel(el: EventTarget | null): el is HTMLElement {
  return (
    el instanceof HTMLElement &&
    el.matches(
      'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"]):not([type="color"]), textarea, select',
    )
  );
}

export function tecladoEstaAberto(alturaAtual: number, alturaRepouso: number): boolean {
  return alturaRepouso - alturaAtual > LIMIAR_TECLADO;
}

export function deslocamentoParaCampoVisivel(
  campo: { top: number; bottom: number },
  viewport: { offsetTop: number; height: number },
  margem = MARGEM,
): number {
  const topo = viewport.offsetTop + margem;
  const base = viewport.offsetTop + viewport.height - margem;
  if (campo.bottom > base) return campo.bottom - base;
  if (campo.top < topo) return campo.top - topo;
  return 0;
}
