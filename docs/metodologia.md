# Metodologia, verifiche e semplificazioni

Documento di accompagnamento al prototipo. Serve a rendere il calcolatore **verificabile**:
un numero preciso senza il metodo che lo produce è solo un numero convincente.

Anno d'imposta di riferimento: **2026**.

**Indice** — [1. Il caso modellato](#1-il-caso-modellato) · [2. La catena di calcolo](#2-la-catena-di-calcolo) · [3. Verifica](#3-verifica) · [4. Effetti soglia](#4-effetti-soglia-la-parte-interessante) · [5. Semplificazioni](#5-semplificazioni-e-cosa-comportano) · [6. Oltre il prototipo](#6-se-dovessi-portarlo-oltre-il-prototipo) · [7. Fonti](#7-fonti) · [8. Bundle](#8-nota-sul-bundle)

---

## 0. Le decisioni, in una tabella

Il dominio è vasto: la parte difficile non è calcolare, è **scegliere cosa modellare e
dichiararlo**. Questa tabella è il riassunto; le sezioni successive spiegano ogni riga.

| # | Decisione | Alternativa scartata | Perché questa | Dove |
|---|---|---|---|---|
| 1 | Motore di calcolo puro, separato dalla UI | Tutto in un file insieme al DOM | I test girano senza browser né dipendenze: se la separazione fosse dichiarata e non reale, non partirebbero | `src/motore.js` |
| 2 | Nessun numero magico nel motore | Costanti sparse nel codice | Cambiare anno d'imposta significa aggiungere un oggetto, non toccare la logica | `src/parametri.js` |
| 3 | Fonti come dati, non come commenti | Elenco di link scritto a mano in pagina | La sezione "Fonti" è generata dai parametri: non può divergere da ciò che il motore usa | registro `FONTI` |
| 4 | Reddito complessivo = imponibile fiscale | Modellare il reddito di riferimento completo | Esatto per chi ha solo reddito da lavoro dipendente, che è il caso standard richiesto | §5.1 |
| 5 | Addizionali per competenza | Per cassa, come in busta paga | Servirebbe l'anno precedente in input; su carriera stabile si equivalgono | §5.2 |
| 6 | Calcolo a saldo d'anno | Simulazione busta per busta | Il brief chiede la proiezione annua; il cedolino mensile è un altro prodotto | §5.2 |
| 7 | TFR escluso dal netto | Scorporarlo dalla RAL | È accantonato, non erogato: non transita nella retribuzione corrente | §5.3 |
| 8 | Riduzioni forfettarie dichiarate ma non applicate | Applicarle per completezza apparente | Incidono sulle detrazioni per oneri dell'art. 15, che il modello non rappresenta | §5.4 |
| 9 | Percentuale del cuneo unica per fascia, su base imponibile | Calcolo per scaglioni, o base lorda | Entrambe le letture errate circolano in guide online; la circolare 4/E dice il contrario | §3.4 |
| 10 | Massimale contributivo attivo di default | Ignorarlo | Un assunto di oggi è iscritto INPS dopo il 1995; resta comunque un interruttore | §2.1 |
| 11 | Effetti soglia mostrati in pagina | Curva liscia, nessun avviso | Sono la parte del sistema che sorprende chi legge la busta paga | §4 |
| 12 | Mensilità che non cambiano il netto annuo | Ricalcolare il netto per mensilità | Le mensilità ripartiscono, non generano reddito. È il primo malinteso da chiarire | §2.8 |

---

## 1. Il caso modellato

| Dimensione | Ipotesi |
|---|---|
| Qualifica | Impiegato, settore privato non agricolo |
| Contratto | Tempo indeterminato, full time, 365 giorni nell'anno |
| Residenza fiscale | Milano (Lombardia) |
| Situazione familiare | Nessun familiare a carico |
| Regimi speciali | Nessuno (no impatriati, no ricercatori, no frontalieri, no premi di risultato) |
| Altri redditi | Nessuno |
| Oneri deducibili / detraibili | Nessuno |

Tutto ciò che sta fuori da questa tabella non è modellato. La sezione 5 elenca cosa questo
comporta e in che direzione sposta il risultato.

---

## 2. La catena di calcolo

### 2.1 Contributi previdenziali a carico del dipendente

```
IVS         = min(RAL, massimale) × 9,19%
aggiuntivo  = max(0, min(RAL, massimale) − 56.224) × 1%
contributi  = IVS + aggiuntivo
```

- **9,19%** è la quota IVS a carico del lavoratore per un impiegato del settore privato non
  agricolo iscritto al FPLD. Dirigenti (che hanno anche il contributo al Fondo di solidarietà),
  apprendisti e alcuni comparti hanno aliquote diverse.
- L'**aliquota aggiuntiva dell'1%** (art. 3-ter D.L. 384/1992) colpisce solo la quota di
  retribuzione **eccedente** la prima fascia di retribuzione pensionabile, fissata per il 2026
  a **56.224 €** (INPS circ. n. 6 del 30/01/2026). Non è progressiva sull'intero: solo
  sull'eccedenza.
- Il **massimale annuo di 122.295 €** si applica solo a chi non ha anzianità contributiva al
  31/12/1995 (art. 2 c. 18 L. 335/1995). Nel prototipo è attivo per default — ipotesi ragionevole
  per un assunto di oggi — ed è disattivabile nei parametri avanzati.

### 2.2 Imponibile fiscale

```
imponibile fiscale = RAL − contributi
```

I contributi previdenziali obbligatori **non concorrono a formare** il reddito di lavoro
dipendente (art. 51 c. 2 lett. a TUIR). Il termine tecnico conta: è non concorrenza, non
deduzione — l'onere deducibile è un'altra cosa (art. 10 c. 1 lett. e TUIR), e confonderle è uno
dei modi più rapidi per perdere credibilità su questo dominio.

**Semplificazione**: nel modello *reddito complessivo = imponibile fiscale*. Le soglie del
taglio del cuneo e delle detrazioni sono lette lì sopra. Nella realtà il reddito complessivo
può includere altri redditi (e, per il cuneo, va assunto al netto della rendita dell'abitazione
principale). Vedi §5.1.

### 2.3 IRPEF lorda

Scala progressiva per scaglioni, art. 11 TUIR come modificato dalla Legge di bilancio 2026
(L. 199/2025), che ha ridotto la seconda aliquota **dal 35% al 33%**:

| Scaglione | Aliquota |
|---|---|
| fino a 28.000 € | 23% |
| da 28.000 a 50.000 € | 33% |
| oltre 50.000 € | 43% |

### 2.4 Detrazione per redditi di lavoro dipendente (art. 13 c. 1 TUIR)

Funzione decrescente del reddito complessivo `R`:

| Fascia | Detrazione teorica |
|---|---|
| R ≤ 15.000 | 1.955 € |
| 15.000 < R ≤ 28.000 | 1.910 + 1.190 × (28.000 − R) / 13.000 |
| 28.000 < R ≤ 50.000 | 1.910 × (50.000 − R) / 22.000 |
| R > 50.000 | 0 |

Due dettagli che i calcolatori semplificati saltano e che qui sono implementati:

- la detrazione è **rapportata ai giorni di lavoro nell'anno** (`× giorni / 365`), con un
  **minimo di 690 €** per i rapporti a tempo indeterminato;
- la **maggiorazione di 65 €** dell'art. 13 c. 1.1 spetta per redditi tra 25.000 e 35.000 e
  **non** è rapportata al periodo di lavoro.

Si noti la discontinuità in salita a 15.000: la detrazione passa da 1.955 a ~3.100 €. Non è un
errore di trascrizione, è la formula.

### 2.5 Taglio del cuneo fiscale (L. 207/2024, strutturale con L. 199/2025)

Dal 2025 il taglio del cuneo non è più un esonero contributivo ma **due misure fiscali
alternative**, selezionate dal reddito complessivo:

**(a) Somma esente** — reddito complessivo ≤ 20.000 €. È una somma **erogata in busta paga che
non concorre a formare reddito**: si somma al netto, non riduce l'imponibile.

La base di calcolo è il **reddito di lavoro dipendente**, cioè l'imponibile fiscale già al netto
dei contributi (artt. 49 e 51 c. 2 lett. a TUIR) — non la RAL. Vedi §3.4 per la verifica.

| Reddito di lavoro dipendente | Percentuale |
|---|---|
| ≤ 8.500 € | 7,1% |
| 8.500 – 15.000 € | 5,3% |
| > 15.000 € | 4,8% |

La percentuale è **unica** e si applica all'intero reddito: non è un calcolo per scaglioni.
Questa è la ragione del salto a 8.500 (§4).

**(b) Ulteriore detrazione d'imposta** — reddito complessivo tra 20.000 e 40.000 €:

```
20.000 < R ≤ 32.000  →  1.000 €
32.000 < R ≤ 40.000  →  1.000 × (40.000 − R) / 8.000
```

Il *décalage* tra 32.000 e 40.000 vale 12,5 punti di aliquota marginale implicita: è il motivo
per cui la marginale effettiva in quella fascia supera il 60% (§4).

### 2.6 Trattamento integrativo (art. 1 D.L. 3/2020 conv. L. 21/2020)

- **R ≤ 15.000**: 1.200 € pieni, ma solo se c'è **capienza**, cioè se
  `IRPEF lorda > detrazione art. 13 − 75 €`.

  La condizione guarda l'imposta **lorda**, non la netta — ed è un dettaglio che cambia il
  risultato. La detrazione piena è 1.955, quindi la soglia è 1.880, cioè un reddito di
  `1.880 / 23% = 8.173,91`. La *no tax area* finisce invece a `1.955 / 23% = 8.500`. Fra i due
  valori si apre una **finestra**: il lavoratore non paga IRPEF né addizionali, **e riceve
  comunque i 1.200 € pieni**. Lo scarto di 75 € nella norma esiste esattamente per creare
  quella finestra: senza, il beneficio si sarebbe fermato al punto di capienza.

  Tradurre la regola in "in no tax area il trattamento integrativo non spetta" è la
  semplificazione sbagliata più comune su questa misura (§3.4).
- **15.000 < R ≤ 28.000**: spetta per la differenza tra le detrazioni spettanti e l'IRPEF lorda,
  nel limite di 1.200 €. Con le sole detrazioni modellate qui (nessun carico di famiglia,
  nessun onere detraibile) questa differenza è sempre negativa: nel prototipo il trattamento
  integrativo in questa fascia risulta quindi **sempre zero**. È una conseguenza dichiarata
  del perimetro, non una dimenticanza.

### 2.7 Addizionali

**Regionale — Lombardia**, per scaglioni sull'imponibile IRPEF:

| Scaglione | Aliquota |
|---|---|
| fino a 15.000 € | 1,23% |
| 15.000 – 28.000 € | 1,58% |
| 28.000 – 50.000 € | 1,72% |
| oltre 50.000 € | 1,73% |

Nota: gli scaglioni regionali sono ancora quelli **ante riforma** (quattro fasce, agganciate
alle soglie 15.000 / 28.000 / 50.000), non allineati ai tre scaglioni IRPEF. È un disallineamento reale della norma, non un errore del modello.

**Nessuna delle due è dovuta se l'IRPEF netta è zero.** L'art. 50 c. 2 del D.Lgs. 446/1997
(regionale) e l'art. 1 c. 4 del D.Lgs. 360/1998 (comunale) subordinano l'addizionale al fatto
che l'IRPEF, al netto delle detrazioni, risulti dovuta. È la *no tax area*: fino a 8.500 € di
reddito la detrazione dell'art. 13 (1.955 €) azzera esattamente l'imposta, perché
8.500 × 23% = 1.955. Chi non paga IRPEF non paga nemmeno le addizionali.

Nel motore questo si traduce in un vincolo di ordine: le addizionali vanno calcolate **dopo**
l'IRPEF netta, e la funzione la riceve come argomento. Senza, calcolerebbe un'imposta su un
contribuente che non deve nulla — ed è esattamente l'errore che il modello conteneva prima del
confronto descritto in §3.4.

**Comunale — Milano**: aliquota unica **0,80%**, con **soglia di esenzione a 23.000 €**.
Attenzione: è una *soglia*, non una *franchigia*. Sotto i 23.000 non si paga nulla; superati i
23.000 si paga lo 0,80% **sull'intero imponibile**, non sulla sola eccedenza. Da qui il salto
di ~184 € descritto in §4.

### 2.8 Netto

```
netto annuo   = RAL − contributi − IRPEF netta − addizionali
                + somma esente + trattamento integrativo
netto mensile = netto annuo / mensilità
```

Le mensilità (12, 13, 14) **non modificano il netto annuo**: cambiano solo la rata. Il calcolo
è a saldo d'anno, non busta per busta.

---

## 3. Verifica

### 3.1 Ricalcolo a mano — RAL 35.000, 13 mensilità

| Passaggio | Calcolo | Importo |
|---|---|---:|
| RAL | | 35.000,00 |
| Contributi INPS | 35.000 × 9,19% (sotto 56.224: niente +1%) | −3.216,50 |
| **Imponibile fiscale** | 35.000 − 3.216,50 | **31.783,50** |
| IRPEF lorda | 28.000 × 23% = 6.440,00 <br> 3.783,50 × 33% = 1.248,56 | −7.688,56 |
| Detrazione art. 13 | 1.910 × (50.000 − 31.783,50) / 22.000 | +1.581,48 |
| Maggiorazione c. 1.1 | reddito in (25.000; 35.000] | +65,00 |
| Ulteriore detrazione cuneo | reddito ≤ 32.000 → importo pieno | +1.000,00 |
| **IRPEF netta** | 7.688,56 − 2.646,48 | **−5.042,08** |
| Add. regionale Lombardia | 15.000 × 1,23% = 184,50 <br> 13.000 × 1,58% = 205,40 <br> 3.783,50 × 1,72% = 65,08 | −454,98 |
| Add. comunale Milano | 31.783,50 × 0,80% (sopra soglia 23.000) | −254,27 |
| **Netto annuo** | 31.783,50 − 5.042,08 − 454,98 − 254,27 | **26.032,21** |
| **Netto mensile** | ÷ 13 | **2.002,48** |

(Il motore restituisce 26.032,18: la differenza di un centesimo è arrotondamento intermedio.)

Questo ricalcolo è codificato riga per riga nel primo test di `test/motore.test.mjs`: se un
passaggio si rompe, il test dice **quale**.

### 3.2 Suite di test

`npm test` esegue 29 test. Diciannove sul motore, in tre famiglie:

1. **Casi di riferimento** (15k / 25k / 35k / 60k): ogni voce intermedia verificata, non solo
   il totale. Un test che controlla solo il netto finale non dice dove si è rotto il calcolo.
2. **Blocchi isolati**: continuità delle formule sui confini di fascia (15.000 / 28.000 /
   50.000), rapporto ai giorni e pavimento di 690 €, *décalage* dell'ulteriore detrazione,
   percentuali della somma esente, massimale e aliquota aggiuntiva INPS.
3. **Invarianti sull'intera curva**, da 1.000 a 200.000 €:
   - coerenza contabile `netto = RAL − trattenute + bonus` per ogni RAL;
   - l'IRPEF netta non è mai negativa;
   - **il netto scende solo attraversando una delle soglie dichiarate** — se comparisse una
     discontinuità non prevista, il test fallisce. È il controllo che rende visibile un errore
     di modellazione che i test sui singoli casi non intercetterebbero;
   - i **salti** alle soglie valgono esattamente quanto l'agevolazione persa (§4).

### 3.3 Confronto con calcolatori pubblici

`node scripts/tabella-riferimento.mjs` stampa in markdown la tabella di 11 RAL con tutte le voci
intermedie, pronta per il confronto riga per riga con un calcolatore esterno.

Quando i numeri divergono, prima di toccare il motore vanno escluse le **divergenze attese**,
tutte riconducibili a scelte di perimetro dichiarate e non a errori:

| Divergenza | Causa |
|---|---|
| Addizionali diverse di qualche decina di euro | Molti calcolatori le trattano **per cassa** (saldo anno precedente + acconto), qui sono per **competenza** sull'anno in corso (§5.2). |
| Netto mensile diverso a parità di netto annuo | Trattamento diverso dei ratei di 13ª/14ª e del conguaglio di fine anno. |
| Netto più basso di ~7% | Il calcolatore sta scorporando il **TFR** dalla RAL o considerando la RAL comprensiva di TFR (§5.3). |
| Netto più alto sotto i 15.000 € | Trattamento integrativo applicato senza verificare la condizione di capienza. |
| Netto diverso oltre i 56.224 € | Aliquota aggiuntiva dell'1% non implementata, o applicata all'intera retribuzione invece che alla sola eccedenza. |
| Addizionale comunale nulla tra 21.000 e 23.000 € | Soglia di esenzione di Milano diversa: va verificata ogni anno sul portale del Federalismo Fiscale del MEF, perché è deliberata dal Comune. |

### 3.4 Esito del confronto con un calcolatore esterno

Confronto eseguito manualmente contro il calcolatore di PMI.it, con gli stessi parametri
(Lombardia, addizionale comunale 0,80%, 13 mensilità, 365 giorni, nessun familiare a carico).

Prima cosa da sapere per leggere i risultati: quel calcolatore **chiama "IRPEF lorda" il totale
delle imposte lorde, addizionali incluse** — non ha una riga separata per le addizionali. È una
differenza di etichetta, non di modello, ma senza accorgersene il confronto sembra fallire.

**RAL 45.000 — coincidenza al centesimo su ogni voce:**

| Voce | Modello | PMI.it |
|---|---:|---:|
| Imposte lorde (IRPEF 10.685,29 + addizionali 938,09) | 11.623,38 | 11.623 |
| Detrazione art. 13 | 793,03 | 793 |
| Taglio del cuneo (reddito oltre 40.000) | 0 | 0 |
| Trattamento integrativo | 0 | 0 |
| Imposte nette | 10.830,35 | 10.830 |
| **Netto annuo** | **30.034,15** | **30.034** |
| Netto mensile | 2.310,32 | 2.310 |

**RAL 35.000 — una sola divergenza, di 65 €:**

| Voce | Modello | PMI.it | Δ |
|---|---:|---:|---:|
| Imposte lorde (IRPEF 7.688,56 + addizionali 709,24) | 8.397,80 | 8.398 | +0,20 |
| Detrazioni art. 13 | 1.646,52 | 1.712 | **+65,52** |
| Taglio del cuneo | 1.000,00 | 1.000 | 0 |
| Imposte nette | 5.751,32 | 5.686 | −65,32 |
| **Netto annuo** | **26.032,18** | **26.097** | **+64,82** |

Le imposte lorde coincidono a venti centesimi: un numero costruito da otto componenti
indipendenti (tre scaglioni IRPEF, quattro scaglioni regionali, l'aliquota comunale) su un
imponibile che dipende a sua volta dall'aliquota contributiva. Questo conferma in blocco tutta
la catena fino alle addizionali.

**Diagnosi della divergenza.** Poiché a 45.000 la detrazione art. 13 coincide esattamente
(793,03 contro 793), la formula del comma 1 è identica nei due modelli. A 35.000 si aggiunge
solo la maggiorazione del comma 1.1: qui il modello applica 65 €, l'altro calcolatore ne
applica circa 130 (1.712 − 1.581,48 = 130,48). L'art. 13 c. 1.1 TUIR, introdotto dalla
L. 234/2021, prevede **65 euro**, non rapportati al periodo di lavoro. La divergenza è quindi
attribuibile all'altro calcolatore.

**RAL 9.000 — il confronto trova un errore nel modello.**

| Voce | Modello (prima) | PMI.it | Modello (dopo la correzione) |
|---|---:|---:|---:|
| IRPEF netta | 0 | 0 (*no tax area*) | 0 |
| Addizionali | **100,53** | **0** | **0** |
| Somma esente (cuneo) | 580,28 | 639,00 | 580,28 |
| Netto annuo | 8.652,65 | 8.812 | 8.753,18 |

Due divergenze, con esito opposto.

*Le addizionali: l'errore era nostro.* Il modello le calcolava anche con IRPEF netta pari a
zero. L'art. 50 c. 2 D.Lgs. 446/1997 e l'art. 1 c. 4 D.Lgs. 360/1998 le subordinano al fatto
che l'IRPEF sia dovuta: nella no tax area non spettano. Corretto (§2.7): `calcolaAddizionali`
riceve ora l'IRPEF netta e restituisce zero se questa è nulla, con un test dedicato. È il
motivo per cui questo confronto valeva la pena farlo: nessun test interno avrebbe potuto
trovare una regola che il modello non conosceva.

*La somma esente: la divergenza è loro.* 639,00 è esattamente 9.000 × 7,1%, cioè la percentuale
applicata alla **RAL**. La base corretta è invece 8.172,90, e la catena normativa è questa:

1. la L. 207/2024 (art. 1 c. 4) dice che la percentuale si applica **al reddito di lavoro
   dipendente** — non alla retribuzione lorda, non alla RAL;
2. *reddito di lavoro dipendente* non è un'espressione generica: è la nozione definita dagli
   artt. 49 e 51 del TUIR;
3. l'art. 51 c. 2 lett. a) esclude espressamente dalla formazione di quel reddito i contributi
   previdenziali e assistenziali obbligatori versati dal lavoratore.

Quindi il reddito di lavoro dipendente **è già** al netto del 9,19%: 8.172,90 × 7,1% = 580,28.
È lo stesso importo che compare al punto 1 della Certificazione Unica, ed è la stessa grandezza
su cui si leggono le soglie della detrazione dell'art. 13 e del trattamento integrativo.

La circolare 4/E del 16 maggio 2025 conferma la logica ("la percentuale va applicata alla sola
quota imponibile del reddito di lavoro dipendente"), ma il passaggio riguarda in via diretta
l'esclusione delle **quote esenti** — regimi impatriati, frontalieri — non i contributi: sui
contributi la risposta viene già dall'art. 51, e non serve la circolare per arrivarci.

Un argomento di coerenza interna rafforza la conclusione, ed è visibile proprio nei numeri di
PMI.it: la *fascia* di percentuale l'hanno determinata correttamente sull'imponibile (7,1%
richiede un reddito non superiore a 8.500, e 9.000 lo supera), ma poi hanno applicato quella
percentuale al lordo. Usare due grandezze diverse per scegliere l'aliquota e per applicarla non
è sostenibile: o entrambe sul lordo — e allora la percentuale sarebbe stata 5,3% — o entrambe
sull'imponibile, che è la lettura corretta.

Su una RAL di 9.000 la differenza vale 58,72 €, e cresce con il reddito fino alla soglia dei
20.000.

> Su questa misura circolano due letture errate diffuse, entrambe presenti in guide online: la
> percentuale applicata **per scaglioni** (7,1% sui primi 8.500, poi 5,3%, poi 4,8%) invece che
> come aliquota unica, e la base presa **al lordo**. La norma dice "la percentuale
> corrispondente", al singolare, applicata al reddito di lavoro dipendente. Il modello
> implementa aliquota unica su base imponibile, ed entrambe le scelte sono coperte da test.

Residuo dopo la correzione: 8.812 − 8.753,18 = 58,82, cioè esattamente la sola divergenza sulla
base della somma esente. Anche in questo caso il confronto si chiude senza voci inspiegate.

**RAL 9.100 — la finestra del trattamento integrativo.**

| Voce | Modello | PMI.it |
|---|---:|---:|
| IRPEF netta | 0 | 0 (*no tax area*) |
| Addizionali | 0 | 0 |
| Trattamento integrativo | **1.200,00** | **0** |
| Somma esente (cuneo) | 586,72 | 646,10 |
| Netto annuo | **10.050,43** | **8.910** |

Differenza 1.140,62, che si scompone senza residui in `1.200,00 − 59,38`: il trattamento
integrativo per intero, meno la solita divergenza sulla base della somma esente.

*Il trattamento integrativo: la divergenza è loro.* Con un imponibile di 8.263,71 l'IRPEF lorda
vale 1.900,65, che supera la soglia di capienza di 1.880: il trattamento integrativo spetta,
per intero, anche se l'imposta netta è zero. È la finestra descritta in §2.6, fra 8.173,91 e
8.500 di reddito. Il loro modello sembra applicare la scorciatoia "no tax area → niente
trattamento integrativo", che è vera per quasi tutta la no tax area ma non per gli ultimi 326 €.

Il confine è sottile in modo istruttivo: a RAL **9.000** l'IRPEF lorda vale 1.879,77 e la soglia
non è superata **per 23 centesimi**, quindi il trattamento integrativo non spetta e i due
modelli concordano; a RAL **9.100** la soglia è superata e si aprono 1.200 €. Il modello ha un
test dedicato che fissa entrambi gli estremi della finestra.

> Nota terminologica emersa proprio da questa verifica: la maggiorazione sta al **comma 1.1**,
> non al comma 1-bis. Il comma 1-bis dell'art. 13 conteneva il credito noto come "bonus Renzi",
> abrogato dal D.L. 3/2020 e sostituito dal trattamento integrativo. Una versione precedente di
> questo documento e del codice citava erroneamente il c. 1-bis.

### 3.5 Audit delle fonti

Le fonti sono state sottoposte a una revisione indipendente, parametro per parametro, con un
metro dichiarato: livello 1 norma primaria, livello 2 prassi e atti locali, livello 3 dottrina
qualificata, livello 4 divulgazione. Per un lavoro serio i livelli 1 e 2 sono obbligatori, il 3
vale come conferma, il 4 non è citabile.

L'audit ha prodotto tre esiti, tutti recepiti.

**Un errore di calcolo.** Il registro presentava il minimo di 690 € della detrazione dell'art. 13
come regola generale. Nel testo quel minimo sta **dentro la lettera a)**, cioè vale solo per
redditi fino a 15.000. Il motore aveva seguito la citazione invece della norma: con RAL 40.000 e
100 giorni di lavoro restituiva 690 € di detrazione invece di 325,29 €, cioè 365 € di imposta in
meno. Il test che avrebbe dovuto presidiare il punto codificava la stessa regola sbagliata,
quindi non lo intercettava. Corretti entrambi.

È il rovescio esatto della tesi del progetto: si diceva che le fonti-come-dati impediscono alla
pagina di divergere dal calcolo, e qui non c'era divergenza — **il motore era allineato a una
fonte scritta male**. La garanzia copriva il collegamento, non il contenuto.

**Citazioni imprecise.** Otto correzioni: la lettera b) e il comma modificante mancanti nella
citazione dell'art. 11; la legge di conversione mancante per il D.L. 384/1992, che è proprio
l'atto da cui l'art. 3-ter trae esistenza; le soglie del trattamento integrativo attribuite alla
L. 207/2024 anziché alla L. 234/2021; l'addizionale regionale descritta come "deliberata" quando
la legge chiede una **legge** regionale; l'abrogazione del c. 1-bis attribuita a una circolare
che non ne parla; e la parola "deducibilità" usata dove la norma dice "non concorrenza".

**Fonti mancanti.** Tre regole erano implementate senza alcuna fonte dichiarata: l'art. 11 c. 3
TUIR (l'imposta netta si determina *fino alla concorrenza* dell'imposta lorda — la norma che
rende l'IRPEF non negativa), l'art. 12 della L. 153/1969 come riscritto dall'art. 6 del
D.Lgs. 314/1997 (perché l'aliquota contributiva si applica al lordo), e la circolare 326/E del
23/12/1997 (l'anno si assume sempre di 365 giorni, anche bisestile).

Un ultimo controllo, fatto sul PDF della circolare con una ricerca testuale, ha aggiunto un
rilievo che l'audit non aveva colto: **la maggiorazione di 65 € del comma 1.1 non compare nella
circolare 4/E/2025**, né come importo né come fascia. Il campo `verifica` di quel blocco
dichiarava una collazione "riga per riga" che copre il comma 1 ma non il comma 1.1. Corretto e
declassato a verifica parziale — con una nota che è proprio il valore su cui il modello diverge
da un calcolatore esterno in §3.4, quindi il più esposto del prototipo.

Non tutti i rilievi sono stati accolti. L'audit segnalava come errata la citazione della
circolare 22/E del 19/11/2024 per la nozione di reddito di riferimento: è invece corretta, e la
prova sta nella 4/E/2025 stessa, che a pagina 6 vi rinvia testualmente. Un audit va verificato
come qualunque altra fonte.

Il registro dichiara ora il **livello** di ogni fonte, e due test lo presidiano: una fonte di
livello 1 non può puntare a una scheda divulgativa invece che a una banca dati normativa, e i
numeri scritti in prosa nelle fonti devono coincidere con i parametri usati dal motore.
`node scripts/verifica-fonti.mjs` stampa il registro come checklist con i link da aprire.

### 3.5.1 Lo stato di verifica, e perché non basta scriverlo in prosa

A verifiche concluse il registro conteneva sei fonti che aprivano con *«VERIFICATO sul testo
normativo»*. Rileggendole, il testo letto era in tutti e sei i casi il **testo unico riordinato**
pubblicato in Gazzetta il 3 luglio 2026, che si applica **dal 2027**. Il testo vigente per l'anno
d'imposta modellato non è mai stato aperto: che i due coincidano è un'inferenza dalla nota di
corrispondenza, ragionevole ma non verificata.

La prosa si era autopromossa. È lo stesso difetto che aveva prodotto l'errore sul minimo di 690 €
(§3.5), in forma più sottile: lì una citazione imprecisa aveva portato a un calcolo sbagliato,
qui una parola generosa dava per chiusa una verifica aperta.

Ogni fonte dichiara ora uno **stato tipizzato**, e la pagina lo mostra come etichetta accanto al
livello:

| Stato | Significato | Quante |
|---|---|:--:|
| `atto-letto` | il testo applicabile è stato letto | **13** su 14 |
| `prassi-letta` | letto dentro una circolare che riporta la norma per esteso | — |
| `fonte-istituzionale` | letto sul sito dell'ente che emana l'atto, non sull'atto | — |
| `non-verificata` | nessuna lettura diretta | 1 |

Le sei fonti che erano `atto-corrispondente` sono state chiuse aprendo il **testo vigente del
D.P.R. 917/1986** (§3.10.1): non ce ne sono più in quello stato. Nessuna delle dieci
`atto-letto` ha lacune residue tranne due, entrambe dichiarate e circoscritte (§3.12), e **non
resta nessuna fonte `prassi-letta` né `fonte-istituzionale`**: ogni parametro del prototipo
poggia ormai su un atto letto, non su una circolare che lo riporta né sulla pagina di un ente
(§3.7.1, §3.10.2, §3.10.3, §3.12). L'unica fonte ancora `non-verificata` è la convenzione sul
conteggio dei giorni, che sul caso modellato vale 365/365.

Ogni fonte che non sia `atto-letto` dichiara inoltre un campo **`lacuna`** che nomina
esattamente ciò che manca — *«l'art. 51 del D.P.R. 917/1986, applicabile al 2026, non è stato
aperto»*, *«le delibere n. 36/2013 e n. 46/2020 non sono state aperte»* — e la pagina lo stampa
sotto la verifica, in rosso.

Tre test lo presidiano. Lo stato dev'essere uno dei cinque previsti; **la parola VERIFICATO può
comparire nella prosa solo se lo stato è `atto-letto`**; e nessuna fonte incompleta può restare
senza lacuna dichiarata. Non è più possibile che il registro si dica verificato senza esserlo:
la suite cade.

### 3.6 Verifica sul testo normativo

Gli artt. 11 e 13 sono stati infine letti sul **testo unico pubblicato in Gazzetta Ufficiale**
(S.O. n. 26/L alla G.U. n. 152 del 3 luglio 2026), che riporta per ogni articolo la nota di
corrispondenza con il D.P.R. 917/1986. Quel testo si applica dal 2027; sulle disposizioni che
qui interessano non diverge da quello vigente nel 2026, e le citazioni del registro restano
ancorate al testo applicabile all'anno d'imposta modellato.

**Tre conferme.** Le aliquote 23% / 33% / 43% con le soglie 28.000 e 50.000. La formula della
capienza, parola per parola: *«fino alla concorrenza del suo ammontare»*. E soprattutto la
**maggiorazione di 65 €** per redditi superiori a 25.000 e non superiori a 35.000, che era il
valore più esposto del prototipo — quello su cui il modello dichiara in errore un calcolatore
esterno in §3.4 — e che fino a quel momento poggiava solo su fonti secondarie.

Il testo conferma anche la lettura che aveva corretto l'errore di calcolo di §3.5: i minimi di
690 e 1.380 € stanno **dentro la lettera a)**, cioè valgono per i soli redditi fino a 15.000.

**Una regola che mancava.** Il comma dedicato dispone che *«se il risultato dei rapporti
indicati ai commi 1, 3 e 5 è maggiore di zero, lo stesso si assume nelle prime quattro cifre
decimali»*. Il rapporto interno alla formula della detrazione va quindi **troncato alla quarta
cifra** prima di moltiplicarlo: il modello non lo faceva.

Sul caso di riferimento (RAL 35.000) il rapporto vale 0,82802272… e diventa 0,8280: la
detrazione passa da 1.581,52 a **1.581,48** e il netto annuo da 26.032,22 a **26.032,18**.
Quattro centesimi. Sono pochi in valore e molti in significato: è la differenza fra il numero
che esce da un cedolino e un numero soltanto verosimile.

Due note sull'implementazione. Il comma limita la regola ai rapporti dell'art. 13, quindi **non**
si applica al décalage dell'ulteriore detrazione, che sta in un altro comma — e un test lo
verifica. E «si assume» lascia un margine: il motore tronca, che è la prassi dei software di
paghe, ma leggerlo come arrotondamento cambierebbe l'esito di pochi centesimi. La scelta è
dichiarata nel registro delle fonti.

**Una terza conferma, la più importante per il confronto esterno.** L'art. 53 del testo
riordinato — nota di corrispondenza all'art. 51 del D.P.R. 917/1986 — dispone al comma 2
lettera a):

> *«Non concorrono a formare il reddito: a) i contributi previdenziali e assistenziali versati
> dal datore di lavoro o dal lavoratore in ottemperanza a disposizioni di legge»*

Chiude la catena di §3.4. La somma esente del cuneo si applica al *reddito di lavoro
dipendente*; quel reddito è definito dall'art. 49 e **determinato** dall'art. 51, che esclude i
contributi obbligatori. Quindi la base è l'imponibile, non la RAL — e non è più un ragionamento
sistematico, è il testo. Il testo conferma anche il termine esatto: *non concorrenza*, non
*deduzione*.

Lo stesso articolo ha permesso di dichiarare meglio il perimetro escluso: fringe benefit (soglia
di 258,23 € elevata a 1.000 €, o 2.000 € con figli, per il triennio 2025-2027), buoni pasto,
indennità di trasferta e auto in uso promiscuo hanno ora norma e importi accanto. La soglia dei
fringe benefit, per inciso, è un altro effetto soglia della stessa famiglia di quello
dell'addizionale comunale: superata, concorre l'intero valore e non l'eccedenza.

### 3.7 Addizionale comunale di Milano

Il parametro che il registro dichiarava come il più debole del modello è stato chiuso sulla
**pagina istituzionale del Comune di Milano**, che riporta:

- aliquota **unica dello 0,80%**, approvata con **Deliberazione del Consiglio Comunale n. 36 del
  21 ottobre 2013**;
- **esenzione per i redditi imponibili fino a 23.000 € inclusi**;
- codice ente **F205**.

E soprattutto una frase che vale più dei numeri:

> *«L'esenzione non equivale a franchigia e dunque non si applica nei casi in cui il reddito
> complessivo sia superiore a € 23.000,00.»*

È esattamente la modellazione implementata: superata la soglia, l'addizionale si paga
sull'intero imponibile e non sulla sola eccedenza. Il salto di 183,96 € descritto in §4 non è
un artefatto del modello — è come il Comune stesso descrive la propria regola.

La stessa pagina ha permesso di rendere concreta la semplificazione di §5.2: l'acconto è del 30%
e viene trattenuto dal sostituto d'imposta in un massimo di 9 rate da marzo, il saldo è
determinato in sede di conguaglio e trattenuto in un massimo di 11 rate dal mese successivo, e
in caso di cessazione del rapporto in corso d'anno la trattenuta avviene in unica soluzione.

L'elenco dei riferimenti normativi del Comune ha poi chiuso anche il punto rimasto aperto: la
soglia di 23.000 € è fissata dalla **Deliberazione C.C. n. 46 del 28 settembre 2020**, che la
eleva *«a decorrere dall'anno 2020»* modificando l'art. 6 c. 2 del Regolamento comunale
(approvato a sua volta con Deliberazione C.C. n. 41 del 1° agosto 2011).

Questo cambia la natura del rischio. Entrambi gli atti — il n. 36/2013 per l'aliquota e il
n. 46/2020 per la soglia — sono tuttora citati dal Comune fra i riferimenti vigenti: i due
valori non dipendono da una delibera annuale, sono stabili dal 2020 e dal 2013. Il parametro
resta il più esposto del modello perché **può** cambiare con una delibera comunale, ma non è più
un valore raccolto da fonti discordanti.

#### 3.7.1 Le due delibere, lette in originale

Le delibere sono state poi aperte davvero — la n. 36/2013 è una scansione, quindi è stata letta
pagina per pagina come immagine — e hanno dato tre cose che la pagina del Comune non dava.

**L'aliquota unica ha una storia.** Il dispositivo del 2013 non fissa un valore in astratto: dice
di *«sostituire i cinque valori disposti in ordine crescente della colonna ALIQUOTE % con
l'aliquota unica pari allo 0,80%»*. Fino al 2012 l'addizionale comunale di Milano era **a
scaglioni**, come la regionale lombarda lo è ancora. Lo 0,8% piatto è una scelta del 2013, non
una caratteristica del tributo: il modello ha una regola per la Lombardia e un'altra per Milano
perché i due enti hanno deciso diversamente, non perché comunale e regionale funzionino in modo
diverso.

**La soglia era 21.000.** La n. 36/2013 la fissa *«per i redditi annui imponibili non superiori a
€ 21.000,00»*; la n. 46/2020 la estende *«dagli attuali € 21.000,00 … alla nuova soglia di €
23.000,00»*, sostituendo l'art. 6 c. 2 del Regolamento con: *«A decorrere dall'anno 2020,
l'addizionale all'imposta sul reddito non è dovuta se il reddito imponibile determinato ai fini
dell'imposta sul reddito delle persone fisiche non supera l'importo di € 23.000,00»*. Quel **«non
supera»** è un `<=`, ed è l'operatore che il motore usa.

**La franchigia è esclusa dalle delibere stesse.** Prima la conoscevamo dalla FAQ del Comune;
entrambe le delibere la scrivono nel corpo del provvedimento:

> *«Per i redditi superiori a detto valore l'addizionale comunale IRPEF si applica al reddito
> complessivo, ai sensi dell'art. 1 del D.Lgs. n. 360/1998, senza soglia di esenzione.»*

E infine sciolgono la nota terminologica rimasta aperta, che non era un'oscillazione della fonte
ma una distinzione vera: l'**esenzione** si misura sul reddito **imponibile**, l'**aliquota** si
applica al reddito **complessivo al netto degli oneri deducibili**. Sono due grandezze diverse
che nel modello coincidono, perché non ci sono oneri deducibili — e il motore infatti le tratta
come una sola. Su un contribuente con oneri deducibili non coinciderebbero, ed è la
semplificazione di §5.1 vista dal lato dell'addizionale.

### 3.8 La regola della no tax area sulle addizionali

Il testo vigente dell'art. 1 c. 4 del D.Lgs. 360/1998 chiude la regola che il modello
implementava senza riscontro:

> *«L'addizionale è determinata applicando al reddito complessivo determinato ai fini
> dell'imposta sul reddito delle persone fisiche, al netto degli oneri deducibili riconosciuti ai
> fini di tale imposta, l'aliquota stabilita ai sensi dei commi 2 e 3 **ed è dovuta se per lo
> stesso anno risulta dovuta l'imposta sul reddito delle persone fisiche, al netto delle
> detrazioni per essa riconosciute e del credito di cui all'articolo 165** del testo unico.»*

Lo stesso comma risolve anche l'oscillazione terminologica notata in §3.7: la base non è
genericamente il "reddito imponibile", è il **reddito complessivo al netto degli oneri
deducibili** — che nel caso modellato coincide con l'imponibile fiscale.

Restano confermate dal medesimo articolo tre cose già scritte altrove nel progetto: il tetto di
legge dello **0,8%** al comma 3, che è esattamente l'aliquota di Milano; la **soglia di
esenzione** come facoltà regolamentare al comma 3-bis; e al comma 5 il meccanismo per cassa —
acconto in massimo 9 rate da marzo, saldo in massimo 11 rate dal conguaglio, unica soluzione se
il rapporto cessa — che è quindi norma e non prassi.

**Una precisazione, e una correzione della correzione.** L'efficacia della delibera comunale
decorre dalla pubblicazione sul sito informatico del MEF (c. 3), e ai fini dell'acconto aliquota
e soglia si assumono nella misura dell'anno precedente *«salvo che la pubblicazione della
delibera sia effettuata entro il 31 dicembre precedente l'anno di riferimento»* (c. 4).

Su questo punto ho sbagliato due volte, in direzioni opposte, e vale la pena lasciarlo scritto.
Prima avevo attribuito al **D.Lgs. 23/2011, art. 14 c. 8** una regola di pubblicazione **entro il
20 dicembre**: data inventata. Correggendo, ho scritto che quel decreto *non contiene affatto*
la regola — e anche questo era falso. Il comma esiste, e dice:

> *«A decorrere dall'anno 2011, le delibere di variazione dell'addizionale comunale all'imposta
> sul reddito delle persone fisiche hanno effetto dal 1° gennaio dell'anno di pubblicazione sul
> sito informatico di cui all'articolo 1, comma 3, del citato decreto legislativo n. 360 del
> 1998, a condizione che detta pubblicazione avvenga entro il 31 dicembre dell'anno a cui la
> delibera afferisce.»*

Il termine è **31 dicembre**, non 20. A far riaprire il decreto è stata la delibera stessa: il
punto 3) della n. 46/2020 dispone di pubblicare *«con le modalità e i termini di cui all'art. 14,
comma 8, del D.Lgs. n. 23/2011 e all'art. 15-bis del D.L. n. 34/2019»*. La fonte secondaria ha
rimandato alla primaria, e la primaria ha smentito entrambe le mie versioni.

