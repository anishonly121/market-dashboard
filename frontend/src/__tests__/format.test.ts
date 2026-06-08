import { describe, expect, it } from "vitest";
import { fmt, moneyFmt, pctFmt, volFmt } from "../utils/format";

describe("fmt", () => {
  it("rounds to 2 decimal places", () => expect(fmt(150.5678)).toBe("150.57"));
  it("formats with commas", () => expect(fmt(1234567.89)).toBe("1,234,567.89"));
  it("respects custom decimals", () => expect(fmt(3.14159, 4)).toBe("3.1416"));
});

describe("pctFmt", () => {
  it("prefixes positive values with +", () => expect(pctFmt(5.5)).toBe("+5.50%"));
  it("shows - for negatives",           () => expect(pctFmt(-3.2)).toBe("-3.20%"));
  it("handles zero",                    () => expect(pctFmt(0)).toBe("+0.00%"));
});

describe("moneyFmt", () => {
  it("formats trillions",  () => expect(moneyFmt(3e12)).toBe("$3.00T"));
  it("formats billions",   () => expect(moneyFmt(2.5e9)).toBe("$2.50B"));
  it("formats millions",   () => expect(moneyFmt(1.5e6)).toBe("$1.50M"));
  it("formats thousands",  () => expect(moneyFmt(5500)).toBe("$5.5K"));
  it("formats small",      () => expect(moneyFmt(99.5)).toBe("$99.50"));
  it("returns — for zero", () => expect(moneyFmt(0)).toBe("—"));
});

describe("volFmt", () => {
  it("formats billions", () => expect(volFmt(1.2e9)).toBe("1.20B"));
  it("formats millions", () => expect(volFmt(5e6)).toBe("5.00M"));
  it("formats thousands", () => expect(volFmt(3500)).toBe("3.5K"));
});
