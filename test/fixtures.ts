export const institutionFixture = {
  cik: "0000102909",
  slug: "vanguard-group-inc",
  name: "VANGUARD GROUP INC",
  category: null,
  manager_name: null,
  latest_period_of_report: "2025-12-31",
  total_value_usd: 6897676080637.0,
  holding_count: 17686,
  personality_scores: null,
};

export const institutionDetailFixture = {
  ...institutionFixture,
  top_sectors: [{ sector: "Technology", weight_pct: 28.5 }],
};

export const holdingFixture = {
  cusip: "037833100",
  ticker: "AAPL",
  issuer_name: "APPLE INC",
  value_usd: 1_000_000,
  weight_pct: 5.2,
  shares: 10_000,
  action: "add",
  weight_change_bps: 12,
  shares_change_pct: 3.1,
  security_type: "COM",
  sector: "Technology",
};

export const stockFixture = {
  cusip: "037833100",
  ticker: "AAPL",
  issuer_name: "APPLE INC",
  holder_count: 500,
  total_value_usd: 1_000_000_000,
  avg_weight_pct: 4.2,
  net_value_change_usd: 50_000_000,
  total_buy_value: 80_000_000,
  total_sell_value: 30_000_000,
  popularity_rank: 1,
  net_buyer_count: 200,
  net_seller_count: 50,
  new_buys_count: 20,
  adds_count: 100,
  trims_count: 40,
  sold_outs_count: 10,
  top_holders_by_value: [
    {
      slug: "vanguard-group-inc",
      name: "VANGUARD GROUP INC",
      manager_name: null,
      value_usd: 100_000_000,
      weight_pct: 5.0,
    },
  ],
  top_holders_by_conviction: [],
  ownership_history: [{ period: "2025Q4", holder_count: 500, total_value_usd: 1_000_000_000 }],
};

export const stockFlowFixture = {
  cusip: "037833100",
  ticker: "AAPL",
  issuer_name: "APPLE INC",
  net_value_change_usd: 50_000_000,
  avg_weight_pct: 4.2,
  institution_count: 500,
};

export const insiderStockFixture = {
  ticker: "AAPL",
  issuer_name: "APPLE INC",
  score_30d: {
    period_days: 30,
    buy_count: 3,
    sell_count: 1,
    unique_buyers: 3,
    confidence_score: 72.0,
    cluster_alert: false,
    last_buy_date: "2026-07-01",
    last_sell_date: "2026-06-15",
  },
  score_90d: null,
  recent_trades: [
    {
      transaction_date: "2026-07-01",
      transaction_code: "P",
      transaction_shares: 1000,
      price_per_share: 200.5,
      transaction_value: 200_500,
      rpt_owner_name: "Jane Doe",
      officer_title: "CFO",
      is_director: false,
      is_officer: true,
      is_10pct_owner: false,
    },
  ],
  data_as_of: "2026-07-15",
};

export const convergenceSignalFixture = {
  ticker: "AAPL",
  issuer_name: "APPLE INC",
  confidence_score: 85.0,
  unique_buyers: 3,
  cluster_alert: true,
  last_buy_date: "2026-06-01",
  guru_net_flow: 1_000_000.0,
  guru_buy_count: 5,
  guru_holder_count: 10,
};