La lezione operativa è che una correzione non è automaticamente vera perché corregge un errore:
anche la seconda affermazione andava verificata sul testo, e non lo era. Le due regole comunque
convivono — il D.Lgs. 360/1998 disciplina l'efficacia e l'acconto, il D.Lgs. 23/2011 la
decorrenza dal 1° gennaio dell'anno di pubblicazione — e nessuna delle due tocca il calcolo di
un anno in cui i valori non cambiano.

**La gemella regionale.** L'art. 50 c. 2 del D.Lgs. 446/1997 dice la stessa cosa con le stesse
parole:

> *«L'addizionale regionale è dovuta se per lo stesso anno l'imposta sul reddito delle persone
> fisiche, al netto delle detrazioni per essa riconosciute e dei crediti di cui agli articoli 14
> e 15 del citato testo unico, risulta dovuta.»*

Il diverso numero di articolo — 14 e 15 qui, 165 nel decreto sulla comunale — riflette solo la
rinumerazione del TUIR del 2004. Il modello tratta le due addizionali allo stesso modo perché le
norme sono formulate allo stesso modo, non per analogia. **Era l'ultima regola del motore senza
riscontro diretto: ora non ce ne sono più.**

**Una differenza fra le due che il modello non conosceva.** L'art. 50 c. 4 dispone che per i
redditi di lavoro dipendente l'addizionale **regionale** sia determinata dal sostituto d'imposta
*«all'atto di effettuazione delle operazioni di conguaglio»* e trattenuta in un massimo di
undici rate: **non ha acconto**. La comunale invece sì, un acconto del 30% in un massimo di nove
rate da marzo, più il saldo. Due addizionali sullo stesso cedolino, due meccanismi di cassa
diversi — un dettaglio che rende la semplificazione di §5.2 più precisa e che si vede solo
leggendo i due decreti di fila.

