import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { AuditCase, Passport, RouteInfo, WorldData } from "./types";
import { getActionDescription, getActionLabel, getCaseDisplayScore, getCasePattern, getCaseTitle, loadWorldData } from "./data";

type PassportState = "未就绪" | "构建中" | "可复核";

interface LifecycleStage {
  id: string;
  no: number;
  title: string;
  shortTitle: string;
  place: string;
  icon: string;
  x: number;
  y: number;
  color: string;
  risk: number;
  coverage: number;
  passportState: PassportState;
  orderState: string;
  thiefState: string;
  story: string;
  visibleData: string[];
  tags: string[];
  techPoint: string;
  nextReason: string;
  action?: string;
}

interface DataSource {
  id: string;
  label: string;
  icon: string;
  stage: number;
  x: number;
  y: number;
  color: string;
  detail: string;
}

const DASHBOARD_URL = "https://team-i-leo.github.io/team-i-openclaw-audit-dashboard-site/";

const stages: LifecycleStage[] = [
  {
    id: "entry",
    no: 1,
    title: "实时订单流接入",
    shortTitle: "订单流接入",
    place: "大促入口",
    icon: "票",
    x: 9,
    y: 65,
    color: "#5ca8ff",
    risk: 0.32,
    coverage: 0,
    passportState: "未就绪",
    orderState: "普通交易流入",
    thiefState: "混入订单流",
    story: "一笔看似正常的大促补贴订单进入平台，系统暂不下结论，只把它纳入连续审计流。",
    visibleData: ["订单 AER-001", "场景：大促补贴", "初始风险：可观察"],
    tags: ["订单主表", "促销窗口", "补贴券"],
    techPoint: "实时订单流接入让连续审计从交易发生时开始，不等事后抽样。",
    nextReason: "单看订单无法判断团伙骗补，需要绑定支付、物流、退款、设备、IP 与补贴数据。"
  },
  {
    id: "sources",
    no: 2,
    title: "多源异构数据融合",
    shortTitle: "多源异构融合",
    place: "多源地层",
    icon: "源",
    x: 23,
    y: 53,
    color: "#35c8ff",
    risk: 0.46,
    coverage: 0.32,
    passportState: "未就绪",
    orderState: "证据网络形成",
    thiefState: "被数据标记",
    story: "支付、退款、物流、评论、设备、IP、补贴和外部特征汇入同一笔订单，孤立交易被融合成可追踪的异构证据对象。",
    visibleData: ["订单/支付/退款", "物流/评论/设备", "IP/补贴/外部特征"],
    tags: ["支付路径", "物流轨迹", "设备指纹", "IP 画像", "补贴台账"],
    techPoint: "多源异构数据融合把订单从单点记录扩展为业务证据网络。",
    nextReason: "数据接入后需要让异常组合显影，识别哪些信号真正可疑。",
    action: "expand_infra_graph"
  },
  {
    id: "signals",
    no: 3,
    title: "多维风险信号发现",
    shortTitle: "风险信号发现",
    place: "风险显影镜",
    icon: "警",
    x: 37,
    y: 60,
    color: "#ff8a4c",
    risk: 0.68,
    coverage: 0.48,
    passportState: "未就绪",
    orderState: "可疑信号出现",
    thiefState: "伪装开始失效",
    story: "多维异常同时亮起：设备复用、IP 聚集、支付集中、快速退款和补贴资格重复。",
    visibleData: ["3 台设备连接多账号", "少量 IP 承载多笔订单", "下单后快速退款"],
    tags: ["设备复用", "IP 聚集", "支付集中", "快速退款", "补贴重复"],
    techPoint: "多维风险信号发现同时观察统计、关系、时序和语义异常，不依赖单条规则一刀切。",
    nextReason: "信号只是线索，需要进入模式库判断它像哪一种已知黑灰产结构。",
    action: "analyze_behavior_sequence"
  },
  {
    id: "pattern",
    no: 4,
    title: "风险模式库匹配",
    shortTitle: "模式库匹配",
    place: "风险档案馆",
    icon: "库",
    x: 51,
    y: 47,
    color: "#f3c94f",
    risk: 0.78,
    coverage: 0.6,
    passportState: "构建中",
    orderState: "命中团伙骗补模式",
    thiefState: "被模式库识别",
    story: "订单与 EC-SKIM-001 团伙刷单骗补高度相似，但物流真实性和反证解释仍未补齐。",
    visibleData: ["命中：多账号共享设备", "命中：IP 与支付集中", "待追：物流真实性/反证解释"],
    tags: ["EC-SKIM-001", "设备共享", "支付集中", "物流待追", "反证待查"],
    techPoint: "模式库给出风险方向，同时暴露证据缺口。",
    nextReason: "不能靠相似度直接结案，下一步由 Agent 决定缺什么证据就追什么。",
    action: "search_historical_cases"
  },
  {
    id: "agent",
    no: 5,
    title: "Agent 主动追证",
    shortTitle: "Agent追证",
    place: "太阳追证台",
    icon: "光",
    x: 65,
    y: 55,
    color: "#ffdc62",
    risk: 0.86,
    coverage: 0.78,
    passportState: "构建中",
    orderState: "证据缺口被补齐",
    thiefState: "被光束锁定",
    story: "Agent 太阳按证据缺口依次追问支付簇、物流真实性、退款簇、补贴台账和反证解释。",
    visibleData: ["追支付簇", "追物流真实性", "追退款/补贴/反证"],
    tags: ["支付簇", "物流真实性", "退款簇", "补贴台账", "反证检索"],
    techPoint: "智能性体现在主动选择下一步取证目标，而不是只展示模型图标。",
    nextReason: "Agent 的建议需要落到可审计、可复核、可留痕的受控动作。",
    action: "seek_counter_evidence"
  },
  {
    id: "openclaw",
    no: 6,
    title: "OpenCLAW 受控动作",
    shortTitle: "OpenCLAW动作",
    place: "OpenCLAW 工坊",
    icon: "工",
    x: 76,
    y: 66,
    color: "#ad8cff",
    risk: 0.91,
    coverage: 0.9,
    passportState: "构建中",
    orderState: "支持证据与反证入库",
    thiefState: "被证据线缠绕",
    story: "Agent 选中的动作进入 OpenCLAW 受控工具注册表，查询支付簇、物流轨迹和补贴台账，观察结果写入证据。",
    visibleData: ["query_payment_cluster", "query_logistics_trace", "query_subsidy_ledger"],
    tags: ["动作边界", "参数约束", "结果留痕", "证据来源"],
    techPoint: "OpenCLAW 把 Agent 建议变成有边界、有参数、有日志的受控动作。",
    nextReason: "所有支持证据、反证和不确定性需要装订成可以交付的证据护照。",
    action: "query_payment_cluster"
  },
  {
    id: "passport",
    no: 7,
    title: "证据护照与风险分类",
    shortTitle: "证据护照",
    place: "证据护照闸门",
    icon: "章",
    x: 88,
    y: 64,
    color: "#67df91",
    risk: 0.94,
    coverage: 1,
    passportState: "可复核",
    orderState: "高风险，可复核",
    thiefState: "被拦截归档",
    story: "支持证据、反证和不确定性被装订成证据护照，案件进入风险看板和人工复核。",
    visibleData: ["风险分类：高风险", "证据覆盖：100%", "输出：证据护照 + 人工复核"],
    tags: ["支持证据", "反证已检索", "不确定性", "人工门禁", "可复核"],
    techPoint: "最终输出不是一句高风险，而是可解释、可复核、可交付的审计底稿。",
    nextReason: "人工确认后沉淀到模式库、案例记忆和策略权重，强化下一次审计。",
    action: "emit_passport"
  }
];

