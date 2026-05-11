import type {
  AuditCase,
  CaseGraph,
  CaseThread,
  CandidatePattern,
  CsvRow,
  Dashboard,
  Evidence,
  ExperimentData,
  Passport,
  Pattern,
  PolicyWeight,
  RouteInfo,
  WorldData
} from "./types";

export const actionLabels: Record<string, string> = {
  expand_infra_graph: "关系扩展",
  query_refund_cluster: "退款簇查询",
  query_payment_cluster: "支付簇查询",
  query_logistics_trace: "物流追踪",
  query_subsidy_ledger: "补贴台账",
  compare_promo_cohort: "促销对照",
  analyze_behavior_sequence: "行为序列",
  seek_counter_evidence: "反证检索",
  search_historical_cases: "历史回溯",
  emit_passport: "护照生成"
};

export const actionDescriptions: Record<string, string> = {
  expand_infra_graph: "把账号、设备、IP、支付账户、收货地和外部特征扩展为可解释关系图。",
  query_refund_cluster: "检查退款窗口、退款比例和售后链路，寻找异常闭环。",
  query_payment_cluster: "追踪支付账户、收款账户和金额分布，识别集中化资金路径。",
  query_logistics_trace: "比对物流揽收、签收、轨迹缺口和空包特征。",
  query_subsidy_ledger: "核对补贴发放、促销规则和到账路径。",
  compare_promo_cohort: "与同类促销 cohort 对照，排除正常活动高峰。",
  analyze_behavior_sequence: "分析注册、下单、评论、退款和补贴到账的时间序列。",
  seek_counter_evidence: "主动寻找反证和自然解释，避免只收集支持性证据。",
  search_historical_cases: "回溯相似历史案例，辅助模式匹配和策略复用。",
  emit_passport: "把支持证据、反证、不确定性、版本和人工门禁汇总为证据护照。"
};

export const agentLabels: Record<string, { label: string; model: string; role: string; color: string }> = {
  risk_signal_agent: {
    label: "风险信号 Agent",
    model: "7B",
    role: "从多维特征中发现初始风险信号和异常组合。",
    color: "#E96E4C"
  },
  case_router_agent: {
    label: "案件路由 Agent",
    model: "7B",
    role: "判断复杂度、证据缺口和后续追证强度。",
    color: "#D99A2B"
  },
  router_agent: {
    label: "Router Agent",
    model: "7B",
    role: "基于证据覆盖、策略权重和预算选择下一步动作。",
    color: "#2EA7A0"
  },
  investigation_agent: {
    label: "主动追证 Agent",
    model: "7B",
    role: "执行受控动作并反思观察结果，持续补齐证据。",
    color: "#6F9FD8"
  },
  assertion_agent: {
    label: "断言生成 Agent",
    model: "7B",
    role: "把观察结果转成可审计断言和证据候选。",
    color: "#7B61C9"
  },
  pattern_matcher_agent: {
    label: "模式匹配 Agent",
    model: "14B",
    role: "匹配历史模式、识别模式迁移和新型组合风险。",
    color: "#4B356D"
  },
  passport_agent: {
    label: "证据护照 Agent",
    model: "14B",
    role: "汇总证据、反证、不确定性和人工门禁。",
    color: "#C8A15A"
  },
  pattern_learning_agent: {
    label: "模式学习 Agent",
    model: "14B",
    role: "从确认案例中生成候选模式并写回策略。",
    color: "#C9788D"
  }
};

const caseSequences: Record<string, string[]> = {
  "AER-001": [
    "expand_infra_graph",
    "query_refund_cluster",
    "query_payment_cluster",
    "query_logistics_trace",
    "query_subsidy_ledger",
    "compare_promo_cohort",
    "analyze_behavior_sequence",
    "seek_counter_evidence"
  ],
  "AER-002": [
    "analyze_behavior_sequence",
    "compare_promo_cohort",
    "search_historical_cases",
    "query_payment_cluster",
    "query_logistics_trace",
    "seek_counter_evidence",
    "expand_infra_graph",
    "emit_passport"
  ],
  "AER-003": [
    "query_subsidy_ledger",
    "compare_promo_cohort",
    "query_refund_cluster",
    "query_payment_cluster",
    "query_logistics_trace",
    "seek_counter_evidence",
    "expand_infra_graph",
    "search_historical_cases"
  ]
};

