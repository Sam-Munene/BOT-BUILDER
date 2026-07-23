export type FieldOption = {
  label: string;
  value: string;
};

export type FieldKind = "text" | "number" | "dropdown" | "checkbox" | "radio";

export type FieldDefinition = {
  kind: FieldKind;
  name: string;
  label: string;
  defaultValue: string | number | boolean;
  options?: FieldOption[];
  min?: number;
  max?: number;
  precision?: number;
  placeholder?: string;
};

export type BlockLayout = "root" | "section" | "statement";

export type BlockGroupDefinition = {
  id: string;
  title: string;
  description: string;
};

export type BlockTemplate = {
  type: string;
  title: string;
  description: string;
  categoryId: string;
  groupId: string;
  order: number;
  color: string;
  layout: BlockLayout;
  sectionId?: string;
  hiddenInPalette?: boolean;
  serializeInSnapshot?: boolean;
  fields: FieldDefinition[];
};

export type SectionDefinition = {
  id: string;
  title: string;
  summary: string;
  accent: string;
};

export type CategoryDefinition = {
  id: string;
  title: string;
  summary: string;
  accent: string;
  sectionId: string;
  groups: BlockGroupDefinition[];
};

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    id: "market",
    title: "Market",
    summary: "Pick the market, symbol, contract family, and barrier logic.",
    accent: "#2146d0",
  },
  {
    id: "execution",
    title: "Execution",
    summary: "Control stake, duration, and trade pacing.",
    accent: "#179b6d",
  },
  {
    id: "indicators",
    title: "Indicators",
    summary: "Attach indicator-based guards and filters.",
    accent: "#2146d0",
  },
  {
    id: "conditions",
    title: "Conditions",
    summary: "Define purchase and sell rules for the strategy.",
    accent: "#2146d0",
  },
  {
    id: "restart",
    title: "Restart",
    summary: "Set how the bot should restart after a win or loss.",
    accent: "#2146d0",
  },
  {
    id: "utility",
    title: "Utility",
    summary: "Store variables and connection details.",
    accent: "#334155",
  },
];

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = SECTION_DEFINITIONS.map((section) => ({
  id: section.id,
  title: section.title,
  summary: section.summary,
  accent: section.accent,
  sectionId: section.id,
  groups:
    section.id === "market"
      ? [
          { id: "trade_setup", title: "Trade Setup", description: "Choose the market and contract identity." },
          { id: "barriers", title: "Barriers", description: "Configure single or double barriers." },
          { id: "digits", title: "Digits", description: "Specify target digits and ranges." },
        ]
      : section.id === "execution"
        ? [
            { id: "trade_controls", title: "Trade Controls", description: "Set stake and duration basics." },
            { id: "barriers", title: "Barriers", description: "Configure single and double barrier controls." },
            { id: "digits", title: "Digits", description: "Configure digit target and range controls." },
            { id: "risk", title: "Risk", description: "Tune stop loss and take profit limits." },
            { id: "timing", title: "Timing", description: "Shape trade window behavior." },
          ]
        : section.id === "indicators"
          ? [
              { id: "sources", title: "Indicator Source", description: "Pick the raw indicator source." },
              { id: "comparisons", title: "Comparisons", description: "Turn indicator values into filters." },
            ]
          : section.id === "conditions"
            ? [
                { id: "entries", title: "Entry Rules", description: "Conditions for opening trades." },
                { id: "exits", title: "Exit Rules", description: "Conditions for closing or reversing." },
                { id: "logic", title: "Logic", description: "Glue conditions together." },
              ]
            : section.id === "restart"
              ? [
                  { id: "recovery", title: "Recovery", description: "Restart behavior after outcomes." },
                ]
              : [
                  { id: "overview", title: "Overview", description: "Strategy-level metadata and snapshot controls." },
                  { id: "state", title: "State", description: "Local variables and stored values." },
                  { id: "snapshots", title: "Snapshots", description: "Capture and export the current JSON state." },
                ],
}));

export const SYMBOL_OPTIONS: FieldOption[] = [
  { label: "Loading symbols from server...", value: "__loading_symbols__" },
];

