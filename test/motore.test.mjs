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
  calcolaDetrazioniFamiliari,
  calcolaTrattamentoIntegrativo,
  applicaScaglioni,
  curvaNetto,
  tronca,
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

  // Detrazione art. 13 lett. c): il rapporto (50.000 - 31.783,50) / 22.000 vale
  // 0,82802272… e la norma lo vuole assunto nelle prime quattro cifre decimali
  // (art. 13 c. 6 TUIR), quindi 0,8280. Detrazione = 1.910 x 0,8280 = 1.581,48.
  vicino(r.irpef.detrazioneLavoro, 1581.48);
  // Maggiorazione c. 1.1: reddito in (25.000; 35.000] -> 65
  vicino(r.irpef.maggiorazione65, 65);
  // Ulteriore detrazione cuneo: reddito <= 32.000 -> 1.000 pieni
  vicino(r.irpef.ulterioreDetrazione, 1000);

  // IRPEF netta: 7.688,56 - 2.646,48
  vicino(r.irpef.netta, 5042.08);

  // Addizionale regionale Lombardia per scaglioni:
  // 15.000x1,23% + 13.000x1,58% + 3.783,50x1,72% = 184,50 + 205,40 + 65,08
  vicino(r.addizionali.regionale, 454.98);
  // Addizionale comunale Milano: sopra soglia 23.000 -> 0,8% sull'intero
  vicino(r.addizionali.comunale, 254.27);

  // Nessun bonus: reddito oltre 20.000
  vicino(r.bonus.totale, 0);

  vicino(r.netto.annuo, 26032.18);
  vicino(r.netto.mensile, 2002.48);

  // La stessa RAL su 12 mensilita' da' una rata piu' alta, non un netto diverso
  const r12 = calcolaNetto({ ral: 35000, mensilita: 12 });
  vicino(r12.netto.annuo, r.netto.annuo);
  vicino(r12.netto.mensile, 26032.18 / 12);
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
  // 1.910 + 1.190 x tronca((28.000 - 22.702,50) / 13.000, 4) = 1.910 + 1.190 x 0,4075.
  // Qui il rapporto e' gia' esatto alla quarta cifra, quindi il troncamento non morde.
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

test('il rapporto dell art. 13 e assunto nelle prime quattro cifre decimali', () => {
  // Art. 13 c. 6 TUIR (c. 8 nel testo unico riordinato): "Se il risultato dei
  // rapporti indicati ai commi 1, 3, 4 e 5 e' maggiore di zero, lo stesso si
  // assume nelle prime quattro cifre decimali".
  assert.equal(tronca(0.82802272727, 4), 0.828);
  assert.equal(tronca(0.91057727, 4), 0.9105); // si tronca, non si arrotonda
  assert.equal(tronca(0.4075, 4), 0.4075);

  // Sul caso di riferimento la regola vale 4 centesimi di detrazione: poco, ma
  // e' la differenza fra il numero del cedolino e un numero verosimile.
  const conRegola = calcolaDetrazioneLavoro(31783.5, P, 365).base;
  const senzaRegola = (1910 * (50000 - 31783.5)) / 22000;
  vicino(conRegola, 1581.48);
  assert.ok(senzaRegola - conRegola > 0.03 && senzaRegola - conRegola < 0.05);

  // La regola NON si applica al decalage del cuneo: il comma la limita ai
  // rapporti dell'art. 13, e l'ulteriore detrazione sta in un altro comma.
  vicino(calcolaUlterioreDetrazione(36000, P, 365), 500);
});

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
  const q = (x) => tronca(x, P.detrazioneLavoroDipendente.cifreDecimaliRapporto);
  vicino(d(15000), 1955);
  vicino(d(15000.01), 1910 + 1190 * q((28000 - 15000.01) / 13000), 0.02); // ~3.100 -> salto
  vicino(d(28000), 1910);
  vicino(d(28000.01), 1910 * q((50000 - 28000.01) / 22000), 0.02);
  assert.equal(d(50000), 0);
  assert.equal(d(60000), 0);

  // Maggiorazione di 65 euro solo dentro (25.000; 35.000]
  assert.equal(calcolaDetrazioneLavoro(25000, P, 365).maggiorazione, 0);
  assert.equal(calcolaDetrazioneLavoro(25000.01, P, 365).maggiorazione, 65);
  assert.equal(calcolaDetrazioneLavoro(35000, P, 365).maggiorazione, 65);
  assert.equal(calcolaDetrazioneLavoro(35000.01, P, 365).maggiorazione, 0);
});

