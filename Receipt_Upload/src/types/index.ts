
export type LineItem = { 
  id: string; 
  item_name: string; 
  price: string;
};

export type ReceiptData = {
  merchant: string;
  date: string;
  total: string;
  items: LineItem[];
  id: string;
};

export type View = "scan" | "search" | "summary";