export const MARKET_KIND_OPTIONS: FieldOption[] = [
  { label: "Derived", value: "derived" },
  { label: "Forex", value: "forex" },
  { label: "Crypto", value: "crypto" },
];

export const CONTRACT_CATEGORY_OPTIONS: FieldOption[] = [
  { label: "Loading contract categories from server...", value: "__loading_contract_categories__" },
];

export const CONTRACT_TYPE_OPTIONS: FieldOption[] = [
  { label: "Loading contract types from server...", value: "__loading_contract_types__" },
];

export const DURATION_UNIT_OPTIONS: FieldOption[] = [
  { label: "Ticks", value: "t" },
  { label: "Seconds", value: "s" },
  { label: "Minutes", value: "m" },
];

export const BOOLEAN_RADIO_OPTIONS: FieldOption[] = [
  { label: "Yes", value: "TRUE" },
  { label: "No", value: "FALSE" },
];

export const COMPARISON_OPTIONS: FieldOption[] = [
  { label: "Greater than", value: "GT" },
  { label: "Less than", value: "LT" },
  { label: "Equals", value: "EQ" },
  { label: "Not equal", value: "NEQ" },
];

export const INDICATOR_OPTIONS: FieldOption[] = [
  { label: "RSI", value: "rsi" },
  { label: "SMA", value: "sma" },
  { label: "EMA", value: "ema" },
  { label: "MACD", value: "macd" },
];

export const CONDITION_OPTIONS: FieldOption[] = [
  { label: "Always", value: "ALWAYS" },
  { label: "Price above", value: "PRICE_GT" },
  { label: "Price below", value: "PRICE_LT" },
  { label: "Tick count", value: "TICK_COUNT" },
  { label: "Last digit", value: "DIGIT_LAST" },
];

