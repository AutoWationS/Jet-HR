# Dal lordo al netto — calcolatore RAL → netto

Prototipo che, data una **RAL**, proietta la **retribuzione netta annua e mensile** e mostra
**ogni voce trattenuta sul lordo**: contributi previdenziali, IRPEF, addizionali locali, e le
somme non imponibili che tornano in busta paga.

Caso modellato: impiegato del settore privato, residente a **Milano**, anno d'imposta **2026**.
Contratto, familiari a carico e oneri deducibili sono parametri; tutto ciò che resta fuori è
elencato voce per voce, con la norma che lo esclude.

**▶ Provalo qui: https://autowations.github.io/Jet-HR/**

---

## Da dove partire, secondo cosa vuoi vedere

| Se vuoi… | Guarda |
|---|---|
| provarlo | il link qui sopra, oppure `dist/calcolatore.html` con un doppio clic |
| capire *come* calcola | [`src/motore.js`](src/motore.js) — funzioni pure, zero DOM, un commento per ogni regola |
| capire *perché* quei numeri | [`src/parametri.js`](src/parametri.js) — il registro `FONTI`: per ogni valore la norma, come è stata verificata e cosa manca |
| il ragionamento per esteso | [`docs/metodologia.md`](docs/metodologia.md) — decisioni, verifiche, errori trovati, semplificazioni |

```bash
npm test                               # 54 test, nessuna dipendenza da installare
node scripts/verifica-fonti.mjs        # stato di verifica di ogni fonte, e cosa resta da aprire
node scripts/tabella-riferimento.mjs   # 11 RAL con tutte le voci intermedie
```

Nessun `npm install`: solo ES modules e `node --test`.

---

## La catena di calcolo

Il cuore dell'esercizio non è la pagina, è la sequenza. In busta paga si scende così:

```
   RAL
−  contributi INPS c/dipendente      IVS 9,19%, +1% oltre 56.224 €
=  imponibile fiscale                (i contributi non concorrono al reddito, art. 51 TUIR)
−  IRPEF lorda                       23% / 33% / 43%
+  detrazione lavoro dipendente      art. 13 c. 1, rapportata ai giorni, +65 € (c. 1.1)
+  ulteriore detrazione cuneo        1.000 € tra 20k e 32k, décalage fino a 40k
=  IRPEF netta                       mai negativa: l'eccedenza si perde
−  addizionale regionale Lombardia   per scaglioni, 1,23% → 1,73%
−  addizionale comunale Milano       0,80%, esente sotto 23.000 € di imponibile
                                     nessuna delle due è dovuta se l'IRPEF netta è zero
+  somma esente cuneo                7,1% / 5,3% / 4,8% fino a 20.000 €
+  trattamento integrativo           1.200 € fino a 15.000 €, se c'è capienza
=  NETTO ANNUO   →   ÷ 12 / 13 / 14 mensilità   →   NETTO MENSILE
```

Due punti che valgono una nota:

- le **mensilità non cambiano il netto annuo**, cambiano solo come viene spalmato. È il primo
  malinteso da chiarire quando si parla di "quanto prendo al mese";
- i **contributi INPS non sono imposte**: sono retribuzione differita che matura pensione. La
  pagina li mostra separati dalle imposte proprio per non confonderli.

---

## Le decisioni

Il dominio è vasto, quindi la parte difficile non è calcolare: è **scegliere cosa modellare e
dirlo**. Ogni riga qui sotto è una scelta consapevole, con l'alternativa che ho scartato.

