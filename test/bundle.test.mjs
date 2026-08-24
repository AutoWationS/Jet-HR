/**
 * Il bundle in dist/ e' generato dai sorgenti: non deve poter divergere.
 * Se qualcuno tocca il motore e dimentica `npm run build`, questo test cade.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { costruisci } from '../scripts/bundle.mjs';

const { pagina, contenuto } = costruisci();

test('dist/calcolatore.html e allineato ai sorgenti', () => {
  const suDisco = readFileSync(new URL('../dist/calcolatore.html', import.meta.url), 'utf8');
  assert.equal(pagina, suDisco, 'bundle non aggiornato: esegui `npm run build`');
});

test('dist/artifact.html e allineato ai sorgenti', () => {
  const suDisco = readFileSync(new URL('../dist/artifact.html', import.meta.url), 'utf8');
  assert.equal(`${contenuto}\n`, suDisco, 'bundle non aggiornato: esegui `npm run build`');
});

test('il bundle e autoportante: nessun riferimento esterno e nessun import residuo', () => {
  assert.ok(!/^\s*(import|export)\s/m.test(pagina.split('<script type="module">')[1]));
  assert.ok(!/<link[^>]+href="(?!data:)/.test(pagina), 'nessun foglio di stile esterno');
  assert.ok(!/<script[^>]+src=/.test(pagina), 'nessuno script esterno');
  // I parametri normativi devono essere finiti dentro
  assert.ok(pagina.includes('56224') && pagina.includes('primaFasciaPensionabile'));
});
