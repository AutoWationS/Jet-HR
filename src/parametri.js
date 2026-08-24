/**
 * parametri.js — Tutti i parametri normativi, con la fonte accanto a ciascuno.
 *
 * Due regole di progetto:
 *
 *  1. Nel motore non compare NESSUN numero magico. Ogni soglia, aliquota e
 *     importo vive qui. Cambiare anno d'imposta = aggiungere un oggetto, non
 *     toccare il codice di calcolo.
 *
 *  2. Ogni blocco di parametri dichiara la sua fonte tramite la chiave `fonte`,
 *     che punta al registro FONTI qui sotto. Le fonti sono DATI, non commenti:
 *     la pagina genera da qui la sezione "Fonti", quindi non possono divergere
 *     da cio' che il motore usa davvero, e un test verifica che ogni parametro
 *     ne dichiari una esistente.
 *
 * Valuta: euro. Aliquote: frazioni decimali (0.23 = 23%).
 */

/* ========================================================================== *
 * REGISTRO DELLE FONTI
 *
 * `norma`   = fonte primaria (legge, decreto, articolo)
 * `prassi`  = documento interpretativo che ne chiarisce l'applicazione
 * `verifica`= data in cui la fonte e' stata controllata, e come
 * ========================================================================== */

export const FONTI = {
  irpef: {
    etichetta: 'Aliquote e scaglioni IRPEF',
    norma: 'Art. 11 c. 1 TUIR (D.P.R. 917/1986), come modificato dalla L. 199/2025',
    dettaglio:
      'La legge di bilancio 2026 riduce la seconda aliquota dal 35% al 33% ' +
      'per i redditi tra 28.000 e 50.000 euro, dal periodo d’imposta 2026.',
    prassi:
      'Circolare Agenzia delle Entrate n. 4/E del 16/05/2025, par. 1.1 — ' +
      'conferma la struttura a tre scaglioni stabilizzata dalla L. 207/2024.',
    url: 'https://www.agenziaentrate.gov.it/portale/aliquote-e-calcolo-dell-irpef',
    verifica: 'testo della circolare 4/E/2025 letto integralmente',
  },

  detrazioneLavoro: {
    etichetta: 'Detrazione per redditi di lavoro dipendente',
    norma: 'Art. 13 c. 1 TUIR; maggiorazione di 65 € al c. 1.1, introdotto dalla L. 234/2021',
    dettaglio:
      'Importo base 1.955 € fino a 15.000 di reddito (elevato da 1.880 dalla ' +
      'L. 207/2024), poi decrescente fino ad azzerarsi a 50.000. Minimo di 690 € ' +
      'per i rapporti a tempo indeterminato, 1.380 € per quelli a termine. ' +
      'La maggiorazione di 65 € NON è rapportata al periodo di lavoro.',
    prassi:
      'Circolare 4/E/2025, par. 1.1 — riporta lo schema di calcolo per fasce ' +
      'implementato qui, e ricorda che il c. 1-bis dell’art. 13 (ex bonus Renzi) ' +
      'è stato abrogato dal D.L. 3/2020: la maggiorazione sta al c. 1.1.',
    url: 'https://def.finanze.it/DocTribFrontend/getAttoNormativoDetail.do?id=%7bEC138E97-9B72-4177-A24C-C50AB0B0AEFA%7d',
    verifica: 'schema della circolare confrontato riga per riga con le formule del motore',
  },

  contributi: {
    etichetta: 'Contributi previdenziali a carico del dipendente',
    norma:
      'Aliquota IVS 9,19% (FPLD, settore privato non agricolo); ' +
      'aliquota aggiuntiva 1% ex art. 3-ter D.L. 384/1992; ' +
      'massimale annuo ex art. 2 c. 18 L. 335/1995',
    dettaglio:
      'L’aliquota aggiuntiva dell’1% colpisce la sola quota eccedente la prima ' +
      'fascia di retribuzione pensionabile, non l’intera retribuzione. ' +
      'Il massimale si applica ai soli iscritti privi di anzianità al 31/12/1995.',
    prassi:
      'INPS, circolare n. 6 del 30/01/2026 — prima fascia di retribuzione ' +
      'pensionabile 56.224 €, massimale annuo 122.295 €.',
    url: 'https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa.html',
    verifica: 'importi 2026 verificati; da riverificare a ogni circolare annuale INPS',
  },

  deducibilitaContributi: {
    etichetta: 'Deducibilità dei contributi dal reddito imponibile',
    norma: 'Art. 51 c. 2 lett. a) TUIR',
    dettaglio:
      'I contributi previdenziali e assistenziali obbligatori versati dal ' +
      'lavoratore non concorrono a formare il reddito di lavoro dipendente. ' +
      'È il motivo per cui l’imponibile fiscale è la RAL meno il 9,19%, ed è ' +
      'anche la ragione per cui la somma esente del cuneo si calcola ' +
      'sull’imponibile e non sulla RAL.',
    url: 'https://def.finanze.it/DocTribFrontend/getAttoNormativoDetail.do?id=%7bEC138E97-9B72-4177-A24C-C50AB0B0AEFA%7d',
    verifica: 'usato per dirimere una divergenza con un calcolatore esterno (metodologia §3.4)',
  },

  cuneoFiscale: {
    etichetta: 'Taglio del cuneo fiscale',
    norma: 'L. 207/2024 art. 1 cc. 4-9, reso strutturale dalla L. 199/2025',
    dettaglio:
      'Due misure alternative in base al reddito complessivo: fino a 20.000 una ' +
      'somma esente da imposta erogata in busta paga (7,1% / 5,3% / 4,8%); da ' +
      '20.000 a 40.000 una detrazione d’imposta di 1.000 € in décalage. ' +
      'La percentuale della somma esente è UNICA per fascia, non applicata per ' +
      'scaglioni successivi, e si individua sul reddito rapportato all’intero anno.',
    prassi:
      'Circolare 4/E/2025, par. 1.2 — “applicando al reddito di lavoro dipendente ' +
      'del contribuente la percentuale corrispondente”; gli esempi 1 e 2 mostrano ' +
      'il calcolo del reddito annuale teorico, l’esempio 3 che la percentuale si ' +
      'applica alla sola quota imponibile.',
    url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/8410823/Circolare+lavoro+dipendente+LB2025+DD+IRPEF+n.+4+del+16+maggio+2025.pdf',
    verifica: 'testo e tre esempi della circolare riprodotti nei test',
  },

  trattamentoIntegrativo: {
    etichetta: 'Trattamento integrativo',
    norma: 'Art. 1 c. 1 D.L. 3/2020 conv. L. 21/2020, come modificato dalla L. 207/2024 c. 3',
    dettaglio:
      'Fino a 15.000 di reddito spettano 1.200 € se l’imposta LORDA supera la ' +
      'detrazione dell’art. 13 c. 1 diminuita di 75 €, entrambi rapportati al ' +
      'periodo di lavoro. La condizione guarda l’imposta lorda, non la netta: ' +
      'fra 8.173,91 e 8.500 di reddito non si paga IRPEF e il trattamento spetta ' +
      'lo stesso. Da 15.000 a 28.000 spetta per la differenza tra la somma delle ' +
      'detrazioni elencate dalla norma e l’imposta lorda, nel limite di 1.200 €.',
    prassi:
      'Circolare 4/E/2025, par. 1.1 — “la previsione di una riduzione di 75 euro ' +
      '… mira a neutralizzare l’incremento della detrazione … che avrebbe potuto ' +
      'determinare l’esclusione dal beneficio di alcuni soggetti”.',
    url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/8410823/Circolare+lavoro+dipendente+LB2025+DD+IRPEF+n.+4+del+16+maggio+2025.pdf',
    verifica: 'condizione di capienza verificata sul testo; finestra 8.173,91-8.500 coperta da test',
  },

  addizionaleRegionale: {
    etichetta: 'Addizionale regionale IRPEF — Lombardia',
    norma: 'Art. 50 D.Lgs. 446/1997; aliquote deliberate dalla Regione Lombardia',
    dettaglio:
      'Aliquote per scaglioni, ancora agganciate agli scaglioni IRPEF ANTE ' +
      'riforma (15.000 / 28.000 / 50.000): la L. 207/2024 c. 727 consente alle ' +
      'Regioni di mantenerli per gli anni 2025, 2026 e 2027. Il disallineamento ' +
      'con i tre scaglioni IRPEF è quindi voluto dalla norma, non un errore.',
    prassi:
      'Circolare 4/E/2025, par. 1.4 — commi 726-729 sull’adeguamento delle ' +
      'addizionali alla nuova articolazione dell’IRPEF.',
    url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=10',
    verifica: 'aliquote 2026 da riverificare sulla delibera regionale vigente',
  },

  addizionaleComunale: {
    etichetta: 'Addizionale comunale IRPEF — Milano',
    norma: 'Art. 1 D.Lgs. 360/1998; aliquota e soglia deliberate dal Comune di Milano',
    dettaglio:
      'Aliquota unica 0,80% con soglia di esenzione a 23.000 € di imponibile. ' +
      'È una SOGLIA, non una franchigia: superata, l’addizionale è dovuta ' +
      'sull’intero imponibile e non sulla sola eccedenza.',
    url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addcomirpef/sceltaregione.htm',
    verifica:
      'ATTENZIONE: è il parametro più volatile del modello. Aliquota e soglia ' +
      'sono deliberate ogni anno dal Comune; Milano ha discusso un innalzamento ' +
      'della soglia dal 2026. Da riverificare sulla delibera vigente.',
  },

  addizionaliNoTaxArea: {
    etichetta: 'Addizionali non dovute in assenza di IRPEF',
    norma: 'Art. 50 c. 2 D.Lgs. 446/1997 (regionale); art. 1 c. 4 D.Lgs. 360/1998 (comunale)',
    dettaglio:
      'Le addizionali sono dovute solo se l’IRPEF, al netto delle detrazioni, ' +
      'risulta dovuta. Chi sta in no tax area non paga né IRPEF né addizionali. ' +
      'Nel motore questo impone un vincolo di ordine: le addizionali si calcolano ' +
      'DOPO l’IRPEF netta e la ricevono come argomento.',
    url: 'https://www.finanze.gov.it/it/fiscalita/fiscalita-regionale-e-locale/Addizionale-regionale-allIRPEF/normativa/',
    verifica: 'regola emersa dal confronto con un calcolatore esterno (metodologia §3.4)',
  },

  redditoComplessivo: {
    etichetta: 'Nozione di reddito complessivo usata per le soglie',
    norma: 'Art. 8 TUIR; art. 13 c. 6-bis TUIR; L. 207/2024 art. 1 c. 9',
    dettaglio:
      'Il reddito che governa le soglie di detrazioni e cuneo è il c.d. reddito ' +
      'di riferimento: comprende anche redditi a cedolare secca, regime ' +
      'forfetario e mance a imposta sostitutiva, va assunto al netto della ' +
      'rendita dell’abitazione principale, e per il cuneo include la quota ' +
      'esente di impatriati e ricercatori. Il modello lo semplifica ' +
      'nell’imponibile da lavoro dipendente: esatto per chi ha solo questo ' +
      'reddito, approssimato altrimenti.',
    prassi: 'Circolare 4/E/2025, par. 1.1 e 1.2; circolare 22/E del 19/11/2024.',
    url: 'https://www.agenziaentrate.gov.it/portale/documents/20143/8410823/Circolare+lavoro+dipendente+LB2025+DD+IRPEF+n.+4+del+16+maggio+2025.pdf',
    verifica: 'semplificazione dichiarata, vedi metodologia §5.1',
  },
};

