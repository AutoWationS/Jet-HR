# Dal lordo al netto — calcolatore RAL → netto (anno d'imposta 2026)

Prototipo di calcolatore che, data una **RAL** (retribuzione annua lorda), proietta la
**retribuzione netta annua e mensile** e mostra **ogni voce trattenuta sul lordo**.

Ipotesi del caso standard: impiegato del settore privato, contratto a tempo indeterminato,
residente e domiciliato fiscalmente a **Milano**, nessuna agevolazione o regime speciale.

> ⚠️ Prototipo a scopo dimostrativo. Non sostituisce un cedolino paga né una consulenza fiscale.
> Tutte le semplificazioni sono dichiarate: vedi [`docs/metodologia.md`](docs/metodologia.md).

---

## Come si prova

La pagina usa moduli ES: va servita da un server statico (aprendola con `file://` il browser
non carica i moduli e compare un avviso esplicito).

```bash
git clone <questo-repo> && cd <questo-repo>
python3 -m http.server 8080     # oppure: npx serve .
# apri http://localhost:8080
```

Test del motore di calcolo (nessuna dipendenza, solo Node ≥ 18):

```bash
npm test                               # 19 test con node --test
npm run build                          # rigenera il bundle in dist/
node scripts/tabella-riferimento.mjs   # tabella dei casi di riferimento in markdown
```

### Versione a file singolo

`dist/calcolatore.html` è la stessa pagina con CSS e JavaScript inline: si apre con
**doppio clic**, senza server. Non è una seconda implementazione — è generata dagli stessi
sorgenti da `scripts/bundle.mjs`, e un test verifica che il file in `dist/` sia allineato al
codice: se si tocca il motore e ci si dimentica di `npm run build`, la suite fallisce.

---

## La catena di calcolo

Il cuore dell'esercizio non è la pagina, è la sequenza. In busta paga si scende così:

```
  RAL
−  contributi INPS a carico dipendente      IVS 9,19%  (+1% oltre 56.224 €)
=  imponibile fiscale
−  IRPEF lorda                              23% / 33% / 43%
+  detrazione lavoro dipendente             art. 13 TUIR, rapportata ai giorni
+  ulteriore detrazione taglio cuneo        1.000 € tra 20k e 32k, décalage fino a 40k
=  IRPEF netta  (mai negativa)
−  addizionale regionale Lombardia          per scaglioni, 1,23% → 1,73%
−  addizionale comunale Milano              0,80%, esente sotto 23.000 € di imponibile
+  somma esente taglio cuneo                7,1% / 5,3% / 4,8% fino a 20.000 €
+  trattamento integrativo                  1.200 € fino a 15.000 €
=  NETTO ANNUO        →  ÷ 12 / 13 / 14 mensilità  →  NETTO MENSILE
```

Le mensilità **non cambiano il netto annuo**: cambiano solo come viene spalmato. È una scelta
esplicita, ed è il primo malinteso da chiarire quando si parla di "quanto prendo al mese".

---

## Struttura del progetto

Il vincolo di progetto è uno solo: **il motore di calcolo non deve finire dentro la UI**.

| File | Ruolo |
|---|---|
| `src/parametri.js` | Tutte le aliquote, soglie e importi, ognuno con la fonte normativa accanto. Nel motore non esiste un solo numero magico. Cambiare anno d'imposta = aggiungere un oggetto qui. |
| `src/motore.js` | Funzioni **pure**: zero DOM, zero I/O, zero dipendenze. `calcolaNetto(input, parametri)`. |
| `src/ui.js` | L'unico modulo che tocca il DOM. Non conosce nessuna regola fiscale. |
| `src/grafico.js` | Curva netto/RAL e aliquota marginale, SVG generato a mano. |
| `src/formato.js` | Unico posto in cui i numeri diventano stringhe. |
| `test/motore.test.mjs` | 16 test sul motore, con `node --test`. |
| `test/bundle.test.mjs` | 3 test che tengono il bundle allineato ai sorgenti. |
| `scripts/bundle.mjs` | Impacchetta tutto in un file HTML autoportante (`dist/`). Esporta `costruisci()` così che un test possa verificare che il bundle non sia divergente. |
| `scripts/tabella-riferimento.mjs` | Tabella dei casi di riferimento, per il confronto con calcolatori esterni. |
| `docs/metodologia.md` | Fonti, semplificazioni, verifiche e questioni aperte. |

