export type UserRole = 'mecanico' | 'vendedor';

export type StatusOS =
  | 'Aberta'
  | 'AguardandoCotar'
  | 'AguardandoCliente'
  | 'Fazendo'
  | 'TravadoPeca'
  | 'Pronto'
  | 'Entregue';

export type FormaPagamento = 'PIX' | 'Cartao' | 'Dinheiro';

export type OrigemPeca = 'estoque' | 'comprar';

export type MotivoSaida = 'avaria' | 'extravio';

export const STATUS_LABEL: Record<StatusOS, string> = {
  Aberta: 'Aberta',
  AguardandoCotar: 'Cotar / comprar',
  AguardandoCliente: 'Aguardando cliente',
  Fazendo: 'Fazendo',
  TravadoPeca: 'Travado',
  Pronto: 'Pronto',
  Entregue: 'Entregue',
};

export const STATUS_COR: Record<StatusOS, { badge: string; borda: string }> = {
  Aberta: { badge: 'bg-sky-100 text-sky-800', borda: 'border-l-sky-500' },
  AguardandoCotar: { badge: 'bg-amber-100 text-amber-800', borda: 'border-l-amber-500' },
  AguardandoCliente: { badge: 'bg-violet-100 text-violet-800', borda: 'border-l-violet-500' },
  Fazendo: { badge: 'bg-orange-100 text-orange-800', borda: 'border-l-orange-500' },
  TravadoPeca: { badge: 'bg-red-100 text-red-800', borda: 'border-l-red-500' },
  Pronto: { badge: 'bg-emerald-100 text-emerald-800', borda: 'border-l-emerald-500' },
  Entregue: { badge: 'bg-slate-100 text-slate-700', borda: 'border-l-slate-400' },
};

export const FORMA_LABEL: Record<FormaPagamento, string> = {
  PIX: 'PIX',
  Cartao: 'Cartão',
  Dinheiro: 'Dinheiro',
};

export const MOTIVOS_TRAVOU = ['Peça errada', 'Avaria', 'Peça faltando', 'Não encaixa', 'Outro'] as const;

export const QUEIXAS_RAPIDAS = [
  'Revisão preventiva',
  'Troca de óleo e filtros',
  'Freio / ruído',
  'Bateria / arranque',
  'Elétrica / farol',
  'Diagnóstico com scanner',
];

export const CORES_CARRO: { nome: string; hex: string }[] = [
  { nome: 'Branco', hex: '#F4F4F0' },
  { nome: 'Preto', hex: '#1A1A1A' },
  { nome: 'Prata', hex: '#C0C0C0' },
  { nome: 'Cinza', hex: '#7A7A7A' },
  { nome: 'Grafite', hex: '#4A4A4A' },
  { nome: 'Vermelho', hex: '#C41E3A' },
  { nome: 'Azul', hex: '#1E4B8A' },
  { nome: 'Verde', hex: '#2E6B3C' },
  { nome: 'Amarelo', hex: '#E2B007' },
  { nome: 'Marrom', hex: '#6B3E26' },
  { nome: 'Bege', hex: '#D8C3A5' },
  { nome: 'Laranja', hex: '#E05A00' },
  { nome: 'Vinho', hex: '#6B1C2A' },
  { nome: 'Rosa', hex: '#E8A0B0' },
  { nome: 'Dourado', hex: '#C6A664' },
];
