import { useState, useRef, useCallback } from "react";
import {type ReceiptData, type View} from "../types/index.ts";
import {genId, DEMO_RECEIPTS} from "../data/receipts.ts";
import { Upload, Search, BarChart2, Receipt, X, Plus, Trash2, ChevronRight, CalendarDays, Store, DollarSign, ChevronLeft } from "lucide-react";


export default function SummaryView() {

const [view, setView] = useState<View>("scan");


  const [summaryMonth, setSummaryMonth] = useState(5); // 1-12
  const [summaryYear, setSummaryYear] = useState(2026);

  const totalSpend = DEMO_RECEIPTS.reduce((s, r) => s + parseFloat(r.total), 0);

  const monthStr = summaryMonth.toString().padStart(2, '0');
  const periodPrefix = `${summaryYear}-${monthStr}`;
  const periodReceipts = DEMO_RECEIPTS.filter(r => r.date.startsWith(periodPrefix));
  const periodSpend = periodReceipts.reduce((s, r) => s + parseFloat(r.total), 0);


  return (
        <div className="flex flex-col flex-1 p-6 gap-6 max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Expense Summary</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(summaryYear, summaryMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })} · {periodReceipts.length} receipt{periodReceipts.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Month/Year selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (summaryMonth === 1) {
                    setSummaryMonth(12);
                    setSummaryYear(summaryYear - 1);
                  } else {
                    setSummaryMonth(summaryMonth - 1);
                  }
                }}
                className="flex items-center justify-center w-8 h-8 rounded border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-col items-center px-3">
                <span className="text-sm font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {new Date(summaryYear, summaryMonth - 1).toLocaleString('default', { month: 'short' })} {summaryYear}
                </span>
              </div>
              <button
                onClick={() => {
                  if (summaryMonth === 12) {
                    setSummaryMonth(1);
                    setSummaryYear(summaryYear + 1);
                  } else {
                    setSummaryMonth(summaryMonth + 1);
                  }
                }}
                className="flex items-center justify-center w-8 h-8 rounded border border-border hover:border-primary/40 hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Period Spend", value: `$${periodSpend.toFixed(2)}`, sub: new Date(summaryYear, summaryMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' }) },
              { label: "Total Receipts", value: `${DEMO_RECEIPTS.length}`, sub: "All time" },
              { label: "Avg per Receipt", value: `$${(totalSpend / DEMO_RECEIPTS.length).toFixed(2)}`, sub: "All time" },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-border rounded-lg px-5 py-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {stat.label}
                </span>
                <span className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">{stat.sub}</span>
              </div>
            ))}
          </div>

          {/* Receipt breakdown */}
          <div className="flex flex-col gap-1">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
              Receipts · {new Date(summaryYear, summaryMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>

            {periodReceipts.length === 0 ? (
              <div className="bg-card border border-border rounded-lg px-4 py-12 text-center">
                <p className="text-sm text-muted-foreground">No receipts found for this period</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                {/* Table head */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr] px-4 py-2.5 border-b border-border">
                  {["Merchant", "Date", "Items", "Total"].map(h => (
                    <span key={h} className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {h}
                    </span>
                  ))}
                </div>
                {periodReceipts.map((r, idx) => (
                  <div
                    key={r.id}
                    className={`grid grid-cols-[2fr_1fr_1fr_1fr] px-4 py-3 hover:bg-muted/30 transition-colors ${idx < periodReceipts.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <span className="text-sm text-foreground">{r.merchant}</span>
                    <span className="text-sm text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{r.date}</span>
                    <span className="text-sm text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{r.items.length}</span>
                    <span className="text-sm font-medium text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>${r.total}</span>
                  </div>
                ))}
                {/* Footer total */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr] px-4 py-3 border-t border-primary/20 bg-primary/5">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide col-span-3" style={{ fontFamily: "'DM Mono', monospace" }}>
                    Total
                  </span>
                  <span className="text-sm font-semibold text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>
                    ${periodSpend.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Spend bar chart — visual bars, no recharts dependency needed */}
          {periodReceipts.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="text-xs text-muted-foreground uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
                Spend by Merchant
              </div>
              <div className="flex flex-col gap-2">
                {periodReceipts.sort((a, b) => parseFloat(b.total) - parseFloat(a.total)).map(r => {
                  const pct = (parseFloat(r.total) / periodSpend) * 100;
                  return (
                    <div key={r.id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-36 shrink-0 truncate">{r.merchant}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-primary w-14 text-right shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>
                        ${r.total}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}