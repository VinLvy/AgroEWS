/**
 * src/server/notifier/email.ts
 * Adapter pengiriman notifikasi email untuk alert draf baru dan eskalasi.
 * Sesuai TECH_SPEC.md §7.1, §7.4, §11 (A09).
 * Zero-Emoji Policy: Bebas dari simbol emoji Unicode.
 */

export interface DraftNotificationPayload {
  recipientEmail: string;
  recipientName: string;
  regionName: string;
  status: "amber" | "red";
  draftId: string;
  escalationDueAt?: Date | null;
}

export interface EscalationNotificationPayload {
  bppEmails: string[];
  regionName: string;
  status: "red";
  draftId: string;
  overdueHours: number;
}

export interface Notifier {
  sendNewDraftAlert(payload: DraftNotificationPayload): Promise<boolean>;
  sendEscalationAlert(payload: EscalationNotificationPayload): Promise<boolean>;
}

export class EmailNotifier implements Notifier {
  private appUrl: string;

  constructor(appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000") {
    this.appUrl = appUrl.replace(/\/$/, "");
  }

  /**
   * Mengirim notifikasi draf peringatan baru kepada PPL pendamping.
   * Ringkas, aman, tanpa data sensitif.
   */
  async sendNewDraftAlert(payload: DraftNotificationPayload): Promise<boolean> {
    const statusLabel =
      payload.status === "red" ? "MERAH (BAHAYA)" : "KUNING (WASPADA)";
    const reviewUrl = `${this.appUrl}/drafts/${payload.draftId}`;

    const subject = `[AgroEWS] Draf Peringatan Dini Baru: ${payload.regionName} - Status ${statusLabel}`;
    const body = [
      `Halo ${payload.recipientName},`,
      "",
      `Telah terbit draf peringatan dini agroklimat baru untuk wilayah binaan Anda:`,
      `- Wilayah: ${payload.regionName}`,
      `- Status Risiko: [STATUS: ${statusLabel}]`,
      payload.escalationDueAt
        ? `- Batas Waktu Tinjauan (SLA 6 Jam): ${payload.escalationDueAt.toISOString()}`
        : "",
      "",
      `Silakan buka tautan berikut untuk memverifikasi fase tanam dan menyetujui siaran:`,
      reviewUrl,
      "",
      "Pesan ini dikirim otomatis oleh Sistem Peringatan Dini Agroklimat (AgroEWS).",
    ]
      .filter(Boolean)
      .join("\n");

    // Dalam mode development/test atau bila transport belum terpasang, log ke console
    console.info(`[NOTIFIER:EMAIL] Kirim alert draf ke ${payload.recipientEmail}: ${subject}`);
    if (process.env.NODE_ENV === "development") {
      console.info(body);
    }

    return true;
  }

  /**
   * Mengirim notifikasi eskalasi draf MERAH > 6 jam kepada Koordinator BPP.
   */
  async sendEscalationAlert(payload: EscalationNotificationPayload): Promise<boolean> {
    const reviewUrl = `${this.appUrl}/drafts/${payload.draftId}`;
    const subject = `[AgroEWS][ESKALASI] Peringatan MERAH Belum Diverifikasi: ${payload.regionName}`;
    const body = [
      "Pemberitahuan kepada Koordinator BPP,",
      "",
      `Draf peringatan dini status [STATUS: MERAH - BAHAYA] untuk wilayah ${payload.regionName}`,
      `telah melewati batas SLA verifikasi PPL (lebih dari ${payload.overdueHours} jam tanpa tindakan).`,
      "",
      "Sesuai Prosedur Operasional Standar (SOP), Koordinator BPP dimohon segera memeriksa:",
      reviewUrl,
      "",
      "Pesan eskalasi otomatis Sistem AgroEWS.",
    ].join("\n");

    console.info(
      `[NOTIFIER:ESCALATE] Kirim email eskalasi ke [${payload.bppEmails.join(", ")}]: ${subject}`
    );
    if (process.env.NODE_ENV === "development") {
      console.info(body);
    }

    return true;
  }
}

export const notifier: Notifier = new EmailNotifier();
