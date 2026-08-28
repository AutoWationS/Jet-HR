/**
 * grafico.js — Curva netto/RAL e aliquota marginale, in SVG generato a mano.
 *
 * Serve a rendere visibili gli effetti soglia: sulla curva del netto sono
 * scalini piccoli, sull'aliquota marginale sono picchi verticali evidenti.
 */

import { calcolaNetto, curvaNetto } from './motore.js';
import { eurTondo } from './formato.js';

const L = 56, R = 46, T = 16, B = 34; // margini
const W = 720, H = 300;

const scala = (v, [d0, d1], [r0, r1]) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);

export function disegnaGrafico(contenitore, ralCorrente, opzioni = {}) {
  const max = Math.max(80000, Math.ceil((ralCorrente * 1.6) / 10000) * 10000);
  const punti = curvaNetto(1000, max, Math.max(100, Math.round(max / 400)), undefined, opzioni);

  const dominioX = [0, max];
  // Il netto puo' scendere sotto zero (oneri deducibili oltre la RAL): il
  // dominio deve includere il minimo, altrimenti la scala si ribalta e la
  // curva negativa comparirebbe in alto, come un netto positivo. Il tetto ha
  // un pavimento a 1 per lo stesso caso: con tutta la curva sotto zero il
  // massimo resterebbe negativo.
  const netti = punti.map((p) => p.netto);
  const dominioY = [Math.min(0, ...netti), Math.max(1, Math.max(...netti) * 1.05)];
  // L'aliquota marginale esplode sui punti di soglia (perdere 1.200 euro di
  // trattamento integrativo per 100 euro di aumento vale -1.200%): l'asse e'
  // limitato e i valori fuori scala vengono tagliati dal clipPath, cosi' il
  // picco resta visibile senza schiacciare tutto il resto del grafico.
  const dominioM = [-0.2, 0.8];
  const limita = (v) => Math.min(dominioM[1], Math.max(dominioM[0], v));

  const x = (v) => scala(v, dominioX, [L, W - R]);
  const y = (v) => scala(v, dominioY, [H - B, T]);
  const ym = (v) => scala(v, dominioM, [H - B, T]);

  const linea = (dati, fy, chiave = 'netto') =>
    dati.map((p, i) => `${i ? 'L' : 'M'}${x(p.ral).toFixed(1)},${fy(p[chiave]).toFixed(1)}`).join('');

  // Griglia e assi. I passi raddoppiano finche' le etichette non stanno:
  // sui casi tipici (fino a RAL ~200.000) i valori restano quelli della
  // scaletta, ma un asse esteso — RAL 1.000.000 vale un asse da 1,6 milioni —
  // non deve produrre quaranta etichette sovrapposte e illeggibili.
  let passoX = max > 120000 ? 40000 : max > 60000 ? 20000 : 10000;
  while (max / passoX > 10) passoX *= 2;
  const tacche = [];
  for (let v = 0; v <= max; v += passoX) {
    tacche.push(`<line x1="${x(v)}" y1="${T}" x2="${x(v)}" y2="${H - B}" class="griglia"/>
      <text x="${x(v)}" y="${H - B + 16}" text-anchor="middle" font-size="10" class="tacca">${
        v === 0 ? '0' : `${v / 1000}k`
      }</text>`);
  }
  let passoY = dominioY[1] > 80000 ? 25000 : 20000;
  while (dominioY[1] / passoY > 8) passoY *= 2;
  for (let v = 0; v <= dominioY[1]; v += passoY) {
    tacche.push(`<line x1="${L}" y1="${y(v)}" x2="${W - R}" y2="${y(v)}" class="griglia"/>
      <text x="${L - 8}" y="${y(v) + 3}" text-anchor="end" font-size="10" class="tacca">${
        v === 0 ? '0' : `${v / 1000}k`
      }</text>`);
  }
  for (const m of [0, 0.2, 0.4, 0.6, 0.8]) {
    tacche.push(`<text x="${W - R + 8}" y="${ym(m) + 3}" font-size="10" class="tacca-marginale">${Math.round(
      m * 100,
    )}%</text>`);
  }

  // Punto corrente: calcolato esatto sul caso corrente, NON agganciato al
  // campione piu' vicino della curva. L'etichetta sul grafico deve dire lo
  // stesso numero dell'indicatore "Netto annuo" in testa alla pagina: con
  // l'aggancio divergeva fino a mezzo passo di campionamento (~40 euro gia'
  // a RAL 42.500, che non cade sulla griglia dei campioni).
  const corrente = { ral: ralCorrente, netto: calcolaNetto({ ...opzioni, ral: ralCorrente }).netto.annuo };

  contenitore.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" role="img"
         aria-label="Curva del netto annuo e dell'aliquota marginale al variare della RAL">
      <defs>
        <clipPath id="area-grafico">
          <rect x="${L}" y="${T}" width="${W - R - L}" height="${H - B - T}"/>
        </clipPath>
      </defs>
      ${tacche.join('')}
      <g clip-path="url(#area-grafico)">
        <path d="${linea(
          punti.map((p) => ({ ...p, marginale: limita(p.marginale) })),
          ym,
          'marginale',
        )}" fill="none" class="linea-marginale" stroke-width="1.2" stroke-opacity="0.8"/>
        <path d="${linea(punti, y)}" fill="none" class="linea-netto" stroke-width="2.2"/>
      </g>
      <line x1="${x(corrente.ral)}" y1="${T}" x2="${x(corrente.ral)}" y2="${H - B}"
            class="guida" stroke-dasharray="3 3"/>
      <circle cx="${x(corrente.ral)}" cy="${y(corrente.netto)}" r="5" class="punto" stroke-width="2"/>
      <text x="${x(corrente.ral) + (corrente.ral > max * 0.7 ? -10 : 10)}" y="${y(corrente.netto) - 12}"
            text-anchor="${corrente.ral > max * 0.7 ? 'end' : 'start'}"
            font-size="11" font-weight="700" class="punto-etichetta"
            stroke-width="3" paint-order="stroke">${eurTondo(corrente.netto)}</text>
      <line x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}" class="asse"/>
    </svg>`;
}
