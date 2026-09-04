import assert from 'node:assert/strict';
import { deslocamentoParaCampoVisivel, tecladoEstaAberto } from './teclado';

const viewport = { offsetTop: 0, height: 400 };

assert.equal(deslocamentoParaCampoVisivel({ top: 80, bottom: 130 }, viewport), 0);
assert.equal(deslocamentoParaCampoVisivel({ top: 360, bottom: 410 }, viewport), 34);
assert.equal(deslocamentoParaCampoVisivel({ top: -20, bottom: 30 }, viewport), -44);

assert.equal(deslocamentoParaCampoVisivel({ top: 500, bottom: 560 }, { offsetTop: 200, height: 300 }), 84);

assert.equal(tecladoEstaAberto(800, 800), false);
assert.equal(tecladoEstaAberto(720, 800), false);
assert.equal(tecladoEstaAberto(500, 800), true);

console.log('teclado.test.ts ok');
