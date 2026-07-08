"use client";

import { useState } from "react";
import { addItemToCollateralAction } from "../tambah/actions";

export default function AddItemForm({ collateralId }: { collateralId: string }) {
  const [type, setType] = useState("");

  const isBpkb = type.includes("BPKB");
  const isShm = type.includes("SHM") || type.includes("SHGB");

  // Bind collateralId to the action
  const actionWithId = addItemToCollateralAction.bind(null, collateralId);

  return (
    <form action={actionWithId}>
      <div className="form-group">
        <label className="form-label" htmlFor="type">Jenis Agunan *</label>
        <select
          id="type"
          name="type"
          className="form-input"
          required
          value={type}
          onChange={e => setType(e.target.value)}
        >
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
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="noBpkb">No. BPKB</label>
            <input type="text" id="noBpkb" name="noBpkb" className="form-input" placeholder="Masukkan nomor BPKB" />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="namaBpkb">Nama Pemilik di BPKB</label>
            <input type="text" id="namaBpkb" name="namaBpkb" className="form-input" placeholder="Nama sesuai BPKB" />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="noPol">No. Polisi</label>
            <input type="text" id="noPol" name="noPol" className="form-input" placeholder="Contoh: AG 1234 XY" />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="kendaraanJenis">Jenis Kendaraan</label>
            <input type="text" id="kendaraanJenis" name="kendaraanJenis" className="form-input" placeholder="Mobil / Motor / Truk" />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="kendaraanMerk">Merk Kendaraan</label>
            <input type="text" id="kendaraanMerk" name="kendaraanMerk" className="form-input" placeholder="Honda / Toyota / Suzuki" />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="kendaraanTahun">Tahun Pembuatan</label>
            <input type="text" id="kendaraanTahun" name="kendaraanTahun" className="form-input" placeholder="Tahun pembuatan kendaraan" />
          </div>
        </div>
      )}

      {isShm && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="noShm">No. SHM / SHGB</label>
            <input type="text" id="noShm" name="noShm" className="form-input" placeholder="Masukkan nomor Sertifikat" />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="namaPemilikShm">Nama Pemilik SHM</label>
            <input type="text" id="namaPemilikShm" name="namaPemilikShm" className="form-input" placeholder="Nama pemilik di Sertifikat" />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="alamatShm">Alamat Lokasi SHM</label>
            <textarea id="alamatShm" name="alamatShm" className="form-input" rows={3} placeholder="Alamat lokasi tanah/bangunan"></textarea>
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="description">Keterangan Tambahan</label>
        <input type="text" id="description" name="description" className="form-input" placeholder="Keterangan opsional" />
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
        💾 Tambah Item ke Nasabah
      </button>
    </form>
  );
}
