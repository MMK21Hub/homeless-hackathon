"use client";

import { useState } from "react";
import { 
  Dna, 
  Upload, 
  Activity, 
  CheckCircle2, 
  RefreshCw, 
  FileText, 
  Layers,
  Sparkles,
  BookOpen,
  Printer,
  Terminal,
  Cpu,
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Info
} from "lucide-react";

type RefoldState = "idle" | "uploading" | "folding" | "completed";

interface QueueItem {
  id: string;
  name: string;
  size: string;
  status: "Queued" | "Processing" | "Verified" | "Failed";
  rmsd: string;
}

export default function AlphaRefoldDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<RefoldState>("idle");
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Batch Queue Mock State
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFile = e.target.files[0];
      setFile(newFile);
    }
  };

  const startRefoldingSimulation = () => {
    if (!file) return;
    setStatus("uploading");
    setProgress(15);

    const newQueueId = `Q-${Math.floor(Math.random() * 900 + 100)}`;
    
    setQueue((q) => [
      { id: newQueueId, name: file.name, size: `${(file.size / 1024).toFixed(1)} KB`, status: "Processing", rmsd: "--" },
      ...q
    ]);

    setTimeout(() => {
      setStatus("folding");
      setProgress(45);
      
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            setTimeout(() => {
              setStatus("completed");
              setQueue((q) => 
                q.map(item => item.id === newQueueId ? { ...item, status: "Verified", rmsd: "0.42 Å" } : item)
              );
            }, 800);
            return 100;
          }
          return prev + 15;
        });
      }, 400);
    }, 800);
  };

  const resetSession = () => {
    setFile(null);
    setStatus("idle");
    setProgress(0);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <main className={`min-h-screen bg-slate-50 flex flex-col no-scrollbar ${isFullscreen ? "fixed inset-0 z-50 overflow-y-auto bg-white p-4" : ""}`}>
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200 bg-white px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-700">
            <Dna className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-slate-900">
              ALPHA REFOLD
            </h1>
            <p className="text-xs text-slate-500">Structural Biology Laboratory Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a 
            href="#about" 
            className="text-xs font-medium text-slate-600 hover:text-blue-600 transition flex items-center gap-1 bg-slate-100 hover:bg-slate-200/60 px-3 py-1.5 rounded-lg"
          >
            <BookOpen className="w-3.5 h-3.5" /> About Science & Origin
          </a>
        </div>
      </header>

      {/* Main Workspace Section: Dynamic Transition based on status */}
      <div className="flex-1 p-8 max-w-7xl mx-auto w-full my-auto flex flex-col gap-6">
        
        {status === "idle" || status === "uploading" || (status === "folding") ? (
          /* ================= STAGE 1: SPECIMEN INGESTION AS PRIMARY VIEW ================= */
          <div className="max-w-3xl mx-auto w-full bg-white border border-slate-200 rounded-2xl p-10 shadow-sm flex flex-col gap-8 my-auto">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                <Layers className="w-3.5 h-3.5" /> Stage 1: Pipeline Initialization
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Upload Protein Specimen</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ingest raw unconstrained coordinate files to initiate structural refolding neural pipelines.
              </p>
            </div>

            {/* Large Upload Box */}
            <div className="relative border-2 border-dashed border-slate-300 hover:border-blue-500 transition rounded-xl p-12 flex flex-col items-center justify-center text-center bg-slate-50/50 group">
              <input 
                type="file" 
                onChange={handleFileChange} 
                disabled={status !== "idle"}
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
              />
              <div className="p-4 rounded-full bg-white border border-slate-200 text-blue-600 mb-4 shadow-sm group-hover:scale-105 transition">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-base font-medium text-slate-800">
                {file ? file.name : "Select or drag specimen file (.PDB / .FASTA)"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {file ? `${(file.size / 1024).toFixed(1)} KB loaded` : "Supports standard high-throughput structural formats"}
              </p>
            </div>

            {file && status === "idle" && (
              <button 
                onClick={startRefoldingSimulation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-sm"
              >
                <Activity className="w-4 h-4" /> Run Refolding Analysis Pipeline
              </button>
            )}

            {(status === "uploading" || status === "folding") && (
              <div className="flex flex-col gap-3 py-4">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600 font-medium">
                    {status === "uploading" ? "Parsing structural coordinate file..." : "Executing neural network backbone conformation..."}
                  </span>
                  <span className="text-slate-600 font-mono">{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================= STAGE 2: STRUCTURAL OUTPUT & VISUALIZATION AS MAIN SCREEN ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full animate-fadeIn">
            
            {/* Left Main View: Clean White 3D Canvas / Visualization (Takes 8 columns) */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col min-h-[600px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Structural Output & 3D Conformation Viewer</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                    title="Toggle Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" /> Verified Output
                  </span>
                </div>
              </div>

              {/* Interactive White 3D Canvas Workspace */}
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl relative flex flex-col items-center justify-center p-8 overflow-hidden shadow-inner">
                
                {/* 3D Viewport Controls Toolbar */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-md border border-slate-200 p-1.5 rounded-lg text-slate-700 shadow-xs">
                  <button className="p-1.5 hover:bg-slate-100 rounded transition" title="Rotate"><RotateCcw className="w-3.5 h-3.5" /></button>
                  <button className="p-1.5 hover:bg-slate-100 rounded transition" title="Zoom In"><ZoomIn className="w-3.5 h-3.5" /></button>
                  <button className="p-1.5 hover:bg-slate-100 rounded transition" title="Zoom Out"><ZoomOut className="w-3.5 h-3.5" /></button>
                </div>

                <div className="absolute top-4 right-4 px-3 py-1 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-mono tracking-wider font-semibold">
                  3dmol.js • .PDB Viewer Ready
                </div>

                <div className="text-center space-y-3 z-10">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto shadow-sm">
                    <Dna className="w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 tracking-wide">Tertiary Conformation Rendered</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">Target Specimen: {file?.name}</p>
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    [Future Integration]: This canvas will ingest backend .PDB coordinate strings to render interactive atom chains via 3dmol.js.
                  </p>
                </div>

                {/* Action Toolbar */}
                <div className="absolute bottom-6 flex flex-wrap gap-3 justify-center z-10">
                  <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition shadow-xs">
                    Download .PDB Output
                  </button>
                  <button 
                    onClick={handlePrintReport}
                    className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-xs transition shadow-xs flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-600" /> Print Final Report
                  </button>
                  <button 
                    onClick={resetSession}
                    className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-xs transition shadow-xs flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> New Session
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side Console Drawer: Clean White Style (Takes 4 columns) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Protein Description Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Info className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Structural Annotation</h3>
                </div>
                <div className="space-y-3 text-xs text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Predicted Fold Family</span>
                    <p className="font-semibold text-slate-900 text-sm mt-0.5">Alpha-Beta Tim Barrel (Globular)</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Confidence Metric</span>
                    <p className="font-semibold text-emerald-600 font-mono mt-0.5">94.6 pLDDT (Very High)</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Backbone Deviation</span>
                    <p className="font-semibold text-slate-900 font-mono mt-0.5">0.42 Å RMSD</p>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
                    The algorithm successfully resolved steric clashes, stabilizing the catalytic core into a symmetrical closed barrel conformation.
                  </p>
                </div>
              </div>

              {/* Clean White Live Computational Log Console */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3 flex-1">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    <Terminal className="w-4 h-4 text-blue-600" /> Live Computational Stream
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="font-mono text-[11px] space-y-1.5 text-slate-600 overflow-y-auto max-h-56 no-scrollbar bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400">[0.00s] Initializing secure telemetry...</p>
                  <p className="text-slate-400">[0.42s] Parsing raw coordinate sequence...</p>
                  <p className="text-blue-600 font-medium">[1.12s] [COMPUTE] Generating multiple sequence alignments...</p>
                  <p className="text-blue-600 font-medium">[2.35s] [COMPUTE] Running neural network backbone inference...</p>
                  <p className="text-emerald-600 font-bold">[3.80s] [SUCCESS] Tertiary conformation stabilized.</p>
                  <p className="text-emerald-600 font-bold">[3.85s] [SUCCESS] Metrics verified and cached.</p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Batch Processing Queue Dashboard with pLDDT Confidence Scale Legend Next to It */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto w-full">
          
          {/* Active Queue (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" /> Active Batch Processing Queue
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{queue.length} Tasks</span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
              {queue.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No active queue tasks. Upload a specimen above to begin tracking.</p>
              ) : (
                queue.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <p className="font-medium text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{item.id} • {item.size}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                        item.status === "Verified" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        item.status === "Processing" ? "bg-amber-50 text-amber-700 border border-amber-100 animate-pulse" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {item.status}
                      </span>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">RMSD: {item.rmsd}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* pLDDT Confidence Scale Legend (5 Cols - Placed right next to the queue) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">pLDDT Confidence Scale</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                <div>
                  <p className="font-medium text-slate-800 text-[11px]">Very High</p>
                  <p className="text-[9px] text-slate-500">{"> 90 pLDDT"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
                <div>
                  <p className="font-medium text-slate-800 text-[11px]">Confident</p>
                  <p className="text-[9px] text-slate-500">70 - 90 pLDDT</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <div>
                  <p className="font-medium text-slate-800 text-[11px]">Low</p>
                  <p className="text-[9px] text-slate-500">50 - 70 pLDDT</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <div>
                  <p className="font-medium text-slate-800 text-[11px]">Very Low</p>
                  <p className="text-[9px] text-slate-500">{"< 50 pLDDT"}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Scrollable Educational Section */}
      <section id="about" className="border-t border-slate-200 bg-white py-16 px-8 mt-auto">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
              <Sparkles className="w-3.5 h-3.5" /> Scientific Context & Background
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Understanding Protein Folding & Our Inspiration
            </h2>
            <p className="text-sm text-slate-500 max-w-2xl mx-auto">
              How structural biology meets open-weight machine learning architectures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-xs">
                <Dna className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">What is Protein Folding?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Proteins are long chains of amino acids that fold into complex, 3D functional shapes. The exact 3D structure dictates how a protein behaves, interacts with cells, and fights disease. When proteins fail to fold correctly, it can lead to severe pathological conditions.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-xs">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">Our Inspiration from AlphaFold</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We took architectural inspiration from breakthrough models like AlphaFold, which revolutionized structural biology by solving the 50-year-old protein folding problem. **Alpha Refold** adapts these foundational principles into an open-weight, accessible hackathon ecosystem.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Professional White Multi-Column Footer */}
      <footer className="border-t border-slate-200 bg-white text-slate-600 py-16 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-xs">
          
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 tracking-wider uppercase">Get to Know Us</h4>
            <ul className="space-y-2.5 text-slate-500">
              <li className="hover:text-slate-900 transition">Laboratory Careers</li>
              <li className="hover:text-slate-900 transition">About Alpha Refold</li>
              <li className="hover:text-slate-900 transition">Compliance & Standards</li>
              <li className="hover:text-slate-900 transition">Global Research Grants</li>
              <li className="hover:text-slate-900 transition">Open Science Papers</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 tracking-wider uppercase">Collaborate with Us</h4>
            <ul className="space-y-2.5 text-slate-500">
              <li className="hover:text-slate-900 transition">Deploy on Open Infrastructure</li>
              <li className="hover:text-slate-900 transition">Institutional Partnerships</li>
              <li className="hover:text-slate-900 transition">Custom Model Fine-Tuning</li>
              <li className="hover:text-slate-900 transition">Gemma Integration Suite</li>
              <li className="hover:text-slate-900 transition">Secure Enclave Hosting</li>
              <li className="hover:text-slate-900 transition">API Documentation Access</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 tracking-wider uppercase">Compute & Security</h4>
            <ul className="space-y-2.5 text-slate-500">
              <li className="hover:text-slate-900 transition">Encrypted TEE Pipelines</li>
              <li className="hover:text-slate-900 transition">Local Node Benchmarks</li>
              <li className="hover:text-slate-900 transition">Hardware Requirements</li>
              <li className="hover:text-slate-900 transition">Data Privacy Framework</li>
              <li className="hover:text-slate-900 transition">Zero-Knowledge Audits</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 tracking-wider uppercase">Let Us Help You</h4>
            <ul className="space-y-2.5 text-slate-500">
              <li className="hover:text-slate-900 transition">Specimen Format Guidelines</li>
              <li className="hover:text-slate-900 transition">Troubleshooting .PDB Parsing</li>
              <li className="hover:text-slate-900 transition">CLI Tools & Packages</li>
              <li className="hover:text-slate-900 transition">Clinical Support Desk</li>
              <li className="hover:text-slate-900 transition">System Status & Uptime</li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-100 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
          <div className="flex items-center gap-2">
            <Dna className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-900">ALPHA REFOLD LABS</span>
          </div>
          <div>
            © 2026 Alpha Refold Project. Open-weight structural intelligence.
          </div>
        </div>
      </footer>

    </main>
  );
}