| Decisione | Alternativa scartata | Perché questa |
|---|---|---|
| Motore puro, separato dalla UI | Tutto in un file con il DOM | I test girano senza browser: se la separazione fosse finta non partirebbero |
| Nessun numero magico nel motore | Costanti sparse nel codice | Cambiare anno d'imposta = un oggetto nuovo in `parametri.js`, zero modifiche alla logica |
| Fonti come **dati**, non commenti | Elenco di link scritto a mano | La pagina genera la sezione "Fonti" dai parametri: non può divergere dal calcolo |
| Reddito complessivo = imponibile fiscale | Modellare il reddito di riferimento completo | Esatto per chi ha solo reddito da lavoro dipendente; il resto è fuori dal caso standard |
| Addizionali per competenza | Per cassa (saldo + acconto) come in busta | Su una carriera stabile si equivalgono; per cassa servirebbe l'anno precedente in input |
| Calcolo a saldo d'anno | Simulazione busta per busta | Il brief chiede la proiezione annua; il cedolino mensile è un altro prodotto |
| TFR escluso dal netto | Scorporarlo dalla RAL | È accantonato, non erogato: non transita nella retribuzione corrente |
| Riduzioni forfettarie (260 € / 440 €) dichiarate ma non applicate | Applicarle per "completezza" | Incidono sulle detrazioni per oneri dell'art. 15, che il modello non ha: applicarle gonfierebbe l'imposta di chi non ha nulla da ridurre |
| Massimale contributivo attivo di default | Ignorarlo | Un assunto di oggi è iscritto dopo il 1995; resta un interruttore nei parametri avanzati |
| Effetti soglia **mostrati**, non nascosti | Curva liscia e rassicurante | Sono la parte del sistema che sorprende chi legge la busta paga: nasconderli è la scelta comoda |

---

## Come è verificato

Sette livelli, dal più debole al più forte.

**1. Ricalcolo manuale.** Il caso RAL 35.000 è rifatto a mano passaggio per passaggio in
[`docs/metodologia.md`](docs/metodologia.md) §3.1, e lo stesso ricalcolo è codificato riga per
riga nel primo test: se un passaggio si rompe, il test dice **quale**.

**2. Cinquantaquattro test** con `node --test`, in cinque famiglie:
casi di riferimento (ogni voce intermedia, non solo il totale), blocchi isolati (continuità
delle formule sui confini di fascia, décalage, massimale), invarianti sull'intera curva da 1.000
a 200.000 €, coerenza del registro delle fonti, e il disegno del grafico — l'SVG viene generato
e riletto, e ogni soglia dichiarata deve avere il suo picco di marginale nel disegno.

L'invariante più utile: **il netto può scendere solo attraversando una soglia dichiarata**, e
ogni salto vale esattamente quanto l'agevolazione persa. Se una modifica introducesse una
discontinuità non prevista, il test cade e dice a quale RAL.

**3. Confronto con un calcolatore indipendente** (PMI.it), documentato in
[`docs/metodologia.md`](docs/metodologia.md) §3.4. A RAL 45.000 tutte le voci coincidono al
centesimo. Le due divergenze trovate sono risolte con la norma alla mano — e **una era un
errore nostro**: il modello calcolava le addizionali anche in no tax area, dove non sono dovute.
Nessun test interno poteva trovarlo: il modello non conosceva la regola.

**4. Lettura della prassi.** La circolare Agenzia delle Entrate 4/E del 16/05/2025 — che è
prassi, non norma primaria — è stata letta integralmente: ha confermato tre scelte e corretto
quattro dettagli sul rapporto al periodo di lavoro. Gli esempi 1 e 2 sono due casi di test.

**5. Stato di verifica tipizzato.** Ogni fonte dichiara *come* è stata verificata — atto letto,
prassi, fonte dell'ente, non verificata — e, se incompleta, un campo `lacuna` che nomina ciò che
manca più il documento da aprire per chiuderla. Un test impedisce alla prosa di dirsi
«VERIFICATO» quando lo stato non lo consente: è la correzione di un difetto reale, sei fonti si
erano autopromosse citando il testo unico riordinato al posto di quello vigente. Oggi **sedici
delle diciassette fonti hanno avuto il proprio atto aperto**; la diciassettesima — l'aliquota
dell'apprendista — è letta in circolare, per una ragione dichiarata. Tre delle fonti lette
conservano una lacuna dichiarata e circoscritta, e nessuna di esse tocca un numero del caso
modellato;
`node scripts/verifica-fonti.mjs` stampa cosa resta e dove trovarlo. Un secondo test legge il
sorgente del registro e cade se una fonte dichiara due volte la stessa chiave: anche quello è la
correzione di un difetto reale, sei note di verifica aggiornate che l'object literal cancellava
in silenzio.

