import { Globe, FileSignature, HeartHandshake, Leaf, Building2, Users } from 'lucide-react';

export const VERTICALS_HOTEL = [
  {
    id: 'h_ambiente', title: "Efficienza Ambientale", esg: "E", icon: <Leaf />,
    questions: [
      { id: 'h1', type: 'binary', text: "La struttura monitora regolarmente i propri consumi energetici?", hint: "Presenza di contatori dedicati o sistemi BMS." },
      { id: 'h2', type: 'likert', text: "In che misura la struttura utilizza energia da fonti rinnovabili?", hint: "1 = 0%, 5 = 100%", dependsOn: { id: 'h1', value: true } },
      { id: 'h3', type: 'multiple-choice', text: "Quali misure di riduzione degli sprechi idrici sono attive?", options: ["Riduttori di flusso", "Recupero acque grigie", "Sensori smart", "Nessuna"], hint: "Sistemi attivi per il risparmio idrico." },
      { id: 'h4', type: 'single-choice', text: "Come viene gestita la raccolta differenziata?", options: ["Non viene effettuata", "Solo aree comuni", "Aree comuni e camere", "Sistema avanzato con pesatura"], hint: "Livello di implementazione della raccolta rifiuti." }
    ]
  },
  {
    id: 'h_sociale', title: "Impatto Sociale", esg: "S", icon: <Users />,
    questions: [
      { id: 'h5', type: 'binary', text: "Esiste una policy formale per l'assunzione di personale locale?", hint: "Priorità a residenti del territorio." },
      { id: 'h6', type: 'likert', text: "Valuta il livello dei programmi di welfare per i dipendenti:", hint: "1 = Base (solo obblighi di legge), 5 = Eccellente (benefit estesi, flessibilità)", dependsOn: { id: 'h5', value: true } },
      { id: 'h7', type: 'binary', text: "La struttura è accessibile a persone con disabilità motorie?", hint: "Presenza di rampe, ascensori a norma, camere dedicate." }
    ]
  },
  {
    id: 'h_governance', title: "Governance & Etica", esg: "G", icon: <Building2 />,
    questions: [
      { id: 'h8', type: 'binary', text: "È stato adottato un codice etico o una policy di sostenibilità scritta?", hint: "Documento formale condiviso con staff e fornitori." },
      { id: 'h9', type: 'single-choice', text: "Con quale frequenza viene redatto un report di sostenibilità?", options: ["Mai", "Irregolarmente", "Annualmente", "Annualmente con revisione esterna"], dependsOn: { id: 'h8', value: true } },
      { id: 'h10', type: 'likert', text: "Quanto i criteri ESG sono integrati nelle scelte di acquisto (Supply Chain)?", hint: "1 = Per nulla, 5 = Criterio fondamentale" }
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
