import { useState, useRef, useCallback } from "react";
import { Upload, Search, BarChart2, Receipt, X, Plus, Trash2, ChevronRight, CalendarDays, Store, DollarSign, ChevronLeft } from "lucide-react";

type LineItem = { id: string; description: string; amount: string };

type ReceiptData = {
  merchant: string;
  date: string;
  total: string;
  items: LineItem[];
};

type View = "scan" | "search" | "summary";

const DEMO_RECEIPTS = [
  { id: "r1", merchant: "Whole Foods Market", date: "2026-05-18", total: "84.32", items: [{ id: "i1", description: "Organic Blueberries", amount: "5.99" }, { id: "i2", description: "Grass-Fed Ground Beef", amount: "18.49" }, { id: "i3", description: "Sourdough Loaf", amount: "7.49" }, { id: "i4", description: "Oat Milk 6-Pack", amount: "14.99" }, { id: "i5", description: "Kombucha GT's", amount: "3.99" }] },
  { id: "r2", merchant: "Shell Gas Station", date: "2026-05-16", total: "62.10", items: [{ id: "i6", description: "Premium Unleaded 14.8gal", amount: "59.94" }, { id: "i7", description: "Sparkling Water", amount: "2.16" }] },
  { id: "r3", merchant: "Chipotle Mexican Grill", date: "2026-05-14", total: "23.75", items: [{ id: "i8", description: "Burrito Bowl x2", amount: "18.50" }, { id: "i9", description: "Chips & Guac", amount: "4.25" }, { id: "i10", description: "Fountain Drink", amount: "1.00" }] },
  { id: "r4", merchant: "Amazon.com", date: "2026-05-12", total: "134.99", items: [{ id: "i11", description: "Logitech MX Keys Keyboard", amount: "109.99" }, { id: "i12", description: "USB-C Hub 7-Port", amount: "25.00" }] },
  { id: "r5", merchant: "Equinox Fitness", date: "2026-05-01", total: "195.00", items: [{ id: "i13", description: "Monthly Membership", amount: "195.00" }] },
];

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function App() {
  const [view, setView] = useState<View>("scan");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData>({
    merchant: "",
    date: "",
    total: "",
    items: [{ id: genId(), description: "", amount: "" }],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [summaryMonth, setSummaryMonth] = useState(5); // 1-12
  const [summaryYear, setSummaryYear] = useState(2026);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    // Simulate extraction with a slight delay
    setTimeout(() => {
      setReceipt({
        merchant: "Whole Foods Market",
        date: "2026-05-18",
        total: "84.32",
        items: [
          { id: genId(), description: "Organic Blueberries", amount: "5.99" },
          { id: genId(), description: "Grass-Fed Ground Beef", amount: "18.49" },
          { id: genId(), description: "Sourdough Loaf", amount: "7.49" },
          { id: genId(), description: "Oat Milk 6-Pack", amount: "14.99" },
          { id: genId(), description: "Kombucha GT's", amount: "3.99" },
        ],
      });
    }, 800);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const addItem = () => {
    setReceipt(r => ({ ...r, items: [...r.items, { id: genId(), description: "", amount: "" }] }));
  };

  const removeItem = (id: string) => {
    setReceipt(r => ({ ...r, items: r.items.filter(i => i.id !== id) }));
  };

  const updateItem = (id: string, field: "description" | "amount", val: string) => {
    setReceipt(r => ({ ...r, items: r.items.map(i => i.id === id ? { ...i, [field]: val } : i) }));
  };

  const clearReceipt = () => {
    setImageUrl(null);
    setReceipt({ merchant: "", date: "", total: "", items: [{ id: genId(), description: "", amount: "" }] });
  };

  const totalSpend = DEMO_RECEIPTS.reduce((s, r) => s + parseFloat(r.total), 0);

  // Filter receipts by selected month/year
  const monthStr = summaryMonth.toString().padStart(2, '0');
  const periodPrefix = `${summaryYear}-${monthStr}`;
  const periodReceipts = DEMO_RECEIPTS.filter(r => r.date.startsWith(periodPrefix));
  const periodSpend = periodReceipts.reduce((s, r) => s + parseFloat(r.total), 0);

  // Search for both items and merchants
  const query = searchQuery.toLowerCase().trim();
  const filteredItems = query.length > 1
    ? DEMO_RECEIPTS.flatMap(r =>
        r.items
          .filter(i => i.description.toLowerCase().includes(query))
          .map(i => ({ ...i, merchant: r.merchant, date: r.date, receiptTotal: r.total, matchType: 'item' as const }))
      )
    : [];

  const filteredMerchants = query.length > 1
    ? DEMO_RECEIPTS.filter(r => r.merchant.toLowerCase().includes(query))
    : [];

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Nav */}
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

      {/* Scan View */}
      {view === "scan" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Upload / Preview */}
          <div className="flex flex-col w-1/2 border-r border-border p-6 gap-4 overflow-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                Receipt Image
              </h2>
              {imageUrl && (
                <button
                  onClick={clearReceipt}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {!imageUrl ? (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`flex-1 min-h-64 flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground/80">Drop receipt image here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse — PNG, JPG, WEBP</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>
            ) : (
              <div className="flex-1 rounded-lg overflow-hidden bg-muted flex items-center justify-center min-h-64">
                <img
                  src={imageUrl}
                  alt="Uploaded receipt"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}

            {imageUrl && (
              <div className="rounded-md bg-primary/10 border border-primary/20 px-4 py-2.5 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>
                  Fields extracted — review and confirm
                </span>
              </div>
            )}
          </div>

          {/* Right: Fields */}
          <div className="flex flex-col w-1/2 p-6 gap-6 overflow-auto">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
              Extracted Data
            </h2>

            {/* Meta fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  <Store className="w-3 h-3" /> Merchant
                </label>
                <input
                  type="text"
                  value={receipt.merchant}
                  onChange={e => setReceipt(r => ({ ...r, merchant: e.target.value }))}
                  placeholder="e.g. Whole Foods"
                  className="bg-input-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  <CalendarDays className="w-3 h-3" /> Date
                </label>
                <input
                  type="date"
                  value={receipt.date}
                  onChange={e => setReceipt(r => ({ ...r, date: e.target.value }))}
                  className="bg-input-background border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors [color-scheme:dark]"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  <DollarSign className="w-3 h-3" /> Total Amount
                </label>
                <input
                  type="text"
                  value={receipt.total}
                  onChange={e => setReceipt(r => ({ ...r, total: e.target.value }))}
                  placeholder="0.00"
                  className="bg-input-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                />
              </div>
            </div>

            {/* Line items */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
                  Line Items
                </span>
                <button
                  onClick={addItem}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  <Plus className="w-3 h-3" /> Add row
                </button>
              </div>

              {/* Header row */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-1">
                <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>Description</span>
                <span className="text-xs text-muted-foreground w-20 text-right" style={{ fontFamily: "'DM Mono', monospace" }}>Amount</span>
                <span className="w-6" />
              </div>

              <div className="flex flex-col gap-2">
                {receipt.items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center group">
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateItem(item.id, "description", e.target.value)}
                      placeholder={`Item ${idx + 1}`}
                      className="bg-input-background border border-border rounded px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                    />
                    <input
                      type="text"
                      value={item.amount}
                      onChange={e => updateItem(item.id, "amount", e.target.value)}
                      placeholder="0.00"
                      className="bg-input-background border border-border rounded px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-20 text-right transition-colors"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    />
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Totals row */}
              <div className="flex justify-between items-center pt-3 border-t border-border mt-1">
                <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>Total</span>
                <span className="text-sm font-semibold text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>
                  ${receipt.total || "0.00"}
                </span>
              </div>
            </div>

            <button className="mt-auto w-full py-2.5 rounded bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.99] transition-all">
              Save Receipt
            </button>
          </div>
        </div>
      )}

      {/* Search View */}
      {view === "search" && (
        <div className="flex flex-col flex-1 p-6 gap-6 max-w-3xl mx-auto w-full">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Item & Merchant Search</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Search across all receipts, vendors, and line items</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search items or merchants — try 'beef', 'keyboard', or 'whole foods'..."
              autoFocus
              className="w-full bg-input-background border border-border rounded pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          {searchQuery.trim().length > 1 && (
            <div className="flex flex-col gap-4">
              {/* Merchant results */}
              {filteredMerchants.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-muted-foreground mb-2 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
                    Merchants ({filteredMerchants.length})
                  </div>
                  {filteredMerchants.map(r => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between px-4 py-3 rounded-md bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer group"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{r.merchant}</span>
                        <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{r.date} · {r.items.length} items</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>${r.total}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Item results */}
              {filteredItems.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-muted-foreground mb-2 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
                    Items ({filteredItems.length})
                  </div>
                  {filteredItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-4 py-3 rounded-md bg-card border border-border hover:border-primary/30 transition-colors group"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-foreground">{item.description}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                          <span>{item.merchant}</span>
                          <span>·</span>
                          <span>{item.date}</span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>
                        ${item.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {filteredItems.length === 0 && filteredMerchants.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">No items or merchants matched "{searchQuery}"</div>
              )}
            </div>
          )}

          {searchQuery.trim().length <= 1 && (
            <div className="flex flex-col gap-1 mt-2">
              <div className="text-xs text-muted-foreground mb-3 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
                Recent Receipts
              </div>
              {DEMO_RECEIPTS.map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-4 py-3 rounded-md bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{r.merchant}</span>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{r.date} · {r.items.length} items</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>${r.total}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary View */}
      {view === "summary" && (
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
    </div>
  );
}
