/**
 * Test del motore di calcolo. Nessuna dipendenza esterna: `node --test`.
 *
 * Due famiglie di test:
 *  1. CASI DI RIFERIMENTO — ogni passaggio ricalcolato a mano nel commento,
 *     cosi' un fallimento dice subito QUALE passaggio si e' rotto.
 *  2. INVARIANTI E DISCONTINUITA' — proprieta' che devono valere per ogni RAL
 *     (monotonia, effetti soglia attesi e non attesi).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calcolaNetto,
  calcolaContributi,
  calcolaDetrazioneLavoro,
  calcolaUlterioreDetrazione,
  calcolaSommaEsente,
  applicaScaglioni,
  curvaNetto,
} from '../src/motore.js';
import { PARAMETRI_2026 as P } from '../src/parametri.js';

const vicino = (a, b, tolleranza = 0.01) =>
  assert.ok(Math.abs(a - b) <= tolleranza, `atteso ${b}, ottenuto ${a} (delta ${Math.abs(a - b)})`);

/* ========================================================================== *
 * 1. CASI DI RIFERIMENTO
 * ========================================================================== */

test('RAL 35.000 — caso di riferimento, ogni passaggio verificato a mano', () => {
  const r = calcolaNetto({ ral: 35000, mensilita: 13 });

  // INPS: 35.000 x 9,19% = 3.216,50 (sotto la prima fascia, niente +1%)
  vicino(r.contributi.totale, 3216.5);
  vicino(r.contributi.aggiuntivo, 0);

  // Imponibile fiscale: 35.000 - 3.216,50
  vicino(r.imponibileFiscale, 31783.5);

  // IRPEF lorda: 28.000 x 23% + 3.783,50 x 33% = 6.440 + 1.248,555
  vicino(r.irpef.lorda, 7688.56);

  // Detrazione art. 13: 1.910 x (50.000 - 31.783,50) / 22.000 = 1.581,52
  vicino(r.irpef.detrazioneLavoro, 1581.52);
  // Maggiorazione c. 1.1: reddito in (25.000; 35.000] -> 65
  vicino(r.irpef.maggiorazione65, 65);
  // Ulteriore detrazione cuneo: reddito <= 32.000 -> 1.000 pieni
  vicino(r.irpef.ulterioreDetrazione, 1000);

  // IRPEF netta: 7.688,56 - 2.646,52
  vicino(r.irpef.netta, 5042.04);

  // Addizionale regionale Lombardia per scaglioni:
  // 15.000x1,23% + 13.000x1,58% + 3.783,50x1,72% = 184,50 + 205,40 + 65,08
  vicino(r.addizionali.regionale, 454.98);
  // Addizionale comunale Milano: sopra soglia 23.000 -> 0,8% sull'intero
  vicino(r.addizionali.comunale, 254.27);

  // Nessun bonus: reddito oltre 20.000
  vicino(r.bonus.totale, 0);

  vicino(r.netto.annuo, 26032.22);
  vicino(r.netto.mensile, 2002.48);

  // La stessa RAL su 12 mensilita' da' una rata piu' alta, non un netto diverso
  const r12 = calcolaNetto({ ral: 35000, mensilita: 12 });
  vicino(r12.netto.annuo, r.netto.annuo);
  vicino(r12.netto.mensile, 26032.22 / 12);
});

test('RAL 15.000 — cumulo di somma esente e trattamento integrativo', () => {
  const r = calcolaNetto({ ral: 15000, mensilita: 13 });

  vicino(r.contributi.totale, 1378.5); // 15.000 x 9,19%
  vicino(r.imponibileFiscale, 13621.5);

  // Detrazione piena 1.955 (reddito <= 15.000), nessuna maggiorazione
  vicino(r.irpef.detrazioneLavoro, 1955);
  vicino(r.irpef.maggiorazione65, 0);
  vicino(r.irpef.ulterioreDetrazione, 0); // sotto 20.000 opera la somma esente

  // Somma esente: reddito nella fascia 8.500-15.000 -> 5,3% del reddito
  assert.equal(r.bonus.sommaEsentePercentuale, 0.053);
  vicino(r.bonus.sommaEsente, 13621.5 * 0.053);

  // Trattamento integrativo pieno: IRPEF lorda 3.132,95 > 1.955 - 75
  vicino(r.bonus.trattamentoIntegrativo, 1200);

  // Sotto la soglia di esenzione comunale di Milano
  assert.equal(r.addizionali.comunale, 0);
  assert.equal(r.addizionali.comunaleEsente, true);
});

