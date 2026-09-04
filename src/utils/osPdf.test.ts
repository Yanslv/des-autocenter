import assert from 'node:assert/strict';
import { urlWhatsApp } from './osPdf';

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

console.log('osPdf.test.ts ok');
