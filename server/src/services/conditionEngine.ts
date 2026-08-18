import { Conditions, Condition } from "../types/blockly";

export type TradeOutcome = "won" | "lost" | "unknown";

export type ConditionEngineContext = {
  nowMs?: number;
  latestTick?: Record<string, unknown> | null;
  currentTradeActive?: boolean;
  currentTradeOutcome?: TradeOutcome | null;
  currentRepeatRun?: number;
  totalRepeatRuns?: number;
  currentRunStake?: number;
  sessionStakeBudget?: number;
  sessionLossSpent?: number;
  sessionLossThreshold?: number;
  sessionProfitSpent?: number;
  tradeStartedAtMs?: number | null;
  contractActivatedAtMs?: number | null;
};

export type ConditionEvaluation = {
  scope: "entry" | "exit" | "management" | "text" | "time" | "list" | "variable" | "logic" | "math" | "notification";
  type: string;
  satisfied: boolean;
  blocking: boolean;
  label: string;
  detail: string;
  evaluatedAtMs: number;
  lastTickTimeMs: number | null;
  lastTickPrice: number | null;
  warning?: string;
  value?: string | number | boolean;
  value2?: string | number | boolean;
};

export type ConditionEngineReport = {
  ready: boolean;
  entrySatisfied: boolean;
  exitSatisfied: boolean;
  activeRules: number;
  satisfiedRules: number;
  pendingRules: number;
  warnings: string[];
  notes: string[];
  concurrentTriggers: string[];
  blockedBy: ConditionEvaluation[];
  listState: Record<string, unknown[]>;
  listResults: Record<string, unknown>;
  textResults: Record<string, unknown>;
  timeResults: Record<string, unknown>;
  variableState: Record<string, unknown>;
  ruleResults: ConditionEvaluation[];
};

type RuleState = {
  snapshot: StrategySnapshotLike | null;
  latestTick: Record<string, unknown> | null;
  nowMs: number;
  currentTradeActive: boolean;
  currentTradeOutcome: TradeOutcome | null;
  currentRepeatRun: number;
  totalRepeatRuns: number;
  currentRunStake: number;
  sessionStakeBudget: number;
  sessionLossSpent: number;
  sessionLossThreshold: number;
  sessionProfitSpent: number;
  tradeStartedAtMs: number | null;
  contractActivatedAtMs: number | null;
  tickCount: number;
};

type StrategySnapshotLike = {
  conditions?: Record<string, unknown> | null;
};

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toBooleanValue(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
}