La disciplina ha già dato il suo primo frutto. Le **aliquote regionali agevolate per carichi
di famiglia** che guide e schede riportano ancora (0,90% con tre o più figli, 1,23% con
disabilità) erano state implementate su quel consenso, con stato `non-verificata`; la lettura
dell'art. 72 per intero ha mostrato che i commi che le contenevano sono **abrogati** dal 2021,
e la regola è stata rimossa. La voce dedicata del perimetro escluso racconta la trappola, e un
test impedisce che rientri da una guida invece che da una legge.

**6. Lettura del testo normativo.** Gli artt. 11 e 13 sono stati letti sul testo unico
pubblicato in Gazzetta Ufficiale. Hanno confermato le aliquote, la formula della capienza e la
maggiorazione di 65 € — il valore più esposto del progetto — e hanno rivelato una regola che
mancava: il rapporto interno alla formula della detrazione va assunto **nelle prime quattro
cifre decimali** (art. 13 c. 6 TUIR). Implementata: sul caso di riferimento vale 4 centesimi.
Poi gli artt. 8, 11, 13, 49 e 51 sono stati riletti sul **testo vigente** applicabile al 2026, e
i commi 4-9 della L. 207/2024 sul cuneo — la misura che sposta più euro nel prototipo — sono
stati letti in originale invece che dentro una circolare. Hanno confermato ogni confine ed
esplicitato due cose che la prassi non diceva: l'esclusione dei pensionati dal cuneo, e che
l'annualizzazione del reddito vale *«ai soli fini dell'individuazione della percentuale»*.
Stessa cosa per il trattamento integrativo (D.L. 3/2020): l'originale mostra che la condizione
rinvia al **solo comma 1** dell'art. 13, quindi senza la maggiorazione di 65 €, e che il
ragguaglio al periodo di lavoro cade anche sui 75 € di scarto.

**7. Audit delle fonti.** Ogni fonte del registro dichiara il proprio **livello** nella gerarchia
(1 = norma primaria, 2 = prassi e atti locali) e un test impedisce che una fonte di livello 1
punti a una scheda divulgativa invece che a una banca dati normativa. Un secondo test confronta
i numeri scritti in prosa nelle fonti con i parametri effettivi: se un valore cambia e la
descrizione no, la suite cade.

---

## Struttura

| File | Ruolo |
|---|---|
| `src/parametri.js` | Aliquote, soglie, importi, e il registro `FONTI`: per ogni blocco la norma primaria, la prassi, il dettaglio applicativo e cosa è stato verificato. |
| `src/motore.js` | Funzioni **pure**: zero DOM, zero I/O, zero dipendenze. `calcolaNetto(input, parametri)`. |
| `src/ui.js` | L'unico modulo che tocca il DOM. Non conosce nessuna regola fiscale. |
| `src/grafico.js` | Curva netto/RAL e aliquota marginale, SVG generato a mano. |
| `src/formato.js` | Unico posto in cui i numeri diventano stringhe. |
| `test/` | 33 test sul motore, 13 sulle fonti, 5 sul grafico, 3 sul bundle. |
| `scripts/bundle.mjs` | Genera `dist/` dai sorgenti; un test verifica che non possa divergere. |
| `docs/metodologia.md` | Decisioni, catena di calcolo, verifiche, semplificazioni, fonti. |

---

## Casi di riferimento (13 mensilità)

| RAL | Contributi | Imponibile | IRPEF netta | Addizionali | Non imponibili | **Netto annuo** | Netto/mese |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 15.000 | 1.378,50 | 13.621,50 | 1.177,95 | 167,54 | 1.921,94 | **14.197,95** | 1.092,15 |
| 25.000 | 2.297,50 | 22.702,50 | 1.826,65 | 306,20 | — | **20.569,65** | 1.582,28 |
| 35.000 | 3.216,50 | 31.783,50 | 5.042,08 | 709,25 | — | **26.032,18** | 2.002,48 |
| 45.000 | 4.135,50 | 40.864,50 | 9.892,26 | 938,09 | — | **30.034,15** | 2.310,32 |
| 60.000 | 5.551,76 | 54.448,24 | 15.612,74 | 1.280,84 | — | **37.554,66** | 2.888,82 |
| 120.000 | 11.665,76 | 108.334,24 | 38.783,72 | 2.644,16 | — | **66.906,36** | 5.146,64 |

---

