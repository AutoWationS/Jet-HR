/**
 * ui.js — Unico modulo che tocca il DOM.
 *
 * Non contiene nessuna regola fiscale: legge il modulo, chiama il motore,
 * disegna il risultato. Se domani il calcolo cambia, qui non si tocca nulla.
 */

import { calcolaNetto } from './motore.js';
import { PARAMETRI_DEFAULT as P } from './parametri.js';
import { eur, eurTondo, pct, etichettaScaglione } from './formato.js';
import { disegnaGrafico } from './grafico.js';

const $ = (sel) => document.querySelector(sel);

/* ---------------------------------------------------------------- *
 * Costruzione delle righe della cascata
 * ---------------------------------------------------------------- */

function riga({ voce, nota, importo, quota, classe = '', segno = '' }) {
  const testoImporto = segno && importo !== 0 ? `${segno} ${eur(Math.abs(importo))}` : eur(importo);
  return `
    <div class="riga ${classe}">
      <div class="voce">${voce}${nota ? `<small>${nota}</small>` : ''}</div>
      <div class="importo">${testoImporto}</div>
      <div class="quota">${quota ?? ''}</div>
    </div>`;
}

function gruppo({ voce, nota, importo, quota, classe, segno, dettagli }) {
  if (!dettagli.length) return riga({ voce, nota, importo, quota, classe, segno });
  return `
    <details class="gruppo">
      <summary>${riga({ voce, nota: `${nota} — apri il dettaglio`, importo, quota, classe, segno })}</summary>
      ${dettagli.map((d) => riga({ voce: d.voce, importo: d.importo, classe: 'dettaglio' })).join('')}
    </details>`;
}

/* ---------------------------------------------------------------- *
 * Rendering del risultato
 * ---------------------------------------------------------------- */