function parseTimeOfDay(value: string): number | null {
  const match = String(value ?? "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function getTickPrice(source: Record<string, unknown> | null): number | null {
  if (!source) return null;
  const candidate = source.price ?? source.quote ?? source.value ?? source.close ?? source.tick_price;
  const parsed = Number(candidate);
  return Number.isFinite(parsed) ? parsed : null;
}

function getTickTime(source: Record<string, unknown> | null, fallback = Date.now()): number {
  if (!source) return fallback;
  const epochMs = Number(source.epoch_ms ?? source.timestamp_ms ?? source.time_ms);
  if (Number.isFinite(epochMs)) return epochMs;
  const epoch = Number(source.epoch ?? source.timestamp ?? source.time);
  if (Number.isFinite(epoch)) {
    return epoch < 10_000_000_000 ? epoch * 1000 : epoch;
  }
  return fallback;
}

function cloneRecord<T extends Record<string, unknown>>(value: T): T {
  return { ...value };
}

function resolveConditionLabel(condition: string, prefix: string): string {
  const normalized = String(condition ?? "").trim().toUpperCase();
  switch (normalized) {
    case "PRICE_BETWEEN":
      return `${prefix} Price Between`;
    case "PRICE_GT":
      return `${prefix} Price Above`;
    case "PRICE_LT":
      return `${prefix} Price Below`;
    case "CURRENT_TICK":
      return `${prefix} Current Tick`;
    case "TICK_COUNT":
      return `${prefix} Tick Count`;
    case "HAS_POSITION":
      return `${prefix} Has Position`;
    case "NO_POSITION":
      return `${prefix} No Position`;
    case "LOSS_THRESHOLD":
      return `${prefix} Loss Threshold`;
    case "PROFIT_THRESHOLD":
      return `${prefix} Profit Threshold`;
    case "TIME_OF_DAY":
      return `${prefix} Time Of Day`;
    case "DURATION_ELAPSED":
      return `${prefix} Duration Elapsed`;
    case "STOP_LOSS_HIT":
      return `${prefix} Stop Loss Hit`;
    case "TAKE_PROFIT_HIT":
      return `${prefix} Take Profit Hit`;
    case "ALWAYS":
      return `${prefix} Always`;
    default:
      return `${prefix} ${normalized || "Condition"}`;
  }
}

function getConditionValue(condition: Condition | null | undefined, key: "value" | "value2"): string {
  return toStringValue(condition?.[key], "");
}

function requiresValue(type: string): boolean {
  const normalized = String(type ?? "").trim().toUpperCase();
  return !new Set(["ALWAYS", "HAS_POSITION", "NO_POSITION", "STOP_LOSS_HIT", "TAKE_PROFIT_HIT"]).has(normalized);
}

function evaluateCondition(
  condition: Condition | null | undefined,
  state: RuleState,
  scope: "entry" | "exit",
): ConditionEvaluation | null {
  if (!condition) return null;

  const type = String(condition.type ?? "").trim().toUpperCase();
    if (!type) {
      return {
        scope,
        type: "",
        satisfied: false,
        blocking: true,
        label: resolveConditionLabel("CONDITION", scope === "entry" ? "Entry" : "Exit"),
        detail: "Condition type is missing.",
        evaluatedAtMs: state.nowMs,
        lastTickTimeMs: getTickTime(state.latestTick, state.nowMs),
        lastTickPrice: getTickPrice(state.latestTick),
        warning: "Condition type is missing.",
      };
    }

  const prefix = scope === "entry" ? "Entry" : "Exit";
  const label = resolveConditionLabel(type, prefix);
  const value = getConditionValue(condition, "value");
  const value2 = getConditionValue(condition, "value2");
  const currentPrice = getTickPrice(state.latestTick);
  const currentTickTime = getTickTime(state.latestTick, state.nowMs);
  const currentTime = new Date(currentTickTime);
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const tradeElapsedMs = state.tradeStartedAtMs == null ? 0 : Math.max(0, state.nowMs - state.tradeStartedAtMs);
  const activationElapsedMs = state.contractActivatedAtMs == null ? tradeElapsedMs : Math.max(0, state.nowMs - state.contractActivatedAtMs);
  const sessionLossLimit = Number.isFinite(state.sessionLossThreshold) ? state.sessionLossThreshold : Number.POSITIVE_INFINITY;
  const sessionLossRemaining = Number.isFinite(sessionLossLimit) ? Math.max(0, sessionLossLimit - state.sessionLossSpent) : Number.POSITIVE_INFINITY;
  const sessionProfitTarget = Math.max(0, state.sessionStakeBudget || state.currentRunStake || 0);

  let satisfied = false;
  let detail = "";
  let warning: string | undefined;

  switch (type) {
    case "ALWAYS":
      satisfied = true;
      detail = "Always satisfied.";
      break;
    case "HAS_POSITION":
      satisfied = state.currentTradeActive;
      detail = state.currentTradeActive ? "A trade is currently open." : "No active trade.";
      break;
    case "NO_POSITION":
      satisfied = !state.currentTradeActive;
      detail = state.currentTradeActive ? "A trade is currently open." : "No active trade.";
      break;
    case "PRICE_GT": {
      const target = Number(value);
      satisfied = currentPrice != null && Number.isFinite(target) ? currentPrice > target : false;
      detail = currentPrice == null
        ? "No live price is available yet."
        : `Current price ${currentPrice} ${satisfied ? "exceeds" : "does not exceed"} ${target}.`;
      break;
    }
    case "PRICE_LT": {
      const target = Number(value);
      satisfied = currentPrice != null && Number.isFinite(target) ? currentPrice < target : false;
      detail = currentPrice == null
        ? "No live price is available yet."
        : `Current price ${currentPrice} ${satisfied ? "is below" : "is not below"} ${target}.`;
      break;
    }
    case "PRICE_BETWEEN": {
      const low = Number(value);
      const high = Number(value2);
      satisfied = currentPrice != null && Number.isFinite(low) && Number.isFinite(high) && low < high
        ? currentPrice >= low && currentPrice <= high
        : false;
      detail = currentPrice == null
        ? "No live price is available yet."
        : `Current price ${currentPrice} ${satisfied ? "is within" : "is outside"} the range ${low} to ${high}.`;
      break;
    }
    case "CURRENT_TICK": {
      const target = Number(value);
      satisfied = currentPrice != null && Number.isFinite(target) ? currentPrice === target : false;
      detail = currentPrice == null
        ? "No live price is available yet."
        : `Current price ${currentPrice} ${satisfied ? "matches" : "does not match"} ${target}.`;
      break;
    }
    case "TICK_COUNT": {
      const target = Math.max(0, Math.floor(Number(value) || 0));
      satisfied = state.tickCount >= target;
      detail = `Tick count ${state.tickCount} ${satisfied ? "reached" : "has not reached"} ${target}.`;
      break;
    }
    case "LOSS_THRESHOLD": {
      const target = Number(value);
      satisfied = Number.isFinite(target) ? state.sessionLossSpent >= target : false;
      detail = `Loss spent ${state.sessionLossSpent.toFixed(2)} ${satisfied ? "reached" : "has not reached"} ${Number.isFinite(target) ? target : 0}.`;
      break;
    }
    case "PROFIT_THRESHOLD": {
      const target = Number(value);
      satisfied = Number.isFinite(target) ? state.sessionProfitSpent >= target : false;
      detail = `Profit spent ${state.sessionProfitSpent.toFixed(2)} ${satisfied ? "reached" : "has not reached"} ${Number.isFinite(target) ? target : 0}.`;
      break;
    }
    case "TIME_OF_DAY": {
      const targetMinutes = parseTimeOfDay(value);
      satisfied = targetMinutes != null ? currentMinutes >= targetMinutes : false;
      detail = targetMinutes == null
        ? "Time must be in HH:MM format."
        : `Current local time ${currentTime.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit" })} ${satisfied ? "has reached" : "has not reached"} ${value}.`;
      if (targetMinutes == null) {
        warning = `${label} requires a valid HH:MM value.`;
      }
      break;
    }
    case "DURATION_ELAPSED": {
      const target = Math.max(0, Number(value) || 0);
      satisfied = activationElapsedMs >= target * 1000;
      detail = `Elapsed time ${Math.floor(activationElapsedMs / 1000)}s ${satisfied ? "reached" : "has not reached"} ${target}s.`;
      break;
    }
    case "STOP_LOSS_HIT": {
      satisfied = state.sessionLossSpent >= sessionLossLimit;
      detail = `Loss spent ${state.sessionLossSpent.toFixed(2)} ${satisfied ? "hit" : "is below"} the stop threshold ${sessionLossLimit}.`;
      break;
    }
    case "TAKE_PROFIT_HIT": {
      satisfied = state.sessionProfitSpent >= sessionProfitTarget;
      detail = `Profit spent ${state.sessionProfitSpent.toFixed(2)} ${satisfied ? "hit" : "is below"} the target ${sessionProfitTarget}.`;
      break;
    }
    default:
      warning = `${label} is not fully supported by the live engine yet.`;
      detail = "The rule was recorded but not fully executable.";
      satisfied = false;
      break;
  }

  if (requiresValue(type)) {
    if ((value === "" || value == null) && type !== "ALWAYS") {
      warning = warning ?? `${label} needs a value to evaluate.`;
    }
  }

  return {
    scope,
    type,
    satisfied,
    blocking: scope === "entry",
    label,
    detail,
    evaluatedAtMs: state.nowMs,
    lastTickTimeMs: currentTickTime,
    lastTickPrice: currentPrice,
    warning,
    value: value || undefined,
    value2: value2 || undefined,
  };
}

function normalizeListValue(value: unknown): unknown {
  if (typeof value === "number" || typeof value === "boolean") return value;
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (text === "true") return true;
  if (text === "false") return false;
  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : text;
}

function listNameFrom(block: Record<string, unknown>): string {
  return toStringValue(block.LIST_NAME, "myList") || "myList";
}

function textValueFrom(block: Record<string, unknown>, key: string): string {
  return toStringValue(block[key], "");
}

function timeToMs(duration: number, unit: string): number {
  const value = Math.max(0, Number(duration) || 0);
  const normalized = String(unit ?? "SECONDS").trim().toUpperCase();
  switch (normalized) {
    case "MINUTES":
      return value * 60_000;
    case "HOURS":
      return value * 3_600_000;
    case "DAYS":
      return value * 86_400_000;
    case "WEEKS":
      return value * 604_800_000;
    case "MONTHS":
      return value * 2_592_000_000;
    case "SECONDS":
    default:
      return value * 1_000;
  }
}

function createEmptyReport(): ConditionEngineReport {
  return {
    ready: false,
    entrySatisfied: false,
    exitSatisfied: false,
    activeRules: 0,
    satisfiedRules: 0,
    pendingRules: 0,
    warnings: [],
    notes: [],
    concurrentTriggers: [],
    blockedBy: [],
    listState: {},
    listResults: {},
    textResults: {},
    timeResults: {},
    variableState: {},
    ruleResults: [],
  };
}

export class ConditionRuntimeEngine {
  private snapshot: StrategySnapshotLike | null = null;
  private latestTick: Record<string, unknown> | null = null;
  private nowMs = Date.now();
  private currentTradeActive = false;
  private currentTradeOutcome: TradeOutcome | null = null;
  private currentRepeatRun = 1;
  private totalRepeatRuns = 1;
  private currentRunStake = 0;
  private sessionStakeBudget = 0;
  private sessionLossSpent = 0;
  private sessionLossThreshold = Number.POSITIVE_INFINITY;
  private sessionProfitSpent = 0;
  private tradeStartedAtMs: number | null = null;
  private contractActivatedAtMs: number | null = null;
  private tickCount = 0;
  private readonly listState = new Map<string, unknown[]>();
  private readonly listResults = new Map<string, unknown>();
  private readonly textResults = new Map<string, unknown>();
  private readonly timeResults = new Map<string, unknown>();
  private readonly variableState = new Map<string, unknown>();

  reset(snapshot: StrategySnapshotLike | null, context: ConditionEngineContext = {}): void {
    this.snapshot = snapshot ? cloneRecord(snapshot) : null;
    this.latestTick = context.latestTick ?? null;
    this.nowMs = context.nowMs ?? Date.now();
    this.currentTradeActive = context.currentTradeActive ?? false;
    this.currentTradeOutcome = context.currentTradeOutcome ?? null;
    this.currentRepeatRun = Math.max(1, Math.floor(context.currentRepeatRun ?? 1));
    this.totalRepeatRuns = Math.max(this.currentRepeatRun, Math.floor(context.totalRepeatRuns ?? 1));
    this.currentRunStake = Math.max(0, context.currentRunStake ?? 0);
    this.sessionStakeBudget = Math.max(0, context.sessionStakeBudget ?? 0);
    this.sessionLossSpent = Math.max(0, context.sessionLossSpent ?? 0);
    this.sessionLossThreshold = Number.isFinite(context.sessionLossThreshold ?? Number.POSITIVE_INFINITY)
      ? Math.max(0, context.sessionLossThreshold ?? Number.POSITIVE_INFINITY)
      : Number.POSITIVE_INFINITY;
    this.sessionProfitSpent = Math.max(0, context.sessionProfitSpent ?? 0);
    this.tradeStartedAtMs = context.tradeStartedAtMs ?? null;
    this.contractActivatedAtMs = context.contractActivatedAtMs ?? null;
    this.tickCount = 0;
    this.listState.clear();
    this.listResults.clear();
    this.textResults.clear();
    this.timeResults.clear();
    this.variableState.clear();

    this.seedSemanticState();
  }

  beginSession(snapshot: StrategySnapshotLike, context: ConditionEngineContext = {}): ConditionEngineReport {
    this.reset(snapshot, context);
    return this.evaluate(context);
  }

  ingestTick(tick: Record<string, unknown>, context: ConditionEngineContext = {}): ConditionEngineReport {
    this.latestTick = tick;
    this.tickCount += 1;
    this.nowMs = context.nowMs ?? getTickTime(tick, this.nowMs);
    return this.evaluate(context);
  }

  ingestLifecycleEvent(kind: "order" | "activated" | "expiry", payload: Record<string, unknown>, context: ConditionEngineContext = {}): ConditionEngineReport {
    this.latestTick = payload ?? this.latestTick;
    this.nowMs = context.nowMs ?? getTickTime(payload, this.nowMs);
    if (kind === "order") {
      this.tradeStartedAtMs = this.tradeStartedAtMs ?? this.nowMs;
      this.currentTradeActive = true;
    } else if (kind === "activated") {
      this.contractActivatedAtMs = this.nowMs;
      this.currentTradeActive = true;
    } else if (kind === "expiry") {
      this.currentTradeActive = false;
    }
    return this.evaluate(context);
  }

  applyTradeOutcome(outcome: TradeOutcome, delta: number | null = null): ConditionEngineReport {
    this.currentTradeOutcome = outcome;
    if (delta != null) {
      if (delta < 0) {
        this.sessionLossSpent += Math.abs(delta);
      } else {
        this.sessionProfitSpent += delta;
      }
    }
    this.currentTradeActive = false;
    return this.evaluate();
  }

  setSessionProgress(currentRepeatRun: number, totalRepeatRuns: number, currentRunStake: number, sessionStakeBudget: number, sessionLossSpent: number, sessionLossThreshold: number): void {
    this.currentRepeatRun = Math.max(1, Math.floor(currentRepeatRun));
    this.totalRepeatRuns = Math.max(this.currentRepeatRun, Math.floor(totalRepeatRuns));
    this.currentRunStake = Math.max(0, currentRunStake);
    this.sessionStakeBudget = Math.max(0, sessionStakeBudget);
    this.sessionLossSpent = Math.max(0, sessionLossSpent);
    this.sessionLossThreshold = Number.isFinite(sessionLossThreshold) && sessionLossThreshold > 0 ? sessionLossThreshold : Number.POSITIVE_INFINITY;
  }

  evaluate(context: ConditionEngineContext = {}): ConditionEngineReport {
    if (!this.snapshot) return createEmptyReport();

    this.nowMs = context.nowMs ?? this.nowMs ?? Date.now();
    const conditions = this.snapshot.conditions ?? {};
    const report = createEmptyReport();
    const ruleResults: ConditionEvaluation[] = [];

    const state: RuleState = {
      snapshot: this.snapshot,
      latestTick: context.latestTick ?? this.latestTick,
      nowMs: this.nowMs,
      currentTradeActive: context.currentTradeActive ?? this.currentTradeActive,
      currentTradeOutcome: context.currentTradeOutcome ?? this.currentTradeOutcome,
      currentRepeatRun: context.currentRepeatRun ?? this.currentRepeatRun,
      totalRepeatRuns: context.totalRepeatRuns ?? this.totalRepeatRuns,
      currentRunStake: context.currentRunStake ?? this.currentRunStake,
      sessionStakeBudget: context.sessionStakeBudget ?? this.sessionStakeBudget,
      sessionLossSpent: context.sessionLossSpent ?? this.sessionLossSpent,
      sessionLossThreshold: context.sessionLossThreshold ?? this.sessionLossThreshold,
      sessionProfitSpent: context.sessionProfitSpent ?? this.sessionProfitSpent,
      tradeStartedAtMs: context.tradeStartedAtMs ?? this.tradeStartedAtMs,
      contractActivatedAtMs: context.contractActivatedAtMs ?? this.contractActivatedAtMs,
      tickCount: this.tickCount,
    };

    const entry = (conditions.entry as Condition | null | undefined) ?? (conditions.purchase as Condition | null | undefined) ?? null;
    const exit = (conditions.exit as Condition | null | undefined) ?? (conditions.sell as Condition | null | undefined) ?? null;
    const management = (conditions.management as Record<string, unknown> | null | undefined) ?? null;

    const evaluateListBlocks = (): void => {
      const listBlocks = (conditions.lists as Array<Record<string, unknown>> | undefined) ?? [];
      for (const [index, entryValue] of listBlocks.entries()) {
        const block = entryValue as Record<string, unknown>;
        const type = String(block.type ?? "").trim();
        const values = (block.values ?? {}) as Record<string, unknown>;
        const name = listNameFrom(values);
        const current = this.listState.get(name) ?? [];
        if (type === "list_create") {
          const initialValues = String(values.INITIAL_VALUES ?? "")
            .split(",")
            .map((item) => normalizeListValue(item))
            .filter((item) => item !== "");
          this.listState.set(name, initialValues);
          this.listResults.set(`${name}:create:${index}`, initialValues);
          report.notes.push(`List ${name} initialized with ${initialValues.length} item(s).`);
          continue;
        }

        if (type === "list_operation") {
          const op = String(values.OPERATOR ?? "ADD").trim().toUpperCase();
          const value = normalizeListValue(values.VALUE);
          let next = [...current];
          if (op === "ADD") {
            next.push(value);
          } else if (op === "REMOVE") {
            next = next.filter((item) => String(item) !== String(value));
          } else if (op === "SET") {
            next = [value];
          } else if (op === "CLEAR") {
            next = [];
          } else if (op === "GET") {
            this.listResults.set(`${name}:get:${index}`, next[0] ?? null);
          } else if (op === "CONTAINS") {
            const contains = next.some((item) => String(item) === String(value));
            this.listResults.set(`${name}:contains:${index}`, contains);
          } else if (op === "LENGTH") {
            this.listResults.set(`${name}:length:${index}`, next.length);
          } else {
            report.warnings.push(`List operation ${op} is not supported yet.`);
          }
          this.listState.set(name, next);
          this.listResults.set(`${name}:operation:${index}`, next);
          continue;
        }

        if (type === "list_contains") {
          const contains = current.some((item) => String(item) === String(values.VALUE ?? ""));
          this.listResults.set(`${name}:contains:${index}`, contains);
          continue;
        }

        if (type === "list_length") {
          this.listResults.set(`${name}:length:${index}`, current.length);
          continue;
        }
      }
    };

    const evaluateTextBlocks = (): void => {
      const textBlocks = (conditions.text as Array<Record<string, unknown>> | undefined) ?? [];
      for (const [index, entryValue] of textBlocks.entries()) {
        const block = entryValue as Record<string, unknown>;
        const type = String(block.type ?? "").trim();
        const values = (block.values ?? {}) as Record<string, unknown>;
        const operator = String(values.OPERATOR ?? "CONCAT").trim().toUpperCase();
        const text1 = textValueFrom(values, "TEXT_1");
        const text2 = textValueFrom(values, "TEXT_2");
        let result: unknown = "";

        if (type === "text_operation") {
          switch (operator) {
            case "CONCAT":
              result = `${text1}${text2}`;
              break;
            case "CONTAINS":
              result = text1.includes(text2);
              break;
            case "STARTS_WITH":
              result = text1.startsWith(text2);
              break;
            case "ENDS_WITH":
              result = text1.endsWith(text2);
              break;
            case "LENGTH":
              result = text1.length;
              break;
            case "REPLACE":
              result = text1.replace(new RegExp(text2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "");
              break;
            case "TO_UPPER":
              result = text1.toUpperCase();
              break;
            case "TO_LOWER":
              result = text1.toLowerCase();
              break;
            case "SPLIT":
              result = text1.split(text2 || ",");
              break;
            case "JOIN":
              result = [text1, text2].filter(Boolean).join("");
              break;
            default:
              result = `${text1}${text2}`;
          }
          this.textResults.set(`${type}:${index}`, result);
          continue;
        }

        if (type === "text_contains") {
          result = text1.includes(text2);
          this.textResults.set(`${type}:${index}`, result);
        }
      }
    };

    const evaluateTimeBlocks = (): void => {
      const timeBlocks = (conditions.time as Array<Record<string, unknown>> | undefined) ?? [];
      for (const [index, entryValue] of timeBlocks.entries()) {
        const block = entryValue as Record<string, unknown>;
        const type = String(block.type ?? "").trim();
        const values = (block.values ?? {}) as Record<string, unknown>;
        if (type === "time_delay") {
          const duration = toNumber(values.DURATION, 0);
          const unit = String(values.UNIT ?? "SECONDS").trim().toUpperCase();
          const delayMs = timeToMs(duration, unit);
          this.timeResults.set(`${type}:${index}`, { delayMs, duration, unit });
          continue;
        }
        if (type === "time_at") {
          const target = String(values.TIME ?? "").trim();
          this.timeResults.set(`${type}:${index}`, { target, targetMinutes: parseTimeOfDay(target) });
          continue;
        }
        if (type === "time_count_down") {
          const start = toNumber(values.START, 0);
          const current = toNumber(values.CURRENT, start);
          this.timeResults.set(`${type}:${index}`, {
            start,
            current,
            remaining: Math.max(0, start - current),
          });
        }
      }
    };

    evaluateListBlocks();
    evaluateTextBlocks();
    evaluateTimeBlocks();

    const currentTickPrice = getTickPrice(state.latestTick);
    const currentTickTime = getTickTime(state.latestTick, state.nowMs);

    const rules: Array<ConditionEvaluation | null> = [
      evaluateCondition(entry, state, "entry"),
      evaluateCondition(exit, state, "exit"),
    ];

    if (management) {
      rules.push({
        scope: "management",
        type: "REPEAT_RUNS",
        satisfied: state.currentRepeatRun <= Math.max(1, Math.floor(toNumber(management.repeatRuns ?? 1, 1))),
        blocking: false,
        label: "Repeat Runs",
        detail: `Run ${state.currentRepeatRun} of ${Math.max(1, Math.floor(toNumber(management.repeatRuns ?? 1, 1)))}.`,
        evaluatedAtMs: state.nowMs,
        lastTickTimeMs: currentTickTime,
        lastTickPrice: currentTickPrice,
        warning: state.currentRepeatRun > Math.max(1, Math.floor(toNumber(management.repeatRuns ?? 1, 1)))
          ? "Current run exceeds configured repeat runs."
          : undefined,
      });

      rules.push({
        scope: "management",
        type: "LOSS_THRESHOLD",
        satisfied: state.sessionLossSpent <= state.sessionLossThreshold,
        blocking: false,
        label: "Loss Threshold",
        detail: `Loss spent ${state.sessionLossSpent.toFixed(2)} of ${Number.isFinite(state.sessionLossThreshold) ? state.sessionLossThreshold.toFixed(2) : "∞"}.`,
        evaluatedAtMs: state.nowMs,
        lastTickTimeMs: currentTickTime,
        lastTickPrice: currentTickPrice,
        warning: state.sessionLossSpent > state.sessionLossThreshold ? "Loss threshold reached." : undefined,
      });
    }

    const variableBlocks = (conditions.variables as Array<Record<string, unknown>> | undefined) ?? [];
    if (variableBlocks.length > 0) {
      for (const variable of variableBlocks) {
        const record = variable as Record<string, unknown>;
        const name = toStringValue(record.name, "variable");
        const value = record.value as unknown;
        this.variableState.set(name, value);
      }
    }

    report.ruleResults = rules.filter((rule): rule is ConditionEvaluation => Boolean(rule));
    report.activeRules = report.ruleResults.length;
    report.satisfiedRules = report.ruleResults.filter((rule) => rule.satisfied).length;
    report.pendingRules = report.ruleResults.filter((rule) => !rule.satisfied).length;
    report.entrySatisfied = report.ruleResults.find((rule) => rule.scope === "entry")?.satisfied ?? false;
    report.exitSatisfied = report.ruleResults.find((rule) => rule.scope === "exit")?.satisfied ?? false;
    report.ready = report.entrySatisfied && report.pendingRules === 0;
    report.warnings = report.ruleResults.flatMap((rule) => (rule.warning ? [rule.warning] : []));
    report.concurrentTriggers = report.ruleResults.filter((rule) => rule.satisfied).map((rule) => rule.label);
    report.blockedBy = report.ruleResults.filter((rule) => rule.blocking && !rule.satisfied);
    report.notes.push(
      `Evaluated ${report.activeRules} live rule${report.activeRules === 1 ? "" : "s"} concurrently.`,
    );

    report.listState = Object.fromEntries([...this.listState.entries()]);
    report.listResults = Object.fromEntries([...this.listResults.entries()]);
    report.textResults = Object.fromEntries([...this.textResults.entries()]);
    report.timeResults = Object.fromEntries([...this.timeResults.entries()]);
    report.variableState = Object.fromEntries([...this.variableState.entries()]);

    if (report.exitSatisfied && state.currentTradeActive) {
      report.notes.push("Exit conditions are active while the trade is live.");
    }

    if (state.currentRepeatRun > state.totalRepeatRuns) {
      report.warnings.push("Current repeat run exceeds the configured total.");
    }

    return report;
  }

  private seedSemanticState(): void {
    if (!this.snapshot?.conditions) return;

    const variableBlocks = (this.snapshot.conditions.variables as Array<Record<string, unknown>> | undefined) ?? [];
    for (const variable of variableBlocks) {
      const record = variable as Record<string, unknown>;
      const name = toStringValue(record.name, "");
      if (!name) continue;
      this.variableState.set(name, record.value ?? "");
    }
  }
}
