import { useState, useRef, useCallback } from "react";
import {type ReceiptData, type View} from "../types/index.ts";
import {genId, DEMO_RECEIPTS} from "../data/receipts.ts";
import { Upload, Search, BarChart2, Receipt, X, Plus, Trash2, ChevronRight, CalendarDays, Store, DollarSign, ChevronLeft } from "lucide-react";

export default function SearchView(){



const [searchQuery, setSearchQuery] = useState("");
const [searchFilter, setSearchFilter] = useState<"all" | "merchants" | "items">("all");




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



{/* Search View */}
      return (
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
          {/*Search filter buttons (Merchant,Items,Both)*/}
           <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>Filter:</span>
              {(["all", "merchants", "items"] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setSearchFilter(filter)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    searchFilter === filter
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

          {searchQuery.trim().length > 1 && (
            <div className="flex flex-col gap-4">
              {/* Merchant results */}
              {filteredMerchants.length > 0 && (searchFilter === "all" || searchFilter === "merchants") && (
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
              {filteredItems.length > 0 && (searchFilter === "all" || searchFilter === "items") && (
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

              {(searchFilter === "all" || searchFilter === "items" ? filteredItems.length === 0 : true) &&
              (searchFilter === "all" || searchFilter === "merchants" ? filteredMerchants.length === 0 : true) && (
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
      )
  }
    
