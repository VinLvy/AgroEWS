"use client";

import React, { useState } from "react";
import { StatusIcon } from "@/components/agro/StatusIcon";

interface ChatMessage {
  id: string;
  sender: "bot" | "farmer";
  time: string;
  text: string;
  isTemplate?: boolean;
  quickReplyPayload?: string;
}

export function SimulatorClient() {
  const [channel, setChannel] = useState<"whatsapp" | "telegram">("whatsapp");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "bot",
      time: "07:00 WIB",
      text: `PERINGATAN DINI AGROKLIMAT: Status BAHAYA (MERAH) terdeteksi di Nagari Sungai Bangek akibat kelembapan tinggi beruntun.\n\nTekan tombol di bawah untuk rekomendasi teknis PPL:`,
      isTemplate: true,
      quickReplyPayload: "ALERT:bcast-red-20261114",
    },
  ]);
  const [inputText, setInputText] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleQuickReply = (payload: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} WIB`;

    // 1. Farmer sends payload
    const farmerMsg: ChatMessage = {
      id: `msg-${Date.now()}-f`,
      sender: "farmer",
      time: timeStr,
      text: `[Pilihan Cepat]: Buka Rekomendasi Lengkap`,
    };

    // 2. Bot replies with full monospace wrapped session text (as formatted by core/formatter)
    const botSessionMsg: ChatMessage = {
      id: `msg-${Date.now()}-b`,
      sender: "bot",
      time: timeStr,
      text: `\`\`\`\n======================================\nPERINGATAN DINI AGROKLIMAT - AgroEWS\nBalai Penyuluhan Pertanian (BPP) Kuranji\n======================================\nWILAYAH : Nagari Sungai Bangek\nTANGGAL : 14 November 2026\nSTATUS  : [BAHAYA / MERAH]\n--------------------------------------\nINDIKATOR CUACA 3 HARI:\n- Suhu Rerata    : 27.2 C (optimum)\n- Kelembapan RH  : 86.5 % (>85% kritis)\n- Curah Hujan    : 3.8 mm (rintik lembap)\n--------------------------------------\nFASE TANAMAN: VEGETATIF (ANAKAN AKTIF)\n\nREKOMENDASI TEKNIS PPL:\n1. Keringkan sawah bertahap (intermittent).\n2. Jaga muka air macak-macak 1-2 cm.\n3. Bersihkan gulma di pematang sawah.\n4. Tunda pemupukan Nitrogen/Urea berlebih.\n5. Amati pangkal batang padi tiap 2 hari.\n--------------------------------------\nKONFIRMASI LAPANGAN (Ketik balasan):\nLAPOR [Nama-Dusun] [0/1/2]\n  0 = Aman (0 ekor)\n  1 = Waspada (1-4 ekor/rumpun)\n  2 = Bahaya (>=5 ekor/rumpun)\nContoh: LAPOR Dusun-2 1\n\nKetik STOP untuk berhenti berlangganan.\n======================================\n\`\`\``,
    };

    setMessages((prev) => [...prev, farmerMsg, botSessionMsg]);
    showToast("Pesan sesi penuh rekomendasi teknis dikirimkan ke petani.");
  };

  const handleSendMessage = (textToSend?: string) => {
    const raw = (textToSend || inputText).trim();
    if (!raw) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} WIB`;

    const farmerMsg: ChatMessage = {
      id: `msg-${Date.now()}-f`,
      sender: "farmer",
      time: timeStr,
      text: raw,
    };

    // System automated parser logic
    let botReplyText = "";
    const upper = raw.toUpperCase();

    if (upper === "STOP" || upper === "BERHENTI") {
      botReplyText =
        "Nomor Anda berhasil di-opt out dari siaran AgroEWS. Anda tidak akan menerima peringatan otomatis lagi. Ketik GABUNG untuk mengaktifkan kembali.";
    } else if (upper === "GABUNG" || upper === "START") {
      botReplyText =
        "Pendaftaran berhasil diaktifkan kembali. Anda akan menerima peringatan dini agroklimat bila risiko terdeteksi di wilayah binaan Anda.";
    } else if (upper.startsWith("LAPOR")) {
      const parts = raw.split(/\s+/);
      if (parts.length >= 3) {
        const dusun = parts[1]?.replace("-", " ") || "Dusun";
        const code = parts[2];
        const statusMap: Record<string, string> = {
          "0": "Aman (0 ekor)",
          "1": "Waspada (1-4 ekor)",
          "2": "Bahaya (>=5 ekor)",
        };
        const statusLabel = statusMap[code || ""] || `Kode ${code}`;
        botReplyText = `Laporan diterima. Wilayah ${dusun}, status ${statusLabel}. Data diteruskan ke Dasbor PPL untuk verifikasi. Terima kasih atas partisipasi Anda.`;
      } else {
        botReplyText =
          "Format laporan belum tepat. Gunakan format: LAPOR [Nama-Dusun] [Kode: 0/1/2]. Contoh: LAPOR Dusun-2 1";
      }
    } else if (upper === "BANTUAN" || upper === "HELP") {
      botReplyText =
        "PANDUAN AGROEWS:\n- Balas LAPOR [Dusun] [0/1/2] untuk melaporkan kondisi wereng.\n- Balas STOP untuk berhenti langganan.\n- Hubungi PPL Kuranji di BPP untuk konsultasi pengendalian hama.";
    } else {
      botReplyText =
        "Perintah tidak dikenali. Ketik LAPOR [Nama-Dusun] [0/1/2] untuk melaporkan wereng, atau BANTUAN untuk informasi petunjuk.";
    }

    const botMsg: ChatMessage = {
      id: `msg-${Date.now()}-b`,
      sender: "bot",
      time: timeStr,
      text: botReplyText,
    };

    setMessages((prev) => [...prev, farmerMsg, botMsg]);
    setInputText("");
  };

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
          <span className="text-xs font-bold uppercase tracking-wider text-agri-700 block mb-1">
            Diseminasi Multi-Kanal Ramah Fitur Phone
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content-primary">
            Simulator Pesan Petani (WhatsApp &amp; Telegram)
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Uji interaksi dua arah penerimaan draf siaran dan pelaporan balik ground-truthing tanpa butuh API eksternal.
          </p>
        </div>

        {/* Channel Selector */}
        <div className="flex items-center gap-1.5 bg-surface-subtle p-1.5 rounded-2xl border border-border-subtle">
          <button
            onClick={() => setChannel("whatsapp")}
            className={`min-h-[48px] px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              channel === "whatsapp" ? "bg-agri-700 text-white shadow-sm" : "text-content-secondary hover:text-content-primary"
            }`}
          >
            WhatsApp Mode
          </button>
          <button
            onClick={() => setChannel("telegram")}
            className={`min-h-[48px] px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              channel === "telegram" ? "bg-blue-700 text-white shadow-sm" : "text-content-secondary hover:text-content-primary"
            }`}
          >
            Telegram Mode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Virtual Phone Mockup */}
        <div className="lg:col-span-2 flex justify-center bg-surface-card border-[1.5px] border-border-card rounded-3xl p-6 shadow-bento">
          <div className="w-full max-w-md bg-slate-900 rounded-[40px] p-3.5 shadow-bento-lg border-4 border-slate-800">
            {/* Phone Screen Container */}
            <div className="bg-[#EFEAE2] rounded-[30px] overflow-hidden flex flex-col h-[590px]">
              {/* Phone Status Bar */}
              <div className="bg-slate-900 text-white px-6 py-2 text-[11px] font-mono flex justify-between items-center">
                <span>09:41 WIB</span>
                <span className="text-emerald-300 font-bold">AgroEWS Bot Live</span>
                <span>4G</span>
              </div>

              {/* Chat Header */}
              <div
                className={`px-4 py-3 text-white flex items-center justify-between shadow-xs ${
                  channel === "whatsapp" ? "bg-[#075E54]" : "bg-[#229ED9]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                    {channel === "whatsapp" ? "WA" : "TG"}
                  </div>
                  <div>
                    <div className="font-bold text-sm leading-tight">
                      AgroEWS Peringatan Dini
                    </div>
                    <div className="text-[11px] text-white/80">
                      Balai Penyuluhan Pertanian (BPP)
                    </div>
                  </div>
                </div>
                <div className="text-xs bg-white/20 px-2 py-0.5 rounded text-white font-mono">
                  RESMI
                </div>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {messages.map((m) => {
                  const isBot = m.sender === "bot";

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isBot ? "items-start" : "items-end"}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-lg p-3 text-xs leading-relaxed shadow-xs ${
                          isBot
                            ? "bg-white text-slate-900 rounded-tl-none border border-slate-200"
                            : "bg-[#DCF8C6] text-slate-900 rounded-tr-none border border-emerald-200"
                        }`}
                      >
                        {m.text.startsWith("```") ? (
                          <pre className="font-mono text-[11px] whitespace-pre-wrap bg-slate-900 text-emerald-300 p-2.5 rounded border border-slate-800 overflow-x-auto">
                            {m.text.replace(/```/g, "")}
                          </pre>
                        ) : (
                          <div className="whitespace-pre-wrap">{m.text}</div>
                        )}

                        {m.isTemplate && m.quickReplyPayload && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200">
                            <button
                              onClick={() => handleQuickReply(m.quickReplyPayload!)}
                              className="w-full py-2 px-3 text-center text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 rounded border border-emerald-300 transition-colors"
                            >
                              [ Buka Rekomendasi Lengkap ]
                            </button>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 text-right mt-1 font-mono">
                          {m.time}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <div className="bg-white p-2.5 border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ketik LAPOR Dusun-2 1..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="min-h-[44px] flex-1 px-3 py-2 text-xs bg-slate-100 rounded-full border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="min-h-[44px] min-w-[44px] rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center transition-colors shadow-xs"
                  aria-label="Kirim balasan chat"
                >
                  <StatusIcon name="send" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Testing Panel */}
        <div className="bg-surface-card rounded-3xl border-[1.5px] border-border-card p-5 sm:p-6 shadow-bento space-y-4">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="text-base font-extrabold text-content-primary">
              Tombol Aksi Uji Cepat (Testing Shortcuts)
            </h2>
            <p className="text-xs font-medium text-content-muted mt-0.5">
              Klik salah satu tombol di bawah untuk menyimulasikan respon petani secara instan:
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => handleSendMessage("LAPOR Dusun-2 2")}
              className="w-full min-h-[48px] text-left p-3.5 rounded-2xl border-[1.5px] border-status-red-border bg-status-red-bg hover:bg-red-100 transition-colors"
            >
              <div className="text-xs font-extrabold text-status-red-text font-mono">
                LAPOR Dusun-2 2
              </div>
              <div className="text-[11px] text-red-800 mt-0.5 font-medium">
                Simulasi temuan wereng berat (&gt;=5 ekor/rumpun) &rarr; memicu jadwal POPT di feed.
              </div>
            </button>

            <button
              onClick={() => handleSendMessage("LAPOR Dusun-1 1")}
              className="w-full min-h-[48px] text-left p-3.5 rounded-2xl border-[1.5px] border-status-amber-border bg-status-amber-bg hover:bg-amber-100 transition-colors"
            >
              <div className="text-xs font-extrabold text-status-amber-text font-mono">
                LAPOR Dusun-1 1
              </div>
              <div className="text-[11px] text-amber-900 mt-0.5 font-medium">
                Simulasi temuan waspada (1-4 ekor/rumpun).
              </div>
            </button>

            <button
              onClick={() => handleSendMessage("LAPOR Dusun-3 0")}
              className="w-full min-h-[48px] text-left p-3.5 rounded-2xl border-[1.5px] border-status-green-border bg-status-green-bg hover:bg-emerald-100 transition-colors"
            >
              <div className="text-xs font-extrabold text-status-green-text font-mono">
                LAPOR Dusun-3 0
              </div>
              <div className="text-[11px] text-agri-800 mt-0.5 font-medium">
                Simulasi kondisi petak aman (0 ekor).
              </div>
            </button>

            <button
              onClick={() => handleSendMessage("STOP")}
              className="w-full min-h-[48px] text-left p-3.5 rounded-2xl border-[1.5px] border-border-card bg-surface-subtle hover:bg-slate-200 transition-colors"
            >
              <div className="text-xs font-extrabold text-content-primary font-mono">
                STOP
              </div>
              <div className="text-[11px] text-content-secondary mt-0.5 font-medium">
                Simulasi opt-out instan petani dari pengiriman pesan siaran (§11).
              </div>
            </button>

            <button
              onClick={() => handleSendMessage("BANTUAN")}
              className="w-full min-h-[48px] text-left p-3.5 rounded-2xl border-[1.5px] border-border-card bg-surface-subtle hover:bg-slate-200 transition-colors"
            >
              <div className="text-xs font-extrabold text-content-primary font-mono">
                BANTUAN
              </div>
              <div className="text-[11px] text-content-secondary mt-0.5 font-medium">
                Melihat panduan sintaks format pelaporan otomatis.
              </div>
            </button>
          </div>

          <div className="p-4 bg-gradient-to-br from-agri-700 to-agri-900 rounded-2xl text-white text-xs space-y-1.5">
            <div className="font-extrabold uppercase tracking-wider text-emerald-100">
              Kepatuhan Kebijakan:
            </div>
            <div>&bull; Zero-Emoji Policy terjamin pada seluruh template pesan.</div>
            <div>&bull; Lebar karakter maks 38 kolom untuk keterbacaan di feature phone.</div>
            <div>&bull; Idempoten: pesan berulang tidak menduplikasi antrean.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
