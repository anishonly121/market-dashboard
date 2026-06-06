"""
Market Dashboard — Phase 1
A full-featured financial dashboard built with Streamlit + yfinance + Plotly.
Run: streamlit run app.py
"""

import json
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st
import yfinance as yf
from plotly.subplots import make_subplots

# ── Page config ────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Market Dashboard",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Global CSS ─────────────────────────────────────────────────────────────────
st.markdown(
    """
<style>
  [data-testid="stAppViewContainer"] { background: #0f0f1a; }
  [data-testid="stSidebar"] { background: #1a1a2e; border-right: 1px solid #2d2d4e; }
  .metric-card {
    background: linear-gradient(135deg, #1e1e2e 0%, #252540 100%);
    border: 1px solid #3d3d60;
    border-radius: 12px;
    padding: 1.2rem 1rem;
    text-align: center;
    margin-bottom: .5rem;
  }
  .metric-value { font-size: 1.45rem; font-weight: 700; }
  .metric-label { font-size: 0.75rem; color: #8888aa; margin-top: 3px; letter-spacing: .05em; text-transform: uppercase; }
  .positive { color: #22c55e; }
  .negative { color: #ef4444; }
  .neutral  { color: #a0aec0; }
  .stock-header { display:flex; align-items:baseline; gap:1rem; flex-wrap:wrap; }
  .ticker  { font-size: 2.2rem; font-weight: 800; letter-spacing: -1px; }
  .company { font-size: 1rem; color: #8888aa; }
  .price-big { font-size: 2.8rem; font-weight: 700; }
  div[data-testid="stTabs"] button { font-size:.9rem; font-weight:600; }
  .stDataFrame { border-radius: 10px; overflow: hidden; }
</style>
""",
    unsafe_allow_html=True,
)

CHART_TEMPLATE = dict(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="#141425",
    font=dict(family="Inter, sans-serif", color="#e2e8f0"),
    xaxis=dict(gridcolor="#2d2d4e", zerolinecolor="#2d2d4e"),
    yaxis=dict(gridcolor="#2d2d4e", zerolinecolor="#2d2d4e"),
)

PERIOD_MAP = {
    "1 Month": ("1mo", "1d"),
    "3 Months": ("3mo", "1d"),
    "6 Months": ("6mo", "1d"),
    "1 Year": ("1y", "1d"),
    "2 Years": ("2y", "1wk"),
    "5 Years": ("5y", "1wk"),
}

COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"]

# ── Helpers ────────────────────────────────────────────────────────────────────

@st.cache_data(ttl=120)
def fetch_ticker(symbol: str):
    t = yf.Ticker(symbol.upper().strip())
    info = t.info
    return t, info


@st.cache_data(ttl=120)
def fetch_history(symbol: str, period: str, interval: str) -> pd.DataFrame:
    t = yf.Ticker(symbol.upper().strip())
    df = t.history(period=period, interval=interval)
    return df


def pct_fmt(v: float, decimals: int = 2) -> str:
    sign = "+" if v > 0 else ""
    return f"{sign}{v:.{decimals}f}%"


def money_fmt(v: float) -> str:
    if abs(v) >= 1e12:
        return f"${v/1e12:.2f}T"
    if abs(v) >= 1e9:
        return f"${v/1e9:.2f}B"
    if abs(v) >= 1e6:
        return f"${v/1e6:.2f}M"
    return f"${v:,.2f}"


def add_moving_averages(df: pd.DataFrame, windows=(20, 50, 200)):
    for w in windows:
        if len(df) >= w:
            df[f"MA{w}"] = df["Close"].rolling(w).mean()
    return df


def add_bollinger_bands(df: pd.DataFrame, window: int = 20):
    if len(df) < window:
        return df
    ma = df["Close"].rolling(window).mean()
    std = df["Close"].rolling(window).std()
    df["BB_upper"] = ma + 2 * std
    df["BB_lower"] = ma - 2 * std
    df["BB_mid"] = ma
    return df


