import type { StatusOS } from '../types';

type ItemCotar = {
  tipo: string;
  origem_peca: string | null;
  comprado?: boolean | null;
  valor_unitario: number;
};

export function osPodeEditarItens(status: StatusOS): boolean {
  return status !== 'Entregue';
}

export function osTemPecaParaCotar(itens: Array<{ tipo: string; origem_peca: string | null }>): boolean {
  return itens.some((i) => i.tipo === 'produto' && i.origem_peca === 'comprar');
}

export function osPodeSeguirCotar(itens: ItemCotar[]): boolean {
  const comprar = itens.filter((i) => i.tipo === 'produto' && i.origem_peca === 'comprar');
  if (comprar.length === 0) return true;
  return comprar.every((i) => i.comprado && Number(i.valor_unitario) > 0);
}
