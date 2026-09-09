import assert from 'node:assert/strict';
import { formatBRL } from './formatters';
import { areaUtilPdfMm, alturaUtilPdfPx, definirCortesPdf, fatiasCanvas, montarOrcamentoPdfModelo } from './orcamentoPdf';

const modelo = montarOrcamentoPdfModelo({
  oficinaNome: 'D&S Auto Center',
  oficinaSegmento: 'Estética automotiva',
  oficinaWhatsapp: '(11) 98888-7777',
  oficinaEmail: 'contato@dsautocenter.com',
  oficinaEndereco: 'Rua Exemplo, 100',
  oficinaCnpj: '12.345.678/0001-90',
  numero: 123,
  dataEmissao: '2026-09-09',
  validadeDias: 15,
  clienteTipo: 'pf',
  clienteNome: 'Maria Silva',
  clienteDocumento: '123.456.789-00',
  clienteTelefone: '(11) 98888-7777',
  clienteEmail: 'maria@email.com',
  clienteEndereco: 'Rua das Flores',
  clienteNumero: '120',
  clienteComplemento: 'Sala 2',
  clienteBairro: 'Centro',
  clienteCidade: 'Curitiba',
  clienteUf: 'PR',
  clienteCep: '80000-000',
  marca: 'Toyota',
  modelo: 'Corolla',
  versao: 'XEi 2.0',
  ano: 2022,
  anoModelo: 2023,
  placa: 'ABC1D23',
  cor: 'Preto',
  km: 82450,
  itens: [
    { tipo: 'servico', descricao: 'Polimento técnico', detalhe: 'Correção de riscos', quantidade: 1, valor_unitario: 800, valor_total: 800 },
    { tipo: 'produto', descricao: 'Friso lateral', quantidade: 1, valor_unitario: 250, valor_total: 250 },
    { tipo: 'terceiro', descricao: 'Funilaria', quantidade: 1, valor_unitario: 0, valor_total: 0 },
  ],
  desconto: 100,
  prazoEstimadoDias: 5,
  previsao: '2026-09-15',
  observacao: 'Somente com aprovação.',
  aprovadoNome: 'Maria Silva',
});

assert.equal(modelo.numero, '000123');
assert.equal(modelo.tituloDocumento, 'Orçamento');
assert.equal(modelo.rotuloTotal, 'Total do orçamento');
assert.equal(modelo.validadeTexto, '15 dias (até 24/09/2026)');
assert.equal(modelo.ehPj, false);
assert.equal(modelo.clienteEndereco, 'Rua das Flores, 120, Sala 2 — Centro, Curitiba/PR — CEP 80000-000');
assert.equal(modelo.veiculoTitulo, 'Toyota Corolla XEi 2.0');
assert.equal(modelo.veiculoPlaca, 'ABC-1D23');
assert.equal(modelo.veiculoKm, '82.450 km');
assert.equal(modelo.servicos.length, 1);
assert.equal(modelo.pecas[0].item, '01');
assert.equal(modelo.total, formatBRL(950));
assert.equal(modelo.resumoDesconto, `-${formatBRL(100)}`);
assert.equal(modelo.prazoEstimado, '5 dias');
assert.equal(modelo.previsaoEntrega, '15/09/2026');

const pj = montarOrcamentoPdfModelo({
  oficinaNome: 'D&S',
  oficinaWhatsapp: '',
  numero: 1,
  dataEmissao: '2026-09-09',
  validadeDias: 15,
  clienteTipo: 'pj',
  clienteNome: 'Empresa LTDA',
  clienteNomeFantasia: 'Empresa',
  itens: [],
  desconto: 0,
});
assert.equal(pj.ehPj, true);

const umaPagina = definirCortesPdf(
  [
    { top: 0, bottom: 200 },
    { top: 200, bottom: 500 },
  ],
  1123,
  500
);
assert.deepEqual(umaPagina, [{ y: 0, h: 500 }]);

const duasPaginas = definirCortesPdf(
  [
    { top: 0, bottom: 400 },
    { top: 400, bottom: 800 },
    { top: 800, bottom: 1400 },
  ],
  1123,
  1400
);
assert.equal(duasPaginas.length, 2);
assert.equal(duasPaginas[0].y, 0);
assert.equal(duasPaginas[0].h, 800);
assert.equal(duasPaginas[1].y, 800);
assert.equal(duasPaginas[1].h, 600);

const blocoMaiorQuePagina = definirCortesPdf([{ top: 0, bottom: 2000 }], 1000, 2000);
assert.equal(blocoMaiorQuePagina.length, 2);
assert.equal(blocoMaiorQuePagina[0].h, 1000);
assert.equal(blocoMaiorQuePagina[1].y, 1000);

assert.deepEqual(definirCortesPdf([], 1123, 400), [{ y: 0, h: 400 }]);

assert.deepEqual(areaUtilPdfMm(), { x: 13, y: 13, w: 184, h: 271 });

const util = alturaUtilPdfPx(794);
assert.equal(util, 794 * (271 / 184));

const blocoNaMargem = definirCortesPdf(
  [
    { top: 0, bottom: 100 },
    { top: 100, bottom: util + 1 },
  ],
  util,
  util + 1
);
assert.equal(blocoNaMargem.length, 2);
assert.equal(blocoNaMargem[0].h, 100);
assert.equal(blocoNaMargem[1].y, 100);

assert.deepEqual(definirCortesPdf([{ top: 0, bottom: util }], util, util), [{ y: 0, h: util }]);

const fatias = fatiasCanvas(
  [
    { y: 0, h: 100 },
    { y: 100, h: 50 },
  ],
  2,
  300
);
assert.deepEqual(fatias, [
  { sy: 0, sh: 200 },
  { sy: 200, sh: 100 },
]);
assert.equal(fatias[0].sy + fatias[0].sh + fatias[1].sh, 300);

console.log('orcamentoPdf.test.ts ok');
