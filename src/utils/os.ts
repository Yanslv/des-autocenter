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

export function validarTravamento(itemId: string | null | undefined, observacao: string): string | null {
  if (!itemId) return 'Selecione a peça ou o serviço que travou';
  if (!observacao.trim()) return 'Informe por que travou';
  return null;
}

export function progressoChecklist(itens: Array<{ executado?: boolean | null }>): {
  feitos: number;
  total: number;
} {
  return {
    feitos: itens.filter((i) => i.executado).length,
    total: itens.length,
  };
}
