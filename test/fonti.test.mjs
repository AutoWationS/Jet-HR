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
  const TRASVERSALI = [
    'imposta',
    'arrotondamentoRapporti',
    'baseContributiva',
    'nonConcorrenzaContributi',
    'addizionaliNoTaxArea',
    'redditoComplessivo',
    'ragguaglioGiorni',
  ];
  const citate = new Set([...BLOCCHI.map((n) => P[n].fonte), ...TRASVERSALI]);

  for (const chiave of Object.keys(FONTI)) {
    assert.ok(citate.has(chiave), `la fonte "${chiave}" non e' usata da nessun parametro`);
  }
});

const STATI = [
  'atto-letto', // il testo applicabile e' stato letto
  'atto-corrispondente', // letto un testo corrispondente (es. il TUIR riordinato)
  'prassi-letta', // letto dentro una circolare che riporta la norma per esteso
  'fonte-istituzionale', // letto sul sito dell'ente che emana l'atto, non sull'atto
  'non-verificata', // nessuna lettura diretta
];

test('ogni fonte dichiara uno stato di verifica tipizzato', () => {
  for (const [chiave, fonte] of Object.entries(FONTI)) {
    assert.ok(
      STATI.includes(fonte.statoVerifica),
      `fonte ${chiave}: statoVerifica mancante o non valido ("${fonte.statoVerifica}")`,
    );
  }
});

test('solo un atto davvero letto puo dirsi VERIFICATO', () => {
  // Il difetto che questo test previene: la prosa che si autopromuove. Prima
  // sei fonti dicevano "VERIFICATO sul testo normativo" mentre il testo letto
  // era quello riordinato, applicabile dal 2027, e non quello vigente nel 2026.
  for (const [chiave, fonte] of Object.entries(FONTI)) {
    if (/\bVERIFICATO\b/.test(fonte.verifica)) {
      assert.equal(
        fonte.statoVerifica,
        'atto-letto',
        `fonte ${chiave}: la prosa dice VERIFICATO ma lo stato e' "${fonte.statoVerifica}"`,
      );
    }
  }
});

test('ogni fonte incompleta dice anche dove trovare cio che le manca', () => {
  // Una lacuna senza indirizzo e' una lamentela. Con l'indirizzo e' un compito.
  const CANALI = ['normattiva', 'burl', 'comune', 'def', 'inps'];
  for (const [chiave, fonte] of Object.entries(FONTI)) {
    if (fonte.statoVerifica === 'atto-letto' && !fonte.lacuna) continue;
    assert.ok(fonte.dove && fonte.dove.length > 20, `fonte ${chiave}: manca il documento da aprire`);
    assert.ok(CANALI.includes(fonte.canale), `fonte ${chiave}: canale mancante o non valido`);
  }
});

test('ogni fonte non pienamente verificata dichiara la propria lacuna', () => {
  for (const [chiave, fonte] of Object.entries(FONTI)) {
    if (fonte.statoVerifica === 'atto-letto' && !fonte.lacuna) continue;
    assert.ok(
      fonte.lacuna && fonte.lacuna.length > 20,
      `fonte ${chiave}: stato "${fonte.statoVerifica}" senza lacuna dichiarata`,
    );
  }
});

test('ogni fonte dichiara il proprio livello nella gerarchia', () => {
  for (const [chiave, fonte] of Object.entries(FONTI)) {
    assert.ok([1, 2].includes(fonte.livello), `fonte ${chiave}: livello mancante o non valido`);
  }
});

test('una fonte di livello 1 punta a un testo normativo, non a una scheda divulgativa', () => {
  // Il difetto piu' facile da commettere: dichiarare "norma primaria" e poi linkare
  // la pagina informativa di un portale. Qui il link deve essere una banca dati
  // normativa: Normattiva, Gazzetta Ufficiale o la Documentazione Economica e
  // Finanziaria del MEF.
  const BANCHE_DATI = /^https:\/\/(www\.)?(normattiva\.it|gazzettaufficiale\.it|def\.finanze\.it)/;
  for (const [chiave, fonte] of Object.entries(FONTI)) {
    if (fonte.livello !== 1) continue;
    assert.match(fonte.url, BANCHE_DATI, `fonte ${chiave}: livello 1 ma URL non normativo`);
  }
});

