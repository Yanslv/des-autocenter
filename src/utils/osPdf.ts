import { STATUS_LABEL, type StatusOS } from '../types';
import { montarOrcamentoPdfModelo, type OrcamentoPdfModelo } from './orcamentoPdf';

export type OsPdfInput = {
  oficinaNome: string;
  oficinaSegmento?: string | null;
  oficinaWhatsapp: string;
  oficinaEmail?: string | null;
  oficinaCnpj?: string | null;
  oficinaEndereco?: string | null;
  numeroOs: number;
  status: StatusOS;
  dataAbertura: string;
  previsao?: string | null;
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
  placa?: string | null;
  modelo?: string | null;
  marca?: string | null;
  versao?: string | null;
  ano?: number | null;
  anoModelo?: number | null;
  cor?: string | null;
  km?: number | null;
  problema: string;
  itens: Array<{
    tipo: string;
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
  }>;
};

export function montarOsPdfModelo(data: OsPdfInput): OrcamentoPdfModelo {
  return montarOrcamentoPdfModelo({
    oficinaNome: data.oficinaNome,
    oficinaSegmento: data.oficinaSegmento,
    oficinaWhatsapp: data.oficinaWhatsapp,
    oficinaEmail: data.oficinaEmail,
    oficinaEndereco: data.oficinaEndereco,
    oficinaCnpj: data.oficinaCnpj,
    numero: data.numeroOs,
    dataEmissao: data.dataAbertura,
    validadeDias: 0,
    validadeTexto: STATUS_LABEL[data.status],
    tituloDocumento: 'Ordem de Serviço',
    rotuloTotal: 'Total da ordem de serviço',
    rotuloAprovacao: 'Aprovação da ordem de serviço',
    textoAprovacao:
      'Declaro estar de acordo com os serviços, peças, valores e condições descritos nesta ordem de serviço.',
    rotuloCondicao3: 'Status',
    clienteTipo: data.clienteTipo,
    clienteNome: data.clienteNome,
    clienteNomeFantasia: data.clienteNomeFantasia,
    clienteDocumento: data.clienteDocumento,
    clienteResponsavel: data.clienteResponsavel,
    clienteCpfResponsavel: data.clienteCpfResponsavel,
    clienteTelefone: data.clienteTelefone,
    clienteEmail: data.clienteEmail,
    clienteEndereco: data.clienteEndereco,
    clienteNumero: data.clienteNumero,
    clienteComplemento: data.clienteComplemento,
    clienteBairro: data.clienteBairro,
    clienteCidade: data.clienteCidade,
    clienteUf: data.clienteUf,
    clienteCep: data.clienteCep,
    marca: data.marca,
    modelo: data.modelo,
    versao: data.versao,
    ano: data.ano,
    anoModelo: data.anoModelo,
    placa: data.placa,
    cor: data.cor,
    km: data.km,
    itens: data.itens,
    desconto: 0,
    previsao: data.previsao,
    observacao: data.problema,
  });
}

export function mensagemWhatsAppOs(input: {
  clienteNome: string;
  numeroOs: number;
  status: StatusOS;
  total: number;
  placa?: string | null;
}): string {
  const nome = input.clienteNome.split(' ')[0] || 'cliente';
  const carro = input.placa ? ` (${input.placa})` : '';
  if (input.status === 'AguardandoCliente' || input.status === 'AguardandoCotar') {
    return `Olá, ${nome}! Segue a OS-${input.numeroOs}${carro} da oficina. Valor: R$ ${input.total.toFixed(2)}. Por favor confirme para darmos andamento.`;
  }
  if (input.status === 'Pronto') {
    return `Olá, ${nome}! A OS-${input.numeroOs}${carro} está pronta para retirada. Valor: R$ ${input.total.toFixed(2)}.`;
  }
  if (input.status === 'Entregue') {
    return `Olá, ${nome}! Obrigado pela confiança. Qualquer coisa na OS-${input.numeroOs}, estamos à disposição.`;
  }
  return `Olá, ${nome}! Atualização da OS-${input.numeroOs}${carro}: ${STATUS_LABEL[input.status]}.`;
}

export function numeroWhatsApp(telefone: string): string | null {
  const digits = telefone.replace(/\D/g, '');
  if (!digits) return null;
  return digits.startsWith('55') ? digits : `55${digits}`;
}

export function urlWhatsApp(telefone: string, texto: string): string | null {
  const fone = numeroWhatsApp(telefone);
  if (!fone) return null;
  return `https://wa.me/${fone}?text=${encodeURIComponent(texto)}`;
}

function ehPwaCelular() {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && Boolean((navigator as { standalone?: boolean }).standalone));
  return standalone && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function abrirUrlExterna(url: string) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function abrirWhatsApp(telefone: string, texto: string) {
  const fone = numeroWhatsApp(telefone);
  const httpsUrl = urlWhatsApp(telefone, texto);
  if (!fone || !httpsUrl) return;
  if (ehPwaCelular()) {
    window.location.href = `whatsapp://send?phone=${fone}&text=${encodeURIComponent(texto)}`;
    return;
  }
  abrirUrlExterna(httpsUrl);
}

export function baixarOsPdf(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function compartilharArquivo(file: File) {
  const dados: ShareData = { title: file.name, files: [file] };
  const podeCompartilhar =
    typeof navigator.share === 'function' &&
    (typeof navigator.canShare !== 'function' || navigator.canShare(dados));
  if (!podeCompartilhar) {
    baixarOsPdf(file);
    return;
  }
  try {
    await navigator.share(dados);
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === 'AbortError') return;
    baixarOsPdf(file);
  }
}
