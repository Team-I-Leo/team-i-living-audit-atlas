import { useEffect, useMemo, useState } from "react";
import type { AuditCase, CaseGraph, CsvRow, Passport, RouteInfo, WorldData } from "./types";
import {
  actionLabels,
  agentLabels,
  getActionDescription,
  getActionLabel,
  getCaseDisplayLevel,
  getCaseDisplayScore,
  getCasePattern,
  getCaseSummary,
  getCaseTitle,
  loadWorldData
} from "./data";

type Difficulty = "easy" | "normal" | "hard";

interface Stage {
  id: string;
  no: number;
  title: string;
  subtitle: string;
  place: string;
  action: string;
  guardian: string;
  guardianRole: string;
  x: number;
  y: number;
  color: string;
  loot: string;
  result: string;
}

const DIFFICULTY_CASE: Record<Difficulty, string> = {
  easy: "AER-003",
  normal: "AER-002",
  hard: "AER-001"
};

const DIFFICULTY_LABELS: Record<Difficulty, { label: string; note: string; catchStage: number }> = {
  easy: { label: "Easy", note: "弱信号观察", catchStage: 3 },
  normal: { label: "Normal", note: "复合异常追证", catchStage: 5 },
  hard: { label: "Hard", note: "团伙骗补 Boss", catchStage: 7 }
};

const stages: Stage[] = [
  {
    id: "risk-space",
    no: 1,
    title: "业务风险空间",
    subtitle: "订单、退款、补贴与设备信号进入审计地平线",
    place: "起点集市",
    action: "analyze_behavior_sequence",
    guardian: "风险信号 Agent",
    guardianRole: "从实时流中点亮异常火种",
    x: 11,
    y: 63,
    color: "#ef6f4d",
    loot: "风险分 +0.18",
    result: "黑灰产脚印被捕捉，案件从业务流进入追证链。"
  },
  {
    id: "source-ingest",
    no: 2,
    title: "多源数据接入",
    subtitle: "订单、支付、物流、评论、设备、IP 与外部特征同屏对齐",
    place: "多源地层",
    action: "expand_infra_graph",
    guardian: "数据编织者",
    guardianRole: "把散落证据铸成统一地貌",
    x: 27,
    y: 56,
    color: "#35a7ff",
    loot: "源覆盖 +42%",
    result: "孤立表格被接成可追踪的证据地层。"
  },
  {
    id: "fusion",
    no: 3,
    title: "融合与案例构建",
    subtitle: "跨表实体、关系边和时间线汇聚为一张案件图",
    place: "证据森林",
    action: "search_historical_cases",
    guardian: "图谱工匠",
    guardianRole: "把同一团伙的影子连成网络",
    x: 42,
    y: 57,
    color: "#7ed957",
    loot: "关联边 +32",
    result: "账号、设备、IP、支付账户与收货地完成关系扩展。"
  },
  {
    id: "agent-sun",
    no: 4,
    title: "Agent 主动追证",
    subtitle: "太阳守护者根据证据缺口持续发光、追踪、反思",
    place: "太阳神殿",
    action: "seek_counter_evidence",
    guardian: "主动追证 Agent",
    guardianRole: "追问缺口，寻找支持证据与反证",
    x: 58,
    y: 60,
    color: "#ffd166",
    loot: "追证能量 +24",
    result: "系统不止命中规则，而是主动选择下一步取证动作。"
  },
  {
    id: "openclaw",
    no: 5,
    title: "OpenCLAW 受控动作",
    subtitle: "所有工具调用通过受控工坊执行、记账、留痕",
    place: "受控工坊",
    action: "query_payment_cluster",
    guardian: "OpenCLAW 门卫",
    guardianRole: "把动作约束在可审计边界内",
    x: 72,
    y: 58,
    color: "#b975ff",
    loot: "治理风险 -68%",
    result: "关系扩展、退款查询、支付簇和物流追踪进入受控动作注册表。"
  },
  {
    id: "passport",
    no: 6,
    title: "证据护照与人工复核",
    subtitle: "支持证据、反证、不确定性与人工门禁合成为可复核护照",
    place: "人工复核塔",
    action: "emit_passport",
    guardian: "证据护照 Agent",
    guardianRole: "生成可追溯、可验证、可分享的结论",
    x: 83,
    y: 68,
    color: "#f7c948",
    loot: "护照完整度 90%",
    result: "案件具备复核入口，结论、证据与不确定性同步落章。"
  },
  {
    id: "learning",
    no: 7,
    title: "模式学习与策略回流",
    subtitle: "人工确认后的模式进入知识库、案例记忆和策略权重",
    place: "学习回流炉",
    action: "compare_promo_cohort",
    guardian: "智慧图谱书馆",
    guardianRole: "把一次追证沉淀为下一次更快的判断",
    x: 93,
    y: 48,
    color: "#2ee6a6",
    loot: "系统进化 +1",
    result: "风险模式、候选模式、策略权重与案例记忆完成回流。"
  }
];

