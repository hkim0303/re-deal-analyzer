const { createRunner } = require('./helpers');
const Share = require('../js/share.js');
const { test, done } = createRunner('test-share.js');

test('encode/decode round-trips a deal inputs object', () => {
  const inputs = { price: 350000, downPct: 20, rent: 2900 };
  const encoded = Share.encode(inputs);
  const decoded = Share.decode(encoded);
  if (JSON.stringify(decoded) !== JSON.stringify(inputs)) {
    throw new Error('decoded value did not match the original input');
  }
});

test('decode: returns null for garbage input instead of throwing', () => {
  const result = Share.decode('not-valid-base64-json!!!');
  if (result !== null) throw new Error('expected decode() to fail safely and return null');
});

// buildShareUrl() and readFromHash() depend on the browser's `location` object
// and are exercised manually in-browser rather than under Node.

done();
