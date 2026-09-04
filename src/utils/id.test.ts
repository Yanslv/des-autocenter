import assert from 'node:assert/strict';
import { novoId } from './id';

const original = crypto.randomUUID.bind(crypto);

crypto.randomUUID = () => {
  throw new DOMException('The operation is insecure.', 'SecurityError');
};

const a = novoId();
const b = novoId();

assert.equal(typeof a, 'string');
assert.ok(a.length > 8);
assert.notEqual(a, b);

crypto.randomUUID = original;

const c = novoId();
assert.match(c, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

console.log('id.test.ts ok');