function App() {
  const [world, setWorld] = useState<WorldData | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("hard");
  const [selectedCaseId, setSelectedCaseId] = useState(DIFFICULTY_CASE.hard);
  const [stageIndex, setStageIndex] = useState(0);
  const [autoRun, setAutoRun] = useState(false);
  const [activeStage, setActiveStage] = useState<Stage | null>(null);

  useEffect(() => {
    let mounted = true;
    loadWorldData().then((data) => {
      if (!mounted) return;
      setWorld(data);
      if (!data.cases.some((item) => item.case_id === selectedCaseId)) {
        setSelectedCaseId(data.cases[0]?.case_id ?? DIFFICULTY_CASE.hard);
      }
    });
    return () => {
      mounted = false;
    };
  }, [selectedCaseId]);

  useEffect(() => {
    if (!autoRun) return;
    const timer = window.setInterval(() => {
      setStageIndex((current) => {
        if (current >= stages.length - 1) {
          setAutoRun(false);
          return current;
        }
        return current + 1;
      });
    }, 1800);
    return () => window.clearInterval(timer);
  }, [autoRun]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault();
        setStageIndex((current) => Math.min(stages.length - 1, current + 1));
      }
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        setStageIndex((current) => Math.max(0, current - 1));
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveStage(stages[stageIndex]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stageIndex]);

  const cases = world?.cases ?? [];
  const selectedCase = useMemo(() => {
    return cases.find((item) => item.case_id === selectedCaseId) ?? cases[0];
  }, [cases, selectedCaseId]);

  const graph = selectedCase ? world?.graphs[selectedCase.case_id] : undefined;
  const route = selectedCase ? world?.routes[selectedCase.case_id] : undefined;
  const passport = selectedCase ? world?.passports[selectedCase.case_id] : undefined;
  const currentStage = stages[stageIndex];
  const currentAction = route?.ranked_actions[stageIndex]?.action ?? currentStage.action;
  const catchStage = DIFFICULTY_LABELS[difficulty].catchStage;
  const thiefHp = Math.max(0, Math.round(100 - ((stageIndex + 1) / catchStage) * 100));
  const caught = stageIndex + 1 >= catchStage;
  const riskScore = selectedCase ? getCaseDisplayScore(selectedCase) : 0;
  const passportScore = route?.coverage.sufficiency_score ?? passport?.sufficiency_score ?? 0;

  const chooseDifficulty = (next: Difficulty) => {
    setDifficulty(next);
    setSelectedCaseId(DIFFICULTY_CASE[next]);
    setStageIndex(0);
    setAutoRun(false);
    setActiveStage(null);
  };

  const move = (delta: number) => {
    setStageIndex((current) => Math.max(0, Math.min(stages.length - 1, current + delta)));
  };

  if (!world || !selectedCase) {
    return (
      <main className="magic-game loading-screen">
        <div className="loading-card pixel-frame">
          <span className="loading-orb" />
          <h1>Team-I 主动追证剧场</h1>
          <p>正在点亮多源地层、模型议会与 OpenCLAW 工坊。</p>
        </div>
      </main>
    );
  }

  return (
    <main className="magic-game">
      <TopHud
        world={world}
        difficulty={difficulty}
        chooseDifficulty={chooseDifficulty}
        selectedCase={selectedCase}
        stage={currentStage}
      />

      <section className="playfield">
        <aside className="left-stack">
          <MiniMap stageIndex={stageIndex} />
          <SourceLedger world={world} />
          <CurrentActionPanel stage={currentStage} action={currentAction} route={route} />
        </aside>

        <WorldCanvas
          stageIndex={stageIndex}
          selectedCase={selectedCase}
          difficulty={difficulty}
          riskScore={riskScore}
          passportScore={passportScore}
          thiefHp={thiefHp}
          caught={caught}
          setStageIndex={setStageIndex}
          openStage={setActiveStage}
        />

        <aside className="right-stack">
          <CasePanel selectedCase={selectedCase} difficulty={difficulty} riskScore={riskScore} caught={caught} />
          <LearningFurnace world={world} selectedCase={selectedCase} />
          <CapabilityNebula world={world} />
        </aside>
      </section>

      <section className="bottom-console">
        <ModelCouncil world={world} />
        <OpenClawForge route={route} />
        <EvidenceContinent graph={graph} selectedCase={selectedCase} />
        <PassportConsole passport={passport} route={route} selectedCase={selectedCase} />
        <ExperimentConsole world={world} />
      </section>

      <ControlBar
        autoRun={autoRun}
        setAutoRun={setAutoRun}
        move={move}
        reset={() => {
          setStageIndex(0);
          setAutoRun(false);
        }}
        openStage={() => setActiveStage(currentStage)}
        stage={currentStage}
        caught={caught}
      />

      {activeStage ? (
        <StageCodex
          stage={activeStage}
          selectedCase={selectedCase}
          world={world}
          graph={graph}
          route={route}
          passport={passport}
          close={() => setActiveStage(null)}
        />
      ) : null}
    </main>
  );
}

