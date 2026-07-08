"use client";

import { useState } from "react";
import { addAgunanAction } from "./actions";

interface Approver { name: string; role: string; }

interface ItemForm {
  type: string;
  description: string;
  noBpkb: string; namaBpkb: string; noPol: string;
  kendaraanJenis: string; kendaraanMerk: string; kendaraanTahun: string;
  noShm: string; namaPemilikShm: string; alamatShm: string;
}

const emptyItem = (): ItemForm => ({
  type: "", description: "",
  noBpkb: "", namaBpkb: "", noPol: "",
  kendaraanJenis: "", kendaraanMerk: "", kendaraanTahun: "",
  noShm: "", namaPemilikShm: "", alamatShm: "",
});

export default function ClientForm({ approvers }: { approvers: Approver[] }) {
  const [items, setItems] = useState<ItemForm[]>([emptyItem()]);

  function setItem(idx: number, field: keyof ItemForm, val: string) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  }

  function addItem() { setItems(prev => [...prev, emptyItem()]); }
  function removeItem(idx: number) {
    setItems(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== idx));
  }

  return (
    <form action={addAgunanAction}>
      {/* ===== HEADER NASABAH ===== */}
      <div style={{ marginBottom: "2rem", padding: "1.25rem", backgroundColor: "rgba(99,102,241,0.06)", borderRadius: "var(--radius)", border: "1px solid rgba(99,102,241,0.2)" }}>
        <h4 style={{ marginBottom: "1rem", color: "var(--primary)" }}>📋 Data Nasabah</h4>

        <div className="form-group">
          <label className="form-label" htmlFor="customerName">Nama Nasabah *</label>
          <input type="text" id="customerName" name="customerName" className="form-input" required placeholder="Nama lengkap nasabah" />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="noRekening">No. Rekening Pinjaman *</label>
          <input type="text" id="noRekening" name="noRekening" className="form-input" required placeholder="Nomor rekening pinjaman nasabah" />
          <p style={{ fontSize: "0.75rem", color: "var(--secondary)", marginTop: "0.25rem" }}>
            * Jika no. rekening sudah terdaftar, agunan baru akan ditambahkan ke data nasabah yang ada.
          </p>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="disetujuiOleh">Disetujui Oleh</label>
          <select id="disetujuiOleh" name="disetujuiOleh" className="form-input">
            <option value="">-- Pilih Pejabat --</option>
            {approvers.map((u, i) => (
              <option key={i} value={`${u.name} - ${u.role}`}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>
      </div>

      {/* ===== ITEM AGUNAN ===== */}
      <input type="hidden" name="itemCount" value={items.length} />

      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h4 style={{ margin: 0 }}>🗂️ Item Agunan ({items.length})</h4>
          <button type="button" onClick={addItem} className="btn btn-outline" style={{ fontSize: "0.875rem" }}>
            + Tambah Item Agunan
          </button>
        </div>

        {items.map((item, idx) => (
          <ItemCard
            key={idx}
            idx={idx}
            item={item}
            total={items.length}
            onChange={(field, val) => setItem(idx, field, val)}
            onRemove={() => removeItem(idx)}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
        <button type="submit" className="btn btn-primary">💾 Simpan Data Agunan</button>
        <a href="/agunan" className="btn btn-outline" style={{ textDecoration: "none" }}>Batal</a>
      </div>
    </form>
  );
}

function ItemCard({ idx, item, total, onChange, onRemove }: {
  idx: number; item: ItemForm; total: number;
  onChange: (f: keyof ItemForm, v: string) => void;
  onRemove: () => void;
}) {
  const isBpkb = item.type.includes("BPKB");
  const isShm  = item.type.includes("SHM") || item.type.includes("SHGB");

  return (
    <div style={{
      border: "1px solid var(--border)", borderRadius: "var(--radius)",
      padding: "1.25rem", marginBottom: "1rem",
      backgroundColor: "rgba(0,0,0,0.015)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <strong style={{ fontSize: "0.9rem" }}>Item #{idx + 1}</strong>
        {total > 1 && (
          <button type="button" onClick={onRemove} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--danger)", fontSize: "0.85rem"
          }}>✕ Hapus</button>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Jenis Agunan *</label>
        <select name={`item_${idx}_type`} className="form-input" required
          value={item.type} onChange={e => onChange("type", e.target.value)}>
          <option value="">Pilih Jenis</option>
          <option value="SHM">Sertifikat Hak Milik (SHM)</option>
          <option value="SHGB">Sertifikat Hak Guna Bangunan (SHGB)</option>
          <option value="BPKB Mobil">BPKB Mobil</option>
          <option value="BPKB Motor">BPKB Motor</option>
          <option value="Deposito">Deposito</option>
          <option value="Lainnya">Lainnya</option>
        </select>
      </div>

      {isBpkb && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">No. BPKB</label>
              <input name={`item_${idx}_noBpkb`} className="form-input" placeholder="No. BPKB"
                value={item.noBpkb} onChange={e => onChange("noBpkb", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Nama di BPKB</label>
              <input name={`item_${idx}_namaBpkb`} className="form-input" placeholder="Nama pemilik di BPKB"
                value={item.namaBpkb} onChange={e => onChange("namaBpkb", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">No. Polisi</label>
              <input name={`item_${idx}_noPol`} className="form-input" placeholder="Contoh: B 1234 ABC"
                value={item.noPol} onChange={e => onChange("noPol", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Jenis Kendaraan</label>
              <input name={`item_${idx}_kendaraanJenis`} className="form-input" placeholder="Mobil / Motor"
                value={item.kendaraanJenis} onChange={e => onChange("kendaraanJenis", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Merk Kendaraan</label>
              <input name={`item_${idx}_kendaraanMerk`} className="form-input" placeholder="Toyota, Honda, dll."
                value={item.kendaraanMerk} onChange={e => onChange("kendaraanMerk", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Tahun Pembuatan</label>
              <input name={`item_${idx}_kendaraanTahun`} className="form-input" placeholder="2020"
                value={item.kendaraanTahun} onChange={e => onChange("kendaraanTahun", e.target.value)} />
            </div>
          </div>
        </>
      )}

      {isShm && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">No. SHM / SHGB</label>
              <input name={`item_${idx}_noShm`} className="form-input" placeholder="No. Sertifikat"
                value={item.noShm} onChange={e => onChange("noShm", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Nama Pemilik SHM</label>
              <input name={`item_${idx}_namaPemilikShm`} className="form-input" placeholder="Nama pemilik"
                value={item.namaPemilikShm} onChange={e => onChange("namaPemilikShm", e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Alamat Lokasi SHM</label>
            <textarea name={`item_${idx}_alamatShm`} className="form-input" rows={2} placeholder="Alamat lokasi tanah/bangunan"
              value={item.alamatShm} onChange={e => onChange("alamatShm", e.target.value)} />
          </div>
        </>
      )}

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Keterangan Tambahan</label>
        <input name={`item_${idx}_description`} className="form-input" placeholder="Keterangan opsional"
          value={item.description} onChange={e => onChange("description", e.target.value)} />
      </div>
    </div>
  );
}
