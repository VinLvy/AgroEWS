"use client";

import React, { useState } from "react";
import { INITIAL_CONTACTS, type PrototypeContact } from "@/lib/prototype-data";
import { StatusIcon } from "@/components/agro/StatusIcon";

export function ContactsClient() {
  const [contacts, setContacts] = useState<PrototypeContact[]>(INITIAL_CONTACTS);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "opt-out">("all");
  const [unmaskedPhones, setUnmaskedPhones] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showCsvModal, setShowCsvModal] = useState<boolean>(false);

  // New Contact Form State
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [poktan, setPoktan] = useState<string>("Poktan Makmur");
  const [dusun, setDusun] = useState<string>("Dusun I");
  const [channel, setChannel] = useState<"whatsapp" | "telegram">("whatsapp");
  const [hasOptIn, setHasOptIn] = useState<boolean>(true);

  // CSV Mock State
  const [csvPreview, setCsvPreview] = useState<string>(
    `nama,telepon,poktan,dusun,channel,opt_in_tanggal\nPak Warsito,+6281299887701,Poktan Makmur,Dusun II,whatsapp,2026-11-01\nPak Darman,+6281299887702,Poktan Sejahtera,Dusun I,whatsapp,2026-11-02\nPak Herman,+6281299887703,Poktan Tani Jaya,Dusun IV,telegram,2026-11-03`
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const togglePhoneMask = (id: string) => {
    setUnmaskedPhones((prev) => {
      const next = !prev[id];
      showToast(next ? "Sensor nomor HP dibuka untuk keperluan dinas." : "Nomor HP kembali disensor.");
      return { ...prev, [id]: next };
    });
  };

  const handleTestPing = (contact: PrototypeContact) => {
    showToast(`Pesan uji (ping diseminasi) berhasil dikirim via ${contact.channel.toUpperCase()} ke ${contact.name}.`);
  };

  const handleToggleOptOut = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === "active" ? "opt-out" : "active";
          showToast(
            nextStatus === "opt-out"
              ? `${c.name} telah di-opt-out (tidak akan menerima broadcast).`
              : `${c.name} berhasil diaktifkan kembali.`
          );
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.startsWith("+62")) {
      showToast("Nomor telepon wajib berformat E.164 diawali +62.");
      return;
    }

    const masked = `${phone.slice(0, 7)}-****-${phone.slice(-4)}`;
    const newContact: PrototypeContact = {
      id: `c-${Date.now()}`,
      name,
      phone,
      phoneMasked: masked,
      poktan,
      dusun,
      channel,
      optInDate: new Date().toISOString().split("T")[0]!,
      status: hasOptIn ? "active" : "opt-out",
    };

    setContacts([newContact, ...contacts]);
    setShowAddModal(false);
    setName("");
    setPhone("");
    showToast(`Kontak ${name} berhasil ditambahkan ke basis data.`);
  };

  const handleImportCsv = () => {
    const lines = csvPreview.trim().split("\n");
    if (lines.length <= 1) {
      showToast("CSV kosong atau format tidak sesuai.");
      return;
    }

    const imported: PrototypeContact[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]?.split(",") || [];
      if (cols.length >= 6) {
        const cPhone = cols[1]!.trim();
        const masked = `${cPhone.slice(0, 7)}-****-${cPhone.slice(-4)}`;
        imported.push({
          id: `csv-${Date.now()}-${i}`,
          name: cols[0]!.trim(),
          phone: cPhone,
          phoneMasked: masked,
          poktan: cols[2]!.trim(),
          dusun: cols[3]!.trim(),
          channel: (cols[4]!.trim().toLowerCase() as "whatsapp" | "telegram") || "whatsapp",
          optInDate: cols[5]!.trim(),
          status: "active",
        });
      }
    }

    setContacts([...imported, ...contacts]);
    setShowCsvModal(false);
    showToast(`Berhasil mengimpor ${imported.length} data kontak petani baru.`);
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && c.status === "active") ||
      (filterStatus === "opt-out" && c.status === "opt-out");

    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.poktan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dusun.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700 text-sm font-medium transition-all"
        >
          <StatusIcon name="check-circle-2" className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content-primary">
            Manajemen Kontak &amp; Petani Binaan
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Pengelolaan nomor penerima siaran peringatan dini agroklimat dengan validasi opt-in dan masking PII (§11).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCsvModal(true)}
            className="min-h-[48px] px-4 py-2.5 inline-flex items-center gap-2 bg-surface-card border-[1.5px] border-border-card text-content-primary hover:bg-surface-subtle text-sm font-bold rounded-xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-agri-700"
          >
            <StatusIcon name="upload" className="w-4 h-4 text-content-secondary" />
            <span>Impor CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="min-h-[48px] px-5 py-2.5 inline-flex items-center gap-2 bg-agri-700 text-white hover:bg-agri-800 active:bg-agri-900 text-sm font-bold rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-agri-700"
          >
            <StatusIcon name="plus" className="w-4 h-4" />
            <span>Tambah Kontak Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-surface-card p-4 rounded-2xl border-[1.5px] border-border-card shadow-bento">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
            Status:
          </span>
          <button
            onClick={() => setFilterStatus("all")}
            className={`min-h-[44px] px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors ${
              filterStatus === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-surface-subtle text-content-secondary hover:bg-slate-200"
            }`}
          >
            Semua ({contacts.length})
          </button>
          <button
            onClick={() => setFilterStatus("active")}
            className={`min-h-[44px] px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors ${
              filterStatus === "active"
                ? "bg-agri-700 text-white shadow-xs"
                : "bg-status-green-bg text-status-green-text border border-status-green-border hover:bg-emerald-100"
            }`}
          >
            Aktif Opt-In ({contacts.filter((c) => c.status === "active").length})
          </button>
          <button
            onClick={() => setFilterStatus("opt-out")}
            className={`min-h-[44px] px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors ${
              filterStatus === "opt-out"
                ? "bg-red-700 text-white shadow-xs"
                : "bg-status-red-bg text-status-red-text border border-status-red-border hover:bg-red-100"
            }`}
          >
            Opt-Out / Berhenti ({contacts.filter((c) => c.status === "opt-out").length})
          </button>
        </div>

        <input
          type="text"
          placeholder="Cari nama / nomor / poktan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-h-[44px] w-full sm:w-64 px-3.5 py-2 text-sm rounded-xl border-[1.5px] border-border-strong focus:outline-none focus:ring-2 focus:ring-agri-700 text-content-primary bg-white"
        />
      </div>

      {/* Contacts Table */}
      <div className="bg-surface-card rounded-3xl border-[1.5px] border-border-card overflow-hidden shadow-bento">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
              <tr>
                <th className="py-3 px-4">Nama Petani</th>
                <th className="py-3 px-4">Kelompok Tani</th>
                <th className="py-3 px-4">Dusun</th>
                <th className="py-3 px-4">Nomor HP (Sensor PII)</th>
                <th className="py-3 px-4">Saluran</th>
                <th className="py-3 px-4">Opt-In Tanggal</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-500">
                    Tidak ada kontak yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => {
                  const isUnmasked = !!unmaskedPhones[contact.id];
                  const isActive = contact.status === "active";

                  return (
                    <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {contact.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{contact.poktan}</td>
                      <td className="py-3.5 px-4 text-slate-600">{contact.dusun}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{isUnmasked ? contact.phone : contact.phoneMasked}</span>
                          <button
                            onClick={() => togglePhoneMask(contact.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded"
                            title={isUnmasked ? "Tutup sensor" : "Buka sensor"}
                            aria-label={isUnmasked ? "Tutup sensor" : "Buka sensor"}
                          >
                            <StatusIcon
                              name={isUnmasked ? "eye-off" : "eye"}
                              className="w-4 h-4"
                            />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase bg-slate-100 text-slate-700">
                          {contact.channel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                        {contact.optInDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            isActive
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-red-100 text-red-900"
                          }`}
                        >
                          {isActive ? "Aktif" : "Opt-Out"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleTestPing(contact)}
                            className="min-h-[40px] px-2.5 py-1 inline-flex items-center gap-1 text-xs font-semibold text-[var(--agri-primary-700)] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                          >
                            <StatusIcon name="send" className="w-3.5 h-3.5" />
                            <span>Kirim Tes</span>
                          </button>

                          <button
                            onClick={() => handleToggleOptOut(contact.id)}
                            className={`min-h-[40px] px-2.5 py-1 text-xs font-bold rounded-lg transition-colors border ${
                              isActive
                                ? "text-red-900 bg-red-100 hover:bg-red-200 active:bg-red-300 border-red-300"
                                : "text-emerald-900 bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 border-emerald-300"
                            }`}
                          >
                            {isActive ? "Set Opt-Out" : "Aktifkan"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Kontak Baru */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-surface-card rounded-3xl shadow-bento-lg max-w-md w-full p-6 space-y-4 border-[1.5px] border-border-card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-content-primary">Tambah Kontak Petani</h2>
                <p className="text-xs text-content-muted mt-0.5">
                  Registrasi kontak penerima siaran peringatan dini baru.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="min-h-[44px] min-w-[44px] text-content-muted hover:text-content-primary hover:bg-surface-subtle inline-flex items-center justify-center rounded-xl transition-colors"
                aria-label="Tutup dialog"
              >
                <StatusIcon name="x" className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Petani:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pak Maryono"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="min-h-[44px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor HP (E.164 diawali +62):
                </label>
                <input
                  type="text"
                  required
                  placeholder="+6281234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="min-h-[44px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelompok Tani:
                  </label>
                  <input
                    type="text"
                    required
                    value={poktan}
                    onChange={(e) => setPoktan(e.target.value)}
                    className="min-h-[44px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dusun:
                  </label>
                  <input
                    type="text"
                    required
                    value={dusun}
                    onChange={(e) => setDusun(e.target.value)}
                    className="min-h-[44px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Saluran Diseminasi:
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as "whatsapp" | "telegram")}
                  className="min-h-[44px] w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                >
                  <option value="whatsapp">WhatsApp (Nomor Telepon)</option>
                  <option value="telegram">Telegram (Chat ID/Nomor)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="optin-check"
                  checked={hasOptIn}
                  onChange={(e) => setHasOptIn(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="optin-check" className="text-xs text-slate-700">
                  Petani telah menyatakan persetujuan (*opt-in*) menerima pesan peringatan dini (§11).
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[48px] px-4 py-2 text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 hover:text-slate-950 active:bg-slate-300 border border-slate-300 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[48px] px-4 py-2 text-sm font-bold text-white bg-[var(--agri-primary-700)] hover:bg-[var(--agri-primary-800)] rounded-lg shadow-xs"
                >
                  Simpan Kontak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Impor CSV */}
      {showCsvModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-surface-card rounded-3xl shadow-bento-lg max-w-lg w-full p-6 space-y-4 border-[1.5px] border-border-card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-content-primary">Impor Kontak Petani dari CSV</h2>
                <p className="text-xs text-content-muted mt-0.5">
                  Format: nama, telepon (+62), poktan, dusun, channel, opt_in_tanggal
                </p>
              </div>
              <button
                onClick={() => setShowCsvModal(false)}
                className="min-h-[44px] min-w-[44px] text-content-muted hover:text-content-primary hover:bg-surface-subtle inline-flex items-center justify-center rounded-xl transition-colors"
                aria-label="Tutup dialog"
              >
                <StatusIcon name="x" className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Pratinjau Data CSV (Bisa diedit langsung):
              </label>
              <textarea
                rows={5}
                value={csvPreview}
                onChange={(e) => setCsvPreview(e.target.value)}
                className="w-full px-3 py-2 font-mono text-xs border border-slate-300 rounded-lg text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[var(--agri-primary-700)]"
              />
              <p className="text-[11px] text-slate-500">
                Sistem secara otomatis memverifikasi format nomor E.164 dan menolak baris tanpa opt-in yang valid (§8).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="min-h-[48px] px-4 py-2 text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 hover:text-slate-950 active:bg-slate-300 border border-slate-300 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImportCsv}
                className="min-h-[48px] px-4 py-2 text-sm font-bold text-white bg-[var(--agri-primary-700)] hover:bg-[var(--agri-primary-800)] rounded-lg shadow-xs"
              >
                Proses Impor CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
