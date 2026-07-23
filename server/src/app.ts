import { storageService } from "./services/storage";
import { validationService } from "./services/validation";
import { wsService } from "./services/websocket";
import {
  BLOCK_TEMPLATES,
  BLOCK_TEMPLATES_BY_TYPE,
  CATEGORY_DEFINITIONS,
  SECTION_DEFINITIONS,
  type BlockTemplate,
  type CategoryDefinition,
  type FieldDefinition,
} from "./data/blockCatalog";

type SectionId = "market" | "execution" | "indicators" | "conditions" | "restart" | "utility";

type SerializedBlock = {
  type: string;
  title: string;
  values: Record<string, string | number | boolean>;
};

type SectionSnapshot = {
  id: SectionId;
  title: string;
  blocks: SerializedBlock[];
};

type StrategySnapshot = {
  meta: {
    botName: string;
    mode: string;
    updatedAt: string;
  };
  market: Record<string, unknown> | null;
  execution: Record<string, unknown> | null;
  indicators: Array<Record<string, unknown>>;
  conditions: {
    purchase: Record<string, unknown> | null;
    sell: Record<string, unknown> | null;
    logic: Array<Record<string, unknown>>;
  };
  restart: {
    onWin: Record<string, unknown> | null;
    onLoss: Record<string, unknown> | null;
  };
  utility: {
    variables: Array<Record<string, unknown>>;
    snapshot: Record<string, unknown> | null;
  };
  sections: SectionSnapshot[];
  apiPayload: Record<string, unknown> | null;
};

type ImportedSnapshotFile = StrategySnapshot & {
  xml?: string;
};

type ModalState = {
  categoryId: string | null;
  templateType: string | null;
};

type TradeLifecycleStageKey = "order" | "activated" | "expiry";
type TradeOutcome = "won" | "lost" | "unknown";

type TradeLifecycleStage = {
  key: TradeLifecycleStageKey;
  title: string;
  status: "done" | "pending" | "active";
  timeMs: number;
  price?: number | null;
  contractId?: string | null;
  note: string;
  rawPayload?: Record<string, unknown> | null;
};

type WsEventLogEntry = {
  at: number;
  event: string;
  payload: unknown;
};

type ContractTypeRecord = {
  contract_type: string;
  contract_display?: string;
  contract_category: string;
  contract_category_display?: string;
  barrier_category?: string;
  barriers?: number;
  description?: string;
};

type DurationLimitRecord = {
  min: number;
  max: number;
};

type ProposalDefaultsRecord = {
  contract_type: string;
  allowed_units: string[];
  default_duration: number;
  default_duration_unit: string;
  default_stake: number;
  duration_limits: Record<string, DurationLimitRecord>;
  min_stake: number;
  max_stake: number;
  barrier_default?: number;
  barrier_direction?: string;
  barrier_max?: number;
  barrier_min?: number;
  barrier_low_default?: number;
  barrier_high_default?: number;
  digit_target_min?: number;
  digit_target_max?: number;
  default_digit_target?: number;
  default_digit_low?: number;
  default_digit_high?: number;
  digit_low_min?: number;
  digit_low_max?: number;
  digit_high_min?: number;
  digit_high_max?: number;
  hint?: string;
  spot?: number;
};

const SECTION_INPUT_NAMES: Record<SectionId, string> = {
    market: "MARKET",
  execution: "EXECUTION",
  indicators: "INDICATORS",
  conditions: "CONDITIONS",
  restart: "RESTART",
  utility: "UTILITY",
};

const SECTION_BLOCK_TYPES: Record<SectionId, string> = {
  market: "market_section",
  execution: "execution_section",
  indicators: "indicators_section",
  conditions: "conditions_section",
  restart: "restart_section",
  utility: "utility_section",
};

const DEFAULT_SYMBOL = "VIX_100";
const DEFAULT_CATEGORY = "market";
const AUTH_STORAGE_KEY = "botbuilder-auth-token";
const FEED_SESSION_STORAGE_KEY = "botbuilder-feed-session";
const AUTH_API_BASE = "http://212.95.35.81:70/api/v1";

type BotBuilderAuthConfig = {
  token?: string;
  identifier?: string;
  password?: string;
  deviceId?: string;
  geoLocation?: string;
  appVersion?: string;
};

type BotBuilderFeedSession = {
  token?: string;
  symbols?: Array<Record<string, unknown>>;
  selectedSymbol?: string;
  authenticatedAt?: string;
  symbolsFetchedAt?: string;
};

type BotBuilderWindow = Window & {
  __BOT_BUILDER_AUTH_TOKEN__?: string;
  __BOT_BUILDER_AUTH__?: Partial<BotBuilderAuthConfig>;
};

function resolveTarget(target: string | HTMLElement): HTMLElement {
  if (typeof target !== "string") return target;
  const resolved = document.querySelector<HTMLElement>(target) ?? document.getElementById(target);
  if (!resolved) {
    throw new Error(`Bot Builder mount target not found: ${target}`);
  }
  return resolved;
}

