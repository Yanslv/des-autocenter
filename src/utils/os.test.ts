import assert from 'node:assert/strict';
import { osPodeEditarItens, osPodeSeguirCotar, osTemPecaParaCotar } from './os';

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

console.log('os.test.ts ok');
