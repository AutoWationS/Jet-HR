/**
 * motore.js — Motore di calcolo puro: da RAL a netto.
 *
 * Nessuna dipendenza dal DOM, nessun I/O, nessuno stato globale.
 * `calcolaNetto(input, parametri)` e' una funzione pura: stessi input,
 * stesso output. Tutta la UI vive altrove ed e' sostituibile.
 *
 * La catena di calcolo e' quella della busta paga:
 *
 *   RAL
 *    - contributi INPS c/dipendente            -> imponibile fiscale
 *    - IRPEF netta (lorda - detrazioni)
 *    - addizionale regionale + comunale
 *    + bonus non imponibili (cuneo, trattamento integrativo)
 *   = netto annuo
 */

import { PARAMETRI_DEFAULT } from './parametri.js';

/* -------------------------------------------------------------------------- *
 * Utility
 * -------------------------------------------------------------------------- */

/** Arrotondamento monetario a 2 decimali, stabile sui .005. */
export function euro(x) {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}

/**
 * Applica una scala progressiva "per scaglioni" e restituisce sia il totale
 * sia il dettaglio riga per riga (serve alla UI per mostrare il calcolo).
 */
export function applicaScaglioni(imponibile, scaglioni) {
  const dettaglio = [];
  let residuo = Math.max(0, imponibile);
  let precedente = 0;
  let totale = 0;

  for (const scaglione of scaglioni) {
    if (residuo <= 0) break;
    const ampiezza = scaglione.fino - precedente;
    const quota = Math.min(residuo, ampiezza);
    const imposta = quota * scaglione.aliquota;

    dettaglio.push({
      da: precedente,
      a: scaglione.fino,
      aliquota: scaglione.aliquota,
      imponibile: euro(quota),
      imposta: euro(imposta),
    });

    totale += imposta;
    residuo -= quota;
    precedente = scaglione.fino;
  }

  return { totale, dettaglio };
}

/* -------------------------------------------------------------------------- *
 * 1. Contributi previdenziali a carico del dipendente
 * -------------------------------------------------------------------------- */

export function calcolaContributi(ral, parametri, opzioni = {}) {
  const p = parametri.inps;
  const applicaMassimale = opzioni.applicaMassimale ?? true;

  // Il massimale contributivo vale solo per chi non ha anzianita' al 31/12/1995.
  const baseImponibile = applicaMassimale ? Math.min(ral, p.massimaleAnnuo) : ral;

  const ivs = baseImponibile * p.aliquotaIvs;

  // +1% sulla sola quota eccedente la prima fascia di retribuzione pensionabile.
  const eccedenza = Math.max(0, baseImponibile - p.primaFasciaPensionabile);
  const aggiuntivo = eccedenza * p.aliquotaAggiuntiva;

  const totale = ivs + aggiuntivo;

  return {
    baseImponibile: euro(baseImponibile),
    ivs: euro(ivs),
    aggiuntivo: euro(aggiuntivo),
    totale: euro(totale),
    aliquotaEffettiva: ral > 0 ? totale / ral : 0,
    massimaleApplicato: applicaMassimale && ral > p.massimaleAnnuo,
  };
}

/* -------------------------------------------------------------------------- *
 * 2. Detrazione per redditi di lavoro dipendente (art. 13 TUIR)
 * -------------------------------------------------------------------------- */

export function calcolaDetrazioneLavoro(redditoComplessivo, parametri, giorni) {
  const p = parametri.detrazioneLavoroDipendente;
  const R = Math.max(0, redditoComplessivo);

  const fascia = p.fasce.find((f) => R <= f.fino);
  let teorica = fascia.base + (fascia.quotaVariabile * (fascia.riferimento - R)) / fascia.ampiezza;
  teorica = Math.max(0, teorica);

  // La detrazione base e' rapportata ai giorni di lavoro nell'anno...
  let rapportata = (teorica * giorni) / p.giorniAnno;

  // ...con un pavimento di 690 euro per i rapporti a tempo indeterminato,
  // ma solo se una detrazione spetta (oltre 50.000 non spetta nulla).
  if (teorica > 0) {
    rapportata = Math.max(rapportata, Math.min(p.minimoTempoIndeterminato, teorica));
  }

  // La maggiorazione di 65 euro NON e' rapportata al periodo di lavoro.
  const m = p.maggiorazione;
  const maggiorazione = R > m.da && R <= m.a ? m.importo : 0;

  return {
    base: euro(rapportata),
    maggiorazione: euro(maggiorazione),
    totale: euro(rapportata + maggiorazione),
  };
}

/* -------------------------------------------------------------------------- *
 * 3. Taglio del cuneo fiscale (L. 207/2024)
 * -------------------------------------------------------------------------- */