const dataSources: DataSource[] = [
  { id: "order", label: "订单", icon: "票", stage: 1, x: 10, y: 34, color: "#5ca8ff", detail: "订单主表、促销窗口、SKU 与账户" },
  { id: "payment", label: "支付", icon: "卡", stage: 2, x: 21, y: 24, color: "#4eb7ff", detail: "支付工具、账户 hash、card bin" },
  { id: "refund", label: "退款", icon: "退", stage: 2, x: 31, y: 30, color: "#ff9b4a", detail: "退款比例、时效、售后路径" },
  { id: "logistics", label: "物流", icon: "车", stage: 2, x: 41, y: 23, color: "#32d8d0", detail: "揽收、签收、轨迹质量、地址关系" },
  { id: "device", label: "设备", icon: "机", stage: 2, x: 55, y: 25, color: "#b28cff", detail: "设备指纹、root、多账号复用" },
  { id: "ip", label: "IP", icon: "网", stage: 2, x: 66, y: 30, color: "#2bd8a7", detail: "代理、地理、网段与数据中心特征" },
  { id: "subsidy", label: "补贴", icon: "券", stage: 2, x: 76, y: 24, color: "#f5ca5b", detail: "资格 key、补贴金额、规则版本" },
  { id: "counter", label: "反证", icon: "证", stage: 5, x: 91, y: 43, color: "#ffcc79", detail: "同类促销峰值、自然批量履约解释" }
];