### 3.9 Addizionale regionale della Lombardia

Chiusa sulla pagina istituzionale di Regione Lombardia, che ha confermato le quattro aliquote e
i quattro scaglioni implementati, e ha aggiunto tre cose che il modello dava per assunte.

**Le aliquote sono progressive.** La Regione usa esattamente questa parola: *«le aliquote
progressive stabilite dall'art. 72 della l.r. 10 del 2003»*, applicate *«sui medesimi scaglioni
previsti per l'IRPEF»*. Il motore le applica per scaglioni successivi, non in misura unica
sull'intero reddito — era una scelta di modellazione non ancora verificata, e ora lo è. Non è
scontata: l'addizionale comunale di Milano funziona nel modo opposto, aliquota unica sull'intero
imponibile.

**La base è la stessa dell'addizionale comunale**: reddito complessivo determinato ai fini
IRPEF, al netto degli oneri deducibili. Le due addizionali condividono la base e divergono solo
nella struttura delle aliquote.

**La norma esatta**: art. 72 della l.r. 14 luglio 2003, n. 10, come da ultimo modificato
dall'art. 1 c. 1 lett. a) della l.r. 31 marzo 2022, n. 5, che *«ha adeguato gli scaglioni di
reddito a quanto stabilito dal comma 2 dell'art. 1 della legge 30 dicembre 2021, n. 234»*, a
partire dall'anno 2022. Da qui il disallineamento documentato: gli scaglioni regionali sono
fermi alla struttura IRPEF del 2022, quattro fasce, mentre l'IRPEF statale è passata a tre.
Il registro citava genericamente "aliquote deliberate dalla Regione": era doppiamente impreciso,
perché servono una legge regionale e non una delibera, e perché quella legge è del 2022 e non
di ogni anno.