function getBlockly(): any {
  const Blockly = (window as Window & { Blockly?: any }).Blockly;
  if (!Blockly) {
    throw new Error("Blockly is not available on window");
  }
  return Blockly;
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cloneFields(fields: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
  return { ...fields };
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function getTemplate(type: string): BlockTemplate {
  const template = BLOCK_TEMPLATES_BY_TYPE.get(type);
  if (!template) {
    throw new Error(`Unknown block template: ${type}`);
  }
  return template;
}

function getSectionBlockType(sectionId: SectionId): string {
  return SECTION_BLOCK_TYPES[sectionId];
}

function getSectionInputName(sectionId: SectionId): string {
  return SECTION_INPUT_NAMES[sectionId];
}

function getSectionTitle(sectionId: SectionId): string {
  return SECTION_DEFINITIONS.find((section) => section.id === sectionId)?.title ?? sectionId;
}

function getBlockFieldValue(block: any, fieldName: string): string {
  return safeString(block?.getFieldValue?.(fieldName) ?? "");
}

function getCategoryDefinition(categoryId: string) {
  return CATEGORY_DEFINITIONS.find((category) => category.id === categoryId) ?? CATEGORY_DEFINITIONS[0];
}

function getCategoryGroups(categoryId: string) {
  return getCategoryDefinition(categoryId).groups;
}

function asNumber(value: string | number | boolean, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value: string | number | boolean): boolean {
  if (typeof value === "boolean") return value;
  return String(value).toUpperCase() === "TRUE";
}

function buildFieldJson(field: FieldDefinition): any {
  if (field.kind === "text") {
    return {
      type: "field_input",
      name: field.name,
      text: String(field.defaultValue),
      spellcheck: false,
    };
  }

  if (field.kind === "number") {
    return {
      type: "field_number",
      name: field.name,
      value: Number(field.defaultValue),
      min: field.min,
      max: field.max,
      precision: field.precision,
    };
  }

  if (field.kind === "checkbox") {
    return {
      type: "field_checkbox",
      name: field.name,
      checked: asBoolean(field.defaultValue),
    };
  }

  const options = (field.options ?? []).map((option) => [option.label, option.value]);

  return {
    type: "field_dropdown",
    name: field.name,
    options,
  };
}

function buildTemplateJson(template: BlockTemplate): any {
  if (template.layout === "root") {
    const marketInput = { type: "input_statement", name: getSectionInputName("market") };
    const executionInput = { type: "input_statement", name: getSectionInputName("execution") };
    const indicatorsInput = { type: "input_statement", name: getSectionInputName("indicators") };
    const conditionsInput = { type: "input_statement", name: getSectionInputName("conditions") };
    const restartInput = { type: "input_statement", name: getSectionInputName("restart") };
    const utilityInput = { type: "input_statement", name: getSectionInputName("utility") };

    return {
      message0: template.title,
      message1: "Market %1  Execution %2",
      args1: [marketInput, executionInput],
      message2: "Indicators %1  Conditions %2",
      args2: [indicatorsInput, conditionsInput],
      message3: "Restart %1  Utility %2",
      args3: [restartInput, utilityInput],
      colour: template.color,
      hat: "cap",
      inputsInline: true,
    };
  }

  if (template.layout === "section") {
    return {
      message0: `${template.title} %1`,
      args0: [{ type: "input_statement", name: "STACK" }],
      previousStatement: null,
      nextStatement: null,
      colour: template.color,
      tooltip: template.description,
    };
  }

  if (template.fields.length === 1) {
    return {
      message0: `${template.title} %1`,
      args0: [buildFieldJson(template.fields[0])],
      previousStatement: null,
      nextStatement: null,
      colour: template.color,
      tooltip: template.description,
      inputsInline: true,
    };
  }

  const json: any = {
    message0: template.title,
    previousStatement: null,
    nextStatement: null,
    colour: template.color,
    tooltip: template.description,
    inputsInline: template.fields.length <= 2,
  };

  template.fields.forEach((field, index) => {
    const messageKey = `message${index + 1}`;
    const argsKey = `args${index + 1}`;
    json[messageKey] = `${field.label} %1`;
    json[argsKey] = [buildFieldJson(field)];
  });

  return json;
}

function readTemplateValues(block: any, template: BlockTemplate): Record<string, string | number | boolean> {
  const values: Record<string, string | number | boolean> = {};

  for (const field of template.fields) {
    const raw = block.getFieldValue(field.name);
    if (field.kind === "number") {
      values[field.name] = asNumber(raw, Number(field.defaultValue));
      continue;
    }

    if (field.kind === "checkbox") {
      values[field.name] = asBoolean(raw);
      continue;
    }

    values[field.name] = safeString(raw);
  }

  return values;
}

function firstBlockByType(blocks: SerializedBlock[], type: string): SerializedBlock | null {
  return blocks.find((block) => block.type === type) ?? null;
}

function toSectionSnapshot(sectionId: SectionId, blocks: SerializedBlock[]): SectionSnapshot {
  return {
    id: sectionId,
    title: getSectionTitle(sectionId),
    blocks,
  };
}

function getContractCategoryDisplayFromType(contractType: string): string {
  const normalizedType = safeString(contractType).trim().toUpperCase();
  if (!normalizedType) return "";
  if (["UP", "DOWN"].includes(normalizedType)) return "Up/Down";
  if (["HIGH", "LOW"].includes(normalizedType)) return "High/Low";
  if (["KNOCK_IN", "KNOCK_OUT"].includes(normalizedType)) return "Knock In/Out";
  if (["ENDS_BETWEEN", "ENDS_OUTSIDE"].includes(normalizedType)) return "Ends Between/Outside";
  if (["STAYS_IN", "STAYS_OUT"].includes(normalizedType)) return "Stays In/Out";
  if (["MATCHES", "DIFFERS"].includes(normalizedType)) return "Matches/Differs";
  if (["OVER", "UNDER"].includes(normalizedType)) return "Over/Under";
  return normalizedType;
}

function convertBlocksToSnapshot(blocks: SerializedBlock[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const marketSymbol = firstBlockByType(blocks, "market_symbol");
  const marketCategory = firstBlockByType(blocks, "market_category");
  const marketContract = firstBlockByType(blocks, "market_contract");
  const marketSettings = firstBlockByType(blocks, "market_settings");
  const marketBarrier = firstBlockByType(blocks, "market_barrier");
  const marketBarrierLow = firstBlockByType(blocks, "market_barrier_low");
  const marketBarrierHigh = firstBlockByType(blocks, "market_barrier_high");
  const marketDigits = firstBlockByType(blocks, "market_digits");
  const marketRange = firstBlockByType(blocks, "market_range");

  if (marketSymbol || marketCategory || marketContract || marketSettings || marketBarrier || marketDigits || marketRange) {
    const values = {
      ...(marketSettings?.values ?? {}),
      ...(marketSymbol?.values ?? {}),
      ...(marketCategory?.values ?? {}),
      ...(marketContract?.values ?? {}),
      ...(marketBarrier?.values ?? {}),
      ...(marketBarrierLow?.values ?? {}),
      ...(marketBarrierHigh?.values ?? {}),
      ...(marketDigits?.values ?? {}),
      ...(marketRange?.values ?? {}),
    };
    const rangeLow = values.RANGE_LOW ?? values.DIGIT_LOW;
    const rangeHigh = values.RANGE_HIGH ?? values.DIGIT_HIGH;
    const barrierLow = values.BARRIER_LOW;
    const barrierHigh = values.BARRIER_HIGH;
    const contractType = safeString(values.CONTRACT_TYPE ?? "UP");
    const rawCategory = safeString(values.CONTRACT_CATEGORY ?? "");
    const normalizedCategory =
      rawCategory && rawCategory !== "PATH_INDEPENDENT"
        ? rawCategory
        : getContractCategoryDisplayFromType(contractType);

    result.market = {
      symbol: safeString(values.SYMBOL ?? DEFAULT_SYMBOL),
      category: normalizedCategory || rawCategory || "Up/Down",
      contractType,
      barrier: asNumber(values.BARRIER_VALUE ?? 0.199, 0.199),
      barrierLow: typeof barrierLow === "number" ? asNumber(barrierLow, barrierLow) : undefined,
      barrierHigh: typeof barrierHigh === "number" ? asNumber(barrierHigh, barrierHigh) : undefined,
      rangeLow: asNumber(rangeLow ?? 3, 3),
      rangeHigh: asNumber(rangeHigh ?? 6, 6),
      digitTarget: asNumber(values.DIGIT_TARGET ?? 5, 5),
      digitOperator: safeString(values.DIGIT_OPERATOR ?? "MATCHES"),
    };
  }

  const executionStake = firstBlockByType(blocks, "execution_stake");
  const executionDuration = firstBlockByType(blocks, "execution_duration");
  const executionUnit = firstBlockByType(blocks, "execution_unit");
  const executionSettings = firstBlockByType(blocks, "execution_settings");
  const executionRisk = firstBlockByType(blocks, "execution_risk");
  const executionWindow = firstBlockByType(blocks, "execution_window");

  if (executionStake || executionDuration || executionUnit || executionSettings || executionRisk || executionWindow) {
    const values = {
      ...(executionStake?.values ?? {}),
      ...(executionDuration?.values ?? {}),
      ...(executionUnit?.values ?? {}),
      ...(executionSettings?.values ?? {}),
      ...(executionRisk?.values ?? {}),
      ...(executionWindow?.values ?? {}),
    };

    result.execution = {
      stake: asNumber(values.STAKE ?? 10, 10),
      duration: asNumber(values.DURATION ?? 5, 5),
      durationUnit: safeString(values.DURATION_UNIT ?? "t"),
      stopLoss: asNumber(values.STOP_LOSS ?? 5, 5),
      takeProfit: asNumber(values.TAKE_PROFIT ?? 10, 10),
      maxStakes: asNumber(values.MAX_STAKES ?? 3, 3),
      lockAfterLoss: asBoolean(values.LOCK_AFTER_LOSS ?? false),
      windowMode: safeString(values.WINDOW_MODE ?? "immediate"),
      windowLabel: safeString(values.WINDOW_LABEL ?? "Primary execution window"),
    };
  }

  const indicatorRule = firstBlockByType(blocks, "indicator_rule");
  const indicatorCompare = firstBlockByType(blocks, "indicator_compare");
  const indicatorsSettings = firstBlockByType(blocks, "indicators_settings");
  const indicators: Array<Record<string, unknown>> = [];

  if (indicatorsSettings) {
    indicators.push({
      type: safeString(indicatorsSettings.values.INDICATOR ?? "rsi"),
      period: asNumber(indicatorsSettings.values.PERIOD ?? 14, 14),
      symbol: safeString(indicatorsSettings.values.SYMBOL ?? DEFAULT_SYMBOL),
      active: asBoolean(indicatorsSettings.values.ACTIVE ?? true),
    });
    indicators.push({
      left: safeString(indicatorsSettings.values.LEFT ?? "indicator"),
      operator: safeString(indicatorsSettings.values.OPERATOR ?? "GT"),
      threshold: asNumber(indicatorsSettings.values.THRESHOLD ?? 50, 50),
    });
  } else {
    if (indicatorRule) {
      indicators.push({
        type: safeString(indicatorRule.values.INDICATOR ?? "rsi"),
        period: asNumber(indicatorRule.values.PERIOD ?? 14, 14),
        symbol: safeString(indicatorRule.values.SYMBOL ?? DEFAULT_SYMBOL),
        active: asBoolean(indicatorRule.values.ACTIVE ?? true),
      });
    }

    if (indicatorCompare) {
      indicators.push({
        left: safeString(indicatorCompare.values.LEFT ?? "indicator"),
        operator: safeString(indicatorCompare.values.OPERATOR ?? "GT"),
        threshold: asNumber(indicatorCompare.values.THRESHOLD ?? 50, 50),
      });
    }
  }

  result.indicators = indicators;

  const purchaseCondition = firstBlockByType(blocks, "purchase_condition");
  const sellCondition = firstBlockByType(blocks, "sell_condition");
  const logicGate = firstBlockByType(blocks, "logic_gate");
  const conditionsSettings = firstBlockByType(blocks, "conditions_settings");

  result.conditions = conditionsSettings
    ? {
        purchase: {
          type: safeString(conditionsSettings.values.PURCHASE_TRIGGER ?? "ALWAYS"),
          value: safeString(conditionsSettings.values.PURCHASE_VALUE ?? ""),
          invert: asBoolean(conditionsSettings.values.PURCHASE_INVERT ?? false),
        },
        sell: {
          type: safeString(conditionsSettings.values.SELL_TRIGGER ?? "ALWAYS"),
          value: safeString(conditionsSettings.values.SELL_VALUE ?? ""),
          invert: asBoolean(conditionsSettings.values.SELL_INVERT ?? false),
        },
        logic: [
          {
            operator: safeString(conditionsSettings.values.LOGIC_OPERATOR ?? "AND"),
            negate: asBoolean(conditionsSettings.values.LOGIC_NEGATE ?? false),
          },
        ],
      }
    : {
        purchase: purchaseCondition
          ? {
              type: safeString(purchaseCondition.values.TRIGGER ?? "ALWAYS"),
              value: safeString(purchaseCondition.values.VALUE ?? ""),
              invert: asBoolean(purchaseCondition.values.INVERT ?? false),
            }
          : null,
        sell: sellCondition
          ? {
              type: safeString(sellCondition.values.TRIGGER ?? "ALWAYS"),
              value: safeString(sellCondition.values.VALUE ?? ""),
              invert: asBoolean(sellCondition.values.INVERT ?? false),
            }
          : null,
        logic: logicGate
          ? [
              {
                operator: safeString(logicGate.values.OPERATOR ?? "AND"),
                negate: asBoolean(logicGate.values.NEGATE ?? false),
              },
            ]
          : [],
      };

  const restartOnWin = firstBlockByType(blocks, "restart_on_win");
  const restartOnLoss = firstBlockByType(blocks, "restart_on_loss");
  const restartSettings = firstBlockByType(blocks, "restart_settings");

  result.restart = restartSettings
    ? {
        onWin: {
          resetStake: asNumber(restartSettings.values.WIN_RESET_STAKE ?? 10, 10),
          enabled: asBoolean(restartSettings.values.WIN_ENABLE ?? true),
        },
        onLoss: {
          resetStake: asNumber(restartSettings.values.LOSS_RESET_STAKE ?? 10, 10),
          enabled: asBoolean(restartSettings.values.LOSS_ENABLE ?? true),
        },
      }
    : {
        onWin: restartOnWin
          ? {
              resetStake: asNumber(restartOnWin.values.RESET_STAKE ?? 10, 10),
              enabled: asBoolean(restartOnWin.values.ENABLE ?? true),
            }
          : null,
        onLoss: restartOnLoss
          ? {
              resetStake: asNumber(restartOnLoss.values.RESET_STAKE ?? 10, 10),
              enabled: asBoolean(restartOnLoss.values.ENABLE ?? true),
            }
          : null,
      };

  const variables = blocks
    .filter((block) => block.type === "set_variable")
    .map((block) => ({
      name: safeString(block.values.VAR_NAME ?? ""),
      value: safeString(block.values.VAR_VALUE ?? ""),
      persistent: asBoolean(block.values.PERSIST ?? false),
    }));
  const utilitySettings = firstBlockByType(blocks, "utility_settings");

  result.utility = utilitySettings
    ? {
        variables: [
          {
            name: safeString(utilitySettings.values.VAR_NAME ?? ""),
            value: safeString(utilitySettings.values.VAR_VALUE ?? ""),
            persistent: asBoolean(utilitySettings.values.PERSIST ?? false),
          },
        ],
        snapshot: {
          scope: safeString(utilitySettings.values.SNAPSHOT_SCOPE ?? "full"),
          includeMeta: asBoolean(utilitySettings.values.INCLUDE_META ?? true),
        },
      }
    : {
        variables,
        snapshot: firstBlockByType(blocks, "strategy_snapshot")
          ? {
              // snapshotName: safeString(firstBlockByType(blocks, "strategy_snapshot")?.values.SNAPSHOT_NAME ?? "Strategy Snapshot"),
              scope: safeString(firstBlockByType(blocks, "strategy_snapshot")?.values.SNAPSHOT_SCOPE ?? "full"),
              includeMeta: asBoolean(firstBlockByType(blocks, "strategy_snapshot")?.values.INCLUDE_META ?? true),
            }
          : null,
      };

  return result;
}

function createApiPayload(strategy: StrategySnapshot): Record<string, unknown> | null {
  if (!strategy.market || !strategy.execution) return null;

  const market = strategy.market as Record<string, unknown>;
  const execution = strategy.execution as Record<string, unknown>;
  const contractType = String(market.contractType ?? "UP").trim().toUpperCase();
  const payload: Record<string, unknown> = {
    request: "proposal",
    symbol: market.symbol ?? DEFAULT_SYMBOL,
    contract_type: contractType,
    stake: execution.stake ?? 10,
    duration: execution.duration ?? 5,
    duration_unit: execution.durationUnit ?? "t",
  };

  const hasBarrierContract = ["HIGH", "LOW", "KNOCK_IN", "KNOCK_OUT"].includes(contractType);
  const hasDoubleBarrierContract = ["ENDS_BETWEEN", "ENDS_OUTSIDE", "STAYS_IN", "STAYS_OUT"].includes(contractType);
  const hasDigitTargetContract = ["MATCHES", "DIFFERS", "OVER", "UNDER", "EVEN", "ODD", "PRIME", "NON_PRIME"].includes(contractType);
  const hasDigitRangeContract = ["RANGE_IN", "RANGE_OUT"].includes(contractType);

  if (hasBarrierContract && typeof market.barrier === "number") {
    payload.barrier = market.barrier;
  }

  if (hasDoubleBarrierContract) {
    payload.barrier_low = typeof market.barrierLow === "number" ? market.barrierLow : typeof market.rangeLow === "number" ? market.rangeLow : undefined;
    payload.barrier_high = typeof market.barrierHigh === "number" ? market.barrierHigh : typeof market.rangeHigh === "number" ? market.rangeHigh : undefined;
  }

  if (hasDigitTargetContract && typeof market.digitTarget === "number") {
    payload.digit_target = market.digitTarget;
  }

  if (hasDigitRangeContract) {
    if (typeof market.rangeLow === "number") {
      payload.digit_low = market.rangeLow;
    }
    if (typeof market.rangeHigh === "number") {
      payload.digit_high = market.rangeHigh;
    }
  }

  return payload;
}

function collectSectionBlocks(workspace: any, sectionId: SectionId): SerializedBlock[] {
  return workspace
    .getAllBlocks(false)
    .filter((block: any) => {
      const template = BLOCK_TEMPLATES_BY_TYPE.get(block.type);
      return Boolean(template && template.sectionId === sectionId && template.serializeInSnapshot !== false);
    })
    .map((block: any) => {
      const template = getTemplate(block.type);
      return {
        type: block.type,
        title: template.title,
        values: cloneFields(readTemplateValues(block, template)),
      };
    })
    .sort((left: SerializedBlock, right: SerializedBlock) => {
      const leftTemplate = getTemplate(left.type);
      const rightTemplate = getTemplate(right.type);
      return leftTemplate.order - rightTemplate.order || left.title.localeCompare(right.title);
    });
}

class BotBuilderApp {
  private readonly root: HTMLElement;
  private workspace: any = null;
  private initialized = false;
  private modalState: ModalState = { categoryId: null, templateType: null };
  private selectedCategoryId: string = DEFAULT_CATEGORY;
  private expandedCategoryIds: Set<string> = new Set([DEFAULT_CATEGORY]);
  private selectedContractCategory: string = "__loading_contract_categories__";
  private selectedContractType: string = "UP";
  private strategyXml: string | null = null;
  private lastSnapshot: StrategySnapshot | null = null;
  private readonly listeners: Array<() => void> = [];
  private feedSymbols: Array<Record<string, unknown>> = [];
  private feedAuthenticated = false;
  private latestTick: Record<string, unknown> | null = null;
  private subscribedSymbol: string | null = null;
  private currentLifecycle: TradeLifecycleStage[] | null = null;
  private currentLifecycleHeading = "";
  private currentLifecycleSubheading = "";
  private currentTradeOutcome: TradeOutcome | null = null;
  private currentTradeContractId: string | null = null;
  private sessionStateLabel: "Disconnected" | "Connecting" | "Connected" | "Authenticated" | "Session refreshed" = "Disconnected";
  private sessionStateNote = "Click Connect to start.";
  private readonly wsEventLog: WsEventLogEntry[] = [];
  private readonly contractTypesBySymbol: Map<string, ContractTypeRecord[]> = new Map();
  private readonly proposalDefaultsBySymbol: Map<string, Map<string, ProposalDefaultsRecord>> = new Map();
  private readonly pendingContractTypeSymbols: Set<string> = new Set();
  private readonly pendingProposalDefaultsSymbols: Set<string> = new Set();
  private lastRenderedSymbolSignature = "";
  private syncingContractMetadata = false;

  constructor(target: string | HTMLElement = "#app") {
    this.root = resolveTarget(target);
  }

  public init(): void {
    if (this.initialized) return;

    this.renderShell();
    this.registerBlocks();
    this.initBlockly();
    this.bindUi();
    this.bindTradingFeed();
    this.restoreFeedSession();
    this.seedWorkspace(true);
    this.refreshAllPanels();

    this.initialized = true;
  }

  private renderShell(): void {
    this.root.innerHTML = `
      <div class="bb-app">
        <header class="bb-topbar">
          <div class="bb-topbar-brand">
            <div>
              <strong>Bot Builder</strong>
            </div>
          </div>
          <div class="bb-topbar-center">
            <label class="bb-market-picker">
              <span>Active market</span>
              <select id="bb-market-select">
                <option value="__loading_symbols__">Waiting for symbols from server...</option>
              </select>
            </label>
          </div>
          <div class="bb-topbar-status" id="bb-topbar-status">
            <span class="bb-topbar-status-label">Disconnected</span>
            <span class="bb-topbar-status-note">Click Connect to start.</span>
          </div>
          <div class="bb-topbar-actions">
            <button class="bb-btn bb-btn-primary" data-action="connect">Connect</button>
            <button class="bb-btn bb-btn-success" data-action="run">Run</button>
            <button class="bb-btn bb-btn-warn" data-action="export">Export</button>
            <button class="bb-btn bb-btn-primary" data-action="import-json">Import JSON</button>
            <button class="bb-btn bb-btn-primary" data-action="save">Save</button>
            <button class="bb-btn bb-btn-secondary" data-action="load">Load</button>
            <button class="bb-btn bb-btn-danger" data-action="clear">Clear</button>
          </div>
        </header>

        <main class="bb-layout">
          <aside class="bb-sidebar">
            <div class="bb-category-list" id="bb-category-list"></div>
          </aside>

          <section class="bb-workbench">
            <div class="bb-workbench-header">
              <div>
                <div class="bb-workbench-kicker">Workspace</div>
              </div>
            </div>
            <div class="bb-workspace-shell">
              <div id="bb-workspace" class="bb-workspace"></div>
            </div>
          </section>
          <aside class="bb-inspector">
            <section class="bb-card">
              <div class="bb-card-title">Status</div>
              <div class="bb-status-pill is-error" id="bb-status-pill">Not ready</div>
              <div class="bb-status-caption" id="bb-status-caption">No validation issues yet.</div>
            </section>

            <section class="bb-card">
              <div class="bb-card-title">Strategy JSON</div>
              <pre id="bb-strategy-json" class="bb-pre"></pre>
            </section>

            <section class="bb-card">
              <div class="bb-card-title">Generated Payload</div>
              <pre id="bb-payload-json" class="bb-pre"></pre>
            </section>

            <section class="bb-card">
              <div class="bb-card-title">Results</div>
              <div id="bb-results" class="bb-results">Run the strategy to see validation output.</div>
            </section>
          </aside>
        </main>

        <div class="bb-modal" id="bb-modal" aria-hidden="true">
          <div class="bb-modal-shell" role="dialog" aria-modal="false" aria-label="Block browser window">
            <div class="bb-modal-header">
              <div>
                <div class="bb-modal-kicker" id="bb-modal-kicker">Category</div>
                <h3 id="bb-modal-title">Blocks</h3>
                <p id="bb-modal-summary"></p>
              </div>
              <button class="bb-icon-btn" data-action="close-modal" aria-label="Close modal">Close</button>
            </div>
            <div class="bb-modal-toolbar">
              <label class="bb-search">
                <span>Search blocks</span>
                <input id="bb-block-search" type="search" placeholder="Filter by block name or input type" />
              </label>
              <div id="bb-modal-count" class="bb-modal-count"></div>
            </div>
            <div class="bb-modal-body">
              <div class="bb-modal-list" id="bb-modal-list"></div>
              <div class="bb-modal-detail" id="bb-modal-detail"></div>
            </div>
          </div>
        </div>

        <input id="bb-json-import" type="file" accept="application/json,.json" hidden />
      </div>
    `;

    this.renderCategoryList();
  }

  private renderCategoryList(): void {
    const list = this.root.querySelector<HTMLElement>("#bb-category-list");
    if (!list) return;

    list.innerHTML = CATEGORY_DEFINITIONS.map((category) => {
      const templates = this.getVisibleTemplates(category.id);

      return `
        <section class="bb-category-accordion ${this.selectedCategoryId === category.id ? "is-active" : ""}" data-category-panel="${category.id}">
          <button
            class="bb-category-card"
            data-category-toggle="${category.id}"
            type="button"
          >
            <span class="bb-category-copy">
              <strong>${category.title}</strong>
            </span>
          </button>
        </section>
      `;
    }).join("");
  }

  private registerBlocks(): void {
    const Blockly = getBlockly();

    for (const template of BLOCK_TEMPLATES) {
      if (Blockly.Blocks[template.type]) continue;

      Blockly.Blocks[template.type] = {
        init(this: any) {
          this.jsonInit(buildTemplateJson(template));
        },
      };
    }
  }

  private initBlockly(): void {
    const Blockly = getBlockly();
    const workspaceHost = this.root.querySelector<HTMLElement>("#bb-workspace");
    if (!workspaceHost) {
      throw new Error("Workspace host not found");
    }

    this.workspace = Blockly.inject(workspaceHost, {
      toolbox: null,
      trashcan: false,
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.08,
        maxScale: 1.8,
        minScale: 0.5,
        scaleSpeed: 1.1,
      },
      move: {
        scrollbars: true,
        drag: true,
        wheel: true,
      },
      grid: {
        spacing: 20,
        length: 3,
        colour: "rgba(150, 165, 190, 0.25)",
      },
      renderer: "zelos",
      theme: undefined,
    });

    workspaceHost.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    });

    workspaceHost.addEventListener("drop", (event) => {
      event.preventDefault();
      const payload = event.dataTransfer?.getData("application/json");
      if (!payload) return;

      try {
        const parsed = JSON.parse(payload) as { type: string; values?: Record<string, unknown> };
        this.insertTemplateBlockAt(parsed.type, parsed.values ?? {}, event.clientX, event.clientY);
      } catch (error) {
        console.error("Workspace drop parse error:", error);
      }
    });

    this.workspace.addChangeListener((event: any) => {
      const eventType = safeString(event?.type ?? "");
      const fieldName = safeString(event?.name ?? "");
      const isRelevantFieldChange =
        eventType === "field_change" &&
        ["CONTRACT_TYPE", "CONTRACT_CATEGORY", "SYMBOL"].includes(fieldName);

      if (!this.syncingContractMetadata) {
        if (isRelevantFieldChange) {
          this.syncMarketDropdowns();
          this.syncExecutionHelperVisibility();
        } else {
          this.syncMarketDropdowns();
          this.syncExecutionHelperVisibility();
        }
      }
      this.refreshAllPanels();
    });

    window.addEventListener("resize", this.handleResize);
    this.listeners.push(() => window.removeEventListener("resize", this.handleResize));
  }

  private bindUi(): void {
    const categoryList = this.root.querySelector<HTMLElement>("#bb-category-list");
    const modal = this.root.querySelector<HTMLElement>("#bb-modal");
    const search = this.root.querySelector<HTMLInputElement>("#bb-block-search");
    const topbarStatus = this.root.querySelector<HTMLElement>("#bb-topbar-status");
    const marketSelect = this.root.querySelector<HTMLSelectElement>("#bb-market-select");
    const jsonImportInput = this.root.querySelector<HTMLInputElement>("#bb-json-import");

    categoryList?.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null;
      const toggle = target?.closest<HTMLButtonElement>("[data-category-toggle]");
      if (toggle) {
        const categoryId = toggle.dataset.categoryToggle ?? DEFAULT_CATEGORY;
        this.openCategoryModal(categoryId);
        return;
      }
    });

    modal?.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest<HTMLElement>(".bb-modal-shell")) return;
      const action = target?.closest<HTMLElement>("[data-action]")?.dataset.action ?? "";

      if (action === "close-modal") {
        this.closeModal();
        return;
      }

      const blockCard = target?.closest<HTMLElement>("[data-template]");
      if (blockCard) {
        const templateType = blockCard.dataset.template ?? "";
        this.selectTemplate(templateType);
        return;
      }

      const addButton = target?.closest<HTMLElement>("[data-add-template]");
      if (addButton) {
        const templateType = addButton.dataset.addTemplate ?? "";
        this.insertTemplateFromModal(templateType);
        return;
      }
    });

    search?.addEventListener("input", () => {
      this.filterModalBlocks(search.value);
    });

    this.root.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null;
      const action = target?.closest<HTMLElement>("[data-action]")?.dataset.action;
      if (!action) return;

      if (action === "run") void this.runStrategy();
      if (action === "connect") void this.connectFeed();
      if (action === "export") this.exportStrategy();
      if (action === "save") this.saveStrategy();
      if (action === "load") this.loadStrategy();
      if (action === "clear") this.clearWorkspace();
      if (action === "import-json") jsonImportInput?.click();
    });

    marketSelect?.addEventListener("change", () => {
      if (!this.workspace) return;
      if (marketSelect.value.startsWith("__loading")) return;
      const marketSettingsBlock = this.findBlockByType("market_settings");
      const marketSymbolBlock = this.findBlockByType("market_symbol");
      if (marketSettingsBlock) {
        marketSettingsBlock.setFieldValue(marketSelect.value, "SYMBOL");
      }
      if (marketSymbolBlock) {
        marketSymbolBlock.setFieldValue(marketSelect.value, "SYMBOL");
      }
      const nextSymbol = marketSelect.value.trim() || DEFAULT_SYMBOL;
      if (wsService.isConnected()) {
        if (this.subscribedSymbol && this.subscribedSymbol !== nextSymbol) {
          wsService.unsubscribe(this.subscribedSymbol);
        }
        if (this.subscribedSymbol !== nextSymbol) {
          wsService.subscribe(nextSymbol);
          this.subscribedSymbol = nextSymbol;
        }
      }
      this.persistFeedSession({ selectedSymbol: nextSymbol });
      void this.requestContractTypesForSymbol(nextSymbol);
      this.syncMarketDropdowns();
      this.updateFeedStatus(`Selected ${marketSelect.value}`);
      this.refreshAllPanels();
    });

    jsonImportInput?.addEventListener("change", () => {
      const file = jsonImportInput.files?.[0];
      if (!file) return;
      void this.importStrategyFromFile(file);
      jsonImportInput.value = "";
    });

    const modalShell = this.root.querySelector<HTMLElement>(".bb-modal-shell");
    modalShell?.addEventListener("dragover", (event) => event.preventDefault());
    modalShell?.addEventListener("drop", (event) => {
      event.preventDefault();
      const payload = event.dataTransfer?.getData("application/json");
      if (!payload) return;
      try {
        const parsed = JSON.parse(payload) as { type: string; values?: Record<string, unknown> };
        this.insertTemplateBlock(parsed.type, parsed.values ?? {});
      } catch (error) {
        console.error("Drop parse error:", error);
      }
    });
  }

  private bindTradingFeed(): void {
    const handleConnected = () => {
      this.appendWsEventLog("connected", { status: "connected" });
      this.setSessionStatus("Connected", "WebSocket connected. Authenticating and loading symbols...");
      this.refreshConnectionStatus();
    };
    const handleDisconnected = (info?: { code?: number; reason?: string; wasClean?: boolean }) => {
      this.feedAuthenticated = false;
      this.subscribedSymbol = null;
      this.pendingContractTypeSymbols.clear();
      this.pendingProposalDefaultsSymbols.clear();
      this.appendWsEventLog("disconnected", info ?? { status: "disconnected" });
      const reason = info?.reason?.trim();
      const code = info?.code != null ? ` (${info.code})` : "";
      if (reason) {
        this.updateFeedStatus(`Connection closed${code}: ${reason}`);
      } else {
        this.updateFeedStatus(`Connection closed${code}`.trim());
      }
      this.setSessionStatus("Disconnected", reason ? `Connection closed${code}: ${reason}` : `Connection closed${code}`.trim());
      this.refreshConnectionStatus();
    };
    const handleAuthenticated = (data: { user_id?: number; is_demo?: boolean }) => {
      this.feedAuthenticated = true;
      const accountType = data.is_demo ? "Demo" : "Real";
      this.appendWsEventLog("authenticated", data);
      this.persistFeedSession({
        token: wsService.getAuthToken() ?? this.getStoredAuthToken() ?? undefined,
        authenticatedAt: new Date().toISOString(),
      });
      this.setSessionStatus("Authenticated", `Authenticated as ${accountType} user ${data.user_id ?? ""}`.trim());
      this.refreshConnectionStatus();
      this.updateFeedStatus(`Authenticated as ${accountType} user ${data.user_id ?? ""}`.trim());
      wsService.requestSymbols();
      const selectedSymbol = this.getSelectedMarketSymbol();
      if (selectedSymbol) {
        this.requestProposalDefaultsForSymbol(selectedSymbol);
      }
    };
    const handleSymbols = (symbols: Array<Record<string, unknown>>) => {
      this.feedSymbols = Array.isArray(symbols) ? symbols.filter(Boolean) : [];
      this.appendWsEventLog("symbols", symbols);
      this.persistFeedSession({
        symbols: this.feedSymbols,
        symbolsFetchedAt: new Date().toISOString(),
        selectedSymbol: this.getSelectedMarketSymbol(),
      });
      this.renderSymbolOptions(this.feedSymbols);
      this.syncSymbolDropdowns();
      if (this.currentTradeOutcome === null && this.currentLifecycle) {
        this.updateFeedStatus(`Trade running. Loaded ${this.feedSymbols.length} symbols.`);
      } else if (this.currentTradeOutcome === null) {
        this.updateFeedStatus(`Loaded ${this.feedSymbols.length} symbols`);
      }
      const selectedSymbol = this.getSelectedMarketSymbol();
      if (selectedSymbol) {
        void this.requestContractTypesForSymbol(selectedSymbol);
        this.requestProposalDefaultsForSymbol(selectedSymbol);
      }
    };
    const handleContractTypes = (payload: Record<string, unknown>) => {
      this.appendWsEventLog("contract_types", payload);
      this.handleContractTypesPayload(payload);
    };
    const handleProposalDefaults = (payload: Record<string, unknown>) => {
      this.appendWsEventLog("proposal_defaults", payload);
      this.handleProposalDefaultsPayload(payload);
    };
    const handleTick = (tick: Record<string, unknown>) => {
      if (this.currentTradeOutcome !== null) return;
      this.latestTick = tick;
      this.appendWsEventLog("tick", tick);
    };
    const handleOrder = (message: Record<string, unknown>) => {
      this.appendWsEventLog("order", message);
      this.applyLifecycleEvent("order", message);
    };
    const handleContractCreated = (message: Record<string, unknown>) => {
      this.appendWsEventLog("contract_created", message);
      this.applyLifecycleEvent("order", message);
    };
    const handleContractActivated = (message: Record<string, unknown>) => {
      this.appendWsEventLog("contract_activated", message);
      this.applyLifecycleEvent("activated", message);
    };
    const handleContractSettled = (message: Record<string, unknown>) => {
      this.appendWsEventLog("contract_settled", message);
      this.applyLifecycleEvent("expiry", message);
    };
    const handleContractDetail = (message: Record<string, unknown>) => {
      this.appendWsEventLog("contract_detail", message);
      this.applyFinalTradeOutcomeFromPayload(message);
    };
    const handleContractHistory = (message: Record<string, unknown>) => {
      this.appendWsEventLog("contract_history", message);
      this.applyFinalTradeOutcomeFromPayload(message);
    };
    const handleError = (error: unknown) => {
      const message = error instanceof Error ? error.message : typeof error === "string" ? error : "WebSocket error";
      this.appendWsEventLog("error", { message });
      this.refreshConnectionStatus();
    };

    wsService.on("connected", handleConnected);
    wsService.on("disconnected", handleDisconnected);
    wsService.on("authenticated", handleAuthenticated);
    wsService.on("symbols", handleSymbols);
    wsService.on("contract_types", handleContractTypes);
    wsService.on("proposal_defaults", handleProposalDefaults);
    wsService.on("tick", handleTick);
    wsService.on("order", handleOrder);
    wsService.on("contract_created", handleContractCreated);
    wsService.on("contract_activated", handleContractActivated);
    wsService.on("contract_settled", handleContractSettled);
    wsService.on("contract_detail", handleContractDetail);
    wsService.on("contract_history", handleContractHistory);
    wsService.on("error", handleError);

    this.listeners.push(() => wsService.off("connected", handleConnected));
    this.listeners.push(() => wsService.off("disconnected", handleDisconnected));
    this.listeners.push(() => wsService.off("authenticated", handleAuthenticated));
    this.listeners.push(() => wsService.off("symbols", handleSymbols));
    this.listeners.push(() => wsService.off("contract_types", handleContractTypes));
    this.listeners.push(() => wsService.off("proposal_defaults", handleProposalDefaults));
    this.listeners.push(() => wsService.off("tick", handleTick));
    this.listeners.push(() => wsService.off("order", handleOrder));
    this.listeners.push(() => wsService.off("contract_created", handleContractCreated));
    this.listeners.push(() => wsService.off("contract_activated", handleContractActivated));
    this.listeners.push(() => wsService.off("contract_settled", handleContractSettled));
    this.listeners.push(() => wsService.off("contract_detail", handleContractDetail));
    this.listeners.push(() => wsService.off("contract_history", handleContractHistory));
    this.listeners.push(() => wsService.off("error", handleError));
  }

  private async connectFeed(): Promise<void> {
    try {
      this.setSessionStatus("Connecting", "Connecting to the demo server...");
      const token = await this.resolveAuthToken();
      const activeToken = wsService.getAuthToken()?.trim() ?? "";
      const tokenMatchesActive = activeToken.length > 0 && activeToken === token.trim();

      if (wsService.isAuthenticated() && tokenMatchesActive) {
        this.persistFeedSession({
          token: activeToken,
          authenticatedAt: new Date().toISOString(),
        });
        this.setSessionStatus("Authenticated", "Session already authenticated. Refreshing symbols.");
        wsService.requestSymbols();
        return;
      }

      await this.authenticateWithToken(token);
      this.persistFeedSession({
        token,
        authenticatedAt: new Date().toISOString(),
      });
      this.setSessionStatus("Authenticated", "Authenticated and ready to load live symbols.");
      this.refreshConnectionStatus();
      wsService.requestSymbols();
    } catch (error) {
      const message = this.extractErrorMessage(error, "Unable to start feed connection");
      this.updateFeedStatus(message);
      this.appendWsEventLog("auth_bootstrap_failed", { message });
    }
  }

  private getRuntimeWindow(): BotBuilderWindow {
    return window as BotBuilderWindow;
  }

  private getStoredAuthToken(): string {
    return window.localStorage.getItem(AUTH_STORAGE_KEY)?.trim() ?? "";
  }

  private getInjectedAuthToken(): string {
    const runtimeWindow = this.getRuntimeWindow();
    const windowToken = runtimeWindow.__BOT_BUILDER_AUTH_TOKEN__?.trim() ?? "";
    const metaToken = document.querySelector<HTMLMetaElement>('meta[name="bot-builder-auth-token"]')?.content?.trim() ?? "";
    const token = windowToken || metaToken;

    if (token) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, token);
    }

    return token;
  }

  private getAuthBootstrapConfig(): BotBuilderAuthConfig | null {
    const runtimeWindow = this.getRuntimeWindow();
    const injectedScript = document.querySelector<HTMLScriptElement>("#bb-auth-bootstrap");
    let injected: Partial<BotBuilderAuthConfig> = runtimeWindow.__BOT_BUILDER_AUTH__ ?? {};

    if ((!injected || Object.keys(injected).length === 0) && injectedScript?.textContent?.trim()) {
      try {
        const parsed = JSON.parse(injectedScript.textContent) as Partial<BotBuilderAuthConfig>;
        if (parsed && typeof parsed === "object") {
          injected = parsed;
        }
      } catch (error) {
        console.error("Failed to parse auth bootstrap script:", error);
      }
    }

    const token = injected.token?.trim() ?? "";
    const identifier = injected.identifier?.trim() ?? "";
    const password = injected.password?.trim() ?? "";
    const deviceId = injected.deviceId?.trim() || "chart-main";
    const geoLocation = injected.geoLocation?.trim() || "Nairobi, Kenya";
    const appVersion = injected.appVersion?.trim() || "0.1.6";

    if (!token && (!identifier || !password)) {
      return null;
    }

    return {
      token,
      identifier,
      password,
      deviceId,
      geoLocation,
      appVersion,
    };
  }

  private storeAuthToken(token: string): void {
    const nextToken = token.trim();
    if (!nextToken) return;
    window.localStorage.setItem(AUTH_STORAGE_KEY, nextToken);
    this.getRuntimeWindow().__BOT_BUILDER_AUTH_TOKEN__ = nextToken;
  }

  private readFeedSession(): BotBuilderFeedSession {
    try {
      const raw = window.sessionStorage.getItem(FEED_SESSION_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as BotBuilderFeedSession;
      if (!parsed || typeof parsed !== "object") return {};
      return {
        token: typeof parsed.token === "string" ? parsed.token.trim() : undefined,
        symbols: Array.isArray(parsed.symbols) ? parsed.symbols.filter(Boolean) as Array<Record<string, unknown>> : undefined,
        selectedSymbol: typeof parsed.selectedSymbol === "string" ? parsed.selectedSymbol.trim() : undefined,
        authenticatedAt: typeof parsed.authenticatedAt === "string" ? parsed.authenticatedAt : undefined,
        symbolsFetchedAt: typeof parsed.symbolsFetchedAt === "string" ? parsed.symbolsFetchedAt : undefined,
      };
    } catch {
      return {};
    }
  }

  private persistFeedSession(patch: Partial<BotBuilderFeedSession>): void {
    try {
      const current = this.readFeedSession();
      const next: BotBuilderFeedSession = {
        ...current,
        ...patch,
      };
      if (next.token) {
        next.token = next.token.trim();
      }
      if (next.selectedSymbol) {
        next.selectedSymbol = next.selectedSymbol.trim();
      }
      window.sessionStorage.setItem(FEED_SESSION_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Feed session persistence error:", error);
    }
  }

  private restoreFeedSession(): void {
    const session = this.readFeedSession();
    if (session.token) {
      this.storeAuthToken(session.token);
    }

    if (Array.isArray(session.symbols) && session.symbols.length > 0) {
      this.feedSymbols = session.symbols.filter(Boolean);
      if (session.selectedSymbol) {
        const marketSelect = this.root.querySelector<HTMLSelectElement>("#bb-market-select");
        if (marketSelect) {
          marketSelect.value = session.selectedSymbol;
        }
      }
      this.renderSymbolOptions(this.feedSymbols);
      this.syncSymbolDropdowns();
      const selectedSymbol = session.selectedSymbol || this.getSelectedMarketSymbol();
      if (selectedSymbol) {
        this.setSessionStatus("Disconnected", `Session restored for ${selectedSymbol}. Click Connect to refresh symbols.`);
      } else {
        this.setSessionStatus("Disconnected", "Session restored. Click Connect to refresh symbols.");
      }
    }
  }

  private async bootstrapAuthToken(): Promise<string> {
    const config = this.getAuthBootstrapConfig();
    if (!config) {
      throw new Error("Paste a demo JWT token before running the bot, or configure demo auth credentials in .env.local.");
    }

    if (config.token) {
      this.storeAuthToken(config.token);
      return config.token;
    }

    if (!config.identifier || !config.password) {
      throw new Error("Demo auth credentials are incomplete.");
    }

    const submitResponse = await fetch(`${AUTH_API_BASE}/auth/submit-identifier`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: config.identifier,
        device_id: config.deviceId,
        geo_location: config.geoLocation,
        device_metadata: {
          os: "Linux",
          browser: "Chrome",
          app_version: config.appVersion,
        },
      }),
    });

    const submitJson = (await submitResponse.json().catch(() => null)) as Record<string, any> | null;
    const tempToken = String(submitJson?.data?.token ?? "").trim();
    if (!submitResponse.ok || !tempToken) {
      throw new Error(submitJson?.message ? String(submitJson.message) : "Failed to submit demo identifier.");
    }

    const loginResponse = await fetch(`${AUTH_API_BASE}/auth/login-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tempToken}`,
      },
      body: JSON.stringify({ password: config.password }),
    });

    const loginJson = (await loginResponse.json().catch(() => null)) as Record<string, any> | null;
    const freshToken = String(loginJson?.data?.token ?? "").trim();
    if (!loginResponse.ok || !freshToken) {
      throw new Error(loginJson?.message ? String(loginJson.message) : "Failed to login demo account.");
    }

    this.storeAuthToken(freshToken);
    return freshToken;
  }

  private async authenticateWithToken(token: string): Promise<void> {
    const normalized = token.trim();
    if (!normalized) {
      throw new Error("No demo JWT token available.");
    }

    const authWait = this.waitForWsEvent<{ user_id?: number; is_demo?: boolean }>("authenticated");
    if (wsService.isConnected()) {
      wsService.authenticate(normalized);
    } else {
      wsService.connect(normalized);
    }

    await authWait;
    this.storeAuthToken(normalized);
  }

  private isAuthFailure(error: unknown): boolean {
    const message = this.extractErrorMessage(error, "").toLowerCase();
    return (
      message.includes("unauthorized") ||
      message.includes("connection closed") ||
      message.includes("failed while waiting for authenticated") ||
      message.includes("paste a demo jwt token") ||
      message.includes("auth")
    );
  }

  private async resolveAuthToken(): Promise<string> {
    const injectedToken = this.getInjectedAuthToken();
    if (injectedToken) {
      return injectedToken;
    }

    const storedToken = this.getStoredAuthToken();
    if (storedToken) {
      return storedToken;
    }

    return this.bootstrapAuthToken();
  }

  private updateFeedStatus(message: string): void {
    const status = this.root.querySelector<HTMLElement>("#bb-status-caption");
    if (status) status.textContent = message;
  }

  private setSessionStatus(label: typeof this.sessionStateLabel, note: string): void {
    this.sessionStateLabel = label;
    this.sessionStateNote = note;
    this.refreshConnectionStatus();
  }

  private refreshConnectionStatus(): void {
    const status = this.root.querySelector<HTMLElement>("#bb-topbar-status");
    if (!status) return;
    const tradeOutcomeLabel = this.currentTradeOutcome === "won"
      ? "Trade won"
      : this.currentTradeOutcome === "lost"
        ? "Trade lost"
        : null;
    const stateLabel = tradeOutcomeLabel ?? (!wsService.isConnected()
      ? "Disconnected"
      : wsService.getStatus() === "connecting"
        ? "Connecting"
        : this.feedAuthenticated || wsService.isAuthenticated()
          ? this.sessionStateLabel === "Session refreshed"
            ? "Session refreshed"
            : "Authenticated"
          : "Connected");
    const statusClass = tradeOutcomeLabel
      ? this.currentTradeOutcome === "won"
        ? "is-ready"
        : "is-error"
      : !wsService.isConnected()
        ? "is-error"
        : wsService.getStatus() === "connecting"
          ? "is-running"
          : this.feedAuthenticated || wsService.isAuthenticated()
            ? "is-ready"
            : "is-running";

    status.innerHTML = `
      <span class="bb-topbar-status-label ${statusClass}">${escapeHtml(stateLabel)}</span>
      <span class="bb-topbar-status-note">${escapeHtml(this.sessionStateNote)}</span>
    `;
  }

  private appendWsEventLog(event: string, payload: unknown): void {
    this.wsEventLog.push({
      at: Date.now(),
      event,
      payload,
    });
    if (this.wsEventLog.length > 40) {
      this.wsEventLog.splice(0, this.wsEventLog.length - 40);
    }
    if (this.currentLifecycle) {
      this.renderTradeLifecycle(this.currentLifecycle, this.currentLifecycleHeading || "Live trade", this.currentLifecycleSubheading || "Live websocket activity");
    }
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    if (error && typeof error === "object") {
      const record = error as Record<string, unknown>;
      const message = record.message;
      if (typeof message === "string" && message.trim()) return message;
      const details = record.error;
      if (typeof details === "string" && details.trim()) return details;
      return this.stringifyPayload(error);
    }
    return fallback;
  }

  private normalizeRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  }

  private toFiniteNumber(value: unknown): number | null {
    const number = typeof value === "number" ? value : Number(value);
    return Number.isFinite(number) ? number : null;
  }

  private toTradeId(value: unknown): string | null {
    if (typeof value === "number") {
      return Number.isFinite(value) ? String(value) : null;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return null;
  }

  private getTickPrice(source: Record<string, unknown> | null): number | null {
    if (!source) return null;
    return this.toFiniteNumber(source.price ?? source.quote ?? source.value ?? source.close ?? source.tick_price);
  }

  private getTickTime(source: Record<string, unknown> | null): number {
    if (!source) return Date.now();
    const epochMs = this.toFiniteNumber(source.epoch_ms ?? source.timestamp_ms ?? source.time_ms);
    if (epochMs !== null) return epochMs;
    const epoch = this.toFiniteNumber(source.epoch ?? source.timestamp ?? source.time);
    if (epoch !== null) return epoch < 10_000_000_000 ? epoch * 1000 : epoch;
    return Date.now();
  }

  private stringifyPayload(value: unknown): string {
    if (value == null) return "No payload available.";
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  private durationToMs(duration: number, durationUnit: string): number {
    const value = Math.max(1, Math.floor(Number(duration) || 1));
    const unit = String(durationUnit || "s").trim().toLowerCase();
    if (unit === "t" || unit === "tick" || unit === "ticks" || unit === "s" || unit === "sec" || unit === "second" || unit === "seconds") {
      return value * 1_000;
    }
    if (unit === "m" || unit === "min" || unit === "minute" || unit === "minutes") return value * 60_000;
    if (unit === "h" || unit === "hour" || unit === "hours") return value * 3_600_000;
    return value * 1_000;
  }

  private formatTime(epochMs: number): string {
    return new Date(epochMs).toLocaleString(undefined, {
      hour12: false,
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  private buildTradeLifecycle(payload: Record<string, unknown>, orderData: Record<string, unknown>): TradeLifecycleStage[] {
    const contractId = this.toTradeId(orderData.contract_id ?? orderData.contractId ?? payload.contract_id ?? payload.contractId);
    const isProvisional = contractId == null;
    const duration = this.toFiniteNumber(orderData.duration ?? payload.duration) ?? 5;
    const durationUnit = String(orderData.duration_unit ?? payload.duration_unit ?? "t");
    const orderTime = this.getTickTime(
      this.normalizeRecord(orderData) ?? this.normalizeRecord(payload) ?? this.latestTick,
    );
    const orderPrice = this.toFiniteNumber(orderData.entry_price ?? orderData.price ?? payload.entry_price ?? payload.price) ?? this.getTickPrice(this.latestTick);
    const activationTime = this.getTickTime(
      this.normalizeRecord({
        epoch_ms: orderData.activation_time_epoch ?? orderData.entry_time_epoch ?? payload.activation_time_epoch ?? payload.entry_time_epoch,
      }),
    );
    const activationPrice = this.toFiniteNumber(orderData.activation_price ?? orderData.entry_price ?? payload.activation_price ?? payload.entry_price ?? orderPrice);
    const expiryTime = this.getTickTime(
      this.normalizeRecord({
        epoch_ms: orderData.expiry_time_epoch ?? payload.expiry_time_epoch ?? (activationTime + this.durationToMs(duration, durationUnit)),
      }),
    );

    return [
      {
        key: "order",
        title: "Created",
        status: isProvisional ? "active" : "done",
        timeMs: orderTime,
        price: orderPrice,
        contractId,
        note: isProvisional
          ? "Contract creation request sent. Waiting for the websocket lifecycle."
          : "Contract creation confirmed by the websocket feed.",
        rawPayload: orderData,
      },
      {
        key: "activated",
        title: "Activated",
        status: isProvisional ? "pending" : "active",
        timeMs: activationTime,
        price: activationPrice,
        contractId,
        note: isProvisional ? "Waiting for contract activation from the websocket feed." : "Trade is active on the demo feed.",
        rawPayload: {
          type: "contract_activated",
          contract_id: contractId,
          activation_price: activationPrice,
          activation_time_epoch: activationTime,
          expiry_time_epoch: expiryTime,
        },
      },
      {
        key: "expiry",
        title: "Expiry",
        status: "pending",
        timeMs: expiryTime,
        price: this.toFiniteNumber(orderData.exit_price ?? payload.exit_price ?? activationPrice),
        contractId,
        note: isProvisional ? "Waiting for expiry and settlement events." : "Trade will settle when the duration elapses.",
        rawPayload: {
          type: "contract_settled",
          contract_id: contractId,
          settled_time_epoch: expiryTime,
          exit_price: this.toFiniteNumber(orderData.exit_price ?? payload.exit_price ?? activationPrice),
        },
      },
    ];
  }

  private setCurrentLifecycle(stages: TradeLifecycleStage[], heading: string, subheading: string): void {
    this.currentLifecycle = stages.map((stage) => ({ ...stage }));
    this.currentLifecycleHeading = heading;
    this.currentLifecycleSubheading = subheading;
    this.renderTradeLifecycle(this.currentLifecycle, heading, subheading);
  }

  private findLifecycleStageIndex(key: TradeLifecycleStageKey): number {
    return this.currentLifecycle?.findIndex((stage) => stage.key === key) ?? -1;
  }

  private applyLifecycleEvent(stageKey: TradeLifecycleStageKey, message: Record<string, unknown>): void {
    if (!this.currentLifecycle) return;

    const contractId = this.toTradeId(message.contract_id ?? message.contractId);
    const currentContractId = this.toTradeId(this.currentLifecycle[0]?.contractId ?? this.currentLifecycle[1]?.contractId ?? this.currentLifecycle[2]?.contractId);
    const effectiveContractId = contractId ?? currentContractId;

    if (contractId !== null && currentContractId !== null && String(contractId) !== String(currentContractId)) {
      return;
    }

    const nextStages = this.currentLifecycle.map((stage) => ({ ...stage }));
    const stageIndex = this.findLifecycleStageIndex(stageKey);
    if (stageIndex === -1) return;

    const eventTime = this.getTickTime(
      this.normalizeRecord({
        epoch_ms:
          message.activation_time_epoch ??
          message.settled_time_epoch ??
          message.entry_time_epoch ??
          message.expiry_time_epoch ??
          message.epoch_ms,
      }),
    );
    const eventPrice = this.toFiniteNumber(
      message.activation_price ??
        message.exit_price ??
        message.entry_price ??
        message.price ??
        this.getTickPrice(this.latestTick),
    );

    const target = nextStages[stageIndex];
    target.timeMs = eventTime;
    target.price = eventPrice ?? target.price ?? null;
    target.contractId = effectiveContractId ?? target.contractId;
    target.rawPayload = message;

    if (stageKey === "order") {
      target.status = "done";
      target.note = "Contract creation confirmed by the websocket feed.";
      this.currentLifecycle = nextStages;
      this.renderTradeLifecycle(nextStages, this.currentLifecycleHeading || "Demo trade placed successfully", this.currentLifecycleSubheading || "Waiting for live websocket lifecycle events.");
      this.updateFeedStatus(`Contract created${contractId !== null ? ` for contract ${contractId}` : ""}.`);
      return;
    }

    if (stageKey === "activated") {
      target.status = "done";
      target.note = "Trade activation confirmed by the websocket feed.";
      const expiryIndex = this.findLifecycleStageIndex("expiry");
      if (expiryIndex !== -1) {
        const expiryStage = nextStages[expiryIndex];
        if (message.expiry_time_epoch != null) {
          expiryStage.timeMs = this.getTickTime(this.normalizeRecord({ epoch_ms: message.expiry_time_epoch }));
        }
        expiryStage.contractId = effectiveContractId ?? expiryStage.contractId;
        expiryStage.status = "pending";
        expiryStage.rawPayload = message;
      }
      this.currentLifecycle = nextStages;
      this.renderTradeLifecycle(nextStages, this.currentLifecycleHeading || "Demo trade placed successfully", "The trade is now running through order, activation, and expiry.");
      this.updateFeedStatus(`Trade activated${contractId !== null ? ` for contract ${contractId}` : ""}.`);
      return;
    }

    if (stageKey === "expiry") {
      target.status = "done";
      target.note = "Trade expired and settled from the websocket feed.";
      const activationIndex = this.findLifecycleStageIndex("activated");
      if (activationIndex !== -1) {
        nextStages[activationIndex].status = "done";
        nextStages[activationIndex].rawPayload = message;
      }
      this.currentLifecycle = nextStages;
      this.renderTradeLifecycle(nextStages, "Demo trade settled", "The server confirmed the contract expiry. Waiting for the final contract result.");
      this.updateFeedStatus(`Trade settled${effectiveContractId !== null ? ` for contract ${effectiveContractId}` : ""}. Waiting for result...`);
      this.stopActiveTradeFeed();
      this.applyFinalTradeOutcomeFromPayload(message);
      if (effectiveContractId !== null) {
        this.currentTradeContractId = effectiveContractId;
        void this.requestFinalTradeOutcome(effectiveContractId);
      }
    }
  }

  private normalizeOutcomeLabel(value: unknown): TradeOutcome | null {
    const status = safeString(value).trim().toLowerCase();
    if (!status) return null;
    if (["won", "win", "winner", "success", "successful"].includes(status)) return "won";
    if (["lost", "loss", "failed", "failure", "expired_lost", "expired loss"].includes(status)) return "lost";
    return null;
  }

  private extractOutcomeRecord(payload: Record<string, unknown>, contractId: string | null): Record<string, unknown> | null {
    const candidates: unknown[] = [payload, payload.data, payload.message];
    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
      const record = candidate as Record<string, unknown>;
      if (Array.isArray(record.contracts)) {
        const contracts = record.contracts.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object"));
        const matched = contractId == null
          ? contracts[0] ?? null
          : contracts.find((entry) => String(entry.contract_id ?? entry.contractId ?? "") === contractId) ?? null;
        if (matched) return matched;
      }

      const currentId = this.toTradeId(record.contract_id ?? record.contractId ?? record.id);
      if (contractId == null || currentId == null || currentId === contractId) {
        if (record.status || record.profit != null || record.payout != null) {
          return record;
        }
      }
    }
    return null;
  }

  private resolveOutcomeFromRecord(record: Record<string, unknown>): TradeOutcome | null {
    const statusOutcome = this.normalizeOutcomeLabel(record.status ?? record.result ?? record.outcome);
    if (statusOutcome) return statusOutcome;

    const profit = this.toFiniteNumber(record.profit);
    if (profit != null) {
      return profit > 0 ? "won" : "lost";
    }

    const payout = this.toFiniteNumber(record.payout);
    const stake = this.toFiniteNumber(record.stake);
    if (payout != null && stake != null) {
      return payout > stake ? "won" : "lost";
    }

    if (record.is_won === true || record.won === true || record.win === true) return "won";
    if (record.is_won === false || record.won === false || record.win === false) return "lost";
    return null;
  }

  private async requestFinalTradeOutcome(contractId: string): Promise<void> {
    try {
      const detailWait = this.waitForWsEvent<Record<string, unknown>>("contract_detail", 8000);
      if (wsService.requestContractDetail(contractId)) {
        try {
          const detailPayload = await detailWait;
          const detailRecord = this.extractOutcomeRecord(detailPayload, contractId);
          if (detailRecord) {
            this.applyFinalTradeOutcome(detailRecord, contractId);
            return;
          }
        } catch {
          // Fall through to history lookup.
        }
      }

      const historyWait = this.waitForWsEvent<Record<string, unknown>>("contract_history", 8000);
      if (wsService.requestContractHistory(20, 0)) {
        try {
          const historyPayload = await historyWait;
          const historyRecord = this.extractOutcomeRecord(historyPayload, contractId);
          if (historyRecord) {
            this.applyFinalTradeOutcome(historyRecord, contractId);
          }
        } catch {
          // Best effort only; the lifecycle still shows settlement.
        }
      }
    } catch (error) {
      this.appendWsEventLog("final_trade_outcome_error", {
        message: this.extractErrorMessage(error, "Failed to resolve final trade outcome"),
      });
    }
  }

  private applyFinalTradeOutcome(record: Record<string, unknown>, contractId: string | null = null): void {
    const outcome = this.resolveOutcomeFromRecord(record);
    if (!outcome) return;

    this.currentTradeOutcome = outcome;
    if (contractId !== null) {
      this.currentTradeContractId = contractId;
    }

    const label = outcome === "won" ? "Demo trade won" : "Demo trade lost";
    const subheading = outcome === "won"
      ? "The server confirmed the contract expired in profit."
      : "The server confirmed the contract expired at a loss.";
    const statusPill = this.root.querySelector<HTMLElement>("#bb-status-pill");
    const statusCaption = this.root.querySelector<HTMLElement>("#bb-status-caption");

    if (statusPill) {
      statusPill.className = outcome === "won" ? "bb-status-pill is-ready" : "bb-status-pill is-error";
      statusPill.textContent = outcome === "won" ? "Trade won" : "Trade lost";
    }
    if (statusCaption) {
      statusCaption.textContent = subheading;
    }
    if (this.currentLifecycle) {
      this.renderTradeLifecycle(this.currentLifecycle, label, subheading);
    }
    this.stopActiveTradeFeed();
    this.updateFeedStatus(`${label}${this.currentTradeContractId !== null ? ` for contract ${this.currentTradeContractId}` : ""}.`);
  }

  private applyFinalTradeOutcomeFromPayload(payload: Record<string, unknown>): void {
    const record = this.extractOutcomeRecord(payload, this.currentTradeContractId);
    if (record) {
      this.applyFinalTradeOutcome(record, this.toTradeId(record.contract_id ?? record.contractId ?? record.id) ?? this.currentTradeContractId);
      return;
    }

    if (this.resolveOutcomeFromRecord(payload)) {
      this.applyFinalTradeOutcome(
        payload,
        this.toTradeId(payload.contract_id ?? payload.contractId ?? payload.id) ?? this.currentTradeContractId,
      );
    }
  }

  private getOutcomeSummary(): { label: string; className: string } {
    if (this.currentTradeOutcome === "won") {
      return { label: "Won", className: "is-ready" };
    }
    if (this.currentTradeOutcome === "lost") {
      return { label: "Lost", className: "is-error" };
    }
    return { label: "Running", className: "is-running" };
  }

  private renderTradeLifecycle(stages: TradeLifecycleStage[], heading: string, subheading: string): void {
    const resultsEl = this.root.querySelector<HTMLElement>("#bb-results");
    if (!resultsEl) return;
    const summaryContractId = this.currentTradeContractId ?? stages.find((stage) => stage.contractId != null)?.contractId ?? "pending";
    const summaryOutcome = this.getOutcomeSummary();
    const summaryLifecycle =
      this.currentTradeOutcome == null
        ? "In progress"
        : this.currentTradeOutcome === "won"
          ? "Settled"
          : "Settled";
    const isSettled = this.currentTradeOutcome === "won" || this.currentTradeOutcome === "lost";
    const finalBanner = isSettled
      ? `
        <div class="bb-final-banner ${summaryOutcome.className}">
          <div class="bb-final-banner-label">Settled: ${escapeHtml(summaryOutcome.label)}</div>
          <div class="bb-final-banner-meta">
            <span>Contract ID: ${escapeHtml(String(summaryContractId))}</span>
            <span>Duration complete</span>
          </div>
        </div>
      `
      : "";

    const rows = stages
      .map((stage) => {
        const badgeClass = stage.status === "done" ? "is-ready" : stage.status === "active" ? "is-running" : "is-pending";
        const priceText = stage.price == null ? "n/a" : String(stage.price);
        const contractText = stage.contractId == null ? "n/a" : stage.contractId;
        return `
          <div class="bb-lifecycle-row">
            <div class="bb-lifecycle-badge ${badgeClass}">${escapeHtml(stage.title)}</div>
            <div class="bb-lifecycle-body">
              <div class="bb-lifecycle-title">${escapeHtml(stage.note)}</div>
              <div class="bb-result-meta">
                <div><strong>Time</strong><span>${escapeHtml(this.formatTime(stage.timeMs))}</span></div>
                <div><strong>Price</strong><span>${escapeHtml(priceText)}</span></div>
                <div><strong>Contract</strong><span>${escapeHtml(contractText)}</span></div>
              </div>
              <details class="bb-lifecycle-details">
                <summary>Raw websocket payload</summary>
                <pre class="bb-lifecycle-raw">${escapeHtml(this.stringifyPayload(stage.rawPayload))}</pre>
              </details>
            </div>
          </div>
        `;
      })
      .join("");

    const logRows = this.wsEventLog
      .slice()
      .reverse()
      .map((entry) => {
        const timestamp = new Date(entry.at).toLocaleTimeString([], { hour12: false });
        return `
          <div class="bb-event-log-row">
            <span class="bb-event-log-time">${escapeHtml(timestamp)}</span>
            <span class="bb-event-log-name">${escapeHtml(entry.event)}</span>
            <pre class="bb-event-log-payload">${escapeHtml(this.stringifyPayload(entry.payload))}</pre>
          </div>
        `;
      })
      .join("");

    const summaryCards = isSettled
      ? ""
      : `
        <div class="bb-trade-summary">
          <div class="bb-trade-summary-item">
            <span>Contract ID</span>
            <strong>${escapeHtml(String(summaryContractId))}</strong>
          </div>
          <div class="bb-trade-summary-item">
            <span>Lifecycle</span>
            <strong>${escapeHtml(summaryLifecycle)}</strong>
          </div>
          <div class="bb-trade-summary-item">
            <span>Outcome</span>
            <strong class="bb-trade-summary-badge ${summaryOutcome.className}">${escapeHtml(summaryOutcome.label)}</strong>
          </div>
        </div>
      `;

    resultsEl.innerHTML = `
      ${finalBanner}
      ${summaryCards}
      <div class="bb-result-header">
        <div class="bb-result-ok">${escapeHtml(heading)}</div>
        <div class="bb-result-outcome ${summaryOutcome.className}">${escapeHtml(summaryOutcome.label)}</div>
      </div>
      <div class="bb-result-caption">${escapeHtml(subheading)}</div>
      <div class="bb-lifecycle-list">${rows}</div>
      <div class="bb-event-log">
        <div class="bb-event-log-title">Live Event Log</div>
        <div class="bb-event-log-list">${logRows || `<div class="bb-event-log-empty">Waiting for websocket events...</div>`}</div>
      </div>
    `;
  }

  private renderSymbolOptions(symbols: Array<Record<string, unknown>>): void {
    const select = this.root.querySelector<HTMLSelectElement>("#bb-market-select");
    if (!select) return;

    const currentValue = select.value.trim();
    const normalized = this.buildSymbolOptions(symbols);

    const options = normalized.length
      ? normalized
      : [{ value: "__loading_symbols__", label: "Waiting for symbols from server..." }];
    const signature = options.map((option) => `${option.value}::${option.label}`).join("|");

    const nextValue = options.some((option) => option.value === currentValue) ? currentValue : options[0]?.value ?? "__loading_symbols__";
    if (signature === this.lastRenderedSymbolSignature && select.value === nextValue) {
      return;
    }

    select.innerHTML = options
      .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
      .join("");
    select.value = nextValue;
    this.lastRenderedSymbolSignature = signature;

    const activeSymbol = this.getSelectedMarketSymbol();
    if (activeSymbol && !activeSymbol.startsWith("__loading")) {
      void this.requestContractTypesForSymbol(activeSymbol);
    }
    this.syncMarketDropdowns();
  }

  private buildSymbolOptions(symbols: Array<Record<string, unknown>>): Array<{ value: string; label: string }> {
    const options: Array<{ value: string; label: string }> = [];
    const seen = new Set<string>();

    for (const item of symbols) {
      const value = safeString(item.name ?? item.symbol ?? "");
      if (!value || seen.has(value)) continue;
      seen.add(value);
      const label = safeString(item.display_name ?? item.name ?? item.symbol ?? value) || value;
      options.push({ value, label });
    }

    return options;
  }

  private getSelectedMarketSymbol(): string {
    const marketSettingsBlock = this.findBlockByType("market_settings");
    const marketSymbolBlock = this.findBlockByType("market_symbol");
    return (
      getBlockFieldValue(marketSettingsBlock, "SYMBOL") ||
      getBlockFieldValue(marketSymbolBlock, "SYMBOL") ||
      this.root.querySelector<HTMLSelectElement>("#bb-market-select")?.value.trim() ||
      DEFAULT_SYMBOL
    );
  }

  private getSelectedContractType(): string {
    const marketSettingsBlock = this.findBlockByType("market_settings");
    const marketContractBlock = this.findBlockByType("market_contract");
    return (
      getBlockFieldValue(marketSettingsBlock, "CONTRACT_TYPE") ||
      getBlockFieldValue(marketContractBlock, "CONTRACT_TYPE") ||
      "UP"
    ).trim().toUpperCase() || "UP";
  }

  private getSelectedContractCategory(): string {
    const marketSettingsBlock = this.findBlockByType("market_settings");
    const marketCategoryBlock = this.findBlockByType("market_category");
    return (
      getBlockFieldValue(marketSettingsBlock, "CONTRACT_CATEGORY") ||
      getBlockFieldValue(marketCategoryBlock, "CONTRACT_CATEGORY") ||
      this.selectedContractCategory ||
      "__loading_contract_categories__"
    );
  }

  private resolveContractCategoryRecord(records: ContractTypeRecord[], selectedCategory: string): ContractTypeRecord | null {
    const normalizedCategory = safeString(selectedCategory);
    if (!normalizedCategory) return null;
    return (
      records.find((record) => record.contract_category_display === normalizedCategory) ??
      records.find((record) => record.contract_category === normalizedCategory) ??
      null
    );
  }

  private getContractCategoryDisplay(record: ContractTypeRecord | null): string {
    return safeString(record?.contract_category_display ?? record?.contract_category ?? "");
  }

  private getSelectedContractTypeRecord(): ContractTypeRecord | null {
    return this.getContractTypeRecordForSymbol(this.getSelectedMarketSymbol(), this.getSelectedContractType());
  }

  private getSelectedProposalDefaultsRecord(): ProposalDefaultsRecord | null {
    return this.getProposalDefaultsRecordForSymbol(this.getSelectedMarketSymbol(), this.getSelectedContractType());
  }

  private getContractTypeRecordForSymbol(symbol: string, contractType: string): ContractTypeRecord | null {
    const records = this.contractTypesBySymbol.get(symbol) ?? [];
    const normalizedType = safeString(contractType).trim().toUpperCase();
    if (!normalizedType) return null;
    return records.find((record) => record.contract_type === normalizedType) ?? null;
  }

  private getProposalDefaultsRecordForSymbol(symbol: string, contractType: string): ProposalDefaultsRecord | null {
    const defaults = this.proposalDefaultsBySymbol.get(symbol);
    const normalizedType = safeString(contractType).trim().toUpperCase();
    if (!defaults || !normalizedType) return null;
    return defaults.get(normalizedType) ?? null;
  }

  private getSingleBarrierBounds(defaults: ProposalDefaultsRecord | null): { min: number; max: number } {
    return {
      min: defaults?.barrier_min ?? 0.001,
      max: defaults?.barrier_max ?? 0.318,
    };
  }

  private getDoubleBarrierBounds(
    defaults: ProposalDefaultsRecord | null,
  ): { lowMin: number; lowMax: number; highMin: number; highMax: number } {
    return {
      lowMin: -(defaults?.barrier_max ?? 0.778),
      lowMax: -(defaults?.barrier_min ?? 0.001),
      highMin: defaults?.barrier_min ?? 0.001,
      highMax: defaults?.barrier_max ?? 0.778,
    };
  }

  private getDigitTargetBounds(defaults: ProposalDefaultsRecord | null): { min: number; max: number; defaultValue: number } {
    const min = defaults?.digit_target_min ?? 0;
    const max = defaults?.digit_target_max ?? 9;
    return {
      min,
      max,
      defaultValue: this.clampNumber(defaults?.default_digit_target ?? 5, min, max, 5),
    };
  }

  private getDigitRangeBounds(
    defaults: ProposalDefaultsRecord | null,
    usingBarrierDefaults: boolean,
  ): { lowMin: number; lowMax: number; highMin: number; highMax: number; lowDefault: number; highDefault: number } {
    if (usingBarrierDefaults) {
      const { lowMin, lowMax, highMin, highMax } = this.getDoubleBarrierBounds(defaults);
      return {
        lowMin,
        lowMax,
        highMin,
        highMax,
        lowDefault: this.clampNumber(defaults?.barrier_low_default ?? -0.486, lowMin, lowMax, -0.486),
        highDefault: this.clampNumber(defaults?.barrier_high_default ?? 0.486, highMin, highMax, 0.486),
      };
    }

    const lowMin = defaults?.digit_low_min ?? 0;
    const lowMax = defaults?.digit_low_max ?? 8;
    const highMin = defaults?.digit_high_min ?? 1;
    const highMax = defaults?.digit_high_max ?? 9;
    return {
      lowMin,
      lowMax,
      highMin,
      highMax,
      lowDefault: this.clampNumber(defaults?.default_digit_low ?? 3, lowMin, lowMax, 3),
      highDefault: this.clampNumber(defaults?.default_digit_high ?? 6, highMin, highMax, 6),
    };
  }

  private getSingleBarrierCategoryDisplays(): Set<string> {
    return new Set(["High/Low", "Knock In/Out"]);
  }

  private getDoubleBarrierCategoryDisplays(): Set<string> {
    return new Set(["Ends Between/Outside", "Stays In/Out"]);
  }

  private getDigitCategoryDisplays(): Set<string> {
    return new Set(["Matches/Differs"]);
  }

  private getSingleBarrierContractTypes(): Set<string> {
    return new Set(["HIGH", "LOW", "KNOCK_IN", "KNOCK_OUT"]);
  }

  private getDoubleBarrierContractTypes(): Set<string> {
    return new Set(["ENDS_BETWEEN", "ENDS_OUTSIDE", "STAYS_IN", "STAYS_OUT"]);
  }

  private getDigitTargetContractTypes(): Set<string> {
    return new Set(["MATCHES", "DIFFERS", "OVER", "UNDER", "EVEN", "ODD", "PRIME", "NON_PRIME"]);
  }

  private getDigitRangeContractTypes(): Set<string> {
    return new Set(["RANGE_IN", "RANGE_OUT"]);
  }

  private isDigitContractCategory(record: ContractTypeRecord | null): boolean {
    return safeString(record?.contract_category ?? "").trim().toUpperCase() === "DIGITS";
  }

  private hasSingleBarrier(record: ContractTypeRecord | null): boolean {
    return (record?.barriers ?? 0) === 1 && this.getSingleBarrierContractTypes().has(this.getSelectedContractType());
  }

  private hasDoubleBarrier(record: ContractTypeRecord | null): boolean {
    return (record?.barriers ?? 0) === 2 && this.getDoubleBarrierContractTypes().has(this.getSelectedContractType());
  }

  private needsDigitTarget(record: ContractTypeRecord | null): boolean {
    return this.isDigitContractCategory(record) && this.getDigitTargetContractTypes().has(this.getSelectedContractType());
  }

  private needsDigitRange(record: ContractTypeRecord | null): boolean {
    return this.isDigitContractCategory(record) && this.getDigitRangeContractTypes().has(this.getSelectedContractType());
  }

  private setBlockVisibility(block: any, visible: boolean): boolean {
    if (!block || typeof block.setVisible !== "function") return false;
    const currentVisible = typeof block.isVisible === "function" ? block.isVisible() : undefined;
    if (currentVisible === visible) return false;
    block.setVisible(visible);
    return true;
  }

  private syncExecutionHelperVisibility(): void {
    if (!this.workspace || this.syncingContractMetadata) return;

    this.syncingContractMetadata = true;
    try {
      const symbol = this.getSelectedMarketSymbol();
      const contractType = this.getSelectedContractType();
      const record = this.getContractTypeRecordForSymbol(symbol, contractType);
      const defaults = this.getProposalDefaultsRecordForSymbol(symbol, contractType);
      const executionSettingsBlock = this.findBlockByType("execution_settings");
      const executionStakeBlock = this.findBlockByType("execution_stake");
      const executionDurationBlock = this.findBlockByType("execution_duration");
      const executionUnitBlock = this.findBlockByType("execution_unit");

      const executionDefaults = defaults ?? null;
      const allowedUnits = executionDefaults?.allowed_units?.length ? executionDefaults.allowed_units : ["t"];
      const unitOptions = allowedUnits.map((unit) => ({ label: unit.toUpperCase(), value: unit }));
      const selectedUnitValue = safeString(
        executionSettingsBlock?.getFieldValue("DURATION_UNIT") ??
          executionUnitBlock?.getFieldValue("DURATION_UNIT") ??
          executionDefaults?.default_duration_unit ??
          allowedUnits[0] ??
          "t",
      ) || "t";
      const resolvedUnit = allowedUnits.includes(selectedUnitValue)
        ? selectedUnitValue
        : executionDefaults?.default_duration_unit ?? allowedUnits[0] ?? "t";
      const selectedDurationLimits =
        executionDefaults?.duration_limits?.[resolvedUnit] ??
        executionDefaults?.duration_limits?.[executionDefaults?.default_duration_unit ?? "t"] ??
        { min: 1, max: 15 };
      const barrierCount = record?.barriers ?? 0;
      const isSingleBarrier = barrierCount === 1 && this.getSingleBarrierContractTypes().has(contractType);
      const isDoubleBarrier = barrierCount === 2 && this.getDoubleBarrierContractTypes().has(contractType);
      const isDigitTarget = this.getDigitTargetContractTypes().has(contractType);
      const isDigitRange = this.getDigitRangeContractTypes().has(contractType);
      const removedStaleHelpers =
        (!isSingleBarrier && this.disposeBlockByType("market_barrier")) ||
        (!isDoubleBarrier && this.disposeBlockByType("market_barrier_low")) ||
        (!isDoubleBarrier && this.disposeBlockByType("market_barrier_high")) ||
        (!isDigitTarget && this.disposeBlockByType("market_digits")) ||
        (!isDigitRange && this.disposeBlockByType("market_range"));
      const barrierBlock = isSingleBarrier ? this.ensureBlockByType("market_barrier") : this.findBlockByType("market_barrier");
      const barrierLowBlock = isDoubleBarrier ? this.ensureBlockByType("market_barrier_low") : this.findBlockByType("market_barrier_low");
      const barrierHighBlock = isDoubleBarrier ? this.ensureBlockByType("market_barrier_high") : this.findBlockByType("market_barrier_high");
      const digitTargetBlock = isDigitTarget ? this.ensureBlockByType("market_digits") : this.findBlockByType("market_digits");
      const digitRangeBlock = isDigitRange ? this.ensureBlockByType("market_range") : this.findBlockByType("market_range");
      const visibleChanged =
        removedStaleHelpers ||
        this.setBlockVisibility(barrierBlock, Boolean(barrierBlock && isSingleBarrier)) ||
        this.setBlockVisibility(barrierLowBlock, isDoubleBarrier) ||
        this.setBlockVisibility(barrierHighBlock, isDoubleBarrier) ||
        this.setBlockVisibility(digitTargetBlock, isDigitTarget) ||
        this.setBlockVisibility(digitRangeBlock, isDigitRange);

      const stakeMin = executionDefaults?.min_stake ?? 0.5;
      const stakeMax = executionDefaults?.max_stake ?? 5000;
      const desiredDuration = this.clampNumber(
        executionDefaults?.default_duration ?? 5,
        selectedDurationLimits.min,
        selectedDurationLimits.max,
        5,
      );
      const desiredStake = this.clampNumber(
        stakeMin,
        stakeMin,
        stakeMax,
        stakeMin,
      );

      const syncStakeField = (block: any): void => {
        if (!block) return;
        this.updateNumberFieldBounds(block, "STAKE", {
          min: stakeMin,
          max: stakeMax,
          precision: 0.5,
          defaultValue: desiredStake,
        });
      };

      const syncUnitField = (block: any): string | null => {
        if (!block) return null;
        return this.updateDropdownFieldOptions(
          block,
          "DURATION_UNIT",
          unitOptions,
          resolvedUnit,
          resolvedUnit.toUpperCase(),
        );
      };

      const syncDurationField = (block: any, unitValue: string | null): void => {
        if (!block) return;
        const nextUnit = allowedUnits.includes(unitValue ?? "") ? (unitValue as string) : resolvedUnit;
        const nextLimits =
          executionDefaults?.duration_limits?.[nextUnit] ??
          executionDefaults?.duration_limits?.[resolvedUnit] ??
          selectedDurationLimits;
        this.updateNumberFieldBounds(block, "DURATION", {
          min: nextLimits.min,
          max: nextLimits.max,
          precision: 1,
          defaultValue: this.clampNumber(executionDefaults?.default_duration ?? desiredDuration, nextLimits.min, nextLimits.max, desiredDuration),
        });
      };

      if (executionSettingsBlock) {
        syncStakeField(executionSettingsBlock);
        const unitValue = syncUnitField(executionSettingsBlock);
        syncDurationField(executionSettingsBlock, unitValue);
      }

      if (executionStakeBlock) {
        syncStakeField(executionStakeBlock);
      }

      let unitValue = resolvedUnit;
      if (executionUnitBlock) {
        unitValue = syncUnitField(executionUnitBlock) ?? resolvedUnit;
      }

      if (executionDurationBlock) {
        syncDurationField(executionDurationBlock, unitValue);
      }

      if (barrierBlock && isSingleBarrier) {
        const direction = safeString(executionDefaults?.barrier_direction ?? "positive").toLowerCase();
        const { min: barrierMinAbs, max: barrierMaxAbs } = this.getSingleBarrierBounds(executionDefaults);
        const baseBarrier = this.clampNumber(
          executionDefaults?.barrier_default ?? barrierMinAbs,
          barrierMinAbs,
          barrierMaxAbs,
          barrierMinAbs,
        );
        const defaultBarrier = direction === "negative" ? -Math.abs(baseBarrier) : Math.abs(baseBarrier);
        const barrierMin = direction === "negative" ? -barrierMaxAbs : barrierMinAbs;
        const barrierMax = direction === "negative" ? -barrierMinAbs : barrierMaxAbs;
        this.updateNumberFieldBounds(barrierBlock, "BARRIER_VALUE", {
          min: barrierMin,
          max: barrierMax,
          precision: 0.001,
          defaultValue: defaultBarrier,
        });
      }

      if (barrierLowBlock && barrierHighBlock && isDoubleBarrier) {
        const { lowMin, lowMax, highMin, highMax } = this.getDoubleBarrierBounds(executionDefaults);
        const barrierLowDefault = this.clampNumber(executionDefaults?.barrier_low_default ?? -0.486, lowMin, lowMax, -0.486);
        const barrierHighDefault = this.clampNumber(executionDefaults?.barrier_high_default ?? 0.486, highMin, highMax, 0.486);
        this.updateNumberFieldBounds(barrierLowBlock, "BARRIER_LOW", {
          min: lowMin,
          max: lowMax,
          precision: 0.001,
          defaultValue: barrierLowDefault,
        });
        this.updateNumberFieldBounds(barrierHighBlock, "BARRIER_HIGH", {
          min: highMin,
          max: highMax,
          precision: 0.001,
          defaultValue: barrierHighDefault,
        });
      }

      if (digitTargetBlock && isDigitTarget) {
        const currentOperator = safeString(digitTargetBlock.getFieldValue("DIGIT_OPERATOR") ?? "MATCHES") || "MATCHES";
        const operatorOptions = [
          { label: "Matches", value: "MATCHES" },
          { label: "Differs", value: "DIFFERS" },
          { label: "Even", value: "EVEN" },
          { label: "Odd", value: "ODD" },
          { label: "Over", value: "OVER" },
          { label: "Under", value: "UNDER" },
          { label: "Prime", value: "PRIME" },
          { label: "Non Prime", value: "NON_PRIME" },
        ];
        this.updateDropdownFieldOptions(
          digitTargetBlock,
          "DIGIT_OPERATOR",
          operatorOptions,
          operatorOptions.some((option) => option.value === currentOperator) ? currentOperator : "MATCHES",
          currentOperator,
        );
        const digitTargetBounds = this.getDigitTargetBounds(executionDefaults);
        this.updateNumberFieldBounds(digitTargetBlock, "DIGIT_TARGET", {
          min: digitTargetBounds.min,
          max: digitTargetBounds.max,
          precision: 1,
          defaultValue: digitTargetBounds.defaultValue,
        });
      }

      if (digitRangeBlock && isDigitRange) {
        const usingBarrierDefaults = isDoubleBarrier;
        const digitRangeBounds = this.getDigitRangeBounds(executionDefaults, usingBarrierDefaults);
        this.updateNumberFieldBounds(digitRangeBlock, "RANGE_LOW", {
          min: digitRangeBounds.lowMin,
          max: digitRangeBounds.lowMax,
          precision: 1,
          defaultValue: digitRangeBounds.lowDefault,
        });
        this.updateNumberFieldBounds(digitRangeBlock, "RANGE_HIGH", {
          min: digitRangeBounds.highMin,
          max: digitRangeBounds.highMax,
          precision: 1,
          defaultValue: digitRangeBounds.highDefault,
        });
      }

      if (visibleChanged) {
        this.placeSectionBlocks("execution");
        try {
          this.workspace.render();
          this.workspace.resize();
        } catch (error) {
          console.error("Execution helper visibility sync failed:", error);
        }
      }
    } finally {
      this.syncingContractMetadata = false;
    }
  }

  private normalizeContractTypeRecord(value: unknown): ContractTypeRecord | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    const contractType = safeString(record.contract_type ?? "");
    const contractCategory = safeString(record.contract_category ?? "");
    if (!contractType || !contractCategory) return null;
    return {
      contract_type: contractType,
      contract_display: safeString(record.contract_display ?? contractType) || contractType,
      contract_category: contractCategory,
      contract_category_display: safeString(record.contract_category_display ?? contractCategory) || contractCategory,
      barrier_category: safeString(record.barrier_category ?? ""),
      barriers: typeof record.barriers === "number" ? record.barriers : undefined,
      description: safeString(record.description ?? ""),
    };
  }

  private normalizeContractTypesPayload(
    payload: Record<string, unknown>,
    fallbackSymbol: string | null = null,
  ): { symbol: string; contractTypes: ContractTypeRecord[] } | null {
    const symbol = safeString(payload.symbol ?? payload.underlying_symbol ?? fallbackSymbol ?? "");
    const source = payload.contract_types ?? payload.data ?? payload.message;
    let list: unknown[] = [];
    if (Array.isArray(source)) {
      list = source;
    } else if (source && typeof source === "object" && !Array.isArray(source)) {
      const nested = (source as Record<string, unknown>).contract_types;
      if (Array.isArray(nested)) {
        list = nested;
      }
    }
    const contractTypes = list
      .map((item: unknown) => this.normalizeContractTypeRecord(item))
      .filter((item): item is ContractTypeRecord => Boolean(item));
    if (!symbol) return null;
    return { symbol, contractTypes };
  }

  private normalizeProposalDefaultsRecord(value: unknown): ProposalDefaultsRecord | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    const contractType = safeString(record.contract_type ?? "");
    if (!contractType) return null;

    const durationLimits: Record<string, DurationLimitRecord> = {};
    const rawDurationLimits = record.duration_limits;
    if (rawDurationLimits && typeof rawDurationLimits === "object" && !Array.isArray(rawDurationLimits)) {
      for (const [unit, limit] of Object.entries(rawDurationLimits as Record<string, unknown>)) {
        if (!limit || typeof limit !== "object" || Array.isArray(limit)) continue;
        const nextLimit = limit as Record<string, unknown>;
        const min = this.toFiniteNumber(nextLimit.min);
        const max = this.toFiniteNumber(nextLimit.max);
        if (min != null && max != null) {
          durationLimits[unit] = { min, max };
        }
      }
    }

    return {
      contract_type: contractType,
      allowed_units: Array.isArray(record.allowed_units)
        ? record.allowed_units.map((unit) => safeString(unit)).filter((unit) => Boolean(unit))
        : [],
      default_duration: this.toFiniteNumber(record.default_duration) ?? 5,
      default_duration_unit: safeString(record.default_duration_unit ?? "t") || "t",
      default_stake: this.toFiniteNumber(record.default_stake) ?? 10,
      duration_limits: durationLimits,
      min_stake: this.toFiniteNumber(record.min_stake) ?? 0.5,
      max_stake: this.toFiniteNumber(record.max_stake) ?? 5000,
      barrier_default: this.toFiniteNumber(record.barrier_default) ?? undefined,
      barrier_direction: safeString(record.barrier_direction ?? ""),
      barrier_max: this.toFiniteNumber(record.barrier_max) ?? undefined,
      barrier_min: this.toFiniteNumber(record.barrier_min) ?? undefined,
      barrier_low_default: this.toFiniteNumber(record.barrier_low_default) ?? undefined,
      barrier_high_default: this.toFiniteNumber(record.barrier_high_default) ?? undefined,
      digit_target_min: this.toFiniteNumber(record.digit_target_min) ?? undefined,
      digit_target_max: this.toFiniteNumber(record.digit_target_max) ?? undefined,
      default_digit_target: this.toFiniteNumber(record.default_digit_target) ?? undefined,
      default_digit_low: this.toFiniteNumber(record.default_digit_low) ?? undefined,
      default_digit_high: this.toFiniteNumber(record.default_digit_high) ?? undefined,
      digit_low_min: this.toFiniteNumber(record.digit_low_min) ?? undefined,
      digit_low_max: this.toFiniteNumber(record.digit_low_max) ?? undefined,
      digit_high_min: this.toFiniteNumber(record.digit_high_min) ?? undefined,
      digit_high_max: this.toFiniteNumber(record.digit_high_max) ?? undefined,
      hint: safeString(record.hint ?? ""),
      spot: this.toFiniteNumber(record.spot) ?? undefined,
    };
  }

  private normalizeProposalDefaultsPayload(
    payload: Record<string, unknown>,
    fallbackSymbol: string | null = null,
  ): { symbol: string; defaults: ProposalDefaultsRecord[] } | null {
    const symbol = safeString(payload.symbol ?? payload.underlying_symbol ?? fallbackSymbol ?? "");
    const source = payload.defaults ?? payload.data ?? payload.message;
    let list: unknown[] = [];
    if (Array.isArray(source)) {
      list = source;
    } else if (source && typeof source === "object" && !Array.isArray(source)) {
      const nested = (source as Record<string, unknown>).defaults;
      if (Array.isArray(nested)) {
        list = nested;
      }
    }
    const defaults = list
      .map((item: unknown) => this.normalizeProposalDefaultsRecord(item))
      .filter((item): item is ProposalDefaultsRecord => Boolean(item));
    if (!symbol) return null;
    return { symbol, defaults };
  }

  private handleContractTypesPayload(payload: Record<string, unknown>): void {
    const normalized = this.normalizeContractTypesPayload(
      payload,
      this.getPendingSymbol(this.pendingContractTypeSymbols) ?? this.getSelectedMarketSymbol(),
    );
    if (!normalized) return;

    this.contractTypesBySymbol.set(normalized.symbol, normalized.contractTypes);
    this.pendingContractTypeSymbols.delete(normalized.symbol);
    this.syncExecutionHelperVisibility();
    if (normalized.symbol === this.getSelectedMarketSymbol()) {
      this.syncMarketDropdowns();
    }
  }

  private handleProposalDefaultsPayload(payload: Record<string, unknown>): void {
    const normalized = this.normalizeProposalDefaultsPayload(
      payload,
      this.getPendingSymbol(this.pendingProposalDefaultsSymbols) ?? this.getSelectedMarketSymbol(),
    );
    if (!normalized) return;

    const defaultsByType = new Map<string, ProposalDefaultsRecord>();
    for (const record of normalized.defaults) {
      defaultsByType.set(record.contract_type, record);
    }

    this.proposalDefaultsBySymbol.set(normalized.symbol, defaultsByType);
    this.pendingProposalDefaultsSymbols.delete(normalized.symbol);
    this.syncExecutionHelperVisibility();
    if (normalized.symbol === this.getSelectedMarketSymbol()) {
      this.syncMarketDropdowns();
    }
  }

  private requestContractTypesForSymbol(symbol: string): void {
    const nextSymbol = symbol.trim() || DEFAULT_SYMBOL;
    if (nextSymbol.startsWith("__loading")) return;
    if (this.pendingContractTypeSymbols.has(nextSymbol)) return;
    if (wsService.requestContractTypes(nextSymbol)) {
      this.pendingContractTypeSymbols.add(nextSymbol);
    }
  }

  private requestProposalDefaultsForSymbol(symbol: string): void {
    const nextSymbol = symbol.trim() || DEFAULT_SYMBOL;
    if (nextSymbol.startsWith("__loading")) return;
    if (this.pendingProposalDefaultsSymbols.has(nextSymbol)) return;
    if (wsService.requestProposalDefaults(nextSymbol)) {
      this.pendingProposalDefaultsSymbols.add(nextSymbol);
    }
  }

  private updateDropdownFieldOptions(
    block: any,
    fieldName: string,
    options: Array<{ label: string; value: string }>,
    preferredValue?: string | null,
    preferredLabel?: string | null,
    preserveCurrentValue = true,
  ): string | null {
    if (!block || !Array.isArray(options)) return null;

    const field = block.getField?.(fieldName);
    if (!field) return null;

    const optionMap = new Map<string, string>();
    const pushOption = (label: string, value: string): void => {
      const nextLabel = label.trim();
      const nextValue = value.trim();
      if (!nextLabel || !nextValue || optionMap.has(nextValue)) return;
      optionMap.set(nextValue, nextLabel);
    };

    if (preferredValue) {
      pushOption(preferredLabel ?? preferredValue, preferredValue);
    }

    const currentValue = safeString(block.getFieldValue(fieldName));
    if (preserveCurrentValue && currentValue && currentValue !== preferredValue) {
      pushOption(currentValue, currentValue);
    }

    for (const option of options) {
      pushOption(option.label, option.value);
    }

    const fieldAny = field as any;
    const normalizedOptions = Array.from(optionMap.entries()).map(([value, label]) => [label, value] as [string, string]);
    if (normalizedOptions.length === 0) return null;

    fieldAny.menuGenerator_ = normalizedOptions;
    fieldAny.generatedOptions = null;

    const validValues = new Set(normalizedOptions.map((option) => option[1]));
    const nextValue = preferredValue && validValues.has(preferredValue)
      ? preferredValue
      : validValues.has(currentValue)
        ? currentValue
        : normalizedOptions[0][1];

    if (nextValue !== currentValue) {
      block.setFieldValue(nextValue, fieldName);
    }

    return nextValue;
  }

  private clampNumber(value: unknown, min: number | null | undefined, max: number | null | undefined, fallback: number): number {
    const numeric = this.toFiniteNumber(value) ?? fallback;
    const nextMin = min ?? numeric;
    const nextMax = max ?? numeric;
    return Math.min(nextMax, Math.max(nextMin, numeric));
  }

  private updateNumberFieldBounds(
    block: any,
    fieldName: string,
    bounds: { min?: number; max?: number; precision?: number; defaultValue?: number } = {},
  ): number | null {
    if (!block || typeof block.getField !== "function") return null;
    const field = block.getField(fieldName);
    if (!field) return null;

    const fieldAny = field as any;
    if (bounds.min != null) fieldAny.min_ = bounds.min;
    if (bounds.max != null) fieldAny.max_ = bounds.max;
    if (bounds.precision != null) fieldAny.precision_ = bounds.precision;
    if (bounds.defaultValue != null) fieldAny.value_ = bounds.defaultValue;

    const currentValue = this.toFiniteNumber(block.getFieldValue(fieldName));
    const nextValue = this.clampNumber(
      currentValue ?? bounds.defaultValue ?? 0,
      bounds.min,
      bounds.max,
      bounds.defaultValue ?? 0,
    );

    if (currentValue == null || nextValue !== currentValue) {
      block.setFieldValue(String(nextValue), fieldName);
    }

    return nextValue;
  }

  private getPendingSymbol(pendingSymbols: Set<string>): string | null {
    return pendingSymbols.values().next().value ?? null;
  }

  private validatePayloadAgainstMetadata(payload: Record<string, unknown>): string[] {
    const errors: string[] = [];
    const contractType = String(payload.contract_type ?? this.getSelectedContractType()).trim().toUpperCase();
    const symbol = String(payload.symbol ?? this.getSelectedMarketSymbol()).trim() || DEFAULT_SYMBOL;
    const defaults = this.getProposalDefaultsRecordForSymbol(symbol, contractType);
    const contractRecord = this.getContractTypeRecordForSymbol(symbol, contractType);

    if (!defaults) {
      errors.push("Contract metadata is still loading. Click Connect and wait for symbols to refresh.");
      return errors;
    }

    const stake = this.toFiniteNumber(payload.stake);
    if (stake == null) {
      errors.push("Stake is required.");
    } else if (stake < defaults.min_stake || stake > defaults.max_stake) {
      errors.push(`Stake must be between ${defaults.min_stake} and ${defaults.max_stake}.`);
    }

    const durationUnit = String(payload.duration_unit ?? defaults.default_duration_unit ?? "t").trim();
    if (!defaults.allowed_units.includes(durationUnit)) {
      errors.push(`Duration unit must be one of: ${defaults.allowed_units.join(", ")}.`);
    }
    const durationLimits =
      defaults.duration_limits[durationUnit] ??
      defaults.duration_limits[defaults.default_duration_unit] ??
      null;
    const duration = this.toFiniteNumber(payload.duration);
    if (duration == null) {
      errors.push("Duration is required.");
    } else if (durationLimits && (duration < durationLimits.min || duration > durationLimits.max)) {
      errors.push(`Duration must be between ${durationLimits.min} and ${durationLimits.max} for unit ${durationUnit}.`);
    }

    const barrierCategory = safeString(contractRecord?.barrier_category ?? "").trim().toLowerCase();
    const barrierCount = contractRecord?.barriers ?? 0;
    const isSingleBarrier = barrierCategory !== "none" && barrierCount === 1 && this.getSingleBarrierContractTypes().has(contractType);
    const isDoubleBarrier = barrierCategory !== "none" && barrierCount === 2 && this.getDoubleBarrierContractTypes().has(contractType);
    const isDigitTarget = this.isDigitContractCategory(contractRecord) && this.getDigitTargetContractTypes().has(contractType);
    const isDigitRange = this.isDigitContractCategory(contractRecord) && this.getDigitRangeContractTypes().has(contractType);

    if (isSingleBarrier) {
      const barrier = this.toFiniteNumber(payload.barrier);
      if (barrier == null) {
        errors.push(`Barrier is required for ${contractType}.`);
      } else {
        const direction = safeString(defaults.barrier_direction ?? "positive").toLowerCase();
        const { min: barrierMinAbs, max: barrierMaxAbs } = this.getSingleBarrierBounds(defaults);
        const barrierMin = direction === "negative" ? -barrierMaxAbs : barrierMinAbs;
        const barrierMax = direction === "negative" ? -barrierMinAbs : barrierMaxAbs;
        const low = Math.min(barrierMin, barrierMax);
        const high = Math.max(barrierMin, barrierMax);
        if (barrier < low || barrier > high) {
          errors.push(`Barrier must be between ${low} and ${high}.`);
        }
      }
    }

    if (isDoubleBarrier) {
      const barrierLow = this.toFiniteNumber(payload.barrier_low);
      const barrierHigh = this.toFiniteNumber(payload.barrier_high);
      const { lowMin, lowMax, highMin, highMax } = this.getDoubleBarrierBounds(defaults);
      if (barrierLow == null || barrierHigh == null) {
        errors.push(`Double barrier is required for ${contractType}.`);
      } else {
        if (barrierLow >= barrierHigh) {
          errors.push("Lower barrier must be less than upper barrier.");
        }
        if (barrierLow < Math.min(lowMin, lowMax) || barrierLow > Math.max(lowMin, lowMax)) {
          errors.push(`Lower barrier must be between ${Math.min(lowMin, lowMax)} and ${Math.max(lowMin, lowMax)}.`);
        }
        if (barrierHigh < highMin || barrierHigh > highMax) {
          errors.push(`Upper barrier must be between ${highMin} and ${highMax}.`);
        }
      }
    }

    if (isDigitTarget) {
      const digitTarget = this.toFiniteNumber(payload.digit_target);
      if (digitTarget == null) {
        errors.push(`Digit target is required for ${contractType}.`);
      } else {
        const { min, max } = this.getDigitTargetBounds(defaults);
        if (digitTarget < min || digitTarget > max) {
          errors.push(`Digit target must be between ${min} and ${max}.`);
        }
      }
    }

    if (isDigitRange) {
      const digitLow = this.toFiniteNumber(payload.digit_low);
      const digitHigh = this.toFiniteNumber(payload.digit_high);
      const { lowMin, lowMax, highMin, highMax } = this.getDigitRangeBounds(defaults, false);
      if (digitLow == null || digitHigh == null) {
        errors.push(`Digit range is required for ${contractType}.`);
      } else {
        if (digitLow >= digitHigh) {
          errors.push("Digit low must be less than digit high.");
        }
        if (digitLow < lowMin || digitLow > lowMax) {
          errors.push(`Digit low must be between ${lowMin} and ${lowMax}.`);
        }
        if (digitHigh < highMin || digitHigh > highMax) {
          errors.push(`Digit high must be between ${highMin} and ${highMax}.`);
        }
      }
    }

    return errors;
  }

  private syncMarketDropdowns(): void {
    if (!this.workspace || this.syncingContractMetadata) return;

    this.syncingContractMetadata = true;
    try {
      const symbol = this.getSelectedMarketSymbol();
      const records = this.contractTypesBySymbol.get(symbol) ?? [];
      if (records.length === 0 && wsService.isConnected()) {
        this.requestContractTypesForSymbol(symbol);
      }
      if (!this.proposalDefaultsBySymbol.has(symbol) && wsService.isConnected()) {
        this.requestProposalDefaultsForSymbol(symbol);
      }
      const marketSettingsBlock = this.findBlockByType("market_settings");
      const categoryBlock = this.findBlockByType("market_category");
      const contractBlock = this.findBlockByType("market_contract");
      const currentCategory = this.getSelectedContractCategory();
      const currentContract = this.getSelectedContractType();
      const currentCategoryRecord = this.resolveContractCategoryRecord(records, currentCategory);
      const currentCategoryDisplay = this.getContractCategoryDisplay(currentCategoryRecord) || safeString(currentCategory);

      const categoryOptions = records.length
        ? Array.from(
            new Map(
              records.map((record) => [
                record.contract_category_display || record.contract_category,
                {
                  label: record.contract_category_display || record.contract_category,
                  value: record.contract_category_display || record.contract_category,
                },
              ]),
            ).values(),
          )
            .sort((left, right) => left.label.localeCompare(right.label))
        : [];

      const contractForCurrentType = records.find((record) => record.contract_type === currentContract) ?? null;
      const contractForUpType = records.find((record) => record.contract_type === "UP") ?? null;
      const preferredCategory =
        currentCategoryRecord?.contract_category_display ||
        contractForCurrentType?.contract_category_display ||
        contractForUpType?.contract_category_display ||
        records[0]?.contract_category_display ||
        currentCategoryRecord?.contract_category ||
        contractForCurrentType?.contract_category ||
        contractForUpType?.contract_category ||
        records[0]?.contract_category ||
        currentCategoryDisplay;
      const nextCategory = this.updateDropdownFieldOptions(
        marketSettingsBlock ?? categoryBlock,
        "CONTRACT_CATEGORY",
        categoryOptions,
        preferredCategory,
        preferredCategory,
        false,
      ) ?? preferredCategory;
      this.selectedContractCategory = nextCategory;
      if (categoryBlock && categoryBlock !== marketSettingsBlock) {
        this.updateDropdownFieldOptions(
          categoryBlock,
          "CONTRACT_CATEGORY",
          categoryOptions,
          nextCategory,
          nextCategory,
          false,
        );
      }

      const selectedCategoryRecord =
        this.resolveContractCategoryRecord(records, nextCategory) ?? null;
      const selectedCategoryValue = this.getContractCategoryDisplay(selectedCategoryRecord) || nextCategory;
      const contractOptionSource = records.length
        ? records.filter(
            (record) =>
              record.contract_category_display === selectedCategoryValue ||
              record.contract_category === selectedCategoryValue,
          )
        : [];
      const contractOptions = contractOptionSource.length
        ? Array.from(
            new Map(
              contractOptionSource.map((record) => [
                record.contract_type,
                {
                  label: record.contract_type,
                  value: record.contract_type,
                },
              ]),
            ).values(),
          ).sort((left, right) => left.label.localeCompare(right.label))
        : [];

      const contractOptionsValues = new Set(contractOptions.map((option) => option.value));
      const preferredContract =
        (contractOptionSource.find((record) => record.contract_type === currentContract)?.contract_type ?? "") ||
        (contractOptionSource.find((record) => record.contract_type === "UP")?.contract_type ?? "") ||
        (contractOptionsValues.has(this.selectedContractType) ? this.selectedContractType : "") ||
        currentContract;

      const preferredContractRecord = contractOptionSource.find((record) => record.contract_type === preferredContract) ?? null;
      const nextContract = this.updateDropdownFieldOptions(
        marketSettingsBlock ?? contractBlock,
        "CONTRACT_TYPE",
        contractOptions,
        preferredContract,
        preferredContractRecord?.contract_type || null,
      ) ?? preferredContract;
      this.selectedContractType = nextContract;
      if (contractBlock && contractBlock !== marketSettingsBlock) {
        const selectedRecord = contractOptionSource.find((record) => record.contract_type === nextContract) ?? null;
        this.updateDropdownFieldOptions(
          contractBlock,
          "CONTRACT_TYPE",
          contractOptions,
          nextContract,
          selectedRecord?.contract_type || null,
        );
      }
      this.requestProposalDefaultsForSymbol(symbol);
      this.syncExecutionHelperVisibility();
    } finally {
      this.syncingContractMetadata = false;
    }
  }

  private stopActiveTradeFeed(): void {
    if (!this.subscribedSymbol) return;
    wsService.unsubscribe(this.subscribedSymbol);
    this.subscribedSymbol = null;
  }

  private syncSymbolDropdowns(): void {
    if (!this.workspace || this.syncingContractMetadata) return;

    this.syncingContractMetadata = true;
    try {
      const activeSymbol =
        this.root.querySelector<HTMLSelectElement>("#bb-market-select")?.value.trim() ||
        this.getSelectedMarketSymbol() ||
        DEFAULT_SYMBOL;
      const symbolOptions = this.buildSymbolOptions(this.feedSymbols);

      const blocks = this.workspace.getAllBlocks(false).filter((block: any) => {
        return typeof block?.getField === "function" && typeof block?.getFieldValue === "function" && Boolean(block.getField("SYMBOL"));
      });

      for (const block of blocks) {
        const currentValue = safeString(block.getFieldValue("SYMBOL"));
        const preferred = symbolOptions.find((option) => option.value === activeSymbol) ?? symbolOptions.find((option) => option.value === currentValue) ?? null;
        this.updateDropdownFieldOptions(
          block,
          "SYMBOL",
          symbolOptions,
          preferred?.value || activeSymbol,
          preferred?.label || activeSymbol,
        );
      }
    } finally {
      this.syncingContractMetadata = false;
    }
  }

  private waitForWsEvent<T>(eventName: string, timeoutMs = 20000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error(`Timed out waiting for ${eventName}`));
      }, timeoutMs);

      const cleanup = () => {
        window.clearTimeout(timeout);
        wsService.off(eventName, handler);
        wsService.off("error", handleError);
      };

      const handler = (payload: T) => {
        cleanup();
        resolve(payload);
      };

      const handleError = (error: unknown) => {
        cleanup();
        reject(new Error(this.extractErrorMessage(error, `Failed while waiting for ${eventName}`)));
      };

      wsService.on(eventName, handler);
      wsService.on("error", handleError);
    });
  }

  private async ensureAuthenticated(): Promise<void> {
    if (wsService.isAuthenticated()) return;

    const attempts: Array<{ label: string; token: string }> = [];
    const storedToken = this.getStoredAuthToken();
    if (storedToken) {
      attempts.push({ label: "stored", token: storedToken });
    }

    const injectedToken = this.getInjectedAuthToken();
    if (injectedToken && injectedToken !== storedToken) {
      attempts.push({ label: "injected", token: injectedToken });
    }

    let lastError: unknown = null;
    for (const attempt of attempts) {
      try {
        await this.authenticateWithToken(attempt.token);
        return;
      } catch (error) {
        lastError = error;
        this.appendWsEventLog("auth_failed", {
          source: attempt.label,
          message: this.extractErrorMessage(error, "Authentication failed"),
        });
        if (!this.isAuthFailure(error)) {
          throw error;
        }
        wsService.disconnect();
      }
    }

    try {
      const freshToken = await this.bootstrapAuthToken();
      wsService.disconnect();
      await this.authenticateWithToken(freshToken);
      return;
    } catch (error) {
      if (lastError && this.isAuthFailure(lastError)) {
        throw lastError;
      }
      throw error;
    }
  }

  private createOrderPayload(snapshot: StrategySnapshot): Record<string, unknown> | null {
    if (!snapshot.apiPayload) return null;
    return {
      ...snapshot.apiPayload,
      request: "order_buy",
    };
  }

  private async ensureSymbolSubscription(symbol: string): Promise<void> {
    const nextSymbol = symbol.trim() || DEFAULT_SYMBOL;
    if (this.subscribedSymbol === nextSymbol) return;
    if (this.subscribedSymbol && this.subscribedSymbol !== nextSymbol) {
      wsService.unsubscribe(this.subscribedSymbol);
    }
    wsService.subscribe(nextSymbol);
    this.subscribedSymbol = nextSymbol;
    await new Promise<void>((resolve) => window.setTimeout(resolve, 750));
  }

  private async runLiveTrade(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    await this.ensureAuthenticated();
    const symbol = String(payload.symbol ?? DEFAULT_SYMBOL).trim() || DEFAULT_SYMBOL;
    await this.ensureSymbolSubscription(symbol);

    const orderParams = {
      symbol,
      contract_type: String(payload.contract_type ?? "UP"),
      stake: Number(payload.stake ?? 10),
      duration: Number(payload.duration ?? 5),
      duration_unit: String(payload.duration_unit ?? "t"),
      barrier: payload.barrier as number | undefined,
      barrier_low: payload.barrier_low as number | undefined,
      barrier_high: payload.barrier_high as number | undefined,
      digit_target: payload.digit_target as number | undefined,
      digit_low: payload.digit_low as number | undefined,
      digit_high: payload.digit_high as number | undefined,
    };

    const orderOk = wsService.placeOrder(orderParams);
    if (!orderOk) {
      throw new Error("Failed to place order");
    }

    this.appendWsEventLog("order_sent", orderParams);
    return {
      request: "order_buy",
      type: "order_buy",
      ...orderParams,
      pending: true,
    };
  }

  private getFirstTemplateForGroup(categoryId: string, groupId: string): BlockTemplate | null {
    return this.getVisibleTemplates(categoryId).find((template) => template.groupId === groupId) ?? null;
  }

  private openCategoryModal(categoryId: string, templateType: string | null = null): void {
    this.selectedCategoryId = categoryId;
    this.modalState = { categoryId, templateType: null };
    this.expandedCategoryIds.add(categoryId);
    this.renderCategoryList();
    this.renderModal();
    this.setModalVisible(true);

    const firstTemplate = templateType
      ? BLOCK_TEMPLATES_BY_TYPE.get(templateType)
      : this.getVisibleTemplates(categoryId)[0];
    if (firstTemplate) {
      this.selectTemplate(firstTemplate.type);
    }
  }

  private closeModal(): void {
    this.setModalVisible(false);
  }

  private setModalVisible(visible: boolean): void {
    const modal = this.root.querySelector<HTMLElement>("#bb-modal");
    if (!modal) return;
    modal.classList.toggle("is-open", visible);
    modal.setAttribute("aria-hidden", visible ? "false" : "true");
  }

  private getVisibleTemplates(categoryId: string): BlockTemplate[] {
    return BLOCK_TEMPLATES.filter((template) => template.categoryId === categoryId && !template.hiddenInPalette).sort(
      (left, right) => left.order - right.order || left.title.localeCompare(right.title),
    );
  }

  private renderModal(): void {
    const category = CATEGORY_DEFINITIONS.find((item) => item.id === this.selectedCategoryId) ?? CATEGORY_DEFINITIONS[0];
    if (!category) return;

    const list = this.root.querySelector<HTMLElement>("#bb-modal-list");
    const title = this.root.querySelector<HTMLElement>("#bb-modal-title");
    const summary = this.root.querySelector<HTMLElement>("#bb-modal-summary");
    const kicker = this.root.querySelector<HTMLElement>("#bb-modal-kicker");
    const detail = this.root.querySelector<HTMLElement>("#bb-modal-detail");

    const templates = this.getVisibleTemplates(category.id);
    if (title) title.textContent = `${category.title} blocks`;
    if (summary) summary.textContent = category.summary;
    if (kicker) kicker.textContent = category.title;

    if (list) {
      list.innerHTML = category.groups
        .map((group) => this.renderGroup(group.id, group.title, group.description, templates))
        .join("");
    }

    if (detail && this.modalState.templateType) {
      const template = BLOCK_TEMPLATES_BY_TYPE.get(this.modalState.templateType);
      if (template) {
        detail.innerHTML = this.renderTemplateDetail(template);
        this.bindDetailForm(template);
      }
    } else if (detail) {
      detail.innerHTML = `<div class="bb-modal-empty">Select a block to preview its inputs and insertion settings.</div>`;
    }
  }

  private renderTemplateCard(template: BlockTemplate): string {
    const fieldKinds = template.fields.map((field) => field.kind);
    const chips = fieldKinds.map((kind) => `<span class="bb-chip">${kind}</span>`).join("");
    return `
      <button
        class="bb-template-card ${this.modalState.templateType === template.type ? "is-selected" : ""}"
        type="button"
        data-template="${template.type}"
        data-group="${template.groupId}"
        draggable="true"
        data-action="select-template"
        style="--template-accent:${template.color};"
      >
        <span class="bb-template-title">
          <strong>${template.title}</strong>
          <small>${template.description}</small>
        </span>
        <span class="bb-template-meta">${chips}</span>
      </button>
    `;
  }

  private renderGroup(groupId: string, title: string, description: string, templates: BlockTemplate[]): string {
    const groupTemplates = templates.filter((template) => template.groupId === groupId);
    const cards = groupTemplates.map((template) => this.renderTemplateCard(template)).join("");

    return `
      <section class="bb-group" data-group-panel="${groupId}">
        <header class="bb-group-header">
          <div>
            <h4>${title}</h4>
            <p>${description}</p>
          </div>
        </header>
        <div class="bb-group-grid">
          ${cards || `<div class="bb-group-empty">No blocks in this subgroup.</div>`}
        </div>
      </section>
    `;
  }

  private renderTemplateDetail(template: BlockTemplate): string {
    const draft = this.getDraftValues(template);
    const fields = template.fields.map((field) => this.renderFieldEditor(field, draft[field.name]));

    return `
      <div class="bb-detail-head">
        <div>
          <div class="bb-modal-kicker">${template.categoryId}</div>
          <h4>${template.title}</h4>
          <p>${template.description}</p>
        </div>
        <span class="bb-detail-badge">${template.layout}</span>
      </div>
      <form class="bb-detail-form" data-template-form="${template.type}">
        ${fields.join("")}
        <div class="bb-detail-actions">
          <button type="button" class="bb-btn bb-btn-primary" data-add-template="${template.type}">Add to workspace</button>
          <button type="button" class="bb-btn bb-btn-secondary" data-action="close-modal">Close</button>
        </div>
      </form>
    `;
  }

  private renderFieldEditor(field: FieldDefinition, value: string | number | boolean | undefined): string {
    const current = value ?? field.defaultValue;

    if (field.kind === "radio") {
      const options = (field.options ?? []).map((option) => {
        const checked = String(current) === option.value ? "checked" : "";
        return `
          <label class="bb-radio-option">
            <input type="radio" name="${field.name}" value="${option.value}" ${checked} />
            <span>${option.label}</span>
          </label>
        `;
      }).join("");

      return `
        <div class="bb-field">
          <label>${field.label}</label>
          <div class="bb-radio-group" data-kind="radio" data-field="${field.name}">
            ${options}
          </div>
        </div>
      `;
    }

    if (field.kind === "checkbox") {
      const checked = asBoolean(current) ? "checked" : "";
      return `
        <div class="bb-field">
          <label class="bb-check">
            <input type="checkbox" name="${field.name}" ${checked} />
            <span>${field.label}</span>
          </label>
        </div>
      `;
    }

    if (field.kind === "dropdown") {
      const options = (field.options ?? []).map((option) => {
        const selected = String(current) === option.value ? "selected" : "";
        return `<option value="${option.value}" ${selected}>${option.label}</option>`;
      }).join("");

      return `
        <div class="bb-field">
          <label for="${field.name}">${field.label}</label>
          <select id="${field.name}" name="${field.name}">
            ${options}
          </select>
        </div>
      `;
    }

    if (field.kind === "number") {
      return `
        <div class="bb-field">
          <label for="${field.name}">${field.label}</label>
          <input
            id="${field.name}"
            name="${field.name}"
            type="number"
            value="${current}"
            min="${field.min ?? ""}"
            max="${field.max ?? ""}"
            step="${field.precision ?? 1}"
          />
        </div>
      `;
    }

    return `
      <div class="bb-field">
        <label for="${field.name}">${field.label}</label>
        <input
          id="${field.name}"
          name="${field.name}"
          type="text"
          value="${String(current)}"
          placeholder="${field.placeholder ?? ""}"
        />
      </div>
    `;
  }

  private bindDetailForm(template: BlockTemplate): void {
    const detail = this.root.querySelector<HTMLElement>("#bb-modal-detail");
    const form = detail?.querySelector<HTMLFormElement>(`[data-template-form="${template.type}"]`);
    if (!form) return;

    form.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select").forEach((element) => {
      const handleChange = () => {
        this.refreshDetail(template.type);
      };
      element.addEventListener("change", handleChange);
    });

    const blockCard = this.root.querySelector<HTMLElement>(`[data-template="${template.type}"]`);
    blockCard?.addEventListener("dragstart", (event) => {
      const dataTransfer = (event as DragEvent).dataTransfer;
      if (!dataTransfer) return;
      const values = this.getFormValues(template);
      dataTransfer.setData("application/json", JSON.stringify({ type: template.type, values }));
      dataTransfer.setData("text/plain", template.type);
      dataTransfer.effectAllowed = "copy";
    });
  }

  private refreshDetail(templateType: string): void {
    const template = BLOCK_TEMPLATES_BY_TYPE.get(templateType);
    if (!template) return;
    this.modalState.templateType = templateType;
    const detail = this.root.querySelector<HTMLElement>("#bb-modal-detail");
    if (!detail) return;
    detail.innerHTML = this.renderTemplateDetail(template);
    this.bindDetailForm(template);
  }

  private selectTemplate(templateType: string): void {
    const template = BLOCK_TEMPLATES_BY_TYPE.get(templateType);
    if (!template) return;
    this.modalState.templateType = templateType;
    this.refreshDetail(templateType);
    this.highlightTemplateCard(templateType);
  }

  private highlightTemplateCard(templateType: string): void {
    this.root.querySelectorAll<HTMLElement>("[data-template]").forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.template === templateType);
    });
  }

  private filterModalBlocks(query: string): void {
    const normalized = query.trim().toLowerCase();
    let visibleCount = 0;

    this.root.querySelectorAll<HTMLElement>("[data-template]").forEach((card) => {
      const template = BLOCK_TEMPLATES_BY_TYPE.get(card.dataset.template ?? "");
      if (!template) return;
      const haystack = `${template.title} ${template.description} ${template.fields
        .map((field) => `${field.label} ${field.kind}`)
        .join(" ")}`
        .toLowerCase();
      const visible = haystack.includes(normalized);
      card.style.display = visible ? "" : "none";
      if (visible) visibleCount += 1;
    });

    this.root.querySelectorAll<HTMLElement>("[data-group-panel]").forEach((group) => {
      const cards = Array.from(group.querySelectorAll<HTMLElement>("[data-template]"));
      const hasVisibleCard = cards.some((card) => card.style.display !== "none");
      group.style.display = hasVisibleCard ? "" : "none";
    });

    const count = this.root.querySelector<HTMLElement>("#bb-modal-count");
    if (count) {
      count.textContent = normalized ? `${visibleCount} matched` : `${this.getVisibleTemplates(this.selectedCategoryId).length} templates`;
    }
  }

  private getDraftValues(template: BlockTemplate): Record<string, string | number | boolean> {
    const detail = this.root.querySelector<HTMLElement>("#bb-modal-detail");
    const form = detail?.querySelector<HTMLFormElement>(`[data-template-form="${template.type}"]`);
    if (!form) {
      return template.fields.reduce((acc, field) => {
        acc[field.name] = field.defaultValue;
        return acc;
      }, {} as Record<string, string | number | boolean>);
    }

    return this.getFormValues(template, form);
  }

  private getFormValues(
    template: BlockTemplate,
    formOverride?: HTMLFormElement,
  ): Record<string, string | number | boolean> {
    const detail = this.root.querySelector<HTMLElement>("#bb-modal-detail");
    const form = formOverride ?? detail?.querySelector<HTMLFormElement>(`[data-template-form="${template.type}"]`);
    const values: Record<string, string | number | boolean> = {};

    for (const field of template.fields) {
      if (!form) {
        values[field.name] = field.defaultValue;
        continue;
      }

      if (field.kind === "radio") {
        const selected = form.querySelector<HTMLInputElement>(`input[name="${field.name}"]:checked`);
        values[field.name] = selected?.value ?? String(field.defaultValue);
        continue;
      }

      const element = form.elements.namedItem(field.name) as HTMLInputElement | HTMLSelectElement | null;
      if (!element) {
        values[field.name] = field.defaultValue;
        continue;
      }

      if (field.kind === "checkbox") {
        values[field.name] = (element as HTMLInputElement).checked;
        continue;
      }

      if (field.kind === "number") {
        values[field.name] = Number.parseFloat((element as HTMLInputElement).value || String(field.defaultValue));
        continue;
      }

      values[field.name] = element.value || field.defaultValue;
    }

    return values;
  }

  private insertTemplateFromModal(templateType: string): void {
    const template = BLOCK_TEMPLATES_BY_TYPE.get(templateType);
    if (!template) return;
    this.insertTemplateBlockAt(templateType, this.getDraftValues(template));
    this.closeModal();
  }

  private insertTemplateBlock(templateType: string, values: Record<string, unknown>): void {
    this.insertTemplateBlockAt(templateType, values);
  }

  private insertTemplateBlockAt(
    templateType: string,
    values: Record<string, unknown>,
    clientX?: number,
    clientY?: number,
  ): void {
    if (!this.workspace) return;

    const template = BLOCK_TEMPLATES_BY_TYPE.get(templateType);
    if (!template) return;

    const Blockly = getBlockly();
    const block = this.workspace.newBlock(templateType);
    block.initSvg();
    block.render();

    for (const field of template.fields) {
      const value = values[field.name];
      if (value === undefined || value === null) continue;

      if (field.kind === "checkbox") {
        block.setFieldValue(String(Boolean(value) ? "TRUE" : "FALSE"), field.name);
      } else if (field.kind === "number") {
        block.setFieldValue(String(value), field.name);
      } else {
        block.setFieldValue(String(value), field.name);
      }
    }

    if (typeof clientX === "number" && typeof clientY === "number") {
      this.placeBlockAtWorkspacePoint(block, clientX, clientY);
    } else {
      this.attachBlock(block, template);
    }
    this.refreshAllPanels();
  }

  private placeBlockAtWorkspacePoint(block: any, clientX: number, clientY: number): void {
    if (!this.workspace) return;
    const Blockly = getBlockly();
    const point = Blockly.utils.svgMath.screenToWsCoordinates(this.workspace, { x: clientX, y: clientY });
    const current = block.getRelativeToSurfaceXY?.() ?? { x: 0, y: 0 };
    block.moveBy(point.x - current.x, point.y - current.y);
  }

  private attachBlock(block: any, template: BlockTemplate): void {
    const sectionId = template.sectionId as SectionId | undefined;
    if (!sectionId) {
      block.moveBy(80, 80);
      return;
    }

    const sectionBlock = this.findBlockByType(getSectionBlockType(sectionId));
    if (!sectionBlock) {
      block.moveBy(80, 80);
      return;
    }

    this.placeSectionBlocks(sectionId, [block]);
  }

  private collectSectionBlocksByType(sectionId: SectionId): any[] {
    if (!this.workspace) return [];
    return this.workspace.getAllBlocks(false).filter((block: any) => {
      const template = BLOCK_TEMPLATES_BY_TYPE.get(block.type);
      return Boolean(template && template.sectionId === sectionId && template.serializeInSnapshot !== false);
    });
  }

  private placeSectionBlocks(sectionId: SectionId, extraBlocks: any[] = []): void {
    const sectionBlock = this.findBlockByType(getSectionBlockType(sectionId));
    if (!sectionBlock) return;

    const blocks = [
      ...this.collectSectionBlocksByType(sectionId),
      ...extraBlocks,
    ].filter((block, index, array) => array.findIndex((candidate) => candidate.id === block.id) === index);

    this.placeBlockWithinSection(sectionBlock, blocks, sectionId);
    this.connectSectionBlocks(sectionId, blocks.filter((block) => this.isBlockVisible(block)));
  }

  private placeBlockWithinSection(sectionBlock: any, blocks: any[], sectionId: SectionId): void {
    const anchor = sectionBlock.getRelativeToSurfaceXY?.() ?? { x: 0, y: 0 };
    const startX = anchor.x + 248;
    const startY = anchor.y + 60;
    const rowGap =
      sectionId === "market" ? 108 :
      sectionId === "execution" ? 122 :
      100;

    blocks
      .slice()
      .sort((left, right) => {
        const leftTemplate = BLOCK_TEMPLATES_BY_TYPE.get(left.type);
        const rightTemplate = BLOCK_TEMPLATES_BY_TYPE.get(right.type);
        return (leftTemplate?.order ?? 0) - (rightTemplate?.order ?? 0) || left.type.localeCompare(right.type);
      })
      .forEach((block, index) => {
        const x = startX;
        const y = startY + index * rowGap;

        if (typeof block.moveBy === "function") {
          const current = block.getRelativeToSurfaceXY?.() ?? { x: 0, y: 0 };
          block.moveBy(x - current.x, y - current.y);
        }
      });
  }

  private chainSectionBlocks(blocks: any[]): void {
    if (blocks.length < 2) return;

    for (let index = 0; index < blocks.length - 1; index += 1) {
      const current = blocks[index];
      const next = blocks[index + 1];
      if (current?.nextConnection && next?.previousConnection && !current.nextConnection.isConnected()) {
        current.nextConnection.connect(next.previousConnection);
      }
    }
  }

  private isBlockVisible(block: any): boolean {
    if (!block) return false;
    if (typeof block.isVisible === "function") {
      return Boolean(block.isVisible());
    }
    return true;
  }

  private connectSectionBlocks(sectionId: SectionId, blocks: any[]): void {
    const sectionBlock = this.findBlockByType(getSectionBlockType(sectionId));
    const stackConnection = sectionBlock?.getInput("STACK")?.connection;
    if (!sectionBlock || !stackConnection || blocks.length === 0) return;

    const orderedBlocks = blocks.slice().sort((left, right) => {
      const leftTemplate = BLOCK_TEMPLATES_BY_TYPE.get(left.type);
      const rightTemplate = BLOCK_TEMPLATES_BY_TYPE.get(right.type);
      return (leftTemplate?.order ?? 0) - (rightTemplate?.order ?? 0) || left.type.localeCompare(right.type);
    });

    const visibleBlocks = orderedBlocks.filter((block) => this.isBlockVisible(block));
    if (visibleBlocks.length === 0) return;

    if (stackConnection.isConnected()) {
      stackConnection.disconnect();
    }

    stackConnection.connect(visibleBlocks[0].previousConnection);
    this.chainSectionBlocks(visibleBlocks);
  }

  private findBlockByType(type: string): any | null {
    if (!this.workspace) return null;
    return this.workspace.getAllBlocks(false).find((block: any) => block.type === type) ?? null;
  }

  private ensureBlockByType(type: string): any | null {
    if (!this.workspace) return null;
    const existing = this.findBlockByType(type);
    if (existing) return existing;
    const template = BLOCK_TEMPLATES_BY_TYPE.get(type);
    if (!template) return null;
    const block = this.workspace.newBlock(type);
    block.initSvg();
    block.render();
    this.setBlockVisibility(block, false);
    return block;
  }

  private disposeBlockByType(type: string): boolean {
    const block = this.findBlockByType(type);
    if (!block) return false;
    if (typeof block.dispose === "function") {
      block.dispose(true);
      return true;
    }
    return false;
  }

  private seedWorkspace(resetExisting = false, symbol = DEFAULT_SYMBOL, includeStarterBlocks = true): void {
    if (!this.workspace) return;
    const Blockly = getBlockly();
    const liveSymbol = this.root.querySelector<HTMLSelectElement>("#bb-market-select")?.value?.trim() || symbol;

    if (resetExisting) {
      this.workspace.clear();
    }

    if (this.workspace.getAllBlocks(false).length > 0) {
      return;
    }

    Blockly.Events.disable();
    try {
      const sections: Array<{ id: SectionId; blocks: any[]; height: number }> = [];

      for (const section of [
        { id: "market", height: 660 },
        { id: "execution", height: 880 },
        { id: "indicators", height: 560 },
        { id: "conditions", height: 560 },
        { id: "restart", height: 440 },
        { id: "utility", height: 440 },
      ] as Array<{ id: SectionId; height: number }>) {
        const sectionBlock = this.workspace.newBlock(getSectionBlockType(section.id));
        sectionBlock.initSvg();
        sectionBlock.render();
        sections.push({ id: section.id, blocks: [], height: section.height });
      }

      if (includeStarterBlocks) {
        const marketSettingsBlock = this.workspace.newBlock("market_settings");
        marketSettingsBlock.initSvg();
        marketSettingsBlock.render();
        this.updateDropdownFieldOptions(marketSettingsBlock, "SYMBOL", [], liveSymbol, liveSymbol);
        this.updateDropdownFieldOptions(
          marketSettingsBlock,
          "CONTRACT_CATEGORY",
          [],
          "__loading_contract_categories__",
          "Loading contract categories from server...",
        );
        this.updateDropdownFieldOptions(marketSettingsBlock, "CONTRACT_TYPE", [], "UP", "UP");
        // marketSettingsBlock.setFieldValue("TRUE", "LIVE_SYNC");
        this.selectedContractCategory = "__loading_contract_categories__";
        this.selectedContractType = "UP";

        const executionSettingsBlock = this.workspace.newBlock("execution_settings");
        executionSettingsBlock.initSvg();
        executionSettingsBlock.render();
        executionSettingsBlock.setFieldValue("0.5", "STAKE");
        executionSettingsBlock.setFieldValue("5", "DURATION");
        executionSettingsBlock.setFieldValue("t", "DURATION_UNIT");
        // executionSettingsBlock.setFieldValue("TRUE", "AUTO_RETRY");

        const indicatorsSettingsBlock = this.workspace.newBlock("indicators_settings");
        indicatorsSettingsBlock.initSvg();
        indicatorsSettingsBlock.render();
        this.updateDropdownFieldOptions(indicatorsSettingsBlock, "SYMBOL", [], liveSymbol, liveSymbol);

        const conditionsSettingsBlock = this.workspace.newBlock("conditions_settings");
        conditionsSettingsBlock.initSvg();
        conditionsSettingsBlock.render();

        const restartSettingsBlock = this.workspace.newBlock("restart_settings");
        restartSettingsBlock.initSvg();
        restartSettingsBlock.render();

        const utilitySettingsBlock = this.workspace.newBlock("utility_settings");
        utilitySettingsBlock.initSvg();
        utilitySettingsBlock.render();
        this.syncSymbolDropdowns();

        const marketBlocks = [marketSettingsBlock];
        const executionBlocks = [executionSettingsBlock];
        const indicatorsBlocks = [indicatorsSettingsBlock];
        const conditionsBlocks = [conditionsSettingsBlock];
        const restartBlocks = [restartSettingsBlock];
        const utilityBlocks = [utilitySettingsBlock];
        sections[0].blocks = marketBlocks;
        sections[1].blocks = executionBlocks;
        sections[2].blocks = indicatorsBlocks;
        sections[3].blocks = conditionsBlocks;
        sections[4].blocks = restartBlocks;
        sections[5].blocks = utilityBlocks;
      }

      let yCursor = 116;
      for (const section of sections) {
        const sectionBlock = this.findBlockByType(getSectionBlockType(section.id));
        if (sectionBlock) {
          const current = sectionBlock.getRelativeToSurfaceXY?.() ?? { x: 0, y: 0 };
          sectionBlock.moveBy(72 - current.x, yCursor - current.y);
        }
        if (includeStarterBlocks) {
          this.placeSectionBlocks(section.id, section.blocks);
          this.connectSectionBlocks(section.id, section.blocks);
        }
        yCursor += section.height;
      }

      this.normalizeAllSections();
      this.syncExecutionHelperVisibility();
    } finally {
      Blockly.Events.enable();
    }

    this.workspace.scrollCenter();
  }

  private buildSectionsSnapshot(): SectionSnapshot[] {
    if (!this.workspace) return [];

    return SECTION_DEFINITIONS.map((section) => {
      const blocks = collectSectionBlocks(this.workspace, section.id as SectionId);
      return toSectionSnapshot(section.id as SectionId, blocks);
    });
  }

  private buildStrategySnapshot(): StrategySnapshot {
    const sections = this.buildSectionsSnapshot();
    const allBlocks = sections.flatMap((section) => section.blocks);
    const domain = convertBlocksToSnapshot(allBlocks);
    const apiPayload = createApiPayload(domain as StrategySnapshot);

    return {
      meta: {
        botName: "Volatility Blueprint",
        mode: "draft",
        updatedAt: new Date().toISOString(),
      },
      market: (domain.market as Record<string, unknown> | undefined) ?? null,
      execution: (domain.execution as Record<string, unknown> | undefined) ?? null,
      indicators: (domain.indicators as Array<Record<string, unknown>> | undefined) ?? [],
      conditions: (domain.conditions as StrategySnapshot["conditions"] | undefined) ?? {
        purchase: null,
        sell: null,
        logic: [],
      },
      restart: (domain.restart as StrategySnapshot["restart"] | undefined) ?? {
        onWin: null,
        onLoss: null,
      },
      utility: (domain.utility as StrategySnapshot["utility"] | undefined) ?? {
        variables: [],
        snapshot: null,
      },
      sections,
      apiPayload,
    };
  }

  private normalizeAllSections(): void {
    for (const section of SECTION_DEFINITIONS) {
      this.normalizeSection(section.id as SectionId);
    }
  }

  private normalizeSection(sectionId: SectionId): void {
    this.placeSectionBlocks(sectionId);
  }

  private refreshAllPanels(): void {
    if (!this.workspace) return;

    const snapshot = this.buildStrategySnapshot();
    this.lastSnapshot = snapshot;
    this.strategyXml = this.serializeWorkspaceXml();

    const topbarStatus = this.root.querySelector<HTMLElement>("#bb-topbar-status");
    const statusPill = this.root.querySelector<HTMLElement>("#bb-status-pill");
    const statusCaption = this.root.querySelector<HTMLElement>("#bb-status-caption");
    const jsonEl = this.root.querySelector<HTMLElement>("#bb-strategy-json");
    const payloadEl = this.root.querySelector<HTMLElement>("#bb-payload-json");
    const resultsEl = this.root.querySelector<HTMLElement>("#bb-results");

    const validation = validationService.validateStrategy({
      market: snapshot.market as any,
      execution: snapshot.execution as any,
      conditions: snapshot.conditions as any,
      restart: snapshot.restart as any,
    });
    const payloadValidationErrors = snapshot.apiPayload ? this.validatePayloadAgainstMetadata(snapshot.apiPayload) : ["Build market and execution blocks first."];
    const combinedValidationErrors = [...validation.errors, ...payloadValidationErrors.filter((error) => !validation.errors.includes(error))];
    const combinedWarnings = validation.warnings ?? [];
    const ready = combinedValidationErrors.length === 0;

    if (jsonEl) {
      jsonEl.textContent = formatJson(snapshot);
    }

    if (payloadEl) {
      payloadEl.textContent = snapshot.apiPayload ? formatJson(snapshot.apiPayload) : "// Incomplete strategy";
    }

    if (statusPill) {
      statusPill.className = `bb-status-pill ${ready ? "is-ready" : "is-error"}`;
      statusPill.textContent = ready ? "Ready" : "Needs attention";
    }

    if (topbarStatus) {
      topbarStatus.textContent = ready ? "Ready" : `${combinedValidationErrors.length} issues`;
    }

    if (statusCaption) {
      statusCaption.textContent = ready
        ? combinedWarnings.length
          ? combinedWarnings.join(" ")
          : "Workspace is structurally sound."
        : combinedValidationErrors.join(" ");
    }

    if (resultsEl) {
      resultsEl.innerHTML = ready
        ? `
          <div class="bb-result-ok">Strategy validated successfully.</div>
          <div class="bb-result-meta">
            <div><strong>Bot</strong><span>${snapshot.meta.botName}</span></div>
            <div><strong>Mode</strong><span>${snapshot.meta.mode}</span></div>
            <div><strong>Sections</strong><span>${sectionsSummary(snapshot.sections)}</span></div>
          </div>
        `
        : `
          <div class="bb-result-error">Validation failed.</div>
          <div class="bb-result-list">${combinedValidationErrors.map((error) => `<div>${error}</div>`).join("")}</div>
        `;
    }
  }

  private serializeWorkspaceXml(): string | null {
    if (!this.workspace) return null;
    const Blockly = getBlockly();
    const xmlDom = Blockly.Xml.workspaceToDom(this.workspace);
    return Blockly.Xml.domToText(xmlDom);
  }

  private async runStrategy(): Promise<void> {
    if (!this.lastSnapshot) return;

    const payload = this.createOrderPayload(this.lastSnapshot);
    const payloadValidationErrors = payload ? this.validatePayloadAgainstMetadata(payload) : ["Build market and execution blocks first."];
    const apiValidation = payload
      ? validationService.validateApiPayload(payload)
      : { valid: false, errors: ["Build market and execution blocks first."], warnings: [] };
    const validationErrors = [
      ...payloadValidationErrors,
      ...apiValidation.errors.filter((error) => !payloadValidationErrors.includes(error)),
    ];
    const validation = {
      valid: validationErrors.length === 0,
      errors: validationErrors,
    };
    const statusPill = this.root.querySelector<HTMLElement>("#bb-status-pill");
    const statusCaption = this.root.querySelector<HTMLElement>("#bb-status-caption");
    const resultsEl = this.root.querySelector<HTMLElement>("#bb-results");

    if (!validation.valid) {
      if (statusPill) {
        statusPill.className = "bb-status-pill is-error";
        statusPill.textContent = "Blocked";
      }
      if (statusCaption) {
        statusCaption.textContent = validation.errors.join(" ");
      }
      if (resultsEl) {
        resultsEl.innerHTML = `
          <div class="bb-result-error">Strategy is not ready yet.</div>
          <div class="bb-result-list">${validation.errors.map((error) => `<div>${error}</div>`).join("")}</div>
        `;
      }
      return;
    }

    if (!payload) return;

    if (!wsService.isConnected() || !wsService.isAuthenticated()) {
      const message = "Connect first, then run the strategy.";
      if (statusPill) {
        statusPill.className = "bb-status-pill is-error";
        statusPill.textContent = "Not connected";
      }
      if (statusCaption) {
        statusCaption.textContent = message;
      }
      if (resultsEl) {
        resultsEl.innerHTML = `<div class="bb-result-error">${message}</div>`;
      }
      return;
    }

    if (statusPill) {
      statusPill.className = "bb-status-pill is-ready";
      statusPill.textContent = "Running";
    }
    if (statusCaption) {
      statusCaption.textContent = "Submitting a demo trade over the websocket connection.";
    }
    if (resultsEl) {
      resultsEl.innerHTML = `
        <div class="bb-result-ok">Starting contract lifecycle...</div>
        <div class="bb-result-meta">
          <div><strong>Symbol</strong><span>${safeString(payload?.symbol ?? DEFAULT_SYMBOL)}</span></div>
          <div><strong>Contract</strong><span>${safeString(payload?.contract_type ?? "UP")}</span></div>
          <div><strong>Stake</strong><span>${String(payload?.stake ?? 10)}</span></div>
        </div>
      `;
    }

    this.appendWsEventLog("run", {
      symbol: payload.symbol ?? DEFAULT_SYMBOL,
      contract_type: payload.contract_type ?? "UP",
      duration: payload.duration ?? 5,
      duration_unit: payload.duration_unit ?? "t",
    });

    try {
      this.currentTradeOutcome = null;
      this.currentTradeContractId = null;
      const orderData = await this.runLiveTrade(payload);
      this.currentTradeContractId = this.toTradeId(orderData.contract_id ?? orderData.contractId) ?? null;
      const lifecycle = this.buildTradeLifecycle(payload, orderData);
      this.setCurrentLifecycle(lifecycle, "Demo trade request sent", "Waiting for websocket order, activation, and settlement events.");
      const contractId = this.currentTradeContractId ?? "pending";
      const payout = orderData.payout ?? orderData.profit ?? "n/a";
      const sessionType = orderData.session_type ?? "demo";

      if (statusPill) {
        statusPill.className = "bb-status-pill is-ready";
        statusPill.textContent = "Trade running";
      }
      if (statusCaption) {
        statusCaption.textContent = "Order request sent. Waiting for activation and settlement from the feed.";
      }
      this.updateFeedStatus(`Trade request sent on ${String(sessionType)} account #${contractId}. Payout ${String(payout)}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Trade execution failed";
      if (statusPill) {
        statusPill.className = "bb-status-pill is-error";
        statusPill.textContent = "Error";
      }
      if (statusCaption) {
        statusCaption.textContent = message;
      }
      if (resultsEl) {
        resultsEl.innerHTML = `<div class="bb-result-error">${message}</div>`;
      }
    }
  }

  private async importStrategyFromFile(file: File): Promise<void> {
    if (!this.workspace) return;

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as ImportedSnapshotFile | { json?: ImportedSnapshotFile };
      const snapshot = this.extractSnapshotFromInput(parsed);
      if (!snapshot) {
        throw new Error("The file does not contain a supported strategy snapshot.");
      }

      this.importStrategySnapshot(snapshot);
      const resultsEl = this.root.querySelector<HTMLElement>("#bb-results");
      if (resultsEl) {
        resultsEl.innerHTML = `<div class="bb-result-ok">Imported strategy snapshot from ${file.name}.</div>`;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      const resultsEl = this.root.querySelector<HTMLElement>("#bb-results");
      if (resultsEl) {
        resultsEl.innerHTML = `<div class="bb-result-error">${message}</div>`;
      }
    }
  }

  private extractSnapshotFromInput(value: ImportedSnapshotFile | { json?: ImportedSnapshotFile } | null): ImportedSnapshotFile | null {
    if (!value || typeof value !== "object") return null;
    if ("meta" in value && "sections" in value) {
      return value as ImportedSnapshotFile;
    }
    if ("json" in value && value.json && typeof value.json === "object") {
      return value.json as ImportedSnapshotFile;
    }
    if ("snapshot" in value && value.snapshot && typeof value.snapshot === "object") {
      return value.snapshot as ImportedSnapshotFile;
    }
    return null;
  }

  private importStrategySnapshot(snapshot: ImportedSnapshotFile): void {
    if (!this.workspace) return;
    const Blockly = getBlockly();

    Blockly.Events.disable();
    try {
      this.workspace.clear();
      this.seedWorkspace(true, DEFAULT_SYMBOL, false);

      const marketSelect = this.root.querySelector<HTMLSelectElement>("#bb-market-select");
      if (marketSelect && snapshot.market && typeof snapshot.market === "object") {
        const symbol = safeString((snapshot.market as Record<string, unknown>).symbol ?? DEFAULT_SYMBOL);
        if (symbol) {
          marketSelect.value = symbol;
          const marketSettingsBlock = this.findBlockByType("market_settings");
          const marketSymbolBlock = this.findBlockByType("market_symbol");
          if (marketSettingsBlock) {
            this.updateDropdownFieldOptions(marketSettingsBlock, "SYMBOL", [], symbol, symbol);
          }
          if (marketSymbolBlock) {
            this.updateDropdownFieldOptions(marketSymbolBlock, "SYMBOL", [], symbol, symbol);
          }
        }
      }
      void this.requestContractTypesForSymbol(this.getSelectedMarketSymbol());
      this.syncMarketDropdowns();

      const sectionMap = new Map<SectionId, any>();
      for (const section of SECTION_DEFINITIONS) {
        const sectionBlock = this.findBlockByType(getSectionBlockType(section.id as SectionId));
        if (sectionBlock) {
          sectionMap.set(section.id as SectionId, sectionBlock);
        }
      }

      for (const section of snapshot.sections ?? []) {
        const sectionId = section.id as SectionId;
        if (!sectionMap.get(sectionId)) continue;

        const importedBlocks = (section.blocks ?? [])
          .map((block, index) => ({ block, index }))
          .sort((left, right) => {
            const leftTemplate = BLOCK_TEMPLATES_BY_TYPE.get(left.block.type);
            const rightTemplate = BLOCK_TEMPLATES_BY_TYPE.get(right.block.type);
            return (leftTemplate?.order ?? 0) - (rightTemplate?.order ?? 0) || left.index - right.index;
          })
          .map(({ block }) => this.createBlockFromSerialized(block));

        this.placeSectionBlocks(sectionId, importedBlocks);
        this.connectSectionBlocks(sectionId, importedBlocks);
      }

      this.normalizeAllSections();
      this.syncExecutionHelperVisibility();
      this.refreshAllPanels();
    } finally {
      Blockly.Events.enable();
    }
  }

  private createBlockFromSerialized(block: SerializedBlock): any {
    const template = BLOCK_TEMPLATES_BY_TYPE.get(block.type);
    if (!template || !this.workspace) {
      throw new Error(`Unsupported block type in import: ${block.type}`);
    }

    const newBlock = this.workspace.newBlock(block.type);
    newBlock.initSvg();
    newBlock.render();

    for (const field of template.fields) {
      const value = block.values[field.name];
      if (value === undefined || value === null) continue;
      if (field.kind === "checkbox") {
        newBlock.setFieldValue(String(Boolean(value) ? "TRUE" : "FALSE"), field.name);
      } else {
        newBlock.setFieldValue(String(value), field.name);
      }
    }

    return newBlock;
  }

  private exportStrategy(): void {
    const snapshot = this.lastSnapshot ?? this.buildStrategySnapshot();
    const blob = new Blob([formatJson(snapshot)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `strategy_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  private saveStrategy(): void {
    if (!this.workspace || !this.lastSnapshot) return;
    const name = window.prompt("Strategy name", this.lastSnapshot.meta.botName || "My Strategy");
    if (!name) return;

    const xml = this.strategyXml ?? this.serializeWorkspaceXml() ?? "";
    const data = {
      name,
      xml,
      json: this.lastSnapshot,
      payload: this.lastSnapshot.apiPayload,
      timestamp: new Date().toISOString(),
      version: "3.0.0",
    };

    const result = storageService.saveStrategy(name, data as any);
    const resultsEl = this.root.querySelector<HTMLElement>("#bb-results");
    if (resultsEl) {
      resultsEl.innerHTML = result.success
        ? `<div class="bb-result-ok">Saved strategy "${name}".</div>`
        : `<div class="bb-result-error">${result.error ?? "Save failed"}</div>`;
    }
  }

  private loadStrategy(): void {
    if (!this.workspace) return;
    const strategies = storageService.getAllStrategies();
    if (strategies.length === 0) {
      window.alert("No saved strategies found.");
      return;
    }

    const name = window.prompt("Load strategy", strategies[0]);
    if (!name) return;

    const result = storageService.loadStrategy(name);
    if (!result.success || !result.data?.xml) {
      window.alert(`Strategy "${name}" could not be loaded.`);
      return;
    }

    const Blockly = getBlockly();
    const xmlDom = Blockly.Xml.textToDom(result.data.xml);
    this.workspace.clear();
    Blockly.Xml.domToWorkspace(xmlDom, this.workspace);
    this.refreshAllPanels();
  }

  private clearWorkspace(): void {
    if (!this.workspace) return;
    const confirmClear = window.confirm("Clear the workspace and restore the scaffold?");
    if (!confirmClear) return;
    this.workspace.clear();
    this.seedWorkspace(true, DEFAULT_SYMBOL);
    this.refreshAllPanels();
  }

  private handleResize = (): void => {
    if (!this.workspace) return;
    try {
      this.workspace.resize();
      this.workspace.render();
    } catch (error) {
      console.error("Workspace resize failed:", error);
    }
  };
}

function sectionsSummary(sections: SectionSnapshot[]): string {
  return sections
    .filter((section) => section.blocks.length > 0)
    .map((section) => `${section.title}:${section.blocks.length}`)
    .join(", ") || "No blocks";
}

export default BotBuilderApp;