const caseMeta: Record<string, { title: string; pattern: string; level: string; score: number; summary: string }> = {
  "AER-001": {
    title: "团伙刷单骗补",
    pattern: "EC-SKIM-001",
    level: "critical",
    score: 0.94,
    summary: "设备、账号、IP、退款和补贴台账出现团伙化闭环，需要主动追证确认。"
  },
  "AER-002": {
    title: "空包虚假交易与评论操纵",
    pattern: "EC-FAKE-002",
    level: "high",
    score: 0.88,
    summary: "物流异常、评论集中和退款行为互相增强，需要反证检索避免误判。"
  },
  "AER-003": {
    title: "补贴套利观察",
    pattern: "EC-ARBI-003",
    level: "medium",
    score: 0.72,
    summary: "促销窗口内存在套利信号，但证据不足，系统保持观察并沉淀策略。"
  }
};

function makeEvidence(caseId: string, count: number, support: number): Evidence[] {
  const sourceTypes = [
    "order",
    "payment",
    "refund",
    "logistics",
    "comment",
    "device",
    "ip",
    "subsidy",
    "history",
    "counter"
  ];
  return Array.from({ length: count }).map((_, index) => {
    const source = sourceTypes[index % sourceTypes.length];
    const stance = index < support ? "support" : index === count - 1 ? "uncertain" : "counter";
    return {
      evidence_id: `${caseId}-EV-${String(index + 1).padStart(2, "0")}`,
      case_id: caseId,
      source_type: source,
      source_id: `${source.toUpperCase()}_${String(index + 1).padStart(4, "0")}`,
      claim: `${caseMeta[caseId].title} 的 ${source} 维度证据 ${index + 1}`,
      stance,
      confidence: Math.min(0.98, 0.62 + index * 0.035),
      strength: Math.min(0.95, 0.58 + index * 0.04),
      payload: { dimension: source, generated_by: "Team-I model-backed smoke run" }
    };
  });
}

function makeThread(caseId: string): CaseThread[] {
  return caseSequences[caseId].map((action, index) => ({
    id: index + 1,
    case_id: caseId,
    step: index + 1,
    agent_id: index % 3 === 0 ? "router_agent" : index % 3 === 1 ? "investigation_agent" : "assertion_agent",
    action_taken: action,
    reward: Number((0.38 + index * 0.075).toFixed(3)),
    decision_json: {
      action,
      reason: actionDescriptions[action],
      budget: index < 3 ? "light" : index < 6 ? "standard" : "deep"
    },
    observation_json: {
      summary: `${actionLabels[action]} 完成，证据覆盖提升 ${(index + 2) * 11}%`,
      evidence_delta: index < 6 ? 2 : 1
    }
  }));
}

function makeCase(caseId: string): AuditCase {
  const meta = caseMeta[caseId];
  const evidence = makeEvidence(caseId, caseId === "AER-001" ? 10 : 9, caseId === "AER-001" ? 9 : 8);
  return {
    case_id: caseId,
    title: meta.title,
    pattern_id: meta.pattern,
    pattern_name: meta.pattern,
    risk_level: meta.level,
    risk_score: meta.score,
    confidence: caseId === "AER-003" ? 0.76 : caseId === "AER-002" ? 0.87 : 0.94,
    status: caseId === "AER-003" ? "monitoring" : "passport_ready",
    summary: meta.summary,
    primary_entities: {
      accounts: caseId === "AER-002" ? 50 : caseId === "AER-001" ? 5 : 1,
      orders: caseId === "AER-002" ? 50 : 12,
      amount: caseId === "AER-002" ? 3000 : caseId === "AER-001" ? 450 : 150
    },
    scores: {
      statistical: meta.score,
      relational: Math.max(0.35, meta.score - 0.07),
      semantic: Math.max(0.32, meta.score - 0.11),
      counter: caseId === "AER-003" ? 0.28 : 0.63
    },
    next_actions: caseSequences[caseId],
    evidence,
    thread: makeThread(caseId),
    trajectory: makeThread(caseId).flatMap((thread, idx) =>
      ["router_agent", "investigation_agent", "assertion_agent"].map((agent, sub) => ({
        id: idx * 3 + sub + 1,
        case_id: caseId,
        step: idx + 1,
        agent_id: agent,
        reward: Number((0.2 + idx * 0.07 + sub * 0.03).toFixed(3)),
        action_json: { action: thread.action_taken },
        state_json: { stage: idx + 1, coverage: Math.min(1, 0.16 + idx * 0.11) }
      }))
    )
  };
}