Fra gli allegati la pagina riporta la convenzione con l'Agenzia delle Entrate per il triennio
**2026-2028**, che conferma l'attualità della pagina. Il testo della legge regionale non è stato
letto in originale: è la cautela che resta.

### 3.10 Contributi: due valori confermati e una regola che il modello non applica

La circolare INPS n. 6 del 30 gennaio 2026 conferma al centesimo i due valori annuali:
**prima fascia di retribuzione pensionabile 56.224,00 €** e **massimale annuo 122.295,00 €**
(122.295,40 prima dell'arrotondamento). Conferma anche due scelte del motore: che l'aliquota
aggiuntiva è dovuta perché il regime di iscrizione prevede un'aliquota a carico del lavoratore
inferiore al 10%, e che *«il massimale opera anche ai fini dell'aliquota aggiuntiva dell'1%»* —
cioè che l'eccedenza sulla prima fascia va misurata sulla base già limitata al massimale, che è
esattamente ciò che il codice fa.

**E contiene una regola di cassa che vale la pena spiegare.** La circolare prescrive il criterio
della **mensilizzazione**: durante l'anno l'1% si versa sulla quota che eccede **4.685,00 €
mensili**, non a fine anno sulla quota che eccede 56.224,00 € annui.

A prima vista sembrava un errore del modello, che lavora a saldo d'anno. Con la tredicesima la
differenza è vistosa: il doppio pagamento di dicembre supera da solo il tetto mensile anche
quando il totale annuo sta sotto la prima fascia, e su una RAL di 56.000 € il criterio mensile
produce circa 39 € dove il modello calcola zero.

La circolare INPS n. 156 del 30 dicembre 2025 sul conguaglio di fine anno chiude la questione:

> *«Ai fini del versamento del contributo in trattazione, deve essere osservato il metodo della
> mensilizzazione del limite della retribuzione; **tale criterio può rendere necessario procedere
> a operazioni di conguaglio, a credito o a debito del lavoratore**, degli importi dovuti a tale
> titolo.»*

E, per il caso di più rapporti nell'anno, precisa che *«le retribuzioni percepite in costanza di
ciascun rapporto **si cumulano ai fini del superamento della prima fascia di retribuzione
pensionabile**»* — cioè del limite **annuo**.

La mensilizzazione è dunque un criterio di **versamento**, non di determinazione. Il tetto che
conta è annuo, e il conguaglio di dicembre restituisce al lavoratore quanto trattenuto in
eccesso durante l'anno o gli addebita quanto manca. **L'esito definitivo è l'1% sulla quota
annua eccedente la prima fascia: esattamente ciò che il modello calcola.**

È lo stesso schema delle addizionali di §5.2 — flusso mensile, competenza annuale — e la
conclusione è la stessa: il modello salta i movimenti intermedi e arriva al conguagliato. Fuori
perimetro è la simulazione del flusso mese per mese, non il risultato.

Vale la pena registrare come si è arrivati qui, perché è il metodo e non il numero. La circolare
n. 6 rimandava alla mensilizzazione con una nota, la nota rimandava alla circolare n. 7 del 2010,
e la conferma sta in un terzo documento, quello sul conguaglio. Implementare il criterio mensile
leggendo solo la prima delle tre avrebbe reso il modello **sbagliato**, cambiando anche il caso
di riferimento verificato a mano. Tre documenti per non scrivere una riga di codice è un
risultato, non uno spreco.

### 3.10.1 Il testo vigente del TUIR conferma tutte le inferenze

Le sei fonti che poggiavano sul testo unico riordinato sono state chiuse sul **D.P.R. 917/1986
nella versione applicabile al 2026**. Ogni deduzione tratta dalla nota di corrispondenza si è
rivelata esatta, il che è tranquillizzante ma andava dimostrato e non supposto.

| Cosa era dedotto | Cosa dice il testo vigente |
|---|---|
| aliquote 23 / **33** / 43 | art. 11 c. 1: la lett. b) riporta il 33% fra doppie parentesi, segno della modifica recente |
| capienza al **comma 3** | art. 11 c. 3: *«fino alla concorrenza del suo ammontare»* — il numero del comma è quello citato |
| minimi 690 e 1.380 **dentro la lett. a)** | art. 13 c. 1 lett. a): i due minimi stanno nella lettera, dopo l'importo di 1.955 |
| i 65 € al **comma 1.1** | art. 13 c. 1.1: *«è aumentata di un importo pari a 65 euro, se il reddito complessivo è superiore a 25.000 euro ma non a 35.000 euro»* |
| il c. 1-bis era il bonus Renzi, abrogato | art. 13 c. 1-bis: *«COMMA ABROGATO DAL D.L. 5 FEBBRAIO 2020, N. 3»* |
| quattro cifre decimali al **comma 6** | art. 13 c. 6, con una differenza: il testo vigente rinvia ai *«commi 1, 3, 4 e 5»*, il riordino ai commi 1, 3 e 5, perché nel frattempo un comma è stato soppresso |
| non concorrenza dei contributi | art. 51 c. 2 lett. a), parola per parola |