/* ========================================================================== *
 * PARAMETRI — ANNO D'IMPOSTA 2026
 * ========================================================================== */

export const PARAMETRI_2026 = {
  anno: 2026,

  /** 1. Contributi previdenziali a carico del dipendente. */
  inps: {
    fonte: 'contributi',
    aliquotaIvs: 0.0919,
    aliquotaAggiuntiva: 0.01,
    primaFasciaPensionabile: 56224,
    massimaleAnnuo: 122295,
  },

  /** 2. IRPEF: scala progressiva per scaglioni. */
  irpef: {
    fonte: 'irpef',
    scaglioni: [
      { fino: 28000, aliquota: 0.23 },
      { fino: 50000, aliquota: 0.33 },
      { fino: Infinity, aliquota: 0.43 },
    ],
  },

  /**
   * 3. Detrazione per redditi di lavoro dipendente.
   *    Formula per fascia: base + quotaVariabile x (riferimento - R) / ampiezza
   */
  detrazioneLavoroDipendente: {
    fonte: 'detrazioneLavoro',
    fasce: [
      { fino: 15000, base: 1955, quotaVariabile: 0, riferimento: 0, ampiezza: 1 },
      { fino: 28000, base: 1910, quotaVariabile: 1190, riferimento: 28000, ampiezza: 13000 },
      { fino: 50000, base: 0, quotaVariabile: 1910, riferimento: 50000, ampiezza: 22000 },
      { fino: Infinity, base: 0, quotaVariabile: 0, riferimento: 0, ampiezza: 1 },
    ],
    minimoTempoIndeterminato: 690,
    minimoTempoDeterminato: 1380,
    maggiorazione: { importo: 65, da: 25000, a: 35000 },
    giorniAnno: 365,
  },

  /** 4. Taglio del cuneo fiscale: somma esente + ulteriore detrazione. */
  cuneoFiscale: {
    fonte: 'cuneoFiscale',
    sommaEsente: {
      limiteRedditoComplessivo: 20000,
      fasce: [
        { fino: 8500, percentuale: 0.071 },
        { fino: 15000, percentuale: 0.053 },
        { fino: Infinity, percentuale: 0.048 },
      ],
    },
    ulterioreDetrazione: {
      importo: 1000,
      da: 20000,
      pienoFino: 32000,
      azzeramento: 40000,
    },
  },

  /** 5. Trattamento integrativo. */
  trattamentoIntegrativo: {
    fonte: 'trattamentoIntegrativo',
    importo: 1200,
    sogliaPiena: 15000,
    scartoCapienza: 75,
    sogliaMassima: 28000,
  },

  /** 6. Addizionale regionale, per scaglioni. */
  addizionaleRegionale: {
    fonte: 'addizionaleRegionale',
    regione: 'Lombardia',
    scaglioni: [
      { fino: 15000, aliquota: 0.0123 },
      { fino: 28000, aliquota: 0.0158 },
      { fino: 50000, aliquota: 0.0172 },
      { fino: Infinity, aliquota: 0.0173 },
    ],
  },

  /** 7. Addizionale comunale, aliquota unica con soglia di esenzione. */
  addizionaleComunale: {
    fonte: 'addizionaleComunale',
    comune: 'Milano',
    aliquota: 0.008,
    sogliaEsenzione: 23000,
  },

  /**
   * 8. Voci NON modellate, dichiarate esplicitamente.
   *    Stanno qui e non in un commento perche' la pagina le mostra all'utente:
   *    un perimetro dichiarato vale quanto un calcolo corretto.
   */
  fuoriPerimetro: [
    {
      voce: 'Riduzione forfettaria delle detrazioni per oneri',
      norma: 'L. 207/2024 art. 1 c. 10 (260 € oltre 50.000); L. 199/2025 (440 € oltre 200.000)',
      motivo:
        'Incidono sulle detrazioni per oneri dell’art. 15 TUIR, che il modello non ' +
        'rappresenta perché non ci sono oneri detraibili: applicarle gonfierebbe ' +
        'l’imposta di un contribuente che non ha detrazioni da ridurre.',
    },
    {
      voce: 'TFR',
      norma: 'Art. 2120 c.c.',
      motivo:
        'Accantonato e non erogato: circa il 7,41% della retribuzione utile (1/13,5) ' +
        'al netto del contributo dello 0,50% al Fondo di garanzia. Non transita nella ' +
        'retribuzione corrente, quindi non entra nel netto in busta paga.',
    },
    {
      voce: 'Detrazioni per carichi di famiglia',
      norma: 'Art. 12 TUIR',
      motivo: 'Il caso modellato è un lavoratore senza familiari a carico.',
    },
    {
      voce: 'Fringe benefit, welfare, premi di risultato',
      norma: 'Art. 51 TUIR; L. 207/2024 per i premi di produttività',
      motivo: 'Voci variabili e contrattuali, fuori dal caso standard del prototipo.',
    },
    {
      voce: 'Addizionali per cassa',
      norma: 'Art. 50 D.Lgs. 446/1997; art. 1 D.Lgs. 360/1998',
      motivo:
        'In busta paga si versano come saldo dell’anno precedente più acconto ' +
        'dell’anno corrente; il modello le calcola per competenza sull’anno in corso.',
    },
  ],
};

export const PARAMETRI_DEFAULT = PARAMETRI_2026;

/** Fonte dichiarata da un blocco di parametri, per la UI e per i test. */
export function fonteDi(bloccoParametri) {
  return FONTI[bloccoParametri?.fonte];
}