/**
 * (a) Somma esente: bonus in busta paga che NON concorre a formare reddito.
 *
 * Due punti su cui e' facile sbagliare, entrambi verificati:
 *  - la base e' il REDDITO DI LAVORO DIPENDENTE, cioe' l'imponibile fiscale gia'
 *    al netto dei contributi (artt. 49 e 51 c. 2 lett. a TUIR), non la RAL;
 *  - la percentuale e' UNICA, scelta in base alla fascia in cui cade il reddito,
 *    non applicata per scaglioni successivi.
 */
export function calcolaSommaEsente(redditoComplessivo, redditoLavoroDipendente, parametri, giorni) {
  const p = parametri.cuneoFiscale.sommaEsente;
  const giorniAnno = parametri.detrazioneLavoroDipendente.giorniAnno;

  if (redditoComplessivo > p.limiteRedditoComplessivo) {
    return { percentuale: 0, importo: 0, redditoAnnualeTeorico: 0 };
  }

  // Circ. 4/E/2025, par. 1.2: la percentuale si individua sul reddito di lavoro
  // dipendente RAPPORTATO ALL'INTERO ANNO ("reddito annuale teorico"), ma si
  // applica poi al reddito effettivamente percepito. Su un anno intero le due
  // grandezze coincidono; su un rapporto parziale no, ed e' li' che si vede.
  const redditoAnnualeTeorico = (redditoLavoroDipendente * giorniAnno) / giorni;
  const fascia = p.fasce.find((f) => redditoAnnualeTeorico <= f.fino);
  const importo = redditoLavoroDipendente * fascia.percentuale;

  return {
    percentuale: fascia.percentuale,
    importo: euro(importo),
    redditoAnnualeTeorico: euro(redditoAnnualeTeorico),
  };
}

/**
 * (b) Ulteriore detrazione d'imposta, con decalage lineare 32k -> 40k.
 * L. 207/2024 art. 1 c. 6: e' "rapportata al periodo di lavoro nell'anno".
 */
export function calcolaUlterioreDetrazione(redditoComplessivo, parametri, giorni) {
  const p = parametri.cuneoFiscale.ulterioreDetrazione;
  const giorniAnno = parametri.detrazioneLavoroDipendente.giorniAnno;
  const R = redditoComplessivo;

  let importo = 0;
  if (R > p.da && R <= p.pienoFino) importo = p.importo;
  else if (R > p.pienoFino && R <= p.azzeramento) {
    importo = (p.importo * (p.azzeramento - R)) / (p.azzeramento - p.pienoFino);
  }

  return euro((importo * giorni) / giorniAnno);
}

/* -------------------------------------------------------------------------- *
 * 4. Trattamento integrativo (art. 1 D.L. 3/2020)
 * -------------------------------------------------------------------------- */

export function calcolaTrattamentoIntegrativo(redditoComplessivo, irpefLorda, detrazioni, parametri, giorni) {
  const p = parametri.trattamentoIntegrativo;
  const giorniAnno = parametri.detrazioneLavoroDipendente.giorniAnno;
  const R = redditoComplessivo;
  const rapporta = (x) => (x * giorni) / giorniAnno;

  if (R <= p.sogliaPiena) {
    // Capienza: IRPEF lorda superiore alla detrazione dell'art. 13 COMMA 1
    // (quindi senza la maggiorazione del c. 1.1) diminuita di 75 euro,
    // anch'essi rapportati al periodo di lavoro nell'anno.
    // L. 207/2024 c. 3; circ. 4/E/2025, par. 1.1.
    const soglia = detrazioni.articolo13Comma1 - rapporta(p.scartoCapienza);
    return irpefLorda > soglia ? euro(rapporta(p.importo)) : 0;
  }

  if (R <= p.sogliaMassima) {
    // Tra 15.000 e 28.000 spetta per la differenza tra la SOMMA DELLE
    // DETRAZIONI elencate dall'art. 1 c. 1 D.L. 3/2020 (artt. 12 e 13 c. 1
    // TUIR, art. 15 c. 1 lett. a e b e c. 1-ter per mutui ante 2022, rate di
    // art. 15 c. 1 lett. c e 16-bis per spese ante 2022) e l'IRPEF lorda, nel
    // limite di 1.200 euro. L'ulteriore detrazione del cuneo NON e' in quella
    // lista. Di quelle voci il modello rappresenta solo l'art. 13 c. 1, quindi
    // qui il risultato e' sempre zero: e' una conseguenza del perimetro.
    const incapienza = detrazioni.articolo13Comma1 - irpefLorda;
    return incapienza > 0 ? euro(Math.min(rapporta(p.importo), incapienza)) : 0;
  }

  return 0;
}

