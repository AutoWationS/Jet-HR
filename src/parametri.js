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
    livello: 1,
    etichetta: 'Aliquote e scaglioni IRPEF',
    norma:
      'Art. 11 c. 1 lett. b) TUIR (D.P.R. 917/1986), come modificato dall’art. 1 c. 3 ' +
      'della L. 30 dicembre 2025, n. 199 (legge di bilancio 2026)',
    dettaglio:
      'Il comma 3 sostituisce “35 per cento” con “33 per cento” nella lettera b), con effetto ' +
      'dal periodo d’imposta 2026. Restano invariati il 23% fino a 28.000 e il 43% oltre ' +
      '50.000. La stessa manovra introduce un correttivo di segno opposto per i redditi oltre ' +
      '200.000 euro, dichiarato in fuoriPerimetro.',
    prassi:
      'Nessuna circolare dell’Agenzia delle Entrate ha ancora commentato le aliquote 2026: il ' +
      '33% poggia sulla sola norma primaria. La circolare 4/E del 16/05/2025 commenta la legge ' +
      'di bilancio 2025 e descrive la seconda aliquota al 35%: conferma la struttura a tre ' +
      'scaglioni, non l’aliquota vigente.',
    url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2025-12-30;199',
    verifica:
      'struttura a tre scaglioni riscontrata sul testo della circolare 4/E/2025; la modifica ' +
      'al 33% su fonti convergenti. Il testo consolidato su Normattiva non è stato aperto ' +
      'dall’ambiente di sviluppo',
  },

  imposta: {
    livello: 1,
    etichetta: 'Imposta netta e limite di capienza',
    norma: 'Art. 11 c. 3 TUIR',
    dettaglio:
      'L’imposta netta si determina operando sull’imposta lorda, fino alla concorrenza del suo ' +
      'ammontare, le detrazioni degli artt. 12, 13, 15, 16 e 16-bis. È la norma che impedisce ' +
      'all’IRPEF di scendere sotto zero: l’eccedenza di detrazioni non diventa un credito, si ' +
      'perde. Il motore la implementa con un max(0, …) e la pagina mostra quanto va perduto.',
    url:
      'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917',
    verifica: 'regola strutturale del TUIR, non soggetta a revisione annuale',
  },

  detrazioneLavoro: {
    livello: 1,
    etichetta: 'Detrazione per redditi di lavoro dipendente',
    norma:
      'Art. 13 c. 1 TUIR (importo base elevato a 1.955 € dall’art. 1 c. 2 lett. b della ' +
      'L. 207/2024); maggiorazione di 65 € all’art. 13 c. 1.1, introdotto dalla L. 234/2021',
    dettaglio:
      'Importo 1.955 € fino a 15.000 di reddito, poi decrescente fino ad azzerarsi a 50.000. ' +
      'I minimi di 690 € e 1.380 € stanno dentro la LETTERA a): valgono solo per redditi fino ' +
      'a 15.000, non per tutte le fasce. La maggiorazione di 65 € non è rapportata al periodo ' +
      'di lavoro. Il comma 1-bis dell’art. 13 non c’entra: conteneva il credito noto come ' +
      '“bonus Renzi”, abrogato dall’art. 3 del D.L. 3/2020 e sostituito dal trattamento ' +
      'integrativo.',
    prassi:
      'Circolare 4/E del 16/05/2025, par. 1.1 — riporta lo schema di calcolo per fasce ' +
      'implementato qui, e colloca i minimi di 690 e 1.380 € nella sola prima riga della ' +
      'tabella, cioè nella fascia fino a 15.000.',
    url:
      'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917',
    verifica:
      'schema della circolare confrontato con le formule del motore; il confronto ha fatto ' +
      'emergere che il minimo era applicato a tutte le fasce anziché alla sola lettera a) — ' +
      'corretto, con test di regressione',
  },

  baseContributiva: {
    livello: 1,
    etichetta: 'Base imponibile previdenziale',
    norma: 'Art. 12 L. 153/1969, come riscritto dall’art. 6 del D.Lgs. 314/1997',
    dettaglio:
      'Armonizza la base imponibile previdenziale con quella fiscale: è la norma per cui ' +
      'l’aliquota contributiva si applica alla retribuzione lorda. L’art. 51 c. 2 lett. a) ' +
      'TUIR spiega perché i contributi escono dall’imponibile fiscale; questa spiega perché ' +
      'il 9,19% si applica al lordo.',
    url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1969-04-30;153',
    verifica:
      'norma strutturale; nel caso standard modellato imponibile fiscale e previdenziale ' +
      'coincidono come base di partenza',
  },

  contributi: {
    livello: 2,
    etichetta: 'Aliquote e limiti contributivi a carico del dipendente',
    norma:
      'Aliquota IVS 9,19% (quota lavoratore, FPLD settore privato non agricolo: aliquota di ' +
      'computo del Fondo, non fissata da una singola legge); aliquota aggiuntiva 1% ex ' +
      'art. 3-ter del D.L. 19 settembre 1992, n. 384, conv. con mod. dalla L. 14 novembre ' +
      '1992, n. 438; massimale annuo ex art. 2 c. 18 della L. 335/1995',
    dettaglio:
      'L’aliquota aggiuntiva dell’1% colpisce la sola quota eccedente la prima fascia di ' +
      'retribuzione pensionabile, non l’intera retribuzione. Il massimale si applica ai soli ' +
      'iscritti privi di anzianità contributiva al 31/12/1995. L’art. 3-ter esiste solo per ' +
      'effetto della legge di conversione, quindi va citato insieme a essa.',
    prassi:
      'INPS, circolare n. 6 del 30/01/2026 — prima fascia di retribuzione pensionabile ' +
      '56.224 €, massimale annuo 122.295 €. Entrambi rivalutati ogni anno.',
    url: 'https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa.html',
    verifica:
      'importi 2026 riscontrati su fonti convergenti che citano la circolare INPS 6/2026; il ' +
      'testo della circolare non è stato aperto direttamente. Da riverificare a ogni circolare ' +
      'annuale INPS: sono i due valori del modello che cambiano ogni anno per certo',
  },

  nonConcorrenzaContributi: {
    livello: 1,
    etichetta: 'I contributi obbligatori non formano reddito',
    norma: 'Artt. 49 e 51 c. 2 lett. a) TUIR',
    dettaglio:
      'L’art. 49 definisce il reddito di lavoro dipendente; l’art. 51 c. 2 lett. a) stabilisce ' +
      'che i contributi previdenziali e assistenziali obbligatori non concorrono a formarlo. ' +
      'Il termine esatto è “non concorrenza”, non “deduzione”: l’onere deducibile è altra cosa ' +
      '(art. 10 c. 1 lett. e TUIR). Ne discende che l’imponibile fiscale è la RAL meno il ' +
      '9,19%, e che la somma esente del cuneo, calcolata sul reddito di lavoro dipendente, si ' +
      'applica a quell’imponibile e non alla RAL.',
    url:
      'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917',
    verifica:
      'usata per dirimere una divergenza con un calcolatore esterno (metodologia §3.4): il ' +
      'confronto ha segnalato l’anomalia, la prova è il testo dell’art. 51',
  },

  cuneoFiscale: {
    livello: 1,
    etichetta: 'Taglio del cuneo fiscale',
    norma: 'L. 30 dicembre 2024, n. 207, art. 1 cc. 4-9',
    dettaglio:
      'Due misure alternative in base al reddito complessivo: fino a 20.000 una somma esente ' +
      'da imposta erogata in busta paga (7,1%, 5,3% o 4,8%); da 20.000 a 40.000 una detrazione ' +
      'd’imposta di 1.000 € in décalage, rapportata al periodo di lavoro. La percentuale della ' +
      'somma esente è unica per fascia — “la percentuale corrispondente”, al singolare — e si ' +
      'individua sul reddito rapportato all’intero anno, applicandola poi al reddito ' +
      'effettivamente percepito. I commi non hanno termine finale: la misura è a regime.',
    prassi:
      'Circolare 4/E del 16/05/2025, par. 1.2 — gli esempi 1 e 2 mostrano il calcolo del ' +
      'reddito annuale teorico, l’esempio 3 che la percentuale si applica alla sola quota ' +
      'imponibile del reddito soggetto a tassazione in Italia.',
    url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2024-12-30;207',
    verifica:
      'testo dei commi 4-9 e i tre esempi della circolare letti integralmente; gli esempi 1 e 2 ' +
      'sono riprodotti in un test',
  },

  trattamentoIntegrativo: {
    livello: 1,
    etichetta: 'Trattamento integrativo',
    norma:
      'Art. 1 c. 1 del D.L. 5 febbraio 2020, n. 3, conv. con mod. dalla L. 2 aprile 2020, ' +
      'n. 21; soglie di 15.000 e 28.000 introdotte dall’art. 1 c. 3 della L. 234/2021; ' +
      'riduzione di 75 € inserita dall’art. 1 c. 3 della L. 207/2024',
    dettaglio:
      'Fino a 15.000 di reddito spettano 1.200 € se l’imposta lorda supera la detrazione ' +
      'dell’art. 13 comma 1 diminuita di 75 €, entrambi rapportati al periodo di lavoro. La ' +
      'condizione guarda l’imposta lorda, non la netta: fra 8.173,91 e 8.500 di reddito non si ' +
      'paga IRPEF e il trattamento spetta lo stesso. Da 15.000 a 28.000 spetta per la ' +
      'differenza tra la somma delle detrazioni elencate dalla norma e l’imposta lorda, nel ' +
      'limite di 1.200 €. Il testo originario del 2020 riportava soglie diverse: senza le ' +
      'modifiche successive i numeri non tornano.',
    prassi:
      'Circolare 4/E del 16/05/2025, par. 1.1 — la riduzione di 75 € “mira a neutralizzare ' +
      'l’incremento della detrazione … che avrebbe potuto determinare l’esclusione dal ' +
      'beneficio di alcuni soggetti”.',
    url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2020-02-05;3',
    verifica:
      'condizione di capienza verificata sul testo della circolare; la finestra 8.173,91-8.500 ' +
      'in cui il trattamento spetta senza IRPEF dovuta è coperta da un test',
  },

  addizionaleRegionale: {
    livello: 2,
    etichetta: 'Addizionale regionale IRPEF — Lombardia',
    norma:
      'Art. 50 del D.Lgs. 446/1997 per l’istituzione e la disciplina; aliquote e scaglioni ' +
      'stabiliti con legge regionale, non con delibera',
    dettaglio:
      'Aliquote per scaglioni, ancora agganciate agli scaglioni IRPEF ante riforma ' +
      '(15.000, 28.000, 50.000): l’art. 1 c. 727 della L. 207/2024 consente alle Regioni di ' +
      'mantenerli in via transitoria, e il c. 728 stabilisce che senza nuova legge regionale ' +
      'valgono scaglioni e aliquote dell’anno precedente. Il disallineamento con i tre ' +
      'scaglioni statali è quindi voluto dalla norma, non un errore del modello.',
    prassi:
      'Circolare 4/E del 16/05/2025, par. 1.4 — commenta i commi 726-729 sull’adeguamento ' +
      'delle addizionali e sul regime transitorio.',
    url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addregirpef/addregirpef.php?reg=10',
    verifica:
      'aliquote 2026 raccolte da fonti secondarie convergenti; la legge regionale che le fissa ' +
      'non è stata letta in originale. Da riverificare sul portale del Federalismo Fiscale del ' +
      'MEF o sul bollettino ufficiale della Regione',
  },

  addizionaleComunale: {
    livello: 2,
    etichetta: 'Addizionale comunale IRPEF — Milano',
    norma:
      'Art. 1 del D.Lgs. 360/1998: c. 3 per l’aliquota, c. 3-bis per la soglia di esenzione, ' +
      'c. 4 per la base imponibile e la condizione di debenza; aliquota e soglia deliberate ' +
      'dal Consiglio comunale',
    dettaglio:
      'Aliquota unica 0,80% con soglia di esenzione a 23.000 € di imponibile. È una soglia, ' +
      'non una franchigia: superata, l’addizionale è dovuta sull’intero imponibile e non sulla ' +
      'sola eccedenza — da qui il salto di circa 184 € descritto in metodologia §4.',
    url: 'https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/addcomirpef/sceltaregione.htm',
    verifica:
      'ATTENZIONE: è il parametro più debole del modello. Aliquota e soglia sono deliberate ' +
      'ogni anno dal Comune, la delibera vigente non è stata letta, e circolano indicazioni ' +
      'discordanti sulla soglia. Da riverificare sul record del Comune di Milano nel portale ' +
      'del Federalismo Fiscale prima di qualunque uso non dimostrativo',
  },

  addizionaliNoTaxArea: {
    livello: 1,
    etichetta: 'Addizionali non dovute in assenza di IRPEF',
    norma: 'Art. 50 c. 2 D.Lgs. 446/1997 (regionale); art. 1 c. 4 D.Lgs. 360/1998 (comunale)',
    dettaglio:
      'Le addizionali sono dovute solo se l’IRPEF, al netto delle detrazioni e dei crediti per ' +
      'redditi prodotti all’estero, risulta dovuta. Chi sta in no tax area non paga né IRPEF né ' +
      'addizionali. Nel motore questo impone un vincolo di ordine: le addizionali si calcolano ' +
      'dopo l’IRPEF netta e la ricevono come argomento.',
    prassi:
      'Istruzioni al quadro RV dei modelli Redditi PF e 730, che ripetono la condizione in una ' +
      'sola frase per entrambe le addizionali.',
    url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1997-12-15;446',
    verifica:
      'anomalia emersa dal confronto con un calcolatore esterno (metodologia §3.4); la prova è ' +
      'il testo dei due commi, non il confronto. Norma strutturale, nessuna riverifica annuale',
  },

  redditoComplessivo: {
    livello: 1,
    etichetta: 'Nozione di reddito complessivo usata per le soglie',
    norma: 'Art. 8 TUIR; art. 13 c. 6-bis TUIR; art. 1 c. 9 della L. 207/2024',
    dettaglio:
      'Il reddito che governa le soglie di detrazioni e cuneo è il c.d. reddito di riferimento: ' +
      'comprende anche redditi a cedolare secca, regime forfetario e mance a imposta ' +
      'sostitutiva, va assunto al netto della rendita dell’abitazione principale, e per il ' +
      'cuneo include la quota esente di impatriati e ricercatori. Il modello lo semplifica ' +
      'nell’imponibile da lavoro dipendente: esatto per chi ha solo questo reddito, ' +
      'approssimato altrimenti.',
    prassi:
      'Circolare 4/E del 16/05/2025, par. 1.1 e 1.2, che rinvia espressamente alla circolare ' +
      '22/E del 19/11/2024 per la nozione di reddito di riferimento.',
    url:
      'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917',
    verifica:
      'il rinvio alla circolare 22/E è citato testualmente dalla 4/E/2025 a pag. 6; ' +
      'semplificazione dichiarata in metodologia §5.1',
  },

  ragguaglioGiorni: {
    livello: 2,
    etichetta: 'Come si contano i giorni di lavoro nell’anno',
    norma: 'Circolare Ministero delle Finanze n. 326/E del 23/12/1997',
    dettaglio:
      'L’anno va sempre assunto di 365 giorni, anche se bisestile. I giorni da considerare sono ' +
      'quelli che hanno dato diritto a retribuzione assoggettata a ritenuta, comprese festività ' +
      'e riposi settimanali; vanno esclusi i giorni non retribuiti. In caso di più rapporti, i ' +
      'periodi contemporanei si contano una volta sola.',
    url: 'https://def.finanze.it/DocTribFrontend/RicercaLibera.jsp',
    verifica:
      'convenzione applicata dal motore al ragguaglio di detrazioni, ulteriore detrazione e ' +
      'trattamento integrativo; il testo della circolare non è stato aperto in originale',
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
