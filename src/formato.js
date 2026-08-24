/** Formattazione: unico posto in cui i numeri diventano stringhe. */

const valuta = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const valutaCompatta = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const percentuale = new Intl.NumberFormat('it-IT', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const eur = (x) => valuta.format(x || 0);
export const eurTondo = (x) => valutaCompatta.format(x || 0);
export const pct = (x) => percentuale.format(x || 0);

/** Etichetta di uno scaglione, es. "da 28.000 a 50.000 · 33%". */
export function etichettaScaglione(d) {
  const a = d.a === Infinity ? 'oltre' : `a ${eurTondo(d.a)}`;
  return `da ${eurTondo(d.da)} ${a} · ${pct(d.aliquota)}`;
}
