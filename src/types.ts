export type RiskLevel = "critical" | "high" | "medium" | "low" | string;

export interface Dashboard {
  case_count: number;
  evidence_count: number;
  trajectory_count: number;
  passport_count: number;
  risk_levels: Array<{ risk_level: string; count: number }>;
  actions: Array<{ action: string; count: number }>;
  model_backend: string;
  model_path: string;
  openclaw_gateway_url?: string;
  model_invocations: Array<{
    agent_id: string;
    backend: string;
    model: string;
    used_fallback: number;
    count: number;
  }>;
}

export interface AuditCase {
  case_id: string;
  pattern_id?: string;
  pattern_name?: string;
  title?: string;
  risk_level: RiskLevel;
  risk_score: number;
  confidence?: number;
  status?: string;
  created_at?: string;
  summary?: string;
  primary_entities?: Record<string, unknown>;
  scores?: Record<string, number>;
  next_actions?: string[];
  evidence?: Evidence[];
  thread?: CaseThread[];
  trajectory?: Trajectory[];
}

export interface Evidence {
  evidence_id: string;
  case_id?: string;
  source_type?: string;
  source_id?: string;
  claim?: string;
  stance?: "support" | "counter" | "uncertain" | string;
  confidence?: number;
  strength?: number;
  created_at?: string;
  payload?: Record<string, unknown>;
}

export interface CaseThread {
  id?: number;
  case_id?: string;
  step?: number;
  agent_id?: string;
  action_taken?: string;
  decision_json?: Record<string, unknown>;
  observation_json?: Record<string, unknown>;
  reward?: number;
  created_at?: string;
}

export interface Trajectory {
  id?: number;
  case_id?: string;
  step?: number;
  agent_id?: string;
  state_json?: Record<string, unknown>;
  action_json?: Record<string, unknown>;
  reward?: number;
  done?: number;
  created_at?: string;
}

export interface CaseGraph {
  nodes: Array<{ id: string; label?: string; type?: string; [key: string]: unknown }>;
  edges: Array<{ source: string; target: string; relation?: string; weight?: number }>;
  metrics?: { nodes?: number; edges?: number };
}

export interface RouteInfo {
  case_id: string;
  coverage: {
    required: string[];
    covered: string[];
    missing: string[];
    support_score: number;
    counter_score: number;
    sufficiency_score: number;
    passport_ready: boolean;
  };
  ranked_actions: Array<{ action: string; score: number; reason?: string }>;
}

export interface Passport {
  case_id?: string;
  conclusion?: string;
  status?: string;
  confidence?: number;
  support_score?: number;
  counter_score?: number;
  sufficiency_score?: number;
  required?: string[];
  covered?: string[];
  missing?: string[];
  evidence_ids?: string[];
  uncertainty?: string[];
  [key: string]: unknown;
}

export interface Pattern {
  pattern_id: string;
  name?: string;
  risk_level?: string;
  definition?: Record<string, unknown>;
  created_at?: string;
}

export interface CandidatePattern {
  candidate_id: string;
  status: string;
  confidence?: number;
  supporting_cases?: string[];
  common_signals?: string[];
  required_counter_checks?: string[];
  created_at?: string;
  [key: string]: unknown;
}

export interface PolicyWeight {
  pattern_id: string;
  action_name: string;
  weight: number;
  source?: string;
  updated_at?: string;
}

export type CsvRow = Record<string, string>;

export interface ExperimentData {
  activeRetrieval: CsvRow[];
  multisource: CsvRow[];
  agents: CsvRow[];
  governance: CsvRow[];
  counterPassport: CsvRow[];
  learningCounts: CsvRow[];
  learningWeights: CsvRow[];
  efficiency: CsvRow[];
  capability: CsvRow[];
}

export interface WorldData {
  dashboard: Dashboard;
  cases: AuditCase[];
  graphs: Record<string, CaseGraph>;
  routes: Record<string, RouteInfo>;
  passports: Record<string, Passport>;
  patterns: Pattern[];
  candidates: CandidatePattern[];
  policyWeights: PolicyWeight[];
  experiments: ExperimentData;
  source: "api" | "fallback";
}
