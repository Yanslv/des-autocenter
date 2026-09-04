export type OrdemCaixa = {
  id: string;
  status: string;
  data_entrega: string | null;
  valor_pago: number | null;
  valor_total: number;
  numero_os: number;
  cliente_id: string;
  forma_pagamento: string | null;
};

export type VendaCaixa = {
  id: string;
  data_venda: string;
  valor_total: number;
  numero_venda: number;
  cliente_id: string | null;
  forma_pagamento: string;
};

export type CaixaResumo = {
  total: number;
  qtd: number;
  osIds: string[];
  vendaIds: string[];
  totalOs: number;
  totalBalcao: number;
  qtdOs: number;
  qtdBalcao: number;
};

export type Lancamento = {
  id: string;
  tipo: 'os' | 'balcao';
  data: string;
  valor: number;
  rotulo: string;
  forma: string | null;
  osId?: string;
};

export function mesmoDia(iso: string, ymd: string) {
  return iso.slice(0, 10) === ymd;
}

export function mesmoMes(iso: string, ymd: string) {
  return iso.slice(0, 7) === ymd.slice(0, 7);
}

export function ymdMaisDias(ymd: string, dias: number) {
  const d = new Date(`${ymd}T12:00:00`);
  d.setDate(d.getDate() + dias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function mesAtualLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function deslocarMes(ym: string, delta: number) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function rotuloMes(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const nome = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

export function osDoPeriodo(ordens: OrdemCaixa[], pred: (iso: string) => boolean) {
  return ordens.filter((o) => o.status === 'Entregue' && o.data_entrega && pred(o.data_entrega));
}

export function vendasDoPeriodo(vendas: VendaCaixa[], pred: (iso: string) => boolean) {
  return vendas.filter((v) => pred(v.data_venda));
}

export function valorOs(o: OrdemCaixa) {
  return Number(o.valor_pago ?? o.valor_total);
}

export function somarCaixa(
  vendas: VendaCaixa[],
  ordens: OrdemCaixa[],
  pred: (iso: string) => boolean
): CaixaResumo {
  const balcao = vendasDoPeriodo(vendas, pred);
  const osEntregues = osDoPeriodo(ordens, pred);
  const totalBalcao = balcao.reduce((s, v) => s + Number(v.valor_total), 0);
  const totalOs = osEntregues.reduce((s, o) => s + valorOs(o), 0);
  return {
    total: totalBalcao + totalOs,
    qtd: balcao.length + osEntregues.length,
    osIds: osEntregues.map((o) => o.id),
    vendaIds: balcao.map((v) => v.id),
    totalOs,
    totalBalcao,
    qtdOs: osEntregues.length,
    qtdBalcao: balcao.length,
  };
}

export function custoMateriais(
  osIds: string[],
  vendaIds: string[],
  itens: { os_id: string; tipo: string; produto_id: string | null; quantidade: number }[],
  vendaItens: { venda_id: string; produto_id: string; quantidade: number }[],
  produtos: { id: string; custo: number }[]
) {
  const osSet = new Set(osIds);
  const vendaSet = new Set(vendaIds);
  const custos = new Map(produtos.map((p) => [p.id, Number(p.custo)]));
  const deProduto = (id: string, qtd: number) => (custos.get(id) ?? 0) * Number(qtd);
  const os = itens
    .filter((i) => i.tipo === 'produto' && i.produto_id && osSet.has(i.os_id))
    .reduce((s, i) => s + deProduto(i.produto_id as string, i.quantidade), 0);
  const ven = vendaItens
    .filter((i) => vendaSet.has(i.venda_id))
    .reduce((s, i) => s + deProduto(i.produto_id, i.quantidade), 0);
  return os + ven;
}

export function dreDoCaixa(receita: number, materiais: number) {
  const lucroBruto = receita - materiais;
  return {
    receita,
    materiais,
    lucroBruto,
    margem: receita > 0 ? (lucroBruto / receita) * 100 : 0,
  };
}

export function variacaoPct(atual: number, anterior: number) {
  if (anterior === 0) return atual === 0 ? 0 : null;
  return ((atual - anterior) / anterior) * 100;
}

export function formatDelta(pct: number | null) {
  if (pct === null) return '—';
  const abs = Math.abs(pct).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  if (pct > 0) return `+${abs}%`;
  if (pct < 0) return `-${abs}%`;
  return '0%';
}

export function lancamentosDoPeriodo(
  vendas: VendaCaixa[],
  ordens: OrdemCaixa[],
  pred: (iso: string) => boolean
): Lancamento[] {
  const os = osDoPeriodo(ordens, pred).map((o) => ({
    id: o.id,
    tipo: 'os' as const,
    data: o.data_entrega as string,
    valor: valorOs(o),
    rotulo: `OS-${o.numero_os}`,
    forma: o.forma_pagamento,
    osId: o.id,
  }));
  const balcao = vendasDoPeriodo(vendas, pred).map((v) => ({
    id: v.id,
    tipo: 'balcao' as const,
    data: v.data_venda,
    valor: Number(v.valor_total),
    rotulo: `Balcão #${v.numero_venda}`,
    forma: v.forma_pagamento,
  }));
  return [...os, ...balcao].sort((a, b) => b.data.localeCompare(a.data));
}

export function somarPorForma(lancamentos: Lancamento[]) {
  const acc = new Map<string, number>();
  for (const l of lancamentos) {
    const chave = l.forma || '—';
    acc.set(chave, (acc.get(chave) ?? 0) + l.valor);
  }
  return [...acc.entries()]
    .map(([forma, valor]) => ({ forma, valor }))
    .sort((a, b) => b.valor - a.valor);
}

const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'] as const;

export type GrupoDia = {
  dia: string;
  rotulo: string;
  total: number;
  itens: Lancamento[];
};

export function nomeDiaSemana(ymd: string) {
  return DIAS_SEMANA[new Date(`${ymd}T12:00:00`).getDay()];
}

export function rotuloDiaGrupo(ymd: string) {
  const [, mes, dia] = ymd.split('-');
  const nome = nomeDiaSemana(ymd);
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} · ${dia}/${mes}`;
}

export function agruparLancamentosPorDia(lancamentos: Lancamento[]): GrupoDia[] {
  const grupos = new Map<string, Lancamento[]>();
  for (const l of lancamentos) {
    const dia = l.data.slice(0, 10);
    const lista = grupos.get(dia);
    if (lista) lista.push(l);
    else grupos.set(dia, [l]);
  }
  return [...grupos.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dia, itens]) => ({
      dia,
      rotulo: rotuloDiaGrupo(dia),
      total: itens.reduce((s, i) => s + i.valor, 0),
      itens,
    }));
}