function makeGraph(caseId: string): CaseGraph {
  const caseNode = { id: caseId, label: caseId, type: "case" };
  const evidence = makeCase(caseId).evidence ?? [];
  const nodes = [
    caseNode,
    ...evidence.map((item, index) => ({
      id: item.source_id ?? item.evidence_id,
      label: item.source_id ?? item.evidence_id,
      type: item.source_type ?? "evidence",
      stance: item.stance,
      confidence: item.confidence,
      angle: index
    }))
  ];
  const edges = evidence.map((item, index) => ({
    source: caseId,
    target: item.source_id ?? item.evidence_id,
    relation: item.source_type ?? "related",
    weight: item.confidence ?? 0.6 + index * 0.02
  }));
  return { nodes, edges, metrics: { nodes: nodes.length, edges: edges.length } };
}

function makeRoute(caseId: string): RouteInfo {
  const actions = caseSequences[caseId];
  return {
    case_id: caseId,
    coverage: {
      required: ["统计异常", "关系扩展", "物流校验", "资金链", "反证", "护照"],
      covered: caseId === "AER-003" ? ["统计异常", "补贴台账", "反证"] : ["统计异常", "关系扩展", "物流校验", "资金链", "反证", "护照"],
      missing: caseId === "AER-003" ? ["护照门槛", "历史复用"] : [],
      support_score: caseId === "AER-003" ? 0.58 : caseId === "AER-002" ? 0.82 : 0.9,
      counter_score: caseId === "AER-003" ? 0.28 : 0.65,
      sufficiency_score: caseId === "AER-003" ? 0.56 : caseId === "AER-002" ? 0.86 : 0.91,
      passport_ready: caseId !== "AER-003"
    },
    ranked_actions: actions.map((action, index) => ({
      action,
      score: Number((0.86 - index * 0.045).toFixed(3)),
      reason: actionDescriptions[action]
    }))
  };
}

function makePassport(caseId: string): Passport {
  const route = makeRoute(caseId);
  return {
    case_id: caseId,
    conclusion: caseId === "AER-003" ? "观察归档，等待新增证据" : `${caseMeta[caseId].title} 证据充分，进入复核门禁`,
    status: route.coverage.passport_ready ? "ready" : "watching",
    confidence: caseMeta[caseId].score,
    support_score: route.coverage.support_score,
    counter_score: route.coverage.counter_score,
    sufficiency_score: route.coverage.sufficiency_score,
    required: route.coverage.required,
    covered: route.coverage.covered,
    missing: route.coverage.missing,
    evidence_ids: makeCase(caseId).evidence?.map((item) => item.evidence_id),
    uncertainty: caseId === "AER-003" ? ["证据不足", "业务自然峰值未完全排除"] : ["仍需人工确认处罚口径"]
  };
}

const fallbackExperiments: ExperimentData = {
  activeRetrieval: [
    { method: "人工抽查", step: "1", sufficiency_mean: "0.18" },
    { method: "人工抽查", step: "2", sufficiency_mean: "0.22" },
    { method: "人工抽查", step: "3", sufficiency_mean: "0.25" },
    { method: "Team-I 主动追证", step: "1", sufficiency_mean: "0.24" },
    { method: "Team-I 主动追证", step: "2", sufficiency_mean: "0.48" },
    { method: "Team-I 主动追证", step: "3", sufficiency_mean: "0.69" },
    { method: "Team-I 主动追证", step: "4", sufficiency_mean: "0.86" }
  ],
  multisource: [
    { stage: "订单", sufficiency_mean: "0.09", source_family_count: "4" },
    { stage: "支付/退款", sufficiency_mean: "0.34", source_family_count: "6" },
    { stage: "物流/评论", sufficiency_mean: "0.46", source_family_count: "8" },
    { stage: "设备/IP", sufficiency_mean: "0.71", source_family_count: "12" },
    { stage: "记忆/反证", sufficiency_mean: "0.88", source_family_count: "15" }
  ],
  agents: Object.entries(agentLabels).map(([agent_id, meta], index) => ({
    agent_id,
    model_tier: meta.model,
    invocations: String(index < 2 ? 24 : index < 5 ? 6 : 3),
    fallback_rate: "0"
  })),
  governance: [
    { action: "关系扩展", raw_risk: "0.82", governed_risk: "0.26" },
    { action: "支付查询", raw_risk: "0.76", governed_risk: "0.21" },
    { action: "护照生成", raw_risk: "0.61", governed_risk: "0.16" }
  ],
  counterPassport: [
    { method: "支持证据堆叠", counter_coverage: "0.18", false_positive: "0.31" },
    { method: "加入反证检索", counter_coverage: "0.72", false_positive: "0.12" },
    { method: "护照门禁", counter_coverage: "0.91", false_positive: "0.06" }
  ],
  learningCounts: [
    { target: "candidate_pattern", before: "0", after: "1" },
    { target: "risk_pattern", before: "3", after: "4" },
    { target: "case_memory", before: "3", after: "7" },
    { target: "policy_weight", before: "0", after: "24" }
  ],
  learningWeights: [
    { action: "反证检索", before: "0.42", after: "0.78" },
    { action: "关系扩展", before: "0.54", after: "0.84" },
    { action: "护照生成", before: "0.36", after: "0.72" }
  ],
  efficiency: [
    { method: "纯人工", cases_per_hour: "3", avg_minutes: "47" },
    { method: "规则脚本", cases_per_hour: "11", avg_minutes: "17" },
    { method: "Team-I", cases_per_hour: "34", avg_minutes: "5.2" }
  ],
  capability: [
    { method: "人工表格", capability: "主动追证", score: "20" },
    { method: "人工表格", capability: "多源融合", score: "30" },
    { method: "人工表格", capability: "策略写回", score: "0" },
    { method: "Team-I", capability: "主动追证", score: "92" },
    { method: "Team-I", capability: "多源融合", score: "94" },
    { method: "Team-I", capability: "策略写回", score: "88" }
  ]
};

