"use client";

import * as XLSX from "xlsx";

interface ExportExcelButtonProps {
  data: any[];
  fileName?: string;
}

export default function ExportExcelButton({ data, fileName = "Laporan_Agunan" }: ExportExcelButtonProps) {
  const exportToExcel = () => {
    // Convert array of objects to worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Agunan");
    // Write and trigger download
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <button onClick={exportToExcel} className="btn btn-primary" style={{ backgroundColor: 'var(--success)' }}>
      <svg style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export Excel
    </button>
  );
}
