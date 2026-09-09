import { jsPDF } from 'jspdf';
import { STATUS_LABEL, type StatusOS } from '../types';
import { formatDateBR } from './dateUtils';

type PdfInput = {
  oficinaNome: string;
  oficinaWhatsapp: string;
  oficinaCnpj?: string | null;
  oficinaEndereco?: string | null;
  numeroOs: number;
  status: StatusOS;
  dataAbertura: string;
  previsao?: string | null;
  clienteNome: string;
  clienteTelefone?: string | null;
  placa?: string | null;
  modelo?: string | null;
  marca?: string | null;
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

export function gerarOsClientePdf(data: PdfInput) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 14;
  const width = 182;
  let y = 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(data.oficinaNome || 'Oficina', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const contato = [data.oficinaWhatsapp && `WhatsApp ${data.oficinaWhatsapp}`, data.oficinaCnpj]
    .filter(Boolean)
    .join('  •  ');
  if (contato) {
    doc.text(contato, margin, y);
    y += 5;
  }
  if (data.oficinaEndereco) {
    doc.text(data.oficinaEndereco, margin, y);
    y += 5;
  }

  y += 2;
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + width, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`ORDEM DE SERVIÇO OS-${data.numeroOs}`, margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Aberta em ${formatDateBR(data.dataAbertura)}   •   ${STATUS_LABEL[data.status]}`, margin, y);
  if (data.previsao) {
    y += 5;
    doc.text(`Previsão de entrega: ${formatDateBR(data.previsao)}`, margin, y);
  }
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Cliente', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(data.clienteNome, margin, y);
  y += 5;
  doc.text(data.clienteTelefone ? `Telefone: ${data.clienteTelefone}` : 'Telefone: não informado', margin, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Veículo', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  const carro = [
    data.placa || 'sem placa',
    [data.marca, data.modelo].filter(Boolean).join(' '),
    data.cor && `cor ${data.cor}`,
    data.km != null && `${String(data.km).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} km`,
  ]
    .filter(Boolean)
    .join('  •  ');
  doc.text(carro || '—', margin, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Serviço / queixa', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  const queixa = doc.splitTextToSize(data.problema || '—', width);
  doc.text(queixa, margin, y);
  y += queixa.length * 4.5 + 4;

  doc.setFont('helvetica', 'bold');
  doc.text('Peças e mão de obra', margin, y);
  y += 6;

  const pecas = data.itens.filter((i) => i.tipo === 'produto');
  const servicos = data.itens.filter((i) => i.tipo === 'servico');
  const bloco = (titulo: string, lista: typeof data.itens) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(titulo, margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    if (lista.length === 0) {
      doc.text('—', margin, y);
      y += 6;
      return;
    }
    lista.forEach((it) => {
      if (y > 270) {
        doc.addPage();
        y = 16;
      }
      const linha = `${it.quantidade}x ${it.descricao}`;
      doc.text(linha.substring(0, 70), margin, y);
      doc.text(`R$ ${Number(it.valor_total).toFixed(2)}`, margin + width, y, { align: 'right' });
      y += 5;
    });
    y += 2;
  };

  bloco('Peças', pecas);
  bloco('Mão de obra', servicos);

  const totalPecas = pecas.reduce((s, i) => s + Number(i.valor_total), 0);
  const totalServ = servicos.reduce((s, i) => s + Number(i.valor_total), 0);
  const total = totalPecas + totalServ;

  y += 2;
  doc.line(margin, y, margin + width, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Peças: R$ ${totalPecas.toFixed(2)}`, margin, y);
  y += 5;
  doc.text(`Mão de obra: R$ ${totalServ.toFixed(2)}`, margin, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`TOTAL: R$ ${total.toFixed(2)}`, margin, y);
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('De acordo: autorizo a execução dos serviços e peças acima.', margin, y);
  y += 14;
  doc.line(margin, y, margin + 80, y);
  doc.text('Cliente  •  data ____/____/________', margin, y + 5);

  const filename = `OS-${data.numeroOs}.pdf`;
  return new File([doc.output('blob')], filename, { type: 'application/pdf' });
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
