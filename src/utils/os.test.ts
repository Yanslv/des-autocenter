import assert from 'node:assert/strict';
import {
  osPodeEditarItens,
  osPodeSeguirCotar,
  osTemPecaParaCotar,
  progressoChecklist,
  validarTravamento,
} from './os';

assert.equal(osPodeEditarItens('Aberta'), true);
assert.equal(osPodeEditarItens('AguardandoCotar'), true);
assert.equal(osPodeEditarItens('AguardandoCliente'), true);
assert.equal(osPodeEditarItens('Fazendo'), true);
assert.equal(osPodeEditarItens('TravadoPeca'), true);
assert.equal(osPodeEditarItens('Pronto'), true);
assert.equal(osPodeEditarItens('Entregue'), false);

assert.equal(osTemPecaParaCotar([]), false);
assert.equal(osTemPecaParaCotar([{ tipo: 'servico', origem_peca: null }]), false);
assert.equal(osTemPecaParaCotar([{ tipo: 'produto', origem_peca: 'estoque' }]), false);
assert.equal(osTemPecaParaCotar([{ tipo: 'produto', origem_peca: 'comprar' }]), true);

assert.equal(osPodeSeguirCotar([]), true);
assert.equal(
  osPodeSeguirCotar([{ tipo: 'servico', origem_peca: null, comprado: false, valor_unitario: 0 }]),
  true
);
assert.equal(
  osPodeSeguirCotar([{ tipo: 'produto', origem_peca: 'comprar', comprado: false, valor_unitario: 0 }]),
  false
);
assert.equal(
  osPodeSeguirCotar([{ tipo: 'produto', origem_peca: 'comprar', comprado: true, valor_unitario: 0 }]),
  false
);
assert.equal(
  osPodeSeguirCotar([{ tipo: 'produto', origem_peca: 'comprar', comprado: true, valor_unitario: 80 }]),
  true
);

assert.equal(validarTravamento(null, 'Peça errada'), 'Selecione a peça ou o serviço que travou');
assert.equal(validarTravamento('', 'Avaria'), 'Selecione a peça ou o serviço que travou');
assert.equal(validarTravamento('item-1', ''), 'Informe por que travou');
assert.equal(validarTravamento('item-1', '   '), 'Informe por que travou');
assert.equal(validarTravamento('item-1', 'Peça errada'), null);

assert.deepEqual(progressoChecklist([]), { feitos: 0, total: 0 });
assert.deepEqual(
  progressoChecklist([
    { executado: true },
    { executado: false },
    { executado: true },
  ]),
  { feitos: 2, total: 3 }
);

console.log('os.test.ts ok');