test('detrazione art. 13: rapporto ai giorni, e il minimo vale solo nella prima fascia', () => {
  // Il ragguaglio ai giorni e' lineare...
  const meta = calcolaDetrazioneLavoro(30000, P, 182);
  const intero = calcolaDetrazioneLavoro(30000, P, 365);
  vicino(meta.base, (intero.base * 182) / 365, 0.02);

  // ...e NON e' protetto da alcun pavimento sopra i 15.000 di reddito: i minimi
  // di 690 e 1.380 euro stanno dentro la LETTERA a) dell'art. 13 c. 1, quindi
  // valgono solo per redditi fino a 15.000. Lo schema della circ. 4/E/2025 li
  // riporta infatti nella sola prima riga della tabella.
  // Regressione: prima il minimo si applicava a tutte le fasce e questo caso
  // restituiva 690 invece di 325,29.
  vicino(
    calcolaDetrazioneLavoro(36324, P, 100).base,
    ((1910 * tronca((50000 - 36324) / 22000, 4)) * 100) / 365,
    0.02,
  );

  // Dentro la prima fascia il pavimento interviene davvero
  vicino(calcolaDetrazioneLavoro(10000, P, 30).base, 690);
  vicino(calcolaDetrazioneLavoro(10000, P, 30, true).base, 1380); // tempo determinato

  // Il minimo non puo' superare la detrazione teorica spettante
  const soglia = P.detrazioneLavoroDipendente.fasce[0].fino;
  assert.equal(calcolaDetrazioneLavoro(soglia + 1, P, 1).base > 0, true);
  assert.ok(calcolaDetrazioneLavoro(soglia + 1, P, 1).base < 690, 'sopra 15.000 nessun pavimento');
});

test('ulteriore detrazione: decalage lineare tra 32.000 e 40.000', () => {
  const d = (r, giorni = 365) => calcolaUlterioreDetrazione(r, P, giorni);
  assert.equal(d(20000), 0);
  vicino(d(20000.01), 1000);
  vicino(d(32000), 1000);
  vicino(d(36000), 500);
  vicino(d(39000), 125);
  assert.equal(d(40000), 0);
  assert.equal(d(45000), 0);

  // L. 207/2024 c. 6: la detrazione e' rapportata al periodo di lavoro
  vicino(d(25000, 182), (1000 * 182) / 365);
});

test('somma esente: percentuale unica per fascia, non per scaglioni', () => {
  const s = (r, giorni = 365) => calcolaSommaEsente(r, r, P, giorni);
  vicino(s(8000).importo, 8000 * 0.071);
  vicino(s(12000).importo, 12000 * 0.053);
  vicino(s(18000).importo, 18000 * 0.048);
  // Oltre 20.000 di reddito complessivo non spetta nulla
  assert.equal(s(20000.01).importo, 0);

  // Se fosse un calcolo per scaglioni, su 18.000 darebbe circa 1.092:
  // la norma dice "la percentuale corrispondente", al singolare.
  assert.ok(Math.abs(s(18000).importo - 1092) > 200);
});

test('somma esente: la percentuale si individua sul reddito annuale teorico', () => {
  // Circ. 4/E/2025 par. 1.2, esempio 1: 2.000 euro percepiti in 62 giorni.
  // Reddito annuale teorico = 2.000 / 62 x 365 = 11.774,19 -> fascia 5,3%,
  // applicata pero' ai 2.000 effettivamente percepiti.
  const r = calcolaSommaEsente(6000, 2000, P, 62);
  vicino(r.redditoAnnualeTeorico, (2000 * 365) / 62, 0.01);
  assert.equal(r.percentuale, 0.053);
  vicino(r.importo, 2000 * 0.053);

  // Senza il rapporto all'anno la fascia sarebbe stata il 7,1% (2.000 < 8.500)
  // e l'importo quasi il doppio: e' esattamente l'errore che la regola evita.
  assert.notEqual(r.percentuale, 0.071);
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
  // 8.500 (cambio di percentuale della somma esente e uscita dalla no tax
  // area, che fa scattare le addizionali), 15.000 (caduta del trattamento
  // integrativo), 23.000 (addizionale comunale Milano), 35.000 (fine della
  // maggiorazione di 65 euro).
  assert.deepEqual([...new Set(cadute)].sort((a, b) => a - b), [8500, 15000, 23000, 35000]);
});

