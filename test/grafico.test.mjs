/**
 * Test del grafico. `disegnaGrafico` tocca il DOM solo attraverso
 * `contenitore.innerHTML`, quindi un oggetto qualunque basta a catturare
 * l'SVG generato e a verificarlo come stringa: niente browser, niente DOM.
 *
 * Il test centrale e' il primo: i picchi dell'aliquota marginale alle soglie
 * dichiarate DEVONO stare nel disegno. E' la correzione di un difetto reale:
 * la marginale era calcolata su una finestra fissa di 100 euro mentre la
 * curva campiona ogni 200, quindi una soglia che cadeva nella meta' non
 * coperta del passo non lasciava alcun picco — quattro soglie su cinque
 * erano invisibili, nel grafico che esiste per renderle visibili.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { disegnaGrafico } from '../src/grafico.js';
import { calcolaNetto } from '../src/motore.js';
import { eurTondo } from '../src/formato.js';

const vicino = (a, b, tolleranza = 0.01) =>
  assert.ok(Math.abs(a - b) <= tolleranza, `atteso ${b}, ottenuto ${a} (delta ${Math.abs(a - b)})`);

function svgDi(ralCorrente, opzioni = {}) {
  const contenitore = { innerHTML: '' };
  disegnaGrafico(contenitore, ralCorrente, opzioni);
  return contenitore.innerHTML;
}

/** L'area utile del grafico, letta dal rettangolo del clipPath: cosi' il test
 *  si calibra da solo invece di duplicare i margini del modulo. */
function areaDi(svg) {
  const r = svg.match(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/);
  assert.ok(r, 'clipPath non trovato');
  const [, x, y, larghezza, altezza] = r.map(Number);
  return { x, y, larghezza, altezza };
}

/** Vertici {x, y} di un path, dal suo attributo d="Mx,yLx,y...". */
function verticiDi(svg, classe) {
  const path = svg.match(new RegExp(`<path d="([^"]+)"[^>]*class="${classe}"`));
  assert.ok(path, `path ${classe} non trovato`);
  return path[1]
    .split(/[ML]/)
    .filter(Boolean)
    .map((coppia) => {
      const [x, y] = coppia.split(',').map(Number);
      return { x, y };
    });
}

test('i picchi delle soglie dichiarate stanno nel disegno, non tra due campioni', () => {
  // Caso predefinito della pagina: RAL 35.000, asse fino a 80.000, passo 200.
  const max = 80000;
  const svg = svgDi(35000);
  const area = areaDi(svg);
  const ralDi = (x) => ((x - area.x) / area.larghezza) * max;
  const vertici = verticiDi(svg, 'linea-marginale');

  // La marginale e' disegnata tagliata sull'asse [-20%, +80%]: un picco
  // "visibile" e' un vertice schiacciato sul bordo. In alto le quattro perdite
  // secche (il salto supera di molto l'80%), in basso il +1.200 della capienza.
  const bordoAlto = (v) => Math.abs(v.y - area.y) < 0.11;
  const bordoBasso = (v) => Math.abs(v.y - (area.y + area.altezza)) < 0.11;

  const perdite = [9360.2, 16518, 25327.61, 38542.01];
  for (const soglia of perdite) {
    assert.ok(
      vertici.some((v) => bordoAlto(v) && Math.abs(ralDi(v.x) - soglia) <= 401),
      `nessun picco della marginale vicino alla soglia RAL ${soglia}`,
    );
  }
  assert.ok(
    vertici.some((v) => bordoBasso(v) && Math.abs(ralDi(v.x) - 9001.14) <= 401),
    'nessun picco verso il basso alla capienza del trattamento integrativo (RAL 9.001,14)',
  );
});

test('l etichetta del punto corrente dice il netto esatto, anche fuori griglia', () => {
  // 42.500 non cade sulla griglia dei campioni (passo 200 da 1.000): con
  // l'aggancio al campione piu' vicino l'etichetta mostrava il netto di
  // 42.400, circa 40 euro sotto l'indicatore "Netto annuo" della pagina.
  const svg = svgDi(42500);
  const esatto = calcolaNetto({ ral: 42500 }).netto.annuo;
  assert.ok(svg.includes(`>${eurTondo(esatto)}</text>`), 'etichetta diversa dal netto esatto');

  // E il marcatore sta sulla RAL corrente, non sul campione.
  const area = areaDi(svg);
  const attesoX = area.x + (42500 / 80000) * area.larghezza;
  const cerchio = svg.match(/<circle cx="([\d.]+)"/);
  vicino(Number(cerchio[1]), attesoX, 0.05);
});

test('nessuna coordinata invalida, e tutto dentro il riquadro', () => {
  const casi = [
    [1500, {}],
    [35000, {}],
    [200000, {}],
    [35000, { giorniLavorati: 180, tipoContratto: 'determinato', coniugeACarico: true, figliACarico: 2 }],
    [35000, { oneriDeducibili: 2000, applicaMassimale: false }],
  ];
  for (const [ral, opzioni] of casi) {
    const svg = svgDi(ral, opzioni);
    assert.ok(!svg.includes('NaN') && !svg.includes('Infinity'), `coordinate invalide per RAL ${ral}`);
    for (const classe of ['linea-netto', 'linea-marginale']) {
      for (const v of verticiDi(svg, classe)) {
        assert.ok(v.x >= 0 && v.x <= 720 && v.y >= 0 && v.y <= 300, `${classe} fuori dal riquadro per RAL ${ral}`);
      }
    }
  }
});

test('con oneri oltre la RAL la curva sta sotto lo zero, non finge un netto positivo', () => {
  // Netto negativo su tutta la curva: prima il dominio Y partiva comunque da
  // zero e finiva sotto, cosi' la scala si ribaltava e la curva negativa
  // compariva in ALTO, come un netto altissimo e senza piu' tacche sull'asse.
  const svg = svgDi(35000, { oneriDeducibili: 200000 });
  assert.ok(calcolaNetto({ ral: 35000, oneriDeducibili: 200000 }).netto.annuo < 0, 'il caso non e piu negativo');

  // La tacca dello zero esiste, e l'intera curva del netto sta sotto di lei.
  const tacca = svg.match(/<text x="[\d.]+" y="([\d.]+)" text-anchor="end"[^>]*>0</);
  assert.ok(tacca, 'manca la tacca dello zero sull asse del netto');
  const yZero = Number(tacca[1]) - 3; // l'etichetta e' scritta 3px sotto la linea
  for (const v of verticiDi(svg, 'linea-netto')) {
    assert.ok(v.y >= yZero - 0.11, `curva sopra lo zero (y ${v.y} < ${yZero})`);
  }
});

test('con una RAL estrema le tacche restano leggibili', () => {
  // RAL 1.000.000: asse X fino a 1,6 milioni. Con la scaletta fissa dei passi
  // uscivano 41 etichette sovrapposte sull'asse X e 37 su quello Y.
  const svg = svgDi(1000000);
  const taccheX = [...svg.matchAll(/text-anchor="middle"[^>]*class="tacca"/g)];
  const taccheY = [...svg.matchAll(/text-anchor="end"[^>]*class="tacca"/g)];
  assert.ok(taccheX.length > 2 && taccheX.length <= 12, `${taccheX.length} etichette sull asse X`);
  assert.ok(taccheY.length > 2 && taccheY.length <= 12, `${taccheY.length} etichette sull asse Y`);
});