Restavano due lacune minori — l'**art. 8**, che definisce il reddito complessivo, e l'**art.
49**, che definisce il reddito di lavoro dipendente. Sono state chiuse anch'esse sul testo
vigente. Nessuna delle due incide su un valore calcolato, ma entrambe reggono un'affermazione
del modello, e valeva la pena leggerle proprio perché sono definizioni:

- **art. 49 c. 1**: sono redditi di lavoro dipendente *«quelli che derivano da rapporti aventi
  per oggetto la prestazione di lavoro, con qualsiasi qualifica, alle dipendenze e sotto la
  direzione di altri»*. È la categoria in cui ricade il caso simulato, e quella su cui si
  commisura la somma esente del cuneo: insieme all'art. 51 c. 2 lett. a) chiude la catena di
  §3.4 — la percentuale si applica all'imponibile, non alla RAL.
- **art. 8 c. 1**: *«il reddito complessivo si determina sommando i redditi di ogni categoria
  che concorrono a formarlo e sottraendo le perdite derivanti dall'esercizio di arti e
  professioni»*. È una definizione **per somma di categorie**: non contiene di per sé le
  estensioni del reddito di riferimento — cedolare secca, forfetario, mance — che stanno nelle
  norme di settore e nell'art. 1 c. 9 della L. 207/2024. La lettura conferma che i due concetti
  vanno tenuti distinti, come il registro già faceva, e non trattati come sinonimi.

