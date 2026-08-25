/**
 * Stampa il registro delle fonti in forma di checklist, per la verifica manuale.
 *
 *     node scripts/verifica-fonti.mjs
 *
 * Serve a una cosa sola: rendere possibile in cinque minuti il controllo che
 * nessun test puo' fare al posto di una persona — aprire ogni link e leggere se
 * la norma dice davvero quello che il registro le fa dire.
 */

import { FONTI, PARAMETRI_2026 as P, fonteDi } from '../src/parametri.js';

const LIVELLI = { 1: 'NORMA PRIMARIA', 2: 'PRASSI / ATTO LOCALE' };

const BLOCCHI = {
  inps: 'contributi INPS',
  irpef: 'scaglioni IRPEF',
  detrazioneLavoroDipendente: 'detrazione art. 13',
  cuneoFiscale: 'taglio del cuneo',
  trattamentoIntegrativo: 'trattamento integrativo',
  addizionaleRegionale: 'addizionale regionale',
  addizionaleComunale: 'addizionale comunale',
};

const usataDa = {};
for (const [chiave, etichetta] of Object.entries(BLOCCHI)) {
  const f = fonteDi(P[chiave]);
  if (f) (usataDa[P[chiave].fonte] ??= []).push(etichetta);
}

console.log(`\nREGISTRO DELLE FONTI — anno d'imposta ${P.anno}`);
console.log(`${Object.keys(FONTI).length} fonti · ${
  Object.values(FONTI).filter((f) => f.livello === 1).length
} di livello 1 · ${Object.values(FONTI).filter((f) => f.livello === 2).length} di livello 2\n`);

let n = 0;
for (const [chiave, f] of Object.entries(FONTI)) {
  n += 1;
  console.log(`${String(n).padStart(2)}. ${f.etichetta}  [${LIVELLI[f.livello]}]`);
  console.log(`    chiave    ${chiave}`);
  console.log(`    norma     ${f.norma}`);
  if (f.prassi) console.log(`    prassi    ${f.prassi.replace(/\s+/g, ' ').slice(0, 160)}…`);
  console.log(`    usata da  ${usataDa[chiave]?.join(', ') ?? 'regola trasversale'}`);
  console.log(`    verifica  ${f.verifica.replace(/\s+/g, ' ')}`);
  console.log(`    [ ] apri  ${f.url ?? '(nessun link)'}`);
  console.log();
}

console.log('Da riverificare ogni anno, prima di qualunque uso non dimostrativo:');
for (const [chiave, f] of Object.entries(FONTI)) {
  if (/da riverificare|ATTENZIONE|cambiano ogni anno/i.test(f.verifica)) {
    console.log(`  · ${f.etichetta} (${chiave})`);
  }
}
console.log();
