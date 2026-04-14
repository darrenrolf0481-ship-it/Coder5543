import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  Play, 
  Activity, 
  Zap, 
  FileSearch, 
  Database, 
  Sparkles,
  Gauge,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Maximize2,
  Layers,
  Brain
} from 'lucide-react';

const CodeBattleground: React.FC = () => {
  const [codeA, setCodeA] = useState('def slow_sum(n):\n    result = 0\n    for i in range(n):\n        result += i\n    return result');
  const [codeB, setCodeB] = useState('def fast_sum(n):\n    return (n * (n - 1)) // 2');
  
  const [statusA, setStatusA] = useState<{status: string, msg: string} | null>(null);
  const [statusB, setStatusB] = useState<{status: string, msg: string} | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [benchmark, setBenchmark] = useState<any>(null);
  const [algoSearch, setAlgoSearch] = useState('');
  const [algoResults, setAlgoResults] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryAlgos, setCategoryAlgos] = useState<any[]>([]);
  const [activeEditor, setActiveEditor] = useState<'A' | 'B'>('A');

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:8001/api/algo/categories');
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (err) {}
  };

  const fetchCategoryAlgos = async (cat: string) => {
    setSelectedCategory(cat);
    if (!cat) {
      setCategoryAlgos([]);
      return;
    }
    try {
      const res = await fetch(`http://localhost:8001/api/algo/list?category=${encodeURIComponent(cat)}`);
      const data = await res.json();
      if (Array.isArray(data)) setCategoryAlgos(data);
    } catch (err) {}
  };

  const validateCode = async (code: string, side: 'A' | 'B') => {
    try {
      const res = await fetch('http://localhost:8001/api/validate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (side === 'A') setStatusA(data);
      else setStatusB(data);
    } catch (err) {}
  };

  const runBenchmark = async () => {
    setIsProcessing(true);
    try {
      // Test both with a range sum input
      const testCodeA = `${codeA}\nslow_sum(1000)`;
      const testCodeB = `${codeB}\nfast_sum(1000)`;
      
      const res = await fetch('http://localhost:8001/api/benchmark', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          code1: testCodeA,
          code2: testCodeB,
          iterations: 10000
        })
      });
      const data = await res.json();
      setBenchmark(data);
    } catch (err) {}
    setIsProcessing(false);
  };

  const searchAlgos = async (q: string) => {
    setAlgoSearch(q);
    if (q.length < 2) {
      setAlgoResults([]);
      return;
    }
    try {
      const res = await fetch(`http://localhost:8001/api/algo/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setAlgoResults(data);
    } catch (err) {}
  };

  const loadAlgo = async (path: string) => {
    try {
      const res = await fetch(`http://localhost:8001/api/algo/get?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.content) {
        if (activeEditor === 'A') setCodeA(data.content);
        else setCodeB(data.content);
      }
      setAlgoResults([]);
      setAlgoSearch('');
    } catch (err) {}
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      validateCode(codeA, 'A');
      validateCode(codeB, 'B');
    }, 500);
    return () => clearTimeout(timer);
  }, [codeA, codeB]);

  return (
    <div className="h-full flex flex-col p-4 md:p-8 overflow-y-auto lg:overflow-hidden bg-[#020204] custom-scrollbar">
      {/* Header with Search and Stats */}
      <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 shrink-0">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-red-900/20 rounded-[24px] border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <Layers className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-red-100 uppercase tracking-tighter italic flex items-center gap-3">
              Logic Battleground <span className="text-[10px] not-italic font-black bg-red-900/40 px-3 py-1 rounded-full text-red-500 border border-red-500/20">Alpha v2.0</span>
            </h2>
            <p className="text-[10px] text-red-900 font-black uppercase tracking-[0.4em]">Multi-Agent Code Optimization Core</p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <div className="flex gap-2 shrink-0">
            <select 
              value={selectedCategory}
              onChange={(e) => fetchCategoryAlgos(e.target.value)}
              className="bg-red-950/20 border border-red-900/30 rounded-xl px-4 py-3 text-[10px] text-red-100 font-black uppercase outline-none focus:border-red-500/50 transition-all min-w-[140px]"
            >
              <option value="">Category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select 
              onChange={(e) => {
                if (e.target.value) loadAlgo(e.target.value);
                e.target.value = "";
              }}
              className="bg-red-950/20 border border-red-900/30 rounded-xl px-4 py-3 text-[10px] text-red-100 font-black uppercase outline-none focus:border-red-500/50 transition-all min-w-[140px]"
              disabled={!selectedCategory}
            >
              <option value="">Select Algorithm</option>
              {categoryAlgos.map(a => <option key={a.path} value={a.path}>{a.name}</option>)}
            </select>
          </div>

          <div className="relative flex-1 md:w-64 min-w-[200px]">
            <input 
              value={algoSearch}
              onChange={(e) => searchAlgos(e.target.value)}
              placeholder="Search Intelligence..."
              className="w-full bg-red-950/10 border border-red-900/30 rounded-2xl px-6 py-3 text-xs text-red-100 placeholder:text-red-950 outline-none focus:border-red-500/50 transition-all"
            />
            {algoResults.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#0d0404] border border-red-900/30 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar p-2 backdrop-blur-xl">
                {algoResults.map((r, i) => (
                  <button 
                    key={i} 
                    onClick={() => loadAlgo(r.path)}
                    className="w-full text-left px-4 py-3 text-[10px] text-red-100 hover:bg-red-900/20 rounded-xl transition-all border border-transparent hover:border-red-900/30"
                  >
                    <span className="text-red-900 font-black mr-2">[{r.category}]</span>
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={runBenchmark}
            disabled={isProcessing}
            className="px-8 py-3 bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-red-600 transition-all shadow-[0_0_30px_rgba(185,28,28,0.3)] active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? <Zap className="w-4 h-4 animate-spin" /> : <Gauge className="w-4 h-4" />}
            INITIATE BENCHMARK
          </button>
        </div>
      </header>

      {/* Main Battleground Panels */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        {/* Panel A */}
        <div className={`flex-1 flex flex-col bg-[#0d0404]/80 rounded-[40px] border transition-all duration-500 ${activeEditor === 'A' ? 'border-red-600 shadow-[0_0_50px_rgba(239,68,68,0.1)] scale-[1.01]' : 'border-red-900/20 opacity-80'}`} onClick={() => setActiveEditor('A')}>
          <div className="p-6 border-b border-red-900/20 bg-[#0a0202]/80 flex items-center justify-between rounded-t-[40px]">
             <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${statusA?.status === 'valid' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : statusA?.status === 'error' ? 'bg-red-500 animate-pulse' : 'bg-red-950'}`} />
                <span className="text-[11px] font-black text-red-100 uppercase tracking-widest italic">Node_A: Legacy Core</span>
             </div>
             <div className="text-[10px] font-black uppercase tracking-widest text-red-900">
                {statusA?.status === 'valid' ? 'SYNTAX_OK' : 'SYNTAX_ERR'}
             </div>
          </div>
          <div className="flex-1 p-8 font-mono text-[13px] relative">
            <textarea 
              value={codeA}
              onChange={(e) => setCodeA(e.target.value)}
              className="w-full h-full bg-transparent text-red-400 outline-none resize-none placeholder:text-red-950 custom-scrollbar relative z-10"
              spellCheck={false}
            />
            {/* Syntax Highlighting Fake Glow */}
            <div className="absolute inset-0 p-8 pointer-events-none opacity-5">
               <pre className="whitespace-pre-wrap break-all text-red-500 blur-[2px]">{codeA}</pre>
            </div>
          </div>
          {statusA?.status === 'error' && (
            <div className="p-4 bg-red-950/20 border-t border-red-900/20 text-[10px] font-black text-red-500 uppercase flex items-center gap-3">
               <XCircle className="w-4 h-4" /> {statusA.msg}
            </div>
          )}
        </div>

        {/* Panel B */}
        <div className={`flex-1 flex flex-col bg-[#0d0404]/80 rounded-[40px] border transition-all duration-500 ${activeEditor === 'B' ? 'border-red-600 shadow-[0_0_50px_rgba(239,68,68,0.1)] scale-[1.01]' : 'border-red-900/20 opacity-80'}`} onClick={() => setActiveEditor('B')}>
          <div className="p-6 border-b border-red-900/20 bg-[#0a0202]/80 flex items-center justify-between rounded-t-[40px]">
             <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${statusB?.status === 'valid' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : statusB?.status === 'error' ? 'bg-red-500 animate-pulse' : 'bg-red-950'}`} />
                <span className="text-[11px] font-black text-red-100 uppercase tracking-widest italic">Node_B: Optimization Candidate</span>
             </div>
             <div className="text-[10px] font-black uppercase tracking-widest text-red-900">
                {statusB?.status === 'valid' ? 'SYNTAX_OK' : 'SYNTAX_ERR'}
             </div>
          </div>
          <div className="flex-1 p-8 font-mono text-[13px] relative">
            <textarea 
              value={codeB}
              onChange={(e) => setCodeB(e.target.value)}
              className="w-full h-full bg-transparent text-red-400 outline-none resize-none placeholder:text-red-950 custom-scrollbar relative z-10"
              spellCheck={false}
            />
            <div className="absolute inset-0 p-8 pointer-events-none opacity-5">
               <pre className="whitespace-pre-wrap break-all text-red-500 blur-[2px]">{codeB}</pre>
            </div>
          </div>
          {statusB?.status === 'error' && (
            <div className="p-4 bg-red-950/20 border-t border-red-900/20 text-[10px] font-black text-red-500 uppercase flex items-center gap-3">
               <XCircle className="w-4 h-4" /> {statusB.msg}
            </div>
          )}
        </div>
      </div>

      {/* Benchmark Analysis Result Area */}
      {benchmark && (
        <div className="mt-8 bg-[#0d0404]/90 border border-red-600/30 rounded-[30px] p-8 space-y-8 shadow-[0_0_60px_rgba(185,28,28,0.1)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 transition-all">
             <Brain className="w-12 h-12 text-red-600" />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-10">
             <div className="shrink-0 text-center md:text-left">
                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-2">Neural Recommendation</h4>
                <div className="text-3xl font-black text-red-100 uppercase italic flex items-center gap-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  {benchmark.winner === 'code1' ? 'Node_A Dominant' : 'Node_B Dominant'}
                </div>
                <p className="text-[9px] text-red-900 font-black uppercase tracking-widest mt-2 italic">Performance Delta: +{benchmark.percent.toFixed(2)}% Efficiency Increase</p>
                <button 
                  onClick={() => {/* AI Logic here or via parent */}}
                  className="mt-6 px-6 py-2 border border-emerald-500/30 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/10 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-3 h-3" /> Explain Optimization
                </button>
             </div>
             
             <div className="flex-1 w-full space-y-6">
                <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                      <span className="text-red-100">Node_A Velocity</span>
                      <span className="text-red-900">{(benchmark.code1_time * 1000).toFixed(4)} ms</span>
                   </div>
                   <div className="w-full h-3 bg-red-950/20 rounded-full overflow-hidden border border-red-900/10">
                      <div className="h-full bg-red-900/40 benchmark-bar" style={{ width: `${(benchmark.code1_time / Math.max(benchmark.code1_time, benchmark.code2_time)) * 100}%` }} />
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                      <span className="text-red-100">Node_B Velocity</span>
                      <span className="text-red-900">{(benchmark.code2_time * 1000).toFixed(4)} ms</span>
                   </div>
                   <div className="w-full h-3 bg-red-950/20 rounded-full overflow-hidden border border-red-900/10">
                      <div className="h-full bg-red-500 benchmark-bar" style={{ width: `${(benchmark.code2_time / Math.max(benchmark.code1_time, benchmark.code2_time)) * 100}%` }} />
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {!benchmark && (
        <div className="mt-8 border border-dashed border-red-900/20 rounded-[30px] p-8 flex items-center justify-center opacity-40">
           <div className="text-center space-y-4">
              <Activity className="w-8 h-8 text-red-900 mx-auto animate-pulse" />
              <p className="text-[10px] font-black text-red-900 uppercase tracking-[0.5em]">Awaiting performance injection...</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default CodeBattleground;