test('RAL 25.000 — ulteriore detrazione piena, addizionale comunale ancora esente', () => {
  const r = calcolaNetto({ ral: 25000, mensilita: 13 });

  vicino(r.imponibileFiscale, 22702.5);
  // 1.910 + 1.190 x (28.000 - 22.702,50) / 13.000
  vicino(r.irpef.detrazioneLavoro, 2394.93);
  vicino(r.irpef.ulterioreDetrazione, 1000);
  vicino(r.bonus.sommaEsente, 0); // reddito complessivo sopra 20.000
  assert.equal(r.addizionali.comunale, 0); // 22.702,50 <= 23.000
});

test('RAL 60.000 — terza aliquota, +1% INPS, nessuna detrazione da lavoro', () => {
  const r = calcolaNetto({ ral: 60000, mensilita: 13 });

  // 60.000 x 9,19% + (60.000 - 56.224) x 1%
  vicino(r.contributi.ivs, 5514);
  vicino(r.contributi.aggiuntivo, 37.76);
  vicino(r.contributi.totale, 5551.76);

  vicino(r.imponibileFiscale, 54448.24);
  // Reddito oltre 50.000: detrazione art. 13 azzerata e nessun cuneo
  assert.equal(r.irpef.detrazioneLavoro, 0);
  assert.equal(r.irpef.ulterioreDetrazione, 0);
  assert.equal(r.irpef.netta, r.irpef.lorda);
  // Addizionale regionale: si entra nel quarto scaglione (1,73%)
  assert.equal(r.addizionali.regionaleDettaglio.length, 4);
});

/* ========================================================================== *
 * 2. BLOCCHI ISOLATI
 * ========================================================================== */

test('applicaScaglioni e progressivo e conserva il totale', () => {
  const { totale, dettaglio } = applicaScaglioni(31783.5, P.irpef.scaglioni);
  vicino(dettaglio.reduce((s, d) => s + d.imposta, 0), totale);
  vicino(dettaglio.reduce((s, d) => s + d.imponibile, 0), 31783.5);
  assert.equal(applicaScaglioni(0, P.irpef.scaglioni).totale, 0);
  assert.equal(applicaScaglioni(-5, P.irpef.scaglioni).totale, 0);
});

test('contributi: massimale e aliquota aggiuntiva', () => {
  const sotto = calcolaContributi(50000, P);
  assert.equal(sotto.aggiuntivo, 0);

  const sopra = calcolaContributi(70000, P);
  vicino(sopra.aggiuntivo, (70000 - 56224) * 0.01);

  // Oltre il massimale i contributi si fermano
  const oltre = calcolaContributi(200000, P, { applicaMassimale: true });
  const alMassimale = calcolaContributi(P.inps.massimaleAnnuo, P, { applicaMassimale: true });
  vicino(oltre.totale, alMassimale.totale);
  assert.equal(oltre.massimaleApplicato, true);

  // Disattivandolo (iscritto ante 1996) i contributi continuano a crescere
  const senza = calcolaContributi(200000, P, { applicaMassimale: false });
  assert.ok(senza.totale > oltre.totale);
});

test('detrazione art. 13: continuita sui confini di fascia', () => {
  const d = (r) => calcolaDetrazioneLavoro(r, P, 365).base;
  vicino(d(15000), 1955);
  vicino(d(15000.01), 1910 + (1190 * (28000 - 15000.01)) / 13000, 0.02); // ~3.100 -> salto
  vicino(d(28000), 1910);
  vicino(d(28000.01), (1910 * (50000 - 28000.01)) / 22000, 0.02);
  assert.equal(d(50000), 0);
  assert.equal(d(60000), 0);

  // Maggiorazione di 65 euro solo dentro (25.000; 35.000]
  assert.equal(calcolaDetrazioneLavoro(25000, P, 365).maggiorazione, 0);
  assert.equal(calcolaDetrazioneLavoro(25000.01, P, 365).maggiorazione, 65);
  assert.equal(calcolaDetrazioneLavoro(35000, P, 365).maggiorazione, 65);
  assert.equal(calcolaDetrazioneLavoro(35000.01, P, 365).maggiorazione, 0);
});

