import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RatioCard } from "@/features/ratios/components/RatioCard";
import type { RatioItem } from "@/types/ratios";

function makeRatio(overrides: Partial<RatioItem> = {}): RatioItem {
  return {
    code: "CR",
    name: "Current Ratio",
    category: "liquidity",
    value: "4.7032",
    display: "4.70x",
    status: "available",
    quality: "ok",
    inputs: {},
    threshold: {
      target: "1.50",
      warning: "1.20",
      critical: "1.00",
      direction: "higher",
    },
    band: "above_target",
    interpretation: "Nilai rasio memenuhi target.",
    unit: "x",
    narrative: {
      explanation: "Current ratio membandingkan aset lancar dengan utang lancar.",
      action: "Pertahankan buffer kas.",
      source: "fallback",
      llm_enabled: false,
      quality: "ok",
      disclaimer: "Bukan saran keuangan.",
    },
    ...overrides,
  };
}

describe("RatioCard", () => {
  it("renders the deterministic value, band, threshold, and narrative", () => {
    render(
      <RatioCard
        ratio={makeRatio()}
        isExplaining={false}
        onExplain={jest.fn()}
      />,
    );

    expect(screen.getByText("Current Ratio")).toBeInTheDocument();
    expect(screen.getByText("4.70x")).toBeInTheDocument();
    expect(screen.getByText("Memenuhi target")).toBeInTheDocument();
    expect(screen.getByText("1.50x")).toBeInTheDocument();
    expect(
      screen.getByText(/membandingkan aset lancar/i),
    ).toBeInTheDocument();
  });

  it("requests an explanation for the ratio code", async () => {
    const onExplain = jest.fn();
    render(
      <RatioCard
        ratio={makeRatio()}
        isExplaining={false}
        onExplain={onExplain}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /jelaskan/i }));
    expect(onExplain).toHaveBeenCalledWith("CR");
  });

  it("shows an explicit reason instead of a fake number when unavailable", () => {
    render(
      <RatioCard
        ratio={makeRatio({
          code: "ICR",
          name: "Interest Coverage",
          status: "unavailable",
          value: null,
          display: null,
          quality: "insufficient",
          band: "insufficient",
          reason: "Beban bunga nol; ICR tidak bermakna.",
          threshold: null,
        })}
        isExplaining={false}
        onExplain={jest.fn()}
      />,
    );

    expect(
      screen.getByText("Beban bunga nol; ICR tidak bermakna."),
    ).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