def add_rsi(df: pd.DataFrame, window: int = 14) -> pd.DataFrame:
    delta = df["Close"].diff()
    gain = delta.clip(lower=0).rolling(window).mean()
    loss = (-delta.clip(upper=0)).rolling(window).mean()
    rs = gain / loss.replace(0, np.nan)
    df["RSI"] = 100 - 100 / (1 + rs)
    return df


def metric_card(label: str, value: str, css_class: str = "neutral") -> str:
    return f"""
    <div class="metric-card">
      <div class="metric-value {css_class}">{value}</div>
      <div class="metric-label">{label}</div>
    </div>"""


# ── Sidebar ────────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## 📈 Market Dashboard")
    st.divider()

    page = st.radio(
        "Navigate",
        ["📊 Dashboard", "🔀 Compare", "💼 Portfolio"],
        label_visibility="collapsed",
    )

    st.divider()
    ticker_input = st.text_input("Ticker Symbol", value="AAPL", placeholder="e.g. TSLA").upper().strip()
    period_label = st.selectbox("Time Period", list(PERIOD_MAP.keys()), index=3)
    chart_type = st.radio("Chart Type", ["Candlestick", "Line"], horizontal=True)
    show_ma = st.checkbox("Moving Averages", value=True)
    show_bb = st.checkbox("Bollinger Bands", value=False)

    st.divider()
    st.caption("Data via Yahoo Finance · Refreshes every 2 min")


period, interval = PERIOD_MAP[period_label]

# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════════
if page == "📊 Dashboard":
    try:
        ticker_obj, info = fetch_ticker(ticker_input)
    except Exception as e:
        st.error(f"Could not fetch {ticker_input}: {e}")
        st.stop()

    df = fetch_history(ticker_input, period, interval)

    if df.empty:
        st.error(f"No data returned for **{ticker_input}**. Check the symbol.")
        st.stop()

    df = add_moving_averages(df)
    df = add_bollinger_bands(df)
    df = add_rsi(df)

    # ── Header ─────────────────────────────────────────────────────────────────
    current_price = info.get("currentPrice") or df["Close"].iloc[-1]
    prev_close = info.get("previousClose") or df["Close"].iloc[-2] if len(df) > 1 else current_price
    change = current_price - prev_close
    pct = (change / prev_close) * 100 if prev_close else 0
    up = change >= 0

    col_h1, col_h2 = st.columns([3, 1])
    with col_h1:
        st.markdown(
            f"""<div class="stock-header">
              <span class="ticker">{ticker_input}</span>
              <span class="company">{info.get('longName', '')}</span>
            </div>
            <div style="display:flex; align-items:baseline; gap:1rem; margin-top:.4rem;">
              <span class="price-big">${current_price:,.2f}</span>
              <span class="{'positive' if up else 'negative'}" style="font-size:1.3rem; font-weight:600;">
                {'▲' if up else '▼'} ${abs(change):.2f} ({pct_fmt(pct)})
              </span>
            </div>""",
            unsafe_allow_html=True,
        )
    with col_h2:
        st.markdown(
            f"""<div style="text-align:right; padding-top:.5rem; color:#8888aa; font-size:.85rem;">
              Exchange: {info.get('exchange','—')}<br>
              Sector: {info.get('sector','—')}<br>
              Industry: {info.get('industry','—')}<br>
              Updated: {datetime.now().strftime('%H:%M:%S')}
            </div>""",
            unsafe_allow_html=True,
        )

    st.divider()

    # ── Key metrics row ────────────────────────────────────────────────────────
    m = [
        ("Market Cap", money_fmt(info.get("marketCap", 0)), "neutral"),
        ("P/E Ratio", f"{info.get('trailingPE', 0):.2f}" if info.get("trailingPE") else "N/A", "neutral"),
        ("EPS (TTM)", f"${info.get('trailingEps', 0):.2f}" if info.get("trailingEps") else "N/A", "neutral"),
        ("52W High", f"${info.get('fiftyTwoWeekHigh', 0):.2f}", "positive"),
        ("52W Low", f"${info.get('fiftyTwoWeekLow', 0):.2f}", "negative"),
        ("Div Yield", f"{info.get('dividendYield', 0)*100:.2f}%" if info.get("dividendYield") else "N/A", "neutral"),
        ("Beta", f"{info.get('beta', 0):.2f}" if info.get("beta") else "N/A", "neutral"),
        ("Avg Volume", money_fmt(info.get("averageVolume", 0)), "neutral"),
    ]
    cols = st.columns(len(m))
    for col, (label, val, cls) in zip(cols, m):
        col.markdown(metric_card(label, val, cls), unsafe_allow_html=True)

    st.divider()

    # ── Main chart ─────────────────────────────────────────────────────────────
    rows = 3 if show_bb else 2
    row_heights = [0.6, 0.2, 0.2] if rows == 3 else [0.7, 0.3]

    fig = make_subplots(
        rows=rows,
        cols=1,
        shared_xaxes=True,
        row_heights=row_heights,
        vertical_spacing=0.04,
        subplot_titles=["Price", "Volume", "RSI"] if rows == 3 else ["Price", "Volume"],
    )

    # Price
    if chart_type == "Candlestick":
        fig.add_trace(
            go.Candlestick(
                x=df.index,
                open=df["Open"],
                high=df["High"],
                low=df["Low"],
                close=df["Close"],
                name=ticker_input,
                increasing_line_color="#22c55e",
                decreasing_line_color="#ef4444",
                increasing_fillcolor="#22c55e",
                decreasing_fillcolor="#ef4444",
            ),
            row=1, col=1,
        )
    else:
        fig.add_trace(
            go.Scatter(
                x=df.index,
                y=df["Close"],
                name="Close",
                line=dict(color="#6366f1", width=2),
                fill="tozeroy",
                fillcolor="rgba(99,102,241,0.08)",
            ),
            row=1, col=1,
        )

    ma_colors = {"MA20": "#f59e0b", "MA50": "#06b6d4", "MA200": "#a855f7"}
    if show_ma:
        for ma, color in ma_colors.items():
            if ma in df.columns:
                fig.add_trace(
                    go.Scatter(x=df.index, y=df[ma], name=ma, line=dict(color=color, width=1.5, dash="dash")),
                    row=1, col=1,
                )

    if show_bb and "BB_upper" in df.columns:
        fig.add_trace(go.Scatter(x=df.index, y=df["BB_upper"], name="BB Upper",
                                  line=dict(color="#94a3b8", width=1, dash="dot")), row=1, col=1)
        fig.add_trace(go.Scatter(x=df.index, y=df["BB_lower"], name="BB Lower",
                                  line=dict(color="#94a3b8", width=1, dash="dot"),
                                  fill="tonexty", fillcolor="rgba(148,163,184,0.08)"), row=1, col=1)

    # Volume
    vol_colors = ["#22c55e" if c >= o else "#ef4444" for c, o in zip(df["Close"], df["Open"])]
    fig.add_trace(
        go.Bar(x=df.index, y=df["Volume"], name="Volume", marker_color=vol_colors, opacity=0.7),
        row=2, col=1,
    )

    # RSI
    if rows == 3 and "RSI" in df.columns:
        fig.add_trace(go.Scatter(x=df.index, y=df["RSI"], name="RSI",
                                  line=dict(color="#f59e0b", width=1.5)), row=3, col=1)
        fig.add_hline(y=70, line_dash="dot", line_color="#ef4444", opacity=0.5, row=3, col=1)
        fig.add_hline(y=30, line_dash="dot", line_color="#22c55e", opacity=0.5, row=3, col=1)

    fig.update_layout(
        height=600,
        showlegend=True,
        xaxis_rangeslider_visible=False,
        legend=dict(orientation="h", y=1.02, bgcolor="rgba(0,0,0,0)"),
        margin=dict(l=0, r=0, t=30, b=0),
        **CHART_TEMPLATE,
    )
    fig.update_yaxes(gridcolor="#2d2d4e")
    fig.update_xaxes(gridcolor="#2d2d4e")

    st.plotly_chart(fig, use_container_width=True)

    # ── Stats table ────────────────────────────────────────────────────────────
    st.subheader("Performance Summary")
    if len(df) >= 2:
        perf_data = {}
        for label_p, days_p in [("1W", 5), ("1M", 21), ("3M", 63), ("6M", 126), ("1Y", 252)]:
            if len(df) > days_p:
                ret = (df["Close"].iloc[-1] / df["Close"].iloc[-days_p] - 1) * 100
                perf_data[label_p] = pct_fmt(ret)
        perf_df = pd.DataFrame([perf_data], index=["Return"])
        st.dataframe(perf_df, use_container_width=True)

    with st.expander("Company Description"):
        st.write(info.get("longBusinessSummary", "No description available."))


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: COMPARE
# ═══════════════════════════════════════════════════════════════════════════════
elif page == "🔀 Compare":
    st.header("Stock Comparison")
    st.caption("Compare normalized returns across multiple tickers")

    col_a, col_b = st.columns([3, 1])
    with col_a:
        raw = st.text_input(
            "Tickers (comma-separated)",
            value="AAPL, MSFT, GOOGL, NVDA",
            placeholder="AAPL, TSLA, AMZN",
        )
    with col_b:
        cmp_period = st.selectbox("Period", list(PERIOD_MAP.keys()), index=3, key="cmp_period")

    symbols = [s.strip().upper() for s in raw.split(",") if s.strip()]
    if not symbols:
        st.warning("Enter at least one ticker.")
        st.stop()

    cp, ci = PERIOD_MAP[cmp_period]

    frames = {}
    errors = []
    for sym in symbols[:6]:
        try:
            d = fetch_history(sym, cp, ci)
            if not d.empty:
                frames[sym] = d["Close"]
        except Exception as ex:
            errors.append(f"{sym}: {ex}")

    if errors:
        st.warning("Could not fetch: " + ", ".join(errors))

    if not frames:
        st.error("No data available.")
        st.stop()

    combined = pd.DataFrame(frames).dropna(how="all")

    # Normalized returns chart
    norm = (combined / combined.iloc[0]) * 100
    fig_cmp = go.Figure()
    for i, sym in enumerate(norm.columns):
        ret = norm[sym].iloc[-1] - 100
        fig_cmp.add_trace(go.Scatter(
            x=norm.index,
            y=norm[sym],
            name=f"{sym} ({pct_fmt(ret)})",
            line=dict(color=COLORS[i % len(COLORS)], width=2.5),
        ))

    fig_cmp.update_layout(
        title="Normalized Returns (base = 100)",
        height=500,
        legend=dict(orientation="h", y=1.02),
        margin=dict(l=0, r=0, t=40, b=0),
        **CHART_TEMPLATE,
    )
    fig_cmp.add_hline(y=100, line_dash="dot", line_color="#ffffff", opacity=0.3)
    st.plotly_chart(fig_cmp, use_container_width=True)

    # Metrics table
    rows_data = []
    for sym in combined.columns:
        try:
            _, info_ = fetch_ticker(sym)
            price = combined[sym].iloc[-1]
            ret_1d = (combined[sym].iloc[-1] / combined[sym].iloc[-2] - 1) * 100 if len(combined) > 1 else 0
            ret_total = (combined[sym].iloc[-1] / combined[sym].iloc[0] - 1) * 100
            rows_data.append({
                "Ticker": sym,
                "Company": info_.get("shortName", sym),
                "Price": f"${price:,.2f}",
                "1D %": pct_fmt(ret_1d),
                f"Period %": pct_fmt(ret_total),
                "Market Cap": money_fmt(info_.get("marketCap", 0)),
                "P/E": f"{info_.get('trailingPE', 0):.1f}" if info_.get("trailingPE") else "—",
            })
        except Exception:
            pass

    if rows_data:
        tbl = pd.DataFrame(rows_data).set_index("Ticker")
        st.dataframe(tbl, use_container_width=True)

    # Correlation heatmap
    if len(combined.columns) > 1:
        st.subheader("Correlation Matrix (Daily Returns)")
        daily_ret = combined.pct_change().dropna()
        corr = daily_ret.corr()

        fig_heat = go.Figure(go.Heatmap(
            z=corr.values,
            x=corr.columns.tolist(),
            y=corr.index.tolist(),
            colorscale="RdBu",
            zmid=0,
            text=corr.round(2).values,
            texttemplate="%{text}",
            textfont=dict(size=14),
            showscale=True,
        ))
        fig_heat.update_layout(height=400, margin=dict(l=0, r=0, t=20, b=0), **CHART_TEMPLATE)
        st.plotly_chart(fig_heat, use_container_width=True)


