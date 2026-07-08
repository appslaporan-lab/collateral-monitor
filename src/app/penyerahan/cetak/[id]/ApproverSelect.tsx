"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Approver {
  name: string;
  role: string;
}

interface ApproverSelectProps {
  approvers: Approver[];
  defaultValue: string;
  handoverId: string;
}

export default function ApproverSelect({ approvers, defaultValue, handoverId }: ApproverSelectProps) {
  const [selected, setSelected] = useState(defaultValue);
  const router = useRouter();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelected(val);
    
    // Auto save the selected value to the server
    await fetch(`/api/handover/${handoverId}/approver`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disetujuiOleh: val })
    });
    router.refresh();
  };

  const name = selected ? selected.split(" - ")[0] : "__________________";
  const role = selected ? selected.split(" - ")[1] : "Pilih Pejabat";

  return (
    <>
      <div className="no-print" style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem', color: 'var(--secondary)' }}>Ubah Penyetuju:</label>
        <select value={selected} onChange={handleChange} style={{ padding: '0.25rem', fontSize: '0.875rem', border: '1px solid #ccc', borderRadius: '4px' }}>
          <option value="">-- Kosongkan (Garis Bawah) --</option>
          {approvers.map((a, i) => (
            <option key={i} value={`${a.name} - ${a.role}`}>{a.name} ({a.role})</option>
          ))}
        </select>
      </div>

      <div className="print-only-text">
        <p><strong>({name})</strong></p>
        <p style={{ fontSize: '0.875rem' }}>{role}</p>
      </div>
    </>
  );
}