## La parte che un calcolatore a scatola chiusa nasconde

Il netto in Italia **non è monotono nella RAL**: la normativa concentra le agevolazioni in fasce
che si perdono per intero. Il grafico in pagina mostra l'aliquota marginale accanto alla curva
del netto proprio per rendere visibili questi punti.

| Soglia | RAL | Cosa succede | Salto |
|---|---:|---|---:|
| reddito 8.500 € | 9.360,20 € | la somma esente scende dal 7,1% al 5,3% dell'intero reddito | −152,96 € |
| reddito 8.500 € | 9.360,24 € | si esce dalla no tax area: scattano le addizionali | −104,53 € |
| reddito 15.000 € | 16.518,00 € | decade il trattamento integrativo | −130,09 € |
| imponibile 23.000 € | 25.327,61 € | l'esenzione comunale di Milano cade sull'**intero** imponibile | −183,96 € |
| reddito 35.000 € | 38.542,01 € | decade la maggiorazione di 65 € | −64,98 € |

E il salto opposto: a **RAL 9.001,14 €** il netto fa **+1.200 €** di colpo, perché scatta la
capienza del trattamento integrativo. In quel punto l'aliquota marginale vale **−1.196%**.

Nella fascia 32.000–40.000 di reddito la marginale effettiva è del **~61%**: più alta di quella
di chi guadagna 100.000 €.

---

## Cosa resta fuori

Dichiarato voce per voce, con norma e motivo, in `src/parametri.js` (`fuoriPerimetro`) e
mostrato in fondo alla pagina: riduzioni forfettarie delle detrazioni per oneri, TFR, detrazioni
per carichi di famiglia, fringe benefit e premi di risultato, addizionali per cassa.

Non modellati anche: regimi agevolati (impatriati, ricercatori, frontalieri), part-time e
contratti a termine, comuni diversi da Milano, conguaglio di fine anno, straordinari, le
detassazioni 2026 dei rinnovi contrattuali e del lavoro notturno e festivo (L. 199/2025),
l'esonero contributivo delle lavoratrici madri e il bonus mamme.

---

## Fonti

Le fonti complete, con norma primaria, prassi e nota di verifica, sono nel registro `FONTI` di
`src/parametri.js` e sono **generate in pagina** da lì. Ogni voce della cascata cita la norma
della propria operazione, e la citazione è un collegamento alla scheda della fonte: un test
verifica che ogni citazione punti a una scheda esistente del registro. In sintesi:

- **IRPEF 2026**: art. 11 TUIR come modificato dalla L. 199/2025 (seconda aliquota 35% → 33%).
- **Detrazione lavoro dipendente**: art. 13 c. 1 TUIR; maggiorazione di 65 € al c. 1.1 (L. 234/2021).
- **Taglio del cuneo**: L. 207/2024 art. 1 cc. 4-9, strutturale con la L. 199/2025.
- **Trattamento integrativo**: art. 1 D.L. 3/2020, come modificato dalla L. 207/2024 c. 3.
- **Contributi**: IVS 9,19%; 1% ex art. 3-ter D.L. 384/1992; prima fascia 56.224 € e massimale
  122.295 € da INPS circ. 6 del 30/01/2026.
- **Addizionali**: art. 50 D.Lgs. 446/1997 e art. 1 D.Lgs. 360/1998; aliquote deliberate da
  Regione Lombardia e Comune di Milano.
- **Aliquote regionali agevolate** per carichi di famiglia: **abrogate** — stavano nei
  cc. 1-bis e 1-ter dell'art. 72 l.r. 10/2003, soppressi dalla l.r. 26/2020. Le guide le
  riportano ancora; la voce del perimetro escluso spiega perché qui non ci sono.
- **Prassi**: circolari Agenzia delle Entrate 4/E del 16/05/2025 e 2/E del 24/02/2026
  (detassazioni della legge di bilancio 2026), lette integralmente.

> Il parametro più volatile è la **soglia di esenzione dell'addizionale comunale di Milano**:
> è deliberata ogni anno dal Comune, ed è l'unico valore del modello che può cambiare senza un
> intervento del legislatore nazionale.

---

Prototipo a scopo dimostrativo. Non sostituisce un cedolino paga né una consulenza fiscale.
