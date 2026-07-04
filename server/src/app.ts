/**
 * Bot Builder App
 *
 * Custom Blockly workspace with a bespoke category browser, modal palette,
 * and JSON-driven block templates.
 */

import { storageService } from "./services/storage";
import { validationService } from "./services/validation";
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
      message1: "Bot name %1",
      args1: [buildFieldJson(template.fields[0])],
      message2: "Mode %1",
      args2: [buildFieldJson(template.fields[1])],
      message3: "Market %1  Execution %2",
      args3: [marketInput, executionInput],
      message4: "Indicators %1  Conditions %2",
      args4: [indicatorsInput, conditionsInput],
      message5: "Restart %1  Utility %2",
      args5: [restartInput, utilityInput],
      colour: template.color,
      hat: "cap",
      inputsInline: true,
    };
  }

  if (template.layout === "section") {
    return {
      message0: template.title,
      message1: "Drop blocks here %1",
      args1: [{ type: "input_statement", name: "STACK" }],
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

function convertBlocksToSnapshot(blocks: SerializedBlock[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const marketKind = firstBlockByType(blocks, "market_kind");
  const marketSymbol = firstBlockByType(blocks, "market_symbol");
  const marketCategory = firstBlockByType(blocks, "market_category");
  const marketContract = firstBlockByType(blocks, "market_contract");
  const marketSync = firstBlockByType(blocks, "market_sync");
  const marketSettings = firstBlockByType(blocks, "market_settings");
  const marketBarrier = firstBlockByType(blocks, "market_barrier");
  const marketDigits = firstBlockByType(blocks, "market_digits");
  const marketRange = firstBlockByType(blocks, "market_range");

  if (marketKind || marketSymbol || marketCategory || marketContract || marketSync || marketSettings || marketBarrier || marketDigits || marketRange) {
    const values = {
      ...(marketSettings?.values ?? {}),
      ...(marketKind?.values ?? {}),
      ...(marketSymbol?.values ?? {}),
      ...(marketCategory?.values ?? {}),
      ...(marketContract?.values ?? {}),
      ...(marketSync?.values ?? {}),
      ...(marketBarrier?.values ?? {}),
      ...(marketDigits?.values ?? {}),
      ...(marketRange?.values ?? {}),
    };

    result.market = {
      symbol: safeString(values.SYMBOL ?? DEFAULT_SYMBOL),
      category: safeString(values.CONTRACT_CATEGORY ?? "path_independent"),
      contractType: safeString(values.CONTRACT_TYPE ?? "UP"),
      marketKind: safeString(values.MARKET_KIND ?? "derived"),
      liveSync: asBoolean(values.LIVE_SYNC ?? true),
      barrier: values.BARRIER_ENABLED === false ? undefined : asNumber(values.BARRIER_VALUE ?? 2.5, 2.5),
      barrierDirection: safeString(values.BARRIER_DIRECTION ?? "above"),
      barrierMode: safeString(values.BARRIER_MODE ?? "single"),
      digitTarget: values.DIGIT_LOCK === false ? undefined : asNumber(values.DIGIT_TARGET ?? 5, 5),
      digitOperator: safeString(values.DIGIT_OPERATOR ?? "MATCHES"),
      digitLow: asNumber(values.DIGIT_LOW ?? 3, 3),
      digitHigh: asNumber(values.DIGIT_HIGH ?? 6, 6),
      digitInclusive: asBoolean(values.DIGIT_INCLUSIVE ?? true),
    };
  }

  const executionStake = firstBlockByType(blocks, "execution_stake");
  const executionDuration = firstBlockByType(blocks, "execution_duration");
  const executionUnit = firstBlockByType(blocks, "execution_unit");
  const executionRetry = firstBlockByType(blocks, "execution_retry");
  const executionSettings = firstBlockByType(blocks, "execution_settings");
  const executionRisk = firstBlockByType(blocks, "execution_risk");
  const executionWindow = firstBlockByType(blocks, "execution_window");

  if (executionStake || executionDuration || executionUnit || executionRetry || executionSettings || executionRisk || executionWindow) {
    const values = {
      ...(executionStake?.values ?? {}),
      ...(executionDuration?.values ?? {}),
      ...(executionUnit?.values ?? {}),
      ...(executionRetry?.values ?? {}),
      ...(executionSettings?.values ?? {}),
      ...(executionRisk?.values ?? {}),
      ...(executionWindow?.values ?? {}),
    };

    result.execution = {
      stake: asNumber(values.STAKE ?? 10, 10),
      duration: asNumber(values.DURATION ?? 5, 5),
      durationUnit: safeString(values.DURATION_UNIT ?? "t"),
      autoRetry: asBoolean(values.AUTO_RETRY ?? true),
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
  const indicators: Array<Record<string, unknown>> = [];

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

  result.indicators = indicators;

  const purchaseCondition = firstBlockByType(blocks, "purchase_condition");
  const sellCondition = firstBlockByType(blocks, "sell_condition");
  const logicGate = firstBlockByType(blocks, "logic_gate");

  result.conditions = {
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

  result.restart = {
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

  result.utility = {
    variables,
    snapshot: firstBlockByType(blocks, "strategy_snapshot")
      ? {
          snapshotName: safeString(firstBlockByType(blocks, "strategy_snapshot")?.values.SNAPSHOT_NAME ?? "Strategy Snapshot"),
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
  const payload: Record<string, unknown> = {
    request: "proposal",
    symbol: market.symbol ?? DEFAULT_SYMBOL,
    contract_type: market.contractType ?? "UP",
    stake: execution.stake ?? 10,
    duration: execution.duration ?? 5,
    duration_unit: execution.durationUnit ?? "t",
  };

  if (typeof market.barrier === "number") {
    payload.barrier = market.barrier;
  }

  if (typeof market.barrierMode === "string" && market.barrierMode === "double") {
    const barrierValue = typeof market.barrier === "number" ? market.barrier : 0;
    payload.barrier_low = -Math.abs(barrierValue);
    payload.barrier_high = Math.abs(barrierValue);
  }

  if (typeof market.digitTarget === "number") {
    payload.digit_target = market.digitTarget;
  }

  if (typeof market.digitLow === "number") {
    payload.digit_low = market.digitLow;
  }

  if (typeof market.digitHigh === "number") {
    payload.digit_high = market.digitHigh;
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
  private strategyXml: string | null = null;
  private lastSnapshot: StrategySnapshot | null = null;
  private readonly listeners: Array<() => void> = [];

  constructor(target: string | HTMLElement = "#app") {
    this.root = resolveTarget(target);
  }

  public init(): void {
    if (this.initialized) return;

    this.renderShell();
    this.registerBlocks();
    this.initBlockly();
    this.bindUi();
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
                <option value="VIX_100">Volatility 100 Index</option>
                <option value="VIX_50">Volatility 50 Index</option>
                <option value="VIX_25">Volatility 25 Index</option>
                <option value="VIX_75">Volatility 75 Index</option>
              </select>
            </label>
          </div>
          <div class="bb-topbar-actions">
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

          <!--
          <aside class="bb-inspector">
            <section class="bb-card">
              <div class="bb-card-title">Status</div>
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

            <section class="bb-card bb-tip-card">
              <div class="bb-card-title">Tip</div>
              <p>Start with Market and Execution, then add Conditions or Indicators if you need extra guards.</p>
            </section>
          </aside>
          -->
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

    this.workspace.addChangeListener(() => {
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

      if (action === "run") this.runStrategy();
      if (action === "export") this.exportStrategy();
      if (action === "save") this.saveStrategy();
      if (action === "load") this.loadStrategy();
      if (action === "clear") this.clearWorkspace();
      if (action === "import-json") jsonImportInput?.click();
    });

    marketSelect?.addEventListener("change", () => {
      if (!this.workspace) return;
      const marketBlock = this.findBlockByType("market_symbol");
      if (marketBlock) {
        marketBlock.setFieldValue(marketSelect.value, "SYMBOL");
      }
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
  }

  private placeBlockWithinSection(sectionBlock: any, blocks: any[], sectionId: SectionId): void {
    const anchor = sectionBlock.getRelativeToSurfaceXY?.() ?? { x: 0, y: 0 };
    const isWide = sectionId === "market" || sectionId === "execution";
    const columns = isWide ? 2 : 1;
    const startX = anchor.x + 16;
    const startY = anchor.y + 56;
    const columnGap = isWide ? 238 : 0;
    const rowGap = 70;

    blocks
      .slice()
      .sort((left, right) => {
        const leftTemplate = BLOCK_TEMPLATES_BY_TYPE.get(left.type);
        const rightTemplate = BLOCK_TEMPLATES_BY_TYPE.get(right.type);
        return (leftTemplate?.order ?? 0) - (rightTemplate?.order ?? 0) || left.type.localeCompare(right.type);
      })
      .forEach((block, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const x = startX + col * columnGap;
        const y = startY + row * rowGap;

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

  private connectSectionBlocks(sectionId: SectionId, blocks: any[]): void {
    const sectionBlock = this.findBlockByType(getSectionBlockType(sectionId));
    const stackConnection = sectionBlock?.getInput("STACK")?.connection;
    if (!sectionBlock || !stackConnection || blocks.length === 0) return;

    const orderedBlocks = blocks.slice().sort((left, right) => {
      const leftTemplate = BLOCK_TEMPLATES_BY_TYPE.get(left.type);
      const rightTemplate = BLOCK_TEMPLATES_BY_TYPE.get(right.type);
      return (leftTemplate?.order ?? 0) - (rightTemplate?.order ?? 0) || left.type.localeCompare(right.type);
    });

    if (stackConnection.isConnected()) {
      stackConnection.disconnect();
    }

    stackConnection.connect(orderedBlocks[0].previousConnection);
    this.chainSectionBlocks(orderedBlocks);
  }

  private findBlockByType(type: string): any | null {
    if (!this.workspace) return null;
    return this.workspace.getAllBlocks(false).find((block: any) => block.type === type) ?? null;
  }

  private seedWorkspace(resetExisting = false, symbol = DEFAULT_SYMBOL, includeStarterBlocks = true): void {
    if (!this.workspace) return;
    const Blockly = getBlockly();

    if (resetExisting) {
      this.workspace.clear();
    }

    if (this.workspace.getAllBlocks(false).length > 0) {
      return;
    }

    Blockly.Events.disable();
    try {
      const root = this.workspace.newBlock("strategy_root");
      root.initSvg();
      root.render();
      root.moveBy(40, 40);
      root.setFieldValue("Volatility Blueprint", "BOT_NAME");
      root.setFieldValue("draft", "MODE");

      const sections: Array<{ id: SectionId; x: number; y: number }> = [
        { id: "market", x: 88, y: 116 },
        { id: "execution", x: 468, y: 116 },
        { id: "indicators", x: 88, y: 456 },
        { id: "conditions", x: 468, y: 456 },
        { id: "restart", x: 88, y: 792 },
        { id: "utility", x: 468, y: 792 },
      ];

      for (const section of sections) {
        const sectionBlock = this.workspace.newBlock(getSectionBlockType(section.id));
        sectionBlock.initSvg();
        sectionBlock.render();
        sectionBlock.moveBy(section.x, section.y);

        const input = root.getInput(getSectionInputName(section.id));
        if (input?.connection?.isConnected()) {
          input.connection.disconnect();
        }
        if (input?.connection) {
          input.connection.connect(sectionBlock.previousConnection);
        }
      }

      if (includeStarterBlocks) {
        const marketKindBlock = this.workspace.newBlock("market_kind");
        marketKindBlock.initSvg();
        marketKindBlock.render();
        marketKindBlock.setFieldValue("derived", "MARKET_KIND");

        const marketSymbolBlock = this.workspace.newBlock("market_symbol");
        marketSymbolBlock.initSvg();
        marketSymbolBlock.render();
        marketSymbolBlock.setFieldValue(symbol, "SYMBOL");

        const marketCategoryBlock = this.workspace.newBlock("market_category");
        marketCategoryBlock.initSvg();
        marketCategoryBlock.render();
        marketCategoryBlock.setFieldValue("path_independent", "CONTRACT_CATEGORY");

        const marketContractBlock = this.workspace.newBlock("market_contract");
        marketContractBlock.initSvg();
        marketContractBlock.render();
        marketContractBlock.setFieldValue("UP", "CONTRACT_TYPE");

        const marketSyncBlock = this.workspace.newBlock("market_sync");
        marketSyncBlock.initSvg();
        marketSyncBlock.render();
        marketSyncBlock.setFieldValue("TRUE", "LIVE_SYNC");

        const executionStakeBlock = this.workspace.newBlock("execution_stake");
        executionStakeBlock.initSvg();
        executionStakeBlock.render();
        executionStakeBlock.setFieldValue("10", "STAKE");

        const executionDurationBlock = this.workspace.newBlock("execution_duration");
        executionDurationBlock.initSvg();
        executionDurationBlock.render();
        executionDurationBlock.setFieldValue("5", "DURATION");

        const executionUnitBlock = this.workspace.newBlock("execution_unit");
        executionUnitBlock.initSvg();
        executionUnitBlock.render();
        executionUnitBlock.setFieldValue("t", "DURATION_UNIT");

        const executionRetryBlock = this.workspace.newBlock("execution_retry");
        executionRetryBlock.initSvg();
        executionRetryBlock.render();
        executionRetryBlock.setFieldValue("TRUE", "AUTO_RETRY");

        const marketBlocks = [
          marketKindBlock,
          marketSymbolBlock,
          marketCategoryBlock,
          marketContractBlock,
          marketSyncBlock,
        ];
        const executionBlocks = [
          executionStakeBlock,
          executionDurationBlock,
          executionUnitBlock,
          executionRetryBlock,
        ];

        this.placeSectionBlocks("market", marketBlocks);
        this.placeSectionBlocks("execution", executionBlocks);
        this.connectSectionBlocks("market", marketBlocks);
        this.connectSectionBlocks("execution", executionBlocks);
      }

      this.normalizeAllSections();
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
    const root = this.findBlockByType("strategy_root");
    const botName = root ? safeString(root.getFieldValue("BOT_NAME") ?? "Volatility Blueprint") : "Volatility Blueprint";
    const mode = root ? safeString(root.getFieldValue("MODE") ?? "draft") : "draft";
    const domain = convertBlocksToSnapshot(allBlocks);
    const apiPayload = createApiPayload(domain as StrategySnapshot);

    return {
      meta: {
        botName,
        mode,
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

    if (jsonEl) {
      jsonEl.textContent = formatJson(snapshot);
    }

    if (payloadEl) {
      payloadEl.textContent = snapshot.apiPayload ? formatJson(snapshot.apiPayload) : "// Incomplete strategy";
    }

    const ready = validation.valid;
    if (statusPill) {
      statusPill.className = `bb-status-pill ${ready ? "is-ready" : "is-error"}`;
      statusPill.textContent = ready ? "Ready" : "Needs attention";
    }

    if (topbarStatus) {
      topbarStatus.textContent = ready ? "Ready" : `${validation.errors.length} issues`;
    }

    if (statusCaption) {
      statusCaption.textContent = ready
        ? validation.warnings?.length
          ? validation.warnings.join(" ")
          : "Workspace is structurally sound."
        : validation.errors.join(" ");
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
          <div class="bb-result-list">${validation.errors.map((error) => `<div>${error}</div>`).join("")}</div>
        `;
    }
  }

  private serializeWorkspaceXml(): string | null {
    if (!this.workspace) return null;
    const Blockly = getBlockly();
    const xmlDom = Blockly.Xml.workspaceToDom(this.workspace);
    return Blockly.Xml.domToText(xmlDom);
  }

  private runStrategy(): void {
    if (!this.lastSnapshot) return;

    const payload = this.lastSnapshot.apiPayload;
    const validation = payload
      ? validationService.validateApiPayload(payload)
      : { valid: false, errors: ["Build market and execution blocks first."], warnings: [] };
    const statusPill = this.root.querySelector<HTMLElement>("#bb-status-pill");
    const statusCaption = this.root.querySelector<HTMLElement>("#bb-status-caption");
    const resultsEl = this.root.querySelector<HTMLElement>("#bb-results");

    if (validation.valid) {
      if (statusPill) {
        statusPill.className = "bb-status-pill is-ready";
        statusPill.textContent = "Ready";
      }
      if (statusCaption) {
        statusCaption.textContent = "Payload JSON is ready for copy or export.";
      }
      if (resultsEl) {
        resultsEl.innerHTML = `
          <div class="bb-result-ok">Offline preview ready.</div>
          <div class="bb-result-meta">
            <div><strong>Payload</strong><span>Valid JSON</span></div>
            <div><strong>Symbol</strong><span>${safeString(payload?.symbol ?? DEFAULT_SYMBOL)}</span></div>
            <div><strong>Contract</strong><span>${safeString(payload?.contract_type ?? "UP")}</span></div>
          </div>
        `;
      }
    } else {
      if (statusPill) {
        statusPill.className = "bb-status-pill is-error";
        statusPill.textContent = "Blocked";
      }
      if (statusCaption) {
        statusCaption.textContent = validation.errors.join(" ");
      }
      if (resultsEl) {
        resultsEl.innerHTML = `
          <div class="bb-result-error">Offline preview unavailable yet.</div>
          <div class="bb-result-list">${validation.errors.map((error) => `<div>${error}</div>`).join("")}</div>
        `;
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

      const root = this.findBlockByType("strategy_root");
      if (root) {
        root.setFieldValue(snapshot.meta?.botName ?? "Volatility Blueprint", "BOT_NAME");
        root.setFieldValue(snapshot.meta?.mode ?? "draft", "MODE");
      }

      const marketSelect = this.root.querySelector<HTMLSelectElement>("#bb-market-select");
      if (marketSelect && snapshot.market && typeof snapshot.market === "object") {
        const symbol = safeString((snapshot.market as Record<string, unknown>).symbol ?? DEFAULT_SYMBOL);
        if (symbol) {
          marketSelect.value = symbol;
        }
      }

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