test('detrazione art. 13: rapporto ai giorni e pavimento di 690 euro', () => {
  const meta = calcolaDetrazioneLavoro(30000, P, 182);
  const intero = calcolaDetrazioneLavoro(30000, P, 365);
  vicino(meta.base, Math.max((intero.base * 182) / 365, 690), 0.02);

  // Pochi giorni su reddito basso: interviene il minimo di 690
  const pochiGiorni = calcolaDetrazioneLavoro(10000, P, 30);
  vicino(pochiGiorni.base, 690);
});

test('ulteriore detrazione: decalage lineare tra 32.000 e 40.000', () => {
  assert.equal(calcolaUlterioreDetrazione(20000, P), 0);
  vicino(calcolaUlterioreDetrazione(20000.01, P), 1000);
  vicino(calcolaUlterioreDetrazione(32000, P), 1000);
  vicino(calcolaUlterioreDetrazione(36000, P), 500);
  vicino(calcolaUlterioreDetrazione(39000, P), 125);
  assert.equal(calcolaUlterioreDetrazione(40000, P), 0);
  assert.equal(calcolaUlterioreDetrazione(45000, P), 0);
});

test('somma esente: percentuale unica per fascia, non per scaglioni', () => {
  vicino(calcolaSommaEsente(8000, 8000, P).importo, 8000 * 0.071);
  vicino(calcolaSommaEsente(12000, 12000, P).importo, 12000 * 0.053);
  vicino(calcolaSommaEsente(18000, 18000, P).importo, 18000 * 0.048);
  // Oltre 20.000 di reddito complessivo non spetta nulla
  assert.equal(calcolaSommaEsente(20000.01, 20000.01, P).importo, 0);
});

/* ========================================================================== *
 * 3. INVARIANTI SU TUTTA LA CURVA
 * ========================================================================== */

// Punti in cui la norma cambia regime sul reddito complessivo. Sono gli unici
// posti in cui il netto puo' scendere all'aumentare del lordo: se una caduta
// compare altrove, il modello ha un bug.
const SOGLIE_DICHIARATE = [
  8500, // somma esente: 7,1% -> 5,3%
  15000, // somma esente: 5,3% -> 4,8% / detrazione art. 13 cambia formula
  20000, // fine somma esente, inizio ulteriore detrazione
  23000, // esenzione addizionale comunale Milano
  25000, // inizio maggiorazione 65 euro
  32000, // inizio decalage ulteriore detrazione
  35000, // fine maggiorazione 65 euro
  40000, // azzeramento ulteriore detrazione
  50000, // azzeramento detrazione art. 13
  56224, // prima fascia pensionabile INPS (+1%)
];

test('il netto scende solo attraversando una soglia dichiarata', () => {
  const punti = curvaNetto(1000, 200000, 50);
  const cadute = [];

  for (let i = 1; i < punti.length; i++) {
    if (punti[i].netto >= punti[i - 1].netto) continue;

    const precedente = calcolaNetto({ ral: punti[i - 1].ral });
    const corrente = calcolaNetto({ ral: punti[i].ral });
    const soglia = SOGLIE_DICHIARATE.find(
      (s) => precedente.redditoComplessivo <= s && corrente.redditoComplessivo > s,
    );

    assert.ok(
      soglia !== undefined,
      `caduta del netto non spiegata tra RAL ${punti[i - 1].ral} e ${punti[i].ral} ` +
        `(${(corrente.netto.annuo - precedente.netto.annuo).toFixed(2)} euro)`,
    );
    cadute.push(soglia);
  }

  // Le soglie che nel modello 2026 producono davvero una perdita di netto:
  // 8.500 e 15.000 (cambio di percentuale della somma esente e caduta del
  // trattamento integrativo), 23.000 (addizionale comunale Milano),
  // 35.000 (fine della maggiorazione di 65 euro).
  assert.deepEqual([...new Set(cadute)].sort((a, b) => a - b), [8500, 15000, 23000, 35000]);
});

