/**
 * bundle.mjs — Impacchetta il prototipo in un unico file HTML autoportante.
 *
 * Perche' esiste: la versione di sviluppo usa moduli ES separati (motore, UI,
 * parametri, formato, grafico) e va servita da un server statico. Per poter
 * mandare un link o un file singolo serve una versione con tutto dentro.
 *
 * Il bundle NON e' una seconda implementazione: e' generato dagli stessi
 * sorgenti, quindi non puo' divergere. Si rigenera con:
 *
 *     node scripts/bundle.mjs
 *
 * Produce due file in dist/:
 *   - calcolatore.html  pagina completa, apribile anche con doppio clic (file://)
 *   - artifact.html     solo il contenuto del body, per host che iniettano da se'
 *                       doctype/html/head/body
 *
 * `costruisci()` e' esportata cosi' che un test possa verificare che i file in
 * dist/ siano allineati ai sorgenti: se qualcuno modifica il motore e dimentica
 * di rigenerare il bundle, la suite fallisce.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const radice = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const leggi = (p) => readFileSync(resolve(radice, p), 'utf8');

/* --- Moduli, in ordine di dipendenza ------------------------------------ */
const MODULI = [
  'src/parametri.js',
  'src/formato.js',
  'src/motore.js',
  'src/grafico.js',
  'src/ui.js',
];

/**
 * Converte un modulo ES in codice concatenabile:
 *  - elimina gli `import` (tutto finisce nello stesso scope)
 *  - riscrive gli alias `X as Y` in `const Y = X`
 *  - toglie la parola chiave `export`
 */
function appiattisci(codice, nome) {
  const alias = [];

  const senzaImport = codice.replace(/^import\s+([^;]+?)\s+from\s+['"][^'"]+['"];\s*$/gm, (_, spec) => {
    const graffe = spec.match(/\{([^}]*)\}/);
    if (graffe) {
      for (const voce of graffe[1].split(',')) {
        const [origine, destinazione] = voce.split(/\s+as\s+/).map((s) => s.trim());
        if (destinazione) alias.push(`const ${destinazione} = ${origine};`);
      }
    }
    return '';
  });

  if (/^\s*(import|export)\s/m.test(senzaImport.replace(/^export\s+(?=const|function|class|let|var)/gm, ''))) {
    throw new Error(`${nome}: import/export non gestito dal bundler`);
  }

  const senzaExport = senzaImport.replace(/^export\s+(?=const|function|class|let|var)/gm, '');

  return `\n/* ===== ${nome} ===== */\n${alias.join('\n')}\n${senzaExport.trim()}\n`;
}

export function costruisci() {
  const js = MODULI.map((m) => appiattisci(leggi(m), m)).join('\n');
  const css = leggi('assets/stile.css');

  /* --- Corpo della pagina, preso da index.html -------------------------- */
  const html = leggi('index.html');

  const titolo = html.match(/<title>([^<]*)<\/title>/)[1];
  const descrizione = html.match(/<meta name="description" content="([^"]*)"/)[1];

  let corpo = html.match(/<body>([\s\S]*)<\/body>/)[1];
  // Via i tag <script>: nel bundle il codice e' inline.
  corpo = corpo.replace(/<script[\s\S]*?<\/script>/g, '');
  // Via l'avviso su file://: qui i moduli sono inline, quindi non si applica.
  corpo = corpo.replace(/<div id="avviso-file"[\s\S]*?<\/div>\s*/, '');

  const contenuto = `<title>${titolo}</title>
  <meta name="description" content="${descrizione}">
  <style>
  ${css}
  </style>
  ${corpo.trim()}
  <script type="module">
  ${js}
  </script>`;

  const pagina = `<!doctype html>
  <html lang="it">
  <head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${titolo}</title>
  <meta name="description" content="${descrizione}">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>&#129534;</text></svg>">
  <style>
  ${css}
  </style>
  </head>
  <body>
  ${corpo.trim()}
  <script type="module">
  ${js}
  </script>
  </body>
  </html>
  `;

  return { pagina, contenuto };
}

const kb = (testo) => `${(Buffer.byteLength(testo) / 1024).toFixed(1)} kB`;

/* --- Esecuzione da riga di comando -------------------------------------- */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { pagina, contenuto } = costruisci();
  mkdirSync(resolve(radice, 'dist'), { recursive: true });
  writeFileSync(resolve(radice, 'dist/calcolatore.html'), pagina);
  writeFileSync(resolve(radice, 'dist/artifact.html'), `${contenuto}\n`);

  console.log(`dist/calcolatore.html  ${kb(pagina)}   (pagina completa, apribile con doppio clic)`);
  console.log(`dist/artifact.html     ${kb(contenuto)}   (solo corpo, per host che iniettano la testa)`);
}
