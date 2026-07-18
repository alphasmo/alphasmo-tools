import Table from "cli-table3";
import type {
  ConvergenceSignal,
  Holding,
  InsiderScore,
  InsiderTrade,
  Institution,
  InstitutionDetail,
  Stock,
  StockFlow,
} from "../schemas.js";

function makeTable(head: string[]): Table.Table {
  return new Table({ head, wordWrap: true });
}

function kv(pairs: Array<[string, unknown]>): string {
  const width = Math.max(...pairs.map(([k]) => k.length));
  return pairs
    .map(([k, v]) => `${k.padEnd(width)} : ${v === null || v === undefined ? "-" : String(v)}`)
    .join("\n");
}

export function renderInstitutionList(items: Institution[]): string {
  const table = makeTable(["slug", "name", "category", "manager", "AUM (USD)", "holdings"]);
  for (const i of items) {
    table.push([
      i.slug ?? "-",
      i.name,
      i.category ?? "-",
      i.manager_name ?? "-",
      i.total_value_usd?.toLocaleString() ?? "-",
      i.holding_count ?? "-",
    ]);
  }
  return table.toString();
}

export function renderInstitutionDetail(i: InstitutionDetail): string {
  const summary = kv([
    ["cik", i.cik],
    ["slug", i.slug],
    ["name", i.name],
    ["category", i.category],
    ["manager", i.manager_name],
    ["AUM (USD)", i.total_value_usd?.toLocaleString()],
    ["holdings", i.holding_count],
    ["concentration", i.personality_scores?.concentration],
    ["turnover", i.personality_scores?.turnover],
    ["sector conviction", i.personality_scores?.sector_conviction],
  ]);
  const sectors = makeTable(["sector", "weight %"]);
  for (const s of i.top_sectors) sectors.push([s.sector, s.weight_pct]);
  return `${summary}\n\nTop sectors:\n${sectors.toString()}`;
}

export function renderHoldings(items: Holding[]): string {
  const table = makeTable(["ticker", "issuer", "value (USD)", "weight %", "shares", "action"]);
  for (const h of items) {
    table.push([
      h.ticker ?? "-",
      h.issuer_name,
      h.value_usd.toLocaleString(),
      h.weight_pct ?? "-",
      h.shares.toLocaleString(),
      h.action ?? "-",
    ]);
  }
  return table.toString();
}

export function renderStock(s: Stock): string {
  const summary = kv([
    ["ticker", s.ticker],
    ["issuer", s.issuer_name],
    ["holder count", s.holder_count],
    ["total value (USD)", s.total_value_usd.toLocaleString()],
    ["net value change (USD)", s.net_value_change_usd.toLocaleString()],
    ["popularity rank", s.popularity_rank],
    ["net buyers / sellers", `${s.net_buyer_count} / ${s.net_seller_count}`],
  ]);
  const holders = makeTable(["slug", "name", "value (USD)", "weight %"]);
  for (const h of s.top_holders_by_value) {
    holders.push([h.slug, h.name, h.value_usd.toLocaleString(), h.weight_pct]);
  }
  const history = makeTable(["period", "holders", "total value (USD)"]);
  for (const h of s.ownership_history) {
    history.push([h.period, h.holder_count, h.total_value_usd?.toLocaleString() ?? "-"]);
  }
  return (
    `${summary}\n\nTop holders by value:\n${holders.toString()}` +
    `\n\nOwnership history:\n${history.toString()}`
  );
}

export function renderStockFlows(items: StockFlow[]): string {
  const table = makeTable(["ticker", "issuer", "net flow (USD)", "avg weight %", "institutions"]);
  for (const f of items) {
    table.push([
      f.ticker ?? "-",
      f.issuer_name,
      f.net_value_change_usd.toLocaleString(),
      f.avg_weight_pct ?? "-",
      f.institution_count,
    ]);
  }
  return table.toString();
}

export interface InsiderTradesView {
  ticker: string;
  issuer_name: string | null;
  data_as_of: string | null;
  recent_trades: InsiderTrade[];
}

export function renderInsiderTrades(i: InsiderTradesView): string {
  const header = kv([
    ["ticker", i.ticker],
    ["issuer", i.issuer_name],
    ["data as of", i.data_as_of],
  ]);
  const trades = makeTable(["date", "code", "insider", "shares", "price", "value"]);
  for (const t of i.recent_trades) {
    trades.push([
      t.transaction_date,
      t.transaction_code,
      t.rpt_owner_name,
      t.transaction_shares ?? "-",
      t.price_per_share ?? "-",
      t.transaction_value?.toLocaleString() ?? "-",
    ]);
  }
  return `${header}\n\nRecent trades:\n${trades.toString()}`;
}

export interface InsiderSummaryView {
  ticker: string;
  issuer_name: string | null;
  data_as_of: string | null;
  score_30d: InsiderScore | null;
  score_90d: InsiderScore | null;
}

export function renderInsiderSummary(i: InsiderSummaryView): string {
  return kv([
    ["ticker", i.ticker],
    ["issuer", i.issuer_name],
    ["data as of", i.data_as_of],
    ["30d confidence", i.score_30d?.confidence_score],
    ["30d buy/sell", i.score_30d ? `${i.score_30d.buy_count}/${i.score_30d.sell_count}` : "-"],
    ["30d cluster alert", i.score_30d ? (i.score_30d.cluster_alert ? "yes" : "no") : "-"],
    ["90d confidence", i.score_90d?.confidence_score],
    ["90d buy/sell", i.score_90d ? `${i.score_90d.buy_count}/${i.score_90d.sell_count}` : "-"],
    ["90d cluster alert", i.score_90d ? (i.score_90d.cluster_alert ? "yes" : "no") : "-"],
  ]);
}

export function renderConvergence(items: ConvergenceSignal[]): string {
  const table = makeTable([
    "ticker",
    "issuer",
    "confidence",
    "unique buyers",
    "cluster alert",
    "last buy",
  ]);
  for (const c of items) {
    table.push([
      c.ticker,
      c.issuer_name ?? "-",
      c.confidence_score,
      c.unique_buyers,
      c.cluster_alert ? "yes" : "no",
      c.last_buy_date ?? "-",
    ]);
  }
  return table.toString();
}
