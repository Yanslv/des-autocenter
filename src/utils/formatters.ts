export function maskKmInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 7);
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseKm(masked: string): number | null {
  const digits = masked.replace(/\D/g, '');
  if (!digits) return null;
  return Number(digits);
}

export function maskPlaca(raw: string): string {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  if (s.length <= 3) return s;
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}

export function placaNormalizada(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function placaValida(raw: string): boolean {
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placaNormalizada(raw));
}

export function formatBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function maskMoedaInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '').slice(0, 9);
  if (!digits) return '';
  const padded = digits.padStart(3, '0');
  const intPart = padded.slice(0, -2).replace(/^0+(?=\d)/, '');
  const decPart = padded.slice(-2);
  return `${intPart}.${decPart}`;
}

export function parseMoeda(masked: string): number {
  if (!masked.trim()) return 0;
  const n = Number(masked.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function formatMoedaInput(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '';
  return n.toFixed(2);
}

export function maskInteiroInput(raw: string): string {
  return raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
}

export function parseInteiro(masked: string): number {
  if (!masked.trim()) return 0;
  const n = Number(masked);
  return Number.isFinite(n) ? n : 0;
}

export function percentualMargem(precoVenda: number, custo: number): number | null {
  if (precoVenda <= 0) return null;
  return Math.round(((precoVenda - custo) / precoVenda) * 100);
}

export function resumoEstoque(
  produtos: Array<{ custo: number; quantidade_estoque: number }>
): { valorCusto: number; quantidadeItens: number } {
  return produtos.reduce(
    (acc, p) => ({
      valorCusto: acc.valorCusto + Number(p.custo) * Number(p.quantidade_estoque),
      quantidadeItens: acc.quantidadeItens + Number(p.quantidade_estoque),
    }),
    { valorCusto: 0, quantidadeItens: 0 }
  );
}

export function saldoLivre(p: { quantidade_estoque: number; quantidade_reservada: number }): number {
  return Math.max(0, p.quantidade_estoque - p.quantidade_reservada);
}

export function rotuloEstoque(p: {
  eh_caixa: boolean;
  unidades_por_caixa: number;
  quantidade_estoque: number;
  quantidade_reservada: number;
}): string {
  const un = saldoLivre(p);
  if (!p.eh_caixa || p.unidades_por_caixa < 2) return `${un} un`;
  const cx = Math.floor(un / p.unidades_por_caixa);
  return `${cx} cx / ${un} un`;
}

export function unidadesDoPedido(
  p: { eh_caixa: boolean; unidades_por_caixa: number },
  ehCaixa: boolean,
  quantidade: number
): number {
  if (ehCaixa && p.eh_caixa) return quantidade * p.unidades_por_caixa;
  return quantidade;
}