function App() {
  const [world, setWorld] = useState<WorldData | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [autoRun, setAutoRun] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadWorldData().then((data) => {
      if (mounted) setWorld(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

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
    }, 2200);
    return () => window.clearInterval(timer);
  }, [autoRun]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault();
        stepBy(1);
      }
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        stepBy(-1);
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setDetailOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const selectedCase = useMemo(() => {
    return world?.cases.find((item) => item.case_id === "AER-001") ?? world?.cases[0];
  }, [world]);

  const route = selectedCase ? world?.routes[selectedCase.case_id] : undefined;
  const passport = selectedCase ? world?.passports[selectedCase.case_id] : undefined;
  const currentStage = stages[stageIndex];

  const stepBy = (delta: number) => {
    setStageIndex((current) => Math.max(0, Math.min(stages.length - 1, current + delta)));
    setDetailOpen(false);
    setMemoryOpen(false);
    setAutoRun(false);
  };

  const goToStage = (index: number) => {
    setStageIndex(index);
    setDetailOpen(true);
    setMemoryOpen(false);
    setAutoRun(false);
  };

  if (!world || !selectedCase) {
    return (
      <main className="audit-game loading-screen">
        <section className="pixel-panel loading-card">
          <div className="loading-gem" />
          <h1>Team-I 主动追证剧场</h1>
          <p>正在装载订单生命周期、证据网络和受控取证节点。</p>
        </section>
      </main>
    );
  }

  return (
    <main className="audit-game">
      <TopHud world={world} selectedCase={selectedCase} stage={currentStage} />

      <section className="main-stage" aria-label="订单生命周期主动追证地图">
        <GameWorld
          stageIndex={stageIndex}
          selectedCase={selectedCase}
          route={route}
          passport={passport}
          onSelectStage={goToStage}
          onOpenMemory={() => setMemoryOpen(true)}
        />
        <CurrentStagePanel stage={currentStage} route={route} passport={passport} selectedCase={selectedCase} />
      </section>

      <ControlBar
        stageIndex={stageIndex}
        autoRun={autoRun}
        setAutoRun={setAutoRun}
        stepBy={stepBy}
        reset={() => {
          setStageIndex(0);
          setDetailOpen(false);
          setMemoryOpen(false);
          setAutoRun(false);
        }}
        openDetail={() => setDetailOpen(true)}
      />

      {detailOpen ? (
        <StageModal
          stage={currentStage}
          selectedCase={selectedCase}
          route={route}
          passport={passport}
          close={() => setDetailOpen(false)}
        />
      ) : null}
      {memoryOpen ? <MemoryModal close={() => setMemoryOpen(false)} /> : null}
    </main>
  );
}

function TopHud({ world, selectedCase, stage }: { world: WorldData; selectedCase: AuditCase; stage: LifecycleStage }) {
  const evidenceCount = selectedCase.evidence?.length ?? world.dashboard.evidence_count;
  return (
    <header className="top-hud">
      <div className="brand">
        <div className="team-mark">T-I</div>
        <div>
          <h1>Team-I 主动追证剧场</h1>
          <p>一笔订单穿越风控系统：数据附着、模式匹配、Agent 追证、受控取证、证据护照</p>
        </div>
      </div>
      <div className="hud-board" aria-label="全局状态">
        <HudMetric label="当前订单" value="AER-001" icon="票" />
        <HudMetric label="当前阶段" value={`${stage.no}/7`} icon="路" />
        <HudMetric label="风险分" value={stage.risk.toFixed(2)} icon="险" accent="danger" />
        <HudMetric label="证据覆盖" value={pct(stage.coverage)} icon="证" accent="safe" />
        <HudMetric label="护照状态" value={stage.passportState} icon="章" accent={stage.passportState === "可复核" ? "safe" : "gold"} />
        <HudMetric label="证据条目" value={evidenceCount} icon="卷" />
        <HudMetric label="风险模式" value={getCasePattern(selectedCase)} icon="库" />
        <HudMetric label="主线状态" value={stage.no === 7 ? "已拦截" : "追证中"} icon="光" accent={stage.no === 7 ? "safe" : "gold"} />
      </div>
    </header>
  );
}

