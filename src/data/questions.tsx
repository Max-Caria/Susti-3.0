import { Globe, FileSignature, HeartHandshake, Leaf, Building2, Users } from 'lucide-react';

export const VERTICALS_HOTEL = [
  {
    id: 'h_ambiente', title: "Sostenibilità Ambientale", esg: "E", icon: <Leaf />,
    questions: [
      { id: 'e_gw_energy', type: 'binary', text: "La struttura ha implementato iniziative per l'efficienza energetica e la riduzione delle emissioni?", hint: "Sistemi di risparmio, fonti rinnovabili, monitoraggio. Rispondendo Sì, sbloccherai le domande di approfondimento." },
      { id: 'e1', type: 'binary', text: "La struttura ha un fornitore di energia elettrica 'green' o con elevata percentuale di fonte rinnovabile?", hint: "Contratti con garanzia d'origine (GO).", dependsOn: { id: 'e_gw_energy', value: true } },
      { id: 'e2', type: 'multiple-choice', text: "Quali sistemi di controllo o risparmio energetico sono stati adottati?", options: ["Sistemi BMS / Controllo calore", "Apparecchiature A+++", "Domotica in camera", "Nessuno"], hint: "Seleziona tutte le opzioni applicabili.", dependsOn: { id: 'e_gw_energy', value: true } },
      { id: 'e3', type: 'binary', text: "È stato installato un impianto di produzione di energia da fonti rinnovabili (es. fotovoltaico, solare termico)?", hint: "Produzione in loco.", dependsOn: { id: 'e_gw_energy', value: true } },
      { id: 'e4', type: 'likert', text: "Valuta il livello di efficienza energetica dell'immobile:", hint: "1 = Bassa efficienza (G/F), 5 = Elevata efficienza (A4/NZEB)", dependsOn: { id: 'e_gw_energy', value: true } },
      { id: 'e5', type: 'binary', text: "Sono attivi sistemi per ridurre le emissioni luminose e l'inquinamento luminoso notturno?", hint: "Sensori di movimento, timer, luci schermate.", dependsOn: { id: 'e_gw_energy', value: true } },
      { id: 'e6', type: 'single-choice', text: "La struttura ha calcolato la propria impronta in termini di emissioni di gas a effetto serra (GHG)?", options: ["Non calcolata", "Stima interna", "Calcolata con tool standard", "Certificata da terzi (es. ISO 14064)"], hint: "Monitoraggio della Carbon Footprint.", dependsOn: { id: 'e_gw_energy', value: true } },
      
      { id: 'e_gw_water', type: 'binary', text: "Sono attive politiche o sistemi per la gestione responsabile delle risorse idriche?", hint: "Risparmio idrico, monitoraggio, riduzione inquinanti. Rispondendo Sì, sbloccherai le domande di approfondimento." },
      { id: 'e7', type: 'multiple-choice', text: "Quali sistemi di risparmio idrico sono installati?", options: ["Riduttori di flusso/aeratori", "Sciacquoni a doppio scarico", "Recupero acque grigie/piovane", "Nessuno"], hint: "Seleziona le tecnologie presenti.", dependsOn: { id: 'e_gw_water', value: true } },
      { id: 'e8', type: 'binary', text: "Viene richiesto agli ospiti di riutilizzare asciugamani o biancheria per ridurne i lavaggi?", hint: "Policy ambientale comunicata in camera.", dependsOn: { id: 'e_gw_water', value: true } },
      { id: 'e9', type: 'binary', text: "È stata calcolata l'impronta idrica (water footprint) della struttura o per singola presenza?", hint: "Analisi dei consumi idrici diretti e indiretti.", dependsOn: { id: 'e_gw_water', value: true } },
      { id: 'e10', type: 'binary', text: "Sono attive procedure per la riduzione di sostanze inquinanti rilasciate nell'acqua o nelle falde idriche?", hint: "Uso di filtri, depuratori, o divieto di sversamenti.", dependsOn: { id: 'e_gw_water', value: true } },
      { id: 'e11', type: 'likert', text: "Con quale frequenza vengono monitorati i consumi idrici?", hint: "1 = Solo bolletta annuale, 5 = Monitoraggio smart in tempo reale", dependsOn: { id: 'e_gw_water', value: true } },
      
      { id: 'e_gw_waste', type: 'binary', text: "La struttura adotta misure avanzate per la gestione dei rifiuti e la riduzione degli sprechi?", hint: "Raccolta differenziata avanzata, plastic-free, lotta allo spreco alimentare. Rispondendo Sì, sbloccherai le domande di approfondimento." },
      { id: 'e12', type: 'likert', text: "Livello di implementazione della raccolta differenziata (oltre gli obblighi di legge):", hint: "1 = Base, 5 = Avanzata con pesatura e cartellonistica multilingua", dependsOn: { id: 'e_gw_waste', value: true } },
      { id: 'e13', type: 'multiple-choice', text: "Quali misure aggiuntive sono adottate per ridurre la plastica monouso?", options: ["Eliminazione bottigliette in PET", "Eliminazione kit cortesia in plastica", "Packaging fornitori compostabile", "Nessuna"], hint: "Oltre la normativa SUP.", dependsOn: { id: 'e_gw_waste', value: true } },
      { id: 'e14', type: 'binary', text: "La struttura utilizza contenitori refill (es. dispenser per sapone) al posto dei monodose?", hint: "Riduzione rifiuti da imballaggio.", dependsOn: { id: 'e_gw_waste', value: true } },
      { id: 'e15', type: 'binary', text: "Esistono accordi per il ritiro e la donazione delle eccedenze alimentari?", hint: "Lotta allo spreco alimentare (es. Too Good To Go, Banco Alimentare).", dependsOn: { id: 'e_gw_waste', value: true } },
      
      { id: 'e_gw_mob', type: 'binary', text: "Vengono promosse iniziative per la mobilità sostenibile degli ospiti?", hint: "Incentivi, noleggio bici, ricarica EV. Rispondendo Sì, sbloccherai le domande di approfondimento." },
      { id: 'e16', type: 'binary', text: "Sono previsti sconti o condizioni favorevoli per gli ospiti che arrivano con mezzi a minor impatto (treni, car pooling, bus)?", hint: "Incentivi alla mobilità dolce.", dependsOn: { id: 'e_gw_mob', value: true } },
      { id: 'e17', type: 'binary', text: "La struttura favorisce e promuove attivamente tour o percorsi in bici o a piedi?", hint: "Mappe, convenzioni, info point.", dependsOn: { id: 'e_gw_mob', value: true } },
      { id: 'e18', type: 'binary', text: "Vengono messe biciclette a disposizione degli ospiti (noleggio o uso gratuito)?", hint: "Servizio di bike sharing interno.", dependsOn: { id: 'e_gw_mob', value: true } },
      { id: 'e19', type: 'single-choice', text: "Qual è la dotazione di stazioni di ricarica per auto elettriche?", options: ["Assente", "1-2 postazioni standard", "Più di 2 postazioni", "Stazioni Fast Charge / Supercharger"], hint: "Infrastrutture per la mobilità elettrica.", dependsOn: { id: 'e_gw_mob', value: true } }
    ]
  },
  {
    id: 'h_sociale', title: "Sostenibilità Sociale", esg: "S", icon: <Users />,
    questions: [
      { id: 's_gw_access', type: 'binary', text: "La struttura dispone di servizi o infrastrutture specifiche per l'accessibilità e l'inclusione degli ospiti?", hint: "Design for All, assenza di barriere, info trasparenti. Rispondendo Sì, sbloccherai le domande di approfondimento." },
      { id: 's20', type: 'likert', text: "Livello di accessibilità della struttura per persone con disabilità o ridotta mobilità:", hint: "1 = Non accessibile, 5 = Totalmente accessibile (Design for All)", dependsOn: { id: 's_gw_access', value: true } },
      { id: 's21', type: 'binary', text: "Sono state considerate misure specifiche per l'accessibilità degli ospiti con disabilità cognitive?", hint: "Segnaletica semplificata, spazi calmi.", dependsOn: { id: 's_gw_access', value: true } },
      { id: 's22', type: 'binary', text: "È stato nominato o ingaggiato un referente/consulente per la diversità e l'inclusione?", hint: "Figura dedicata all'inclusività.", dependsOn: { id: 's_gw_access', value: true } },
      { id: 's23', type: 'binary', text: "Vengono fornite informazioni dettagliate sull'accessibilità prima dell'arrivo o in fase di prenotazione?", hint: "Trasparenza sulle barriere architettoniche.", dependsOn: { id: 's_gw_access', value: true } },
      
      { id: 's_gw_welfare', type: 'binary', text: "Sono attive politiche di welfare aziendale, formazione o tutela dei lavoratori oltre gli obblighi di legge?", hint: "Benefit, contratti integrativi, formazione continua. Rispondendo Sì, sbloccherai le domande di approfondimento." },
      { id: 's24', type: 'binary', text: "Esiste una politica specifica sulle condizioni di lavoro (inclusa la sicurezza) con un responsabile individuato?", hint: "Tutela dei lavoratori oltre gli obblighi normativi.", dependsOn: { id: 's_gw_welfare', value: true } },
      { id: 's25', type: 'binary', text: "Sono state stipulate polizze assicurative RCO (Responsabilità Civile Operai) per i dipendenti?", hint: "Copertura assicurativa extra.", dependsOn: { id: 's_gw_welfare', value: true } },
      { id: 's26', type: 'likert', text: "Valuta il programma formativo per lo sviluppo delle competenze del personale:", hint: "1 = Formazione assente/solo obbligatoria, 5 = Piano personalizzato e continuo", dependsOn: { id: 's_gw_welfare', value: true } },
      { id: 's27', type: 'multiple-choice', text: "Quali programmi di welfare aziendale formalizzati sono offerti?", options: ["Flessibilità oraria", "Assicurazione sanitaria integrativa", "Bonus/Premi di risultato", "Nessuno"], hint: "Benefit per i dipendenti.", dependsOn: { id: 's_gw_welfare', value: true } },
      { id: 's28', type: 'binary', text: "Vengono applicati accordi sindacali di secondo livello o forme di tutela extra-legge per i collaboratori?", hint: "Contrattazione integrativa.", dependsOn: { id: 's_gw_welfare', value: true } },
      { id: 's29', type: 'binary', text: "Il processo di selezione del personale garantisce l'assenza di discriminazioni (genere, provenienza, credo)?", hint: "Policy di Diversity & Inclusion nelle assunzioni.", dependsOn: { id: 's_gw_welfare', value: true } },
      { id: 's30', type: 'binary', text: "Viene svolta regolare formazione ai dipendenti in materia di sostenibilità?", hint: "Sensibilizzazione del team.", dependsOn: { id: 's_gw_welfare', value: true } },
      
      { id: 's_gw_community', type: 'binary', text: "La struttura collabora attivamente con la comunità locale o supporta progetti a impatto sociale?", hint: "Bilancio sociale, donazioni, tavoli decisionali. Rispondendo Sì, sbloccherai le domande di approfondimento." },
      { id: 's31', type: 'single-choice', text: "Qual è lo status giuridico o di rendicontazione dell'impatto sociale?", options: ["Nessuna rendicontazione", "Bilancio sociale volontario", "Società Benefit / B-Corp"], hint: "Impegno statutario verso la comunità.", dependsOn: { id: 's_gw_community', value: true } },
      { id: 's32', type: 'binary', text: "È stato verificato che le attività non abbiano impatti negativi sulle risorse o sulla reputazione della comunità locale?", hint: "Valutazione dell'impatto sociale esterno.", dependsOn: { id: 's_gw_community', value: true } },
      { id: 's33', type: 'likert', text: "Livello di collaborazione con organi di gestione della città (es. Comune) o associazioni di categoria:", hint: "1 = Nessuna, 5 = Partecipazione attiva a tavoli decisionali", dependsOn: { id: 's_gw_community', value: true } },
      { id: 's34', type: 'binary', text: "Esistono accordi di supporto economico con siti di interesse paesaggistico, aree protette o tutelate?", hint: "Sponsorizzazioni, donazioni a parchi o beni culturali.", dependsOn: { id: 's_gw_community', value: true } }
    ]
  },
  {
    id: 'h_economica', title: "Governance & Economia", esg: "G", icon: <Building2 />,
    questions: [
      { id: 'g_gw_local', type: 'binary', text: "La struttura promuove attivamente l'economia locale e il patrimonio del territorio?", hint: "Fornitori a km0, promozione eventi, convenzioni. Rispondendo Sì, sbloccherai le domande di approfondimento." },
      { id: 'g35', type: 'binary', text: "La struttura diffonde materiali promozionali del territorio offrendoli gratuitamente agli ospiti?", hint: "Mappe, guide locali, eventi.", dependsOn: { id: 'g_gw_local', value: true } },
      { id: 'g36', type: 'binary', text: "Gli ospiti vengono informati in merito a possibili fenomeni naturali, climatici o eventi pericolosi del territorio?", hint: "Gestione del rischio e sicurezza.", dependsOn: { id: 'g_gw_local', value: true } },
      { id: 'g37', type: 'binary', text: "Sono attive convenzioni con guide turistiche locali o servizi equivalenti?", hint: "Supporto all'economia locale.", dependsOn: { id: 'g_gw_local', value: true } },
      { id: 'g38', type: 'multiple-choice', text: "Quali eventi specifici dedicati a produttori o artigiani locali vengono promossi?", options: ["Mercatini/esposizioni interne", "Degustazioni prodotti tipici", "Visite guidate in azienda", "Nessuno"], hint: "Valorizzazione del Made in Local.", dependsOn: { id: 'g_gw_local', value: true } },
      { id: 'g39', type: 'likert', text: "Valuta l'incidenza degli accordi con fornitori del territorio (es. agricoli, culturali):", hint: "1 = Nessun fornitore locale, 5 = Oltre l'80% di fornitori a km0", dependsOn: { id: 'g_gw_local', value: true } },
      
      { id: 'g_gw_gov', type: 'binary', text: "Esiste un sistema di governance formale per la sostenibilità (certificazioni, responsabili, policy)?", hint: "Certificazioni ESG, Sustainability Manager, reportistica. Rispondendo Sì, sbloccherai le domande di approfondimento." },
      { id: 'g40', type: 'binary', text: "La struttura organizza o partecipa attivamente a eventi dedicati alla sostenibilità?", hint: "Fiere, convegni, giornate ecologiche.", dependsOn: { id: 'g_gw_gov', value: true } },
      { id: 'g41', type: 'single-choice', text: "Qual è lo status relativo a marchi o certificazioni di sostenibilità/ambientali?", options: ["Nessuna certificazione", "In corso di ottenimento", "Certificazione Nazionale (es. Legambiente)", "Certificazione Internazionale (es. GSTC, ISO 21401, Ecolabel)"], hint: "Riconoscimenti ufficiali.", dependsOn: { id: 'g_gw_gov', value: true } },
      { id: 'g42', type: 'binary', text: "È stato formalmente individuato un responsabile (anche esterno) per la sostenibilità?", hint: "Sustainability Manager.", dependsOn: { id: 'g_gw_gov', value: true } },
      { id: 'g43', type: 'binary', text: "L'impegno per la sostenibilità è formalizzato (es. politica di sostenibilità tradotta in più lingue)?", hint: "Documento programmatico pubblico.", dependsOn: { id: 'g_gw_gov', value: true } },
      { id: 'g44', type: 'likert', text: "Livello di chiarezza e proattività nell'informare e coinvolgere l'ospite nelle azioni di sostenibilità:", hint: "1 = Nessuna info, 5 = Comunicazione proattiva, multicanale e interattiva", dependsOn: { id: 'g_gw_gov', value: true } },
      { id: 'g45', type: 'binary', text: "L'impegno e le azioni attuate vengono comunicati in modo chiaro e periodico (es. report annuale)?", hint: "Trasparenza verso gli stakeholder.", dependsOn: { id: 'g_gw_gov', value: true } },
      { id: 'g46', type: 'multiple-choice', text: "Come viene rilevata la soddisfazione degli ospiti per definire azioni di miglioramento?", options: ["Questionari cartacei", "Survey digitali post-soggiorno", "Analisi semantica recensioni online", "Nessuna rilevazione"], hint: "Customer Satisfaction.", dependsOn: { id: 'g_gw_gov', value: true } },
      
      { id: 'g_gw_supply', type: 'binary', text: "Sono stati definiti criteri di sostenibilità per gli acquisti e la selezione dei fornitori?", hint: "Supply chain sostenibile, Fair Trade, acquisti verdi. Rispondendo Sì, sbloccherai le domande di approfondimento." },
      { id: 'g47', type: 'binary', text: "Viene utilizzato materiale stampato (brochure, cataloghi) a basso impatto ambientale?", hint: "Carta riciclata, inchiostri ecologici, certificazione FSC.", dependsOn: { id: 'g_gw_supply', value: true } },
      { id: 'g48', type: 'likert', text: "Livello di coinvolgimento dei fornitori per richiedere prodotti alternativi sostenibili:", hint: "1 = Nessun criterio, 5 = Codice di condotta fornitori obbligatorio", dependsOn: { id: 'g_gw_supply', value: true } },
      { id: 'g49', type: 'binary', text: "La struttura si approvvigiona da produttori della filiera equa e solidale (Fair Trade)?", hint: "Caffè, tè, cioccolato, cotone.", dependsOn: { id: 'g_gw_supply', value: true } },
      { id: 'g50', type: 'single-choice', text: "Quali prodotti per la pulizia vengono utilizzati?", options: ["Prodotti standard", "Prodotti parzialmente ecologici", "Prodotti certificati (es. Ecolabel)", "Prodotti certificati + Sistemi di dosaggio automatico"], hint: "Detergenti e chimica.", dependsOn: { id: 'g_gw_supply', value: true } }
    ]
  }
];

