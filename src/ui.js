/**
 * ui.js — Unico modulo che tocca il DOM.
 *
 * Non contiene nessuna regola fiscale: legge il modulo, chiama il motore,
 * disegna il risultato. Le fonti e il perimetro escluso non sono scritti qui
 * ma GENERATI dai parametri, cosi' la pagina non puo' raccontare qualcosa di
 * diverso da quello che il motore calcola.
 */

import { calcolaNetto } from './motore.js';
import { PARAMETRI_DEFAULT as P, FONTI } from './parametri.js';
import { eur, eurTondo, pct, etichettaScaglione } from './formato.js';
import { disegnaGrafico } from './grafico.js';

const $ = (sel) => document.querySelector(sel);

/* ---------------------------------------------------------------- *
 * Righe della cascata
 * ---------------------------------------------------------------- */

/**
 * @param {number} [peso] frazione della RAL rappresentata dalla voce: disegna
 *   la barra proporzionale sotto la riga. Serve a far vedere il peso relativo
 *   delle voci senza costringere a confrontare cifre.
 */
function riga({ voce, nota, norma, importo, quota, classe = '', segno = '', peso }) {
  const testo = segno && importo !== 0 ? `${segno} ${eur(Math.abs(importo))}` : eur(importo);
  const barra =
    peso === undefined
      ? ''
      : `<div class="barra"><span style="width:${Math.min(100, Math.abs(peso) * 100).toFixed(2)}%"></span></div>`;

  return `
    <div class="riga ${classe}">
      <div class="voce">${voce}${nota ? `<small>${nota}</small>` : ''}${
        norma ? `<span class="norma">${norma}</span>` : ''
      }</div>
      <div class="importo">${testo}</div>
      <div class="quota">${quota ?? ''}</div>
      ${barra}
    </div>`;
}

function gruppo({ dettagli, ...resto }) {
  if (!dettagli.length) return riga(resto);
  return `
    <details class="gruppo">
      <summary>${riga(resto)}</summary>
      ${dettagli.map((d) => riga({ voce: d.voce, importo: d.importo, classe: 'dettaglio' })).join('')}
    </details>`;
}

/* ---------------------------------------------------------------- *
 * Rendering del risultato
 * ---------------------------------------------------------------- */