/* -------------------------------------------------------------------------- *
 * 5. Addizionali regionali e comunali
 * -------------------------------------------------------------------------- */

/**
 * Le addizionali non sono dovute quando l'IRPEF, al netto delle detrazioni,
 * risulta pari a zero: art. 50 c. 2 D.Lgs. 446/1997 per la regionale, art. 1
 * c. 4 D.Lgs. 360/1998 per la comunale. E' la cosiddetta "no tax area": chi
 * non paga IRPEF non paga nemmeno le addizionali.
 *
 * Per questo la funzione riceve l'IRPEF netta: senza, calcolerebbe addizionali
 * su un contribuente che non deve nulla.
 */
export function calcolaAddizionali(imponibile, parametri, opzioni = {}) {
  const irpefNetta = opzioni.irpefNetta ?? Infinity;

  if (irpefNetta <= 0) {
    return {
      regionale: 0,
      regionaleDettaglio: [],
      comunale: 0,
      comunaleEsente: true,
      totale: 0,
      nonDovutePerImpostaZero: true,
    };
  }

  const regionale = applicaScaglioni(imponibile, parametri.addizionaleRegionale.scaglioni);

  const c = parametri.addizionaleComunale;
  // Soglia di esenzione, non franchigia: superata la soglia l'addizionale e'
  // dovuta sull'intero imponibile.
  const comunale = imponibile > c.sogliaEsenzione ? imponibile * c.aliquota : 0;

  return {
    regionale: euro(regionale.totale),
    regionaleDettaglio: regionale.dettaglio,
    comunale: euro(comunale),
    comunaleEsente: imponibile <= c.sogliaEsenzione,
    totale: euro(regionale.totale + comunale),
    nonDovutePerImpostaZero: false,
  };
}

/* -------------------------------------------------------------------------- *
 * 6. Funzione principale
 * -------------------------------------------------------------------------- */

/**
 * @param {object} input
 * @param {number} input.ral                 Retribuzione annua lorda (euro)
 * @param {number} [input.mensilita=13]      12, 13 o 14 mensilita'
 * @param {number} [input.giorniLavorati=365]
 * @param {boolean} [input.applicaMassimale=true] Iscritto INPS post 31/12/1995
 * @param {object} [parametri=PARAMETRI_DEFAULT]
 */
export function calcolaNetto(input, parametri = PARAMETRI_DEFAULT) {
  const ral = Math.max(0, Number(input.ral) || 0);
  const mensilita = Number(input.mensilita) || 13;
  const giorniLavorati = Number(input.giorniLavorati) || parametri.detrazioneLavoroDipendente.giorniAnno;
  const applicaMassimale = input.applicaMassimale ?? true;

  // --- Contributi previdenziali -------------------------------------------
  const contributi = calcolaContributi(ral, parametri, { applicaMassimale });

  // --- Imponibile fiscale --------------------------------------------------
  const imponibileFiscale = euro(ral - contributi.totale);
  // Semplificazione dichiarata: il reddito complessivo coincide con
  // l'imponibile fiscale da lavoro dipendente (nessun altro reddito,
  // nessun onere deducibile, no rendita catastale abitazione principale).
  const redditoComplessivo = imponibileFiscale;

  // --- IRPEF lorda ---------------------------------------------------------
  const irpef = applicaScaglioni(imponibileFiscale, parametri.irpef.scaglioni);
  const irpefLorda = euro(irpef.totale);

  // --- Detrazioni ----------------------------------------------------------
  const detrazioneLavoro = calcolaDetrazioneLavoro(redditoComplessivo, parametri, giorniLavorati);
  const ulterioreDetrazione = calcolaUlterioreDetrazione(redditoComplessivo, parametri, giorniLavorati);
  const detrazioniTotali = euro(detrazioneLavoro.totale + ulterioreDetrazione);

  // --- IRPEF netta (mai negativa: l'eccedenza di detrazioni si perde) ------
  const irpefNetta = euro(Math.max(0, irpefLorda - detrazioniTotali));
  const detrazioniNonGodute = euro(Math.max(0, detrazioniTotali - irpefLorda));

  // --- Addizionali ---------------------------------------------------------
  // Vanno calcolate DOPO l'IRPEF netta: se questa e' zero non sono dovute.
  const addizionali = calcolaAddizionali(imponibileFiscale, parametri, { irpefNetta });

  // --- Somme non imponibili in busta paga ----------------------------------
  const sommaEsente = calcolaSommaEsente(
    redditoComplessivo,
    imponibileFiscale,
    parametri,
    giorniLavorati,
  );
  const trattamentoIntegrativo = calcolaTrattamentoIntegrativo(
    redditoComplessivo,
    irpefLorda,
    { articolo13Comma1: detrazioneLavoro.base },
    parametri,
    giorniLavorati,
  );

  // --- Netto ---------------------------------------------------------------
  const totaleImposte = euro(irpefNetta + addizionali.totale);
  const totaleTrattenute = euro(contributi.totale + totaleImposte);
  const totaleBonus = euro(sommaEsente.importo + trattamentoIntegrativo);

  const nettoAnnuo = euro(ral - totaleTrattenute + totaleBonus);
  const nettoMensile = euro(nettoAnnuo / mensilita);

  return {
    input: { ral, mensilita, giorniLavorati, applicaMassimale },
    parametriAnno: parametri.anno,

    contributi,
    imponibileFiscale,
    redditoComplessivo,

    irpef: {
      lorda: irpefLorda,
      scaglioni: irpef.dettaglio,
      detrazioneLavoro: detrazioneLavoro.base,
      maggiorazione65: detrazioneLavoro.maggiorazione,
      ulterioreDetrazione,
      detrazioniTotali,
      detrazioniNonGodute,
      netta: irpefNetta,
    },

    addizionali,

    bonus: {
      sommaEsente: sommaEsente.importo,
      sommaEsentePercentuale: sommaEsente.percentuale,
      sommaEsenteRedditoTeorico: sommaEsente.redditoAnnualeTeorico,
      trattamentoIntegrativo,
      totale: totaleBonus,
    },

    totali: {
      contributi: contributi.totale,
      imposte: totaleImposte,
      trattenute: totaleTrattenute,
      bonus: totaleBonus,
    },

    netto: { annuo: nettoAnnuo, mensile: nettoMensile },

    indici: {
      // Quanto del lordo resta in tasca
      incidenzaNetto: ral > 0 ? nettoAnnuo / ral : 0,
      // Cuneo a carico del solo dipendente (contributi + imposte - bonus)
      cuneoDipendente: ral > 0 ? (totaleTrattenute - totaleBonus) / ral : 0,
      aliquotaIrpefEffettiva: imponibileFiscale > 0 ? irpefNetta / imponibileFiscale : 0,
      aliquotaMarginale: aliquotaMarginale(ral, parametri, input),
    },
  };
}

