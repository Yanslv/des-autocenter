import assert from 'node:assert/strict';
import {
  formatMoedaInput,
  maskInteiroInput,
  maskMoedaInput,
  parseInteiro,
  parseMoeda,
} from './formatters';

assert.equal(maskMoedaInput(''), '');
assert.equal(maskMoedaInput('5'), '0.05');
assert.equal(maskMoedaInput('50'), '0.50');
assert.equal(maskMoedaInput('500'), '5.00');
assert.equal(maskMoedaInput('5000'), '50.00');
assert.equal(maskMoedaInput('50.00'), '50.00');
assert.equal(maskMoedaInput('50,00'), '50.00');
assert.equal(maskMoedaInput('0.05'), '0.05');
assert.equal(maskMoedaInput('12.50'), '12.50');
assert.equal(maskMoedaInput('abc'), '');

assert.equal(parseMoeda(''), 0);
assert.equal(parseMoeda('50.00'), 50);
assert.equal(parseMoeda('50,00'), 50);
assert.equal(parseMoeda('12.50'), 12.5);
assert.equal(parseMoeda('0.90'), 0.9);

assert.equal(formatMoedaInput(0), '');
assert.equal(formatMoedaInput(12.5), '12.50');
assert.equal(formatMoedaInput(10), '10.00');
assert.equal(formatMoedaInput(50), '50.00');

assert.equal(maskInteiroInput(''), '');
assert.equal(maskInteiroInput('0'), '0');
assert.equal(maskInteiroInput('01212'), '1212');
assert.equal(maskInteiroInput('12a'), '12');

assert.equal(parseInteiro(''), 0);
assert.equal(parseInteiro('8'), 8);

console.log('formatters.test.ts ok');