test('i salti alle soglie valgono esattamente quanto vale l agevolazione persa', () => {
  // Il valore del salto e' la firma del modello: se cambia, e' cambiata una
  // regola. Misurato a cavallo esatto della soglia, non su un intervallo.
  const ralPer = (redditoComplessivo) => redditoComplessivo / (1 - P.inps.aliquotaIvs);
  const salto = (ral) =>
    calcolaNetto({ ral: ral + 0.02 }).netto.annuo - calcolaNetto({ ral: ral - 0.02 }).netto.annuo;

  vicino(salto(ralPer(8500)), -152.96, 0.5); // somma esente 7,1% -> 5,3%

  // Uscita dalla no tax area, praticamente nello stesso punto: l'IRPEF diventa
  // dovuta e con essa le addizionali, sull'intero imponibile.
  let sotto = 8000;
  let sopra = 12000;
  for (let i = 0; i < 60; i++) {
    const meta = (sotto + sopra) / 2;
    if (calcolaNetto({ ral: meta }).irpef.netta > 0) sopra = meta;
    else sotto = meta;
  }
  vicino(salto(sopra), -104.53, 0.5);
  vicino(salto(ralPer(15000)), -130.09, 0.5); // fine trattamento integrativo
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

test('nella no tax area le addizionali non sono dovute', () => {
  // Fino a 8.500 di reddito la detrazione art. 13 (1.955) azzera l'IRPEF,
  // perche' 8.500 x 23% = 1.955 esatti: e' la "no tax area". Senza imposta
  // non sono dovute nemmeno le addizionali (art. 50 c. 2 D.Lgs. 446/1997 per
  // la regionale, art. 1 c. 4 D.Lgs. 360/1998 per la comunale).
  const soglia = P.detrazioneLavoroDipendente.fasce[0].base / P.irpef.scaglioni[0].aliquota;
  vicino(soglia, 8500, 0.01);

  const dentro = calcolaNetto({ ral: 9000 });
  assert.equal(dentro.irpef.netta, 0);
  assert.equal(dentro.addizionali.totale, 0);
  assert.equal(dentro.addizionali.nonDovutePerImpostaZero, true);

  const fuori = calcolaNetto({ ral: 9500 });
  assert.ok(fuori.irpef.netta > 0);
  assert.ok(fuori.addizionali.regionale > 0);
  assert.equal(fuori.addizionali.nonDovutePerImpostaZero, false);

  // La regola vale solo per capienza nulla: appena l'IRPEF e' dovuta, anche
  // per pochi centesimi, le addizionali si pagano sull'intero imponibile.
  assert.ok(fuori.addizionali.regionale > 100);
});

test('finestra 8.174-8.500: nessuna imposta ma trattamento integrativo pieno', () => {
  // La condizione di spettanza del trattamento integrativo guarda l'imposta
  // LORDA, non la netta: lorda > detrazione - 75, cioe' reddito superiore a
  // 1.880 / 23% = 8.173,91. La no tax area finisce invece a 1.955 / 23% =
  // 8.500. Nella finestra fra i due valori non si paga IRPEF (ne' addizionali)
  // e il trattamento integrativo spetta comunque, per intero. Lo scarto di 75
  // euro esiste esattamente per creare questa finestra.
  const detrazione = P.detrazioneLavoroDipendente.fasce[0].base;
  const aliquota = P.irpef.scaglioni[0].aliquota;
  const daReddito = (r) => r / (1 - P.inps.aliquotaIvs);

  vicino((detrazione - P.trattamentoIntegrativo.scartoCapienza) / aliquota, 8173.91, 0.01);
  vicino(detrazione / aliquota, 8500, 0.01);

  const dentro = calcolaNetto({ ral: daReddito(8300) });
  assert.equal(dentro.irpef.netta, 0);
  assert.equal(dentro.addizionali.totale, 0);
  assert.equal(dentro.bonus.trattamentoIntegrativo, 1200);

  // Sotto la finestra: nessuna imposta e nessun trattamento integrativo
  const sotto = calcolaNetto({ ral: daReddito(8100) });
  assert.equal(sotto.irpef.netta, 0);
  assert.equal(sotto.bonus.trattamentoIntegrativo, 0);

  // Sopra la no tax area: imposta dovuta e trattamento integrativo ancora pieno
  const sopra = calcolaNetto({ ral: daReddito(9000) });
  assert.ok(sopra.irpef.netta > 0);
  assert.equal(sopra.bonus.trattamentoIntegrativo, 1200);
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
    const r = calcolaNetto({ ral, oneriDeducibili: ral > 0 ? 500 : 0 });
    vicino(
      r.netto.annuo,
      ral - r.totali.trattenute - r.totali.oneriDeducibili + r.totali.bonus,
    );
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

test('i confini del cuneo sono quelli scritti nella norma, estremi compresi', () => {
  // L. 207/2024 art. 1 cc. 4-6, letti in originale. Il testo distingue "non
  // superiore a X" da "superiore a X": e' la differenza fra un <= e un <, e su
  // un estremo esatto vale l'intera misura. Le due misure si danno il cambio a
  // 20.000 senza sovrapporsi (il contribuente prenderebbe due volte) ne'
  // lasciare vuoti (non prenderebbe nulla): questo test tiene fermo il cambio.
  const se = (r) => calcolaSommaEsente(r, r, P, 365);
  const ud = (r) => calcolaUlterioreDetrazione(r, P, 365);

  // c. 4 lett. a-c: le tre percentuali, ognuna sul proprio estremo superiore
  assert.equal(se(8500).percentuale, 0.071, 'a 8.500 esatti: "non superiore a 8.500"');
  assert.equal(se(8500.01).percentuale, 0.053);
  assert.equal(se(15000).percentuale, 0.053, 'a 15.000 esatti: "ma non a 15.000"');
  assert.equal(se(15000.01).percentuale, 0.048);

  // c. 4 vs c. 6: "non superiore a 20.000" contro "superiore a 20.000"
  assert.ok(se(20000).importo > 0, 'a 20.000 esatti la somma esente spetta');
  assert.equal(ud(20000), 0, 'a 20.000 esatti la detrazione non spetta');
  assert.equal(se(20000.01).importo, 0);
  assert.ok(ud(20000.01) > 0, 'un centesimo sopra, il cambio e\' avvenuto');

  // c. 6 lett. a-b: 1.000 pieni fino a 32.000, poi il decalage sui 8.000 finali
  assert.equal(ud(32000), 1000, 'a 32.000 esatti: "ma non a 32.000"');
  assert.equal(ud(36000), 500, 'meta\' esatta del decalage: 1.000 x (40.000-36.000)/8.000');
  assert.equal(ud(40000), 0, 'a 40.000 il decalage e\' arrivato a zero');
  assert.equal(ud(40000.01), 0);
});

test('trattamento integrativo: i confini del D.L. 3/2020, letti nell originale', () => {
  const lorda = (r) => applicaScaglioni(r, P.irpef.scaglioni).totale;
  const ti = (r, giorni = 365) =>
    calcolaTrattamentoIntegrativo(
      r,
      lorda(r),
      { articolo13Comma1: calcolaDetrazioneLavoro(r, P, giorni).base },
      P,
      giorni,
    );

  // c. 1, primo periodo: "se il reddito complessivo NON E' SUPERIORE a 15.000
  // euro". A 15.000 esatti spetta ancora, per intero.
  assert.equal(ti(15000), P.trattamentoIntegrativo.importo);
  assert.equal(ti(15000.01), 0, 'un centesimo sopra si cambia fascia');

  // c. 1, secondo e terzo periodo: fra 15.000 e 28.000 spetta per la differenza
  // fra la somma delle detrazioni elencate e l'imposta lorda. Quelle voci sono
  // quasi tutte oneri detraibili per spese sostenute fino al 31/12/2021, che il
  // modello non rappresenta. Resta la sola detrazione dell'art. 13 c. 1, che
  // l'imposta lorda supera sempre: SENZA FAMILIARI A CARICO la seconda fascia
  // vale zero non per caso ma per costruzione. Con familiari a carico si
  // accende davvero, perche' l'art. 12 e' nella lista della norma: lo verifica
  // il test dedicato piu' avanti. Qui si tiene ferma la RAGIONE, non solo il
  // risultato.
  for (let r = 15100; r <= 28000; r += 100) {
    assert.ok(
      calcolaDetrazioneLavoro(r, P, 365).base < lorda(r),
      `a ${r} la detrazione dell'art. 13 supererebbe l'imposta lorda: la seconda fascia si accenderebbe`,
    );
    assert.equal(ti(r), 0);
  }
  assert.equal(ti(28000.01), 0, 'oltre 28.000 non spetta in nessun caso');

  // c. 1: la condizione rinvia alla detrazione "ai sensi dell'articolo 13,
  // COMMA 1", quindi senza la maggiorazione di 65 euro del c. 1.1. Le due
  // grandezze si sovrappongono fra 25.000 e 28.000, dove la maggiorazione
  // esiste: il motore passa alla funzione la base e non il totale. In questo
  // perimetro la scelta e' inerte, perche' li' la seconda fascia vale zero con
  // entrambe; diventerebbe viva appena il modello rappresentasse degli oneri
  // detraibili. Il test documenta che le due grandezze sono davvero diverse.
  const d = calcolaDetrazioneLavoro(26000, P, 365);
  assert.equal(d.maggiorazione, P.detrazioneLavoroDipendente.maggiorazione.importo);
  assert.notEqual(d.base, d.totale);
});

test('detrazioni per carichi di famiglia: le tre lettere dell art. 12', () => {
  const d = (rc, fam) => calcolaDetrazioniFamiliari(rc, fam, P);
  const F = P.detrazioniFamiliari;

  // c. 1 lett. a) n. 1: 800 - 110 x (reddito / 15.000), sotto i 15.000
  vicino(d(10000, { coniugeACarico: true }).coniuge, 726.67, 0.01);

  // c. 4, primo periodo: se quel rapporto vale UNO l'importo e' fisso, non la
  // formula. A 15.000 esatti i due percorsi darebbero comunque 690, ma la norma
  // detta l'esito e il motore lo segue alla lettera invece di dedurlo.
  assert.equal(d(15000, { coniugeACarico: true }).coniuge, F.coniuge.importoRapportoUno);

  // c. 4, secondo periodo: rapporto zero -> non compete. Vale a reddito nullo
  // (lett. a n. 1) e alla soglia degli 80.000 (lett. a n. 3).
  assert.equal(d(0, { coniugeACarico: true }).coniuge, 0);
  assert.equal(d(80000, { coniugeACarico: true }).coniuge, 0);

  // c. 1 lett. a) n. 2: importo fisso nella fascia centrale...
  assert.equal(d(20000, { coniugeACarico: true }).coniuge, F.coniuge.secondaFascia.base);
  // ...ma la lett. b) lo maggiora a scaglioni stretti, di pochi euro
  assert.equal(d(30000, { coniugeACarico: true }).coniuge, F.coniuge.secondaFascia.base + 20);
  assert.equal(d(34800, { coniugeACarico: true }).coniuge, F.coniuge.secondaFascia.base + 30);
  assert.equal(d(35200, { coniugeACarico: true }).coniuge, F.coniuge.secondaFascia.base + 10);
  assert.equal(d(35201, { coniugeACarico: true }).coniuge, F.coniuge.secondaFascia.base);

  // c. 1 lett. a) n. 3: decalage lineare fino a 80.000
  vicino(d(60000, { coniugeACarico: true }).coniuge, 345, 0.01);

  // c. 1 lett. c): il riferimento cresce di 15.000 "per ogni figlio successivo
  // al primo", e la crescita vale per TUTTI i figli, non solo per quelli in piu'.
  // Due figli a 30.000: (110.000 - 30.000) / 110.000 = 0,7272 troncato.
  vicino(d(30000, { figliACarico: 2, quotaFigli: 1 }).figli, 1381.68, 0.01);
  // Con la quota di legge del 50% l'importo si dimezza.
  vicino(d(30000, { figliACarico: 2, quotaFigli: 0.5 }).figli, 690.84, 0.01);

  // c. 4, terzo periodo: per figli e ascendenti il rapporto "uguale a uno" non
  // da' detrazione. Succede a reddito zero, ed e' controintuitivo abbastanza da
  // meritare un test: chi non ha reddito non prende la detrazione piu' alta,
  // non ne prende nessuna.
  assert.equal(d(0, { figliACarico: 2 }).figli, 0);
  assert.equal(d(0, { ascendentiConviventi: 1 }).ascendenti, 0);

  // c. 1 lett. d): 750 x (80.000 - reddito) / 80.000
  vicino(d(30000, { ascendentiConviventi: 1 }).ascendenti, 468.75, 0.01);
  vicino(d(30000, { ascendentiConviventi: 2 }).ascendenti, 937.5, 0.01);
});

test('le detrazioni dell art. 12 non seguono il periodo di LAVORO', () => {
  // Differenza sostanziale rispetto all'art. 13, e facile da sbagliare: la
  // detrazione da lavoro dipendente si rapporta ai giorni lavorati, quella per
  // carichi di famiglia ai mesi in cui il familiare e' a carico (art. 12 c. 3).
  // Chi lavora cento giorni ha comunque il coniuge a carico tutto l'anno.
  const intero = calcolaNetto({ ral: 35000, coniugeACarico: true }, P);
  const parziale = calcolaNetto({ ral: 35000, giorniLavorati: 100, coniugeACarico: true }, P);

  assert.ok(parziale.irpef.detrazioneLavoro < intero.irpef.detrazioneLavoro, 'art. 13 ragguagliato');
  assert.equal(
    parziale.irpef.familiari.coniuge,
    calcolaDetrazioniFamiliari(parziale.redditoComplessivo, { coniugeACarico: true }, P).coniuge,
    'art. 12 non ragguagliato ai giorni di lavoro',
  );
});

test('con familiari a carico la seconda fascia del trattamento integrativo si accende', () => {
  // Il complemento del test precedente sul D.L. 3/2020: senza familiari la
  // somma delle detrazioni elencate sta sempre sotto l'imposta lorda e la
  // seconda fascia vale zero. Con familiari a carico no, perche' l'art. 12
  // e' nella lista della norma insieme all'art. 13 c. 1.
  const famiglia = { coniugeACarico: true, figliACarico: 2, quotaFigli: 1 };
  const senza = calcolaNetto({ ral: 20000 }, P);
  const con = calcolaNetto({ ral: 20000, ...famiglia }, P);

  assert.equal(senza.bonus.trattamentoIntegrativo, 0);
  vicino(con.bonus.trattamentoIntegrativo, 909.33, 0.02);

  // E' esattamente la differenza fra le due detrazioni elencate e l'imposta
  // lorda: la norma dice "pari alla differenza", non un importo forfettario.
  vicino(
    con.bonus.trattamentoIntegrativo,
    con.irpef.detrazioneLavoro + con.irpef.familiari.totale - con.irpef.lorda,
    0.02,
  );

  // L'ulteriore detrazione del cuneo NON e' nella lista della norma: a 24.000
  // l'IRPEF netta e' zero grazie a quella, ma il trattamento resta zero.
  const a24 = calcolaNetto({ ral: 24000, ...famiglia }, P);
  assert.equal(a24.irpef.netta, 0);
  assert.equal(a24.bonus.trattamentoIntegrativo, 0);
});

test('gli oneri deducibili abbassano la base, non l imposta', () => {
  // Art. 10 TUIR. Effetto meno ovvio ma reale: abbassando il reddito
  // complessivo spostano anche le soglie di cuneo, detrazioni e addizionali.
  const senza = calcolaNetto({ ral: 35000 }, P);
  const con = calcolaNetto({ ral: 35000, oneriDeducibili: 3000 }, P);

  vicino(con.imponibileFiscale, senza.imponibileFiscale - 3000, 0.01);
  assert.ok(con.irpef.lorda < senza.irpef.lorda);
  // La detrazione da lavoro dipendente CRESCE, perche' e' decrescente col reddito
  assert.ok(con.irpef.detrazioneLavoro > senza.irpef.detrazioneLavoro);
  // e l'ulteriore detrazione del cuneo pure, perche' il reddito scende sotto i 32.000
  assert.ok(con.irpef.ulterioreDetrazione >= senza.irpef.ulterioreDetrazione);

  // Il vantaggio e' il RISPARMIO D'IMPOSTA, non l'importo dedotto.
  const risparmio = senza.totali.imposte - con.totali.imposte;
  vicino(risparmio, 1325.93, 0.02);

  // E il netto in busta SCENDE, perche' i 3.000 escono comunque: chi versa a un
  // fondo pensione ha meno soldi sul conto e piu' soldi nel fondo. Un modello
  // che mostrasse il netto in salita starebbe regalando la deduzione.
  vicino(con.netto.annuo, senza.netto.annuo - 3000 + risparmio, 0.02);
  assert.ok(con.netto.annuo < senza.netto.annuo);
});

test('tempo determinato: il minimo dell art. 13 vale il doppio, ma solo dove morde', () => {
  // Art. 13 c. 1 lett. a): i minimi di 690 e 1.380 stanno DENTRO la lettera,
  // quindi valgono per i soli redditi fino a 15.000. E sono minimi: mordono solo
  // quando la detrazione rapportata scende sotto di loro, cioe' su un rapporto
  // parziale. Su un anno intero il tipo di contratto non sposta un euro, ed e'
  // una risposta piu' utile di un campo in piu'.
  const netto = (o) => calcolaNetto({ ral: 13000, ...o }, P).netto.annuo;

  assert.equal(netto({}), netto({ tipoContratto: 'determinato' }), 'anno intero: nessuna differenza');

  const ind = calcolaNetto({ ral: 13000, giorniLavorati: 100 }, P);
  const det = calcolaNetto({ ral: 13000, giorniLavorati: 100, tipoContratto: 'determinato' }, P);
  assert.equal(ind.irpef.detrazioneLavoro, P.detrazioneLavoroDipendente.minimoTempoIndeterminato);
  assert.equal(det.irpef.detrazioneLavoro, P.detrazioneLavoroDipendente.minimoTempoDeterminato);
  assert.ok(det.netto.annuo > ind.netto.annuo, 'a termine e anno parziale: netto piu alto');

  // Sopra i 15.000 la lettera a) non si applica piu' e i minimi spariscono,
  // qualunque sia il contratto: e' l'errore che il modello aveva davvero fatto.
  const sopra = (o) => calcolaNetto({ ral: 25000, giorniLavorati: 100, ...o }, P).irpef.detrazioneLavoro;
  assert.equal(sopra({}), sopra({ tipoContratto: 'determinato' }));
});

test('l apprendistato eredita il minimo del tempo indeterminato, non quello doppio', () => {
  // Art. 41 c. 1 D.Lgs. 81/2015: "l'apprendistato e' un contratto di lavoro a
  // tempo indeterminato". Da quella riga dipende quale dei due minimi dell'art.
  // 13 c. 1 lett. a) si applica, e sbagliarla varrebbe 690 euro su un rapporto
  // parziale. Il test la tiene ferma anche se un giorno l'aliquota arrivera'.
  // Il reddito va tenuto uguale fra i tre: l'apprendista ha meno contributi e
  // quindi piu' imponibile, e il confronto sui minimi vuole la stessa base.
  const P2 = { ...P, inps: { ...P.inps, aliquotaIvsApprendista: P.inps.aliquotaIvs } };
  const opz = { ral: 13000, giorniLavorati: 100 };

  const appr = calcolaNetto({ ...opz, tipoContratto: 'apprendistato' }, P2);
  const ind = calcolaNetto({ ...opz, tipoContratto: 'indeterminato' }, P2);
  const det = calcolaNetto({ ...opz, tipoContratto: 'determinato' }, P2);

  assert.equal(appr.irpef.detrazioneLavoro, ind.irpef.detrazioneLavoro);
  assert.notEqual(appr.irpef.detrazioneLavoro, det.irpef.detrazioneLavoro);
});

test('apprendistato: aliquota ridotta, e il netto sale di conseguenza', () => {
  // INPS circ. 108/2018 par. 3.3: l'aliquota a carico dell'apprendista e' il
  // 5,84%, non il 9,19% ordinario. E' l'unica differenza contributiva del
  // modello, e si propaga: meno contributi -> imponibile piu' alto -> piu'
  // imposta, ma il saldo resta ampiamente positivo per il lavoratore.
  const ord = calcolaNetto({ ral: 35000 }, P);
  const app = calcolaNetto({ ral: 35000, tipoContratto: 'apprendistato' }, P);

  vicino(app.contributi.totale, 35000 * P.inps.aliquotaIvsApprendista, 0.01);
  assert.ok(app.imponibileFiscale > ord.imponibileFiscale, 'meno contributi, piu imponibile');
  assert.ok(app.irpef.lorda > ord.irpef.lorda, 'e quindi piu imposta lorda');
  assert.ok(app.netto.annuo > ord.netto.annuo, 'ma il netto sale comunque');

  // Il risparmio contributivo lordo e' 3,35 punti di RAL; il netto ne trattiene
  // meno, perche' una parte torna allo Stato come imposta sul maggiore
  // imponibile. E' lo stesso meccanismo degli oneri deducibili, al contrario.
  const risparmioContributi = ord.contributi.totale - app.contributi.totale;
  const guadagnoNetto = app.netto.annuo - ord.netto.annuo;
  assert.ok(guadagnoNetto > 0 && guadagnoNetto < risparmioContributi);
});

test('le agevolazioni regionali per carichi di famiglia sono abrogate: i figli non toccano l addizionale', () => {
  // L'art. 72 della l.r. 10/2003, letto per intero sul testo consolidato, si
  // esaurisce nella tabella delle aliquote: i commi 1-bis e 1-ter sono stati
  // abrogati dall'art. 12 c. 1 lett. c) della l.r. 26/2020, il c. 2 dall'art. 1
  // c. 1 lett. b) della l.r. 5/2022. Le aliquote agevolate per famiglie
  // numerose o figli con disabilita' che guide e schede riportano ancora non
  // hanno base nel testo vigente 2026: il modello le aveva implementate su quel
  // consenso — dichiarando la fonte non verificata — e le ha RIMOSSE alla
  // lettura dell'atto. Questo test impedisce che rientrino da una guida invece
  // che da una legge: i figli cambiano le detrazioni, mai l'addizionale.
  const base = calcolaNetto({ ral: 45000 }, P); // imponibile 40.864,50
  const conFigli = calcolaNetto({ ral: 45000, figliACarico: 3 }, P);

  vicino(base.addizionali.regionale, 611.17); // scaglioni ordinari
  vicino(conFigli.addizionali.regionale, 611.17); // identica: nessuna agevolazione
  vicino(conFigli.addizionali.comunale, base.addizionali.comunale);
  assert.ok(conFigli.irpef.familiari.figli > 0, 'le detrazioni per figli restano');

  // E il blocco dei parametri non deve riacquistare un ramo "agevolazioni"
  // senza che una fonte letta lo giustifichi.
  assert.equal(P.addizionaleRegionale.agevolazioni, undefined);
});

test('il motore vincola i giorni al calendario fiscale, come la UI', () => {
  // L'anno fiscale e' di 365 giorni per convenzione (circ. 326/E/1997). Il
  // motore e' la parte riusabile del progetto: senza questo vincolo un
  // chiamante con giorni=400 otterrebbe una detrazione rapportata SUPERIORE
  // a quella teorica (2.142 invece di 1.955) e un reddito annuale teorico
  // della somma esente sgonfiato — numeri sbagliati con l'aria di essere giusti.
  const r400 = calcolaNetto({ ral: 40000, giorniLavorati: 400 }, P);
  const r365 = calcolaNetto({ ral: 40000, giorniLavorati: 365 }, P);
  assert.equal(r400.input.giorniLavorati, 365);
  vicino(r400.netto.annuo, r365.netto.annuo);
  vicino(r400.irpef.detrazioneLavoro, r365.irpef.detrazioneLavoro);

  const negativi = calcolaNetto({ ral: 40000, giorniLavorati: -5 }, P);
  const unGiorno = calcolaNetto({ ral: 40000, giorniLavorati: 1 }, P);
  assert.equal(negativi.input.giorniLavorati, 1);
  vicino(negativi.netto.annuo, unGiorno.netto.annuo);
});

test('l aliquota marginale e la derivata del netto: le due catene non possono divergere', () => {
  // aliquotaMarginale usa una versione ridotta della catena (calcolaNettoSemplice)
  // per evitare la ricorsione. E' una seconda implementazione, e una seconda
  // implementazione puo' scollarsi dalla prima in silenzio: se una regola nuova
  // entra in calcolaNetto e non li', la curva marginale mente. Questo test
  // confronta la marginale con la derivata discreta del netto vero, su piu'
  // combinazioni di opzioni e su RAL scelte LONTANO dalle soglie, dove gli
  // arrotondamenti al centesimo non possono spostare un confine di fascia.
  const casi = [
    {},
    { coniugeACarico: true, figliACarico: 1 },
    { tipoContratto: 'apprendistato', giorniLavorati: 200 },
    { applicaMassimale: false },
    { oneriDeducibili: 2000 },
  ];
  const rals = [8000, 12000, 18000, 22000, 30000, 36000, 45000, 58000, 90000, 150000];
  for (const opzioni of casi) {
    for (const ral of rals) {
      const qui = calcolaNetto({ ...opzioni, ral }, P);
      const dopo = calcolaNetto({ ...opzioni, ral: ral + 100 }, P);
      const derivata = 1 - (dopo.netto.annuo - qui.netto.annuo) / 100;
      vicino(qui.indici.aliquotaMarginale, derivata, 0.002);
    }
  }
});

test('un contratto senza aliquota ferma il motore invece di farlo inventare', () => {
  // Il guardiano che ha tenuto il modello onesto finche' la fonte mancava, e che
  // resta come rete: se un domani si aggiunge un contratto con un regime proprio
  // e ci si dimentica del parametro, il calcolo si ferma invece di ripiegare in
  // silenzio sull'aliquota ordinaria e restituire un netto plausibile e falso.
  const senzaFonte = { ...P, inps: { ...P.inps, aliquotaIvsApprendista: null } };
  assert.throws(
    () => calcolaNetto({ ral: 20000, tipoContratto: 'apprendistato' }, senzaFonte),
    /non parametrizzata/,
  );
  // Gli altri due contratti non dipendono da quel parametro.
  assert.ok(calcolaNetto({ ral: 20000, tipoContratto: 'determinato' }, senzaFonte).netto.annuo > 0);
});