test('i numeri scritti nelle fonti coincidono con i parametri usati dal motore', () => {
  // Le fonti riscrivono in prosa importi e soglie ("1.955 euro", "56.224 euro").
  // Se il parametro cambia e la prosa no, la pagina mente. Questo test lega le
  // due cose: ogni numero citato deve esistere davvero tra i parametri.
  const valori = new Set();
  const raccogli = (nodo) => {
    if (typeof nodo === 'number' && Number.isFinite(nodo)) {
      valori.add(nodo);
      valori.add(nodo * 100); // le aliquote compaiono in prosa come percentuali
      return;
    }
    if (nodo && typeof nodo === 'object') Object.values(nodo).forEach(raccogli);
  };
  raccogli({
    inps: P.inps,
    irpef: P.irpef,
    detrazione: P.detrazioneLavoroDipendente,
    cuneo: P.cuneoFiscale,
    ti: P.trattamentoIntegrativo,
    reg: P.addizionaleRegionale,
    com: P.addizionaleComunale,
  });
  // Anni, numeri di legge e articoli non sono parametri: vanno ignorati.
  const IGNORA = new Set([
    1, 2, 3, 4, 6, 8, 9, 10, 11, 12, 13, 15, 16, 21, 22, 23, 29, 30, 31, 33, 35, 43, 44, 49,
    50, 51, 55, 75, 117, 153, 199, 207, 234, 314, 326, 335, 360, 384, 438, 446, 917, 1969,
    1986, 1992, 1995, 1997, 1998, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 200000,
    730, // nome di un modello dichiarativo, non un parametro
    2004, // anno della rinumerazione del TUIR
  ]);

  for (const [chiave, fonte] of Object.entries(FONTI)) {
    const prosa = [fonte.dettaglio, fonte.prassi]
      .filter(Boolean)
      .join(' ')
      // Via le date (16/05/2025) e i riferimenti normativi (n. 199, art. 13,
      // c. 1, D.Lgs. 446/1997): non sono parametri di calcolo.
      .replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, ' ')
      .replace(/\d+\/\d+/g, ' ')
      .replace(
        /\b(?:n|art|artt|articolo|articoli|c|cc|lett|par|§)\.?\s*\d+[\w-]*(?:\s*-\s*\d+)?/gi,
        ' ',
      )
      // "commi 726-729", "comma 727", "commi 1, 3 e 5"
      .replace(/\bcomm[ai]\s+\d+(?:\s*(?:-|,|\se\s)\s*\d+)*/gi, ' ')
      // "quarta cifra", "quattro cifre decimali": numeri scritti in lettere, ok
      .replace(/\b(quattro|quarta)\b/gi, ' ');
    // "1.955", "56.224", "0,80", "7,1", "8.173,91"
    const numeri = prosa.match(/\d[\d.]*(?:,\d+)?/g) ?? [];
    for (const crudo of numeri) {
      // "2004." a fine frase: il punto finale non fa parte del numero
      const grezzo = crudo.replace(/\.$/, '');
      const n = Number(grezzo.replace(/\./g, '').replace(',', '.'));
      if (!Number.isFinite(n) || IGNORA.has(n)) continue;
      // 8.173,91 e' una soglia derivata (1.955 - 75) / 23%: la ricalcoliamo
      // Alcuni numeri in prosa sono GRANDEZZE DERIVATE dai parametri, non
      // parametri: la soglia di capienza del trattamento integrativo e il salto
      // di netto alla soglia comunale. Vanno riconosciute ricalcolandole, non
      // messe in whitelist: se cambia un parametro devono cambiare anche loro.
      const derivati = [
        {
          valore:
            (P.detrazioneLavoroDipendente.fasce[0].base - P.trattamentoIntegrativo.scartoCapienza) /
            P.irpef.scaglioni[0].aliquota,
          tolleranza: 0.02,
        },
        {
          valore: P.addizionaleComunale.sogliaEsenzione * P.addizionaleComunale.aliquota,
          tolleranza: 1, // in prosa e' scritto "circa 184 euro"
        },
      ];
      const ok =
        valori.has(n) || derivati.some((d) => Math.abs(d.valore - n) <= d.tolleranza);
      assert.ok(ok, `fonte ${chiave}: il numero ${grezzo} non corrisponde a nessun parametro`);
    }
  }
});

test('il perimetro escluso e dichiarato voce per voce, con norma e motivo', () => {
  assert.ok(P.fuoriPerimetro.length >= 5);
  for (const voce of P.fuoriPerimetro) {
    assert.ok(voce.voce && voce.norma && voce.motivo, `voce fuori perimetro incompleta: ${voce.voce}`);
  }
});
