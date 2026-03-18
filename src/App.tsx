import React, { useState, useMemo, useEffect } from 'react';
import { 
  Leaf, Users, Globe, ShieldCheck, BarChart3, ArrowRight, Target, Zap, 
  CheckCircle2, ChevronLeft, ChevronRight, FileText, 
  Award, Droplets, Trash2, Bike, HeartHandshake, Landmark, Info,
  Activity, ClipboardCheck, Scale, FileSignature, Briefcase, 
  GraduationCap, MapPin, Building2, Hotel, Map, Mail, Phone, MessageSquare, Search,
  Eye, Thermometer, Recycle, Waves, Heart, AlertTriangle, Lightbulb, TrendingUp,
  FileSearch, ListChecks, Calendar, Rocket, Download, BrainCircuit, AlertCircle, User
} from 'lucide-react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, getDoc, updateDoc, getDocs } from 'firebase/firestore';
import { VERTICALS_HOTEL, VERTICALS_DEST } from './data/questions';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

// --- CONFIGURAZIONE ESG ---
const ESG_MAP = {
  E: { label: "Environmental", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  S: { label: "Social", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  G: { label: "Governance", color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200" }
};

const MATURITY_LEVELS = [
  { id: 1, label: "Assente", score: 0, desc: "Nessuna azione o politica definita." },
  { id: 2, label: "In Avvio", score: 33, desc: "Pianificazione o azioni isolate." },
  { id: 3, label: "Consolidato", score: 66, desc: "Processi attivi, risorse e monitoraggio." },
  { id: 4, label: "Eccellenza", score: 100, desc: "Standard internazionali e innovazione." }
];

const generateMilestones = (type: string, data: any) => {
  if (type === 'hotel') {
    return [
      { id: 'm0', label: 'Audit Iniziale', desc: 'Completamento del questionario di autovalutazione ESG.' },
      { id: 'm1', label: 'Analisi Gap', desc: 'Identificazione delle aree di miglioramento rispetto ai criteri GSTC.' },
      { id: 'm2', label: 'Piano d\'Azione', desc: 'Definizione degli obiettivi e delle azioni correttive.' },
      { id: 'm3', label: 'Implementazione', desc: 'Esecuzione delle azioni previste nel piano.' },
      { id: 'm4', label: 'Certificazione', desc: 'Ottenimento della certificazione di sostenibilità.' }
    ];
  } else {
    return [
      { id: 'm0', label: 'Assessment Destinazione', desc: 'Valutazione iniziale della destinazione turistica.' },
      { id: 'm1', label: 'Coinvolgimento Stakeholder', desc: 'Mappatura e ingaggio degli attori locali.' },
      { id: 'm2', label: 'Strategia di Sostenibilità', desc: 'Sviluppo del piano strategico per la destinazione.' },
      { id: 'm3', label: 'Monitoraggio Indicatori', desc: 'Implementazione del sistema di monitoraggio.' },
      { id: 'm4', label: 'Riconoscimento', desc: 'Raggiungimento degli standard internazionali.' }
    ];
  }
};

// --- DATABASE INTEGRALE ---
export default function App() {
  const [step, setStep] = useState('corporate'); 
  const [academyTab, setAcademyTab] = useState('destinations');
  const [lastAuditStep, setLastAuditStep] = useState(null);
  const [auditType, setAuditType] = useState(null); 
  const [activeVerticalIdx, setActiveVerticalIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [formData, setFormData] = useState({
    nome: '', ruolo: '', denominazione: '', sitoUrl: '', email: '', privacy: false, newsletter: false
  });
  const [processingText, setProcessingText] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [user, setUser] = useState(null);
  const [journey, setJourney] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminJourneys, setAdminJourneys] = useState([]);
  const [selectedAdminJourney, setSelectedAdminJourney] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');

  const handleUserLoginSetup = async (userObj, email, name, companyName) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userObj.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', userObj.uid), {
          uid: userObj.uid,
          name: name || 'Utente',
          email: email,
          companyName: companyName || 'Azienda non specificata',
          profileType: auditType || 'hotel',
          role: email === 'max@intellitalia.it' ? 'admin' : 'user',
          formData: formData,
          createdAt: new Date().toISOString()
        });
      }
      
      if (Object.keys(answers).length > 0) {
        const auditData = {
          userId: userObj.uid,
          profileType: auditType || 'hotel',
          scores: {
            environment: Math.round(stats.pillarScores.E),
            social: Math.round(stats.pillarScores.S),
            governance: Math.round(stats.pillarScores.G)
          },
          totalScore: Math.round(stats.totalScore),
          answers: answers,
          createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, 'audits'), auditData);
      }
      
      const journeyDoc = await getDoc(doc(db, 'journeys', userObj.uid));
      if (!journeyDoc.exists()) {
        const newJourney = {
          userId: userObj.uid,
          type: auditType || 'hotel',
          currentMilestone: 0,
          statusList: {},
          adminNotes: '',
          sharedDocs: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'journeys', userObj.uid), newJourney);
        setJourney({ id: userObj.uid, ...newJourney });
      } else {
        setJourney({ id: journeyDoc.id, ...journeyDoc.data() });
      }
    } catch (error) {
      console.error("Login setup error:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (step === 'admin_dashboard' && user?.role === 'admin') {
      const fetchAdminData = async () => {
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAdminUsers(usersData);

          const journeysSnapshot = await getDocs(collection(db, 'journeys'));
          const journeysData = journeysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAdminJourneys(journeysData);
        } catch (error) {
          console.error("Error fetching admin data:", error);
        }
      };
      fetchAdminData();
    }
  }, [step, user, db]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUser({ ...currentUser, role: userDoc.data().role });
          } else {
            setUser(currentUser);
          }
          
          const journeyDoc = await getDoc(doc(db, 'journeys', currentUser.uid));
          if (journeyDoc.exists()) {
            setJourney({ id: journeyDoc.id, ...journeyDoc.data() });
          } else {
            setJourney(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(currentUser);
          setJourney(null);
        }
      } else {
        setUser(null);
        setJourney(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedStep = localStorage.getItem('susti_step');
    const savedLastAuditStep = localStorage.getItem('susti_lastAuditStep');
    const savedAuditType = localStorage.getItem('susti_auditType');
    const savedActiveVerticalIdx = localStorage.getItem('susti_activeVerticalIdx');
    const savedAnswers = localStorage.getItem('susti_answers');
    const savedFormData = localStorage.getItem('susti_formData');

    if (savedStep) setStep(savedStep);
    if (savedLastAuditStep) setLastAuditStep(savedLastAuditStep);
    if (savedAuditType) setAuditType(savedAuditType);
    if (savedActiveVerticalIdx) setActiveVerticalIdx(parseInt(savedActiveVerticalIdx, 10));
    if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
    if (savedFormData) setFormData(JSON.parse(savedFormData));
    
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('susti_step', step);
    localStorage.setItem('susti_lastAuditStep', lastAuditStep || '');
    localStorage.setItem('susti_auditType', auditType || '');
    localStorage.setItem('susti_activeVerticalIdx', activeVerticalIdx.toString());
    localStorage.setItem('susti_answers', JSON.stringify(answers));
    localStorage.setItem('susti_formData', JSON.stringify(formData));
  }, [step, lastAuditStep, auditType, activeVerticalIdx, answers, formData, isInitialized]);

  // Update lastAuditStep whenever step changes to an audit-related step
  useEffect(() => {
    if (['landing_new', 'vertical_select', 'audit', 'lead_form', 'dashboard'].includes(step)) {
      setLastAuditStep(step);
    }
  }, [step]);

  const handleAutoFill = (type) => {
    let newFormData = { nome: '', ruolo: '', denominazione: '', sitoUrl: '', email: '', privacy: true, newsletter: true };
    if (type === 'montagna') {
      newFormData = { ...newFormData, nome: 'Mario Rossi', ruolo: 'Direttore', denominazione: 'Consorzio Dolomiti', sitoUrl: 'www.dolomiti.it', email: 'mario@dolomiti.it' };
    } else if (type === 'costiera') {
      newFormData = { ...newFormData, nome: 'Laura Bianchi', ruolo: 'Sustainability Manager', denominazione: 'Riviera Sostenibile', sitoUrl: 'www.riviera.it', email: 'laura@riviera.it' };
    } else if (type === 'citta') {
      newFormData = { ...newFormData, nome: 'Giuseppe Verdi', ruolo: 'Assessore al Turismo', denominazione: 'Comune di Firenze', sitoUrl: 'www.firenze.it', email: 'giuseppe@firenze.it' };
    }

    setFormData(newFormData);
    setAuditType('dest');
    
    // Auto-fill answers for VERTICALS_DEST
    const dummyAnswers = {
      d1: true,
      d2: 4,
      d3: ["Aree protette regolamentate"],
      d4: true,
      d5: 3,
      d6: true,
      d7: "Un team dedicato",
      d8: true,
      d9: 4,
      d10: true,
      d11: 4,
      d12: ["Eventi tradizionali supportati"],
      d13: 3
    };
    setAnswers(dummyAnswers);
    
    // Jump to processing
    setStep('processing');
    const texts = ["Validazione Criteri GSTC...", "Calcolo Indicatori ESG...", "Analisi Cross-Vertical..."];
    let i = 0;
    const interval = setInterval(() => {
      setProcessingText(texts[i]);
      i++;
      if (i === texts.length) {
        clearInterval(interval);
        setTimeout(() => setStep('dashboard'), 1500);
      }
    }, 800);
  };

  const currentVerticals = auditType === 'hotel' ? VERTICALS_HOTEL : VERTICALS_DEST;
  const activeVertical = currentVerticals ? currentVerticals[activeVerticalIdx] : null;

  const totalQuestions = useMemo(() => {
    if (!currentVerticals) return 0;
    return currentVerticals.reduce((acc, v) => acc + v.questions.length, 0);
  }, [currentVerticals]);

  const answeredQuestionsCount = useMemo(() => {
    return Object.keys(answers).length;
  }, [answers]);

  const progressPercentage = totalQuestions > 0 ? Math.round((answeredQuestionsCount / totalQuestions) * 100) : 0;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, activeVerticalIdx]);

  const stats = useMemo(() => {
    const vals = Object.values(answers);
    const count = vals.length;
    
    // Calcolo punteggi per pillar
    const calculatePillar = (pillar: string) => {
      if (!currentVerticals) return 0;
      const questions = (currentVerticals as any[]).filter(v => v.esg === pillar).flatMap(v => v.questions);
      if (questions.length === 0) return 0;
      
      const relevantScores = questions.map((q: any) => {
        const val = answers[q.id];
        if (val === undefined || val === null) return null;
        
        if (q.type === 'likert') {
          return (val - 1) * 25; // 1-5 -> 0-100
        }
        if (q.type === 'binary') {
          return val ? 100 : 0;
        }
        if (q.type === 'single-choice') {
          const idx = q.options.indexOf(val);
          if (idx === -1) return 0;
          return Math.round((idx / (q.options.length - 1)) * 100);
        }
        if (q.type === 'multiple-choice') {
          if (!Array.isArray(val) || val.length === 0) return 0;
          if (val.includes("Nessuno") || val.includes("Nessuna")) return 0;
          // Selezionando tutte le opzioni valide (escluso "Nessuno") si ottiene 100
          const validOptionsCount = q.options.filter((o: string) => o !== "Nessuno" && o !== "Nessuna").length;
          return Math.round(Math.min((val.length / validOptionsCount) * 100, 100));
        }
        return null;
      }).filter(v => v !== null);
      
      return relevantScores.length > 0 ? Math.round(relevantScores.reduce((a, b) => a + (b as number), 0) / relevantScores.length) : 0;
    };

    const pillarScores = {
      E: calculatePillar('E'),
      S: calculatePillar('S'),
      G: calculatePillar('G')
    };

    const totalScore = Math.round((pillarScores.E + pillarScores.S + pillarScores.G) / 3);

    const verticalScores = (currentVerticals as any[])?.map(v => {
      const questions = v.questions;
      const relevantScores = questions.map((q: any) => {
        const val = answers[q.id];
        if (val === undefined || val === null) return null;
        
        if (q.type === 'likert') return (val - 1) * 25;
        if (q.type === 'binary') return val ? 100 : 0;
        if (q.type === 'single-choice') {
          const idx = q.options.indexOf(val);
          if (idx === -1) return 0;
          return Math.round((idx / (q.options.length - 1)) * 100);
        }
        if (q.type === 'multiple-choice') {
          if (!Array.isArray(val) || val.length === 0) return 0;
          if (val.includes("Nessuno") || val.includes("Nessuna")) return 0;
          const validOptionsCount = q.options.filter((o: string) => o !== "Nessuno" && o !== "Nessuna").length;
          return Math.round(Math.min((val.length / validOptionsCount) * 100, 100));
        }
        return null;
      }).filter(v => v !== null);
      
      const score = relevantScores.length > 0 ? Math.round(relevantScores.reduce((a, b) => a + (b as number), 0) / relevantScores.length) : 0;
      return { subject: v.title.split(':')[0], A: score, fullMark: 100 };
    }) || [];

    // Expert System Logic
    let maturityLevel = { level: 1, title: 'Iniziale (Awareness)', desc: 'Primi passi verso la sostenibilità. Necessario strutturare un piano d\'azione.' };
    if (totalScore > 30) maturityLevel = { level: 2, title: 'Strutturato (Development)', desc: 'Buona base di partenza. Opportunità di ottimizzazione e formalizzazione.' };
    if (totalScore > 60) maturityLevel = { level: 3, title: 'Avanzato (Integration)', desc: 'Sostenibilità integrata nei processi. Pronti per certificazioni internazionali.' };
    if (totalScore > 80) maturityLevel = { level: 4, title: 'Leader (Excellence)', desc: 'Eccellenza operativa e strategica. Modello di riferimento per il settore.' };

    const checklist = [];
    if (pillarScores.E < 50) checklist.push('Implementare un sistema di monitoraggio energetico e idrico.');
    if (pillarScores.S < 50) checklist.push('Formalizzare le policy di welfare aziendale e accessibilità.');
    if (pillarScores.G < 50) checklist.push('Nominare un Sustainability Manager e redigere un bilancio di sostenibilità.');
    if (pillarScores.E >= 50 && pillarScores.S >= 50 && pillarScores.G >= 50) checklist.push('Mantenere gli standard attuali e puntare a certificazioni GSTC/ISO.');

    const metrics = auditType === 'hotel' ? [
      { label: 'Carbon Footprint / Guest Night', value: pillarScores.E > 60 ? 'Ottimizzata' : 'Da Calcolare' },
      { label: 'Water Consumption / Guest Night', value: pillarScores.E > 50 ? 'Monitorata' : 'Non Monitorata' },
      { label: '% Fornitori Locali', value: pillarScores.G > 50 ? '> 50%' : '< 30%' },
      { label: '% Energia Rinnovabile', value: pillarScores.E > 70 ? '> 80%' : '< 20%' }
    ] : [
      { label: 'Indice di Pressione Turistica', value: pillarScores.S > 60 ? 'Sotto Controllo' : 'Critico' },
      { label: '% Aree Protette', value: pillarScores.E > 50 ? 'In Aumento' : 'Stabile' },
      { label: 'Indice Soddisfazione Residenti', value: pillarScores.S > 70 ? 'Alto' : 'Da Migliorare' },
      { label: '% Mobilità Sostenibile', value: pillarScores.E > 60 ? '> 40%' : '< 20%' }
    ];

    let roadmap = [];
    if (totalScore < 40) {
      roadmap = [
        { step: "Fase 1", time: "Mese 1-2", title: "Gap Analysis & Baseline", desc: "Misurazione iniziale delle performance e definizione degli obiettivi ESG prioritari." },
        { step: "Fase 2", time: "Mese 3-6", title: "Implementazione Policy", desc: "Adozione di pratiche operative per efficienza energetica, gestione risorse e welfare." },
        { step: "Fase 3", time: "Mese 7-8", title: "Formazione & Engagement", desc: "Training del personale e coinvolgimento degli stakeholder locali." },
        { step: "Fase 4", time: "Mese 9-12", title: "Preparazione Certificazione", desc: "Allineamento finale agli standard internazionali (GSTC/ISO) e pre-audit." }
      ];
    } else if (totalScore < 70) {
      roadmap = [
        { step: "Fase 1", time: "Mese 1-2", title: "Ottimizzazione Processi", desc: "Miglioramento delle pratiche esistenti e colmatura dei gap identificati." },
        { step: "Fase 2", time: "Mese 3-5", title: "Integrazione Supply Chain", desc: "Sviluppo di policy per acquisti verdi e coinvolgimento dei fornitori locali." },
        { step: "Fase 3", time: "Mese 6-7", title: "Pre-Audit di Certificazione", desc: "Simulazione di audit ufficiale per verificare la conformità agli standard GSTC/ISO." },
        { step: "Fase 4", time: "Mese 8-10", title: "Certificazione & Reporting", desc: "Ottenimento della certificazione e redazione del primo Bilancio di Sostenibilità." }
      ];
    } else {
      roadmap = [
        { step: "Fase 1", time: "Mese 1", title: "Consolidamento Dati ESG", desc: "Raccolta avanzata e strutturazione dei KPI ambientali, sociali e di governance." },
        { step: "Fase 2", time: "Mese 2-3", title: "Audit di Certificazione", desc: "Audit ufficiale di terza parte per l'ottenimento della certificazione GSTC/ISO." },
        { step: "Fase 3", time: "Mese 4-5", title: "Bilancio di Sostenibilità", desc: "Redazione e pubblicazione del report ESG annuale per gli stakeholder." },
        { step: "Fase 4", time: "Mese 6+", title: "Leadership & Innovazione", desc: "Sviluppo di progetti a impatto positivo sul territorio e continuous improvement." }
      ];
    }

    return { totalScore, pillarScores, answeredCount: count, verticalScores, expertInsights: { maturityLevel, checklist, metrics, roadmap } };
  }, [answers, currentVerticals, auditType]);

  const handleNextVertical = async () => {
    if (activeVerticalIdx < currentVerticals.length - 1) {
      setStep('processing');
      const texts = ["Validazione Criteri GSTC...", "Calcolo Indicatori ESG...", "Analisi Cross-Vertical..."];
      let i = 0;
      const interval = setInterval(() => {
        setProcessingText(texts[i]);
        i++;
        if (i === texts.length) {
          clearInterval(interval);
          setActiveVerticalIdx(activeVerticalIdx + 1);
          setStep('audit');
        }
      }, 500);
    } else {
      setStep('lead_form');
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    // Aggiungiamo una classe temporanea per nascondere elementi non necessari nel PDF
    element.classList.add('pdf-mode');

    try {
      const dataUrl = await toPng(element, { quality: 0.98, pixelRatio: 2, backgroundColor: '#FDFDFD' });
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;

      // Prima pagina
      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      // Pagine successive
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`SUSTI_Executive_Report_${formData.denominazione || 'Azienda'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      element.classList.remove('pdf-mode');
    }
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!formData.privacy) {
      alert("È necessario accettare la privacy policy per proseguire.");
      return;
    }
    setStep('processing');
    setProcessingText("Salvataggio dati e Generazione Executive Report...");
    
    try {
      // API call to backend for Google Sheets / Email
      try {
        await fetch('/api/submit-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead: formData,
            auditType,
            stats,
            answers
          })
        });
      } catch (webhookErr) {
        console.log("Errore chiamata API backend:", webhookErr);
      }

      // Save to Firebase (using anonymous or open rules for lead magnet)
      try {
        await addDoc(collection(db, 'leads'), {
          ...formData,
          profileType: auditType,
          scores: {
            environment: stats.pillarScores.E,
            social: stats.pillarScores.S,
            governance: stats.pillarScores.G
          },
          totalScore: stats.totalScore,
          answers: answers,
          createdAt: new Date().toISOString()
        });
        
        // Auto-login or create account with the email provided
        const email = formData.email;
        const dummyPassword = email + "_SustiAuth!";
        let userCredential;
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, dummyPassword);
        } catch (err: any) {
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            userCredential = await createUserWithEmailAndPassword(auth, email, dummyPassword);
          } else {
            throw err;
          }
        }
        await handleUserLoginSetup(userCredential.user, email, formData.nome, formData.denominazione);
      } catch (dbErr) {
        console.log("Salvataggio DB fallito, procedo comunque per mostrare il report", dbErr);
      }

      setTimeout(() => setStep('dashboard'), 1500);
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
      alert("Si è verificato un errore. Riprova.");
      setStep('lead_form');
    }
  };

  const updateAnswer = (id, val) => {
    setAnswers({ ...answers, [id]: val });
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-emerald-100">
      
      {/* NAVBAR */}
      <nav className="print:hidden h-16 sm:h-20 border-b bg-white-90 backdrop-blur-md sticky top-0 z-50 flex items-center px-4 sm:px-8 justify-between">
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setStep('corporate')}>
          <div className="flex flex-col justify-center">
            <div className="flex items-baseline">
              <span className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-800 leading-none">
                SUST
              </span>
              <span className="text-3xl sm:text-4xl font-black tracking-tighter text-emerald-600 leading-none relative">
                I
                <Leaf className="absolute -top-2 -right-3 w-4 h-4 text-emerald-500 -rotate-12" />
              </span>
              <span className="text-slate-400 text-sm align-top ml-2 font-bold">®</span>
            </div>
            <span className="text-[8px] sm:text-[9px] text-slate-500 font-bold tracking-[0.2em] uppercase mt-1">Sustainable Tourism Index</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-6">
          {step === 'audit' && currentVerticals ? (
            <>
              <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analisi in corso</p>
                  <p className="text-sm font-bold text-slate-700">{answeredQuestionsCount} / {totalQuestions} Domande</p>
              </div>
              <div className="w-24 sm:w-32 h-2 sm:h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900 transition-all duration-700" style={{ width: `${progressPercentage}%` }}></div>
              </div>
              <div className="text-xs font-black text-slate-700 sm:hidden">
                  {progressPercentage}%
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative group">
                <button 
                  onClick={() => setStep('academy')}
                  className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors py-2"
                >
                  <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Academy</span>
                </button>
                <div className="absolute top-full right-0 sm:left-1/2 sm:-translate-x-1/2 mt-0 w-48 bg-white border border-slate-100 shadow-xl rounded-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button 
                    onClick={() => { setStep('academy'); setAcademyTab('destinations'); }} 
                    className="block w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors"
                  >
                    Corso Destinazioni
                  </button>
                  <button 
                    onClick={() => { setStep('academy'); setAcademyTab('hotels'); }} 
                    className="block w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors"
                  >
                    Corso Hotel
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setShowCalendar(true)}
                className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Prenota Call</span>
              </button>
              {user && (
                <button 
                  onClick={() => setStep('journey')}
                  className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Percorso</span>
                </button>
              )}
              {!user && (
                <button 
                  onClick={() => setStep('auth_wall')}
                  className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Accedi</span>
                </button>
              )}
              {user?.role === 'admin' && (
                <button 
                  onClick={() => setStep('admin_dashboard')}
                  className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-xs font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-800 transition-colors"
                >
                  <BrainCircuit className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Admin</span>
                </button>
              )}
              {step !== 'lead_form' && step !== 'processing' && (
                <div className="flex items-center gap-2">
                  {lastAuditStep && Object.keys(answers).length > 0 && (
                    <button 
                      onClick={() => { setStep('landing_new'); setAnswers({}); setActiveVerticalIdx(0); setAuditType(null); setLastAuditStep(null); }}
                      className="text-slate-500 hover:text-emerald-600 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-black text-[9px] sm:text-xs uppercase tracking-widest transition-colors"
                    >
                      Nuovo Audit
                    </button>
                  )}
                  <button 
                    onClick={() => { 
                      if (lastAuditStep && Object.keys(answers).length > 0) {
                        setStep(lastAuditStep);
                      } else {
                        setStep('landing_new'); setAnswers({}); setActiveVerticalIdx(0); setAuditType(null); 
                      }
                    }}
                    className="bg-emerald-600 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-full font-black text-[9px] sm:text-xs uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 sm:gap-2"
                  >
                    {lastAuditStep && Object.keys(answers).length > 0 ? 'Riprendi Audit' : 'Inizia Audit'} <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 print:p-0 print:max-w-none">

        {/* ACADEMY PAGE */}
        {step === 'academy' && (
          <div className="space-y-20 animate-in fade-in duration-1000">
            {/* Hero Section */}
            <div className="text-center space-y-8 max-w-4xl mx-auto pt-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100">
                <GraduationCap className="w-3.5 h-3.5" /> Destinova | Destination Management Academy
              </div>
              <h1 className="text-5xl sm:text-7xl font-black text-slate-900 leading-[0.9] tracking-tighter">
                Master in <span className="text-emerald-600">Sostenibilità</span> Turistica
              </h1>
              <p className="text-lg text-slate-500 max-w-3xl mx-auto leading-relaxed">
                Il percorso di formazione completo per comprendere le certificazioni di sostenibilità, i criteri ESG e gli standard GSTC. Scegli il percorso più adatto alla tua realtà.
              </p>
              <div className="pt-6 flex justify-center">
                <a href="https://www.destinova.it" target="_blank" rel="noopener noreferrer" className="bg-emerald-600 text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3">
                  Iscriviti su Destinova <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Course Selection Boxes */}
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 px-4">
              <div 
                onClick={() => setAcademyTab('destinations')}
                className={`cursor-pointer rounded-[40px] p-8 sm:p-12 transition-all duration-300 border-2 ${academyTab === 'destinations' ? 'bg-emerald-50 border-emerald-500 shadow-xl scale-105' : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200'}`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${academyTab === 'destinations' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Map className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">Corso per Destinazioni</h3>
                <p className="text-slate-500 leading-relaxed mb-8">
                  Dedicato a DMO, consorzi turistici e amministrazioni locali. Scopri come applicare i criteri GSTC-D per gestire e promuovere una destinazione in modo sostenibile.
                </p>
                <div className={`inline-flex items-center gap-2 font-bold text-sm uppercase tracking-widest ${academyTab === 'destinations' ? 'text-emerald-600' : 'text-slate-400'}`}>
                  Vedi Moduli <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              <div 
                onClick={() => setAcademyTab('hotels')}
                className={`cursor-pointer rounded-[40px] p-8 sm:p-12 transition-all duration-300 border-2 ${academyTab === 'hotels' ? 'bg-emerald-50 border-emerald-500 shadow-xl scale-105' : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200'}`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${academyTab === 'hotels' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Hotel className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">Corso per Hotel</h3>
                <p className="text-slate-500 leading-relaxed mb-8">
                  Progettato per albergatori e manager dell'ospitalità. Impara a implementare gli standard GSTC-I per ottimizzare le risorse e ottenere la certificazione.
                </p>
                <div className={`inline-flex items-center gap-2 font-bold text-sm uppercase tracking-widest ${academyTab === 'hotels' ? 'text-emerald-600' : 'text-slate-400'}`}>
                  Vedi Moduli <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Course Modules */}
            <div className="max-w-5xl mx-auto">
              <div className="bg-slate-50 rounded-[40px] p-8 sm:p-16">
                <div className="text-center mb-12">
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-4">
                    I Moduli del Corso: {academyTab === 'destinations' ? 'Destinazioni' : 'Hotel'}
                  </h2>
                  <p className="text-slate-500">Un percorso strutturato per guidarti dalla teoria alla pratica della certificazione.</p>
                </div>
                
                <div className="grid gap-6">
                  {(academyTab === 'destinations' ? [
                    {
                      title: "Introduzione alla Sostenibilità Turistica",
                      desc: "Comprendere i fondamenti: criteri ESG, SDGs dell'Agenda 2030 e l'impatto del turismo sull'ambiente e sulle comunità locali.",
                      icon: <Globe className="w-6 h-6 text-emerald-600" />
                    },
                    {
                      title: "Il framework GSTC per le Destinazioni (GSTC-D)",
                      desc: "Analisi approfondita dei criteri del Global Sustainable Tourism Council specifici per la gestione sostenibile delle destinazioni turistiche.",
                      icon: <Map className="w-6 h-6 text-emerald-600" />
                    },
                    {
                      title: "Gestione del Territorio e Comunità Locali",
                      desc: "Strategie per massimizzare i benefici economici e sociali per la comunità locale minimizzando gli impatti negativi.",
                      icon: <Users className="w-6 h-6 text-emerald-600" />
                    },
                    {
                      title: "Preparazione all'Audit di Certificazione",
                      desc: "Step pratici, documentazione necessaria e best practice per affrontare con successo l'audit di certificazione ufficiale per destinazioni.",
                      icon: <ClipboardCheck className="w-6 h-6 text-emerald-600" />
                    },
                    {
                      title: "Destination Marketing Sostenibile",
                      desc: "Strategie di marketing etico: come valorizzare il proprio impegno e comunicare il valore della destinazione ai viaggiatori consapevoli.",
                      icon: <MessageSquare className="w-6 h-6 text-emerald-600" />
                    }
                  ] : [
                    {
                      title: "Introduzione alla Sostenibilità nell'Ospitalità",
                      desc: "I fondamenti della sostenibilità applicati al settore alberghiero: vantaggi competitivi, riduzione dei costi e aspettative dei clienti.",
                      icon: <Globe className="w-6 h-6 text-emerald-600" />
                    },
                    {
                      title: "Il framework GSTC per gli Hotel (GSTC-I)",
                      desc: "Come applicare gli standard GSTC all'interno delle strutture ricettive: dall'efficienza energetica alla gestione del personale.",
                      icon: <Hotel className="w-6 h-6 text-emerald-600" />
                    },
                    {
                      title: "Efficienza Energetica e Gestione Risorse",
                      desc: "Tecniche pratiche per la riduzione dei consumi idrici ed energetici, gestione dei rifiuti e approvvigionamento sostenibile.",
                      icon: <Zap className="w-6 h-6 text-emerald-600" />
                    },
                    {
                      title: "Preparazione all'Audit di Certificazione",
                      desc: "Come organizzare la documentazione, formare lo staff e preparare la struttura per superare l'audit di certificazione GSTC.",
                      icon: <ClipboardCheck className="w-6 h-6 text-emerald-600" />
                    },
                    {
                      title: "Green Marketing e Comunicazione",
                      desc: "Come comunicare in modo trasparente ed efficace le iniziative sostenibili dell'hotel evitando il rischio di greenwashing.",
                      icon: <MessageSquare className="w-6 h-6 text-emerald-600" />
                    }
                  ]).map((module, idx) => (
                    <div key={idx} className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-6 items-start hover:shadow-md transition-shadow">
                      <div className="w-16 h-16 shrink-0 bg-emerald-50 rounded-2xl flex items-center justify-center">
                        {module.icon}
                      </div>
                      <div>
                        <div className="text-emerald-600 font-black text-sm tracking-widest uppercase mb-2">Modulo {idx + 1}</div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">{module.title}</h3>
                        <p className="text-slate-500 leading-relaxed">{module.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-16 text-center">
                  <a href="https://www.destinova.it" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95">
                    Iscriviti al Corso su Destinova <ArrowRight className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
            
            <div className="pb-20"></div>
          </div>
        )}

        {/* LANDING PAGE CORPORATE */}
        {step === 'corporate' && (
          <div className="space-y-20 animate-in fade-in duration-1000">
            {/* Hero Section */}
            <div className="text-center space-y-8 max-w-4xl mx-auto pt-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100">
                <Leaf className="w-3.5 h-3.5" /> Società Benefit
              </div>
              <div className="flex justify-center mb-8">
                 <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black italic shadow-xl text-2xl sm:text-4xl">TS</div>
                    <div className="flex flex-col leading-none text-left">
                       <span className="text-slate-900 font-black text-4xl sm:text-6xl tracking-tight leading-none">Territori</span>
                       <span className="text-slate-900 font-black text-4xl sm:text-6xl tracking-tight leading-none">Sostenibili</span>
                       <span className="text-emerald-600 font-bold text-sm sm:text-lg tracking-widest uppercase mt-2">Società Benefit</span>
                    </div>
                 </div>
              </div>
              <p className="text-xl sm:text-2xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
                Oltre 10 anni di esperienza nello sviluppo di strategie di turismo sostenibile per valorizzare imprese turistiche, amministrazioni pubbliche, consorzi e DMO.
              </p>
              <p className="text-lg text-slate-500 max-w-3xl mx-auto leading-relaxed">
                Affianchiamo i nostri Clienti in tutte le fasi del loro percorso per programmare, realizzare e rendicontare iniziative di sostenibilità, promuovendo un turismo responsabile e duraturo. Il nostro obiettivo è migliorare la competitività dei territori e generare un impatto positivo sul benessere delle comunità locali.
              </p>
              <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
                {lastAuditStep && Object.keys(answers).length > 0 && (
                  <button onClick={() => { setStep('landing_new'); setAnswers({}); setActiveVerticalIdx(0); setAuditType(null); setLastAuditStep(null); }} className="bg-slate-100 text-slate-600 px-8 py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-sm hover:bg-slate-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3">
                    Nuovo Audit
                  </button>
                )}
                <button onClick={() => {
                    if (lastAuditStep && Object.keys(answers).length > 0) {
                      setStep(lastAuditStep);
                    } else {
                      setStep('landing_new'); setAnswers({}); setActiveVerticalIdx(0); setAuditType(null);
                    }
                  }} className="bg-emerald-600 text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3">
                  {lastAuditStep && Object.keys(answers).length > 0 ? 'Riprendi Audit' : "Inizia l'Audit Gratuito"} <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={() => setShowCalendar(true)} className="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-sm hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3">
                  <Calendar className="w-5 h-5" /> Prenota una Call
                </button>
              </div>
            </div>

            {/* A chi ci rivolgiamo */}
            <div className="bg-slate-50 rounded-[40px] p-10 sm:p-16 text-center space-y-12">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">A chi ci rivolgiamo e cosa facciamo</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Hotel className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Imprese Turistiche</h3>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Amministrazioni Pubbliche</h3>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Map className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">DMO & Consorzi</h3>
                </div>
              </div>
            </div>

            {/* I Nostri Progetti */}
            <div className="text-center space-y-12 max-w-6xl mx-auto px-4">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">I Nostri Progetti</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg transition-all group">
                    <div className="h-48 bg-slate-200 relative overflow-hidden">
                      <img src={`https://picsum.photos/seed/sustainability${i}/800/600`} alt="Progetto" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900-60 to-transparent"></div>
                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 bg-white-20 backdrop-blur-md text-white text-xs font-bold rounded-full">Turismo Sostenibile</span>
                      </div>
                    </div>
                    <div className="p-6 space-y-3">
                      <h3 className="text-xl font-bold text-slate-800">Progetto Pilota {i}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2">Sviluppo di una strategia integrata per la valorizzazione del territorio e la riduzione dell'impatto ambientale delle strutture ricettive.</p>
                      <button className="text-emerald-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all pt-2">
                        Scopri di più <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SUSTI Section */}
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto px-4">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                  <ShieldCheck className="w-3.5 h-3.5" /> Il nostro strumento
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  Valuta la tua sostenibilità con SUSTI®
                </h2>
                <p className="text-lg text-slate-500 leading-relaxed">
                  SUSTI® è la soluzione di valutazione ed attestazione della sostenibilità sviluppata da Territori Sostenibili, conforme ai migliori standard internazionali.
                </p>
                <p className="text-lg text-slate-500 leading-relaxed">
                  Con un'interfaccia intuitiva, SUSTI® è semplice, rapido e progettato per ottenere risultati concreti nella transizione verso la sostenibilità.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  {lastAuditStep && Object.keys(answers).length > 0 && (
                    <button onClick={() => { setStep('landing_new'); setAnswers({}); setActiveVerticalIdx(0); setAuditType(null); setLastAuditStep(null); }} className="bg-slate-100 text-slate-600 px-8 py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-3">
                      Nuovo Audit
                    </button>
                  )}
                  <button onClick={() => {
                      if (lastAuditStep && Object.keys(answers).length > 0) {
                        setStep(lastAuditStep);
                      } else {
                        setStep('landing_new'); setAnswers({}); setActiveVerticalIdx(0); setAuditType(null);
                      }
                    }} className="bg-emerald-600 text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
                    {lastAuditStep && Object.keys(answers).length > 0 ? 'Riprendi Audit' : "Inizia l'Assessment SUSTI®"} <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="bg-emerald-50 p-8 sm:p-12 rounded-[40px] relative overflow-hidden">
                <div className="relative z-10 space-y-8">
                  <h3 className="text-2xl font-black text-slate-900">Roadmap per progetti di Turismo Sostenibile</h3>
                  <div className="space-y-6">
                    {[
                      { step: "01", desc: "Valutiamo la tua situazione attuale con SUSTI®" },
                      { step: "02", desc: "Pianifichiamo il tuo percorso di miglioramento verso la sostenibilità" },
                      { step: "03", desc: "Implementiamo le azioni e le monitoriamo." },
                      { step: "04", desc: "Ti aiutiamo a realizzare i tuoi obiettivi" },
                      { step: "05", desc: "Ti aiutiamo a comunicarli agli stakeholder" }
                    ].map((item) => (
                      <div key={item.step} className="flex gap-4 items-start">
                        <span className="text-xl font-black text-emerald-600-50">{item.step}</span>
                        <p className="text-slate-700 font-medium pt-0.5">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <Target className="absolute -bottom-10 -right-10 w-64 h-64 text-emerald-600-5 rotate-12" />
              </div>
            </div>

            {/* I Nostri Partners */}
            <div className="text-center space-y-12 max-w-6xl mx-auto px-4 pt-10">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">I nostri partners</h2>
              <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-32 h-16 bg-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-400">
                    Partner {i}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Footer space */}
            <div className="pb-20"></div>
          </div>
        )}

        {/* STEP 1: LANDING PAGE INIZIALE */}
        {step === 'landing_new' && (
          <div className="max-w-4xl mx-auto text-center space-y-8 sm:space-y-12 py-8 sm:py-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative">
            <button 
              onClick={() => setStep('corporate')}
              className="absolute -top-4 sm:top-0 left-4 sm:left-0 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-bold"
            >
              <ChevronLeft className="w-4 h-4" /> Torna alla Home
            </button>
            <div className="space-y-6 px-4 pt-8 sm:pt-0">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100">
                <ShieldCheck className="w-3.5 h-3.5" /> Professional ESG Assessment
              </div>
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="flex items-baseline mb-2">
                  <span className="text-7xl sm:text-9xl font-black tracking-tighter text-slate-800 leading-none">
                    SUST
                  </span>
                  <span className="text-7xl sm:text-9xl font-black tracking-tighter text-emerald-600 leading-none relative">
                    I
                    <Leaf className="absolute -top-6 -right-8 sm:-top-8 sm:-right-12 w-10 h-10 sm:w-16 sm:h-16 text-emerald-500 -rotate-12" />
                  </span>
                  <span className="text-slate-400 text-3xl sm:text-5xl align-top ml-4 sm:ml-6 font-bold">®</span>
                </div>
                <span className="text-sm sm:text-xl text-slate-500 font-bold tracking-[0.3em] uppercase mt-4">Sustainable Tourism Index</span>
              </div>
              <p className="text-lg sm:text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed font-medium">
                Scopri il tuo livello di maturità ESG in meno di 5 minuti. Ottieni un Executive Report personalizzato e una roadmap chiara per la transizione sostenibile della tua organizzazione.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto pt-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-slate-700">Semplice, veloce e personalizzato</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-slate-700">Conforme agli standard ISO e GSTC</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-slate-700">Compatibile con altre certificazioni</p>
                </div>
              </div>

              <div className="bg-slate-50 p-8 rounded-[30px] text-left space-y-6 max-w-3xl mx-auto mt-8">
                <h3 className="text-xl font-black text-slate-800">Come funziona:</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-emerald-600">FASE 1: I DATI</h4>
                    <p className="text-sm text-slate-600">Inserisci i dati di base per ricevere il contatto da parte del nostro Team Territori Sostenibili. Ricordati che dovrai approvare le clausole in materia di trattamento dei dati personali.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-600">FASE 2: LE DOMANDE</h4>
                    <p className="text-sm text-slate-600">Rispondi alle domande che seguono in materia di sostenibilità nelle tre aree: Ambientale – Sociale – Economico.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-600">FASE 3: I RISULTATI E IL FUTURO</h4>
                    <p className="text-sm text-slate-600">Il presente programma è stato realizzato utilizzando come Linea Guida lo standard GSTC Destinazione, standard globale per il turismo sostenibile.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => { setAuditType('dest'); setStep('audit'); }} className="bg-emerald-600 text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
                <Map className="w-5 h-5" /> Audit Destinazioni
              </button>
              <button onClick={() => { setAuditType('hotel'); setStep('audit'); }} className="bg-slate-900 text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                <Hotel className="w-5 h-5" /> Audit Strutture
              </button>
            </div>

            {/* Test Auto-Fill Section */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl mx-auto mt-8">
               <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-widest">Test Auto-Fill Destinazioni</span>
               </div>
               <div className="flex flex-wrap gap-2 justify-center">
                  <button onClick={() => handleAutoFill('montagna')} className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors">Montana</button>
                  <button onClick={() => handleAutoFill('costiera')} className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors">Costiera</button>
                  <button onClick={() => handleAutoFill('citta')} className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors">Città d'Arte</button>
               </div>
            </div>
          </div>
        )}

        {/* STEP 2: AUDIT EXPERT */}
        {step === 'audit' && activeVertical && (
          <div className="grid lg:grid-cols-[1fr_360px] gap-8 sm:gap-12 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="space-y-8 sm:space-y-12">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className={`self-start sm:self-auto px-4 sm:px-5 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] ${ESG_MAP[activeVertical.esg].bg} ${ESG_MAP[activeVertical.esg].color}`}>
                  Pilastro {ESG_MAP[activeVertical.esg].label}
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{activeVertical.title}</h2>
              </div>

              <div className="space-y-12 sm:space-y-20">
                {activeVertical.questions.filter(q => {
                  if (!q.dependsOn) return true;
                  return answers[q.dependsOn.id] === q.dependsOn.value;
                }).map((q) => (
                  <div key={q.id} className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-8">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 bg-slate-900 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
                        <Activity className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <div className="space-y-4 sm:space-y-6 flex-1">
                        <div className="flex flex-col sm:items-start gap-2 sm:gap-3 group">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">{q.text}</h3>
                            <div className="relative group/hint self-start sm:self-auto">
                              <Info className="w-5 h-5 text-slate-300 hover:text-emerald-500 cursor-help transition-colors" />
                              <div className="absolute bottom-full left-0 sm:left-auto sm:right-0 mb-4 w-[calc(100vw-4rem)] sm:w-72 p-4 sm:p-5 bg-slate-900 text-white text-[11px] rounded-[24px] opacity-0 invisible group-hover/hint:opacity-100 group-hover/hint:visible transition-all z-20 shadow-2xl leading-relaxed font-medium">
                                 <div className="flex items-center gap-2 mb-2 text-emerald-400 font-black uppercase tracking-widest text-[9px]">
                                    <Lightbulb className="w-3 h-3" /> Technical Insight
                                 </div>
                                 {q.hint}
                              </div>
                            </div>
                          </div>
                          {activeVertical.questions.some(otherQ => otherQ.dependsOn?.id === q.id) && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                              <Search className="w-3 h-3" /> Rispondendo Sì, sbloccherai le domande di approfondimento
                            </div>
                          )}
                        </div>

                        <div className="pt-2 sm:pt-6">
                          {q.type === 'likert' && (
                            <div className="flex flex-wrap gap-2 sm:gap-4">
                              {[1, 2, 3, 4, 5].map(val => (
                                <button key={val} onClick={() => updateAnswer(q.id, val)} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 font-black text-lg transition-all flex items-center justify-center ${answers[q.id] === val ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg scale-110' : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:text-emerald-600'}`}>
                                  {val}
                                </button>
                              ))}
                            </div>
                          )}
                          {q.type === 'binary' && (
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                              {[true, false].map(val => (
                                <button key={val.toString()} onClick={() => updateAnswer(q.id, val)} className={`px-8 sm:px-14 py-4 sm:py-5 rounded-xl sm:rounded-[24px] border-2 font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${answers[q.id] === val ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md scale-105' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}>
                                  {val ? 'Sì' : 'No'}
                                </button>
                              ))}
                            </div>
                          )}
                          {q.type === 'single-choice' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              {(q as any).options?.map(opt => (
                                <button key={opt} onClick={() => updateAnswer(q.id, opt)} className={`p-4 sm:p-5 rounded-xl sm:rounded-[24px] border-2 text-left transition-all ${answers[q.id] === opt ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md scale-105' : 'border-slate-50 bg-slate-50 hover:bg-white hover:border-slate-200'}`}>
                                  <span className="text-xs sm:text-sm font-black text-slate-700">{opt}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {q.type === 'multiple-choice' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              {(q as any).options?.map(opt => (
                                <label key={opt} className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-[24px] border-2 cursor-pointer transition-all ${ (answers[q.id] || []).includes(opt) ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md' : 'border-slate-50 bg-slate-50 hover:bg-white hover:border-slate-200' }`}>
                                  <input type="checkbox" checked={(answers[q.id] || []).includes(opt)} onChange={(e) => {
                                    const current = answers[q.id] || [];
                                    const next = e.target.checked ? [...current, opt] : current.filter(x => x !== opt);
                                    updateAnswer(q.id, next);
                                  }} className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg text-emerald-600 focus:ring-emerald-500 border-slate-300" />
                                  <span className="text-xs sm:text-sm font-black text-slate-700">{opt}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-10 sm:pt-16 flex flex-col-reverse sm:flex-row justify-between gap-6 border-t border-slate-100">
                <button 
                  onClick={() => activeVerticalIdx === 0 ? setStep('landing_new') : setActiveVerticalIdx(activeVerticalIdx - 1)} 
                  className="flex items-center justify-center sm:justify-start gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-colors py-4 sm:py-0"
                >
                   <ChevronLeft className="w-4 h-4" /> 
                   {activeVerticalIdx === 0 
                     ? 'Torna alla Selezione' 
                     : `Torna al Modulo ${activeVerticalIdx} (${currentVerticals[activeVerticalIdx - 1].questions.length} Domande)`}
                </button>
                <button 
                  onClick={handleNextVertical} 
                  disabled={activeVertical.questions.filter((q: any) => !q.dependsOn || answers[q.dependsOn.id] === q.dependsOn.value).some((q: any) => answers[q.id] === undefined || (Array.isArray(answers[q.id]) && answers[q.id].length === 0))}
                  className="bg-slate-900 text-white px-8 sm:px-14 py-5 sm:py-6 rounded-full sm:rounded-[30px] font-black text-[10px] sm:text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 sm:gap-4 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {activeVerticalIdx < currentVerticals.length - 1 ? 'Analizza & Procedi' : 'Completa Audit'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <aside className="space-y-8 hidden lg:block">
              <div className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm sticky top-32">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Expert Guidance</h4>
                </div>
                <div className="space-y-8">
                   <div className="p-5 bg-slate-50 rounded-[30px] border border-slate-100">
                      <p className="text-[12px] text-slate-600 leading-relaxed font-bold italic">
                        "L'assessment professionale SUSTI® mappa le evidenze necessarie per l'audit di certificazione GSTC e ISO 21401."
                      </p>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Documentazione Suggerita:</p>
                      <ul className="space-y-3">
                        {['Bilanci di Sostenibilità', 'Certificati Green Energy', 'Mappatura Stakeholder', 'Policy Ambientale'].map(d => (
                           <li key={d} className="flex items-center gap-3 text-[11px] font-black text-slate-700">
                              <div className="w-2 h-2 rounded-full bg-emerald-500"></div> {d}
                           </li>
                        ))}
                      </ul>
                   </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* STEP 2: LEAD FORM (ANAGRAFICA FINALE) */}
        {step === 'lead_form' && (
          <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-8 px-4 sm:px-0">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-600 rounded-[30px] sm:rounded-[40px] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200 mb-6 sm:mb-8 rotate-3">
                <Users className="text-white w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-[0.95]">Il tuo Audit è pronto!</h2>
              <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed italic font-medium">
                Inserisci i tuoi dati per sbloccare il tuo Executive Report personalizzato e scoprire il tuo livello di maturità ESG.
              </p>
            </div>

            <form onSubmit={handleLeadSubmit} className="bg-white p-8 sm:p-14 rounded-[40px] sm:rounded-[70px] shadow-2xl border border-slate-100 space-y-10 sm:space-y-16">
              <div className="space-y-6 sm:space-y-8">
                <div className="flex items-center gap-3 sm:gap-4 text-emerald-600">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em]">I Tuoi Dati</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <input required className="w-full p-5 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-[28px] border border-slate-100 outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold text-sm sm:text-base" placeholder="Nome e Cognome *" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                  <input required type="email" className="w-full p-5 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-[28px] border border-slate-100 outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold text-sm sm:text-base" placeholder="Email professionale *" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  <input required className="w-full p-5 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-[28px] border border-slate-100 outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold text-sm sm:text-base" placeholder="Ruolo aziendale *" value={formData.ruolo} onChange={e => setFormData({...formData, ruolo: e.target.value})} />
                  <input required className="w-full p-5 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-[28px] border border-slate-100 outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold text-sm sm:text-base" placeholder="Denominazione Struttura/Organizzazione *" value={formData.denominazione} onChange={e => setFormData({...formData, denominazione: e.target.value})} />
                  <input type="url" className="w-full p-5 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-[28px] border border-slate-100 outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold text-sm sm:text-base md:col-span-2" placeholder="Sito Web / URL (Opzionale)" value={formData.sitoUrl} onChange={e => setFormData({...formData, sitoUrl: e.target.value})} />
                </div>
              </div>

              <div className="p-8 sm:p-12 bg-slate-900 text-white rounded-[40px] sm:rounded-[60px] space-y-8 sm:space-y-10 shadow-3xl">
                <label className="flex items-start gap-4 sm:gap-5 cursor-pointer group">
                  <input required type="checkbox" className="mt-1 w-5 h-5 sm:w-6 sm:h-6 rounded border-white-20 text-emerald-500 bg-white-10 shrink-0" checked={formData.privacy} onChange={e => setFormData({...formData, privacy: e.target.checked})} />
                  <span className="text-xs sm:text-sm text-slate-400 font-medium group-hover:text-white transition-colors leading-relaxed">
                    Dichiaro di aver letto l’informativa privacy e acconsento al trattamento dei dati personali (GDPR 2016/679) per le finalità di analisi del progetto SUSTI®. *
                  </span>
                </label>
                <label className="flex items-start gap-4 sm:gap-5 cursor-pointer group">
                  <input type="checkbox" className="mt-1 w-5 h-5 sm:w-6 sm:h-6 rounded border-white-20 text-emerald-500 bg-white-10 shrink-0" checked={formData.newsletter} onChange={e => setFormData({...formData, newsletter: e.target.checked})} />
                  <span className="text-xs sm:text-sm text-slate-400 font-medium group-hover:text-white transition-colors leading-relaxed">
                    Desidero iscrivermi alla newsletter per ricevere aggiornamenti su sostenibilità e turismo.
                  </span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <button type="submit" className="w-full bg-emerald-600 text-white py-6 sm:py-8 rounded-full sm:rounded-[40px] font-black text-[10px] sm:text-sm uppercase tracking-[0.3em] sm:tracking-[0.4em] shadow-2xl shadow-emerald-500-20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 sm:gap-5 active:scale-95 flex-1">
                  Genera Report <Activity className="w-5 h-5 sm:w-7 sm:h-7" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PROCESSING */}
        {step === 'processing' && (
          <div className="max-w-md mx-auto py-20 sm:py-40 text-center space-y-8 sm:space-y-10 animate-pulse px-4">
            <div className="relative flex justify-center">
              <div className="w-20 h-20 sm:w-28 sm:h-28 border-[4px] sm:border-[6px] border-slate-100 border-t-emerald-600 rounded-full animate-spin"></div>
              <FileSearch className="absolute inset-0 m-auto w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
            </div>
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tighter">SUSTI® Logic Engine</h2>
              <p className="text-emerald-600 font-black uppercase text-[9px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.3em]">{processingText}</p>
            </div>
          </div>
        )}

        {/* DASHBOARD RISULTATI (EXECUTIVE REPORT) */}
        {step === 'dashboard' && (
          <div id="report-content" className="space-y-10 sm:space-y-16 animate-in fade-in duration-1000 pb-16 sm:pb-24 px-4 sm:px-0 print:p-0 print:space-y-8">
            
            {/* Report Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sm:gap-8 border-b pb-8 sm:pb-12">
              <div className="space-y-3 sm:space-y-4 w-full md:w-auto">
                <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 bg-slate-900 text-white rounded-full text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-xl">
                  Sustainability Executive Report
                </div>
                <h2 className="text-4xl sm:text-7xl font-black text-slate-900 tracking-tighter leading-none italic break-words">
                   {formData.denominazione}
                </h2>
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
                   {formData.sitoUrl && <span className="flex items-center gap-1.5 sm:gap-2"><Globe className="w-3 h-3 sm:w-4 sm:h-4" /> {formData.sitoUrl}</span>}
                   <span className="flex items-center gap-1.5 sm:gap-2"><Calendar className="w-3 h-3 sm:w-4 sm:h-4" /> {new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</span>
                   <span className="flex items-center gap-1.5 sm:gap-2"><FileText className="w-3 h-3 sm:w-4 sm:h-4" /> Ref: SUSTI-EXP-{new Date().getFullYear()}</span>
                </div>
              </div>
              <div className="flex flex-col gap-4 w-full md:w-auto">
                <div className="bg-emerald-600 text-white px-8 sm:px-10 py-5 sm:py-6 rounded-[24px] sm:rounded-[35px] text-center shadow-xl">
                   <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Global Score</p>
                   <p className="text-5xl sm:text-6xl font-black leading-none">{stats.totalScore}<span className="text-xl sm:text-2xl opacity-50">/100</span></p>
                </div>
                <button onClick={handleDownloadPDF} className="print:hidden bg-slate-900 text-white px-6 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg">
                  <Download className="w-4 h-4" /> Scarica come PDF
                </button>
              </div>
            </div>

            {/* Pillar Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-6 sm:gap-8 print-break-inside-avoid">
              {Object.entries(stats.pillarScores).map(([key, score]) => {
                const numScore = Number(score);
                return (
                <div key={key} className={`p-6 sm:p-10 bg-white border ${ESG_MAP[key].border} rounded-[30px] sm:rounded-[50px] shadow-sm space-y-5 sm:space-y-6 hover:shadow-xl transition-all group print:break-inside-avoid`}>
                   <div className="flex justify-between items-start">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 ${ESG_MAP[key].bg} ${ESG_MAP[key].color} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner`}>
                         {key === 'E' ? <Leaf className="w-5 h-5 sm:w-6 sm:h-6" /> : key === 'S' ? <Users className="w-5 h-5 sm:w-6 sm:h-6" /> : <Scale className="w-5 h-5 sm:w-6 sm:h-6" />}
                      </div>
                      <span className={`text-3xl sm:text-4xl font-black ${ESG_MAP[key].color}`}>{numScore}%</span>
                   </div>
                   <div className="space-y-1.5 sm:space-y-2">
                      <h4 className="font-black text-slate-800 text-lg sm:text-xl tracking-tight">{ESG_MAP[key].label} Analysis</h4>
                      <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed font-medium">
                         {numScore > 70 ? 'Eccellenza operativa riscontrata.' : numScore > 40 ? 'Area in fase di consolidamento strategico.' : 'Necessari interventi correttivi immediati.'}
                      </p>
                   </div>
                   <div className="h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden print:border print:border-slate-200">
                      <div className={`h-full ${ESG_MAP[key].color.replace('text', 'bg')} transition-all duration-1000 print:!bg-current`} style={{ width: `${numScore}%` }}></div>
                   </div>
                </div>
              )})}
            </div>

            {/* Radar Chart & Strategy */}
            <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-2 gap-6 sm:gap-10">
               <div className="bg-white p-8 sm:p-14 rounded-[40px] sm:rounded-[70px] shadow-sm border border-slate-100 flex flex-col items-center justify-center print:break-inside-avoid">
                  <h3 className="text-xl font-black text-slate-800 mb-6 w-full text-left">Performance per Modulo</h3>
                  <div className="w-full h-[300px] sm:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.verticalScores}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Radar name="Score" dataKey="A" stroke="#059669" fill="#10b981" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               <div className="bg-slate-900 text-white print:bg-slate-100 print:text-slate-900 p-8 sm:p-14 rounded-[40px] sm:rounded-[70px] space-y-8 sm:space-y-10 shadow-2xl print:shadow-none relative overflow-hidden print:break-inside-avoid">
                  <div className="relative z-10 space-y-6 sm:space-y-8">
                    <div className="flex items-center gap-2 sm:gap-3 text-emerald-400 print:text-emerald-700">
                       <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                       <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">Gap Analysis Tecnica</h4>
                    </div>
                    <h3 className="text-2xl sm:text-4xl font-bold leading-tight italic max-w-md">
                       "Identificato un Gap del {100 - stats.totalScore}% rispetto ai parametri GSTC."
                    </h3>
                    <div className="space-y-4 sm:space-y-6">
                       <div className="flex items-start gap-3 sm:gap-4">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 sm:mt-2 shrink-0"></div>
                          <p className="text-xs sm:text-sm text-slate-400 print:text-slate-700 leading-relaxed">
                             La {auditType === 'hotel' ? 'struttura' : 'destinazione'} presenta una maturità solida ma necessita di formalizzare le policy di **Governance ESG** per accedere alla certificazione.
                          </p>
                       </div>
                       <div className="flex items-start gap-3 sm:gap-4">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 sm:mt-2 shrink-0"></div>
                          <p className="text-xs sm:text-sm text-slate-400 print:text-slate-700 leading-relaxed">
                             Il monitoraggio quantitativo (KPI) è l'area con maggiore potenziale di crescita (+{Math.round(100 - stats.pillarScores.E)}% possibile nel pillar Ambiente).
                          </p>
                       </div>
                    </div>
                  </div>
                  <Award className="absolute -bottom-10 -right-10 w-40 h-40 sm:w-64 sm:h-64 text-emerald-500-5 print:text-emerald-500-10 rotate-12" />
               </div>
            </div>

            {/* Expert System Analysis */}
            <div className="space-y-6 sm:space-y-10 print-break-before">
               <div className="flex items-center gap-3 sm:gap-4 border-b border-slate-200 pb-4 sm:pb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                     <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight">Expert System Analysis</h3>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 print:grid-cols-3 gap-6 sm:gap-8">
                  {/* Maturity Level */}
                  <div className="bg-white p-6 sm:p-10 rounded-[30px] sm:rounded-[40px] border border-slate-100 shadow-sm space-y-6 print:break-inside-avoid">
                     <div className="flex items-center gap-3 text-indigo-600">
                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                        <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">Livello di Maturità</h4>
                     </div>
                     <div className="space-y-2">
                        <div className="text-4xl sm:text-5xl font-black text-slate-900">Level {stats.expertInsights.maturityLevel.level}</div>
                        <div className="text-lg sm:text-xl font-bold text-indigo-600">{stats.expertInsights.maturityLevel.title}</div>
                     </div>
                     <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                        {stats.expertInsights.maturityLevel.desc}
                     </p>
                     <div className="flex gap-1 pt-4">
                        {[1, 2, 3, 4].map(l => (
                           <div key={l} className={`h-2 flex-1 rounded-full ${l <= stats.expertInsights.maturityLevel.level ? 'bg-indigo-600' : 'bg-slate-100'}`}></div>
                        ))}
                     </div>
                  </div>

                  {/* Checklist */}
                  <div className="bg-white p-6 sm:p-10 rounded-[30px] sm:rounded-[40px] border border-slate-100 shadow-sm space-y-6 print:break-inside-avoid">
                     <div className="flex items-center gap-3 text-amber-600">
                        <ListChecks className="w-5 h-5 sm:w-6 sm:h-6" />
                        <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">Action Checklist</h4>
                     </div>
                     <ul className="space-y-4">
                        {stats.expertInsights.checklist.map((item, i) => (
                           <li key={i} className="flex items-start gap-3">
                              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                                 <AlertCircle className="w-3 h-3" />
                              </div>
                              <span className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">{item}</span>
                           </li>
                        ))}
                     </ul>
                  </div>

                  {/* Performance Metrics */}
                  <div className="bg-slate-900 text-white p-6 sm:p-10 rounded-[30px] sm:rounded-[40px] shadow-xl space-y-6 print:bg-slate-50 print:text-slate-900 print:border print:border-slate-200 print:shadow-none print:break-inside-avoid">
                     <div className="flex items-center gap-3 text-emerald-400 print:text-emerald-600">
                        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
                        <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">Performance Metrics</h4>
                     </div>
                     <div className="space-y-5">
                        {stats.expertInsights.metrics.map((metric, i) => (
                           <div key={i} className="flex justify-between items-center border-b border-slate-800 print:border-slate-200 pb-4 last:border-0 last:pb-0">
                              <span className="text-[10px] sm:text-xs font-bold text-slate-400 print:text-slate-500 uppercase tracking-wider">{metric.label}</span>
                              <span className="text-sm sm:text-base font-black text-white print:text-slate-900">{metric.value}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* Calendar Booking */}
            <div className="bg-white border border-slate-100 rounded-[40px] sm:rounded-[80px] p-8 sm:p-16 shadow-sm relative overflow-hidden print:hidden text-center">
               <div className="max-w-3xl mx-auto space-y-6">
                  <div className="w-16 h-16 mx-auto bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                     <Calendar className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">Prenota una Consulenza Gratuita</h3>
                  <p className="text-slate-500 font-medium text-lg">
                     Discuti i risultati del tuo audit con un nostro esperto ESG e scopri come possiamo supportarti nel percorso di sostenibilità.
                  </p>
                  <button 
                     onClick={() => setShowCalendar(true)} 
                     className="mt-8 bg-emerald-600 text-white px-8 sm:px-12 py-5 sm:py-6 rounded-full sm:rounded-[32px] font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-2xl hover:bg-emerald-700 hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2 sm:gap-3 mx-auto"
                  >
                     Scegli Data e Ora <ArrowRight className="w-4 h-4" />
                  </button>
               </div>
            </div>

            {/* Lead Magnet Action Plan */}
            <div className="print:hidden bg-emerald-700 rounded-[40px] sm:rounded-[80px] p-8 sm:p-16 text-white shadow-3xl relative overflow-hidden">
               <div className="relative z-10 max-w-5xl mx-auto space-y-12">
                  <div className="text-center space-y-6">
                     <h3 className="text-3xl sm:text-5xl font-black leading-[0.95] tracking-tight">Scarica il tuo Piano d'Azione Personalizzato</h3>
                     <p className="text-base sm:text-xl text-emerald-50-80 leading-relaxed font-medium max-w-3xl mx-auto">
                        Ottieni subito un documento strategico gratuito con le prime azioni pratiche da implementare per migliorare il tuo rating ESG e avviare il percorso verso la certificazione.
                     </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
                     {/* Value Proposition */}
                     <div className="space-y-6">
                        <div className="bg-white-10 backdrop-blur-md rounded-[30px] p-8 border border-white-20">
                           <h4 className="text-xl font-black mb-6 flex items-center gap-3">
                              <Target className="w-6 h-6 text-emerald-300" /> Cosa troverai nel Piano
                           </h4>
                           <ul className="space-y-4">
                              {[
                                 "Analisi delle priorità d'intervento",
                                 "Quick wins: azioni a costo zero da fare subito",
                                 "Roadmap di implementazione a 6 mesi",
                                 "KPI fondamentali da monitorare",
                                 "Linee guida per coinvolgere lo staff"
                              ].map((item, i) => (
                                 <li key={i} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                                    <span className="text-sm font-medium text-emerald-50">{item}</span>
                                 </li>
                              ))}
                           </ul>
                        </div>
                     </div>

                     {/* Download CTA */}
                     <div className="flex flex-col items-center justify-center space-y-6 text-center bg-white-5 backdrop-blur-sm rounded-[30px] p-8 sm:p-12 border border-white-10">
                        <div className="w-20 h-20 bg-emerald-500-20 rounded-full flex items-center justify-center mb-2">
                           <Download className="w-10 h-10 text-emerald-300" />
                        </div>
                        <h4 className="text-2xl font-black">Pronto per iniziare?</h4>
                        <p className="text-sm text-emerald-100-80 font-medium">
                           Scarica il PDF gratuito e inizia subito a migliorare la sostenibilità della tua organizzazione.
                        </p>
                        <button onClick={handleDownloadPDF} className="w-full bg-white text-emerald-900 px-8 py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-transform active:scale-95 flex items-center justify-center gap-3 mt-4">
                           Scarica come PDF <ArrowRight className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               </div>
               <div className="absolute top-0 left-0 w-40 h-40 sm:w-64 sm:h-64 bg-white-10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
               <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-emerald-400-20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
            </div>

            <div className="text-center px-4 print:hidden space-y-6">
              <button 
                onClick={async () => {
                  if (user) {
                    if (!journey) {
                      try {
                        const newJourney = {
                          userId: user.uid,
                          type: auditType || 'hotel',
                          currentMilestone: 0,
                          statusList: {},
                          adminNotes: '',
                          sharedDocs: [],
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        };
                        await setDoc(doc(db, 'journeys', user.uid), newJourney);
                        setJourney({ id: user.uid, ...newJourney });
                      } catch (error) {
                        console.error("Error creating journey:", error);
                      }
                    }
                    setStep('journey');
                  } else {
                    setStep('auth_wall');
                  }
                }}
                className="bg-emerald-600 text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto"
              >
                Inizia il tuo Percorso di Certificazione <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => { setStep('landing_new'); setAnswers({}); setActiveVerticalIdx(0); setAuditType(null); setLastAuditStep(null); }} className="block mx-auto text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-slate-300 hover:text-emerald-600 transition-colors underline underline-offset-[8px] sm:underline-offset-[12px] decoration-slate-100">Inizia Nuovo Audit Professionale</button>
            </div>
          </div>
        )}

        {/* AUTH WALL */}
        {step === 'auth_wall' && (
          <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-[40px] shadow-xl border border-slate-100 text-center animate-in fade-in slide-in-from-bottom-8">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BrainCircuit className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Accedi al tuo Percorso</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Inserisci l'indirizzo email che hai utilizzato al termine dell'audit per accedere alla tua Roadmap di Certificazione.
            </p>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const dummyPassword = loginEmail + "_SustiAuth!";
                  let userCredential;
                  try {
                    userCredential = await signInWithEmailAndPassword(auth, loginEmail, dummyPassword);
                  } catch (err: any) {
                    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                      userCredential = await createUserWithEmailAndPassword(auth, loginEmail, dummyPassword);
                    } else {
                      throw err;
                    }
                  }
                  await handleUserLoginSetup(userCredential.user, loginEmail, 'Utente', 'Azienda non specificata');
                  setStep('journey');
                } catch (error) {
                  console.error("Login error:", error);
                  alert("Errore durante l'accesso. Assicurati di aver abilitato Email/Password in Firebase.");
                }
              }}
              className="space-y-4"
            >
              <input 
                type="email" 
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="La tua email professionale..."
                className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold text-sm text-center"
              />
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
              >
                Accedi <ArrowRight className="w-5 h-5" />
              </button>
            </form>
            <button 
              onClick={() => setStep('corporate')}
              className="mt-6 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest underline underline-offset-4"
            >
              Torna alla Home
            </button>
          </div>
        )}

        {/* ACTIVE JOURNEY */}
        {step === 'journey' && !journey && (
          <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-[40px] shadow-xl border border-slate-100 text-center animate-in fade-in">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Caricamento Percorso...</h2>
            <p className="text-slate-500 text-sm">Stiamo recuperando i tuoi dati.</p>
          </div>
        )}
        
        {step === 'journey' && journey && (
          <div className="space-y-12 animate-in fade-in duration-1000 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                  <Rocket className="w-3.5 h-3.5" /> Certification Roadmap
                </div>
                <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter leading-none">
                  Il tuo Percorso
                </h2>
                <p className="text-slate-500 font-medium">
                  Monitora i progressi verso la certificazione di sostenibilità.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => signOut(auth).then(() => { setStep('corporate'); setJourney(null); })}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                >
                  Esci
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_350px] gap-8">
              <div className="space-y-6">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Milestones</h3>
                
                {journey.currentMilestone === 0 && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 mb-8 text-center shadow-sm">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3">Inizia il tuo percorso</h3>
                    <p className="text-slate-600 mb-8 max-w-md mx-auto">
                      Hai completato l'audit iniziale. Il prossimo passo è fissare una call gratuita con i nostri esperti per definire il piano d'azione personalizzato e il preventivo.
                    </p>
                    
                    {!journey.quoteRequested ? (
                      <button 
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, 'journeys', journey.id), {
                              quoteRequested: true,
                              quoteRequestedAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString()
                            });
                            setJourney({ ...journey, quoteRequested: true, quoteRequestedAt: new Date().toISOString() });
                          } catch (error) {
                            console.error("Error requesting quote:", error);
                            alert("Errore durante l'invio della richiesta. Riprova.");
                          }
                        }}
                        className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center mx-auto"
                      >
                        Richiedi Appuntamento Gratuito
                      </button>
                    ) : (
                      <div className="inline-flex items-center justify-center text-emerald-700 font-bold bg-emerald-100/50 py-4 px-8 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-6 h-6 mr-3 text-emerald-600" />
                        Richiesta inviata! Ti contatteremo a breve.
                      </div>
                    )}
                  </div>
                )}
                
                {generateMilestones(journey.type, null).map((milestone, idx) => {
                  const status = journey.statusList[milestone.id] || 'not_started';
                  const isCurrent = journey.currentMilestone === idx;
                  const isLocked = journey.currentMilestone === 0 && idx > 0;
                  
                  return (
                    <div key={milestone.id} className={`p-6 rounded-3xl border-2 transition-all ${isCurrent ? 'border-emerald-500 bg-emerald-50/50 shadow-md' : isLocked ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-slate-100 bg-white'}`}>
                      <div className="flex flex-col sm:flex-row gap-6 items-start">
                        <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-black text-lg ${status === 'completed' ? 'bg-emerald-600 text-white' : isCurrent ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                          {status === 'completed' ? <ListChecks className="w-6 h-6" /> : idx}
                        </div>
                        <div className="flex-1 space-y-3 w-full">
                          <div className="flex flex-wrap justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h4 className="text-xl font-bold text-slate-900">{milestone.label}</h4>
                                {isLocked && <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">Bloccato</span>}
                              </div>
                              <p className="text-sm text-slate-500 mt-1">{milestone.desc}</p>
                            </div>
                            
                            {!isLocked && idx > 0 && (
                              <select 
                                value={status}
                                onChange={async (e) => {
                                const newStatus = e.target.value;
                                const newStatusList = { ...journey.statusList, [milestone.id]: newStatus };
                                
                                // Calculate new current milestone
                                let newCurrent = journey.currentMilestone;
                                if (newStatus === 'completed' && isCurrent) {
                                  newCurrent = idx + 1;
                                }
                                
                                const updatedJourney = { 
                                  ...journey, 
                                  statusList: newStatusList,
                                  currentMilestone: newCurrent,
                                  updatedAt: new Date().toISOString()
                                };
                                
                                setJourney(updatedJourney);
                                try {
                                  await updateDoc(doc(db, 'journeys', user.uid), {
                                    statusList: newStatusList,
                                    currentMilestone: newCurrent,
                                    updatedAt: new Date().toISOString()
                                  });
                                } catch (error) {
                                  console.error("Error updating milestone:", error);
                                }
                              }}
                              className={`text-xs font-bold uppercase tracking-widest rounded-full px-4 py-2 border-0 outline-none cursor-pointer ${
                                status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                                status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 
                                'bg-slate-100 text-slate-500'
                              }`}
                            >
                              <option value="not_started">Da Iniziare</option>
                              <option value="in_progress">In Corso</option>
                              <option value="completed">Completato</option>
                            </select>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-8">
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
                  <h3 className="text-xl font-black tracking-tight mb-6 flex items-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-400" /> Documenti Condivisi
                  </h3>
                  {journey.sharedDocs && journey.sharedDocs.length > 0 ? (
                    <ul className="space-y-3 mb-6">
                      {journey.sharedDocs.map((docUrl, i) => (
                        <li key={i}>
                          <a href={docUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-colors bg-white/5 p-3 rounded-xl hover:bg-white/10">
                            <Download className="w-4 h-4" /> Documento {i + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/10 border-dashed mb-6">
                      <p className="text-sm text-slate-400">Nessun documento condiviso al momento.</p>
                    </div>
                  )}
                  
                  <a 
                    href="mailto:info@territorisostenibili.it?subject=Invio%20Documenti%20Certificazione"
                    className="w-full bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4 rotate-180" /> Invia Documenti
                  </a>
                </div>

                <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mb-4 flex items-center gap-3">
                    <BrainCircuit className="w-5 h-5 text-emerald-600" /> Feedback Expert
                  </h3>
                  {journey.adminNotes ? (
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {journey.adminNotes}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500 italic">
                      Il team di Territori Sostenibili aggiungerà qui note e suggerimenti per il tuo percorso.
                    </p>
                  )}
                </div>
                
                <button 
                  onClick={() => setShowCalendar(true)}
                  className="w-full bg-white border-2 border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" /> Fissa una Call
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN DASHBOARD */}
        {step === 'admin_dashboard' && user?.role === 'admin' && (
          <div className="space-y-12 animate-in fade-in duration-1000 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                  <BrainCircuit className="w-3.5 h-3.5" /> Admin Panel
                </div>
                <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter leading-none">
                  Gestione Utenti
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setStep('corporate')}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                >
                  Torna alla Home
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">Utente</th>
                      <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">Azienda</th>
                      <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">Tipo</th>
                      <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest">Milestone</th>
                      <th className="p-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminUsers.map(u => {
                      const userJourney = adminJourneys.find(j => j.userId === u.id);
                      return (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-6">
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-sm text-slate-500">{u.email}</div>
                          </td>
                          <td className="p-6 font-medium text-slate-700">{u.companyName}</td>
                          <td className="p-6">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                              {u.profileType}
                            </span>
                          </td>
                          <td className="p-6">
                            {userJourney ? (
                              <div className="flex flex-col gap-2 items-start">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                                    {userJourney.currentMilestone}
                                  </div>
                                  <span className="text-sm font-medium text-slate-600">di 5</span>
                                </div>
                                {userJourney.quoteRequested && userJourney.currentMilestone === 0 && (
                                  <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest flex items-center">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Richiesta Call
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400 italic">Nessun percorso</span>
                            )}
                          </td>
                          <td className="p-6 text-right">
                            <button 
                              onClick={() => {
                                if (userJourney) {
                                  setSelectedAdminJourney({ user: u, journey: userJourney });
                                } else {
                                  alert("L'utente non ha ancora iniziato un percorso.");
                                }
                              }}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
                            >
                              Dettagli
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {adminUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                          Nessun utente registrato.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedAdminJourney && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Gestione Percorso</h3>
                      <p className="text-sm text-slate-500">{selectedAdminJourney.user.name} - {selectedAdminJourney.user.companyName}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedAdminJourney(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      Chiudi
                    </button>
                  </div>
                  <div className="p-8 space-y-6">
                    {selectedAdminJourney.journey.quoteRequested && selectedAdminJourney.journey.currentMilestone === 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                          <h4 className="text-amber-900 font-bold flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            Richiesta Appuntamento Ricevuta
                          </h4>
                          <p className="text-sm text-amber-700 mt-1">L'utente ha richiesto una call conoscitiva per il preventivo.</p>
                        </div>
                        <button 
                          onClick={async () => {
                            try {
                              const newStatusList = { ...selectedAdminJourney.journey.statusList, 'm0': 'completed' };
                              await updateDoc(doc(db, 'journeys', selectedAdminJourney.journey.id), {
                                currentMilestone: 1,
                                statusList: newStatusList,
                                updatedAt: new Date().toISOString()
                              });
                              
                              const updatedJourney = { 
                                ...selectedAdminJourney.journey, 
                                currentMilestone: 1,
                                statusList: newStatusList
                              };
                              
                              setSelectedAdminJourney({ ...selectedAdminJourney, journey: updatedJourney });
                              setAdminJourneys(adminJourneys.map(j => j.id === updatedJourney.id ? updatedJourney : j));
                              
                              alert("Contratto attivato! L'utente è passato alla Fase 1.");
                            } catch (error) {
                              console.error("Error updating contract status:", error);
                              alert("Errore durante l'aggiornamento.");
                            }
                          }}
                          className="bg-amber-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-600 transition-colors whitespace-nowrap"
                        >
                          Segna come Contrattualizzato
                        </button>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Avanzamento Manuale Milestone</label>
                      <select 
                        className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                        value={selectedAdminJourney.journey.currentMilestone}
                        onChange={(e) => {
                          const newMilestone = parseInt(e.target.value);
                          setSelectedAdminJourney({
                            ...selectedAdminJourney,
                            journey: { ...selectedAdminJourney.journey, currentMilestone: newMilestone }
                          });
                        }}
                      >
                        {generateMilestones(selectedAdminJourney.journey.type, null).map((m, idx) => (
                          <option key={m.id} value={idx}>{idx}. {m.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Note per l'utente</label>
                      <textarea 
                        className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        rows={4}
                        value={selectedAdminJourney.journey.adminNotes || ''}
                        onChange={(e) => {
                          setSelectedAdminJourney({
                            ...selectedAdminJourney,
                            journey: { ...selectedAdminJourney.journey, adminNotes: e.target.value }
                          });
                        }}
                        placeholder="Inserisci feedback o suggerimenti visibili all'utente..."
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Link Documenti (uno per riga)</label>
                      <textarea 
                        className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        rows={3}
                        value={(selectedAdminJourney.journey.sharedDocs || []).join('\n')}
                        onChange={(e) => {
                          const docs = e.target.value.split('\n').filter(l => l.trim() !== '');
                          setSelectedAdminJourney({
                            ...selectedAdminJourney,
                            journey: { ...selectedAdminJourney.journey, sharedDocs: docs }
                          });
                        }}
                        placeholder="https://drive.google.com/..."
                      ></textarea>
                    </div>
                    <div className="pt-4 flex justify-end">
                      <button 
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, 'journeys', selectedAdminJourney.journey.id), {
                              adminNotes: selectedAdminJourney.journey.adminNotes,
                              sharedDocs: selectedAdminJourney.journey.sharedDocs,
                              currentMilestone: selectedAdminJourney.journey.currentMilestone,
                              updatedAt: new Date().toISOString()
                            });
                            
                            // Update local state
                            setAdminJourneys(adminJourneys.map(j => 
                              j.id === selectedAdminJourney.journey.id ? selectedAdminJourney.journey : j
                            ));
                            
                            alert("Percorso aggiornato con successo.");
                            setSelectedAdminJourney(null);
                          } catch (error) {
                            console.error("Error updating journey:", error);
                            alert("Errore durante l'aggiornamento.");
                          }
                        }}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-emerald-700 transition-colors"
                      >
                        Salva Modifiche
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LANDING PAGE EXPERT */}
        {step === 'landing' && (
          <div className="animate-in fade-in duration-1000 space-y-20 sm:space-y-32 py-8 sm:py-12 px-4 sm:px-0">
            <section className="text-center space-y-8 sm:space-y-10 max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-1.5 sm:py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">Expert Consulting</div>
              <h2 className="text-5xl sm:text-8xl font-black text-slate-900 leading-[0.85] tracking-tighter">
                Il tuo Partner per il Turismo Sostenibile.
              </h2>
              <p className="text-lg sm:text-2xl text-slate-500 leading-relaxed font-medium max-w-3xl mx-auto italic">
                Accompagniamo {auditType === 'hotel' ? 'strutture' : 'destinazioni'} d'eccellenza in un percorso di validazione tramite standard GSTC e ISO.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 pt-6 sm:pt-10">
                <button onClick={() => setShowCalendar(true)} className="bg-slate-900 text-white px-8 sm:px-14 py-5 sm:py-7 rounded-full sm:rounded-[35px] font-black text-[10px] sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-2xl hover:-translate-y-1 transition-all">Parla con un Consulente Expert</button>
                <button onClick={() => setStep('dashboard')} className="px-8 sm:px-14 py-5 sm:py-7 rounded-full sm:rounded-[35px] font-black text-[10px] sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] border-2 border-slate-200 hover:bg-slate-50 transition-all">Torna al Report</button>
              </div>
            </section>
            
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                { title: "Analisi di Vulnerabilità", desc: "Studiamo le specialità del territorio per definire obiettivi realizzabili.", icon: <Search className="w-6 h-6 sm:w-8 sm:h-8" /> },
                { title: "Piani di Sviluppo ESG", desc: "Strategie di crescita sostenibile per aumentare il valore dei servizi.", icon: <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" /> },
                { title: "Accompagnamento ISO", desc: "Ti guidiamo nell'ottenimento e mantenimento delle certificazioni.", icon: <ClipboardCheck className="w-6 h-6 sm:w-8 sm:h-8" /> }
              ].map((serv, i) => (
                <div key={i} className="p-8 sm:p-12 bg-white border border-slate-100 rounded-[40px] sm:rounded-[60px] shadow-xl hover:-translate-y-2 transition-transform">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-900 mb-6 sm:mb-8 shadow-inner">{serv.icon}</div>
                  <h4 className="text-lg sm:text-xl font-black mb-3 sm:mb-4 uppercase tracking-tighter">{serv.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-bold">{serv.desc}</p>
                </div>
              ))}
            </section>
          </div>
        )}

      </main>

      <footer className="text-center py-12 sm:py-20 print:py-8 border-t border-slate-100 mt-16 sm:mt-24 print:mt-8 px-4">
         <div className="flex justify-center mb-8">
           <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setStep('corporate')}>
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black italic shadow-xl text-lg">TS</div>
              <div className="flex flex-col leading-none text-left">
                 <span className="text-slate-900 font-black text-xl tracking-tight leading-none">Territori Sostenibili</span>
                 <span className="text-emerald-600 font-bold text-[10px] tracking-widest uppercase mt-1">Società Benefit</span>
              </div>
           </div>
         </div>
         <p className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] sm:tracking-[0.6em]">Milano — territorisostenibili.it</p>
         <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-10 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3"/> GSTC Recognized</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3"/> ISO 21401 Alignment</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3"/> ESG Methodology v2.0</span>
         </div>
      </footer>

      {/* Calendar Popup Modal */}
      {showCalendar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900-80 backdrop-blur-sm print:hidden">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[30px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 sm:p-8 border-b border-slate-100">
              <div className="flex items-center gap-3 text-emerald-600">
                <Calendar className="w-6 h-6" />
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Prenota Consulenza</h3>
              </div>
              <button 
                onClick={() => setShowCalendar(false)}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors"
              >
                <span className="text-xl font-black leading-none">&times;</span>
              </button>
            </div>
            <div className="flex-1 w-full bg-slate-50">
              <iframe 
                src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0JYs3FiG71XQcDnADGbHS8SrdSlbLYysBwdDihAYKzbuhL5pjbBeqE_c0W1WoT3gZ6_wrK1q7F?gv=true" 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                title="Prenota Appuntamento"
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