function HudMetric({ label, value, icon, accent }: { label: string; value: string | number; icon: string; accent?: "danger" | "safe" | "gold" }) {
  return (
    <div className={`hud-metric ${accent ?? ""}`}>
      <span>{icon}</span>
      <b>{value}</b>
      <small>{label}</small>
    </div>
  );
}

function GameWorld({
  stageIndex,
  selectedCase,
  route,
  passport,
  onSelectStage,
  onOpenMemory
}: {
  stageIndex: number;
  selectedCase: AuditCase;
  route?: RouteInfo;
  passport?: Passport;
  onSelectStage: (index: number) => void;
  onOpenMemory: () => void;
}) {
  const stage = stages[stageIndex];
  const caught = stage.no === 7;
  return (
    <section className="world pixel-panel">
      <div className="sky-layer" />
      <div className="sun-halo" />
      <div className="city-layer city-back" />
      <div className="city-layer city-front" />
      <div className="ground-ribbon" />

      <ScrollBanner />
      <AgentSun active={stage.no >= 5} target={stage.shortTitle} />
      <DataSourceLayer stage={stage} />

      <svg className="route-svg" viewBox="0 0 1000 470" preserveAspectRatio="none" aria-hidden="true">
        <path
          className="route-shadow"
          d="M 64 320 C 145 265, 210 264, 278 238 S 408 245, 500 194 S 655 216, 770 277 S 890 245, 956 190"
        />
        <path
          className="route-main"
          d="M 64 320 C 145 265, 210 264, 278 238 S 408 245, 500 194 S 655 216, 770 277 S 890 245, 956 190"
        />
      </svg>

      {stages.map((item, index) => (
        <StageGate
          key={item.id}
          stage={item}
          active={index === stageIndex}
          passed={index < stageIndex}
          onClick={() => onSelectStage(index)}
        />
      ))}

      <OrderSprite stage={stage} passport={passport} />
      <ThiefSprite stage={stage} caught={caught} />
      <EvidenceFragments stage={stage} route={route} />
      <FinalGate active={stage.no === 7} selectedCase={selectedCase} />
      <MemoryArchive active={stage.no === 7} onOpen={onOpenMemory} />
      <LifecycleTelemetry stage={stage} route={route} />
    </section>
  );
}

function ScrollBanner() {
  return (
    <div className="scroll-banner">
      <span />
      <div>
        <h2>订单生命周期主动追证</h2>
        <p>跟随 AER-001 从普通大促交易走到可复核风险案件</p>
      </div>
      <span />
    </div>
  );
}

function AgentSun({ active, target }: { active: boolean; target: string }) {
  return (
    <div className={`agent-sun ${active ? "active" : ""}`} aria-label="Agent 主动追证太阳">
      <i className="ray ray-one" />
      <i className="ray ray-two" />
      <i className="ray ray-three" />
      <div className="sun-face">
        <span className="eye left" />
        <span className="eye right" />
        <span className="mouth" />
      </div>
      <strong>Agent 主动追证</strong>
      <small>{active ? `锁定：${target}` : "等待证据缺口"}</small>
    </div>
  );
}

