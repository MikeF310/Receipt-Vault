import { useState, useRef, useCallback } from "react";
import {LineItem, type ReceiptData} from "../types/index.ts";
import {genId,fetchData,saveData} from "../data/receipts.ts";
import { Upload, Search, BarChart2, Receipt, X, Plus, Trash2, ChevronRight, CalendarDays, Store, DollarSign, ChevronLeft, Trophy } from "lucide-react";


export default function ScanView(){
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [hasScanned, setHasScanned] = useState(false);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const [receipt, setReceipt] = useState<ReceiptData>({
    id: genId(),
    merchant: "",
    date: "",
    total: "",
    items: [{ id: genId(), item_name: "", price: "" }],
  });

 
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setCurrentFile(file);
    setHasScanned(false);
    // Reset receipt data when new image is uploaded
    setReceipt({ merchant: "", date: "", total: "", items: [{ id: genId(), item_name: "", price: "" }], id: "" });
  }, []);
  const startScan = useCallback(async (file: File) => {
    setIsScanning(true);
    setScanProgress(0);

    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 150);
    try{

      const data = await fetchData(file);

      clearInterval(progressInterval);
      setScanProgress(100);

      if (data){
        setReceipt({
          id: data.id ?? genId(),
          merchant: data.merchant_name ?? "",
          date: data.date ?? "",
          total: String(data.total_amount ?? ""),
          items: data.items?.map((item: LineItem) => ({
            id: item.id ?? genId(),
            item_name: item.item_name ?? "",
            price: String(item.price ?? ""),


          })) ??  [{ id: genId(), description: "", amount: "" }],
        });
        console.log("DATA -> ", data)
      }

      // setReceipt({ id: "r1", 
      //   merchant: "Whole Foods Market", date: "2026-05-18", total: "84.32", items: 
      //   [{ id: "i1", item_name: "Organic Blueberries", price: "5.99" }, { id: "i4", item_name: "Oat Milk 6-Pack", price: "14.99" }, { id: "i5", item_name: "Kombucha GT's", price: "3.99" }] },
      // )
      setTimeout(() => {
        setIsScanning(false);
        setHasScanned(true);
        setScanProgress(0);
      }, 300);

    } catch (err){
      clearInterval(progressInterval);
      setIsScanning(false);
      setScanProgress(0);
      console.error('Scan failed:', err);
    }

  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const addItem = () => {
    setReceipt(r => ({ ...r, items: [...r.items, { id: genId(), item_name: "", price: "" }] }));
  };

  const removeItem = (id: string) => {
    setReceipt(r => ({ ...r, items: r.items.filter(i => i.id !== id) }));
  };

  const updateItem = (id: string, field: "item_name" | "price", val: string) => {
    setReceipt(r => ({ ...r, items: r.items.map(i => i.id === id ? { ...i, [field]: val } : i) }));
  };

  const clearReceipt = () => {
    setImageUrl(null);
    setCurrentFile(null);
    setReceipt({ merchant: "", date: "", total: "", items: [{ id: genId(), item_name: "", price: "" }], id:"" });
  };


      return (
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

            {imageUrl && !hasScanned && !isScanning && (
              <button
                onClick={() => {
                  if (currentFile) startScan(currentFile);
                }}
                className="w-full py-3 rounded bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Scan Receipt
              </button>
            )}

            {isScanning && (
              <div className="rounded-md bg-card border border-border px-4 py-3 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-foreground font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>
                    Analyzing receipt...
                  </span>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {scanProgress}%
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  Extracting merchant, items, and totals from image...
                </span>
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
          <div className="flex flex-col w-full lg:w-1/2 p-4 lg:p-6 gap-6 overflow-auto">
            <h2 className="text-base lg:text-sm font-semibold uppercase tracking-widest text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
              Extracted Data
            </h2>

            {/* Meta fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm lg:text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  <Store className="w-4 h-4 lg:w-3 lg:h-3" /> Merchant
                </label>
                <input
                  type="text"
                  value={receipt.merchant}
                  onChange={e => setReceipt(r => ({ ...r, merchant: e.target.value }))}
                  placeholder="e.g. Whole Foods"
                  className="bg-input-background border border-border rounded px-4 py-3 lg:py-2.5 text-base lg:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm lg:text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  <CalendarDays className="w-4 h-4 lg:w-3 lg:h-3" /> Date
                </label>
                <input
                  type="date"
                  value={receipt.date}
                  onChange={e => setReceipt(r => ({ ...r, date: e.target.value }))}
                  className="bg-input-background border border-border rounded px-4 py-3 lg:py-2.5 text-base lg:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors [color-scheme:dark]"
                />
              </div>
              <div className="col-span-1 sm:col-span-2 flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm lg:text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  <DollarSign className="w-4 h-4 lg:w-3 lg:h-3" /> Total Amount
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
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm lg:text-xs text-muted-foreground uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
                  Line Items
                </span>
                <button
                  onClick={addItem}
                  className="flex items-center gap-1.5 px-3 py-2 lg:py-0 text-sm lg:text-xs text-primary hover:text-primary/80 transition-colors"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  <Plus className="w-4 h-4 lg:w-3 lg:h-3" /> Add row
                </button>
              </div>

              {/* Header row */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-1">
                <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>Item Name</span>
                <span className="text-xs text-muted-foreground w-20 text-right" style={{ fontFamily: "'DM Mono', monospace" }}>Price</span>
                <span className="w-6" />
              </div>

              <div className="flex flex-col gap-2">
                {receipt.items.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center group">
                    <input
                      type="text"
                      value={item.item_name}
                      onChange={e => updateItem(item.id, "item_name", e.target.value)}
                      placeholder={`Item ${idx + 1}`}
                      className="bg-input-background border border-border rounded px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                    />
                    <input
                      type="text"
                      value={item.price}
                      onChange={e => updateItem(item.id, "price", e.target.value)}
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

            <button 
              onClick={ () =>
                saveData(receipt)
              }
              className="mt-auto w-full py-2.5 rounded bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.99] transition-all"
              
              >
              Save Receipt
            </button>
          </div>
        </div>
      )
}