function TopHud({
  world,
  difficulty,
  chooseDifficulty,
  selectedCase,
  stage
}: {
  world: WorldData;
  difficulty: Difficulty;
  chooseDifficulty: (next: Difficulty) => void;
  selectedCase: AuditCase;
  stage: Stage;
}) {
  return (
    <header className="top-hud">
      <div className="brand-lockup">
        <div className="team-badge">T-I</div>
        <div>
          <h1>Team-I 主动追证剧场</h1>
          <p>OpenCLAW · 多模型协作 · 多源融合 · 证据护照 · 策略回流</p>
        </div>
      </div>
      <div className="hud-metrics">
        <HudMetric icon="⚙" label="风险案例" value={world.dashboard.case_count} />
        <HudMetric icon="▣" label="证据条目" value={world.dashboard.evidence_count} />
        <HudMetric icon="✦" label="追踪轨迹" value={world.dashboard.trajectory_count} />
        <HudMetric icon="☼" label="模型调用" value={sum(world.dashboard.model_invocations.map((item) => item.count))} />
        <HudMetric icon="●" label="轨迹状态" value="在线" tone="green" />
      </div>
      <div className="difficulty-box pixel-frame">
        <span>当前关卡</span>
        <strong>{stage.no}/7</strong>
        <div className="difficulty-tabs" aria-label="Case 难度">
          {(["easy", "normal", "hard"] as Difficulty[]).map((item) => (
            <button
              key={item}
              type="button"
              className={item === difficulty ? "active" : ""}
              onClick={() => chooseDifficulty(item)}
              aria-pressed={item === difficulty}
            >
              {DIFFICULTY_LABELS[item].label}
            </button>
          ))}
        </div>
        <small>{selectedCase.case_id} · {DIFFICULTY_LABELS[difficulty].note}</small>
      </div>
    </header>
  );
}

function HudMetric({ icon, label, value, tone }: { icon: string; label: string; value: string | number; tone?: string }) {
  return (
    <div className={`hud-metric ${tone ?? ""}`}>
      <span>{icon}</span>
      <b>{value}</b>
      <small>{label}</small>
    </div>
  );
}

function WorldCanvas({
  stageIndex,
  selectedCase,
  difficulty,
  riskScore,
  passportScore,
  thiefHp,
  caught,
  setStageIndex,
  openStage
}: {
  stageIndex: number;
  selectedCase: AuditCase;
  difficulty: Difficulty;
  riskScore: number;
  passportScore: number;
  thiefHp: number;
  caught: boolean;
  setStageIndex: (next: number) => void;
  openStage: (stage: Stage) => void;
}) {
  const active = stages[stageIndex];
  return (
    <section className="world-canvas pixel-frame">
      <div className="sky-glow" />
      <div className="mountains far" />
      <div className="mountains near" />
      <div className="river" />
      <div className="cloud cloud-a" />
      <div className="cloud cloud-b" />
      <div className="airship" />

      <ScrollBanner
        title="主动追证魔法世界"
        subtitle="黑灰产每跨过一道关卡，Team-I 的证据光束就多锁定一次。"
      />

      <AgentSun stageIndex={stageIndex} />

      <svg className="stage-route" viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M 60 285 C 160 230, 230 265, 300 205 S 450 190, 520 160 S 650 220, 720 210 S 850 280, 950 195"
          fill="none"
          stroke="rgba(255, 210, 90, 0.92)"
          strokeWidth="5"
          strokeDasharray="8 12"
          strokeLinecap="round"
        />
        <path
          d="M 60 285 C 160 230, 230 265, 300 205 S 450 190, 520 160 S 650 220, 720 210 S 850 280, 950 195"
          fill="none"
          stroke="rgba(44, 232, 214, 0.45)"
          strokeWidth="11"
          strokeDasharray="4 18"
          strokeLinecap="round"
        />
      </svg>

      {stages.map((stage, index) => (
        <GateNode
          key={stage.id}
          stage={stage}
          index={index}
          active={index === stageIndex}
          passed={index < stageIndex}
          onClick={() => {
            setStageIndex(index);
            openStage(stage);
          }}
        />
      ))}

      <ThiefSprite stage={active} thiefHp={thiefHp} caught={caught} />
      <RobotPatrol stage={active} />

      <div className="case-card-strip">
        {[
          { id: "AER-001", title: "团伙骗补", score: "94%", tone: "red" },
          { id: "AER-002", title: "空包评论工坊", score: "88%", tone: "blue" },
          { id: "AER-003", title: "补贴套利观察", score: "72%", tone: "green" }
        ].map((item) => (
          <div key={item.id} className={`world-case-card ${item.id === selectedCase.case_id ? "active" : ""} ${item.tone}`}>
            <span>{item.id}</span>
            <b>{item.score}</b>
            <small>{item.title}</small>
          </div>
        ))}
      </div>

      <div className="boss-panel pixel-frame">
        <span>黑灰产首领</span>
        <strong>{getCaseTitle(selectedCase)}</strong>
        <div className="boss-hp">
          <i style={{ width: `${thiefHp}%` }} />
        </div>
        <small>{caught ? "已被锁定归案" : `${DIFFICULTY_LABELS[difficulty].note} · 护照门槛 ${pct(passportScore)}`}</small>
      </div>

      <div className="world-caption pixel-frame">
        <b>{active.place}</b>
        <span>{active.result}</span>
        <em>{getCasePattern(selectedCase)} · 风险分 {riskScore.toFixed(2)}</em>
      </div>
    </section>
  );
}