function mostraRisultato(r) {
  const su = (x) => (r.input.ral > 0 ? pct(x / r.input.ral) : '');

  /* --- Indicatori principali --- */
  $('#indicatori').innerHTML = `
    <div class="indicatore positivo">
      <div class="titolo">Netto annuo</div>
      <div class="valore">${eur(r.netto.annuo)}</div>
      <div class="nota">${pct(r.indici.incidenzaNetto)} della RAL</div>
    </div>
    <div class="indicatore">
      <div class="titolo">Netto mensile</div>
      <div class="valore">${eur(r.netto.mensile)}</div>
      <div class="nota">su ${r.input.mensilita} mensilità</div>
    </div>
    <div class="indicatore negativo">
      <div class="titolo">Trattenute totali</div>
      <div class="valore">${eur(r.totali.trattenute)}</div>
      <div class="nota">contributi ${eurTondo(r.totali.contributi)} + imposte ${eurTondo(
        r.totali.imposte,
      )}</div>
    </div>
    <div class="indicatore">
      <div class="titolo">Aliquota marginale</div>
      <div class="valore">${pct(r.indici.aliquotaMarginale)}</div>
      <div class="nota">su 100 € di aumento lordo restano ${eur(
        100 * (1 - r.indici.aliquotaMarginale),
      )}</div>
    </div>`;

  /* --- Cascata dal lordo al netto --- */
  const scaglioniIrpef = r.irpef.scaglioni.map((d) => ({
    voce: etichettaScaglione(d),
    importo: d.imposta,
  }));
  const scaglioniReg = r.addizionali.regionaleDettaglio.map((d) => ({
    voce: etichettaScaglione(d),
    importo: d.imposta,
  }));

  const detrazioni = [
    { voce: `Detrazione lavoro dipendente (art. 13 TUIR)`, importo: -r.irpef.detrazioneLavoro },
    r.irpef.maggiorazione65
      ? { voce: 'Maggiorazione art. 13 c. 1.1 (65 €)', importo: -r.irpef.maggiorazione65 }
      : null,
    r.irpef.ulterioreDetrazione
      ? { voce: 'Ulteriore detrazione taglio cuneo (L. 207/2024)', importo: -r.irpef.ulterioreDetrazione }
      : null,
  ].filter(Boolean);

  const pezzi = [];

  pezzi.push(
    riga({
      voce: 'Retribuzione annua lorda (RAL)',
      nota: 'quanto costa il dipendente in busta paga, al lordo di tutto',
      importo: r.input.ral,
      quota: '100,00%',
      classe: 'parziale',
    }),
  );

  pezzi.push(
    gruppo({
      voce: 'Contributi INPS a carico dipendente',
      nota: `IVS ${pct(P.inps.aliquotaIvs)}${
        r.contributi.aggiuntivo ? ` + 1% oltre ${eurTondo(P.inps.primaFasciaPensionabile)}` : ''
      }`,
      importo: -r.contributi.totale,
      quota: su(-r.contributi.totale),
      classe: 'trattenuta',
      segno: '−',
      dettagli: [
        { voce: `IVS ${pct(P.inps.aliquotaIvs)} su ${eurTondo(r.contributi.baseImponibile)}`, importo: -r.contributi.ivs },
        r.contributi.aggiuntivo
          ? { voce: `Aliquota aggiuntiva 1% oltre ${eurTondo(P.inps.primaFasciaPensionabile)}`, importo: -r.contributi.aggiuntivo }
          : null,
        r.contributi.massimaleApplicato
          ? { voce: `Massimale contributivo applicato (${eurTondo(P.inps.massimaleAnnuo)})`, importo: 0 }
          : null,
      ].filter(Boolean),
    }),
  );

  pezzi.push(
    riga({
      voce: 'Imponibile fiscale IRPEF',
      nota: 'RAL al netto dei contributi previdenziali',
      importo: r.imponibileFiscale,
      quota: su(r.imponibileFiscale),
      classe: 'parziale',
    }),
  );

  pezzi.push(
    gruppo({
      voce: 'IRPEF lorda',
      nota: 'scaglioni 23% / 33% / 43% (L. 199/2025)',
      importo: -r.irpef.lorda,
      quota: su(-r.irpef.lorda),
      classe: 'trattenuta',
      segno: '−',
      dettagli: scaglioniIrpef.map((d) => ({ ...d, importo: -d.importo })),
    }),
  );

  pezzi.push(
    gruppo({
      voce: 'Detrazioni d’imposta',
      nota: r.irpef.detrazioniNonGodute
        ? `di cui ${eur(r.irpef.detrazioniNonGodute)} non godute per incapienza`
        : 'abbattono l’IRPEF lorda',
      importo: Math.min(r.irpef.detrazioniTotali, r.irpef.lorda),
      quota: su(Math.min(r.irpef.detrazioniTotali, r.irpef.lorda)),
      classe: 'bonus',
      segno: '+',
      dettagli: detrazioni.map((d) => ({ ...d, importo: -d.importo })),
    }),
  );

  pezzi.push(
    riga({
      voce: 'IRPEF netta',
      nota: `aliquota effettiva ${pct(r.indici.aliquotaIrpefEffettiva)} sull’imponibile`,
      importo: -r.irpef.netta,
      quota: su(-r.irpef.netta),
      classe: 'trattenuta',
      segno: '−',
    }),
  );

  pezzi.push(
    gruppo({
      voce: `Addizionale regionale ${P.addizionaleRegionale.regione}`,
      nota: 'aliquote per scaglioni sull’imponibile IRPEF',
      importo: -r.addizionali.regionale,
      quota: su(-r.addizionali.regionale),
      classe: 'trattenuta',
      segno: '−',
      dettagli: scaglioniReg.map((d) => ({ ...d, importo: -d.importo })),
    }),
  );

  pezzi.push(
    riga({
      voce: `Addizionale comunale ${P.addizionaleComunale.comune}`,
      nota: r.addizionali.comunaleEsente
        ? `esente: imponibile sotto la soglia di ${eurTondo(P.addizionaleComunale.sogliaEsenzione)}`
        : `${pct(P.addizionaleComunale.aliquota)} sull’intero imponibile`,
      importo: -r.addizionali.comunale,
      quota: su(-r.addizionali.comunale),
      classe: 'trattenuta',
      segno: r.addizionali.comunale ? '−' : '',
    }),
  );

  if (r.bonus.sommaEsente) {
    pezzi.push(
      riga({
        voce: 'Somma esente taglio cuneo (L. 207/2024)',
        nota: `${pct(r.bonus.sommaEsentePercentuale)} del reddito di lavoro dipendente, non imponibile`,
        importo: r.bonus.sommaEsente,
        quota: su(r.bonus.sommaEsente),
        classe: 'bonus',
        segno: '+',
      }),
    );
  }

  if (r.bonus.trattamentoIntegrativo) {
    pezzi.push(
      riga({
        voce: 'Trattamento integrativo (D.L. 3/2020)',
        nota: 'credito erogato in busta paga, non imponibile',
        importo: r.bonus.trattamentoIntegrativo,
        quota: su(r.bonus.trattamentoIntegrativo),
        classe: 'bonus',
        segno: '+',
      }),
    );
  }

  pezzi.push(
    riga({
      voce: 'Retribuzione netta annua',
      nota: `${eur(r.netto.mensile)} × ${r.input.mensilita} mensilità`,
      importo: r.netto.annuo,
      quota: su(r.netto.annuo),
      classe: 'totale',
    }),
  );

  $('#cascata').innerHTML = pezzi.join('');

  /* --- Avvisi contestuali sugli effetti soglia --- */
  $('#avvisi').innerHTML = avvisi(r).map((a) => `<div class="avviso">${a}</div>`).join('');

  /* --- Grafico --- */
  disegnaGrafico($('#grafico'), r.input.ral, {
    giorniLavorati: r.input.giorniLavorati,
    applicaMassimale: r.input.applicaMassimale,
  });

  $('#risultato').classList.remove('nascosto');
}

