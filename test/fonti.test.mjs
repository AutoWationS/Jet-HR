/**
 * Le fonti sono dati, non commenti: questi test le tengono oneste.
 * Se un parametro nasce senza fonte, o una fonte resta senza parametri che la
 * usano, la suite lo dice — cosi' la sezione "Fonti" della pagina non puo'
 * scollarsi da cio' che il motore calcola davvero.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { PARAMETRI_2026 as P, FONTI, fonteDi } from '../src/parametri.js';

/** Blocchi di parametri che devono dichiarare una fonte. */
const BLOCCHI = [
  'inps',
  'irpef',
  'detrazioneLavoroDipendente',
  'cuneoFiscale',
  'trattamentoIntegrativo',
  'addizionaleRegionale',
  'addizionaleComunale',
];

test('ogni blocco di parametri dichiara una fonte esistente', () => {
  for (const nome of BLOCCHI) {
    const blocco = P[nome];
    assert.ok(blocco, `blocco ${nome} assente`);
    assert.ok(blocco.fonte, `il blocco ${nome} non dichiara una fonte`);
    assert.ok(FONTI[blocco.fonte], `il blocco ${nome} punta alla fonte inesistente "${blocco.fonte}"`);
    assert.equal(fonteDi(blocco), FONTI[blocco.fonte]);
  }
});

test('ogni fonte e completa nei campi che la pagina mostra', () => {
  for (const [chiave, fonte] of Object.entries(FONTI)) {
    assert.ok(fonte.etichetta, `fonte ${chiave}: manca l'etichetta`);
    assert.ok(fonte.norma, `fonte ${chiave}: manca il riferimento normativo`);
    assert.ok(fonte.dettaglio, `fonte ${chiave}: manca la spiegazione`);
    assert.ok(fonte.verifica, `fonte ${chiave}: manca la nota di verifica`);
    if (fonte.url) assert.match(fonte.url, /^https:\/\//, `fonte ${chiave}: url non https`);
  }
});

test('nessuna fonte orfana: ognuna e citata da un parametro o dichiarata trasversale', () => {
  // Fonti che non appartengono a un singolo blocco ma valgono per il modello
  // nel suo insieme (regole di ordine, nozioni, deducibilita').
  const TRASVERSALI = ['deducibilitaContributi', 'addizionaliNoTaxArea', 'redditoComplessivo'];
  const citate = new Set([...BLOCCHI.map((n) => P[n].fonte), ...TRASVERSALI]);

  for (const chiave of Object.keys(FONTI)) {
    assert.ok(citate.has(chiave), `la fonte "${chiave}" non e' usata da nessun parametro`);
  }
});

test('il perimetro escluso e dichiarato voce per voce, con norma e motivo', () => {
  assert.ok(P.fuoriPerimetro.length >= 5);
  for (const voce of P.fuoriPerimetro) {
    assert.ok(voce.voce && voce.norma && voce.motivo, `voce fuori perimetro incompleta: ${voce.voce}`);
  }
});