test('i salti alle soglie valgono esattamente quanto vale l agevolazione persa', () => {
  // Il valore del salto e' la firma del modello: se cambia, e' cambiata una
  // regola. Misurato a cavallo esatto della soglia, non su un intervallo.
  const ralPer = (redditoComplessivo) => redditoComplessivo / (1 - P.inps.aliquotaIvs);
  const salto = (ral) =>
    calcolaNetto({ ral: ral + 0.02 }).netto.annuo - calcolaNetto({ ral: ral - 0.02 }).netto.annuo;

  vicino(salto(ralPer(8500)), -152.96, 0.5); // somma esente 7,1% -> 5,3%
  vicino(salto(ralPer(15000)), -129.97, 0.5); // fine trattamento integrativo
  vicino(salto(ralPer(23000)), -183.96, 0.5); // addizionale comunale Milano
  vicino(salto(ralPer(35000)), -64.98, 0.5); // fine maggiorazione 65 euro

  // Salto in salita: la capienza del trattamento integrativo
  // (IRPEF lorda > detrazione art. 13 - 75) vale 1.200 euro tutti insieme.
  const ralCapienza =
    ((P.detrazioneLavoroDipendente.fasce[0].base - P.trattamentoIntegrativo.scartoCapienza) /
      P.irpef.scaglioni[0].aliquota) /
    (1 - P.inps.aliquotaIvs);
  vicino(salto(ralCapienza), 1200, 1);
});

test('la trappola della soglia comunale: serve un aumento minimo per non perderci', () => {
  // RAL che porta l'imponibile esattamente a 23.000
  const ralSoglia = P.addizionaleComunale.sogliaEsenzione / (1 - P.inps.aliquotaIvs);
  const prima = calcolaNetto({ ral: Math.floor(ralSoglia) });
  const dopo = calcolaNetto({ ral: Math.floor(ralSoglia) + 1 });

  assert.equal(prima.addizionali.comunale, 0);
  assert.ok(dopo.addizionali.comunale > 0);
  // Un euro di lordo in piu' costa ~184 euro di netto: e' l'effetto soglia
  // che va mostrato all'utente, non nascosto.
  assert.ok(prima.netto.annuo - dopo.netto.annuo > 150);
});

test('la soglia comunale di 23.000 di imponibile produce un salto atteso', () => {
  // Imponibile 23.000 <=> RAL 23.000 / (1 - 9,19%)
  const ralSoglia = 23000 / (1 - P.inps.aliquotaIvs);
  const sotto = calcolaNetto({ ral: Math.floor(ralSoglia) - 5 });
  const sopra = calcolaNetto({ ral: Math.ceil(ralSoglia) + 5 });
  assert.equal(sotto.addizionali.comunale, 0);
  assert.ok(sopra.addizionali.comunale > 180); // ~23.000 x 0,8%
});

test('coerenza contabile: netto = RAL - trattenute + bonus, per ogni RAL', () => {
  for (const ral of [0, 8000, 15000, 20000, 23000, 28000, 32000, 40000, 50000, 60000, 130000]) {
    const r = calcolaNetto({ ral });
    vicino(r.netto.annuo, ral - r.totali.trattenute + r.totali.bonus);
    vicino(r.totali.trattenute, r.contributi.totale + r.irpef.netta + r.addizionali.totale);
    assert.ok(r.irpef.netta >= 0, 'IRPEF netta mai negativa');
    assert.ok(r.netto.annuo <= ral + r.totali.bonus);
  }
});

test('RAL nulla o non valida non rompe il calcolo', () => {
  for (const ral of [0, -100, NaN, null, undefined, '']) {
    const r = calcolaNetto({ ral });
    assert.equal(r.netto.annuo, 0);
    assert.equal(r.irpef.netta, 0);
  }
});
