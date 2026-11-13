import { describe, expect, it } from "vitest";
import { explainEvaluation, explainReasonsList, formatShortDate } from "@/core/explain";
import type { EvaluationResult } from "@/core/rules";

describe("T1.5: Explainability Engine Tests (TECH_SPEC.md §6.4)", () => {
  it("memformat tanggal pendek dengan benar", () => {
    expect(formatShortDate("2026-11-14")).toBe("14 Nov");
    expect(formatShortDate("2026-05-01")).toBe("1 Mei");
  });

  it("menghasilkan penjelasan status MERAH secara naratif", () => {
    const mockRedResult: EvaluationResult = {
      status: "red",
      runLength: 3,
      evaluatedDates: ["2026-11-14", "2026-11-15", "2026-11-16"],
      reasons: [
        {
          rule: "red",
          date: "2026-11-14",
          metric: "T & RH",
          value: 26.8,
          threshold: "25-29 C & RH > 80%",
          passed: true,
        },
        {
          rule: "red",
          date: "2026-11-15",
          metric: "T & RH",
          value: 27.0,
          threshold: "25-29 C & RH > 80%",
          passed: true,
        },
        {
          rule: "red",
          date: "2026-11-16",
          metric: "T & RH",
          value: 26.6,
          threshold: "25-29 C & RH > 80%",
          passed: true,
        },
      ],
    };

    const explanation = explainEvaluation(mockRedResult);
    expect(explanation).toContain("Suhu rerata 26.8 C");
    expect(explanation).toContain("MERAH (BAHAYA)");
    expect(explanation).toContain("pada 3 hari berturut-turut (14 Nov, 15 Nov, 16 Nov)");
    expect(explanation).toMatchSnapshot();
  });

  it("menghasilkan penjelasan status KUNING secara naratif", () => {
    const mockAmberResult: EvaluationResult = {
      status: "amber",
      runLength: 2,
      evaluatedDates: ["2026-11-14", "2026-11-15"],
      reasons: [
        {
          rule: "amber",
          date: "2026-11-14",
          metric: "T & RH",
          value: 26.0,
          threshold: "24-29 C & RH >= 70%",
          passed: true,
        },
        {
          rule: "amber",
          date: "2026-11-15",
          metric: "T & RH",
          value: 26.0,
          threshold: "24-29 C & RH >= 70%",
          passed: true,
        },
      ],
    };

    const explanation = explainEvaluation(mockAmberResult);
    expect(explanation).toContain("KUNING (WASPADA)");
    expect(explanation).toContain("pada 2 hari berturut-turut");
    expect(explanation).toMatchSnapshot();
  });

  it("menghasilkan penjelasan status HIJAU (marginal)", () => {
    const mockMarginalResult: EvaluationResult = {
      status: "green",
      runLength: 0,
      evaluatedDates: ["2026-11-14"],
      reasons: [
        {
          rule: "marginal",
          date: "2026-11-14",
          metric: "T & RH",
          value: 23.0,
          threshold: "Zona marginal",
          passed: true,
        },
      ],
    };

    const explanation = explainEvaluation(mockMarginalResult);
    expect(explanation).toContain("Status HIJAU (AMAN) dengan catatan marginal");
    expect(explanation).toMatchSnapshot();
  });
});
