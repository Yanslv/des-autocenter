import assert from 'node:assert/strict';
import {
  calcularTotaisOrcamento,
  dataValidadeOrcamento,
  formatarNumeroOrcamento,
  montarEnderecoCliente,
  orcamentoCombinaBusca,
  podeAprovarOrcamento,
  podeGerarOS,
  podeReabrirOrcamento,
  resumoVeiculoOrcamento,
  statusOrcamentoEfetivo,
} from './orcamento';

const totais = calcularTotaisOrcamento(
  [
    { tipo: 'servico', valor_total: 800 },
    { tipo: 'servico', valor_total: 350 },
    { tipo: 'produto', valor_total: 250 },
    { tipo: 'produto', valor_total: 80 },
    { tipo: 'produto', valor_total: 120 },
    { tipo: 'terceiro', valor_total: 0 },
  ],
  100
);

assert.equal(totais.totalServicos, 1150);
assert.equal(totais.totalPecas, 450);
assert.equal(totais.totalTerceiros, 0);
assert.equal(totais.subtotal, 1600);
assert.equal(totais.desconto, 100);
assert.equal(totais.total, 1500);

const semDescontoNegativo = calcularTotaisOrcamento([{ tipo: 'servico', valor_total: 100 }], 250);
assert.equal(semDescontoNegativo.desconto, 100);
assert.equal(semDescontoNegativo.total, 0);

const dezPorcento = calcularTotaisOrcamento([{ tipo: 'servico', valor_total: 1000 }], 10, 'percentual');
assert.equal(dezPorcento.desconto, 100);
assert.equal(dezPorcento.total, 900);

const cemPorcento = calcularTotaisOrcamento([{ tipo: 'servico', valor_total: 250 }], 100, 'percentual');
assert.equal(cemPorcento.desconto, 250);
assert.equal(cemPorcento.total, 0);

const porcentagemAcimaDeCem = calcularTotaisOrcamento([{ tipo: 'servico', valor_total: 250 }], 150, 'percentual');
assert.equal(porcentagemAcimaDeCem.desconto, 250);
assert.equal(porcentagemAcimaDeCem.total, 0);

const porcentagemSemSubtotal = calcularTotaisOrcamento([], 10, 'percentual');
assert.equal(porcentagemSemSubtotal.desconto, 0);

assert.equal(formatarNumeroOrcamento(123), '000123');
assert.equal(formatarNumeroOrcamento(7), '000007');

const veiculo = resumoVeiculoOrcamento({
  marca: 'Toyota',
  modelo: 'Corolla',
  versao: 'XEi 2.0',
  placa: 'ABC1D23',
  cor: 'Preto',
  km: 82450,
});
assert.equal(veiculo.titulo, 'Toyota Corolla XEi 2.0');
assert.match(veiculo.detalhe, /ABC-1D23/);
assert.match(veiculo.detalhe, /82\.450 km/);
assert.match(veiculo.detalhe, /Preto/);

assert.equal(
  montarEnderecoCliente({
    endereco: 'Rua das Flores',
    endereco_numero: '120',
    complemento: 'Sala 2',
    bairro: 'Centro',
    cidade: 'Curitiba',
    uf: 'PR',
    cep: '80000-000',
  }),
  'Rua das Flores, 120, Sala 2 — Centro, Curitiba/PR — CEP 80000-000'
);

assert.equal(podeGerarOS('aprovado', null), true);
assert.equal(podeGerarOS('aprovado', 'os-1'), false);
assert.equal(podeGerarOS('enviado', null), false);
assert.equal(podeAprovarOrcamento('enviado'), true);
assert.equal(podeAprovarOrcamento('rascunho'), true);
assert.equal(podeAprovarOrcamento('aprovado'), false);
assert.equal(podeReabrirOrcamento('recusado'), true);
assert.equal(podeReabrirOrcamento('aprovado'), false);
assert.equal(podeReabrirOrcamento('enviado'), false);
assert.equal(podeReabrirOrcamento('rascunho'), false);

assert.equal(orcamentoCombinaBusca('', 'Ana', { placa: 'ABC1D23', marca: 'Toyota', modelo: 'Corolla' }), true);
assert.equal(orcamentoCombinaBusca('ana', 'Ana Silva', { placa: 'ABC1D23', marca: 'Toyota', modelo: 'Corolla' }), true);
assert.equal(orcamentoCombinaBusca('corolla', 'Ana', { placa: 'ABC1D23', marca: 'Toyota', modelo: 'Corolla' }), true);
assert.equal(orcamentoCombinaBusca('abc1d23', 'Ana', { placa: 'ABC-1D23', marca: 'Toyota', modelo: 'Corolla' }), true);
assert.equal(orcamentoCombinaBusca('honda', 'Ana', { placa: 'ABC1D23', marca: 'Toyota', modelo: 'Corolla' }), false);

assert.equal(dataValidadeOrcamento('2026-09-09', 15), '2026-09-24');
assert.equal(statusOrcamentoEfetivo('enviado', 15, '2026-08-01', new Date('2026-09-09')), 'vencido');
assert.equal(statusOrcamentoEfetivo('enviado', 15, '2026-09-01', new Date('2026-09-09')), 'enviado');
assert.equal(statusOrcamentoEfetivo('aprovado', 15, '2026-08-01', new Date('2026-09-09')), 'aprovado');

console.log('orcamento.test.ts ok');
