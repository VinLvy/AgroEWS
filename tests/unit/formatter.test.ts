import { describe, expect, it } from "vitest";
import { formatWhatsAppSessionMessage, type MessagePayload } from "@/core/formatter/whatsapp";
import { formatTelegramMessage } from "@/core/formatter/telegram";
import { MAX_LINE_WIDTH } from "@/core/formatter/wrap";

describe("T1.7: Formatter Tests (TECH_SPEC.md §8.4 & §8.5)", () => {
  const samplePayload: MessagePayload = {
    regionName: "Kecamatan Kuranji",
    dateStr: "14 Nov 2026",
    status: "red",
    tMean: 26.8,
    rhMean: 86,
    runDays: 3,
    rainPattern: "Hujan berselang terik",
    pplName: "Budi Santoso, S.P.",
    cropPhase: "vegetatif_akhir",
  };

  it("memastikan seluruh baris dalam pesan WhatsApp tidak melebihi 38 karakter", () => {
    const message = formatWhatsAppSessionMessage(samplePayload);
    // Hapus backtick wrapper
    const lines = message.replace(/^```\n/, "").replace(/\n```$/, "").split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      expect(
        line.length,
        `Baris ke-${i + 1} melebihi lebar maksimum 38 karakter: "${line}" (${line.length} chars)`
      ).toBeLessThanOrEqual(MAX_LINE_WIDTH);
    }
  });

  it("memastikan pesan WhatsApp bebas dari seluruh emoji Unicode", () => {
    const message = formatWhatsAppSessionMessage(samplePayload);
    const emojiRegex = /\p{Extended_Pictographic}/u;
    expect(emojiRegex.test(message)).toBe(false);
  });

  it("memformat status header ganda dengan benar", () => {
    const redMsg = formatWhatsAppSessionMessage(samplePayload);
    expect(redMsg).toContain("[STATUS: MERAH - BAHAYA]");

    const amberMsg = formatWhatsAppSessionMessage({
      ...samplePayload,
      status: "amber",
    });
    expect(amberMsg).toContain("[STATUS: KUNING - WASPADA]");
  });

  it("menyesuaikan anjuran tindakan untuk fase masak_susu / menjelang_panen", () => {
    const latePhaseMsg = formatWhatsAppSessionMessage({
      ...samplePayload,
      cropPhase: "masak_susu",
    });

    expect(latePhaseMsg).toContain("Pertahankan kondisi sawah");
    expect(latePhaseMsg).toContain("macak-macak");
    expect(latePhaseMsg).not.toContain("Keringkan petakan sawah 3-4 hari");
  });

  it("membungkus pesan Telegram dengan tag HTML <pre>", () => {
    const telegramMsg = formatTelegramMessage(samplePayload);
    expect(telegramMsg.startsWith("<pre>")).toBe(true);
    expect(telegramMsg.endsWith("</pre>")).toBe(true);
    expect(telegramMsg).toContain("/lapor [Nama Dusun] [Kode]");
  });

  it("snapshot test pesan WhatsApp", () => {
    const message = formatWhatsAppSessionMessage(samplePayload);
    expect(message).toMatchSnapshot();
  });
});