/**
 * Aliquota marginale effettiva: quanto dello +100 euro lordo successivo viene
 * assorbito da contributi e imposte. Calcolata numericamente proprio per far
 * emergere gli effetti soglia (20k, 23k, 32k, 40k, 50k) che le formule
 * nascondono.
 */
export function aliquotaMarginale(ral, parametri = PARAMETRI_DEFAULT, input = {}, delta = 100) {
  if (ral <= 0) return 0;
  const base = { ...input, ral };
  const a = calcolaNettoSemplice(base, parametri);
  const b = calcolaNettoSemplice({ ...base, ral: ral + delta }, parametri);
  return 1 - (b - a) / delta;
}

/** Versione ridotta usata internamente per le derivate (evita ricorsione). */
function calcolaNettoSemplice(input, parametri) {
  const ral = Math.max(0, Number(input.ral) || 0);
  const giorni = Number(input.giorniLavorati) || parametri.detrazioneLavoroDipendente.giorniAnno;
  const contributi = calcolaContributi(ral, parametri, {
    applicaMassimale: input.applicaMassimale ?? true,
  });
  const imponibile = ral - contributi.totale;
  const irpefLorda = applicaScaglioni(imponibile, parametri.irpef.scaglioni).totale;
  const detrLavoro = calcolaDetrazioneLavoro(imponibile, parametri, giorni);
  const detrTotali = detrLavoro.totale + calcolaUlterioreDetrazione(imponibile, parametri, giorni);
  const irpefNetta = Math.max(0, irpefLorda - detrTotali);
  const addizionali = calcolaAddizionali(imponibile, parametri, { irpefNetta });
  const sommaEsente = calcolaSommaEsente(imponibile, imponibile, parametri, giorni).importo;
  const ti = calcolaTrattamentoIntegrativo(
    imponibile,
    irpefLorda,
    { articolo13Comma1: detrLavoro.base },
    parametri,
    giorni,
  );
  return ral - contributi.totale - irpefNetta - addizionali.totale + sommaEsente + ti;
}

/** Serie (RAL, netto) per il grafico: utile per vedere gli effetti soglia. */
export function curvaNetto(da, a, passo, parametri = PARAMETRI_DEFAULT, input = {}) {
  const punti = [];
  for (let ral = da; ral <= a; ral += passo) {
    const r = calcolaNetto({ ...input, ral }, parametri);
    punti.push({
      ral,
      netto: r.netto.annuo,
      incidenza: r.indici.incidenzaNetto,
      marginale: r.indici.aliquotaMarginale,
    });
  }
  return punti;
}
