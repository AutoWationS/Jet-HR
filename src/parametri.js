/**
 * parametri.js — Tutti i parametri normativi in un unico posto, anno per anno.
 *
 * Regola di progetto: nel motore di calcolo non compare NESSUN numero magico.
 * Ogni soglia, aliquota e importo vive qui, con la fonte normativa accanto.
 * Cambiare anno d'imposta = aggiungere un oggetto qui sotto, non toccare il motore.
 *
 * Valuta: euro. Aliquote: frazioni decimali (0.23 = 23%).
 */

export const PARAMETRI_2026 = {
  anno: 2026,

  /* ------------------------------------------------------------------ *
   * 1. CONTRIBUTI PREVIDENZIALI A CARICO DEL DIPENDENTE (INPS)
   *    Fonte: INPS circolare n. 6 del 30/01/2026 (minimali e massimali).
   *    Aliquota IVS 9,19% = quota a carico lavoratore, settore privato
   *    non agricolo, qualifica impiegato (FPLD).
   * ------------------------------------------------------------------ */
  inps: {
    aliquotaIvs: 0.0919,
    // Art. 3-ter D.L. 384/1992: +1% sulla quota eccedente la prima fascia
    // di retribuzione pensionabile.
    aliquotaAggiuntiva: 0.01,
    primaFasciaPensionabile: 56224,
    // Massimale annuo per gli iscritti privi di anzianita' al 31/12/1995
    // (art. 2 c.18 L. 335/1995).
    massimaleAnnuo: 122295,
  },

  /* ------------------------------------------------------------------ *
   * 2. IRPEF — scaglioni e aliquote
   *    Fonte: art. 11 TUIR come modificato dalla L. 199/2025 (Legge di
   *    bilancio 2026): la seconda aliquota scende dal 35% al 33%.
   * ------------------------------------------------------------------ */
  irpef: {
    scaglioni: [
      { fino: 28000, aliquota: 0.23 },
      { fino: 50000, aliquota: 0.33 },
      { fino: Infinity, aliquota: 0.43 },
    ],
  },

  /* ------------------------------------------------------------------ *
   * 3. DETRAZIONE PER REDDITI DI LAVORO DIPENDENTE — art. 13 c.1 TUIR
   *    Funzione decrescente del reddito complessivo, rapportata ai giorni
   *    di lavoro nell'anno. Formule per fascia (importo = a + b*(soglia-R)/c).
   * ------------------------------------------------------------------ */
  detrazioneLavoroDipendente: {
    fasce: [
      // R <= 15.000 -> importo fisso
      { fino: 15000, base: 1955, quotaVariabile: 0, riferimento: 0, ampiezza: 1 },
      // 15.000 < R <= 28.000 -> 1.910 + 1.190 * (28.000 - R) / 13.000
      { fino: 28000, base: 1910, quotaVariabile: 1190, riferimento: 28000, ampiezza: 13000 },
      // 28.000 < R <= 50.000 -> 1.910 * (50.000 - R) / 22.000
      { fino: 50000, base: 0, quotaVariabile: 1910, riferimento: 50000, ampiezza: 22000 },
      // oltre 50.000 -> nessuna detrazione
      { fino: Infinity, base: 0, quotaVariabile: 0, riferimento: 0, ampiezza: 1 },
    ],
    // Importo minimo garantito per i rapporti a tempo indeterminato
    // (art. 13 c.1 lett. a, secondo periodo).
    minimoTempoIndeterminato: 690,
    // Maggiorazione art. 13 c. 1.1 TUIR (introdotto dalla L. 234/2021): +65 euro,
    // NON rapportata al periodo di lavoro. Attenzione a non citarlo come c. 1-bis:
    // quel comma era il credito "bonus Renzi", abrogato dal D.L. 3/2020.
    maggiorazione: { importo: 65, da: 25000, a: 35000 },
    giorniAnno: 365,
  },

  /* ------------------------------------------------------------------ *
   * 4. TAGLIO DEL CUNEO FISCALE — L. 207/2024 art. 1 cc. 4-9,
   *    reso strutturale dalla L. 199/2025.
   *    Due misure alternative fra loro in base al reddito complessivo:
   *    a) somma esente (bonus) fino a 20.000
   *    b) ulteriore detrazione d'imposta da 20.000 a 40.000
   * ------------------------------------------------------------------ */
  cuneoFiscale: {
    // (a) Percentuale applicata al REDDITO DI LAVORO DIPENDENTE; spetta solo
    //     se il reddito complessivo non supera 20.000. La percentuale e' unica
    //     e si determina in base alla fascia in cui cade il reddito (non
    //     e' un calcolo per scaglioni).
    sommaEsente: {
      limiteRedditoComplessivo: 20000,
      fasce: [
        { fino: 8500, percentuale: 0.071 },
        { fino: 15000, percentuale: 0.053 },
        { fino: Infinity, percentuale: 0.048 },
      ],
    },
    // (b) Detrazione fissa di 1.000 euro tra 20.000 e 32.000, poi decalage
    //     lineare fino ad azzerarsi a 40.000.
    ulterioreDetrazione: {
      importo: 1000,
      da: 20000,
      pienoFino: 32000,
      azzeramento: 40000,
    },
  },

  /* ------------------------------------------------------------------ *
   * 5. TRATTAMENTO INTEGRATIVO ("ex bonus Renzi") — art. 1 D.L. 3/2020
   *    convertito in L. 21/2020, come modificato dalla L. 234/2021.
   * ------------------------------------------------------------------ */
  trattamentoIntegrativo: {
    importo: 1200,
    // Fino a 15.000: spetta per intero se IRPEF lorda > detrazione art.13 - 75.
    sogliaPiena: 15000,
    scartoCapienza: 75,
    // Da 15.000 a 28.000: spetta per la differenza tra le detrazioni spettanti
    // e l'IRPEF lorda, nel limite di 1.200 euro.
    sogliaMassima: 28000,
  },

  /* ------------------------------------------------------------------ *
   * 6. ADDIZIONALE REGIONALE IRPEF — Regione Lombardia
   *    Aliquote per scaglioni (L.R. Lombardia, aliquote confermate 2026).
   * ------------------------------------------------------------------ */
  addizionaleRegionale: {
    regione: 'Lombardia',
    scaglioni: [
      { fino: 15000, aliquota: 0.0123 },
      { fino: 28000, aliquota: 0.0158 },
      { fino: 50000, aliquota: 0.0172 },
      { fino: Infinity, aliquota: 0.0173 },
    ],
  },

  /* ------------------------------------------------------------------ *
   * 7. ADDIZIONALE COMUNALE IRPEF — Comune di Milano
   *    Aliquota unica 0,80%. Soglia di esenzione (NON franchigia): sotto
   *    soglia non e' dovuta nulla, sopra soglia si paga sull'intero imponibile.
   * ------------------------------------------------------------------ */
  addizionaleComunale: {
    comune: 'Milano',
    aliquota: 0.008,
    sogliaEsenzione: 23000,
  },

  /* ------------------------------------------------------------------ *
   * 8. VOCI NON MODELLATE (dichiarate esplicitamente)
   *    - Riduzione di 260 euro delle detrazioni per oneri se reddito > 50.000
   *      (L. 207/2024 art. 1 c. 10) e ulteriore riduzione di 440 euro se
   *      reddito > 200.000 (L. 199/2025): incidono sulle detrazioni art. 15
   *      TUIR, che questo modello non rappresenta (nessun onere detraibile).
   *    - TFR: accantonato, non entra nella retribuzione netta corrente.
   *    - Detrazioni per carichi di famiglia (art. 12 TUIR).
   * ------------------------------------------------------------------ */
};

export const PARAMETRI_DEFAULT = PARAMETRI_2026;
