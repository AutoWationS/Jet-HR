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

const STATI = {
  'atto-letto': 'ATTO LETTO',
  'atto-corrispondente': 'letto su testo corrispondente',
  'prassi-letta': 'letto in circolare',
  'fonte-istituzionale': 'fonte dell\u2019ente',
  'non-verificata': 'NON VERIFICATA',
};

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
if (P.addizionaleRegionale.agevolazioni?.fonte) {
  (usataDa[P.addizionaleRegionale.agevolazioni.fonte] ??= []).push('aliquote agevolate regionali');
}

console.log(`\nREGISTRO DELLE FONTI — anno d'imposta ${P.anno}`);
console.log(`${Object.keys(FONTI).length} fonti · ${
  Object.values(FONTI).filter((f) => f.livello === 1).length
} di livello 1 · ${Object.values(FONTI).filter((f) => f.livello === 2).length} di livello 2\n`);

let n = 0;
for (const [chiave, f] of Object.entries(FONTI)) {
  n += 1;
  console.log(`${String(n).padStart(2)}. ${f.etichetta}  [${LIVELLI[f.livello]}]  ->  ${
    STATI[f.statoVerifica]
  }`);
  console.log(`    chiave    ${chiave}`);
  console.log(`    norma     ${f.norma}`);
  if (f.prassi) console.log(`    prassi    ${f.prassi.replace(/\s+/g, ' ').slice(0, 160)}…`);
  console.log(`    usata da  ${usataDa[chiave]?.join(', ') ?? 'regola trasversale'}`);
  console.log(`    verifica  ${f.verifica.replace(/\s+/g, ' ')}`);
  if (f.lacuna) console.log(`    MANCA     ${f.lacuna.replace(/\s+/g, ' ')}`);
  console.log(`    [ ] apri  ${f.url ?? '(nessun link)'}`);
  console.log();
}

const perStato = {};
for (const f of Object.values(FONTI)) (perStato[f.statoVerifica] ??= []).push(f.etichetta);
console.log('RIEPILOGO PER STATO DI VERIFICA');
for (const [stato, elenco] of Object.entries(perStato)) {
  console.log(`  ${STATI[stato]} (${elenco.length})`);
  for (const e of elenco) console.log(`      · ${e}`);
}
console.log();

/* ------------------------------------------------------------------ *
 * La lista della spesa: cosa resta da aprire, raggruppato per documento
 * ------------------------------------------------------------------ */

const CANALI = {
  normattiva: 'Normattiva — https://www.normattiva.it/ricerca/semplice',
  burl: 'Bollettino Ufficiale Regione Lombardia, o banca dati normativa regionale',
  comune: 'comune.milano.it — pagina addizionale comunale IRPEF, sezione Riferimenti normativi',
  def: 'def.finanze.it — Documentazione Economica e Finanziaria, ricerca libera',
  inps: 'inps.it — tabelle delle aliquote contributive',
};

const daAprire = new Map();
for (const f of Object.values(FONTI)) {
  if (f.statoVerifica === 'atto-letto' && !f.lacuna) continue;
  if (!f.dove) continue;
  // Raggruppa per ATTO, non per articolo: aprire il TUIR una volta sola chiude
  // sei fonti diverse.
  const [atto, articolo] = f.dove.split(' \u2014 ');
  const voce = daAprire.get(atto) ?? { canale: f.canale, parti: new Set(), chiude: [] };
  if (articolo) voce.parti.add(articolo);
  voce.chiude.push(f.etichetta);
  daAprire.set(atto, voce);
}

console.log('DA APRIRE — un documento per riga, in ordine di quante fonti chiude\n');
const ordinati = [...daAprire.entries()].sort((a, b) => b[1].chiude.length - a[1].chiude.length);
ordinati.forEach(([documento, voce], i) => {
  console.log(`${i + 1}. ${documento}`);
  if (voce.parti.size) console.log(`   leggi   ${[...voce.parti].join(' · ')}`);
  console.log(`   dove    ${CANALI[voce.canale]}`);
  console.log(
    `   chiude  ${voce.chiude.length} ${voce.chiude.length === 1 ? 'fonte' : 'fonti'}: ${voce.chiude.join(
      ' · ',
    )}`,
  );
  console.log();
});

console.log('Da riverificare ogni anno, prima di qualunque uso non dimostrativo:');
for (const [chiave, f] of Object.entries(FONTI)) {
  if (/da riverificare|ATTENZIONE|cambiano ogni anno/i.test(f.verifica)) {
    console.log(`  · ${f.etichetta} (${chiave})`);
  }
}
console.log();