function mostraRisultato(r) {
  const su = (x) => (r.input.ral > 0 ? pct(x / r.input.ral) : '');
  const peso = (x) => (r.input.ral > 0 ? Math.abs(x) / r.input.ral : 0);

  /* --- Indicatori --- */
  $('#indicatori').innerHTML = `
    <div class="indicatore principale">
      <span class="occhiello">Netto annuo</span>
      <span class="valore">${eur(r.netto.annuo)}</span>
      <span class="nota">${pct(r.indici.incidenzaNetto)} della RAL</span>
    </div>
    <div class="indicatore">
      <span class="occhiello">Netto mensile</span>
      <span class="valore">${eur(r.netto.mensile)}</span>
      <span class="nota">su ${r.input.mensilita} mensilità</span>
    </div>
    <div class="indicatore onere">
      <span class="occhiello">Imposte</span>
      <span class="valore">${eur(r.totali.imposte)}</span>
      <span class="nota">IRPEF netta ${eurTondo(r.irpef.netta)} + addizionali ${eurTondo(
        r.addizionali.totale,
      )} · ${su(r.totali.imposte)} della RAL</span>
    </div>
    <div class="indicatore onere">
      <span class="occhiello">Contributi INPS</span>
      <span class="valore">${eur(r.totali.contributi)}</span>
      <span class="nota">non sono imposte: maturano la pensione. ${su(
        r.totali.contributi,
      )} della RAL</span>
    </div>`;

  /* --- Indici, accanto alla curva a cui si riferiscono --- */
  $('#indici').innerHTML = `
    <div><span class="occhiello">Aliquota marginale</span>
      <b>${pct(r.indici.aliquotaMarginale)}</b>
      <span>di 100 € di aumento lordo restano ${eur(100 * (1 - r.indici.aliquotaMarginale))}</span></div>
    <div><span class="occhiello">Netto sulla RAL</span>
      <b>${pct(r.indici.incidenzaNetto)}</b>
      <span>trattenute complessive ${eur(r.totali.trattenute)}</span></div>
    <div><span class="occhiello">Aliquota IRPEF effettiva</span>
      <b>${pct(r.indici.aliquotaIrpefEffettiva)}</b>
      <span>sull’imponibile, dopo le detrazioni</span></div>`;

  /* --- Cascata --- */
  const scaglioni = (dettaglio) =>
    dettaglio.map((d) => ({ voce: etichettaScaglione(d), importo: -d.imposta }));

  const f = r.irpef.familiari;
  const detrazioni = [
    { voce: 'Detrazione lavoro dipendente (art. 13 c. 1)', importo: r.irpef.detrazioneLavoro },
    r.irpef.maggiorazione65
      ? { voce: 'Maggiorazione art. 13 c. 1.1 (65 €)', importo: r.irpef.maggiorazione65 }
      : null,
    r.irpef.ulterioreDetrazione
      ? { voce: 'Ulteriore detrazione taglio cuneo', importo: r.irpef.ulterioreDetrazione }
      : null,
    f.coniuge ? { voce: 'Coniuge a carico (art. 12 c. 1 lett. a)', importo: f.coniuge } : null,
    f.figli
      ? {
          voce: `Figli a carico (art. 12 c. 1 lett. c) — ${r.input.figliACarico} × ${pct(
            r.input.quotaFigli,
          )}`,
          importo: f.figli,
        }
      : null,
    f.ascendenti
      ? { voce: 'Ascendenti conviventi (art. 12 c. 1 lett. d)', importo: f.ascendenti }
      : null,
  ].filter(Boolean);

  const pezzi = [];

  pezzi.push(
    riga({
      voce: 'Retribuzione annua lorda',
      nota: 'il costo del dipendente in busta paga, al lordo di tutto',
      importo: r.input.ral,
      quota: '100,00%',
      classe: 'parziale',
      peso: 1,
    }),
  );

  pezzi.push(
    gruppo({
      voce: 'Contributi INPS a carico dipendente',
      nota: `IVS ${pct(P.inps.aliquotaIvs)}${
        r.contributi.aggiuntivo ? ` + 1% oltre ${eurTondo(P.inps.primaFasciaPensionabile)}` : ''
      }`,
      norma: 'art. 3-ter D.L. 384/1992 · INPS circ. 6/2026',
      importo: -r.contributi.totale,
      quota: su(-r.contributi.totale),
      classe: 'trattenuta',
      segno: '−',
      peso: peso(r.contributi.totale),
      dettagli: [
        {
          voce: `IVS ${pct(P.inps.aliquotaIvs)} su ${eurTondo(r.contributi.baseImponibile)}`,
          importo: -r.contributi.ivs,
        },
        r.contributi.aggiuntivo
          ? {
              voce: `Aliquota aggiuntiva 1% sulla quota oltre ${eurTondo(P.inps.primaFasciaPensionabile)}`,
              importo: -r.contributi.aggiuntivo,
            }
          : null,
        r.contributi.massimaleApplicato
          ? { voce: `Massimale contributivo applicato (${eurTondo(P.inps.massimaleAnnuo)})`, importo: 0 }
          : null,
      ].filter(Boolean),
    }),
  );

  if (r.input.oneriDeducibili > 0) {
    pezzi.push(
      riga({
        voce: 'Oneri deducibili',
        nota: 'si sottraggono dal reddito, non dall’imposta: abbassano anche le soglie',
        norma: 'art. 10 TUIR',
        importo: -r.input.oneriDeducibili,
        quota: su(-r.input.oneriDeducibili),
        classe: 'trattenuta',
        segno: '−',
        peso: peso(r.input.oneriDeducibili),
      }),
    );
  }

  pezzi.push(
    riga({
      voce: 'Imponibile fiscale IRPEF',
      nota: 'RAL al netto dei contributi previdenziali, che non concorrono a formare reddito',
      norma: 'art. 51 c. 2 lett. a TUIR',
      importo: r.imponibileFiscale,
      quota: su(r.imponibileFiscale),
      classe: 'parziale',
      peso: peso(r.imponibileFiscale),
    }),
  );

  pezzi.push(
    gruppo({
      voce: 'IRPEF lorda',
      nota: 'scaglioni 23% / 33% / 43%',
      norma: 'art. 11 TUIR · L. 199/2025',
      importo: -r.irpef.lorda,
      quota: su(-r.irpef.lorda),
      classe: 'trattenuta',
      segno: '−',
      peso: peso(r.irpef.lorda),
      dettagli: scaglioni(r.irpef.scaglioni),
    }),
  );

  pezzi.push(
    gruppo({
      voce: 'Detrazioni d’imposta',
      nota: r.irpef.detrazioniNonGodute
        ? `di cui ${eur(r.irpef.detrazioniNonGodute)} non godute per incapienza`
        : 'abbattono l’IRPEF lorda',
      norma: 'art. 13 TUIR · L. 207/2024',
      importo: Math.min(r.irpef.detrazioniTotali, r.irpef.lorda),
      quota: su(Math.min(r.irpef.detrazioniTotali, r.irpef.lorda)),
      classe: 'bonus',
      segno: '+',
      peso: peso(Math.min(r.irpef.detrazioniTotali, r.irpef.lorda)),
      dettagli: detrazioni,
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
      peso: peso(r.irpef.netta),
    }),
  );

  pezzi.push(
    gruppo({
      voce: `Addizionale regionale ${P.addizionaleRegionale.regione}`,
      nota: r.addizionali.nonDovutePerImpostaZero
        ? 'non dovuta: l’IRPEF netta è zero'
        : 'aliquote per scaglioni sull’imponibile IRPEF',
      norma: 'art. 50 D.Lgs. 446/1997',
      importo: -r.addizionali.regionale,
      quota: su(-r.addizionali.regionale),
      classe: 'trattenuta',
      segno: r.addizionali.regionale ? '−' : '',
      peso: peso(r.addizionali.regionale),
      dettagli: scaglioni(r.addizionali.regionaleDettaglio),
    }),
  );

  pezzi.push(
    riga({
      voce: `Addizionale comunale ${P.addizionaleComunale.comune}`,
      nota: r.addizionali.nonDovutePerImpostaZero
        ? 'non dovuta: l’IRPEF netta è zero'
        : r.addizionali.comunaleEsente
          ? `esente: imponibile sotto la soglia di ${eurTondo(P.addizionaleComunale.sogliaEsenzione)}`
          : `${pct(P.addizionaleComunale.aliquota)} sull’intero imponibile`,
      norma: 'art. 1 D.Lgs. 360/1998',
      importo: -r.addizionali.comunale,
      quota: su(-r.addizionali.comunale),
      classe: 'trattenuta',
      segno: r.addizionali.comunale ? '−' : '',
      peso: peso(r.addizionali.comunale),
    }),
  );

  if (r.bonus.sommaEsente) {
    pezzi.push(
      riga({
        voce: 'Somma esente taglio cuneo',
        nota: `${pct(r.bonus.sommaEsentePercentuale)} del reddito di lavoro dipendente, non imponibile`,
        norma: 'L. 207/2024 art. 1 c. 4',
        importo: r.bonus.sommaEsente,
        quota: su(r.bonus.sommaEsente),
        classe: 'bonus',
        segno: '+',
        peso: peso(r.bonus.sommaEsente),
      }),
    );
  }

  if (r.bonus.trattamentoIntegrativo) {
    pezzi.push(
      riga({
        voce: 'Trattamento integrativo',
        nota: 'credito erogato in busta paga, non imponibile',
        norma: 'art. 1 D.L. 3/2020',
        importo: r.bonus.trattamentoIntegrativo,
        quota: su(r.bonus.trattamentoIntegrativo),
        classe: 'bonus',
        segno: '+',
        peso: peso(r.bonus.trattamentoIntegrativo),
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
  $('#avvisi').innerHTML = avvisi(r).map((a) => `<div class="avviso">${a}</div>`).join('');

  disegnaGrafico($('#grafico'), r.input.ral, {
    giorniLavorati: r.input.giorniLavorati,
    applicaMassimale: r.input.applicaMassimale,
    tipoContratto: r.input.tipoContratto,
    oneriDeducibili: r.input.oneriDeducibili,
    coniugeACarico: r.input.coniugeACarico,
    figliACarico: r.input.figliACarico,
    quotaFigli: r.input.quotaFigli,
    ascendentiConviventi: r.input.ascendentiConviventi,
  });

  $('#risultato').classList.remove('nascosto');
}

/**
 * Avvisi contestuali. Sono generati confrontando il caso corrente con quelli
 * vicini: e' il modo onesto di mostrare gli effetti soglia invece di lasciarli
 * nascosti dentro le formule.
 */
function avvisi(r) {
  const messaggi = [];
  const opz = {
    mensilita: r.input.mensilita,
    giorniLavorati: r.input.giorniLavorati,
    applicaMassimale: r.input.applicaMassimale,
    tipoContratto: r.input.tipoContratto,
    oneriDeducibili: r.input.oneriDeducibili,
    coniugeACarico: r.input.coniugeACarico,
    figliACarico: r.input.figliACarico,
    quotaFigli: r.input.quotaFigli,
    ascendentiConviventi: r.input.ascendentiConviventi,
  };

  const piu1000 = calcolaNetto({ ...opz, ral: r.input.ral + 1000 });
  if (piu1000.netto.annuo < r.netto.annuo) {
    messaggi.push(
      `<strong>Effetto soglia.</strong> Con 1.000 € di RAL in più il netto <em>scende</em> di ` +
        `${eur(r.netto.annuo - piu1000.netto.annuo)}: si attraversa una soglia che fa perdere ` +
        `un’agevolazione per intero. Non è un errore del calcolo, è come è scritta la norma.`,
    );
  }

  if (r.addizionali.nonDovutePerImpostaZero) {
    messaggi.push(
      `<strong>No tax area.</strong> Le detrazioni azzerano l’IRPEF, e senza IRPEF non sono ` +
        `dovute nemmeno le addizionali (art. 50 c. 2 D.Lgs. 446/1997 e art. 1 c. 4 D.Lgs. ` +
        `360/1998). Appena l’imposta diventa dovuta, le addizionali si pagano sull’intero imponibile.`,
    );
  }

  if (r.irpef.netta === 0 && r.bonus.trattamentoIntegrativo > 0) {
    messaggi.push(
      `<strong>Finestra del trattamento integrativo.</strong> L’IRPEF netta è zero, eppure i ` +
        `1.200 € spettano: la condizione di capienza guarda l’imposta <em>lorda</em> contro la ` +
        `detrazione diminuita di 75 €. Fra 8.173,91 e 8.500 € di reddito le due cose convivono.`,
    );
  }

  const distanza = P.addizionaleComunale.sogliaEsenzione - r.imponibileFiscale;
  if (distanza > 0 && distanza < 1500 && !r.addizionali.nonDovutePerImpostaZero) {
    messaggi.push(
      `L’imponibile è ${eur(distanza)} sotto la soglia di esenzione dell’addizionale comunale ` +
        `di ${P.addizionaleComunale.comune}: superandola l’addizionale si paga sull’intero ` +
        `imponibile, non solo sull’eccedenza.`,
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
        `(ipotesi: iscritto INPS dopo il 31/12/1995). Modificabile nei parametri avanzati.`,
    );
  }

  return messaggi;
}

/* ---------------------------------------------------------------- *
 * Fonti e perimetro: generati dai parametri, non scritti a mano
 * ---------------------------------------------------------------- */

const STATO_VERIFICA = {
  'atto-letto': { testo: 'atto letto', classe: 'ok' },
  'atto-corrispondente': { testo: 'letto su testo corrispondente', classe: 'quasi' },
  'prassi-letta': { testo: 'letto in circolare', classe: 'quasi' },
  'fonte-istituzionale': { testo: 'fonte dell’ente', classe: 'quasi' },
  'non-verificata': { testo: 'non verificata', classe: 'aperta' },
};

function mostraFonti() {
  $('#fonti').innerHTML = Object.values(FONTI)
    .map(
      (f) => `
      <article class="fonte">
        <h3>${f.etichetta}<span class="livello liv-${f.livello}">${
          f.livello === 1 ? 'norma primaria' : 'prassi e atti locali'
        }</span><span class="stato ${STATO_VERIFICA[f.statoVerifica].classe}">${
          STATO_VERIFICA[f.statoVerifica].testo
        }</span></h3>
        <p class="norma">${f.norma}</p>
        <p>${f.dettaglio}</p>
        ${f.prassi ? `<p class="prassi">${f.prassi}</p>` : ''}
        <p class="verifica">Verifica: ${f.verifica}</p>
        ${f.lacuna ? `<p class="lacuna">Cosa manca: ${f.lacuna}</p>` : ''}
        ${f.url ? `<a href="${f.url}" rel="noopener" target="_blank">Fonte →</a>` : ''}
      </article>`,
    )
    .join('');

  $('#perimetro').innerHTML = P.fuoriPerimetro
    .map(
      (v) => `
      <li>
        <div class="voce">${v.voce}</div>
        <div class="norma">${v.norma}</div>
        <p class="motivo">${v.motivo}</p>
      </li>`,
    )
    .join('');
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
    tipoContratto: $('#contratto').value,
    coniugeACarico: $('#coniuge').checked,
    figliACarico: Number($('#figli').value),
    quotaFigli: Number($('#quota-figli').value),
    ascendentiConviventi: Number($('#ascendenti').value),
    oneriDeducibili: Number($('#oneri').value),
  };
}

/**
 * L'URL descrive l'INTERO caso, non solo la RAL: un link che tace meta'
 * degli input riprodurrebbe in silenzio un caso diverso da quello condiviso
 * — lo stesso difetto contestato al campo inerte di metodologia §3.4.1.
 * I valori uguali al predefinito non compaiono, cosi' l'URL resta corto;
 * la RAL compare sempre, perche' e' il cuore del caso condiviso.
 */
const CAMPI_URL = [
  // [parametro, selettore, sempreNellUrl]
  ['ral', '#ral', true],
  ['mensilita', '#mensilita'],
  ['giorni', '#giorni'],
  ['contratto', '#contratto'],
  ['massimale', '#massimale'],
  ['coniuge', '#coniuge'],
  ['figli', '#figli'],
  ['quota', '#quota-figli'],
  ['ascendenti', '#ascendenti'],
  ['oneri', '#oneri'],
];

const valoreCampo = (el) => (el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value);

// Il predefinito di ogni campo si legge dal DOM (defaultValue, defaultChecked,
// defaultSelected), non da una tabella parallela: due elenchi degli stessi
// valori divergerebbero in silenzio al primo ritocco dell'HTML.
const predefinitoCampo = (el) => {
  if (el.type === 'checkbox') return el.defaultChecked ? '1' : '0';
  if (el.tagName === 'SELECT') {
    const scelta = [...el.options].find((o) => o.defaultSelected) ?? el.options[0];
    return scelta ? scelta.value : '';
  }
  return el.defaultValue;
};

function esegui(evento) {
  evento?.preventDefault();
  const input = leggiModulo();

  if (!(input.ral > 0)) {
    $('#avvisi').innerHTML = '<div class="avviso errore">Inserisci una RAL maggiore di zero.</div>';
    $('#risultato').classList.add('nascosto');
    return;
  }
  if (!(input.giorniLavorati >= 1 && input.giorniLavorati <= 365)) {
    $('#avvisi').innerHTML =
      '<div class="avviso errore">I giorni di lavoro devono essere un numero tra 1 e 365.</div>';
    $('#risultato').classList.add('nascosto');
    return;
  }

  mostraRisultato(calcolaNetto(input));

  // Il risultato resta nell'URL: e' condivisibile e riproducibile.
  try {
    const url = new URL(location.href);
    for (const [nome, selettore, sempre] of CAMPI_URL) {
      const el = $(selettore);
      const valore = valoreCampo(el);
      if (!sempre && valore === predefinitoCampo(el)) url.searchParams.delete(nome);
      else url.searchParams.set(nome, valore);
    }
    history.replaceState(null, '', url);
  } catch {
    /* contesti sandboxed: l'URL non e' aggiornabile, il calcolo resta valido */
  }
}

function inizializza() {
  const q = new URLSearchParams(location.search);
  for (const [nome, selettore] of CAMPI_URL) {
    const valore = q.get(nome);
    if (valore === null) continue;
    const el = $(selettore);
    if (el.type === 'checkbox') {
      el.checked = valore === '1';
      continue;
    }
    el.value = valore;
    // Un parametro fuori dalle opzioni o dai limiti del campo non deve
    // diventare in silenzio un caso diverso da quello condiviso: un select
    // che non riconosce il valore si svuota (?quota=0.7 azzererebbe la
    // detrazione figli), e un numero fuori range salterebbe la validazione
    // nativa, che qui non viene mai eseguita. In entrambi i casi si torna
    // al predefinito del campo.
    if (el.value !== valore || (el.checkValidity && !el.checkValidity())) {
      el.value = predefinitoCampo(el);
    }
  }

  $('#modulo').addEventListener('submit', esegui);
  document.querySelectorAll('[data-esempio]').forEach((b) =>
    b.addEventListener('click', () => {
      $('#ral').value = b.dataset.esempio;
      esegui();
    }),
  );
  // Dopo il primo calcolo la pagina resta viva: cambiare un parametro
  // aggiorna subito, senza dover ripremere "Calcola". Anche un avviso di
  // errore conta come pagina viva: correggere il campo deve bastare a
  // ricalcolare, altrimenti l'errore resterebbe accanto a un valore ormai
  // valido.
  $('#modulo').addEventListener('change', () => {
    if (!$('#risultato').classList.contains('nascosto') || $('#avvisi').textContent.trim()) {
      esegui();
    }
  });

  $('#anno-parametri').textContent = P.anno;
  mostraFonti();
  esegui();
}

document.addEventListener('DOMContentLoaded', inizializza);