#### Un difetto trovato mentre si chiudevano queste fonti

Aggiornando le note di verifica delle sei fonti, la prosa nuova era stata inserita in cima al
blocco senza togliere quella vecchia in fondo. In un object literal JavaScript **vince
l'ultima**: le sei fonti continuavano a mostrare il testo superato, e nessun test se ne
accorgeva perché l'oggetto caricato era perfettamente valido. Il difetto è visibile soltanto nel
sorgente, quindi ora c'è un test che legge `src/parametri.js` come testo e cade se una fonte
dichiara due volte la stessa chiave.

È un difetto piccolo con una morale grande: un aggiornamento può fallire in silenzio anche
quando il codice gira. Il registro delle fonti serve a impedire che il modello menta; questo
test serve a impedire che menta il registro.

### 3.10.2 I commi del cuneo, letti in originale

Il cuneo fiscale era l'unica misura grossa che il modello conoscesse **solo attraverso una
circolare**: i commi 4-9 dell'art. 1 della L. 207/2024 erano stati letti nelle note della 4/E,
che li riporta per esteso, non sulla legge. È una fonte di secondo grado, e per il pezzo che
sposta più euro del prototipo era la lacuna più imbarazzante del registro. Ora sono stati letti
in originale, insieme al comma della L. 199/2025 che porta la seconda aliquota al 33%.

**Il comma sulle aliquote** è una novella secca: *«le parole: "35 per cento" sono sostituite
dalle seguenti: "33 per cento"»*, sull'art. 11 c. 1 lett. b). Non tocca le soglie né le altre due
aliquote. Un limite va dichiarato: **il comma non porta con sé una decorrenza**, quindi
l'applicazione al 2026 discende dall'entrata in vigore della legge di bilancio, non da una parola
del comma. È scritto così nel registro.

**I commi del cuneo** hanno confermato ogni confine implementato, e la verifica interessante è
proprio sui confini, perché la norma distingue *«non superiore a X»* da *«superiore a X»* — la
differenza fra un `<=` e un `<`, che su un estremo esatto vale l'intera misura:

| Testo della norma | Confine | Nel motore |
|---|---|---|
| c. 4, *«reddito complessivo non superiore a 20.000 euro»* | somma esente a 20.000 esatti | `RC > limite → 0` |
| c. 6, *«reddito complessivo superiore a 20.000 euro»* | detrazione **solo oltre** | `R > da` |
| c. 4 lett. a-c | ≤ 8.500 → 7,1%; > 8.500 e ≤ 15.000 → 5,3%; > 15.000 → 4,8% | `fasce.find(f => teorico <= f.fino)` |
| c. 6 lett. a, *«superiore a 20.000 euro ma non a 32.000 euro»* | 1.000 € pieni a 32.000 esatti | `R <= pienoFino` |
| c. 6 lett. b, *«prodotto tra 1.000 euro e … il rapporto tra 40.000 euro, diminuito del reddito complessivo, e 8.000 euro»* | décalage lineare | denominatore ricavato dai due estremi, non scritto a mano |

Le due misure **si danno il cambio esattamente a 20.000**, senza sovrapporsi — il contribuente
prenderebbe due volte — né lasciare vuoti — non prenderebbe nulla. Un test ripercorre ogni
estremo, centesimo per centesimo.

La lettura in originale ha aggiunto due cose che la circolare non dava:

- **l'esclusione dei pensionati.** Entrambe le misure spettano ai titolari di reddito di lavoro
  dipendente dell'art. 49 *«con esclusione di quelli indicati alla lettera a) del comma 2»*, cioè
  le pensioni. Il caso modellato vi rientra, ma è un confine del perimetro che prima non era
  scritto — e si aggancia all'art. 49 letto poco prima.
- **la portata esatta dell'annualizzazione.** Il c. 5 rapporta il reddito all'intero anno *«ai
  soli fini dell'individuazione della percentuale applicabile»*. Quel *«ai soli fini»* è la
  ragione per cui il motore annualizza per scegliere la fascia e poi applica la percentuale al
  reddito effettivo: prima era una lettura della circolare, ora è la lettera della norma.

Il c. 7 ha invece prodotto una nuova voce fuori perimetro: il sostituto riconosce la misura *«in
via automatica»* e ne verifica la spettanza al conguaglio, recuperando in **dieci rate** quanto
non spettante sopra i 60 €. È il terzo caso della stessa famiglia — mensilizzazione dell'1%,
addizionali per cassa, e ora questo: regole di flusso infrannuale con esito annuale identico a
quello che il modello calcola.

### 3.10.3 Il trattamento integrativo, e due dettagli che solo l'originale dà

Era l'ultima fonte `prassi-letta`. L'art. 1 del D.L. 3/2020 è stato letto sul testo consolidato,
e ha confermato la condizione di spettanza già implementata, aggiungendo due precisazioni che la
circolare non rendeva così nitide.

**Il rinvio è al solo comma 1.** La condizione della prima fascia guarda *«la detrazione
spettante ai sensi dell'articolo 13, comma 1»* — quindi **senza** la maggiorazione di 65 € del
c. 1.1. È la ragione per cui `calcolaDetrazioneLavoro` restituisce `base`, `maggiorazione` e
`totale` separati invece di un numero solo, e per cui il motore passa al trattamento integrativo
la `base`. Le due grandezze si sovrappongono fra 25.000 e 28.000 di reddito, dove la
maggiorazione esiste e la seconda fascia del trattamento è ancora aperta. In questo perimetro la
scelta è **inerte** — lì il trattamento vale zero con entrambe — e vale la pena dirlo invece di
spacciarla per una verifica che sposta un numero: diventerebbe viva appena il modello
rappresentasse degli oneri detraibili.