export const VERTICALS_DEST = [
  {
    id: 'd_ambiente', title: "Sostenibilità Ambientale", esg: "E", icon: <Globe />,
    questions: [
      { id: 'd1', type: 'binary', text: "La destinazione ha effettuato una valutazione dei rischi climatici?", hint: "Valutazione vulnerabilità e impatti futuri." },
      { id: 'd2', type: 'likert', text: "Quanto è integrato l'adattamento ai cambiamenti climatici nella pianificazione turistica?", hint: "1 = Per nulla, 5 = Completamente integrato", dependsOn: { id: 'd1', value: true } },
      { id: 'd3', type: 'multiple-choice', text: "Quali azioni sono attive per la tutela della biodiversità?", options: ["Monitoraggio specie a rischio", "Aree protette regolamentate", "Ripristino habitat", "Nessuna"], hint: "Iniziative di conservazione attiva." },
      { id: 'd4', type: 'binary', text: "Esistono linee guida per minimizzare l'inquinamento luminoso e acustico?", hint: "Regolamenti specifici applicati." },
      { id: 'd5', type: 'likert', text: "Efficacia della gestione dei flussi turistici (Overtourism) nei siti sensibili:", hint: "1 = Inesistente, 5 = Ottimale (sistemi di prenotazione, numero chiuso)" }
    ]
  },
  {
    id: 'd_economica', title: "Governance & Strategia", esg: "G", icon: <FileSignature />,
    questions: [
      { id: 'd6', type: 'binary', text: "Esiste una strategia pluriennale di turismo sostenibile pubblica?", hint: "Documento strategico accessibile." },
      { id: 'd7', type: 'single-choice', text: "Chi coordina il progetto di sostenibilità della destinazione?", options: ["Nessuno", "Un referente part-time", "Un team dedicato", "Una DMO con dipartimento specifico"], dependsOn: { id: 'd6', value: true } },
      { id: 'd8', type: 'binary', text: "Viene pubblicato un report di sostenibilità annuale?", hint: "Trasparenza sui risultati raggiunti." },
      { id: 'd9', type: 'likert', text: "Livello di supporto fornito alle PMI locali per la transizione ecologica:", hint: "1 = Nessun supporto, 5 = Bandi, formazione e incentivi continui" }
    ]
  },
  {
    id: 'd_sociale', title: "Sostenibilità Sociale", esg: "S", icon: <HeartHandshake />,
    questions: [
      { id: 'd10', type: 'binary', text: "Esiste un sistema strutturato per coinvolgere i residenti nella pianificazione turistica?", hint: "Assemblee pubbliche, sondaggi, tavoli di lavoro." },
      { id: 'd11', type: 'likert', text: "Frequenza di monitoraggio della soddisfazione dei residenti rispetto al turismo:", hint: "1 = Mai, 5 = Più volte all'anno", dependsOn: { id: 'd10', value: true } },
      { id: 'd12', type: 'multiple-choice', text: "Come viene promosso il patrimonio culturale locale?", options: ["Eventi tradizionali supportati", "Itinerari culturali", "Tutela artigianato locale", "Nessuna azione specifica"], hint: "Valorizzazione identità locale." },
      { id: 'd13', type: 'likert', text: "Livello di accessibilità universale dei principali siti turistici pubblici:", hint: "1 = Molto basso, 5 = Eccellente (Design for All)" }
    ]
  }
];
