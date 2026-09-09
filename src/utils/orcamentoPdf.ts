import { formatDateBR } from './dateUtils';
import { formatBRL, maskKmInput, maskPlaca } from './formatters';
import {
  calcularTotaisOrcamento,
  dataValidadeOrcamento,
  formatarNumeroOrcamento,
  montarEnderecoCliente,
  resumoVeiculoOrcamento,
  TEXTO_APROVACAO,
} from './orcamento';

export type ItemOrcamentoPdf = {
  tipo: string;
  descricao: string;
  detalhe?: string | null;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
};

export type OrcamentoPdfInput = {
  oficinaNome: string;
  oficinaSegmento?: string | null;
  oficinaWhatsapp: string;
  oficinaEmail?: string | null;
  oficinaEndereco?: string | null;
  oficinaCnpj?: string | null;
  numero: number;
  dataEmissao: string;
  validadeDias: number;
  clienteTipo?: string | null;
  clienteNome: string;
  clienteNomeFantasia?: string | null;
  clienteDocumento?: string | null;
  clienteResponsavel?: string | null;
  clienteCpfResponsavel?: string | null;
  clienteTelefone?: string | null;
  clienteEmail?: string | null;
  clienteEndereco?: string | null;
  clienteNumero?: string | null;
  clienteComplemento?: string | null;
  clienteBairro?: string | null;
  clienteCidade?: string | null;
  clienteUf?: string | null;
  clienteCep?: string | null;
  marca?: string | null;
  modelo?: string | null;
  versao?: string | null;
  ano?: number | null;
  anoModelo?: number | null;
  placa?: string | null;
  cor?: string | null;
  km?: number | null;
  itens: ItemOrcamentoPdf[];
  desconto: number;
  prazoEstimadoDias?: number | null;
  previsao?: string | null;
  observacao?: string | null;
  aprovadoNome?: string | null;
  aprovadoEm?: string | null;
  tituloDocumento?: string;
  rotuloTotal?: string;
  rotuloAprovacao?: string;
  textoAprovacao?: string;
  rotuloCondicao3?: string;
  validadeTexto?: string;
};

export type LinhaServicoPdf = {
  nome: string;
  descricao: string;
  qtd: string;
  valor: string;
};

export type LinhaPecaPdf = {
  item: string;
  descricao: string;
  qtd: string;
  unitario: string;
  total: string;
};

export type OrcamentoPdfModelo = {
  oficinaNome: string;
  oficinaSegmento: string;
  oficinaWhatsapp: string;
  oficinaEmail: string;
  oficinaEndereco: string;
  oficinaCnpj: string;
  numero: string;
  data: string;
  validadeTexto: string;
  tituloDocumento: string;
  rotuloTotal: string;
  rotuloAprovacao: string;
  textoAprovacao: string;
  rotuloCondicao3: string;
  ehPj: boolean;
  clienteNome: string;
  clienteDocumento: string;
  clienteTelefone: string;
  clienteEmail: string;
  clienteEndereco: string;
  clienteNomeFantasia: string;
  clienteResponsavel: string;
  clienteCpfResponsavel: string;
  veiculoTitulo: string;
  veiculoPlaca: string;
  veiculoKm: string;
  veiculoCor: string;
  veiculoAno: string;
  veiculoAnoModelo: string;
  servicos: LinhaServicoPdf[];
  pecas: LinhaPecaPdf[];
  totalServicos: string;
  totalPecas: string;
  resumoServicos: string;
  resumoPecas: string;
  resumoTerceiros: string;
  resumoSubtotal: string;
  resumoDesconto: string;
  temDesconto: boolean;
  total: string;
  prazoEstimado: string;
  previsaoEntrega: string;
  observacao: string;
  aprovacaoNome: string;
};

