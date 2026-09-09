import { maskKmInput, maskPlaca } from './formatters';

export type TipoClienteOrcamento = 'pf' | 'pj';
export type StatusOrcamento = 'rascunho' | 'enviado' | 'aprovado' | 'recusado' | 'vencido';
export type TipoItemOrcamento = 'servico' | 'produto' | 'terceiro';
export type TipoDescontoOrcamento = 'valor' | 'percentual';

export type ItemOrcamentoCalculo = {
  tipo: string;
  valor_total: number;
};

export type TotaisOrcamento = {
  totalServicos: number;
  totalPecas: number;
  totalTerceiros: number;
  subtotal: number;
  desconto: number;
  total: number;
};

export const OBSERVACAO_PADRAO =
  'Peças, materiais ou serviços adicionais não previstos neste orçamento somente serão realizados mediante aprovação do cliente.';

export const TEXTO_APROVACAO =
  'Declaro estar de acordo com os serviços, peças, valores e condições descritos neste orçamento.';

export const SERVICOS_ORCAMENTO = [
  { nome: 'Polimento técnico', detalhe: 'Correção de riscos leves e recuperação do brilho da pintura.' },
  { nome: 'Higienização interna', detalhe: 'Limpeza profunda dos bancos, carpetes e acabamento interno.' },
  { nome: 'Vitrificação', detalhe: 'Proteção da pintura com acabamento de alto brilho.' },
  { nome: 'Cristalização', detalhe: 'Proteção e revitalização da pintura.' },
  { nome: 'Lavagem técnica', detalhe: 'Lavagem detalhada da lataria, rodas e acabamentos.' },
  { nome: 'Revitalização de plásticos', detalhe: 'Recuperação da cor e proteção das peças plásticas.' },
];

export const STATUS_ORCAMENTO_LABEL: Record<StatusOrcamento, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  vencido: 'Vencido',
};

export const STATUS_ORCAMENTO_COR: Record<StatusOrcamento, { badge: string; borda: string }> = {
  rascunho: { badge: 'bg-slate-100 text-slate-700', borda: 'border-l-slate-400' },
  enviado: { badge: 'bg-violet-100 text-violet-800', borda: 'border-l-violet-500' },
  aprovado: { badge: 'bg-emerald-100 text-emerald-800', borda: 'border-l-emerald-500' },
  recusado: { badge: 'bg-red-100 text-red-800', borda: 'border-l-red-500' },
  vencido: { badge: 'bg-amber-100 text-amber-800', borda: 'border-l-amber-500' },
};

export function calcularTotaisOrcamento(
  itens: ItemOrcamentoCalculo[],
  desconto: number,
  tipoDesconto: TipoDescontoOrcamento = 'valor'
): TotaisOrcamento {
  const totalServicos = somarTipo(itens, 'servico');
  const totalPecas = somarTipo(itens, 'produto');
  const totalTerceiros = somarTipo(itens, 'terceiro');
  const subtotal = totalServicos + totalPecas + totalTerceiros;
  const descontoBruto = tipoDesconto === 'percentual' ? (subtotal * desconto) / 100 : desconto;
  const descontoAplicado = Math.min(Math.max(0, descontoBruto), subtotal);
  return {
    totalServicos,
    totalPecas,
    totalTerceiros,
    subtotal,
    desconto: descontoAplicado,
    total: subtotal - descontoAplicado,
  };
}

function somarTipo(itens: ItemOrcamentoCalculo[], tipo: TipoItemOrcamento) {
  return itens.filter((i) => i.tipo === tipo).reduce((s, i) => s + Number(i.valor_total || 0), 0);
}

export function formatarNumeroOrcamento(n: number): string {
  return String(n).padStart(6, '0');
}

export function resumoVeiculoOrcamento(v: {
  marca?: string | null;
  modelo?: string | null;
  versao?: string | null;
  placa?: string | null;
  cor?: string | null;
  km?: number | null;
}): { titulo: string; detalhe: string } {
  const titulo = [v.marca, v.modelo, v.versao].filter(Boolean).join(' ') || 'Veículo do orçamento';
  const detalhe = [
    v.placa ? maskPlaca(v.placa) : '',
    v.km != null ? `${maskKmInput(String(v.km))} km` : '',
    v.cor || '',
  ]
    .filter(Boolean)
    .join(' • ');
  return { titulo, detalhe };
}

export function montarEnderecoCliente(c: {
  endereco?: string | null;
  endereco_numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
}): string {
  const rua = [c.endereco, c.endereco_numero, c.complemento].filter(Boolean).join(', ');
  const cidadeUf = [c.cidade, c.uf].filter(Boolean).join('/');
  const local = [c.bairro, cidadeUf].filter(Boolean).join(', ');
  const cep = c.cep ? `CEP ${c.cep}` : '';
  return [rua, local, cep].filter(Boolean).join(' — ');
}

export function podeGerarOS(status: StatusOrcamento, osId?: string | null): boolean {
  return status === 'aprovado' && !osId;
}

export function podeAprovarOrcamento(status: StatusOrcamento): boolean {
  return status === 'rascunho' || status === 'enviado';
}

export function podeReabrirOrcamento(status: StatusOrcamento): boolean {
  return status === 'recusado';
}

export function orcamentoCombinaBusca(
  termo: string,
  clienteNome?: string | null,
  veiculo?: { placa?: string | null; marca?: string | null; modelo?: string | null } | null
): boolean {
  const t = termo.trim().toLowerCase();
  if (!t) return true;
  const placa = (veiculo?.placa || '').toLowerCase();
  const placaLimpa = placa.replace(/[^a-z0-9]/g, '');
  const termoLimpo = t.replace(/[^a-z0-9]/g, '');
  return (
    (clienteNome || '').toLowerCase().includes(t) ||
    placa.includes(t) ||
    (termoLimpo.length > 0 && placaLimpa.includes(termoLimpo)) ||
    (veiculo?.marca || '').toLowerCase().includes(t) ||
    (veiculo?.modelo || '').toLowerCase().includes(t)
  );
}

export function dataValidadeOrcamento(emissaoIso: string, validadeDias: number): string {
  const base = emissaoIso.slice(0, 10);
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + validadeDias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function statusOrcamentoEfetivo(
  status: StatusOrcamento,
  validadeDias: number,
  emissaoIso: string,
  hoje: Date = new Date()
): StatusOrcamento {
  if (status !== 'enviado') return status;
  const limite = dataValidadeOrcamento(emissaoIso, validadeDias);
  const hojeYmd = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  return hojeYmd > limite ? 'vencido' : status;
}

export function mensagemWhatsAppOrcamento(input: {
  clienteNome: string;
  numero: number;
  total: number;
  placa?: string | null;
}): string {
  const nome = input.clienteNome.split(' ')[0] || 'cliente';
  const carro = input.placa ? ` (${maskPlaca(input.placa)})` : '';
  return `Olá, ${nome}! Segue o orçamento ${formatarNumeroOrcamento(input.numero)}${carro}. Valor: R$ ${input.total.toFixed(2)}. Se estiver de acordo, nos avise para darmos andamento.`;
}