function DataSourceLayer({ stage }: { stage: LifecycleStage }) {
  const orderX = stage.x * 10;
  const orderY = stage.y * 4.7;
  return (
    <>
      <svg className="data-lines" viewBox="0 0 1000 470" preserveAspectRatio="none" aria-hidden="true">
        {dataSources.map((source) => {
          const active = stage.no >= source.stage;
          return (
            <path
              key={source.id}
              className={active ? "active" : ""}
              d={`M ${source.x * 10} ${source.y * 4.7} C ${(source.x * 10 + orderX) / 2} ${source.y * 4.7 - 65}, ${(source.x * 10 + orderX) / 2} ${orderY - 72}, ${orderX} ${orderY}`}
              style={{ "--source-color": source.color } as CSSProperties}
            />
          );
        })}
      </svg>
      {dataSources.map((source) => {
        const active = stage.no >= source.stage;
        return (
          <div
            key={source.id}
            className={`data-chip ${active ? "active" : ""}`}
            style={{ left: `${source.x}%`, top: `${source.y}%`, "--source-color": source.color } as CSSProperties}
            title={source.detail}
          >
            <b>{source.icon}</b>
            <span>{source.label}</span>
          </div>
        );
      })}
    </>
  );
}

function StageGate({ stage, active, passed, onClick }: { stage: LifecycleStage; active: boolean; passed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`stage-gate ${active ? "active" : ""} ${passed ? "passed" : ""}`}
      style={{ left: `${stage.x}%`, top: `${stage.y}%`, "--stage-color": stage.color } as CSSProperties}
      onClick={onClick}
      aria-label={`查看 ${stage.title}`}
    >
      <i>{stage.icon}</i>
      <span>{stage.no}</span>
      <b>{stage.shortTitle}</b>
    </button>
  );
}

function OrderSprite({ stage, passport }: { stage: LifecycleStage; passport?: Passport }) {
  const style = {
    left: stage.no === 7 ? `calc(${stage.x}% - 28px)` : `calc(${stage.x}% + 4px)`,
    top: stage.no === 7 ? `calc(${stage.y}% + 58px)` : `calc(${stage.y}% + 34px)`
  } as CSSProperties;
  return (
    <div className={`order-sprite stage-${stage.no}`} style={style} aria-label="可疑订单">
      <div className="order-paper">
        <b>{stage.no === 7 ? "PASS" : "ORD"}</b>
        <span>{stage.no === 7 ? pct(passport?.sufficiency_score ?? 0.9) : "AER-001"}</span>
      </div>
      {stage.no >= 2 ? <span className="order-tag tag-a">支付</span> : null}
      {stage.no >= 2 ? <span className="order-tag tag-b">物流</span> : null}
      {stage.no >= 3 ? <span className="order-tag tag-c">退款</span> : null}
      {stage.no >= 4 ? <span className="order-tag tag-d">补贴</span> : null}
    </div>
  );
}

function ThiefSprite({ stage, caught }: { stage: LifecycleStage; caught: boolean }) {
  const style = {
    left: stage.no === 7 ? `calc(${stage.x}% - 105px)` : `calc(${stage.x}% - 52px)`,
    top: stage.no === 7 ? `calc(${stage.y}% - 34px)` : `calc(${stage.y}% - 78px)`
  } as CSSProperties;
  return (
    <div className={`thief-wrap ${caught ? "caught" : ""}`} style={style} aria-label="黑灰产小偷">
      <div className="speech">{caught ? "证据闭环，跑不掉了！" : stage.no >= 5 ? "糟糕，被锁定了！" : "伪装成正常订单..."}</div>
      <div className="thief">
        <span className="hat" />
        <span className="head" />
        <span className="mask" />
        <span className="body" />
        <span className="bag" />
        <span className="arm left" />
        <span className="arm right" />
        <span className="leg left" />
        <span className="leg right" />
      </div>
      <span className="dust one" />
      <span className="dust two" />
    </div>
  );
}

function EvidenceFragments({ stage, route }: { stage: LifecycleStage; route?: RouteInfo }) {
  if (stage.no < 3) return null;
  const covered = route?.coverage.covered ?? ["统计异常", "关系扩展", "物流校验", "资金链", "反证", "护照"];
  const visible = covered.slice(0, Math.min(covered.length, Math.max(2, stage.no)));
  return (
    <div className="evidence-fragments" aria-label="证据碎片">
      {visible.map((item, index) => (
        <span key={item} style={{ "--delay": `${index * 0.12}s` } as CSSProperties}>
          {item}
        </span>
      ))}
    </div>
  );
}

