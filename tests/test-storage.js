const { createRunner, makeLocalStorage } = require('./helpers');
global.localStorage = makeLocalStorage(); // storage.js expects the browser localStorage API
const Storage = require('../js/storage.js');
const { test, assertClose, done } = createRunner('test-storage.js');

test('save: assigns a generated id to a new deal', () => {
  localStorage.clear();
  const id = Storage.save({ nickname: 'Test Deal', inputs: { price: 100000 } });
  if (!id) throw new Error('expected save() to return a generated id');
  assertClose(Storage.getAll().length, 1, 0);
});

test('save: reuses the same id on update instead of creating a duplicate', () => {
  localStorage.clear();
  const id = Storage.save({ nickname: 'First', inputs: { price: 100000 } });
  Storage.save({ id, nickname: 'Updated', inputs: { price: 120000 } });
  const all = Storage.getAll();
  assertClose(all.length, 1, 0);
  if (all[0].nickname !== 'Updated') throw new Error('expected the deal to be updated in place, not duplicated');
});

test('remove: deletes a saved deal by id', () => {
  localStorage.clear();
  const id = Storage.save({ nickname: 'To Delete', inputs: {} });
  Storage.remove(id);
  assertClose(Storage.getAll().length, 0, 0);
});

test('get: returns null for an id that does not exist', () => {
  localStorage.clear();
  const deal = Storage.get('does-not-exist');
  if (deal !== null) throw new Error('expected null for a missing deal id');
});

done();
