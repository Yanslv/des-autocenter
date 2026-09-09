import assert from 'node:assert/strict';
import { formatBRL } from './formatters';
import { montarOsPdfModelo, urlWhatsApp } from './osPdf';

assert.equal(
  urlWhatsApp('11988887777', 'Oi'),
  'https://wa.me/5511988887777?text=Oi'
);
assert.equal(
  urlWhatsApp('5511988887777', 'Oi'),
  'https://wa.me/5511988887777?text=Oi'
);
assert.equal(
  urlWhatsApp('(11) 98888-7777', 'OS-12 pronta'),
  `https://wa.me/5511988887777?text=${encodeURIComponent('OS-12 pronta')}`
);
assert.equal(urlWhatsApp('', 'Oi'), null);
assert.equal(urlWhatsApp('abc', 'Oi'), null);

const osPdf = montarOsPdfModelo({
  oficinaNome: 'D&S Auto Center',
  oficinaWhatsapp: '(11) 98888-7777',
  numeroOs: 12,
  status: 'Aberta',
  dataAbertura: '2026-09-09',
  previsao: '2026-09-15',
  clienteNome: 'Maria Silva',
  clienteDocumento: '123.456.789-00',
  clienteTelefone: '(11) 98888-7777',
  marca: 'Toyota',
  modelo: 'Corolla',
  placa: 'ABC1D23',
  cor: 'Preto',
  km: 82450,
  problema: 'Amortecedor estourado',
  itens: [
    { tipo: 'servico', descricao: 'Troca de amortecedor', quantidade: 1, valor_unitario: 180, valor_total: 180 },
    { tipo: 'produto', descricao: 'Amortecedor dianteiro', quantidade: 2, valor_unitario: 250, valor_total: 500 },
  ],
});
assert.equal(osPdf.tituloDocumento, 'Ordem de Serviço');
assert.equal(osPdf.numero, '000012');
assert.equal(osPdf.validadeTexto, 'Aberta');
assert.equal(osPdf.rotuloCondicao3, 'Status');
assert.equal(osPdf.rotuloTotal, 'Total da ordem de serviço');
assert.equal(osPdf.servicos.length, 1);
assert.equal(osPdf.pecas.length, 1);
assert.equal(osPdf.total, formatBRL(680));
assert.equal(osPdf.observacao, 'Amortecedor estourado');
assert.equal(osPdf.previsaoEntrega, '15/09/2026');

console.log('osPdf.test.ts ok');
