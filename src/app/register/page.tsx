"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerAction } from "./actions";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("username", username);
    formData.append("password", password);
    formData.append("role", role);

    const res = await registerAction(null, formData);

    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--background)" }}>
      <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "420px", padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", color: "var(--primary)", marginBottom: "0.5rem" }}>Daftar Akun Baru</h1>
          <p style={{ color: "var(--secondary)" }}>Lengkapi formulir di bawah ini</p>
        </div>

        {error && (
          <div style={{ padding: "0.75rem", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "var(--radius)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: "0.75rem", backgroundColor: "#ecfdf5", color: "#047857", borderRadius: "var(--radius)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            Registrasi berhasil! Mengalihkan ke halaman login...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Nama Lengkap</label>
            <input
              id="name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nama lengkap Anda"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Pilih username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Masukkan password"
            />
          </div>

          <div className="form-group" style={{ marginBottom: "2rem" }}>
            <label className="form-label" htmlFor="role">Jabatan / Role</label>
            <select
              id="role"
              className="form-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="">Pilih Jabatan</option>
              <option value="ADM_KREDIT">Admin Kredit</option>
              <option value="KABAG_OPERASIONAL">Kabag Operasional</option>
              <option value="PIMPINAN_CABANG">Pimpinan Cabang</option>
              <option value="DIREKTUR">Direktur</option>
              <option value="KEPALA_KAS">Kepala Kas</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginBottom: "1rem" }}
            disabled={loading || success}
          >
            {loading ? "Memproses..." : "Daftar Sekarang"}
          </button>

          <div style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--secondary)" }}>
            Sudah punya akun?{" "}
            <Link href="/login" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none" }}>
              Masuk di sini
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