---

## Casi di riferimento (13 mensilità)

| RAL | INPS | Imponibile | IRPEF netta | Addizionali | Bonus | **Netto annuo** | Netto/mese | % netto | Marginale |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 15.000 | 1.378,50 | 13.621,50 | 1.177,95 | 167,54 | 1.921,94 | **14.197,95** | 1.092,15 | 94,65% | 26,39% |
| 25.000 | 2.297,50 | 22.702,50 | 1.826,65 | 306,20 | — | **20.569,65** | 1.582,28 | 82,28% | 39,83% |
| 35.000 | 3.216,50 | 31.783,50 | 5.042,04 | 709,25 | — | **26.032,22** | 2.002,48 | 74,38% | 49,33% |
| 60.000 | 5.551,76 | 54.448,24 | 15.612,74 | 1.280,84 | — | **37.554,66** | 2.888,82 | 62,59% | 51,08% |
| 120.000 | 11.665,76 | 108.334,24 | 38.783,72 | 2.644,15 | — | **66.906,36** | 5.146,64 | 55,76% | 51,08% |

La pagina è progettata per **tema chiaro e scuro**: i componenti leggono solo token CSS,
i tre stati del tema (chiaro esplicito, scuro esplicito, impostazione di sistema) sono coperti,
e anche i colori del grafico SVG stanno nel foglio di stile, non nel codice che lo disegna.

Il caso 35.000 è ricalcolato passaggio per passaggio, a mano, in
[`docs/metodologia.md`](docs/metodologia.md) e nel primo test della suite.

---

## Cosa mostra il prototipo che un calcolatore "a scatola chiusa" nasconde

La cosa interessante non è il numero finale, sono le **soglie**. La normativa italiana è piena
di agevolazioni che si perdono *per intero* superando un euro di reddito: il risultato è che il
netto **non è monotono** nella RAL.

Il grafico in pagina mostra l'aliquota marginale effettiva accanto alla curva del netto, e la
suite di test contiene un controllo che verifica che il netto scenda **solo** in corrispondenza
delle soglie dichiarate — se ne comparisse una nuova, il test fallisce.

Nel modello 2026 le cadute sono quattro:

| Soglia | RAL corrispondente | Cosa succede | Salto del netto |
|---|---:|---|---:|
| reddito 8.500 € | 9.360 € | la somma esente scende dal 7,1% al 5,3% **dell'intero** reddito | −152,96 € |
| reddito 15.000 € | 16.518 € | decade il trattamento integrativo da 1.200 € | −129,97 € |
| imponibile 23.000 € | 25.328 € | scatta l'addizionale comunale di Milano **sull'intero** imponibile | −183,96 € |
| reddito 35.000 € | 38.542 € | decade la maggiorazione di 65 € (art. 13 c. 1.1) | −64,98 € |

E un salto nella direzione opposta: a **9.001,14 € di RAL** il netto fa **+1.200 €** di colpo.
È la condizione di capienza del trattamento integrativo ("IRPEF lorda > detrazione art. 13
− 75 €"): un centesimo di lordo in più e il credito scatta per intero. In quel punto l'aliquota
marginale vale **−1.196%**. Non è un bug: è come è scritta la norma.

---

## Fonti principali

- **IRPEF 2026** (seconda aliquota dal 35% al 33%): Legge di bilancio 2026 (L. 199/2025), art. 11 TUIR.
- **Detrazione lavoro dipendente**: art. 13 D.P.R. 917/1986 (TUIR).
- **Taglio del cuneo fiscale** (somma esente + ulteriore detrazione): L. 207/2024 art. 1 cc. 4-9,
  reso strutturale dalla L. 199/2025.
- **Trattamento integrativo**: art. 1 D.L. 3/2020 conv. L. 21/2020, mod. L. 234/2021.
- **Contributi**: aliquota IVS 9,19%; prima fascia di retribuzione pensionabile 56.224 € e
  massimale annuo 122.295 € da INPS circ. n. 6 del 30/01/2026; aliquota aggiuntiva 1% ex
  art. 3-ter D.L. 384/1992.
- **Addizionale regionale Lombardia**: aliquote per scaglioni 1,23% / 1,58% / 1,72% / 1,73%.
- **Addizionale comunale Milano**: 0,80% con soglia di esenzione a 23.000 €.

Dettaglio, link e note di verifica in [`docs/metodologia.md`](docs/metodologia.md).
