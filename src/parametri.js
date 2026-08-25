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
    statoVerifica: 'atto-letto',
    dove: 'D.P.R. 917/1986 art. 11 c. 1 e L. 199/2025 art. 1 c. 3, entrambi letti',
    canale: 'normattiva',
    etichetta: 'Aliquote e scaglioni IRPEF',
    norma:
      'Art. 11 c. 1 lett. b) TUIR (D.P.R. 917/1986), come modificato dall’art. 1 c. 3 ' +
      'della L. 30 dicembre 2025, n. 199 (legge di bilancio 2026)',
    dettaglio:
      'Il comma sostituisce “35 per cento” con “33 per cento” nella lettera b), lasciando ' +
      'invariati il 23% fino a 28.000 e il 43% oltre 50.000. È una novella secca: la ' +
      'decorrenza non sta nel comma ma nell’entrata in vigore della legge di bilancio. La ' +
      'stessa manovra introduce un correttivo di segno opposto per i redditi oltre ' +
      '200.000 euro, dichiarato in fuoriPerimetro.',
    prassi:
      'Nessuna circolare dell’Agenzia delle Entrate ha ancora commentato le aliquote 2026: il ' +
      '33% poggia sulla sola norma primaria. La circolare 4/E del 16/05/2025 commenta la legge ' +
      'di bilancio 2025 e descrive la seconda aliquota al 35%: conferma la struttura a tre ' +
      'scaglioni, non l’aliquota vigente.',
    url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2025-12-30;199',
    verifica:
      'VERIFICATO sul testo vigente del D.P.R. 917/1986 e sulla norma che lo modifica. ' +
      'L’art. 11 c. 1 riporta “a) fino a 28.000 euro, 23 per cento; b) oltre 28.000 euro e ' +
      'fino a 50.000 euro, 33 per cento; c) oltre 50.000 euro, 43 per cento”. Il comma ' +
      'della L. 199/2025 è stato letto in originale e dispone testualmente che “le parole: ' +
      '«35 per cento» sono sostituite dalle seguenti: «33 per cento»”, operando ' +
      'sull’art. 11 c. 1 lett. b): una novella secca, che non tocca né le soglie né le ' +
      'altre due aliquote. UN LIMITE VA DICHIARATO: il comma non porta con sé una ' +
      'decorrenza, quindi l’applicazione al periodo d’imposta 2026 discende ' +
      'dall’entrata in vigore della legge di bilancio, non da una parola del comma. ' +
      'Il riscontro sul testo unico pubblicato in Gazzetta Ufficiale (S.O. n. 26/L alla ' +
      'G.U. n. 152 del 3/7/2026) dà lo stesso risultato: quel testo si applica dal 2027, ' +
      'ma sulle aliquote non diverge da quello vigente nel 2026',
  },

  imposta: {
    livello: 1,
    statoVerifica: 'atto-letto',
    dove: 'D.P.R. 917/1986 (TUIR), testo vigente 2026 — art. 11 c. 3',
    canale: 'normattiva',
    etichetta: 'Imposta netta e limite di capienza',
    norma: 'Art. 11 c. 3 TUIR',
    dettaglio:
      'L’imposta netta si determina operando sull’imposta lorda, fino alla concorrenza del suo ' +
      'ammontare, le detrazioni degli artt. 12, 13, 15, 16 e 16-bis. È la norma che impedisce ' +
      'all’IRPEF di scendere sotto zero: l’eccedenza di detrazioni non diventa un credito, si ' +
      'perde. Il motore la implementa con un max(0, …) e la pagina mostra quanto va perduto.',
    url:
      'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917',
    verifica:
      'VERIFICATO sul testo vigente: l’art. 11 c. 3 dispone che l’imposta netta si determina ' +
      'operando sull’imposta lorda, “fino alla concorrenza del suo ammontare”, le detrazioni ' +
      'degli artt. 12, 13, 15, 16 e 16-bis. Nel testo unico riordinato la stessa regola sta al ' +
      'comma 4 anziché al comma 3, effetto della rinumerazione: per l’anno d’imposta 2026 il ' +
      'riferimento corretto resta il comma 3 del D.P.R. 917/1986, che è quello citato dal registro',
  },

  detrazioneLavoro: {
    livello: 1,
    statoVerifica: 'atto-letto',
    dove: 'D.P.R. 917/1986 (TUIR), testo vigente 2026 — art. 13 cc. 1 e 1.1',
    canale: 'normattiva',
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
      'VERIFICATO sul testo vigente del D.P.R. 917/1986. L’art. 13 c. 1 lett. a) contiene i ' +
      'minimi di 690 e 1.380 € DENTRO la lettera, quindi per i soli redditi fino a 15.000: è la ' +
      'lettura che ha corretto un errore del motore. Il c. 1.1 dispone testualmente che la ' +
      'detrazione “è aumentata di un importo pari a 65 euro, se il reddito complessivo è ' +
      'superiore a 25.000 euro ma non a 35.000 euro”, confermando importo, fascia e ' +
      'collocazione. Il c. 1-bis risulta “COMMA ABROGATO DAL D.L. 5 FEBBRAIO 2020, N. 3”, che ' +
      'è esattamente quanto il registro afferma. Il riscontro sul testo unico riordinato ' +
      '(S.O. n. 26/L alla G.U. n. 152 del 3/7/2026) conferma gli importi 1.955, 1.910 e 1.190 ' +
      'e le due formule per fascia, con la maggiorazione al comma 2 in luogo del comma 1.1. ' +
      'Era il valore più esposto del prototipo perché è quello su cui il modello diverge da un ' +
      'calcolatore esterno (metodologia §3.4): ora poggia sul testo di legge',
  },

  arrotondamentoRapporti: {
    livello: 1,
    statoVerifica: 'atto-letto',
    dove: 'D.P.R. 917/1986 (TUIR), testo vigente 2026 — art. 13 c. 6',
    canale: 'normattiva',
    etichetta: 'Le quattro cifre decimali dell’art. 13',
    norma: 'Art. 13 c. 6 TUIR (c. 8 nel testo unico riordinato)',
    dettaglio:
      '“Se il risultato dei rapporti indicati ai commi 1, 3 e 5 è maggiore di zero, lo stesso ' +
      'si assume nelle prime quattro cifre decimali.” Il rapporto interno alla formula della ' +
      'detrazione va quindi troncato alla quarta cifra prima di moltiplicarlo. Sul caso di ' +
      'riferimento vale 4 centesimi: poco in valore, ma è la differenza fra il numero che ' +
      'esce da un cedolino e un numero soltanto verosimile. La regola riguarda i rapporti ' +
      'dell’art. 13 e non il décalage dell’ulteriore detrazione, che sta in un altro comma.',
    url:
      'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917',
    verifica:
      'VERIFICATO sul testo vigente: l’art. 13 c. 6 dispone che “se il risultato dei rapporti ' +
      'indicati nei commi 1, 3, 4 e 5 è maggiore di zero, lo stesso si assume nelle prime ' +
      'quattro cifre decimali”. Nel testo unico riordinato la stessa regola sta al comma 8 e ' +
      'rinvia ai commi 1, 3 e 5: differenza di rinumerazione, non di sostanza, e il rapporto ' +
      'usato dal motore è quello del comma 1, citato da entrambe le versioni. Resta un ' +
      'margine interpretativo su “si assume”: il motore tronca, che è la prassi corrente dei ' +
      'software di paghe; leggerlo come arrotondamento cambierebbe l’esito di pochi centesimi',
  },

  baseContributiva: {
    livello: 1,
    statoVerifica: 'non-verificata',
    dove: 'L. 153/1969 art. 12, come riscritto dall’art. 6 del D.Lgs. 314/1997',
    canale: 'normattiva',
    lacuna:
      'nessuna lettura diretta: la norma è citata, non verificata. Non incide su alcun valore ' +
      'calcolato dal modello',
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
    statoVerifica: 'atto-letto',
    dove: 'Tabelle INPS delle aliquote contributive per il FPLD, settore privato non agricolo (per l’aliquota IVS del 9,19%)',
    canale: 'inps',
    lacuna:
      'l’aliquota IVS del 9,19% non è coperta da questa circolare né da alcuna fonte letta',
    etichetta: 'Aliquote e limiti contributivi a carico del dipendente',
    norma:
      'Aliquota IVS 9,19% (quota lavoratore, FPLD settore privato non agricolo: aliquota di ' +
      'computo del Fondo, non fissata da una singola legge); aliquota aggiuntiva 1% ex ' +
      'art. 3-ter del D.L. 19 settembre 1992, n. 384, conv. con mod. dalla L. 14 novembre ' +
      '1992, n. 438; massimale annuo ex art. 2 c. 18 della L. 335/1995',
    dettaglio:
      'L’aliquota aggiuntiva dell’1% colpisce la sola quota eccedente la prima fascia di ' +
      'retribuzione pensionabile, non l’intera retribuzione, ed è dovuta perché il regime di ' +
      'iscrizione prevede un’aliquota a carico del lavoratore inferiore al 10%. Il massimale ' +
      'si applica ai soli iscritti privi di anzianità contributiva al 31/12/1995 e opera anche ' +
      'ai fini dell’aliquota aggiuntiva: l’eccedenza sulla prima fascia si misura quindi sulla ' +
      'base già limitata al massimale, come fa il motore. Durante l’anno il contributo si versa ' +
      'con il criterio della mensilizzazione, sulla quota che eccede il tetto mensile, ma a fine ' +
      'anno si conguaglia sul limite ANNUO: il modello calcola direttamente l’esito ' +
      'conguagliato. L’art. 3-ter esiste solo per effetto della legge di conversione, quindi va ' +
      'citato insieme a essa.',
    prassi:
      'INPS, circolare n. 6 del 30 gennaio 2026, “Determinazione per l’anno 2026 del limite ' +
      'minimo di retribuzione giornaliera e aggiornamento degli altri valori per il calcolo di ' +
      'tutte le contribuzioni dovute in materia di previdenza e assistenza sociale per la ' +
      'generalità dei lavoratori dipendenti”. È la circolare annuale in cui vivono la prima ' +
      'fascia di retribuzione pensionabile e il massimale contributivo, entrambi rivalutati ' +
      'ogni anno.',
    url: 'https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa.html',
    verifica:
      'VERIFICATO sul testo della circolare INPS n. 6 del 30/01/2026, letta nella parte ' +
      'rilevante: prima fascia di ' +
      'retribuzione pensionabile annua 56.224,00 € e massimale annuo 122.295,00 € (122.295,40 ' +
      'prima dell’arrotondamento). Confermati anche la condizione dell’aliquota inferiore al ' +
      '10% e il fatto che il massimale operi anche ai fini dell’1%, che è ciò che il motore ' +
      'implementa. Resta scoperta la sola aliquota IVS del 9,19%: è un’aliquota di computo del ' +
      'Fondo, non fissata da una singola norma né contenuta in questa circolare, e va cercata ' +
      'nelle circolari INPS sulle aliquote contributive di settore. I due importi sono ' +
      'rivalutati ogni anno: da riverificare a ogni circolare annuale',
  },

  nonConcorrenzaContributi: {
    livello: 1,
    statoVerifica: 'atto-letto',
    dove: 'D.P.R. 917/1986 (TUIR), testo vigente 2026 — artt. 49 e 51 c. 2 lett. a)',
    canale: 'normattiva',
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
      'VERIFICATO sul testo vigente. L’art. 51 c. 2 lett. a) dispone che “non concorrono a ' +
      'formare il reddito: a) i contributi previdenziali e assistenziali versati dal datore di ' +
      'lavoro o dal lavoratore in ottemperanza a disposizioni di legge”. L’art. 49 c. 1 ' +
      'definisce redditi di lavoro dipendente “quelli che derivano da rapporti aventi per ' +
      'oggetto la prestazione di lavoro, con qualsiasi qualifica, alle dipendenze e sotto la ' +
      'direzione di altri”: è la categoria in cui ricade il caso simulato e quella su cui si ' +
      'commisura la somma esente del cuneo. Le due letture chiudono la catena con cui il ' +
      'modello sostiene che la somma esente si calcola sull’imponibile e non sulla RAL ' +
      '(metodologia §3.4), e confermano il termine esatto: non concorrenza, non deduzione. ' +
      'Il riscontro sul testo unico riordinato (art. 53, con nota di corrispondenza all’art. ' +
      '51) dà lo stesso testo',
  },

  cuneoFiscale: {
    livello: 1,
    statoVerifica: 'atto-letto',
    dove: 'L. 207/2024, art. 1 cc. 4-9, letti in originale',
    canale: 'normattiva',
    etichetta: 'Taglio del cuneo fiscale',
    norma: 'L. 30 dicembre 2024, n. 207, art. 1 cc. 4-9',
    dettaglio:
      'Due misure alternative in base al reddito complessivo, che si danno il cambio ' +
      'esattamente a 20.000 senza sovrapporsi né lasciare vuoti: fino a 20.000 compresi ' +
      'una somma esente da imposta erogata in busta paga (7,1%, 5,3% o 4,8%); oltre ' +
      '20.000 una detrazione d’imposta di 1.000 € piena fino a 32.000 e poi in décalage ' +
      'lineare fino ad azzerarsi a 40.000. La percentuale della somma esente è unica per ' +
      'fascia — “la percentuale corrispondente”, al singolare — e si individua sul ' +
      'reddito rapportato all’intero anno “ai soli fini dell’individuazione della ' +
      'percentuale applicabile”, applicandola poi al reddito effettivamente percepito. ' +
      'Solo la detrazione è “rapportata al periodo di lavoro”: la somma esente non ne ha ' +
      'bisogno, essendo già una quota di un reddito che il periodo lo riflette. Entrambe ' +
      'spettano ai titolari di reddito di lavoro dipendente dell’art. 49, con esclusione ' +
      'dei pensionati: il caso modellato vi rientra. I commi non hanno termine finale: ' +
      'la misura è a regime.',
    prassi:
      'Circolare 4/E del 16/05/2025, par. 1.2 — gli esempi 1 e 2 mostrano il calcolo del ' +
      'reddito annuale teorico, l’esempio 3 che la percentuale si applica alla sola quota ' +
      'imponibile del reddito soggetto a tassazione in Italia.',
    url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2024-12-30;207',
    verifica:
      'VERIFICATO sui commi in originale, e sono i confini letterali a coincidere uno per ' +
      'uno con quelli del motore: “non superiore a 20.000” per la somma esente e ' +
      '“superiore a 20.000” per la detrazione, quindi a 20.000 esatti spetta la prima e ' +
      'non la seconda; “non superiore a 8.500”, “superiore a 8.500 ma non a 15.000”, ' +
      '“superiore a 15.000” per le tre percentuali; “superiore a 20.000 ma non a 32.000” ' +
      'per i 1.000 € pieni; e il décalage scritto come “prodotto tra 1.000 euro e ' +
      'l’importo corrispondente al rapporto tra 40.000 euro, diminuito del reddito ' +
      'complessivo, e 8.000 euro”, che è la formula implementata con il denominatore ' +
      'ricavato dai due estremi anziché scritto a mano. Un test li ripercorre tutti. La ' +
      'lettura in originale ha aggiunto due cose che la circolare non dava: l’esclusione ' +
      'dei pensionati (art. 49 c. 2 lett. a) da entrambe le misure, e il fatto che il ' +
      'comma 5 annualizzi il reddito “ai soli fini dell’individuazione della percentuale ' +
      'applicabile” — cioè esattamente ciò che il motore fa, e nulla di più. La ' +
      'circolare 4/E resta il riscontro sugli esempi numerici, riprodotti in due test',
  },

  trattamentoIntegrativo: {
    livello: 1,
    statoVerifica: 'prassi-letta',
    dove: 'D.L. 3/2020 conv. L. 21/2020, art. 1 c. 1, testo consolidato',
    canale: 'normattiva',
    lacuna:
      'il testo è stato letto nelle note della circolare; il D.L. 3/2020 consolidato non è stato ' +
      'aperto',
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
      'in cui il trattamento spetta senza IRPEF dovuta è coperta da un test. Cercato nel testo ' +
      'unico riordinato: non vi compare: il trattamento integrativo resta fuori dal TUIR, ' +
      'disciplinato dal solo D.L. 3/2020 e dalle sue modifiche',
  },

  addizionaleRegionale: {
    livello: 2,
    statoVerifica: 'fonte-istituzionale',
    dove: 'l.r. Lombardia 14 luglio 2003, n. 10, art. 72, come modificato dalla l.r. 31 marzo 2022, n. 5',
    canale: 'burl',
    lacuna:
      'aliquote e scaglioni letti sulla pagina della Regione, non sull’art. 72 della l.r. 10/2003',
    etichetta: 'Addizionale regionale IRPEF — Lombardia',
    norma:
      'Art. 50 del D.Lgs. 446/1997 per l’istituzione e la disciplina; per la Lombardia, ' +
      'art. 72 della l.r. 14 luglio 2003, n. 10, come da ultimo modificato dall’art. 1 c. 1 ' +
      'lett. a) della l.r. 31 marzo 2022, n. 5',
    dettaglio:
      'Aliquote PROGRESSIVE per scaglioni — la Regione usa esattamente questo termine — ' +
      'applicate al reddito complessivo determinato ai fini IRPEF, al netto degli oneri ' +
      'deducibili: la stessa base dell’addizionale comunale. Gli scaglioni sono agganciati a ' +
      'quelli IRPEF della L. 234/2021, adottati dalla l.r. 5/2022 “a partire dall’anno 2022”: ' +
      'sono quindi rimasti a quattro fasce mentre l’IRPEF statale è passata a tre. Il ' +
      'disallineamento è voluto — l’art. 1 c. 727 della L. 207/2024 consente alle Regioni di ' +
      'mantenerli in via transitoria e il c. 728 dispone che senza nuova legge regionale ' +
      'valgano scaglioni e aliquote dell’anno precedente — non è un errore del modello.',
    prassi:
      'Circolare 4/E del 16/05/2025, par. 1.4 — commenta i commi 726-729 sull’adeguamento ' +
      'delle addizionali e sul regime transitorio.',
    url: 'https://www.regione.lombardia.it/wps/portal/istituzionale/HP/servizi-e-informazioni/cittadini/Tributi/addizionale-regionale-irpef',
    verifica:
      'Letto sulla pagina istituzionale di Regione Lombardia: le quattro aliquote e i ' +
      'quattro scaglioni coincidono con quelli implementati, la base è il reddito complessivo ' +
      'al netto degli oneri deducibili, e le aliquote sono dichiarate PROGRESSIVE — cioè ' +
      'applicate per scaglioni successivi e non in misura unica sull’intero reddito, che era ' +
      'un’assunzione del modello non ancora confermata. La pagina indica anche la norma esatta ' +
      '(art. 72 l.r. 10/2003, modificato dalla l.r. 5/2022) e riporta fra gli allegati la ' +
      'convenzione con l’Agenzia delle Entrate per il triennio 2026-2028, che ne conferma ' +
      'l’attualità. Verificato inoltre sul testo dell’art. 50 del D.Lgs. 446/1997 il quadro in ' +
      'cui la legge regionale opera: base imponibile, obbligo di pubblicazione del provvedimento ' +
      'entro il 31 dicembre dell’anno precedente e invio dei dati al sito informatico del MEF ' +
      'entro il 31 gennaio, con inapplicabilità di sanzioni e interessi in caso di mancato ' +
      'inserimento. Il testo della legge regionale non è stato letto in originale',
  },

  addizionaleComunale: {
    livello: 2,
    statoVerifica: 'fonte-istituzionale',
    dove: 'Deliberazioni C.C. Milano n. 36 del 21/10/2013 (aliquota) e n. 46 del 28/09/2020 (soglia) — PDF già elencati fra i riferimenti normativi della pagina del Comune',
    canale: 'comune',
    lacuna:
      'aliquota, soglia ed estremi delle delibere letti sulla pagina del Comune; le delibere ' +
      'n. 36/2013 e n. 46/2020 non sono state aperte',
    etichetta: 'Addizionale comunale IRPEF — Milano',
    norma:
      'Art. 1 del D.Lgs. 360/1998: c. 3 per l’aliquota, c. 3-bis per la soglia di esenzione, ' +
      'c. 4 per la base imponibile e la condizione di debenza. Per Milano: Regolamento ' +
      'comunale approvato con Deliberazione C.C. n. 41 del 01/08/2011; aliquota unica 0,80% ' +
      'approvata con Deliberazione C.C. n. 36 del 21/10/2013; soglia di esenzione elevata a ' +
      '23.000 € a decorrere dal 2020 con Deliberazione C.C. n. 46 del 28/09/2020, che ha ' +
      'modificato l’art. 6 c. 2 del Regolamento. Codice ente F205',
    dettaglio:
      'Aliquota unica 0,80% con soglia di esenzione a 23.000 € di imponibile IRPEF. È una ' +
      'soglia, non una franchigia, e il Comune lo dichiara testualmente: “l’esenzione non ' +
      'equivale a franchigia e dunque non si applica nei casi in cui il reddito complessivo ' +
      'sia superiore a 23.000 euro”. Superata la soglia l’addizionale è quindi dovuta ' +
      'sull’intero imponibile e non sulla sola eccedenza — da qui il salto di circa 184 € ' +
      'descritto in metodologia §4.',
    prassi:
      'Comune di Milano, pagina istituzionale sull’addizionale comunale IRPEF, che riporta ' +
      'aliquota, esenzione, gli estremi della delibera e le modalità di trattenuta in busta ' +
      'paga: acconto del 30% in un massimo di 9 rate da marzo, saldo determinato dal sostituto ' +
      'in sede di conguaglio e trattenuto in un massimo di 11 rate.',
    url: 'https://www.comune.milano.it/servizi/addizionale-comunale-irpef',
    verifica:
      'Letto sulla pagina istituzionale del Comune di Milano e sull’elenco dei suoi ' +
      'riferimenti normativi. Entrambi i valori hanno ora la delibera che li fissa: l’aliquota ' +
      'la n. 36/2013, la soglia la n. 46/2020, che la eleva a 23.000 € “a decorrere dall’anno ' +
      '2020”. Sono i due atti ancora citati come vigenti dal Comune, quindi i valori non sono ' +
      'stati modificati da allora e non dipendono da una delibera annuale. Verificata a parole ' +
      'anche la natura di soglia e non di franchigia. Nota terminologica: la fonte usa ' +
      '“reddito imponibile” nell’enunciato dell’esenzione e “reddito complessivo” nella FAQ ' +
      'corrispondente; nel modello le due grandezze coincidono per semplificazione dichiarata',
  },

  addizionaliNoTaxArea: {
    livello: 1,
    statoVerifica: 'atto-letto',
    etichetta: 'Addizionali non dovute in assenza di IRPEF',
    norma: 'Art. 50 c. 2 D.Lgs. 446/1997 (regionale); art. 1 c. 4 D.Lgs. 360/1998 (comunale)',
    dettaglio:
      'Le due norme dicono la stessa cosa con le stesse parole. Regionale: l’addizionale “è ' +
      'dovuta se per lo stesso anno l’imposta sul reddito delle persone fisiche, al netto delle ' +
      'detrazioni per essa riconosciute e dei crediti di cui agli articoli 14 e 15 del citato ' +
      'testo unico, risulta dovuta”. Comunale: “è dovuta se per lo stesso anno risulta dovuta ' +
      'l’imposta sul reddito delle persone fisiche, al netto delle detrazioni per essa ' +
      'riconosciute e del credito di cui all’articolo 165 del TUIR” — il diverso numero di ' +
      'articolo riflette solo la rinumerazione del TUIR del 2004. Chi sta in no tax area non ' +
      'paga né IRPEF né addizionali. Entrambi i commi fissano anche la stessa base: il reddito ' +
      'complessivo determinato ai fini IRPEF, al netto degli oneri deducibili. Nel motore la ' +
      'regola impone un vincolo di ordine: le addizionali si calcolano dopo l’IRPEF netta e la ' +
      'ricevono come argomento.',
    prassi:
      'Istruzioni al quadro RV dei modelli Redditi PF e 730, che ripetono la condizione in una ' +
      'sola frase per entrambe le addizionali. La disciplina delle addizionali non sta nel ' +
      'TUIR e non è confluita nel testo unico riordinato: va cercata nei due decreti che le ' +
      'istituiscono.',
    url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:1997-12-15;446',
    verifica:
      'VERIFICATO sul testo vigente di entrambi i decreti, letti per intero nella parte ' +
      'rilevante: art. 50 c. 2 del ' +
      'D.Lgs. 446/1997 per la regionale, art. 1 c. 4 del D.Lgs. 360/1998 per la comunale. ' +
      'Il modello le tratta allo stesso modo perché le norme sono formulate allo stesso modo, ' +
      'non per analogia. L’anomalia era emersa dal confronto con un calcolatore esterno ' +
      '(metodologia §3.4): il confronto ha segnalato, la prova è il testo. Norma strutturale, ' +
      'nessuna riverifica annuale',
  },

  redditoComplessivo: {
    livello: 1,
    statoVerifica: 'atto-letto',
    dove: 'D.P.R. 917/1986 (TUIR), testo vigente 2026 — artt. 8 e 13 c. 6-bis',
    canale: 'normattiva',
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
      'VERIFICATO sul testo vigente per entrambe le regole che incidono sul calcolo. ' +
      'L’art. 8 c. 1 dispone che “il reddito complessivo si determina sommando i redditi ' +
      'di ogni categoria che concorrono a formarlo e sottraendo le perdite derivanti ' +
      'dall’esercizio di arti e professioni”: è una definizione per somma di categorie, ' +
      'che non contiene di per sé le estensioni del reddito di riferimento. Quelle stanno ' +
      'nell’art. 1 c. 9 della L. 207/2024, ora letto in originale, che per il cuneo fa ' +
      'rilevare “anche la quota esente del reddito agevolato” di ricercatori e ' +
      'impatriati e assume il reddito “al netto del reddito dell’unità immobiliare ' +
      'adibita ad abitazione principale e di quello delle relative pertinenze”. La stessa ' +
      'regola vale per le detrazioni dell’art. 13, dove sta al c. 6-bis. Le due letture ' +
      'confermano che reddito complessivo e reddito di riferimento vanno tenuti ' +
      'distinti, come il registro già faceva: la semplificazione a imponibile da lavoro ' +
      'dipendente è dichiarata in metodologia §5.1',
  },

  ragguaglioGiorni: {
    livello: 2,
    statoVerifica: 'non-verificata',
    dove: 'Circolare Ministero delle Finanze n. 326/E del 23/12/1997, par. 3 — richiamata anche dalla circolare INPS n. 7 del 15/01/2010',
    canale: 'def',
    lacuna:
      'la circolare 326/E del 1997 non è stata letta: la convenzione dei 365 giorni è applicata ' +
      'sulla base di prassi consolidata, non di una lettura diretta',
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
    // Il rapporto interno alle formule delle fasce va assunto nelle prime
    // quattro cifre decimali (art. 13 c. 6 TUIR).
    cifreDecimaliRapporto: 4,
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
      voce: 'Fringe benefit e welfare aziendale',
      norma:
        'Art. 51 c. 2 e c. 3 TUIR (art. 53 nel testo riordinato); soglia elevata per il ' +
        'triennio 2025-2027 dall’art. 1 c. 390 della L. 207/2024',
      motivo:
        'Beni e servizi ceduti al dipendente non concorrono al reddito entro 258,23 € l’anno, ' +
        'soglia elevata a 1.000 € (2.000 € con figli a carico) per il 2025, 2026 e 2027. ' +
        'Superata la soglia concorre l’intero valore, non l’eccedenza: è un altro effetto ' +
        'soglia, della stessa famiglia di quello dell’addizionale comunale. Fuori perimetro ' +
        'perché dipende da scelte aziendali che la RAL non descrive.',
    },
    {
      voce: 'Buoni pasto, trasferte, auto aziendale',
      norma: 'Art. 51 c. 2 lett. b), c. 4 lett. a) e c. 5 TUIR (art. 53 nel testo riordinato)',
      motivo:
        'Ticket esenti fino a 4 € al giorno in forma cartacea e 10 € in forma elettronica; ' +
        'indennità di trasferta esenti fino a 46,48 € al giorno in Italia e 77,47 € all’estero; ' +
        'auto in uso promiscuo tassata al 50% della percorrenza convenzionale, ridotta al 10% ' +
        'per le elettriche e al 20% per le ibride plug-in. Sono voci del cedolino, non della ' +
        'RAL: il prototipo parte dalla retribuzione annua e non le vede.',
    },
    {
      voce: 'Premi di risultato a tassazione sostitutiva',
      norma: 'Art. 1 cc. 182-189 L. 208/2015 e successive rimodulazioni',
      motivo:
        'Imposta sostitutiva agevolata in luogo dell’IRPEF ordinaria, entro limiti di importo e ' +
        'di reddito. Richiede un contratto collettivo di secondo livello: fuori dal caso standard.',
    },
    {
      voce: 'Mensilizzazione dell’aliquota aggiuntiva dell’1% (cassa infrannuale)',
      norma:
        'Art. 3-ter D.L. 384/1992; INPS circ. n. 6 del 30/01/2026 e circ. n. 156 del ' +
        '30/12/2025, par. sul contributo aggiuntivo IVS',
      motivo:
        'Durante l’anno il contributo si versa con il criterio della mensilizzazione, cioè ' +
        'sulla quota che eccede il tetto mensile. La circolare sul conguaglio di fine anno ' +
        'precisa però che “tale criterio può rendere necessario procedere a operazioni di ' +
        'conguaglio, a credito o a debito del lavoratore”, e che in caso di più rapporti “le ' +
        'retribuzioni si cumulano ai fini del superamento della prima fascia di retribuzione ' +
        'pensionabile”, che è il limite ANNUO. L’esito definitivo è quindi l’1% sulla quota ' +
        'annua eccedente la prima fascia: esattamente ciò che il modello calcola. La ' +
        'mensilizzazione è una regola di cassa infrannuale — lo stesso schema delle addizionali ' +
        '— e il modello ne salta i movimenti intermedi arrivando direttamente al conguagliato. ' +
        'Fuori perimetro è la simulazione del flusso mese per mese, non il risultato.',
    },
    {
      voce: 'Recupero del cuneo non spettante in dieci rate',
      norma: 'L. 207/2024 art. 1 cc. 7 e 8',
      motivo:
        'Il sostituto d’imposta riconosce somma esente e ulteriore detrazione “in via ' +
        'automatica … all’atto dell’erogazione delle retribuzioni” e ne “verifica in sede di ' +
        'conguaglio la spettanza”. Se al conguaglio non spettano le recupera, e sopra 60 € il ' +
        'recupero avviene “in dieci rate di pari ammontare”. È di nuovo una regola di cassa ' +
        'infrannuale con esito annuale: chi ha diritto alla misura per l’intero anno non vede ' +
        'alcun recupero, ed è il caso modellato. La compensazione del credito da parte del ' +
        'sostituto (c. 8, art. 17 D.Lgs. 241/1997) sta interamente dal lato azienda e non tocca ' +
        'la busta paga.',
    },
    {
      voce: 'Addizionali per cassa',
      norma: 'Art. 50 D.Lgs. 446/1997; art. 1 c. 5 D.Lgs. 360/1998',
      motivo:
        'In busta paga non si versano per competenza, e non è una prassi ma la norma. E le due ' +
        'addizionali non seguono nemmeno lo stesso meccanismo. La COMUNALE (art. 1 c. 5 ' +
        'D.Lgs. 360/1998) prevede un acconto determinato dal sostituto e trattenuto in un ' +
        'massimo di 9 rate da marzo, più un saldo determinato al conguaglio e trattenuto in un ' +
        'massimo di 11 rate. La REGIONALE (art. 50 c. 4 D.Lgs. 446/1997) non ha acconto: è ' +
        'determinata interamente all’atto del conguaglio e trattenuta in un massimo di 11 rate ' +
        'dal periodo di paga successivo. In entrambi i casi, se il rapporto cessa, la trattenuta ' +
        'avviene in unica soluzione. Il modello calcola per competenza sull’anno in corso: su una retribuzione ' +
        'stabile la differenza si annulla, nell’anno di assunzione o di forte aumento no.',
    },
  ],
};

export const PARAMETRI_DEFAULT = PARAMETRI_2026;

/** Fonte dichiarata da un blocco di parametri, per la UI e per i test. */
export function fonteDi(bloccoParametri) {
  return FONTI[bloccoParametri?.fonte];
}