/**
 * Avvisi generati confrontando il caso corrente con quello immediatamente
 * sopra e sotto: è il modo onesto di mostrare gli effetti soglia invece di
 * lasciarli nascosti dentro le formule.
 */
function avvisi(r) {
  const messaggi = [];
  const ral = r.input.ral;
  const opz = { mensilita: r.input.mensilita, giorniLavorati: r.input.giorniLavorati, applicaMassimale: r.input.applicaMassimale };

  const piu1000 = calcolaNetto({ ...opz, ral: ral + 1000 });
  if (piu1000.netto.annuo < r.netto.annuo) {
    messaggi.push(
      `<strong>Effetto soglia.</strong> Con 1.000 € di RAL in più il netto <em>scende</em> di ` +
        `${eur(r.netto.annuo - piu1000.netto.annuo)}: si attraversa una soglia che fa perdere ` +
        `un’agevolazione per intero. Non è un errore del calcolo, è come è scritta la norma.`,
    );
  }

  const distanzaComunale = P.addizionaleComunale.sogliaEsenzione - r.imponibileFiscale;
  if (distanzaComunale > 0 && distanzaComunale < 1500) {
    messaggi.push(
      `L’imponibile è ${eur(distanzaComunale)} sotto la soglia di esenzione dell’addizionale ` +
        `comunale di ${P.addizionaleComunale.comune}: superandola l’addizionale si paga ` +
        `sull’intero imponibile, non solo sull’eccedenza.`,
    );
  }

  if (r.irpef.detrazioniNonGodute > 0) {
    messaggi.push(
      `<strong>Incapienza.</strong> ${eur(r.irpef.detrazioniNonGodute)} di detrazioni non trovano ` +
        `capienza nell’IRPEF lorda e vanno perdute: l’imposta non può scendere sotto zero.`,
    );
  }

  if (r.contributi.massimaleApplicato) {
    messaggi.push(
      `Contributi calcolati fino al massimale annuo di ${eurTondo(P.inps.massimaleAnnuo)} ` +
        `(ipotesi: iscritto INPS dopo il 31/12/1995). L’opzione è modificabile nei parametri avanzati.`,
    );
  }

  return messaggi;
}

/* ---------------------------------------------------------------- *
 * Avvio
 * ---------------------------------------------------------------- */

function leggiModulo() {
  return {
    ral: Number($('#ral').value),
    mensilita: Number($('#mensilita').value),
    giorniLavorati: Number($('#giorni').value),
    applicaMassimale: $('#massimale').checked,
  };
}

function esegui(evento) {
  evento?.preventDefault();
  const input = leggiModulo();

  if (!(input.ral > 0)) {
    $('#avvisi').innerHTML = '<div class="avviso errore">Inserisci una RAL maggiore di zero.</div>';
    $('#risultato').classList.add('nascosto');
    return;
  }
  if (input.giorniLavorati < 1 || input.giorniLavorati > 365) {
    $('#avvisi').innerHTML = '<div class="avviso errore">I giorni di lavoro devono essere tra 1 e 365.</div>';
    return;
  }

  mostraRisultato(calcolaNetto(input));
  // La RAL resta nell'URL: il risultato è condivisibile e riproducibile.
  const url = new URL(location.href);
  url.searchParams.set('ral', input.ral);
  url.searchParams.set('mensilita', input.mensilita);
  history.replaceState(null, '', url);
}

function inizializza() {
  const q = new URLSearchParams(location.search);
  if (q.get('ral')) $('#ral').value = q.get('ral');
  if (q.get('mensilita')) $('#mensilita').value = q.get('mensilita');

  $('#modulo').addEventListener('submit', esegui);
  document.querySelectorAll('[data-esempio]').forEach((b) =>
    b.addEventListener('click', () => {
      $('#ral').value = b.dataset.esempio;
      esegui();
    }),
  );

  $('#anno-parametri').textContent = P.anno;
  esegui();
}

document.addEventListener('DOMContentLoaded', inizializza);