**Anche i 75 € sono rapportati al periodo di lavoro.** Nel testo consolidato lo scarto compare
fra doppie parentesi — la convenzione con cui Normattiva segnala una modifica, qui quella operata
dalla L. 207/2024 — e le parole sono *«diminuita dell'importo di 75 euro rapportato al periodo di
lavoro nell'anno»*. Il ragguaglio cade sullo **scarto**, non solo sull'importo dei 1.200 €, ed è
così che il motore lo applica. Il c. 2 conferma poi che l'intero trattamento *«è rapportato al
periodo di lavoro»*.

Da qui discende la soglia di 8.173,91 già documentata: con la detrazione piena di 1.955 €, la
condizione *«imposta lorda superiore»* a 1.955 − 75 = 1.880 si avvera quando 23% × reddito supera
1.880. Il test non mette 8.173,91 in una costante: la ricalcola dai parametri, così se cambia la
detrazione o lo scarto cambia anche la soglia.

**La seconda fascia vale zero, e non per caso.** Fra 15.000 e 28.000 il trattamento spetta per la
differenza fra una somma di detrazioni e l'imposta lorda. Leggendo l'elenco in originale si vede
che è quasi tutto **oneri detraibili per spese sostenute fino al 31/12/2021** — mutui, spese
sanitarie, ristrutturazioni — che il modello non rappresenta. Resta la sola detrazione dell'art.
13 c. 1, che l'imposta lorda supera sempre, e con margini larghi: a 20.000 di reddito la
detrazione è 2.642 contro 4.600 di imposta. La seconda fascia è quindi zero **per costruzione**,
non per un accidente numerico, ed è un limite dichiarato del perimetro. Il test lo scrive così:
scorre la fascia di cento in cento e verifica la *ragione* — che la detrazione stia sotto
l'imposta lorda — non solo il risultato.

Un margine interpretativo resta, ed è dichiarato: nella seconda fascia la norma pone un tetto di
*«1.200 euro»* e il c. 2 rapporta il trattamento al periodo di lavoro, senza dire se il tetto vada
ragguagliato prima o dopo la differenza. Il motore lo ragguaglia; su un anno intero le due
letture coincidono, e in questo perimetro la questione è teorica perché il risultato è comunque
zero.

Infine il c. 3 ha completato la voce fuori perimetro aperta con il cuneo: stesso schema —
riconoscimento automatico, verifica al conguaglio, recupero rateizzato sopra i 60 € — ma **otto**
rate invece di dieci. Le due misure sono figlie di stagioni diverse e il legislatore non ha
uniformato il numero: è il genere di dettaglio che un prototipo può ignorare e un software di
paghe no.

### 3.12 Gli ultimi tre: contributi, Lombardia, giorni

Le tre fonti rimaste erano le uniche non fiscali. Due si sono chiuse, la terza si è chiusa **in
negativo** — cioè togliendo una citazione invece di confermarla.

#### La base contributiva, e perché il 9,19% si applica al lordo

L'art. 12 della L. 153/1969, nel testo che l'art. 6 del D.Lgs. 314/1997 ha sostituito per
intero, è costruito per rinvio: il c. 1 prende la nozione fiscale di reddito di lavoro
dipendente, il c. 2 rinvia all'articolo sulla determinazione, e il c. 3 introduce l'unica
differenza che conta:

> *«Le somme e i valori di cui al comma 1 dell'articolo 48 … si intendono al lordo di qualsiasi
> contributo e trattenuta.»*

È la norma cercata, ed è esplicita al punto da non lasciare margine. Le due basi — fiscale e
previdenziale — partono dalla stessa definizione e divergono **solo** per quel comma: l'art. 51
c. 2 lett. a) TUIR toglie i contributi dall'imponibile fiscale, l'art. 12 c. 3 impedisce di
toglierli da quello previdenziale.

Due cose in più, arrivate senza cercarle. Il c. 4 lett. a) esclude dalla base contributiva *«le
somme corrisposte a titolo di trattamento di fine rapporto»*, e il c. 5 dichiara l'elenco
**tassativo**: il TFR è quindi fuori da entrambe le basi, il che rafforza la voce fuori perimetro
che lo riguarda. E l'articolo rinvia agli **artt. 46 e 48** del TUIR, cioè alla numerazione
anteriore al riordino del 2004: sono gli attuali artt. 49 e 51, esattamente i due letti sul testo
vigente per la parte fiscale. Il cerchio si chiude su sé stesso.

#### La Lombardia, e la parola che la legge non dice

L'art. 72 della l.r. 10/2003 conferma le quattro aliquote, i quattro scaglioni, la base
(*«il reddito complessivo … al netto degli oneri deducibili di cui all'articolo 10»* del TUIR) e
la nota d'aggiornamento che attribuisce l'ultima sostituzione alla l.r. 5/2022 — cioè la modifica
che il registro citava.

Su un punto però **la legge non dice la parola**. La tabella è intestata *«Scaglioni di
reddito»*, che nel linguaggio dell'IRPEF significa applicazione per scaglioni successivi, ma
l'aggettivo *«progressive»* sta sulla pagina della Regione, non nell'articolo. Invece di
dichiararlo verificato sulla base di un'inferenza terminologica, la conferma è stata cercata dove
era già disponibile: **nei numeri**.

| Lettura | Addizionale regionale su imponibile 40.864,50 |
|---|---:|
| per scaglioni (implementata) | **611,17 €** |
| aliquota unica 1,72% | 702,87 € |

Sul caso di RAL 45.000 il netto del modello coincide **al centesimo** con quello del calcolatore
esterno di §3.4. Con la lettura piatta il confronto sarebbe fallito di 91,70 €. La progressività
non è quindi un'assunzione: è ciò che rende vero un riscontro esterno già eseguito.

#### Il 9,19%, e un limite che resta

La circolare INPS n. 40 del 22/02/2011 è il documento che *spiega* il numero, dove le circolari
annuali lo danno per scontato. La tabella del settore privato non agricolo riporta «Totale
33,00% — a carico del lavoratore 9,19%», e il testo dice perché quel valore non si muove:

> *«Risulta esaurito l'adeguamento dell'aliquota contributiva a carico del lavoratore in quanto —
> per effetto dell'incremento di 0,50 punti percentuali operato, da ultimo, alla data del
> 1.1.2002 — la stessa aliquota ha già raggiunto la misura piena (8,89% + 0,30 = totale 9,19%).»*

La progressione annuale di 0,20 punti prevista dall'art. 3 c. 23 della L. 335/1995 riguardava il
**datore di lavoro**; la quota del dipendente è ferma dal 2002. Questo spiega anche perché
cercarne la «legge istitutiva» era un vicolo cieco: è un'aliquota di computo del Fondo,
risultato di una stratificazione, non di una norma unica.

**Il limite va detto**: è un documento del 2011. Prova che l'aliquota era assestata allora, non
che sia identica oggi. La lacuna resta quindi aperta, ma è di un tipo diverso da prima — non più
«nessuna fonte», ma «nessuna conferma sull'anno in corso».

#### I giorni: una citazione ritirata, e rimessa

Questa riga è l'unica ancora `non-verificata`, e merita il racconto per intero perché è finita
due volte nel posto sbagliato.

Il registro indica la circolare del Ministero delle Finanze n. 326/E del 23/12/1997 per la
convenzione dei 365 giorni. Alla domanda «cosa trovi cercando *365* in quel testo?» la risposta
è arrivata come *«non trovo nulla»*, e la citazione è stata **ritirata**: non sostituita in
silenzio con la circolare 15/E del 2007 che indicano le fonti secondarie, perché rimpiazzare una
citazione sbagliata senza aprirla sarebbe ripetere l'errore in forma più elegante.

Solo che il presupposto era sbagliato. Di risultati ce n'erano, **troppi** — «365» è una stringa
che in un documento fiscale compare ovunque — e non era chiaro quale fosse quello giusto. La
citazione è quindi tornata al suo posto, con lo stato che ha sempre avuto: **indizio da
verificare**, non fonte verificata.

Due lezioni, e la seconda è più utile della prima.

**La correzione può essere più sbagliata dell'errore.** È il secondo caso: il primo fu l'art. 14
c. 8 del D.Lgs. 23/2011 (§3.7), dove alla data inventata è seguita una smentita altrettanto
falsa. Qui non c'era nemmeno un errore da correggere — solo una lacuna già dichiarata — e la
«correzione» ha tolto informazione utile. Chi verifica sviluppa una fretta di chiudere che
somiglia molto a quella di chi non verifica affatto.

**Una ricerca a vuoto e una ricerca affogata si somigliano.** «Nessun risultato» e «troppi
risultati» sono esiti opposti che arrivano descritti quasi con le stesse parole, e portano a
conclusioni opposte. La differenza sta nella stringa: **«365» è inutile in un documento fiscale,
«bisestile» compare poche volte** e porta dritto al punto. Il registro ora indica quella parola
nel campo che dice come aprire il documento — perché una lacuna con l'indirizzo è un compito, e
una lacuna con l'indirizzo *e la chiave giusta* è un compito di cinque minuti.

Restano dunque tre errori di citazione — l'art. 13 c. 1-bis (§3.5), l'art. 14 c. 8 (§3.7) e il
paragrafo mai confermato della 326/E — e due correzioni sbagliate. Zero errori di calcolo
sopravvissuti. La conclusione è quella: **la parte fragile di un lavoro del genere non sono i
calcoli, sono i riferimenti.** I calcoli li verifica un test; i riferimenti li verifica solo chi
apre il documento — e li sbaglia di nuovo se lo apre di fretta.

### 3.11 Nota sull'ambiente di sviluppo

Le verifiche automatiche contro calcolatori online non sono eseguibili dalla suite. La
distinzione esatta è che dall'ambiente di sviluppo la **ricerca** web funziona, mentre il
**prelievo diretto** di una pagina è bloccato dal proxy verso Normattiva, def.finanze.it,
normelombardia, inps.it e i siti dei calcolatori: si può quindi sapere che un documento esiste e
dove sta, non leggerlo. Ogni atto citato come letto è stato aperto da chi scrive e riportato qui,
oppure caricato come PDF. I permalink di livello 1 nel registro non sono quindi
stati aperti da qui: il campo `verifica` di ciascuna fonte dice esattamente cosa è stato
controllato e cosa no. Il confronto di §3.4 è stato eseguito
manualmente. Le verifiche riproducibili con un comando restano quelle di §3.1 (ricalcolo
manuale codificato nel primo test) e §3.2 (suite completa).

---

## 4. Effetti soglia: la parte interessante

La normativa italiana concentra le agevolazioni in fasce che si perdono **per intero**. Il
risultato è che **il netto non è una funzione monotona della RAL**.

| Soglia | RAL corrispondente | Cosa si perde | Salto |
|---|---:|---|---:|
| reddito 8.500 € | 9.360,20 € | somma esente: 7,1% → 5,3% sull'intero reddito | −152,96 € |
| reddito 8.500 € | 9.360,24 € | uscita dalla no tax area: scattano le addizionali | −104,53 € |
| reddito 15.000 € | 16.518,00 € | trattamento integrativo (1.200 €) | −130,09 € |
| imponibile 23.000 € | 25.327,61 € | esenzione addizionale comunale Milano | −183,96 € |
| reddito 35.000 € | 38.542,01 € | maggiorazione art. 13 c. 1.1 (65 €) | −64,98 € |

E il salto opposto, a **RAL 9.001,14 €**: **+1.200,03 €** di netto per un centesimo di lordo in
più. È la condizione di capienza del trattamento integrativo (`IRPEF lorda > 1.955 − 75`).
In quel punto l'aliquota marginale effettiva vale **−1.196%**.

Nella fascia **32.000 – 40.000 €** di reddito non c'è un salto ma un'aliquota marginale
effettiva del **~61%**: 33% di IRPEF + 12,5% di *décalage* dell'ulteriore detrazione + 9,19%
di contributi + addizionali. È più alta della marginale di chi guadagna 100.000 €.

Il grafico in pagina mostra la marginale accanto alla curva del netto proprio per questo: sulla
curva del netto queste cose sono scalini invisibili, sulla marginale sono picchi.

---

## 5. Semplificazioni, e cosa comportano

### 5.1 Reddito complessivo = imponibile fiscale
Le soglie del cuneo, delle detrazioni e del trattamento integrativo si leggono sul *reddito
complessivo*, che non coincide necessariamente con l'imponibile da lavoro dipendente: include
altri redditi (locazioni, capitali, lavoro autonomo occasionale) ed è calcolato, ai fini del
cuneo, al netto della rendita dell'abitazione principale. **Effetto**: per un dipendente con un
solo rapporto di lavoro e nessun altro reddito l'approssimazione è esatta; con altri redditi il
modello sovrastima le agevolazioni.

### 5.2 Addizionali per competenza, non per cassa
In busta paga le addizionali si trattengono come **saldo dell'anno precedente** (in 11 rate da
gennaio a novembre) più **acconto del 30% dell'anno corrente**. Qui sono calcolate per
competenza sull'anno in corso. **Effetto**: su una retribuzione stabile la differenza si annulla
nel tempo; nell'anno di assunzione, di forte aumento o di cessazione, no.

