import { useState } from "react";
import { View } from "./types";
import ScanView from "./views/ScanView";
import SearchView from "./views/SearchView";
import SummaryView from "./views/SummaryView";
import { Receipt, Upload, Search, BarChart2 } from "lucide-react";

function Nav({ view, setView }: { view: View; setView: (v: View) => void }) {
  return (
    <nav className="border-b border-border flex items-center gap-0 px-6 h-12 shrink-0 bg-card">
      <div className="flex items-center gap-2 mr-8">
        <Receipt className="w-4 h-4 text-primary" strokeWidth={2} />
        <span className="text-xs font-semibold tracking-widest uppercase text-foreground/80" style={{ fontFamily: "'DM Mono', monospace" }}>
          Receipt Vault
        </span>
      </div>
      {(["scan", "search", "summary"] as View[]).map(v => (
        <button
          key={v}
          onClick={() => setView(v)}
          className={`flex items-center gap-1.5 px-4 h-full text-xs font-medium tracking-wide uppercase transition-colors border-b-2 ${
            view === v
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          {v === "scan" && <Upload className="w-3 h-3" />}
          {v === "search" && <Search className="w-3 h-3" />}
          {v === "summary" && <BarChart2 className="w-3 h-3" />}
          {v}
        </button>
      ))}
    </nav>
  );
}

export default function App() {
  const [view, setView] = useState<View>("scan");
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Nav view={view} setView={setView} />
      {view === "scan" && <ScanView />}
      {view === "search" && <SearchView />}
      {view === "summary" && <SummaryView />}
    </div>
  );
}