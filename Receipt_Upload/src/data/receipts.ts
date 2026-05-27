import { LineItem, ReceiptData } from "../types";



export function genId() {
  return Math.random().toString(36).slice(2, 9);
}


export const DEMO_RECEIPTS = [
  { id: "r1", merchant: "Whole Foods Market", date: "2026-05-18", total: "84.32", items: [{ id: "i1", description: "Organic Blueberries", amount: "5.99" }, { id: "i2", description: "Grass-Fed Ground Beef", amount: "18.49" }, { id: "i3", description: "Sourdough Loaf", amount: "7.49" }, { id: "i4", description: "Oat Milk 6-Pack", amount: "14.99" }, { id: "i5", description: "Kombucha GT's", amount: "3.99" }] },
  { id: "r2", merchant: "Shell Gas Station", date: "2026-05-16", total: "62.10", items: [{ id: "i6", description: "Premium Unleaded 14.8gal", amount: "59.94" }, { id: "i7", description: "Sparkling Water", amount: "2.16" }] },
  { id: "r3", merchant: "Chipotle Mexican Grill", date: "2026-05-14", total: "23.75", items: [{ id: "i8", description: "Burrito Bowl x2", amount: "18.50" }, { id: "i9", description: "Chips & Guac", amount: "4.25" }, { id: "i10", description: "Fountain Drink", amount: "1.00" }] },
  { id: "r4", merchant: "Amazon.com", date: "2026-05-12", total: "134.99", items: [{ id: "i11", description: "Logitech MX Keys Keyboard", amount: "109.99" }, { id: "i12", description: "USB-C Hub 7-Port", amount: "25.00" }] },
  { id: "r5", merchant: "Equinox Fitness", date: "2026-05-01", total: "195.00", items: [{ id: "i13", description: "Monthly Membership", amount: "195.00" }] },
  { id: "r6", merchant: "Whole Foods Market", date: "2026-05-01", total: "195.00", items: [{ id: "i18", description: "Whole Milk", amount: "2.00" }] }

];

export const fetchData = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/upload`, {
      method: 'POST',
      body: formData,  // don't set Content-Type header — browser sets it automatically with the boundary
    });

    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(err);
  }
};

export const saveData = async(receiptData:ReceiptData) => {

  try {
      
      const receipt = {
        "merchant_name":receiptData.merchant, 
        "date": receiptData.date, 
        "total_amount":Number(receiptData.total), 
        "items":receiptData.items.map( (item: LineItem) => ({
        item_name:item.item_name, 
        price:parseFloat(item.price)
        }))
      }
    console.log(receipt);
    const response = await fetch('/api/save', {
      method:'POST',
      headers: { 'Content-Type': 'application/json' },
      body:JSON.stringify(receipt)
    })
    
    const data = await response.json();
    return data;
  } 
  catch (err){
    console.error(err)
  }
}