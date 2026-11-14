import { bandConfig, formatRatioValue, formatThreshold } from "@/features/ratios/ratio-format";

describe("ratio formatting", () => {
  it("formats percentages as percent", () => {
    expect(formatRatioValue("0.6179", "percent")).toBe("61.79%");
  });

  it("formats day-based ratios with hari", () => {
    expect(formatRatioValue("14.1119", "days")).toBe("14.11 hari");
  });

  it("formats multipliers with x", () => {
    expect(formatRatioValue("4.7032", "x")).toBe("4.70x");
  });

  it("never fabricates a value for unavailable ratios", () => {
    expect(formatRatioValue(null, "x")).toBe("—");
  });

  it("maps critical bands to an error badge", () => {
    expect(bandConfig("below_critical")).toEqual({
      label: "Kritis",
      variant: "error",
    });
  });

  it("maps unconfigured thresholds without pretending a target exists", () => {
    expect(bandConfig("not_configured").label).toBe("Ambang belum diatur");
  });

  it("formats thresholds with the same unit as the ratio", () => {
    expect(formatThreshold("0.30", "percent")).toBe("30.00%");
    expect(formatThreshold("30", "days")).toBe("30.00 hari");
  });
});
