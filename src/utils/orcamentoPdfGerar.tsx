import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import logoDs from '../assets/d&s_logo.png';
import { OrcamentoPdfDocumento, orcamentoPdfCss } from '../components/OrcamentoPdfDocumento';
import { areaUtilPdfMm, alturaUtilPdfPx, definirCortesPdf, fatiasCanvas, montarOrcamentoPdfModelo, type OrcamentoPdfInput } from './orcamentoPdf';

function esperarImagens(root: HTMLElement) {
  return Promise.all(
    Array.from(root.querySelectorAll('img')).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );
}

function coletarBlocos(folha: HTMLElement) {
  const origem = folha.getBoundingClientRect();
  const blocos: { top: number; bottom: number }[] = [];
  const medir = (el: Element) => {
    const box = el.getBoundingClientRect();
    blocos.push({
      top: box.top - origem.top,
      bottom: box.bottom - origem.top,
    });
  };

  Array.from(folha.children).forEach((child) => {
    if (!(child instanceof HTMLElement) || child.tagName === 'STYLE') return;
    if (child.classList.contains('secao') && child.querySelector('table')) {
      const titulo = child.querySelector('.secao-titulo');
      const thead = child.querySelector('thead');
      const total = child.querySelector('.tabela-total');
      if (titulo && thead) {
        const a = titulo.getBoundingClientRect();
        const b = thead.getBoundingClientRect();
        blocos.push({
          top: a.top - origem.top,
          bottom: b.bottom - origem.top,
        });
      } else {
        if (titulo) medir(titulo);
        if (thead) medir(thead);
      }
      child.querySelectorAll('tbody tr').forEach(medir);
      if (total) medir(total);
      return;
    }
    medir(child);
  });

  return blocos;
}

function recortarCanvas(canvas: HTMLCanvasElement, sy: number, sh: number) {
  const y = Math.max(0, Math.min(sy, canvas.height - 1));
  const h = Math.min(canvas.height - y, Math.max(1, sh));
  const fatia = document.createElement('canvas');
  fatia.width = canvas.width;
  fatia.height = h;
  const ctx = fatia.getContext('2d');
  if (!ctx) throw new Error('Não foi possível recortar a página');
  ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
  return fatia;
}

export async function gerarOrcamentoPdf(data: OrcamentoPdfInput): Promise<File> {
  const modelo = montarOrcamentoPdfModelo(data);
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '0';
  host.style.top = '0';
  host.style.width = '794px';
  host.style.background = '#fff';
  host.style.zIndex = '-1';
  document.body.appendChild(host);
  const style = document.createElement('style');
  style.textContent = orcamentoPdfCss;
  document.head.appendChild(style);
  const root = createRoot(host);
  try {
    flushSync(() => {
      root.render(<OrcamentoPdfDocumento modelo={modelo} logoSrc={logoDs} />);
    });
    await esperarImagens(host);
    const folha = host.querySelector('.orcamento-pdf');
    if (!(folha instanceof HTMLElement)) throw new Error('Não foi possível montar o orçamento');
    const canvas = await html2canvas(folha, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: folha.scrollWidth,
      windowHeight: Math.max(folha.scrollHeight, folha.offsetHeight),
    });
    const area = areaUtilPdfMm();
    const pageHpx = alturaUtilPdfPx(folha.offsetWidth);
    const scale = canvas.width / folha.offsetWidth;
    const totalH = canvas.height / scale;
    const paginas = definirCortesPdf(coletarBlocos(folha), pageHpx, totalH);
    const fatias = fatiasCanvas(paginas, scale, canvas.height);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    fatias.forEach((fatiaInfo, idx) => {
      const fatia = recortarCanvas(canvas, fatiaInfo.sy, fatiaInfo.sh);
      const hMm = Math.min((fatia.height / canvas.width) * area.w, area.h);
      if (idx > 0) pdf.addPage();
      pdf.addImage(fatia.toDataURL('image/jpeg', 0.95), 'JPEG', area.x, area.y, area.w, hMm);
    });
    return new File([pdf.output('blob')], `ORCAMENTO-${modelo.numero}.pdf`, { type: 'application/pdf' });
  } finally {
    root.unmount();
    host.remove();
    style.remove();
  }
}
