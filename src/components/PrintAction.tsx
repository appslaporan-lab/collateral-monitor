"use client";

import { useEffect } from "react";

export default function PrintAction() {
  useEffect(() => {
    // Automatically trigger print dialog when this page is loaded
    setTimeout(() => {
      window.print();
    }, 500);
  }, []);

  return (
    <div className="no-print" style={{ textAlign: 'center', marginBottom: '1rem' }}>
      <button onClick={() => window.print()} className="btn btn-primary">
        Print Sekarang
      </button>
      <button onClick={() => window.history.back()} className="btn btn-outline" style={{ marginLeft: '1rem' }}>
        Kembali
      </button>
    </div>
  );
}
