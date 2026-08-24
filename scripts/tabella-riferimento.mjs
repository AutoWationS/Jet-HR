/**
 * Stampa la tabella dei casi di riferimento in markdown.
 * Serve a confrontare l'output del motore con un calcolatore pubblico
 * in un solo passaggio:  node scripts/tabella-riferimento.mjs
 */

import { calcolaNetto } from '../src/motore.js';

const CASI = [15000, 20000, 25000, 28000, 32000, 35000, 40000, 50000, 60000, 80000, 120000];
const n = (x) => x.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const p = (x) => `${(x * 100).toLocaleString('it-IT', { maximumFractionDigits: 2 })}%`;

const intestazione = [
  'RAL', 'INPS', 'Imponibile', 'IRPEF lorda', 'Detrazioni', 'IRPEF netta',
  'Add. reg.', 'Add. com.', 'Bonus', 'Netto annuo', 'Netto /13', '% netto', 'Marginale',
];

console.log(`| ${intestazione.join(' | ')} |`);
console.log(`|${intestazione.map(() => '---:').join('|')}|`);

for (const ral of CASI) {
  const r = calcolaNetto({ ral, mensilita: 13 });
  console.log(
    `| ${n(ral)} | ${n(r.contributi.totale)} | ${n(r.imponibileFiscale)} | ${n(r.irpef.lorda)} ` +
      `| ${n(r.irpef.detrazioniTotali)} | ${n(r.irpef.netta)} | ${n(r.addizionali.regionale)} ` +
      `| ${n(r.addizionali.comunale)} | ${n(r.bonus.totale)} | **${n(r.netto.annuo)}** ` +
      `| ${n(r.netto.mensile)} | ${p(r.indici.incidenzaNetto)} | ${p(r.indici.aliquotaMarginale)} |`,
  );
}