function ScrollBanner({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="scroll-banner">
      <span className="scroll-cap left" />
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <span className="scroll-cap right" />
    </div>
  );
}

function AgentSun({ stageIndex }: { stageIndex: number }) {
  return (
    <div className="agent-sun" aria-label="Agent 主动追证">
      <span className="ray ray-a" />
      <span className="ray ray-b" />
      <span className="ray ray-c" />
      <span className="sun-face">
        <i className="eye left" />
        <i className="eye right" />
        <i className="mouth" />
      </span>
      <strong>Agent 主动追证</strong>
      <small>光束 {stageIndex + 1}/7</small>
    </div>
  );
}

function GateNode({
  stage,
  index,
  active,
  passed,
  onClick
}: {
  stage: Stage;
  index: number;
  active: boolean;
  passed: boolean;
  onClick: () => void;
}) {
  const style = {
    left: `${stage.x}%`,
    top: `${stage.y}%`,
    "--stage-color": stage.color
  } as React.CSSProperties;
  return (
    <button
      type="button"
      className={`gate-node ${active ? "active" : ""} ${passed ? "passed" : ""}`}
      style={style}
      onClick={onClick}
      aria-label={`打开关卡 ${stage.no} ${stage.title}`}
    >
      <span className="gate-number">{stage.no}</span>
      <b>{stage.title}</b>
      <small>{stage.guardian}</small>
      <i>{index < 3 ? "证据" : index < 5 ? "Agent" : "回流"}</i>
    </button>
  );
}

function ThiefSprite({ stage, thiefHp, caught }: { stage: Stage; thiefHp: number; caught: boolean }) {
  const style = {
    left: `calc(${stage.x}% - 34px)`,
    top: `calc(${stage.y}% - 88px)`
  } as React.CSSProperties;
  return (
    <div className={`thief-wrap ${caught ? "caught" : ""}`} style={style}>
      <div className="speech-bubble">{caught ? "证据闭环，跑不掉了！" : thiefHp < 45 ? "糟糕，被追上了！" : "先溜过这关！"}</div>
      <div className="thief-sprite" aria-label="黑灰产小偷">
        <span className="hat" />
        <span className="head" />
        <span className="mask" />
        <span className="body" />
        <span className="bag" />
        <span className="arm arm-left" />
        <span className="arm arm-right" />
        <span className="leg leg-left" />
        <span className="leg leg-right" />
      </div>
      <div className="dust dust-a" />
      <div className="dust dust-b" />
    </div>
  );
}

function RobotPatrol({ stage }: { stage: Stage }) {
  const style = {
    left: `calc(${Math.min(95, stage.x + 7)}% - 24px)`,
    top: `calc(${Math.max(18, stage.y - 22)}% - 20px)`
  } as React.CSSProperties;
  return (
    <div className="robot-patrol" style={style}>
      <span className="antenna" />
      <span className="visor" />
      <span className="body" />
      <small>{stage.guardian.split(" ")[0]}</small>
    </div>
  );
}

