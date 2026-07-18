import { z } from "zod";

// Date fields stay as plain strings (ISO "YYYY-MM-DD" as sent by the API), never
// z.coerce.date() — coercing to a JS Date would reformat on JSON.stringify (full
// ISO-8601 datetime, not the bare date the backend sends), breaking the
// "pretty JSON matches the API" expectation and any diffing against the Python
// client's `model_dump(mode="json")` output.

export const PersonalityScoresSchema = z.object({
  concentration: z.number().nullable(),
  turnover: z.number().nullable(),
  momentum_contrarian: z.number().nullable(),
  sector_conviction: z.number().nullable(),
  diversification: z.number().nullable(),
  position_sizing_discipline: z.number().nullable(),
});
export type PersonalityScores = z.infer<typeof PersonalityScoresSchema>;

export const InstitutionSchema = z.object({
  cik: z.string(),
  slug: z.string().nullable(),
  name: z.string(),
  category: z.string().nullable(),
  manager_name: z.string().nullable(),
  latest_period_of_report: z.string().nullable(),
  total_value_usd: z.number().nullable(),
  holding_count: z.number().nullable(),
  personality_scores: PersonalityScoresSchema.nullable(),
});
export type Institution = z.infer<typeof InstitutionSchema>;

export const SectorWeightSchema = z.object({
  sector: z.string(),
  weight_pct: z.number(),
});
export type SectorWeight = z.infer<typeof SectorWeightSchema>;

export const InstitutionDetailSchema = InstitutionSchema.extend({
  top_sectors: z.array(SectorWeightSchema),
});
export type InstitutionDetail = z.infer<typeof InstitutionDetailSchema>;

export const HoldingSchema = z.object({
  cusip: z.string(),
  ticker: z.string().nullable(),
  issuer_name: z.string(),
  value_usd: z.number(),
  weight_pct: z.number().nullable(),
  shares: z.number(),
  action: z.string().nullable(),
  weight_change_bps: z.number().nullable(),
  shares_change_pct: z.number().nullable(),
  security_type: z.string().nullable(),
  sector: z.string().nullable(),
});
export type Holding = z.infer<typeof HoldingSchema>;

export const StockHolderSchema = z.object({
  slug: z.string(),
  name: z.string(),
  manager_name: z.string().nullable(),
  value_usd: z.number(),
  weight_pct: z.number(),
});
export type StockHolder = z.infer<typeof StockHolderSchema>;

export const StockHistoryPointSchema = z.object({
  period: z.string(),
  holder_count: z.number(),
  total_value_usd: z.number().nullable(),
});
export type StockHistoryPoint = z.infer<typeof StockHistoryPointSchema>;

export const StockSchema = z.object({
  cusip: z.string(),
  ticker: z.string().nullable(),
  issuer_name: z.string(),
  holder_count: z.number(),
  total_value_usd: z.number(),
  avg_weight_pct: z.number(),
  net_value_change_usd: z.number(),
  total_buy_value: z.number(),
  total_sell_value: z.number(),
  popularity_rank: z.number(),
  net_buyer_count: z.number(),
  net_seller_count: z.number(),
  new_buys_count: z.number(),
  adds_count: z.number(),
  trims_count: z.number(),
  sold_outs_count: z.number(),
  top_holders_by_value: z.array(StockHolderSchema),
  top_holders_by_conviction: z.array(StockHolderSchema),
  ownership_history: z.array(StockHistoryPointSchema),
});
export type Stock = z.infer<typeof StockSchema>;

export const StockFlowSchema = z.object({
  cusip: z.string(),
  ticker: z.string().nullable(),
  issuer_name: z.string(),
  net_value_change_usd: z.number(),
  avg_weight_pct: z.number().nullable(),
  institution_count: z.number(),
});
export type StockFlow = z.infer<typeof StockFlowSchema>;

export const InsiderScoreSchema = z.object({
  period_days: z.number(),
  buy_count: z.number(),
  sell_count: z.number(),
  unique_buyers: z.number(),
  confidence_score: z.number().nullable(),
  cluster_alert: z.boolean(),
  last_buy_date: z.string().nullable(),
  last_sell_date: z.string().nullable(),
});
export type InsiderScore = z.infer<typeof InsiderScoreSchema>;

export const InsiderTradeSchema = z.object({
  transaction_date: z.string(),
  transaction_code: z.string(),
  transaction_shares: z.number().nullable(),
  price_per_share: z.number().nullable(),
  transaction_value: z.number().nullable(),
  rpt_owner_name: z.string(),
  officer_title: z.string().nullable(),
  is_director: z.boolean(),
  is_officer: z.boolean(),
  is_10pct_owner: z.boolean(),
});
export type InsiderTrade = z.infer<typeof InsiderTradeSchema>;

export const InsiderStockSchema = z.object({
  ticker: z.string(),
  issuer_name: z.string().nullable(),
  score_30d: InsiderScoreSchema.nullable(),
  score_90d: InsiderScoreSchema.nullable(),
  recent_trades: z.array(InsiderTradeSchema),
  data_as_of: z.string().nullable(),
});
export type InsiderStock = z.infer<typeof InsiderStockSchema>;

export const ConvergenceSignalSchema = z.object({
  ticker: z.string(),
  issuer_name: z.string().nullable(),
  confidence_score: z.number(),
  unique_buyers: z.number(),
  cluster_alert: z.boolean(),
  last_buy_date: z.string().nullable(),
  guru_net_flow: z.number().nullable(),
  guru_buy_count: z.number().nullable(),
  guru_holder_count: z.number().nullable(),
});
export type ConvergenceSignal = z.infer<typeof ConvergenceSignalSchema>;
