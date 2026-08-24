/**
 * grafico.js — Curva netto/RAL e aliquota marginale, in SVG generato a mano.
 *
 * Serve a rendere visibili gli effetti soglia: sulla curva del netto sono
 * scalini piccoli, sull'aliquota marginale sono picchi verticali evidenti.
 */

import { curvaNetto } from './motore.js';
import { eurTondo } from './formato.js';

const L = 56, R = 46, T = 16, B = 34; // margini
const W = 720, H = 300;

const scala = (v, [d0, d1], [r0, r1]) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);

export function disegnaGrafico(contenitore, ralCorrente, opzioni = {}) {
  const max = Math.max(80000, Math.ceil((ralCorrente * 1.6) / 10000) * 10000);
  const punti = curvaNetto(1000, max, Math.max(100, Math.round(max / 400)), undefined, opzioni);

  const dominioX = [0, max];
  const dominioY = [0, Math.max(...punti.map((p) => p.netto)) * 1.05];
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

  // Griglia e assi
  const passoX = max > 120000 ? 40000 : max > 60000 ? 20000 : 10000;
  const tacche = [];
  for (let v = 0; v <= max; v += passoX) {
    tacche.push(`<line x1="${x(v)}" y1="${T}" x2="${x(v)}" y2="${H - B}" stroke="#eef2f6"/>
      <text x="${x(v)}" y="${H - B + 16}" text-anchor="middle" font-size="10" fill="#5c6b7a">${
        v === 0 ? '0' : `${v / 1000}k`
      }</text>`);
  }
  const passoY = dominioY[1] > 80000 ? 25000 : 20000;
  for (let v = 0; v <= dominioY[1]; v += passoY) {
    tacche.push(`<line x1="${L}" y1="${y(v)}" x2="${W - R}" y2="${y(v)}" stroke="#eef2f6"/>
      <text x="${L - 8}" y="${y(v) + 3}" text-anchor="end" font-size="10" fill="#5c6b7a">${
        v === 0 ? '0' : `${v / 1000}k`
      }</text>`);
  }
  for (const m of [0, 0.2, 0.4, 0.6, 0.8]) {
    tacche.push(`<text x="${W - R + 8}" y="${ym(m) + 3}" font-size="10" fill="#b4342a">${Math.round(
      m * 100,
    )}%</text>`);
  }

  // Punto corrente
  const corrente = punti.reduce((a, p) => (Math.abs(p.ral - ralCorrente) < Math.abs(a.ral - ralCorrente) ? p : a));

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
        )}" fill="none" stroke="#b4342a" stroke-width="1.2" stroke-opacity="0.75"/>
        <path d="${linea(punti, y)}" fill="none" stroke="#1f6feb" stroke-width="2.2"/>
      </g>
      <line x1="${x(corrente.ral)}" y1="${T}" x2="${x(corrente.ral)}" y2="${H - B}"
            stroke="#123a63" stroke-dasharray="3 3"/>
      <circle cx="${x(corrente.ral)}" cy="${y(corrente.netto)}" r="5" fill="#1f6feb"
              stroke="#fff" stroke-width="2"/>
      <text x="${x(corrente.ral) + (corrente.ral > max * 0.7 ? -10 : 10)}" y="${y(corrente.netto) - 12}"
            text-anchor="${corrente.ral > max * 0.7 ? 'end' : 'start'}"
            font-size="11" font-weight="700" fill="#123a63"
            stroke="#fff" stroke-width="3" paint-order="stroke">${eurTondo(corrente.netto)}</text>
      <line x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}" stroke="#dde4ec"/>
    </svg>`;
}