function FinalGate({ active, selectedCase }: { active: boolean; selectedCase: AuditCase }) {
  return (
    <div className={`final-gate ${active ? "active" : ""}`}>
      <div className="passport-book">
        <b>证据护照</b>
        <strong>{active ? "可复核" : "构建中"}</strong>
        <span>{getCasePattern(selectedCase)}</span>
      </div>
      <a href={DASHBOARD_URL} target="_blank" rel="noreferrer">
        查看风险看板
      </a>
    </div>
  );
}

function MemoryArchive({ active, onOpen }: { active: boolean; onOpen: () => void }) {
  if (!active) return null;
  return (
    <button type="button" className="memory-archive" onClick={onOpen} aria-label="打开记忆沉淀">
      <span className="memory-ray one" />
      <span className="memory-ray two" />
      <span className="memory-ray three" />
      <i>库</i>
      <b>记忆沉淀</b>
      <small>模式 · 案例 · 策略</small>
    </button>
  );
}

function LifecycleTelemetry({ stage, route }: { stage: LifecycleStage; route?: RouteInfo }) {
  const action = stage.action ?? route?.ranked_actions[0]?.action;
  const sourceText =
    stage.no >= 2 ? "订单 / 支付 / 退款 / 物流 / 评论 / 设备 / IP / 补贴" : "订单主表 / 促销窗口 / SKU / 账户";
  const evidenceText =
    stage.no >= 7 ? "支持证据 + 反证 + 不确定性已装订" : stage.no >= 5 ? "证据缺口正在补齐" : "等待风险信号收敛";
  const outputText = stage.no >= 7 ? "风险看板 + 人工复核 + 模式沉淀" : stage.passportState;
  const cards = [
    { label: "数据流转", value: sourceText },
    { label: "当前风险", value: `${stage.risk.toFixed(2)} / ${stage.orderState}` },
    { label: "追证动作", value: stage.no >= 5 && action ? getActionLabel(action) : "由证据缺口驱动" },
    { label: "交付输出", value: outputText }
  ];
  return (
    <div className="telemetry-strip" aria-label="订单数据流转状态">
      {cards.map((card) => (
        <div className="telemetry-card" key={card.label}>
          <span>{card.label}</span>
          <b>{card.value}</b>
        </div>
      ))}
      <div className="telemetry-progress">
        <i style={{ width: `${Math.max(12, stage.coverage * 100)}%` }} />
        <em>{evidenceText}</em>
      </div>
    </div>
  );
}