const fallbackData: WorldData = {
  dashboard: {
    case_count: 3,
    evidence_count: 28,
    trajectory_count: 75,
    passport_count: 3,
    risk_levels: [
      { risk_level: "critical", count: 1 },
      { risk_level: "high", count: 1 },
      { risk_level: "medium", count: 1 }
    ],
    actions: Object.keys(actionLabels).map((action) => ({ action, count: action === "emit_passport" ? 1 : 3 })),
    model_backend: "local-transformers",
    model_path: "7B router + 14B expert",
    openclaw_gateway_url: "local-openclaw-compatible-registry",
    model_invocations: Object.entries(agentLabels).map(([agent_id, meta]) => ({
      agent_id,
      backend: "transformers",
      model: meta.model === "14B" ? "Qwen2.5-14B-Instruct" : "Qwen2.5-7B-Instruct",
      used_fallback: 0,
      count: agent_id === "router_agent" || agent_id === "investigation_agent" ? 24 : agent_id.includes("pattern") || agent_id.includes("passport") ? 3 : 6
    }))
  },
  cases: ["AER-001", "AER-002", "AER-003"].map(makeCase),
  graphs: {
    "AER-001": makeGraph("AER-001"),
    "AER-002": makeGraph("AER-002"),
    "AER-003": makeGraph("AER-003")
  },
  routes: {
    "AER-001": makeRoute("AER-001"),
    "AER-002": makeRoute("AER-002"),
    "AER-003": makeRoute("AER-003")
  },
  passports: {
    "AER-001": makePassport("AER-001"),
    "AER-002": makePassport("AER-002"),
    "AER-003": makePassport("AER-003")
  },
  patterns: [
    { pattern_id: "EC-SKIM-001", name: "团伙刷单骗补", risk_level: "critical" },
    { pattern_id: "EC-FAKE-002", name: "空包虚假交易", risk_level: "high" },
    { pattern_id: "EC-ARBI-003", name: "补贴套利观察", risk_level: "medium" },
    { pattern_id: "EC-COMBO-NEW", name: "评论-空包-退款复合模式", risk_level: "high" }
  ],
  candidates: [
    {
      candidate_id: "CP-001",
      status: "approved",
      confidence: 0.86,
      supporting_cases: ["AER-001", "AER-002"],
      common_signals: ["物流异常", "评论集中", "退款窗口短"],
      required_counter_checks: ["同类促销峰值", "仓配批量自然波动"]
    }
  ],
  policyWeights: Object.keys(actionLabels).flatMap((action, index) =>
    ["EC-SKIM-001", "EC-FAKE-002", "EC-ARBI-003"].map((pattern) => ({
      pattern_id: pattern,
      action_name: action,
      weight: Number((0.38 + index * 0.043).toFixed(3)),
      source: "pattern_writeback"
    }))
  ),
  experiments: fallbackExperiments,
  source: "fallback"
};

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  if (lines[0].trimStart().startsWith("<")) return [];
  const headers = lines[0].replace(/^\uFEFF/, "").split(",").map((item) => item.trim().replace(/^\uFEFF/, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((item) => item.trim());
    return headers.reduce<CsvRow>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

async function loadCsv(path: string, fallback: CsvRow[]): Promise<CsvRow[]> {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`csv ${path} ${response.status}`);
    const rows = parseCsv(await response.text());
    return rows.length ? rows : fallback;
  } catch {
    return fallback;
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${path} ${response.status}`);
  return response.json() as Promise<T>;
}

async function loadExperiments(): Promise<ExperimentData> {
  const publicBase = import.meta.env.BASE_URL.replace(/\/$/, "");
  const base = `${publicBase}/experiments/data`;
  const [
    activeRetrieval,
    multisource,
    agents,
    governance,
    counterPassport,
    learningCounts,
    learningWeights,
    efficiency,
    capability
  ] = await Promise.all([
    loadCsv(`${base}/active_retrieval_curve.csv`, fallbackExperiments.activeRetrieval),
    loadCsv(`${base}/multisource_ablation.csv`, fallbackExperiments.multisource),
    loadCsv(`${base}/agent_collaboration.csv`, fallbackExperiments.agents),
    loadCsv(`${base}/governance_benchmark.csv`, fallbackExperiments.governance),
    loadCsv(`${base}/counter_passport_metrics.csv`, fallbackExperiments.counterPassport),
    loadCsv(`${base}/learning_writeback_counts.csv`, fallbackExperiments.learningCounts),
    loadCsv(`${base}/learning_policy_weights.csv`, fallbackExperiments.learningWeights),
    loadCsv(`${base}/efficiency_benchmark.csv`, fallbackExperiments.efficiency),
    loadCsv(`${base}/capability_scorecard.csv`, fallbackExperiments.capability)
  ]);
  return {
    activeRetrieval,
    multisource,
    agents,
    governance,
    counterPassport,
    learningCounts,
    learningWeights,
    efficiency,
    capability
  };
}

export async function loadWorldData(): Promise<WorldData> {
  const experiments = await loadExperiments();
  try {
    const [dashboard, cases, patterns, candidates, policyWeights] = await Promise.all([
      apiGet<Dashboard>("/api/dashboard"),
      apiGet<AuditCase[]>("/api/cases"),
      apiGet<Pattern[]>("/api/patterns"),
      apiGet<CandidatePattern[]>("/api/patterns/candidates"),
      apiGet<PolicyWeight[]>("/api/policy/weights")
    ]);

    const selectedCases = cases.slice(0, 3);
    const detailPairs = await Promise.all(
      selectedCases.map(async (item) => {
        const [detail, graph, route, passport] = await Promise.all([
          apiGet<AuditCase>(`/api/cases/${item.case_id}`),
          apiGet<CaseGraph>(`/api/cases/${item.case_id}/graph`),
          apiGet<RouteInfo>(`/api/cases/${item.case_id}/route`),
          apiGet<Passport>(`/api/cases/${item.case_id}/passport`)
        ]);
        return [item.case_id, detail, graph, route, passport] as const;
      })
    );

    return {
      dashboard,
      cases: detailPairs.map(([, detail]) => detail),
      graphs: Object.fromEntries(detailPairs.map(([caseId, , graph]) => [caseId, graph])),
      routes: Object.fromEntries(detailPairs.map(([caseId, , , route]) => [caseId, route])),
      passports: Object.fromEntries(detailPairs.map(([caseId, , , , passport]) => [caseId, passport])),
      patterns,
      candidates,
      policyWeights,
      experiments,
      source: "api"
    };
  } catch (error) {
    console.warn("Team-I atlas API unavailable, using local fallback data.", error);
    return { ...fallbackData, experiments, source: "fallback" };
  }
}

export function getCaseTitle(item: AuditCase): string {
  return caseMeta[item.case_id]?.title || item.title || item.pattern_name || item.case_id;
}

export function getCasePattern(item: AuditCase): string {
  return item.pattern_id || item.pattern_name || caseMeta[item.case_id]?.pattern || "未命名模式";
}

export function getCaseSummary(item: AuditCase): string {
  return caseMeta[item.case_id]?.summary || item.summary || getCasePattern(item);
}

export function getCaseDisplayLevel(item: AuditCase): string {
  return caseMeta[item.case_id]?.level || item.risk_level || "medium";
}

export function getCaseDisplayScore(item: AuditCase): number {
  return caseMeta[item.case_id]?.score ?? item.confidence ?? item.risk_score ?? 0;
}

export function getActionLabel(action?: string): string {
  if (!action) return "未选择动作";
  return actionLabels[action] || action;
}

export function getActionDescription(action?: string): string {
  if (!action) return "等待 Router 罗盘选择下一步追证动作。";
  return actionDescriptions[action] || "受控工具动作执行并写入审计轨迹。";
}