function MiniMap({ stageIndex }: { stageIndex: number }) {
  return (
    <section className="side-card minimap-card pixel-frame">
      <header>
        <h3>世界地图</h3>
        <span>{stageIndex + 1}/7</span>
      </header>
      <svg viewBox="0 0 260 150" className="minimap">
        <defs>
          <linearGradient id="mapGlow" x1="0" x2="1">
            <stop offset="0" stopColor="#ffe08a" />
            <stop offset="1" stopColor="#3debd7" />
          </linearGradient>
        </defs>
        <path d="M24 108 C54 74 80 95 104 54 S160 60 176 42 S216 82 234 34" fill="none" stroke="url(#mapGlow)" strokeWidth="4" strokeDasharray="7 6" />
        {stages.map((stage, index) => (
          <g key={stage.id}>
            <circle
              cx={24 + index * 35}
              cy={index % 2 ? 76 - index * 4 : 108 - index * 9}
              r={index === stageIndex ? 10 : 7}
              fill={index <= stageIndex ? stage.color : "#142b45"}
              stroke="#f5c46b"
              strokeWidth="2"
            />
            <text x={24 + index * 35} y={(index % 2 ? 80 - index * 4 : 112 - index * 9)} textAnchor="middle">
              {stage.no}
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
}

function SourceLedger({ world }: { world: WorldData }) {
  const rows = [
    ["订单 / 支付", "128K"],
    ["退款 / 售后", "32K"],
    ["物流轨迹", "84K"],
    ["评论内容", "212K"],
    ["设备 / IP", "211K"],
    ["补贴台账", "23K"]
  ];
  return (
    <section className="side-card pixel-frame">
      <header>
        <h3>多源地层</h3>
        <span>{world.dashboard.evidence_count} 证据</span>
      </header>
      <div className="source-grid">
        {rows.map(([label, value], index) => (
          <div key={label}>
            <i style={{ "--delay": `${index * 0.08}s` } as React.CSSProperties} />
            <span>{label}</span>
            <b>{value}</b>
          </div>
        ))}
      </div>
      <ProgressLine label="数据完整度" value={0.88} />
    </section>
  );
}

function CurrentActionPanel({ stage, action, route }: { stage: Stage; action: string; route?: RouteInfo }) {
  const ranked = route?.ranked_actions.slice(0, 3) ?? [];
  return (
    <section className="side-card pixel-frame">
      <header>
        <h3>当前动作</h3>
        <span>{stage.no}</span>
      </header>
      <div className="action-orb">
        <span />
        <b>{getActionLabel(action)}</b>
      </div>
      <p>{getActionDescription(action)}</p>
      <div className="rank-list">
        {ranked.map((item) => (
          <div key={item.action}>
            <span>{getActionLabel(item.action)}</span>
            <b>{safeRatio(item.score).toFixed(2)}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function CasePanel({
  selectedCase,
  difficulty,
  riskScore,
  caught
}: {
  selectedCase: AuditCase;
  difficulty: Difficulty;
  riskScore: number;
  caught: boolean;
}) {
  return (
    <section className="side-card case-panel pixel-frame">
      <header>
        <h3>当前 Case</h3>
        <span>{caught ? "已锁定" : "追证中"}</span>
      </header>
      <strong>{selectedCase.case_id}</strong>
      <h4>{getCaseTitle(selectedCase)}</h4>
      <p>{getCaseSummary(selectedCase)}</p>
      <ProgressLine label="风险分" value={riskScore} danger />
      <ProgressLine label="追证强度" value={difficulty === "hard" ? 0.96 : difficulty === "normal" ? 0.78 : 0.48} />
      <div className="stars" aria-label="风险星级">
        {Array.from({ length: 5 }).map((_, index) => (
          <i key={index} className={index < Math.ceil(riskScore * 5) ? "lit" : ""}>★</i>
        ))}
      </div>
    </section>
  );
}

function LearningFurnace({ world, selectedCase }: { world: WorldData; selectedCase: AuditCase }) {
  const candidates = world.candidates.slice(0, 3);
  return (
    <section className="side-card furnace-card pixel-frame">
      <header>
        <h3>学习回流炉</h3>
        <span>{world.policyWeights.length} 权重</span>
      </header>
      <div className="furnace">
        <span className="flame" />
        <b>模式库</b>
      </div>
      <div className="candidate-list">
        {candidates.map((candidate) => (
          <div key={candidate.candidate_id}>
            <b>{candidate.candidate_id}</b>
            <span>{candidate.status}</span>
          </div>
        ))}
        <div>
          <b>{getCasePattern(selectedCase)}</b>
          <span>case_memory</span>
        </div>
      </div>
    </section>
  );
}

function CapabilityNebula({ world }: { world: WorldData }) {
  const rows = world.experiments.capability.slice(-6);
  return (
    <section className="side-card pixel-frame">
      <header>
        <h3>能力星轨</h3>
        <span>Team-I</span>
      </header>
      <RadarMini rows={rows} />
    </section>
  );
}

function ModelCouncil({ world }: { world: WorldData }) {
  const invocations = world.dashboard.model_invocations.slice(0, 4);
  return (
    <section className="console-card pixel-frame">
      <header>
        <h3>模型议会</h3>
        <span>{world.dashboard.model_backend}</span>
      </header>
      <div className="agent-grid">
        {invocations.map((item) => {
          const meta = agentLabels[item.agent_id] ?? { label: item.agent_id, model: item.model, color: "#6ac7ff", role: "" };
          return (
            <div key={item.agent_id} className="agent-tile">
              <i style={{ background: meta.color }} />
              <b>{meta.label}</b>
              <span>{meta.model || item.model}</span>
              <ProgressLine value={Math.min(1, item.count / 24)} label={`${item.count} 次调用`} compact />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function OpenClawForge({ route }: { route?: RouteInfo }) {
  const actions = route?.ranked_actions.slice(0, 8).map((item) => item.action) ?? Object.keys(actionLabels).slice(0, 8);
  return (
    <section className="console-card pixel-frame">
      <header>
        <h3>OpenCLAW 工坊</h3>
        <span>受控动作</span>
      </header>
      <div className="forge-grid">
        {actions.map((action, index) => (
          <div key={action}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            <span>{getActionLabel(action)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function EvidenceContinent({ graph, selectedCase }: { graph?: CaseGraph; selectedCase: AuditCase }) {
  return (
    <section className="console-card pixel-frame">
      <header>
        <h3>证据大陆</h3>
        <span>{graph?.nodes.length ?? 0} 节点</span>
      </header>
      <MiniEvidenceGraph graph={graph} center={selectedCase.case_id} />
    </section>
  );
}

function PassportConsole({ passport, route, selectedCase }: { passport?: Passport; route?: RouteInfo; selectedCase: AuditCase }) {
  const score = route?.coverage.sufficiency_score ?? passport?.sufficiency_score ?? 0;
  return (
    <section className="console-card passport-mini pixel-frame">
      <header>
        <h3>证据护照</h3>
        <span>{score >= 0.8 ? "可复核" : "追证中"}</span>
      </header>
      <div className="passport-stamp">
        <b>{pct(score)}</b>
        <span>{selectedCase.case_id}</span>
      </div>
      <small>{passport?.conclusion ?? "证据持续汇聚中"}</small>
    </section>
  );
}

function ExperimentConsole({ world }: { world: WorldData }) {
  return (
    <section className="console-card pixel-frame">
      <header>
        <h3>追证能量曲线</h3>
        <span>实验仪表</span>
      </header>
      <SparkLine rows={world.experiments.activeRetrieval} />
    </section>
  );
}

function ControlBar({
  autoRun,
  setAutoRun,
  move,
  reset,
  openStage,
  stage,
  caught
}: {
  autoRun: boolean;
  setAutoRun: (value: boolean) => void;
  move: (delta: number) => void;
  reset: () => void;
  openStage: () => void;
  stage: Stage;
  caught: boolean;
}) {
  return (
    <footer className="control-bar">
      <div className="hero-status">
        <div className="auditor-avatar">审</div>
        <div>
          <strong>审计学徒 Lv.18</strong>
          <span>{caught ? "黑灰产已锁定" : `${stage.title} · ${stage.loot}`}</span>
        </div>
      </div>
      <div className="skill-slots" aria-label="技能槽">
        {["Q", "W", "E", "R"].map((key, index) => (
          <button key={key} type="button" title={`技能 ${key}`}>
            <i>{index + 1}</i>
            <span>{key}</span>
          </button>
        ))}
      </div>
      <div className="inventory">
        <span>证据放大镜 ×2</span>
        <span>审计罗盘 ×1</span>
        <span>策略芯片 ×3</span>
      </div>
      <div className="game-buttons">
        <button type="button" className={autoRun ? "active" : ""} onClick={() => setAutoRun(!autoRun)}>
          ▶ 自动跑
        </button>
        <button type="button" onClick={() => move(-1)}>← 后退</button>
        <button type="button" onClick={() => move(1)}>前进 →</button>
        <button type="button" className="primary" onClick={openStage}>打开关卡</button>
        <button type="button" onClick={reset}>重开</button>
      </div>
    </footer>
  );
}

function StageCodex({
  stage,
  selectedCase,
  world,
  graph,
  route,
  passport,
  close
}: {
  stage: Stage;
  selectedCase: AuditCase;
  world: WorldData;
  graph?: CaseGraph;
  route?: RouteInfo;
  passport?: Passport;
  close: () => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="stage-codex pixel-frame">
        <button className="modal-close" type="button" onClick={close} aria-label="关闭关卡详情">×</button>
        <header>
          <span>关卡 {stage.no}</span>
          <h2>{stage.title}</h2>
          <p>{stage.subtitle}</p>
        </header>
        <div className="codex-body">
          <div className="codex-main">
            <StageVisual stage={stage} world={world} graph={graph} route={route} passport={passport} selectedCase={selectedCase} />
          </div>
          <aside className="codex-side">
            <h3>{stage.guardian}</h3>
            <p>{stage.guardianRole}</p>
            <div className="codex-outcome">
              <b>{stage.loot}</b>
              <span>{stage.result}</span>
            </div>
            <div className="codex-kv">
              <span>受控动作</span>
              <b>{getActionLabel(stage.action)}</b>
              <span>案件</span>
              <b>{selectedCase.case_id} · {getCasePattern(selectedCase)}</b>
              <span>风险级别</span>
              <b>{getCaseDisplayLevel(selectedCase)}</b>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function StageVisual({
  stage,
  world,
  graph,
  route,
  passport,
  selectedCase
}: {
  stage: Stage;
  world: WorldData;
  graph?: CaseGraph;
  route?: RouteInfo;
  passport?: Passport;
  selectedCase: AuditCase;
}) {
  if (stage.id === "risk-space") {
    return <SignalBoard selectedCase={selectedCase} />;
  }
  if (stage.id === "source-ingest") {
    return <SourceAblation rows={world.experiments.multisource} />;
  }
  if (stage.id === "fusion") {
    return <BigEvidenceMap graph={graph} selectedCase={selectedCase} />;
  }
  if (stage.id === "agent-sun") {
    return <ActiveRetrievalChart rows={world.experiments.activeRetrieval} />;
  }
  if (stage.id === "openclaw") {
    return <GovernanceForge rows={world.experiments.governance} route={route} />;
  }
  if (stage.id === "passport") {
    return <EvidencePassport passport={passport} route={route} selectedCase={selectedCase} />;
  }
  return <LearningWriteback world={world} />;
}

function SignalBoard({ selectedCase }: { selectedCase: AuditCase }) {
  const scores = selectedCase.scores ?? {};
  const rows = [
    ["统计异常", scores.statistical ?? 0.84],
    ["关系风险", scores.relational ?? 0.78],
    ["语义异常", scores.semantic ?? 0.72],
    ["反证余量", scores.counter ?? 0.32]
  ];
  return (
    <div className="signal-board codex-panel">
      <div className="pixel-thief-card">
        <ThiefIcon />
        <strong>{getCaseTitle(selectedCase)}</strong>
        <span>{getCaseSummary(selectedCase)}</span>
      </div>
      <div className="signal-bars">
        {rows.map(([label, raw]) => {
          const value = Number(raw);
          return <ProgressLine key={String(label)} label={String(label)} value={value} danger={value > 0.8} />;
        })}
      </div>
    </div>
  );
}

function SourceAblation({ rows }: { rows: CsvRow[] }) {
  return (
    <div className="codex-panel">
      <h3>来源地层叠加</h3>
      <VerticalBars rows={rows} labelKeys={["stage", "source"]} valueKeys={["sufficiency_mean", "dimension_coverage_mean"]} />
    </div>
  );
}

function BigEvidenceMap({ graph, selectedCase }: { graph?: CaseGraph; selectedCase: AuditCase }) {
  return (
    <div className="codex-panel big-map">
      <h3>证据关系图谱</h3>
      <MiniEvidenceGraph graph={graph} center={selectedCase.case_id} large />
    </div>
  );
}

function ActiveRetrievalChart({ rows }: { rows: CsvRow[] }) {
  return (
    <div className="codex-panel">
      <h3>主动追证能量曲线</h3>
      <LineChart rows={rows} />
    </div>
  );
}

function GovernanceForge({ rows, route }: { rows: CsvRow[]; route?: RouteInfo }) {
  return (
    <div className="codex-panel forge-visual">
      <div>
        <h3>受控动作热区</h3>
        <div className="governance-grid">
          {(route?.ranked_actions ?? []).slice(0, 12).map((item, index) => (
            <span key={item.action} style={{ opacity: 0.55 + safeRatio(item.score) * 0.4 }}>
              {index + 1}
            </span>
          ))}
        </div>
      </div>
      <div>
        <h3>治理风险压降</h3>
        <VerticalBars rows={rows} labelKeys={["action"]} valueKeys={["governed_risk", "raw_risk"]} />
      </div>
    </div>
  );
}

function EvidencePassport({
  passport,
  route,
  selectedCase
}: {
  passport?: Passport;
  route?: RouteInfo;
  selectedCase: AuditCase;
}) {
  const required = route?.coverage.required ?? passport?.required ?? [];
  const covered = route?.coverage.covered ?? passport?.covered ?? [];
  const score = route?.coverage.sufficiency_score ?? passport?.sufficiency_score ?? 0;
  return (
    <div className="codex-panel passport-full">
      <div className="big-passport">
        <span>证据护照</span>
        <strong>{pct(score)}</strong>
        <b>{selectedCase.case_id}</b>
        <em>{score >= 0.8 ? "人工复核通过门槛" : "继续追证"}</em>
      </div>
      <div className="passport-checks">
        {required.map((item) => (
          <div key={item} className={covered.includes(item) ? "covered" : ""}>
            <i>{covered.includes(item) ? "✓" : "□"}</i>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LearningWriteback({ world }: { world: WorldData }) {
  return (
    <div className="codex-panel learning-visual">
      <div>
        <h3>写回计数</h3>
        <VerticalBars rows={world.experiments.learningCounts} labelKeys={["target"]} valueKeys={["after", "before"]} />
      </div>
      <div>
        <h3>策略权重</h3>
        <VerticalBars rows={world.experiments.learningWeights} labelKeys={["action"]} valueKeys={["after", "before"]} />
      </div>
      <div>
        <h3>处理效率</h3>
        <VerticalBars rows={world.experiments.efficiency} labelKeys={["method"]} valueKeys={["cases_per_analyst_day", "cases_per_hour"]} />
      </div>
    </div>
  );
}

function MiniEvidenceGraph({ graph, center, large = false }: { graph?: CaseGraph; center: string; large?: boolean }) {
  const nodes = graph?.nodes.slice(0, large ? 22 : 12) ?? [];
  const size = large ? 520 : 260;
  const radius = large ? 190 : 92;
  const cx = size / 2;
  const cy = large ? 210 : 92;
  const positioned = nodes.map((node, index) => {
    if (index === 0) return { node, x: cx, y: cy };
    const angle = ((index - 1) / Math.max(1, nodes.length - 1)) * Math.PI * 2 - Math.PI / 2;
    return { node, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });
  return (
    <svg className={`evidence-graph ${large ? "large" : ""}`} viewBox={`0 0 ${size} ${large ? 390 : 190}`}>
      {positioned.slice(1).map((point) => (
        <line key={`${center}-${point.node.id}`} x1={cx} y1={cy} x2={point.x} y2={point.y} />
      ))}
      {positioned.map((point, index) => (
        <g key={point.node.id}>
          <circle className={index === 0 ? "center" : ""} cx={point.x} cy={point.y} r={index === 0 ? 14 : 7} />
          <text x={point.x} y={point.y + (index === 0 ? 30 : 18)} textAnchor="middle">
            {index === 0 ? center : compactLabel(point.node.label ?? point.node.id)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function ProgressLine({
  label,
  value,
  danger,
  compact
}: {
  label: string;
  value: number;
  danger?: boolean;
  compact?: boolean;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div className={`progress-line ${danger ? "danger" : ""} ${compact ? "compact" : ""}`}>
      <span>{label}</span>
      <div>
        <i style={{ width: `${clamped * 100}%` }} />
      </div>
      {!compact ? <b>{pct(clamped)}</b> : null}
    </div>
  );
}

function SparkLine({ rows }: { rows: CsvRow[] }) {
  const data = rows
    .filter((row) => /Team-I|主动追证/.test(row.method ?? ""))
    .slice(0, 8)
    .map((row, index) => ({ x: index, y: numeric(row, ["sufficiency_mean", "passport_ready_rate"]) }));
  const points = makePolyline(data, 280, 88, 12);
  return (
    <svg className="spark-chart" viewBox="0 0 300 110">
      <polyline points={points} />
      {data.map((item, index) => (
        <circle key={`${item.x}-${index}`} cx={12 + (index / Math.max(1, data.length - 1)) * 276} cy={98 - item.y * 76} r="4" />
      ))}
    </svg>
  );
}

function LineChart({ rows }: { rows: CsvRow[] }) {
  const grouped = groupBy(rows, "method");
  const entries = Object.entries(grouped).slice(-4);
  return (
    <svg className="line-chart" viewBox="0 0 720 360">
      <g className="grid">
        {[0, 1, 2, 3, 4].map((index) => (
          <line key={index} x1="48" x2="690" y1={50 + index * 58} y2={50 + index * 58} />
        ))}
      </g>
      {entries.map(([method, methodRows], index) => {
        const data = methodRows.slice(0, 12).map((row, rowIndex) => ({
          x: numeric(row, ["step"], rowIndex),
          y: numeric(row, ["sufficiency_mean", "passport_ready_rate"])
        }));
        return (
          <g key={method} className={`line-series series-${index}`}>
            <polyline points={makePolyline(data, 620, 250, 50)} />
            <text x="58" y={22 + index * 16}>{method}</text>
          </g>
        );
      })}
    </svg>
  );
}

function VerticalBars({ rows, labelKeys, valueKeys }: { rows: CsvRow[]; labelKeys: string[]; valueKeys: string[] }) {
  const sliced = rows.slice(0, 6);
  const values = sliced.map((row) => numeric(row, valueKeys));
  const max = Math.max(1, ...values);
  return (
    <div className="vertical-bars">
      {sliced.map((row, index) => {
        const value = numeric(row, valueKeys);
        const label = firstText(row, labelKeys) || `#${index + 1}`;
        return (
          <div key={`${label}-${index}`} className="vbar">
            <div>
              <i style={{ height: `${Math.max(8, (value / max) * 100)}%` }} />
            </div>
            <span>{label}</span>
            <b>{value > 1 ? Math.round(value) : pct(value)}</b>
          </div>
        );
      })}
    </div>
  );
}

function RadarMini({ rows }: { rows: CsvRow[] }) {
  const teamRows = rows.filter((row) => /Team-I/.test(row.method ?? "")).slice(0, 6);
  const points = teamRows.map((row, index) => {
    const angle = (index / Math.max(1, teamRows.length)) * Math.PI * 2 - Math.PI / 2;
    const value = numeric(row, ["score"]) / 100;
    const x = 80 + Math.cos(angle) * 62 * value;
    const y = 68 + Math.sin(angle) * 52 * value;
    return `${x},${y}`;
  });
  return (
    <svg className="radar-mini" viewBox="0 0 160 135">
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={Array.from({ length: 6 })
            .map((_, index) => {
              const angle = (index / 6) * Math.PI * 2 - Math.PI / 2;
              return `${80 + Math.cos(angle) * 62 * scale},${68 + Math.sin(angle) * 52 * scale}`;
            })
            .join(" ")}
        />
      ))}
      <polyline points={`${points.join(" ")} ${points[0] ?? ""}`} />
      {points.map((point) => {
        const [x, y] = point.split(",");
        return <circle key={point} cx={x} cy={y} r="4" />;
      })}
    </svg>
  );
}

function ThiefIcon() {
  return (
    <div className="small-thief">
      <span />
      <i />
    </div>
  );
}

function numeric(row: CsvRow, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const raw = row[key];
    if (raw !== undefined && raw !== "") {
      const parsed = Number.parseFloat(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function safeRatio(value: unknown, fallback = 0.5): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(1, parsed));
}

function firstText(row: CsvRow, keys: string[]): string {
  for (const key of keys) {
    if (row[key]) return row[key];
  }
  return "";
}

function groupBy(rows: CsvRow[], key: string): Record<string, CsvRow[]> {
  return rows.reduce<Record<string, CsvRow[]>>((acc, row) => {
    const group = row[key] || "default";
    acc[group] = acc[group] ?? [];
    acc[group].push(row);
    return acc;
  }, {});
}

function makePolyline(data: Array<{ x: number; y: number }>, width: number, height: number, padding: number): string {
  if (!data.length) return "";
  const maxX = Math.max(...data.map((item) => item.x), 1);
  return data
    .map((item, index) => {
      const x = padding + ((Number.isFinite(item.x) ? item.x : index) / maxX) * width;
      const y = padding + height - Math.max(0, Math.min(1, item.y)) * height;
      return `${x},${y}`;
    })
    .join(" ");
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function pct(value: number | undefined): string {
  return `${Math.round(Math.max(0, Math.min(1, value ?? 0)) * 100)}%`;
}

function compactLabel(label: string): string {
  return label.length > 11 ? `${label.slice(0, 9)}…` : label;
}

export default App;
