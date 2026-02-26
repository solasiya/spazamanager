import { format } from "date-fns";

/**
 * Common export/import/print utilities for the Spaza Manager
 */

/**
 * Downloads data as a CSV file
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 * @param headers Optional mapping of keys to display headers
 */
export function exportToCSV(data: any[], filename: string, headers?: Record<string, string>) {
  if (!data || data.length === 0) return;

  const keys = Object.keys(headers || data[0]);
  const headerRow = (headers ? Object.values(headers) : keys).join(",");
  
  const csvRows = data.map(row => {
    return keys.map(key => {
      let val = row[key];
      
      // Handle null/undefined
      if (val === null || val === undefined) val = "";
      
      // Handle dates
      if (val instanceof Date) {
        val = format(val, "yyyy-MM-dd HH:mm:ss");
      }
      
      // Handle objects/arrays (e.g. sale items)
      if (typeof val === 'object') {
        val = JSON.stringify(val);
      }
      
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(val).replace(/"/g, '""');
      return escaped.includes(',') ? `"${escaped}"` : escaped;
    }).join(",");
  });

  const csvContent = [headerRow, ...csvRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${format(new Date(), "yyyyMMdd_HHmm")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers the browser print dialog
 */
export function printPage() {
  window.print();
}

/**
 * Generic CSV Parser (simplified)
 * @param file File object from input
 * @returns Promise with parsed data
 */
export function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter(l => l.trim().length > 0);
        if (lines.length < 2) return resolve([]);

        const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ''));
        const data = lines.slice(1).map(line => {
          const values = line.split(",").map(v => v.trim().replace(/"/g, ''));
          const entry: any = {};
          headers.forEach((header, i) => {
            entry[header] = values[i];
          });
          return entry;
        });
        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