export function montarOrcamentoPdfModelo(data: OrcamentoPdfInput): OrcamentoPdfModelo {
  const totais = calcularTotaisOrcamento(data.itens, data.desconto);
  const veiculo = resumoVeiculoOrcamento({
    marca: data.marca,
    modelo: data.modelo,
    versao: data.versao,
    placa: data.placa,
    cor: data.cor,
    km: data.km,
  });
  const validadeFim = formatDateBR(dataValidadeOrcamento(data.dataEmissao, data.validadeDias));
  const servicos = data.itens.filter((i) => i.tipo === 'servico');
  const pecas = data.itens.filter((i) => i.tipo === 'produto');
  return {
    oficinaNome: data.oficinaNome || 'Oficina',
    oficinaSegmento: data.oficinaSegmento || '',
    oficinaWhatsapp: data.oficinaWhatsapp || '',
    oficinaEmail: data.oficinaEmail || '',
    oficinaEndereco: data.oficinaEndereco || '',
    oficinaCnpj: data.oficinaCnpj || '',
    numero: formatarNumeroOrcamento(data.numero),
    data: formatDateBR(data.dataEmissao),
    validadeTexto: data.validadeTexto || `${data.validadeDias} dias (até ${validadeFim})`,
    tituloDocumento: data.tituloDocumento || 'Orçamento',
    rotuloTotal: data.rotuloTotal || 'Total do orçamento',
    rotuloAprovacao: data.rotuloAprovacao || 'Aprovação do orçamento',
    textoAprovacao: data.textoAprovacao || TEXTO_APROVACAO,
    rotuloCondicao3: data.rotuloCondicao3 || 'Validade do orçamento',
    ehPj: data.clienteTipo === 'pj',
    clienteNome: data.clienteNome || '',
    clienteDocumento: data.clienteDocumento || '',
    clienteTelefone: data.clienteTelefone || '',
    clienteEmail: data.clienteEmail || '',
    clienteEndereco: montarEnderecoCliente({
      endereco: data.clienteEndereco,
      endereco_numero: data.clienteNumero,
      complemento: data.clienteComplemento,
      bairro: data.clienteBairro,
      cidade: data.clienteCidade,
      uf: data.clienteUf,
      cep: data.clienteCep,
    }),
    clienteNomeFantasia: data.clienteNomeFantasia || '',
    clienteResponsavel: data.clienteResponsavel || '',
    clienteCpfResponsavel: data.clienteCpfResponsavel || '',
    veiculoTitulo: veiculo.titulo,
    veiculoPlaca: data.placa ? maskPlaca(data.placa) : '',
    veiculoKm: data.km != null ? `${maskKmInput(String(data.km))} km` : '',
    veiculoCor: data.cor || '',
    veiculoAno: data.ano ? String(data.ano) : '',
    veiculoAnoModelo: data.anoModelo ? String(data.anoModelo) : '',
    servicos: servicos.map((i) => ({
      nome: i.descricao,
      descricao: i.detalhe || '',
      qtd: String(i.quantidade),
      valor: formatBRL(Number(i.valor_total)),
    })),
    pecas: pecas.map((i, idx) => ({
      item: String(idx + 1).padStart(2, '0'),
      descricao: i.descricao,
      qtd: String(i.quantidade),
      unitario: formatBRL(Number(i.valor_unitario)),
      total: formatBRL(Number(i.valor_total)),
    })),
    totalServicos: formatBRL(totais.totalServicos),
    totalPecas: formatBRL(totais.totalPecas),
    resumoServicos: formatBRL(totais.totalServicos),
    resumoPecas: formatBRL(totais.totalPecas),
    resumoTerceiros: formatBRL(totais.totalTerceiros),
    resumoSubtotal: formatBRL(totais.subtotal),
    resumoDesconto: `-${formatBRL(totais.desconto)}`,
    temDesconto: totais.desconto > 0,
    total: formatBRL(totais.total),
    prazoEstimado:
      data.prazoEstimadoDias != null ? `${data.prazoEstimadoDias} dia${data.prazoEstimadoDias === 1 ? '' : 's'}` : '',
    previsaoEntrega: data.previsao ? formatDateBR(data.previsao) : '',
    observacao: data.observacao || '',
    aprovacaoNome: data.aprovadoNome || '',
  };
}

export type BlocoPdf = { top: number; bottom: number };

export const MARGEM_PDF_MM = 13;
export const A4_MM = { w: 210, h: 297 };

export function areaUtilPdfMm() {
  return {
    x: MARGEM_PDF_MM,
    y: MARGEM_PDF_MM,
    w: A4_MM.w - MARGEM_PDF_MM * 2,
    h: A4_MM.h - MARGEM_PDF_MM * 2,
  };
}

export function alturaUtilPdfPx(larguraPx: number) {
  const area = areaUtilPdfMm();
  return larguraPx * (area.h / area.w);
}

export function definirCortesPdf(blocos: BlocoPdf[], pageH: number, totalH: number): { y: number; h: number }[] {
  const paginas: { y: number; h: number }[] = [];
  let inicio = 0;

  const fechar = (fim: number) => {
    const corte = Math.min(Math.max(fim, inicio), totalH);
    const h = corte - inicio;
    if (h <= 0) return;
    paginas.push({ y: inicio, h });
    inicio = corte;
  };

  for (const bloco of blocos) {
    if (bloco.bottom <= inicio + pageH) continue;
    if (bloco.top > inicio) fechar(bloco.top);
    while (bloco.bottom > inicio + pageH && inicio < totalH) {
      fechar(inicio + pageH);
    }
  }
  if (inicio < totalH) fechar(totalH);
  return paginas;
}

export function fatiasCanvas(
  paginas: { y: number; h: number }[],
  scale: number,
  canvasHeight: number
): { sy: number; sh: number }[] {
  return paginas.map((pagina, idx) => {
    const sy = Math.round(pagina.y * scale);
    const syFim = idx === paginas.length - 1 ? canvasHeight : Math.round((pagina.y + pagina.h) * scale);
    return { sy, sh: Math.max(1, syFim - sy) };
  });
}