function CurrentStagePanel({
  stage,
  route,
  passport,
  selectedCase
}: {
  stage: LifecycleStage;
  route?: RouteInfo;
  passport?: Passport;
  selectedCase: AuditCase;
}) {
  const action = stage.action ?? route?.ranked_actions[0]?.action;
  return (
    <aside className="stage-panel pixel-panel">
      <div className="stage-kicker">当前节点 {stage.no}/7</div>
      <h2>{stage.title}</h2>
      <p>{stage.story}</p>
      <div className="stage-status-grid">
        <StatusTile label="订单状态" value={stage.orderState} />
        <StatusTile label="黑灰产状态" value={stage.thiefState} />
        <StatusTile label="风险分" value={stage.risk.toFixed(2)} danger />
        <StatusTile label="证据覆盖" value={pct(stage.coverage)} safe />
      </div>
      <div className="tag-cloud">
        {stage.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="action-card">
        <b>{stage.no >= 6 ? "当前受控动作" : "下一步原因"}</b>
        <strong>{stage.no >= 6 ? getActionLabel(action) : stage.nextReason}</strong>
        <small>{stage.no >= 6 ? getActionDescription(action) : stage.techPoint}</small>
      </div>
      <div className="passport-mini">
        <span>护照充分性</span>
        <Progress value={stage.no === 7 ? passport?.sufficiency_score ?? stage.coverage : stage.coverage} />
        <b>{selectedCase.case_id} · {stage.passportState}</b>
      </div>
    </aside>
  );
}

function StatusTile({ label, value, danger, safe }: { label: string; value: string; danger?: boolean; safe?: boolean }) {
  return (
    <div className={`status-tile ${danger ? "danger" : ""} ${safe ? "safe" : ""}`}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Progress({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div className="progress">
      <i style={{ width: `${clamped * 100}%` }} />
    </div>
  );
}

function ControlBar({
  stageIndex,
  autoRun,
  setAutoRun,
  stepBy,
  reset,
  openDetail
}: {
  stageIndex: number;
  autoRun: boolean;
  setAutoRun: (value: boolean) => void;
  stepBy: (delta: number) => void;
  reset: () => void;
  openDetail: () => void;
}) {
  return (
    <footer className="control-bar">
      <div className="timeline">
        {stages.map((stage, index) => (
          <div key={stage.id} className={index <= stageIndex ? "active" : ""}>
            <span>{stage.no}</span>
            <b>{stage.shortTitle}</b>
          </div>
        ))}
      </div>
      <div className="buttons">
        <button type="button" className={autoRun ? "active" : ""} onClick={() => setAutoRun(!autoRun)}>
          {autoRun ? "暂停" : "自动播放"}
        </button>
        <button type="button" onClick={() => stepBy(-1)} disabled={stageIndex === 0}>
          上一步
        </button>
        <button type="button" onClick={() => stepBy(1)} disabled={stageIndex === stages.length - 1}>
          下一步
        </button>
        <button type="button" className="primary" onClick={openDetail}>
          打开当前节点
        </button>
        <button type="button" onClick={reset}>
          重置
        </button>
      </div>
    </footer>
  );
}

function StageModal({
  stage,
  selectedCase,
  route,
  passport,
  close
}: {
  stage: LifecycleStage;
  selectedCase: AuditCase;
  route?: RouteInfo;
  passport?: Passport;
  close: () => void;
}) {
  const action = stage.action ?? route?.ranked_actions[0]?.action;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="stage-modal-title">
      <section className="stage-modal pixel-panel">
        <button type="button" className="close-button" onClick={close} aria-label="关闭节点详情">
          ×
        </button>
        <header>
          <span>第 {stage.no} 站 · {stage.place}</span>
          <h2 id="stage-modal-title">{stage.title}</h2>
          <p>{stage.story}</p>
        </header>
        <div className="modal-grid">
          <div className="modal-section">
            <h3>这一站看到的数据</h3>
            <ul>
              {stage.visibleData.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="modal-section">
            <h3>为什么进入下一步</h3>
            <p>{stage.nextReason}</p>
          </div>
          <div className="modal-section">
            <h3>当前技术点</h3>
            <p>{stage.techPoint}</p>
          </div>
          <div className="modal-visual">
            <div className="mini-bars">
              <MiniBar label="风险分" value={stage.risk} danger />
              <MiniBar label="证据覆盖" value={stage.coverage} />
              <MiniBar label="护照充分性" value={stage.no === 7 ? passport?.sufficiency_score ?? 0.9 : stage.coverage} />
            </div>
            <div className="modal-action">
              <span>{stage.no >= 6 ? "OpenCLAW 动作" : "追证动作"}</span>
              <b>{getActionLabel(action)}</b>
              <small>{getCaseTitle(selectedCase)} · {getCasePattern(selectedCase)}</small>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MemoryModal({ close }: { close: () => void }) {
  const deposits = [
    { title: "risk_pattern", text: "EC-SKIM-001 模式权重增强，团伙刷单骗补特征进入可复用风险模式。" },
    { title: "case_memory", text: "AER-001 作为可复核历史案例入库，保留证据护照、反证和人工复核结论。" },
    { title: "policy_action_weight", text: "下次类似案件优先触发支付簇、物流真实性、反证检索等追证动作。" }
  ];
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="memory-modal-title">
      <section className="memory-modal pixel-panel">
        <button type="button" className="close-button" onClick={close} aria-label="关闭记忆沉淀">
          ×
        </button>
        <header>
          <span>人工复核通过</span>
          <h2 id="memory-modal-title">记忆沉淀增强系统</h2>
          <p>证据护照盖章后，系统把本次追证经验写回模式库、案例记忆和策略权重。</p>
        </header>
        <div className="memory-deposit-grid">
          {deposits.map((item) => (
            <div key={item.title}>
              <b>{item.title}</b>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MiniBar({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className={`mini-bar ${danger ? "danger" : ""}`}>
      <span>{label}</span>
      <Progress value={value} />
      <b>{value > 1 ? value : danger ? value.toFixed(2) : pct(value)}</b>
    </div>
  );
}

function pct(value: number | undefined): string {
  return `${Math.round(Math.max(0, Math.min(1, value ?? 0)) * 100)}%`;
}

export default App;
