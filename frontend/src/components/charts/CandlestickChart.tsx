import {
  CandlestickData,
  CandlestickSeries,
  ColorType,
  IChartApi,
  ISeriesApi,
  Time,
  createChart,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { OHLCVBar } from "../../types";

interface Props {
  bars: OHLCVBar[];
  height?: number;
}

export default function CandlestickChart({ bars, height = 300 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!containerRef.current || !bars.length) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#1e1e30" },
        textColor: "#8888aa",
      },
      grid: {
        vertLines: { color: "#2d2d4e" },
        horzLines: { color: "#2d2d4e" },
      },
      crosshair: {
        vertLine: { color: "#6366f1", labelBackgroundColor: "#6366f1" },
        horzLine: { color: "#6366f1", labelBackgroundColor: "#6366f1" },
      },
      rightPriceScale: {
        borderColor: "#2d2d4e",
        textColor: "#8888aa",
      },
      timeScale: {
        borderColor: "#2d2d4e",
        timeVisible: true,
        secondsVisible: false,
      },
      width: containerRef.current.clientWidth,
      height,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor:         "#22c55e",
      downColor:       "#ef4444",
      borderUpColor:   "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor:     "#22c55e",
      wickDownColor:   "#ef4444",
    });

    const data: CandlestickData<Time>[] = bars
      .map((b) => ({
        time: b.date.split("T")[0] as Time,
        open:  b.open,
        high:  b.high,
        low:   b.low,
        close: b.close,
      }))
      .sort((a, b) => (a.time < b.time ? -1 : 1));

    series.setData(data);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [bars, height]);

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />;
}
