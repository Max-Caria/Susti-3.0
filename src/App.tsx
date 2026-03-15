import React, { useState, useMemo, useEffect } from 'react';
import { 
  Leaf, Users, Globe, ShieldCheck, BarChart3, ArrowRight, Target, Zap, 
  CheckCircle2, ChevronLeft, ChevronRight, FileText, 
  Award, Droplets, Trash2, Bike, HeartHandshake, Landmark, Info,
  Activity, ClipboardCheck, Scale, FileSignature, Briefcase, 
  GraduationCap, MapPin, Building2, Hotel, Map, Mail, Phone, MessageSquare, Search,
  Eye, Thermometer, Recycle, Waves, Heart, AlertTriangle, Lightbulb, TrendingUp,
  FileSearch, ListChecks, Calendar, Rocket, Download
} from 'lucide-react';
import { auth, db } from './firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { VERTICALS_HOTEL, VERTICALS_DEST } from './data/questions';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

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

// --- DATABASE INTEGRALE ---
export default function App() {
  const [step, setStep] = useState('corporate'); 
  const [auditType, setAuditType] = useState(null); 
  const [activeVerticalIdx, setActiveVerticalIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [formData, setFormData] = useState({
    nome: '', ruolo: '', denominazione: '', sitoUrl: '', email: '', privacy: false, newsletter: false
  });
  const [processingText, setProcessingText] = useState('');

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

    return { totalScore, pillarScores, answeredCount: count, verticalScores };
  }, [answers, currentVerticals]);

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
      <nav className="print:hidden h-16 sm:h-20 border-b bg-white/90 backdrop-blur-md sticky top-0 z-50 flex items-center px-4 sm:px-8 justify-between">
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setStep('corporate')}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-900 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="text-white w-4 h-4 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="font-black text-lg sm:text-xl tracking-tight block leading-none italic">SUSTI<span className="text-emerald-600">.</span>Expert</span>
            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Intelligent Audit Engine</span>
          </div>
        </div>
        {step === 'audit' && currentVerticals && (
          <div className="flex items-center gap-3 sm:gap-6">
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
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 print:p-0 print:max-w-none">

        {/* LANDING PAGE CORPORATE */}
        {step === 'corporate' && (
          <div className="space-y-20 animate-in fade-in duration-1000">
            {/* Hero Section */}
            <div className="text-center space-y-8 max-w-4xl mx-auto pt-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100">
                <Leaf className="w-3.5 h-3.5" /> Società Benefit
              </div>
              <h1 className="text-5xl sm:text-7xl font-black text-slate-900 leading-[0.9] tracking-tighter">
                Territori Sostenibili
              </h1>
              <p className="text-xl sm:text-2xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
                Oltre 10 anni di esperienza nello sviluppo di strategie di turismo sostenibile per valorizzare imprese turistiche, amministrazioni pubbliche, consorzi e DMO.
              </p>
              <p className="text-lg text-slate-500 max-w-3xl mx-auto leading-relaxed">
                Affianchiamo i nostri Clienti in tutte le fasi del loro percorso per programmare, realizzare e rendicontare iniziative di sostenibilità, promuovendo un turismo responsabile e duraturo. Il nostro obiettivo è migliorare la competitività dei territori e generare un impatto positivo sul benessere delle comunità locali.
              </p>
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
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full">Turismo Sostenibile</span>
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
                <div className="pt-4">
                  <button onClick={() => setStep('landing_new')} className="bg-emerald-600 text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3">
                    Inizia l'Assessment SUSTI® <ArrowRight className="w-5 h-5" />
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
                        <span className="text-xl font-black text-emerald-600/50">{item.step}</span>
                        <p className="text-slate-700 font-medium pt-0.5">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <Target className="absolute -bottom-10 -right-10 w-64 h-64 text-emerald-600/5 rotate-12" />
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
              <h1 className="text-5xl sm:text-7xl font-black text-slate-900 leading-[0.9] tracking-tighter">
                SUSTI®
              </h1>
              <p className="text-lg sm:text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
                Strumento innovativo gratuito di autovalutazione del rating di sostenibilità e qualità sviluppato da Territori Sostenibili per supportare le organizzazioni nel misurare e migliorare le proprie performance di sostenibilità.
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
                  onClick={() => activeVerticalIdx === 0 ? setStep('selection') : setActiveVerticalIdx(activeVerticalIdx - 1)} 
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
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-[0.95]">Ottieni i Risultati</h2>
              <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed italic font-medium">
                Inserisci i tuoi dati per visualizzare il report e ricevere il contatto dal nostro Team Territori Sostenibili.
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
                  <input required type="checkbox" className="mt-1 w-5 h-5 sm:w-6 sm:h-6 rounded border-white/20 text-emerald-500 bg-white/10 shrink-0" checked={formData.privacy} onChange={e => setFormData({...formData, privacy: e.target.checked})} />
                  <span className="text-xs sm:text-sm text-slate-400 font-medium group-hover:text-white transition-colors leading-relaxed">
                    Dichiaro di aver letto l’informativa privacy e acconsento al trattamento dei dati personali (GDPR 2016/679) per le finalità di analisi del progetto SUSTI®. *
                  </span>
                </label>
                <label className="flex items-start gap-4 sm:gap-5 cursor-pointer group">
                  <input type="checkbox" className="mt-1 w-5 h-5 sm:w-6 sm:h-6 rounded border-white/20 text-emerald-500 bg-white/10 shrink-0" checked={formData.newsletter} onChange={e => setFormData({...formData, newsletter: e.target.checked})} />
                  <span className="text-xs sm:text-sm text-slate-400 font-medium group-hover:text-white transition-colors leading-relaxed">
                    Desidero iscrivermi alla newsletter per ricevere aggiornamenti su sostenibilità e turismo.
                  </span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <button type="submit" className="w-full bg-emerald-600 text-white py-6 sm:py-8 rounded-full sm:rounded-[40px] font-black text-[10px] sm:text-sm uppercase tracking-[0.3em] sm:tracking-[0.4em] shadow-2xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 sm:gap-5 active:scale-95 flex-1">
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
          <div className="space-y-10 sm:space-y-16 animate-in fade-in duration-1000 pb-16 sm:pb-24 px-4 sm:px-0 print:p-0 print:space-y-8">
            
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
                <div className="bg-emerald-600 text-white px-8 sm:px-10 py-5 sm:py-6 rounded-[24px] sm:rounded-[35px] text-center shadow-xl shadow-emerald-100">
                   <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Global Score</p>
                   <p className="text-5xl sm:text-6xl font-black leading-none">{stats.totalScore}<span className="text-xl sm:text-2xl opacity-50">/100</span></p>
                </div>
                <button onClick={() => window.print()} className="print:hidden bg-slate-900 text-white px-6 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg">
                  <Download className="w-4 h-4" /> Scarica Audit
                </button>
              </div>
            </div>

            {/* Pillar Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-6 sm:gap-8">
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
                  <Award className="absolute -bottom-10 -right-10 w-40 h-40 sm:w-64 sm:h-64 text-emerald-500/5 print:text-emerald-500/10 rotate-12" />
               </div>

               <div className="bg-white border border-slate-100 p-8 sm:p-14 rounded-[40px] sm:rounded-[70px] space-y-8 sm:space-y-10 shadow-sm print:break-inside-avoid">
                  <div className="flex items-center gap-2 sm:gap-3 text-emerald-600">
                     <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
                     <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">Roadmap Strategica 2024/25</h4>
                  </div>
                  <div className="space-y-8">
                     {[
                        { step: "01", title: "Assessment Documentale", desc: "Validazione delle evidenze per i criteri Consolidati." },
                        { step: "02", title: "Audit di Terza Parte", desc: "Avvio del percorso di certificazione ISO/GSTC." },
                        { step: "03", title: "Rendicontazione ESG", desc: "Pubblicazione del primo Report di Sostenibilità ufficiale." }
                     ].map((item) => (
                        <div key={item.step} className="flex gap-6 group">
                           <span className="text-3xl font-black text-slate-100 group-hover:text-emerald-500 transition-colors">{item.step}</span>
                           <div className="space-y-1">
                              <h5 className="font-black text-slate-800 text-sm uppercase tracking-widest">{item.title}</h5>
                              <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Upsell Professional Kit */}
            <div className="print:hidden bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[40px] sm:rounded-[80px] p-8 sm:p-16 text-center text-white space-y-8 sm:space-y-10 shadow-3xl shadow-emerald-100 relative overflow-hidden">
               <div className="relative z-10 max-w-3xl mx-auto space-y-6 sm:space-y-8">
                  <h3 className="text-3xl sm:text-5xl font-black leading-[0.95] tracking-tight">Sblocca il KIT Professionale per la Certificazione.</h3>
                  <p className="text-base sm:text-xl text-emerald-50/80 leading-relaxed font-medium">
                     Ottieni i modelli documentali, le checklist di pre-audit e il supporto tecnico di Territori Sostenibili per rendere la tua realtà certificabile **ISO 21401** o **GSTC**.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-5 pt-4">
                     <button onClick={() => setStep('landing')} className="bg-white text-emerald-900 px-8 sm:px-12 py-5 sm:py-6 rounded-full sm:rounded-[32px] font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-2xl hover:scale-105 transition-transform active:scale-95 flex items-center justify-center gap-2 sm:gap-3">
                        Configura Kit ISO/GSTC <ArrowRight className="w-4 h-4" />
                     </button>
                     <button onClick={() => window.print()} className="bg-emerald-900/30 text-white px-8 sm:px-12 py-5 sm:py-6 rounded-full sm:rounded-[32px] font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:bg-emerald-900/50 transition-all border border-white/10 backdrop-blur-md">
                        Scarica Anteprima PDF
                     </button>
                  </div>
               </div>
               <div className="absolute top-0 left-0 w-40 h-40 sm:w-64 sm:h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
               <div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-emerald-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
            </div>

            <div className="text-center px-4 print:hidden">
              <button onClick={() => { setStep('selection'); setAnswers({}); setActiveVerticalIdx(0); }} className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-slate-300 hover:text-emerald-600 transition-colors underline underline-offset-[8px] sm:underline-offset-[12px] decoration-slate-100">Inizia Nuovo Audit Professionale</button>
            </div>
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
                <button className="bg-slate-900 text-white px-8 sm:px-14 py-5 sm:py-7 rounded-full sm:rounded-[35px] font-black text-[10px] sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-2xl hover:-translate-y-1 transition-all">Parla con un Consulente Expert</button>
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
         <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 opacity-40 grayscale group hover:opacity-100 hover:grayscale-0 transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-[14px] sm:text-[16px] font-black italic shadow-xl">TS</div>
            <span className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-slate-900 text-center">Territori Sostenibili Benefit S.r.l.</span>
         </div>
         <p className="text-[9px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-[0.4em] sm:tracking-[0.6em]">Milano — territorisostenibili.it</p>
         <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-10 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
            <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3"/> GSTC Recognized</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3"/> ISO 21401 Alignment</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3"/> ESG Methodology v2.0</span>
         </div>
      </footer>
    </div>
  );
}