# ═══════════════════════════════════════════════════════════════════════════════
# PAGE: PORTFOLIO
# ═══════════════════════════════════════════════════════════════════════════════
else:
    st.header("Portfolio Tracker")
    st.caption("Track your holdings · P&L · Allocation")

    if "portfolio" not in st.session_state:
        st.session_state.portfolio = [
            {"ticker": "AAPL", "shares": 10, "avg_cost": 150.0},
            {"ticker": "MSFT", "shares": 5, "avg_cost": 350.0},
            {"ticker": "NVDA", "shares": 3, "avg_cost": 400.0},
        ]

    # ── Add holding ────────────────────────────────────────────────────────────
    with st.expander("➕ Add / Edit Holding", expanded=False):
        c1, c2, c3, c4 = st.columns([2, 2, 2, 1])
        new_sym = c1.text_input("Ticker", placeholder="TSLA").upper().strip()
        new_shares = c2.number_input("Shares", min_value=0.0, step=0.1, value=1.0)
        new_cost = c3.number_input("Avg Cost ($)", min_value=0.0, step=0.01, value=100.0)
        c4.write("")
        c4.write("")
        if c4.button("Add"):
            if new_sym:
                existing = next((h for h in st.session_state.portfolio if h["ticker"] == new_sym), None)
                if existing:
                    existing["shares"] = new_shares
                    existing["avg_cost"] = new_cost
                    st.success(f"Updated {new_sym}")
                else:
                    st.session_state.portfolio.append(
                        {"ticker": new_sym, "shares": new_shares, "avg_cost": new_cost}
                    )
                    st.success(f"Added {new_sym}")
                st.rerun()

    # ── Fetch current prices ───────────────────────────────────────────────────
    holdings_data = []
    total_value = 0.0
    total_cost = 0.0

    for h in st.session_state.portfolio:
        sym = h["ticker"]
        shares = h["shares"]
        avg_cost = h["avg_cost"]
        try:
            _, info_h = fetch_ticker(sym)
            price = info_h.get("currentPrice") or info_h.get("regularMarketPrice") or 0
            if price == 0:
                df_h = fetch_history(sym, "5d", "1d")
                if not df_h.empty:
                    price = df_h["Close"].iloc[-1]
            value = price * shares
            cost_basis = avg_cost * shares
            pnl = value - cost_basis
            pnl_pct = (pnl / cost_basis * 100) if cost_basis else 0
            total_value += value
            total_cost += cost_basis
            holdings_data.append({
                "Ticker": sym,
                "Shares": shares,
                "Avg Cost": f"${avg_cost:,.2f}",
                "Current Price": f"${price:,.2f}",
                "Market Value": value,
                "Cost Basis": cost_basis,
                "P&L $": pnl,
                "P&L %": pnl_pct,
            })
        except Exception as ex:
            st.warning(f"Could not fetch {sym}: {ex}")

    total_pnl = total_value - total_cost
    total_pnl_pct = (total_pnl / total_cost * 100) if total_cost else 0

    # ── Summary cards ──────────────────────────────────────────────────────────
    cs = st.columns(4)
    cs[0].markdown(metric_card("Total Value", money_fmt(total_value), "neutral"), unsafe_allow_html=True)
    cs[1].markdown(metric_card("Total Cost", money_fmt(total_cost), "neutral"), unsafe_allow_html=True)
    cs[2].markdown(
        metric_card("Total P&L", f"{'+' if total_pnl >= 0 else ''}{money_fmt(total_pnl)}",
                    "positive" if total_pnl >= 0 else "negative"),
        unsafe_allow_html=True,
    )
    cs[3].markdown(
        metric_card("Total Return", pct_fmt(total_pnl_pct),
                    "positive" if total_pnl_pct >= 0 else "negative"),
        unsafe_allow_html=True,
    )

    st.divider()

    if holdings_data:
        tab1, tab2 = st.tabs(["Holdings Table", "Allocation Charts"])

        with tab1:
            df_port = pd.DataFrame(holdings_data)
            display_df = df_port[["Ticker", "Shares", "Avg Cost", "Current Price",
                                   "Market Value", "Cost Basis", "P&L $", "P&L %"]].copy()
            display_df["Market Value"] = display_df["Market Value"].apply(lambda x: f"${x:,.2f}")
            display_df["Cost Basis"] = display_df["Cost Basis"].apply(lambda x: f"${x:,.2f}")
            display_df["P&L $"] = display_df["P&L $"].apply(
                lambda x: f"+${x:,.2f}" if x >= 0 else f"-${abs(x):,.2f}"
            )
            display_df["P&L %"] = display_df["P&L %"].apply(pct_fmt)
            st.dataframe(display_df.set_index("Ticker"), use_container_width=True)

            remove_sym = st.selectbox("Remove holding", ["—"] + [h["Ticker"] for h in holdings_data])
            if remove_sym != "—":
                if st.button(f"Remove {remove_sym}", type="secondary"):
                    st.session_state.portfolio = [
                        h for h in st.session_state.portfolio if h["ticker"] != remove_sym
                    ]
                    st.rerun()

        with tab2:
            col_pie, col_bar = st.columns(2)
            labels = [h["Ticker"] for h in holdings_data]
            values = [h["Market Value"] for h in holdings_data]

            with col_pie:
                fig_pie = go.Figure(go.Pie(
                    labels=labels,
                    values=values,
                    hole=0.45,
                    marker_colors=COLORS[: len(labels)],
                    textinfo="label+percent",
                ))
                fig_pie.update_layout(
                    title="Allocation by Market Value",
                    height=380,
                    showlegend=False,
                    margin=dict(l=0, r=0, t=40, b=0),
                    **CHART_TEMPLATE,
                )
                st.plotly_chart(fig_pie, use_container_width=True)

            with col_bar:
                pnl_vals = [h["P&L $"] for h in holdings_data]
                bar_colors = ["#22c55e" if v >= 0 else "#ef4444" for v in pnl_vals]
                fig_bar = go.Figure(go.Bar(
                    x=labels,
                    y=pnl_vals,
                    marker_color=bar_colors,
                    text=[f"${v:+,.0f}" for v in pnl_vals],
                    textposition="outside",
                ))
                fig_bar.update_layout(
                    title="P&L by Holding",
                    height=380,
                    margin=dict(l=0, r=0, t=40, b=0),
                    **CHART_TEMPLATE,
                )
                fig_bar.add_hline(y=0, line_color="#ffffff", opacity=0.2)
                st.plotly_chart(fig_bar, use_container_width=True)
    else:
        st.info("No holdings to display. Add some above.")
