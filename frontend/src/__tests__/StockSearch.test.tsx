import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StockSearch from "../components/stock/StockSearch";

describe("StockSearch", () => {
  it("renders the input and search button", () => {
    render(<StockSearch value="AAPL" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  it("calls onChange when Search is clicked", () => {
    const onChange = vi.fn();
    render(<StockSearch value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "tsla" } });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(onChange).toHaveBeenCalledWith("TSLA");
  });

  it("calls onChange when Enter is pressed", () => {
    const onChange = vi.fn();
    render(<StockSearch value="" onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "nvda" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("NVDA");
  });

  it("uppercases the ticker before calling onChange", () => {
    const onChange = vi.fn();
    render(<StockSearch value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "msft" } });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));
    expect(onChange).toHaveBeenCalledWith("MSFT");
  });

  it("renders popular ticker quick-buttons", () => {
    render(<StockSearch value="AAPL" onChange={() => {}} />);
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("NVDA")).toBeInTheDocument();
  });

  it("highlights the active ticker button", () => {
    render(<StockSearch value="TSLA" onChange={() => {}} />);
    const tslaBtn = screen.getByText("TSLA");
    expect(tslaBtn.className).toMatch(/bg-brand/);
  });
});