export const BLOCK_TEMPLATES: BlockTemplate[] = [
  {
    type: "strategy_root",
    title: "Strategy Blueprint",
    description: "Anchors the complete bot strategy and keeps each section organized.",
    categoryId: "utility",
    groupId: "overview",
    order: 10,
    color: "#0f172a",
    layout: "root",
    hiddenInPalette: true,
    fields: [],
  },
  {
    type: "market_section",
    title: "Market",
    description: "The market scaffold where all market-specific blocks are collected.",
    categoryId: "market",
    groupId: "sections",
    order: 0,
    color: "#2146d0",
    layout: "section",
    sectionId: "market",
    hiddenInPalette: true,
    serializeInSnapshot: false,
    fields: [],
  },
  {
    type: "execution_section",
    title: "Execution",
    description: "The execution scaffold for stake and duration blocks.",
    categoryId: "execution",
    groupId: "sections",
    order: 0,
    color: "#179b6d",
    layout: "section",
    sectionId: "execution",
    hiddenInPalette: true,
    serializeInSnapshot: false,
    fields: [],
  },
  {
    type: "indicators_section",
    title: "Indicators",
    description: "The indicators scaffold for technical filters.",
    categoryId: "indicators",
    groupId: "sections",
    order: 0,
    color: "#64748b",
    layout: "section",
    sectionId: "indicators",
    hiddenInPalette: true,
    serializeInSnapshot: false,
    fields: [],
  },
  {
    type: "conditions_section",
    title: "Conditions",
    description: "The conditions scaffold for purchase and sell rules.",
    categoryId: "conditions",
    groupId: "sections",
    order: 0,
    color: "#64748b",
    layout: "section",
    sectionId: "conditions",
    hiddenInPalette: true,
    serializeInSnapshot: false,
    fields: [],
  },
  {
    type: "restart_section",
    title: "Restart",
    description: "The restart scaffold for win and loss recovery logic.",
    categoryId: "restart",
    groupId: "sections",
    order: 0,
    color: "#64748b",
    layout: "section",
    sectionId: "restart",
    hiddenInPalette: true,
    serializeInSnapshot: false,
    fields: [],
  },
  {
    type: "utility_section",
    title: "Utility",
    description: "The utility scaffold for variables and integration details.",
    categoryId: "utility",
    groupId: "sections",
    order: 0,
    color: "#334155",
    layout: "section",
    sectionId: "utility",
    hiddenInPalette: true,
    serializeInSnapshot: false,
    fields: [],
  },
  {
    type: "market_kind",
    title: "Market Type",
    description: "Pick the market family for the strategy.",
    categoryId: "market",
    groupId: "trade_setup",
    order: 10,
    color: "#2146d0",
    layout: "statement",
    sectionId: "market",
    hiddenInPalette: true,
    fields: [
      {
        kind: "radio",
        name: "MARKET_KIND",
        label: "Market type",
        defaultValue: "derived",
        options: MARKET_KIND_OPTIONS,
      },
    ],
  },
  {
    type: "market_symbol",
    title: "Symbol",
    description: "Choose the symbol to trade.",
    categoryId: "market",
    groupId: "trade_setup",
    order: 20,
    color: "#2146d0",
    layout: "statement",
    sectionId: "market",
    fields: [
      {
        kind: "dropdown",
        name: "SYMBOL",
        label: "Symbol",
        defaultValue: "VIX_100",
        options: SYMBOL_OPTIONS,
      },
    ],
  },
  {
    type: "market_category",
    title: "Contract Category",
    description: "Select the contract family.",
    categoryId: "market",
    groupId: "trade_setup",
    order: 30,
    color: "#2146d0",
    layout: "statement",
    sectionId: "market",
    fields: [
      {
        kind: "dropdown",
        name: "CONTRACT_CATEGORY",
        label: "Contract category",
        defaultValue: "__loading_contract_categories__",
        options: CONTRACT_CATEGORY_OPTIONS,
      },
    ],
  },
  {
    type: "market_contract",
    title: "Contract Type",
    description: "Pick the contract direction or digit type.",
    categoryId: "market",
    groupId: "trade_setup",
    order: 40,
    color: "#2146d0",
    layout: "statement",
    sectionId: "market",
    fields: [
      {
        kind: "dropdown",
        name: "CONTRACT_TYPE",
        label: "Contract type",
        defaultValue: "UP",
        options: CONTRACT_TYPE_OPTIONS,
      },
    ],
  },
  // {
  //   type: "market_sync",
  //   title: "Sync Workspace",
  //   description: "Keep workspace data synced for offline snapshots.",
  //   categoryId: "market",
  //   groupId: "trade_setup",
  //   order: 50,
  //   color: "#2146d0",
  //   layout: "statement",
  //   sectionId: "market",
  //   hiddenInPalette: true,
  //   fields: [
  //     {
  //       kind: "checkbox",
  //       name: "LIVE_SYNC",
  //       label: "Sync workspace data",
  //       defaultValue: true,
  //     },
  //   ],
  // },
  {
    type: "market_settings",
    title: "Market Settings",
    description: "Choose the symbol, market family, and the main contract family.",
    categoryId: "market",
    groupId: "trade_setup",
    order: 10,
    color: "#2146d0",
    layout: "statement",
    sectionId: "market",
    hiddenInPalette: true,
    serializeInSnapshot: true,
    fields: [
      {
        kind: "dropdown",
        name: "SYMBOL",
        label: "Symbol",
        defaultValue: "VIX_100",
        options: SYMBOL_OPTIONS,
      },
      {
        kind: "dropdown",
        name: "CONTRACT_CATEGORY",
        label: "Contract category",
        defaultValue: "__loading_contract_categories__",
        options: CONTRACT_CATEGORY_OPTIONS,
      },
      {
        kind: "dropdown",
        name: "CONTRACT_TYPE",
        label: "Contract type",
        defaultValue: "UP",
        options: CONTRACT_TYPE_OPTIONS,
      },
      // {
      //   kind: "checkbox",
      //   name: "LIVE_SYNC",
      //   label: "Sync workspace data",
      //   defaultValue: true,
      // },
    ],
  },
  {
    type: "market_barrier",
    title: "Barrier",
    description: "Configure the single barrier value for the selected contract.",
    categoryId: "execution",
    groupId: "barriers",
    order: 20,
    color: "#179b6d",
    layout: "statement",
    sectionId: "execution",
    hiddenInPalette: true,
    fields: [
      {
        kind: "number",
        name: "BARRIER_VALUE",
        label: "Barrier",
        defaultValue: 0.199,
        min: 0.001,
        max: 100,
        precision: 0.001,
      },
    ],
  },
  {
    type: "market_barrier_low",
    title: "Barrier Low",
    description: "Configure the lower barrier value for the selected contract.",
    categoryId: "execution",
    groupId: "barriers",
    order: 21,
    color: "#179b6d",
    layout: "statement",
    sectionId: "execution",
    hiddenInPalette: true,
    fields: [
      {
        kind: "number",
        name: "BARRIER_LOW",
        label: "Barrier low",
        defaultValue: -0.486,
        min: -100,
        max: -0.001,
        precision: 0.001,
      },
    ],
  },
  {
    type: "market_barrier_high",
    title: "Barrier High",
    description: "Configure the upper barrier value for the selected contract.",
    categoryId: "execution",
    groupId: "barriers",
    order: 22,
    color: "#179b6d",
    layout: "statement",
    sectionId: "execution",
    hiddenInPalette: true,
    fields: [
      {
        kind: "number",
        name: "BARRIER_HIGH",
        label: "Barrier high",
        defaultValue: 0.486,
        min: 0.001,
        max: 100,
        precision: 0.001,
      },
    ],
  },
  {
    type: "market_digits",
    title: "Digit Target",
    description: "Choose the digit contract operator and target.",
    categoryId: "execution",
    groupId: "digits",
    order: 30,
    color: "#179b6d",
    layout: "statement",
    sectionId: "execution",
    hiddenInPalette: true,
    fields: [
      {
        kind: "dropdown",
        name: "DIGIT_OPERATOR",
        label: "Operator",
        defaultValue: "MATCHES",
        options: [
          { label: "Matches", value: "MATCHES" },
          { label: "Differs", value: "DIFFERS" },
          { label: "Even", value: "EVEN" },
          { label: "Odd", value: "ODD" },
          { label: "Over", value: "OVER" },
          { label: "Under", value: "UNDER" },
          { label: "Prime", value: "PRIME" },
          { label: "Non Prime", value: "NON_PRIME" },
        ],
      },
      {
        kind: "number",
        name: "DIGIT_TARGET",
        label: "Target",
        defaultValue: 5,
        min: 0,
        max: 9,
        precision: 1,
      },
    ],
  },
  {
    type: "market_range",
    title: "Range Values",
    description: "Specify low and high values for range-based contracts.",
    categoryId: "execution",
    groupId: "digits",
    order: 40,
    color: "#179b6d",
    layout: "statement",
    sectionId: "execution",
    hiddenInPalette: true,
    fields: [
      {
        kind: "number",
        name: "RANGE_LOW",
        label: "Low",
        defaultValue: 3,
        min: 0,
        max: 8,
        precision: 1,
      },
      {
        kind: "number",
        name: "RANGE_HIGH",
        label: "High",
        defaultValue: 6,
        min: 1,
        max: 9,
        precision: 1,
      },
    ],
  },
  {
    type: "execution_stake",
    title: "Stake",
    description: "Set the trade stake.",
    categoryId: "execution",
    groupId: "trade_controls",
    order: 10,
    color: "#179b6d",
    layout: "statement",
    sectionId: "execution",
    fields: [
      {
        kind: "number",
        name: "STAKE",
        label: "Stake",
        defaultValue: 10,
        min: 0.5,
        max: 50000,
        precision: 0.5,
      },
    ],
  },
  {
    type: "execution_duration",
    title: "Duration",
    description: "Set the trade duration.",
    categoryId: "execution",
    groupId: "trade_controls",
    order: 20,
    color: "#179b6d",
    layout: "statement",
    sectionId: "execution",
    fields: [
      {
        kind: "number",
        name: "DURATION",
        label: "Duration",
        defaultValue: 5,
        min: 1,
        max: 1000,
        precision: 1,
      },
    ],
  },
  {
    type: "execution_unit",
    title: "Duration Unit",
    description: "Choose the trade duration unit.",
    categoryId: "execution",
    groupId: "trade_controls",
    order: 15,
    color: "#179b6d",
    layout: "statement",
    sectionId: "execution",
    fields: [
      {
        kind: "dropdown",
        name: "DURATION_UNIT",
        label: " Duration Unit",
        defaultValue: "t",
        options: DURATION_UNIT_OPTIONS,
      },
    ],
  },
  // {
  //   type: "execution_retry",
  //   title: "Auto Retry",
  //   description: "Enable or disable automatic retry.",
  //   categoryId: "execution",
  //   groupId: "trade_controls",
  //   order: 40,
  //   color: "#179b6d",
  //   layout: "statement",
  //   sectionId: "execution",
  //   hiddenInPalette: true,
  //   fields: [
  //     {
  //       kind: "checkbox",
  //       name: "AUTO_RETRY",
  //       label: "Auto retry",
  //       defaultValue: true,
  //     },
  //   ],
  // },
  {
    type: "execution_settings",
    title: "Execution Settings",
    description: "Set the trade stake, duration, and duration unit.",
    categoryId: "execution",
    groupId: "trade_controls",
    order: 10,
    color: "#179b6d",
    layout: "statement",
    sectionId: "execution",
    hiddenInPalette: true,
    serializeInSnapshot: true,
    fields: [
      {
        kind: "number",
        name: "STAKE",
        label: "Stake",
        defaultValue: 10,
        min: 0.5,
        max: 50000,
        precision: 0.5,
      },
      {
        kind: "dropdown",
        name: "DURATION_UNIT",
        label: "Duration Unit",
        defaultValue: "t",
        options: DURATION_UNIT_OPTIONS,
      },
      {
        kind: "number",
        name: "DURATION",
        label: "Duration",
        defaultValue: 5,
        min: 1,
        max: 1000,
        precision: 1,
      },
    ],
  },
  {
    type: "execution_risk",
    title: "Risk Controls",
    description: "Define stop loss, take profit, and position limits.",
    categoryId: "execution",
    groupId: "risk",
    order: 20,
    color: "#179b6d",
    layout: "statement",
    sectionId: "execution",
    fields: [
      {
        kind: "number",
        name: "STOP_LOSS",
        label: "Stop loss %",
        defaultValue: 5,
        min: 0,
        max: 100,
        precision: 0.5,
      },
      {
        kind: "number",
        name: "TAKE_PROFIT",
        label: "Take profit %",
        defaultValue: 10,
        min: 0,
        max: 100,
        precision: 0.5,
      },
      {
        kind: "number",
        name: "MAX_STAKES",
        label: "Max stakes",
        defaultValue: 3,
        min: 1,
        max: 20,
        precision: 1,
      },
      {
        kind: "checkbox",
        name: "LOCK_AFTER_LOSS",
        label: "Lock after loss",
        defaultValue: false,
      },
    ],
  },
  {
    type: "execution_window",
    title: "Trade Window",
    description: "Choose how the trade window should start.",
    categoryId: "execution",
    groupId: "timing",
    order: 30,
    color: "#179b6d",
    layout: "statement",
    sectionId: "execution",
    fields: [
      {
        kind: "radio",
        name: "WINDOW_MODE",
        label: "Start mode",
        defaultValue: "immediate",
        options: [
          { label: "Immediate", value: "immediate" },
          { label: "Scheduled", value: "scheduled" },
        ],
      },
      {
        kind: "text",
        name: "WINDOW_LABEL",
        label: "Label",
        defaultValue: "Primary execution window",
        placeholder: "Primary execution window",
      },
    ],
  },
  {
    type: "indicator_rule",
    title: "Indicator Rule",
    description: "Attach an indicator with a period and symbol filter.",
    categoryId: "indicators",
    groupId: "sources",
    order: 10,
    color: "#64748b",
    layout: "statement",
    sectionId: "indicators",
    fields: [
      {
        kind: "dropdown",
        name: "INDICATOR",
        label: "Indicator",
        defaultValue: "rsi",
        options: INDICATOR_OPTIONS,
      },
      {
        kind: "number",
        name: "PERIOD",
        label: "Period",
        defaultValue: 14,
        min: 1,
        max: 200,
        precision: 1,
      },
      {
        kind: "dropdown",
        name: "SYMBOL",
        label: "Symbol",
        defaultValue: "VIX_100",
        options: SYMBOL_OPTIONS,
      },
      {
        kind: "checkbox",
        name: "ACTIVE",
        label: "Active",
        defaultValue: true,
      },
    ],
  },
  {
    type: "indicator_compare",
    title: "Indicator Compare",
    description: "Compare an indicator output against a threshold.",
    categoryId: "indicators",
    groupId: "comparisons",
    order: 20,
    color: "#64748b",
    layout: "statement",
    sectionId: "indicators",
    fields: [
      {
        kind: "dropdown",
        name: "LEFT",
        label: "Left side",
        defaultValue: "indicator",
        options: [
          { label: "Indicator", value: "indicator" },
          { label: "Price", value: "price" },
          { label: "Tick count", value: "tick_count" },
        ],
      },
      {
        kind: "dropdown",
        name: "OPERATOR",
        label: "Operator",
        defaultValue: "GT",
        options: COMPARISON_OPTIONS,
      },
      {
        kind: "number",
        name: "THRESHOLD",
        label: "Threshold",
        defaultValue: 50,
        min: 0,
        max: 1000,
        precision: 1,
      },
    ],
  },
  {
    type: "indicators_settings",
    title: "Indicators Settings",
    description: "Capture the default indicator state for the section.",
    categoryId: "indicators",
    groupId: "sources",
    order: 5,
    color: "#64748b",
    layout: "statement",
    sectionId: "indicators",
    hiddenInPalette: true,
    serializeInSnapshot: true,
    fields: [
      {
        kind: "dropdown",
        name: "INDICATOR",
        label: "Indicator",
        defaultValue: "rsi",
        options: INDICATOR_OPTIONS,
      },
      {
        kind: "number",
        name: "PERIOD",
        label: "Period",
        defaultValue: 14,
        min: 1,
        max: 200,
        precision: 1,
      },
      {
        kind: "dropdown",
        name: "SYMBOL",
        label: "Symbol",
        defaultValue: "VIX_100",
        options: SYMBOL_OPTIONS,
      },
      {
        kind: "checkbox",
        name: "ACTIVE",
        label: "Active",
        defaultValue: true,
      },
      {
        kind: "dropdown",
        name: "LEFT",
        label: "Left side",
        defaultValue: "indicator",
        options: [
          { label: "Indicator", value: "indicator" },
          { label: "Price", value: "price" },
          { label: "Tick count", value: "tick_count" },
        ],
      },
      {
        kind: "dropdown",
        name: "OPERATOR",
        label: "Operator",
        defaultValue: "GT",
        options: COMPARISON_OPTIONS,
      },
      {
        kind: "number",
        name: "THRESHOLD",
        label: "Threshold",
        defaultValue: 50,
        min: 0,
        max: 1000,
        precision: 1,
      },
    ],
  },
  {
    type: "conditions_settings",
    title: "Conditions Settings",
    description: "Capture the default purchase, sell, and logic state.",
    categoryId: "conditions",
    groupId: "entries",
    order: 5,
    color: "#64748b",
    layout: "statement",
    sectionId: "conditions",
    hiddenInPalette: true,
    serializeInSnapshot: true,
    fields: [
      {
        kind: "dropdown",
        name: "PURCHASE_TRIGGER",
        label: "Purchase trigger",
        defaultValue: "ALWAYS",
        options: CONDITION_OPTIONS,
      },
      {
        kind: "text",
        name: "PURCHASE_VALUE",
        label: "Purchase value",
        defaultValue: "100",
        placeholder: "100",
      },
      {
        kind: "checkbox",
        name: "PURCHASE_INVERT",
        label: "Invert purchase",
        defaultValue: false,
      },
      {
        kind: "dropdown",
        name: "SELL_TRIGGER",
        label: "Sell trigger",
        defaultValue: "ALWAYS",
        options: CONDITION_OPTIONS,
      },
      {
        kind: "text",
        name: "SELL_VALUE",
        label: "Sell value",
        defaultValue: "100",
        placeholder: "100",
      },
      {
        kind: "checkbox",
        name: "SELL_INVERT",
        label: "Invert sell",
        defaultValue: false,
      },
      {
        kind: "dropdown",
        name: "LOGIC_OPERATOR",
        label: "Logic operator",
        defaultValue: "AND",
        options: [
          { label: "AND", value: "AND" },
          { label: "OR", value: "OR" },
        ],
      },
      {
        kind: "checkbox",
        name: "LOGIC_NEGATE",
        label: "Negate logic",
        defaultValue: false,
      },
    ],
  },
  {
    type: "restart_settings",
    title: "Restart Settings",
    description: "Capture the default restart behavior for wins and losses.",
    categoryId: "restart",
    groupId: "recovery",
    order: 5,
    color: "#64748b",
    layout: "statement",
    sectionId: "restart",
    hiddenInPalette: true,
    serializeInSnapshot: true,
    fields: [
      {
        kind: "number",
        name: "WIN_RESET_STAKE",
        label: "Win reset stake",
        defaultValue: 10,
        min: 0.5,
        max: 50000,
        precision: 0.5,
      },
      {
        kind: "checkbox",
        name: "WIN_ENABLE",
        label: "Enable on win",
        defaultValue: true,
      },
      {
        kind: "number",
        name: "LOSS_RESET_STAKE",
        label: "Loss reset stake",
        defaultValue: 10,
        min: 0.5,
        max: 50000,
        precision: 0.5,
      },
      {
        kind: "checkbox",
        name: "LOSS_ENABLE",
        label: "Enable on loss",
        defaultValue: true,
      },
    ],
  },
  {
    type: "utility_settings",
    title: "Utility Settings",
    description: "Capture the default variable and snapshot state.",
    categoryId: "utility",
    groupId: "state",
    order: 5,
    color: "#334155",
    layout: "statement",
    sectionId: "utility",
    hiddenInPalette: true,
    serializeInSnapshot: true,
    fields: [
      {
        kind: "text",
        name: "VAR_NAME",
        label: "Name",
        defaultValue: "myVar",
        placeholder: "myVar",
      },
      {
        kind: "text",
        name: "VAR_VALUE",
        label: "Value",
        defaultValue: "0",
        placeholder: "0",
      },
      {
        kind: "checkbox",
        name: "PERSIST",
        label: "Persist",
        defaultValue: false,
      },
      // {
      //   kind: "text",
      //   name: "SNAPSHOT_NAME",
      //   label: "Snapshot name",
      //   defaultValue: "Strategy Snapshot",
      //   placeholder: "Strategy Snapshot",
      // },
      {
        kind: "dropdown",
        name: "SNAPSHOT_SCOPE",
        label: "Scope",
        defaultValue: "full",
        options: [
          { label: "Full", value: "full" },
          { label: "Sections only", value: "sections" },
          { label: "Config only", value: "config" },
        ],
      },
      {
        kind: "checkbox",
        name: "INCLUDE_META",
        label: "Include meta",
        defaultValue: true,
      },
    ],
  },
  {
    type: "purchase_condition",
    title: "Purchase Condition",
    description: "Define when a buy or rise trade should be opened.",
    categoryId: "conditions",
    groupId: "entries",
    order: 10,
    color: "#64748b",
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "dropdown",
        name: "TRIGGER",
        label: "Trigger",
        defaultValue: "ALWAYS",
        options: CONDITION_OPTIONS,
      },
      {
        kind: "text",
        name: "VALUE",
        label: "Value",
        defaultValue: "100",
        placeholder: "100",
      },
      {
        kind: "checkbox",
        name: "INVERT",
        label: "Invert",
        defaultValue: false,
      },
    ],
  },
  {
    type: "sell_condition",
    title: "Sell Condition",
    description: "Define when a sell or fall trade should be opened.",
    categoryId: "conditions",
    groupId: "exits",
    order: 20,
    color: "#64748b",
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "dropdown",
        name: "TRIGGER",
        label: "Trigger",
        defaultValue: "ALWAYS",
        options: CONDITION_OPTIONS,
      },
      {
        kind: "text",
        name: "VALUE",
        label: "Value",
        defaultValue: "100",
        placeholder: "100",
      },
      {
        kind: "checkbox",
        name: "INVERT",
        label: "Invert",
        defaultValue: false,
      },
    ],
  },
  {
    type: "logic_gate",
    title: "Logic Gate",
    description: "Combine two conditions with a logical operator.",
    categoryId: "conditions",
    groupId: "logic",
    order: 30,
    color: "#64748b",
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "dropdown",
        name: "OPERATOR",
        label: "Operator",
        defaultValue: "AND",
        options: [
          { label: "AND", value: "AND" },
          { label: "OR", value: "OR" },
        ],
      },
      {
        kind: "checkbox",
        name: "NEGATE",
        label: "Negate",
        defaultValue: false,
      },
    ],
  },
  {
    type: "restart_on_win",
    title: "Restart on Win",
    description: "Restart the bot after a winning trade.",
    categoryId: "restart",
    groupId: "recovery",
    order: 10,
    color: "#64748b",
    layout: "statement",
    sectionId: "restart",
    fields: [
      {
        kind: "number",
        name: "RESET_STAKE",
        label: "Reset stake",
        defaultValue: 10,
        min: 0.5,
        max: 50000,
        precision: 0.5,
      },
      {
        kind: "checkbox",
        name: "ENABLE",
        label: "Enable",
        defaultValue: true,
      },
    ],
  },
  {
    type: "restart_on_loss",
    title: "Restart on Loss",
    description: "Restart the bot after a losing trade.",
    categoryId: "restart",
    groupId: "recovery",
    order: 20,
    color: "#64748b",
    layout: "statement",
    sectionId: "restart",
    fields: [
      {
        kind: "number",
        name: "RESET_STAKE",
        label: "Reset stake",
        defaultValue: 10,
        min: 0.5,
        max: 50000,
        precision: 0.5,
      },
      {
        kind: "checkbox",
        name: "ENABLE",
        label: "Enable",
        defaultValue: true,
      },
    ],
  },
  {
    type: "set_variable",
    title: "Set Variable",
    description: "Store a named value that can be reused by other blocks.",
    categoryId: "utility",
    groupId: "state",
    order: 10,
    color: "#334155",
    layout: "statement",
    sectionId: "utility",
    fields: [
      {
        kind: "text",
        name: "VAR_NAME",
        label: "Name",
        defaultValue: "myVar",
        placeholder: "myVar",
      },
      {
        kind: "text",
        name: "VAR_VALUE",
        label: "Value",
        defaultValue: "0",
        placeholder: "0",
      },
      {
        kind: "checkbox",
        name: "PERSIST",
        label: "Persist",
        defaultValue: false,
      },
    ],
  },
  {
    type: "strategy_snapshot",
    title: "Strategy Snapshot",
    description: "Capture the current bot state as portable JSON metadata.",
    categoryId: "utility",
    groupId: "snapshots",
    order: 20,
    color: "#334155",
    layout: "statement",
    sectionId: "utility",
    fields: [
      // {
      //   kind: "text",
      //   name: "SNAPSHOT_NAME",
      //   label: "Snapshot name",
      //   defaultValue: "Strategy Snapshot",
      //   placeholder: "Strategy Snapshot",
      // },
      {
        kind: "dropdown",
        name: "SNAPSHOT_SCOPE",
        label: "Scope",
        defaultValue: "full",
        options: [
          { label: "Full", value: "full" },
          { label: "Sections only", value: "sections" },
          { label: "Config only", value: "config" },
        ],
      },
      {
        kind: "checkbox",
        name: "INCLUDE_META",
        label: "Include meta",
        defaultValue: true,
      },
    ],
  },
];

export const BLOCK_TEMPLATES_BY_TYPE = new Map(
  BLOCK_TEMPLATES.map((template) => [template.type, template] as const),
);

export const CATEGORY_TEMPLATES = new Map(
  CATEGORY_DEFINITIONS.map((category) => [
    category.id,
    {
      ...category,
      blocks: BLOCK_TEMPLATES.filter(
        (template) => template.categoryId === category.id && !template.hiddenInPalette,
      ),
    },
  ] as const),
);

export const SECTION_BY_CATEGORY = new Map(
  SECTION_DEFINITIONS.map((section) => [section.id, section] as const),
);
