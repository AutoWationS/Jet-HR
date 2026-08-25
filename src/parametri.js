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
    statoVerifica: 'atto-letto',
    dove: 'L. 153/1969 art. 12, testo sostituito dall’art. 6 del D.Lgs. 314/1997, letto in originale',
    canale: 'normattiva',
    etichetta: 'Base imponibile previdenziale',
    norma: 'Art. 12 L. 153/1969, come riscritto dall’art. 6 del D.Lgs. 314/1997',
    dettaglio:
      'Armonizza la base imponibile previdenziale con quella fiscale: il c. 1 rinvia per ' +
      'la nozione di reddito di lavoro dipendente allo stesso articolo del TUIR usato dal ' +
      'fisco, il c. 2 rinvia all’articolo sulla determinazione, e il c. 3 introduce la ' +
      'differenza che conta — le somme si intendono AL LORDO di qualsiasi contributo e ' +
      'trattenuta. È la norma per cui l’aliquota contributiva si applica alla ' +
      'retribuzione lorda: l’art. 51 c. 2 lett. a) TUIR spiega perché i contributi escono ' +
      'dall’imponibile fiscale, questa spiega perché non escono da quello previdenziale. ' +
      'Il c. 4 elenca le esclusioni, prima fra tutte il TFR, e il c. 5 precisa che ' +
      'l’elencazione è tassativa.',
    url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:1969-04-30;153',
    verifica:
      'VERIFICATO sul testo dell’articolo, che l’art. 6 del D.Lgs. 314/1997 ha sostituito ' +
      'per intero. Il c. 3 dispone che le somme e i valori “si intendono al lordo di ' +
      'qualsiasi contributo e trattenuta”: è la base del 9,19% applicato alla RAL, e la ' +
      'formulazione è esplicita al punto da non lasciare margine. Il c. 4 lett. a) esclude ' +
      'dalla base “le somme corrisposte a titolo di trattamento di fine rapporto”, quindi ' +
      'il TFR è fuori sia dall’imponibile fiscale sia da quello previdenziale, e il c. 5 ' +
      'chiude l’elenco dichiarandolo tassativo. Una curiosità che vale come controprova: ' +
      'l’articolo rinvia agli artt. 46 e 48 del TUIR, cioè alla numerazione anteriore al ' +
      'riordino del 2004; sono gli attuali artt. 49 e 51, gli stessi due letti sul testo ' +
      'vigente per la parte fiscale. Le due basi partono dalla stessa definizione e ' +
      'divergono solo per il c. 3',
  },

  contributi: {
    livello: 2,
    statoVerifica: 'atto-letto',
    dove: 'Tabelle INPS delle aliquote contributive per l’anno in corso (per riconfermare il 9,19% sul 2026)',
    canale: 'inps',
    lacuna:
      'la misura del 9,19% è letta su una circolare del 2011, che la dà per assestata ' +
      'dal 2002; per l’anno 2026 non è stata riconfermata su un documento dell’anno',
    etichetta: 'Aliquote e limiti contributivi a carico del dipendente',
    norma:
      'Aliquota IVS 9,19% (quota lavoratore, FPLD settore privato non agricolo: aliquota ' +
      'di computo del Fondo, non fissata da una singola legge; il percorso di ' +
      'adeguamento discende dall’art. 3 c. 23 della L. 335/1995 e dall’art. 1 c. 769 ' +
      'della L. 296/2006); aliquota aggiuntiva 1% ex art. 3-ter del D.L. 19 settembre ' +
      '1992, n. 384, conv. con mod. dalla L. 14 novembre 1992, n. 438; massimale annuo ' +
      'ex art. 2 c. 18 della L. 335/1995',
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
      'INPS, circolare n. 6 del 30 gennaio 2026, per la prima fascia di retribuzione ' +
      'pensionabile e il massimale contributivo, entrambi rivalutati ogni anno. INPS, ' +
      'circolare n. 40 del 22 febbraio 2011, per la misura e la composizione ' +
      'dell’aliquota a carico del lavoratore.',
    url: 'https://www.inps.it/it/it/inps-comunica/atti/circolari-messaggi-e-normativa.html',
    verifica:
      'VERIFICATO su due circolari INPS. La n. 6 del 30/01/2026, per prima fascia di ' +
      'retribuzione pensionabile annua 56.224,00 € e massimale annuo 122.295,00 € ' +
      '(122.295,40 prima dell’arrotondamento), oltre alla condizione dell’aliquota ' +
      'inferiore al 10% e al fatto che il massimale operi anche ai fini dell’1%, che è ' +
      'ciò che il motore implementa. La n. 40 del 22/02/2011 per l’aliquota IVS: la ' +
      'tabella del settore privato non agricolo riporta “Totale 33,00% — a carico del ' +
      'lavoratore 9,19%”, e il testo spiega perché quel numero non si muove — ' +
      '“risulta esaurito l’adeguamento dell’aliquota contributiva a carico del ' +
      'lavoratore in quanto, per effetto dell’incremento di 0,50 punti percentuali ' +
      'operato, da ultimo, alla data del 1.1.2002, la stessa aliquota ha già raggiunto ' +
      'la misura piena (8,89% + 0,30 = totale 9,19%)”. La progressione annuale ' +
      'riguardava il datore di lavoro, non il dipendente. IL LIMITE VA DETTO: è un ' +
      'documento del 2011, e prova che l’aliquota era assestata allora, non che sia ' +
      'identica oggi. La prima fascia e il massimale sono invece da riverificare a ogni ' +
      'circolare annuale, perché rivalutati',
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
    statoVerifica: 'atto-letto',
    dove: 'D.L. 3/2020 conv. L. 21/2020, art. 1, testo consolidato, letto in originale',
    canale: 'normattiva',
    etichetta: 'Trattamento integrativo',
    norma:
      'Art. 1 c. 1 del D.L. 5 febbraio 2020, n. 3, conv. con mod. dalla L. 2 aprile 2020, ' +
      'n. 21; soglie di 15.000 e 28.000 introdotte dall’art. 1 c. 3 della L. 234/2021; ' +
      'riduzione di 75 € inserita dall’art. 1 c. 3 della L. 207/2024',
    dettaglio:
      'Fino a 15.000 di reddito compresi spettano 1.200 € se l’imposta lorda supera la ' +
      'detrazione dell’art. 13 COMMA 1 diminuita di 75 €, entrambi rapportati al periodo ' +
      'di lavoro. Il rinvio al solo comma 1 esclude la maggiorazione di 65 € del ' +
      'c. 1.1: le due grandezze vanno tenute separate anche dove si sovrappongono, fra ' +
      '25.000 e 28.000 di reddito. La condizione guarda l’imposta LORDA, non la netta: ' +
      'fra 8.173,91 e 8.500 di reddito non si paga IRPEF e il trattamento spetta lo ' +
      'stesso. Da 15.000 a 28.000 spetta per la differenza fra la somma delle detrazioni ' +
      'elencate dalla norma e l’imposta lorda, nel limite di 1.200 €; ma quelle voci sono ' +
      'quasi tutte oneri detraibili per spese sostenute fino al 31/12/2021, che il ' +
      'modello non rappresenta, e con la sola detrazione dell’art. 13 l’imposta lorda le ' +
      'supera sempre. In questo perimetro la seconda fascia vale strutturalmente zero.',
    prassi:
      'Circolare 4/E del 16/05/2025, par. 1.1 — la riduzione di 75 € “mira a neutralizzare ' +
      'l’incremento della detrazione … che avrebbe potuto determinare l’esclusione dal ' +
      'beneficio di alcuni soggetti”.',
    url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legge:2020-02-05;3',
    verifica:
      'VERIFICATO sull’articolo in originale, testo consolidato. Il c. 1 lega la ' +
      'condizione della prima fascia alla “detrazione spettante ai sensi dell’articolo ' +
      '13, comma 1”: il rinvio al SOLO comma 1 è la ragione per cui il motore passa alla ' +
      'funzione la detrazione base e non il totale, e la distinzione morde davvero fra ' +
      '25.000 e 28.000, dove la maggiorazione del c. 1.1 esiste ma non entra nel ' +
      'confronto. Lo scarto di 75 € compare fra doppie parentesi — segno della modifica ' +
      'operata dalla L. 207/2024 — con le parole “rapportato al periodo di lavoro ' +
      'nell’anno”, che il motore applica allo scarto e non solo all’importo; e il c. 2 ' +
      'conferma che l’intero trattamento “è rapportato al periodo di lavoro”. Il confine ' +
      'della prima fascia è “non superiore a 15.000 euro”, quindi a 15.000 esatti spetta ' +
      'ancora. La condizione è scritta con un “superiore a”, non con un “pari o ' +
      'superiore”: il motore usa un > stretto. Resta un margine interpretativo ' +
      'dichiarato: nella seconda fascia la norma pone un tetto di “1.200 euro” e il c. 2 ' +
      'rapporta il trattamento al periodo di lavoro, senza dire se il tetto vada ' +
      'ragguagliato prima o dopo; il motore lo ragguaglia, e su un anno intero le due ' +
      'letture coincidono. In questo perimetro la questione è teorica, perché la seconda ' +
      'fascia vale sempre zero. Gli esempi della circolare 4/E restano il riscontro ' +
      'numerico, riprodotti nei test',
  },

  addizionaleRegionale: {
    livello: 2,
    statoVerifica: 'atto-letto',
    dove: 'l.r. Lombardia 14 luglio 2003, n. 10, art. 72, testo consolidato, letto in originale',
    canale: 'burl',
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
      'VERIFICATO sull’art. 72 della legge regionale, testo consolidato. Le quattro ' +
      'aliquote e i quattro scaglioni coincidono con quelli implementati; la nota ' +
      'all’articolo conferma che l’ultima sostituzione è dell’art. 1 c. 1 lett. a) della ' +
      'l.r. 5/2022, cioè la modifica citata dal registro. La base è dichiarata dal comma ' +
      '1: “il reddito complessivo determinato ai fini dell’imposta sul reddito delle ' +
      'persone fisiche, al netto degli oneri deducibili di cui all’articolo 10” del ' +
      'TUIR — la stessa dell’art. 50 D.Lgs. 446/1997, e nel modello coincide con ' +
      'l’imponibile. SU UN PUNTO LA LEGGE NON DICE LA PAROLA: la tabella è intestata ' +
      '“Scaglioni di reddito”, che nel linguaggio dell’IRPEF significa applicazione per ' +
      'scaglioni successivi, ma l’aggettivo “progressive” sta sulla pagina della Regione, ' +
      'non nell’articolo. La conferma decisiva è numerica: sul caso di RAL 45.000 la ' +
      'lettura per scaglioni dà 611,17 € di addizionale contro i 702,87 € di ' +
      'un’aliquota unica, e il netto del modello coincide al centesimo con quello del ' +
      'calcolatore esterno di metodologia §3.4. Se la lettura fosse quella piatta, il ' +
      'confronto sarebbe fallito di 91,70 €',
  },

  addizionaleComunale: {
    livello: 2,
    statoVerifica: 'atto-letto',
    dove: 'Deliberazioni C.C. Milano n. 36 del 21/10/2013 e n. 46 del 28/09/2020, lette in originale',
    canale: 'comune',
    etichetta: 'Addizionale comunale IRPEF — Milano',
    norma:
      'Art. 1 del D.Lgs. 360/1998: c. 3 per l’aliquota, c. 3-bis per la soglia di esenzione, ' +
      'c. 4 per la base imponibile e la condizione di debenza. Per Milano: Regolamento ' +
      'comunale approvato con Deliberazione C.C. n. 41 del 01/08/2011; aliquota unica 0,80% ' +
      'approvata con Deliberazione C.C. n. 36 del 21/10/2013; soglia di esenzione elevata a ' +
      '23.000 € a decorrere dal 2020 con Deliberazione C.C. n. 46 del 28/09/2020, che ha ' +
      'modificato l’art. 6 c. 2 del Regolamento. Codice ente F205',
    dettaglio:
      'Aliquota unica 0,80% con soglia di esenzione a 23.000 € di imponibile IRPEF. ' +
      'Nessuno dei due valori è di sempre: fino al 2012 Milano applicava aliquote ' +
      'differenziate per scaglioni, e la delibera del 2013 le sostituisce con un valore ' +
      'unico, fissando una soglia più bassa che la delibera del 2020 porta a 23.000. È ' +
      'una soglia, non una franchigia, e lo dicono le delibere stesse: superata, ' +
      '“l’addizionale comunale IRPEF si applica al reddito complessivo … senza soglia ' +
      'di esenzione”, quindi sull’intero imponibile e non sulla sola eccedenza — da qui ' +
      'il salto di circa 184 € descritto in metodologia §4.',
    prassi:
      'Comune di Milano, pagina istituzionale sull’addizionale comunale IRPEF, che riporta ' +
      'aliquota, esenzione, gli estremi della delibera e le modalità di trattenuta in busta ' +
      'paga: acconto del 30% in un massimo di 9 rate da marzo, saldo determinato dal sostituto ' +
      'in sede di conguaglio e trattenuto in un massimo di 11 rate.',
    url: 'https://www.comune.milano.it/servizi/addizionale-comunale-irpef',
    verifica:
      'VERIFICATO sulle due delibere in originale, non più sulla pagina del Comune. La ' +
      'n. 36/2013 fissa “l’aliquota unica dello 0,80%” sostituendo “i cinque valori ' +
      'disposti in ordine crescente della colonna ALIQUOTE %” dell’allegato: prima del ' +
      '2013 l’addizionale comunale di Milano era a scaglioni come quella regionale, e ' +
      'saperlo cambia il modo di leggere il parametro. La n. 46/2020 sostituisce l’art. ' +
      '6 c. 2 del Regolamento con “a decorrere dall’anno 2020, l’addizionale ' +
      'all’imposta sul reddito non è dovuta se il reddito imponibile determinato ai fini ' +
      'dell’imposta sul reddito delle persone fisiche non supera l’importo di € ' +
      '23.000,00”. Il “non supera” è un ≤, ed è l’operatore del motore. Entrambe le ' +
      'delibere chiudono poi la questione della franchigia con parole proprie: “per i ' +
      'redditi superiori a detto valore l’addizionale comunale IRPEF si applica al ' +
      'reddito complessivo … senza soglia di esenzione”. Sciolto anche il dubbio ' +
      'terminologico che restava: l’ESENZIONE si misura sul reddito IMPONIBILE, ' +
      'l’ALIQUOTA si applica al reddito COMPLESSIVO al netto degli oneri deducibili — ' +
      'due grandezze che nel modello coincidono, perché non ci sono oneri deducibili, e ' +
      'che il motore infatti tratta come una sola',
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

  carichiFamiglia: {
    livello: 1,
    statoVerifica: 'atto-letto',
    dove: 'D.P.R. 917/1986 (TUIR), testo vigente 2026 — art. 12',
    canale: 'normattiva',
    etichetta: 'Detrazioni per carichi di famiglia',
    norma: 'Art. 12 TUIR',
    dettaglio:
      'Detrazione per il coniuge non separato, decrescente e con una scaletta di ' +
      'maggiorazioni; per i figli di età pari o superiore a 21 anni e inferiore a 30 (oltre i ' +
      '30 solo con disabilità accertata), perché sotto i 21 opera l’assegno unico e non la ' +
      'detrazione; per ciascun ascendente convivente. Tutte azzerate oltre le rispettive ' +
      'soglie di reddito, tutte condizionate al fatto che il familiare non superi un proprio ' +
      'reddito. A differenza della detrazione da lavoro, queste NON si rapportano al periodo ' +
      'di lavoro ma ai mesi in cui la condizione sussiste: chi lavora mezzo anno ha comunque ' +
      'il coniuge a carico per dodici mesi.',
    url:
      'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917',
    verifica:
      'VERIFICATO sul testo vigente dell’art. 12. Confermate le tre fasce del coniuge alla ' +
      'lett. a), la scaletta di maggiorazioni della lett. b), i figli alla lett. c) con la ' +
      'finestra anagrafica “di età pari o superiore a 21 anni ma inferiore a 30 anni” e ' +
      'l’eccezione per la disabilità, gli ascendenti conviventi alla lett. d), e alla lett. c) ' +
      'l’aumento del riferimento “per ogni figlio successivo al primo”. Il c. 2 fissa il ' +
      'limite di reddito del familiare, elevato per i figli fino a ventiquattro anni. Tre ' +
      'regole del c. 4 sono implementate alla lettera perché cambiano il risultato ai bordi: ' +
      'se il rapporto del coniuge vale uno la detrazione è quella fissa e non la formula, se ' +
      'vale zero non spetta, e per figli e ascendenti non spetta quando il rapporto è “pari a ' +
      'zero, minore di zero o uguale a uno”. Lo stesso comma impone il troncamento alle prime ' +
      'quattro cifre decimali, come l’art. 13 c. 6: il motore riusa la stessa funzione. Il ' +
      'c. 2-bis esclude i familiari residenti all’estero per i contribuenti extra UE/SEE, ' +
      'circostanza fuori perimetro. Il c. 4-bis conferma che anche qui il reddito è assunto ' +
      'al netto dell’abitazione principale',
  },

  oneriDeducibili: {
    livello: 1,
    statoVerifica: 'atto-letto',
    dove: 'Art. 8 del D.Lgs. 252/2005, per il tetto della previdenza complementare',
    canale: 'normattiva',
    lacuna:
      'l’art. 10 rinvia per i massimali ad altre norme (l’art. 8 del D.Lgs. 252/2005 per i ' +
      'fondi pensione), che non sono state lette: il campo del prototipo è generico e non ' +
      'applica alcun tetto',
    etichetta: 'Oneri deducibili dal reddito complessivo',
    norma: 'Art. 10 TUIR',
    dettaglio:
      'Gli oneri deducibili si sottraggono dal reddito complessivo, non dall’imposta: ' +
      'riducono quindi la base su cui si calcolano IRPEF, addizionali e — effetto meno ' +
      'ovvio — anche le soglie di cuneo e detrazioni. La lett. e-bis) riguarda i fondi ' +
      'pensione, la lett. e) i contributi previdenziali obbligatori: per il dipendente questi ' +
      'ultimi non passano di qui, perché l’art. 51 c. 2 lett. a) li tiene fuori dal reddito ' +
      'ancora prima.',
    url:
      'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.del.presidente.della.repubblica:1986-12-22;917',
    verifica:
      'VERIFICATO sul testo vigente dell’art. 10, che apre con “dal reddito complessivo si ' +
      'deducono … i seguenti oneri sostenuti dal contribuente”: è la meccanica implementata, ' +
      'sottrazione dalla base e non dall’imposta. La lett. e-bis) rinvia per condizioni e ' +
      'limiti “all’articolo 8” del D.Lgs. 252/2005, quindi IL TETTO NON STA NEL TUIR e non è ' +
      'stato letto: il campo del prototipo resta generico e senza massimale, ed è dichiarato. ' +
      'La lett. e) conferma per contrasto una scelta del modello: i contributi obbligatori ' +
      'sarebbero deducibili, ma per il dipendente non arrivano mai al reddito complessivo ' +
      'perché l’art. 51 c. 2 lett. a) li esclude prima. Il c. 3-bis, infine, dà la deduzione ' +
      'della rendita dell’abitazione principale, che è la ragione per cui possedere la casa ' +
      'in cui si vive non sposta questo calcolo',
  },

  ragguaglioGiorni: {
    livello: 2,
    statoVerifica: 'atto-letto',
    dove: 'Circolare Ministero delle Finanze n. 326/E del 23/12/1997, per i giorni che danno diritto alla detrazione e per il caso di più rapporti — cercare “retribuzione assoggettata”',
    canale: 'def',
    lacuna:
      'il passaggio letto conferma la convenzione dell’anno di 365 giorni; le altre due ' +
      'regole del dettaglio — quali giorni si contano e come si trattano più rapporti ' +
      'contemporanei — non compaiono in quel passaggio e restano su prassi consolidata',
    etichetta: 'Come si contano i giorni di lavoro nell’anno',
    norma:
      'Circolare Ministero delle Finanze n. 326/E del 23/12/1997, par. 3.3 (periodo di ' +
      'paga) e par. 3.4 (effettuazione della ritenuta)',
    dettaglio:
      'L’anno va sempre assunto di 365 giorni, anche se bisestile. I giorni da considerare sono ' +
      'quelli che hanno dato diritto a retribuzione assoggettata a ritenuta, comprese festività ' +
      'e riposi settimanali; vanno esclusi i giorni non retribuiti. In caso di più rapporti, i ' +
      'periodi contemporanei si contano una volta sola.',
    url: 'https://def.finanze.it/DocTribFrontend/RicercaLibera.jsp',
    verifica:
      'VERIFICATO sul par. 3.3 della circolare, che dispone testualmente: “per ' +
      'l’applicazione della ritenuta, l’anno si deve intendere suddiviso in 12 mesi, 24 ' +
      'quindicine, 52 settimane e 365 giorni (anche negli anni bisestili)”. La ' +
      'convenzione che il motore usa come denominatore di ogni ragguaglio è quella, ' +
      'scritta in prassi e non dedotta. Il par. 3.4 la collega all’uso che ne facciamo: ' +
      'l’imposta va decurtata “delle detrazioni previste negli articoli 12 e 13 dello ' +
      'stesso TUIR, RAPPORTATE AL PERIODO STESSO”, con le aliquote applicate “sulla base ' +
      'delle aliquote progressive per scaglioni di reddito”. La riga era rimasta ' +
      'l’ultima non verificata del registro, ed è stata la più faticosa non perché il ' +
      'testo fosse oscuro ma perché la stringa cercata era sbagliata: “365” in un ' +
      'documento fiscale è rumore, “bisestile” porta al punto in un colpo. Restano fuori ' +
      'dal passaggio letto le altre due regole del dettaglio, dichiarate in lacuna',
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

  /** 3-bis. Detrazioni per carichi di famiglia (art. 12 TUIR). */
  detrazioniFamiliari: {
    fonte: 'carichiFamiglia',
    /** Art. 12 c. 1 lett. a): tre fasce, e la lett. b) le maggiora a scaglioni. */
    coniuge: {
      primaFascia: { fino: 15000, base: 800, sottrai: 110, riferimento: 15000 },
      secondaFascia: { fino: 40000, base: 690 },
      terzaFascia: { fino: 80000, base: 690, riferimento: 80000, ampiezza: 40000 },
      // Art. 12 c. 4: se il rapporto della prima fascia vale uno, l'importo e' fisso.
      importoRapportoUno: 690,
      maggiorazioni: [
        { da: 29000, a: 29200, importo: 10 },
        { da: 29200, a: 34700, importo: 20 },
        { da: 34700, a: 35000, importo: 30 },
        { da: 35000, a: 35100, importo: 20 },
        { da: 35100, a: 35200, importo: 10 },
      ],
    },
    /** Art. 12 c. 1 lett. c): sotto i 21 anni c'e' l'assegno unico, non la detrazione. */
    figli: {
      importo: 950,
      etaMinima: 21,
      etaMassima: 30,
      riferimento: 95000,
      incrementoOltreIlPrimo: 15000,
      quotaPredefinita: 0.5,
    },
    /** Art. 12 c. 1 lett. d). */
    ascendenti: { importo: 750, riferimento: 80000 },
    /** Art. 12 c. 2: il familiare non deve superare un proprio reddito. */
    limiteRedditoFamiliare: 2840.51,
    limiteRedditoFigliFinoA24: 4000,
    etaLimiteRedditoElevato: 24,
    /** Art. 12 c. 4, identico all'art. 13 c. 6. */
    cifreDecimaliRapporto: 4,
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
      norma: 'Art. 2120 c.c.; art. 12 c. 4 lett. a) della L. 153/1969',
      motivo:
        'Accantonato e non erogato: circa il 7,41% della retribuzione utile (1/13,5) ' +
        'al netto del contributo dello 0,50% al Fondo di garanzia. Non transita nella ' +
        'retribuzione corrente, quindi non entra nel netto in busta paga. È fuori anche ' +
        'dalla base contributiva, che lo esclude espressamente: “sono esclusi dalla base ' +
        'imponibile le somme corrisposte a titolo di trattamento di fine rapporto”.',
    },
    {
      voce: 'Assegno unico e universale per i figli',
      norma: 'D.Lgs. 21 dicembre 2021, n. 230',
      motivo:
        'Per i figli sotto i 21 anni la detrazione dell’art. 12 è stata soppressa e sostituita ' +
        'dall’assegno unico, che l’INPS eroga direttamente alla famiglia su domanda e che non ' +
        'transita dalla busta paga. Il prototipo calcola quindi la detrazione solo dai 21 anni ' +
        'in su, ed è il motivo per cui il campo dei figli a carico ha quella soglia: chi ha ' +
        'figli piccoli non vede nulla qui, ma riceve altro altrove. Modellare l’assegno unico ' +
        'richiederebbe ISEE e composizione del nucleo, che una RAL non descrive.',
    },
    {
      voce: 'Familiari a carico diversi da coniuge, figli e ascendenti conviventi',
      norma: 'Art. 12 c. 1 lett. d) e c. 2-bis TUIR',
      motivo:
        'La lett. d) riconosce la detrazione ai soli ascendenti conviventi: gli altri familiari ' +
        'dell’art. 433 c.c. che convivono con il contribuente non danno più diritto a nulla. ' +
        'Il c. 2-bis esclude inoltre i familiari residenti all’estero per i contribuenti che ' +
        'non siano cittadini italiani, UE o SEE. Il prototipo non chiede la cittadinanza e ' +
        'assume che la condizione sia soddisfatta.',
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
      voce: 'Recupero in busta paga di cuneo e trattamento integrativo non spettanti',
      norma: 'L. 207/2024 art. 1 cc. 7 e 8; D.L. 3/2020 art. 1 cc. 3 e 4',
      motivo:
        'Le due norme hanno lo stesso schema: il sostituto riconosce la misura “in via ' +
        'automatica” all’atto dell’erogazione delle retribuzioni e ne “verifica in sede di ' +
        'conguaglio la spettanza”; se non spetta la recupera, e sopra 60 € il recupero è ' +
        'rateizzato. Cambia solo il numero delle rate: DIECI per il cuneo, OTTO per il ' +
        'trattamento integrativo, che è più antico. È di nuovo una regola di cassa infrannuale ' +
        'con esito annuale: chi ha diritto alla misura per l’intero anno non vede alcun ' +
        'recupero, ed è il caso modellato. La compensazione del credito da parte del sostituto ' +
        '(art. 17 D.Lgs. 241/1997) sta interamente dal lato azienda e non tocca la busta paga.',
    },
    {
      voce: 'Tassazione autonoma delle mensilità aggiuntive',
      norma:
        'Art. 23 del D.P.R. 600/1973; circolare Ministero delle Finanze n. 326/E del ' +
        '23/12/1997, par. 3.4',
      motivo:
        'La tredicesima non si somma alla retribuzione del mese in cui è pagata: la circolare ' +
        'prescrive per le mensilità aggiuntive “un trattamento autonomo”, applicando le ' +
        'aliquote “ragguagliando a mese i corrispondenti scaglioni annui di reddito”. Il ' +
        'cedolino di dicembre ha quindi una trattenuta diversa da quella che si otterrebbe ' +
        'dividendo l’imposta annua per il numero di mensilità. È la quarta regola di cassa ' +
        'infrannuale del perimetro — con la mensilizzazione dell’1%, le addizionali e il ' +
        'recupero del cuneo — e come le altre si chiude al conguaglio, perché l’imposta è ' +
        'dovuta per anno solare. Il modello divide il netto annuo per le mensilità per dare una ' +
        'misura leggibile, non per riprodurre il cedolino di dicembre.',
    },
    {
      voce: 'Contributi a carico del lavoratore diversi dall’IVS',
      norma: 'Contrattazione collettiva; art. 51 c. 2 lett. h) TUIR per le trattenute deducibili',
      motivo:
        'Il modello trattiene il solo 9,19% IVS più l’eventuale 1% aggiuntivo, che è quanto ' +
        'grava sul dipendente del settore privato non agricolo per la previdenza obbligatoria. ' +
        'Molti CCNL prevedono però trattenute ulteriori a carico del lavoratore — quote ai ' +
        'fondi sanitari integrativi, ai fondi di solidarietà bilaterali, contributi ' +
        'associativi o sindacali — che riducono il netto e in parte l’imponibile. Dipendono dal ' +
        'contratto applicato, che la RAL non dichiara.',
    },
    {
      voce: 'Un solo rapporto, per l’intero anno, con domicilio fiscale stabile',
      norma: 'Art. 1 c. 4 D.Lgs. 360/1998 (domicilio al 1° gennaio); art. 23 D.P.R. 600/1973',
      motivo:
        'Il modello simula un rapporto unico e continuativo. Con due datori nello stesso anno ' +
        'ciascuno applica detrazioni e scaglioni sul proprio imponibile, e il conto torna solo ' +
        'in dichiarazione o con il conguaglio da parte dell’ultimo sostituto. L’addizionale ' +
        'comunale poi segue il domicilio fiscale al 1° gennaio, non la residenza durante ' +
        'l’anno: chi si trasferisce a Milano a febbraio paga per quell’anno l’addizionale del ' +
        'comune di provenienza.',
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