### 5.3 TFR escluso
Il TFR è **accantonato**, non erogato: circa il 7,41% della retribuzione utile (1/13,5), al netto
del contributo dello 0,50% al Fondo di garanzia, e non transita nella retribuzione corrente.
**Effetto**: nessuno sul netto in busta paga; è però la prima domanda che fa chi confronta due
offerte, e va detto esplicitamente.

### 5.4 Riduzioni forfettarie delle detrazioni non applicate
La L. 207/2024 (art. 1 c. 10) riduce di **260 €** le detrazioni per oneri di chi supera 50.000 €
di reddito, e la L. 199/2025 aggiunge una riduzione di **440 €** oltre 200.000 € (esattamente il
risparmio massimo generato dal passaggio della seconda aliquota dal 35% al 33%, così da
neutralizzarlo per i redditi alti). Entrambe incidono sulle **detrazioni per oneri dell'art. 15
TUIR**, che questo modello non rappresenta perché non ci sono oneri detraibili.
**Effetto**: applicarle qui gonfierebbe l'imposta di un contribuente che, nel modello, non ha
detrazioni da ridurre. Sono quindi dichiarate e non applicate — scelta consapevole, non omissione.

### 5.5 Cosa manca del tutto
Detrazioni per carichi di famiglia (art. 12 TUIR) e assegno unico; fringe benefit e welfare
aziendale; premi di risultato a tassazione sostitutiva del 5%; previdenza complementare e
trattenute sindacali; regimi agevolati (impatriati, ricercatori, frontalieri); part-time e
contratti a termine; addizionali di comuni diversi da Milano; conguaglio di fine anno;
lavoro straordinario e indennità.

---

## 6. Se dovessi portarlo oltre il prototipo

1. **Anagrafe dei comuni**: le aliquote e le soglie comunali sono ~8.000 delibere che cambiano
   ogni anno. Vanno importate dal portale del Federalismo Fiscale del MEF, non digitate.
   Il modello di `parametri.js` è già pronto per riceverle come dato.
2. **Versionamento dei parametri per anno d'imposta**, con test di non regressione per ogni
   anno: `PARAMETRI_2025`, `PARAMETRI_2026`, … Il motore non cambia.
3. **Calcolo per busta paga** invece che a saldo d'anno: ratei di 13ª/14ª, addizionali per
   cassa, conguaglio di dicembre. È il salto da "simulatore" a "cedolino".
4. **Costo azienda**: contributi a carico del datore (~30%), INAIL, TFR. Serve per rispondere
   alla domanda che di solito viene dopo — "quanto mi costa questa assunzione".
5. **Confronto tra offerte**: due RAL, due comuni, due strutture di mensilità, affiancate.
   È l'uso reale del calcolatore.

---

## 7. Fonti

> Questa tabella è la versione narrativa del registro `FONTI` in
> `src/parametri.js`. La pagina **genera** la propria sezione "Fonti dei parametri" da quel
> registro, quindi ciò che l'utente legge non può divergere da ciò che il motore calcola. Quattro
> test garantiscono che ogni parametro dichiari una fonte esistente e completa, che nessuna fonte
> resti orfana e che il perimetro escluso sia dichiarato voce per voce.

| Argomento | Riferimento |
|---|---|
| Scaglioni e aliquote IRPEF 2026 (2ª aliquota al 33%) | L. 199/2025 (Legge di bilancio 2026), art. 11 TUIR |
| Detrazione per redditi di lavoro dipendente | Art. 13 D.P.R. 917/1986 (TUIR), c. 1; maggiorazione di 65 € al c. 1.1, introdotto dalla L. 234/2021 |
| Deducibilità dei contributi previdenziali | Art. 51 c. 2 lett. a TUIR |
| Taglio del cuneo: somma esente e ulteriore detrazione | L. 207/2024 art. 1 cc. 4-9; resa strutturale dalla L. 199/2025 |
| Riduzione detrazioni per oneri (260 € / 440 €) | L. 207/2024 art. 1 c. 10; L. 199/2025 |
| Trattamento integrativo | Art. 1 D.L. 3/2020 conv. L. 21/2020, mod. L. 234/2021 |
| Chiarimenti su cuneo, detrazioni e trattamento integrativo | Agenzia delle Entrate, circolare n. 4/E del 16 maggio 2025 |
| Aliquota IVS 9,19%, prima fascia 56.224 €, massimale 122.295 € | INPS, circolare n. 6 del 30/01/2026 |
| Aliquota aggiuntiva 1% oltre la prima fascia | Art. 3-ter D.L. 384/1992 |
| Massimale contributivo per i "nuovi iscritti" | Art. 2 c. 18 L. 335/1995 |
| Addizionale regionale IRPEF Lombardia | Delibera regionale, aliquote per scaglioni confermate per il 2026 |
| Addizionale comunale IRPEF Milano (0,80%, esenzione 23.000 €) | Delibera comunale; da riverificare annualmente sul portale del Federalismo Fiscale, MEF |

**Avvertenza sulle aliquote locali**: aliquota e soglia di esenzione dell'addizionale comunale
sono deliberate ogni anno dal Comune. Il Comune di Milano ha discusso un innalzamento della
soglia di esenzione a decorrere dal 2026: prima di usare il calcolatore in produzione, il valore
va riverificato sulla delibera vigente. È l'unico parametro del modello che può cambiare senza
un intervento del legislatore nazionale.

---

## 8. Nota sul bundle

`dist/calcolatore.html` è la versione a file singolo (CSS e JavaScript inline), apribile con
doppio clic e pubblicabile ovunque senza build step. È **generata** da `scripts/bundle.mjs` a
partire dagli stessi sorgenti della versione modulare: appiattisce i moduli ES in un unico
`<script type="module">` inline e incorpora il foglio di stile.

Il rischio ovvio di un bundle committato è che diverga dai sorgenti. `test/bundle.test.mjs` lo
esclude: rigenera il bundle in memoria e lo confronta byte per byte con il file su disco, e
verifica che la pagina sia davvero autoportante (nessun `<link>` o `<script src>` esterno,
nessun `import` residuo). Se qualcuno modifica il motore e non esegue `npm run build`, la suite
fallisce.
