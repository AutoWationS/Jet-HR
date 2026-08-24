# Metodologia, verifiche e semplificazioni

Documento di accompagnamento al prototipo. Serve a rendere il calcolatore **verificabile**:
un numero preciso senza il metodo che lo produce è solo un numero convincente.

Anno d'imposta di riferimento: **2026**.

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

I contributi previdenziali obbligatori sono deducibili (art. 51 c. 2 lett. a TUIR): non
concorrono a formare il reddito di lavoro dipendente.

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

Nota: gli scaglioni regionali sono ancora quelli **a cinque fasce pre-riforma**, non allineati
ai tre scaglioni IRPEF. È un disallineamento reale della norma, non un errore del modello.

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
| Detrazione art. 13 | 1.910 × (50.000 − 31.783,50) / 22.000 | +1.581,52 |
| Maggiorazione c. 1.1 | reddito in (25.000; 35.000] | +65,00 |
| Ulteriore detrazione cuneo | reddito ≤ 32.000 → importo pieno | +1.000,00 |
| **IRPEF netta** | 7.688,56 − 2.646,52 | **−5.042,04** |
| Add. regionale Lombardia | 15.000 × 1,23% = 184,50 <br> 13.000 × 1,58% = 205,40 <br> 3.783,50 × 1,72% = 65,08 | −454,98 |
| Add. comunale Milano | 31.783,50 × 0,80% (sopra soglia 23.000) | −254,27 |
| **Netto annuo** | 31.783,50 − 5.042,04 − 454,98 − 254,27 | **26.032,21** |
| **Netto mensile** | ÷ 13 | **2.002,48** |

(Il motore restituisce 26.032,22: la differenza di un centesimo è arrotondamento intermedio.)

Questo ricalcolo è codificato riga per riga nel primo test di `test/motore.test.mjs`: se un
passaggio si rompe, il test dice **quale**.

### 3.2 Suite di test

`npm test` esegue 21 test. Diciotto sul motore, in tre famiglie:

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
| Detrazione art. 13 | 793,13 | 793 |
| Taglio del cuneo (reddito oltre 40.000) | 0 | 0 |
| Trattamento integrativo | 0 | 0 |
| Imposte nette | 10.830,25 | 10.830 |
| **Netto annuo** | **30.034,25** | **30.034** |
| Netto mensile | 2.310,33 | 2.310 |

**RAL 35.000 — una sola divergenza, di 65 €:**

| Voce | Modello | PMI.it | Δ |
|---|---:|---:|---:|
| Imposte lorde (IRPEF 7.688,56 + addizionali 709,24) | 8.397,80 | 8.398 | +0,20 |
| Detrazioni art. 13 | 1.646,52 | 1.712 | **+65,48** |
| Taglio del cuneo | 1.000,00 | 1.000 | 0 |
| Imposte nette | 5.751,28 | 5.686 | −65,28 |
| **Netto annuo** | **26.032,22** | **26.097** | **+64,78** |

Le imposte lorde coincidono a venti centesimi: un numero costruito da otto componenti
indipendenti (tre scaglioni IRPEF, quattro scaglioni regionali, l'aliquota comunale) su un
imponibile che dipende a sua volta dall'aliquota contributiva. Questo conferma in blocco tutta
la catena fino alle addizionali.

**Diagnosi della divergenza.** Poiché a 45.000 la detrazione art. 13 coincide esattamente
(793,13 contro 793), la formula del comma 1 è identica nei due modelli. A 35.000 si aggiunge
solo la maggiorazione del comma 1.1: qui il modello applica 65 €, l'altro calcolatore ne
applica circa 130 (1.712 − 1.581,52 = 130,48). L'art. 13 c. 1.1 TUIR, introdotto dalla
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

### 3.5 Nota sull'ambiente di sviluppo

Le verifiche automatiche contro calcolatori online non sono eseguibili dalla suite: l'ambiente
di sviluppo non ha accesso di rete verso quei siti. Il confronto di §3.4 è stato eseguito
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
| reddito 15.000 € | 16.518,00 € | trattamento integrativo (1.200 €) | −129,97 € |
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
