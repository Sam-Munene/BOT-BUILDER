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
  output?: boolean;  // Whether this block returns a value
  outputType?: "Number" | "String" | "Boolean" | "List"; 
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
];

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: "market",
    title: "Market",
    summary: "Pick the market, symbol, contract family.",
    accent: "#2146d0",
    sectionId: "market",
    groups: [
      { id: "trade_setup", title: "Trade Setup", description: "Choose the market and contract identity." },
    ],
  },
  {
    id: "execution",
    title: "Execution",
    summary: "Control stake, duration, and trade pacing.",
    accent: "#179b6d",
    sectionId: "execution",
    groups: [
      { id: "trade_controls", title: "Trade Controls", description: "Set stake and duration basics." },
      { id: "barriers", title: "Barriers", description: "Configure single and double barrier controls." },
      { id: "digits", title: "Digits", description: "Configure digit target and range controls." },
      { id: "risk", title: "Risk", description: "Tune stop loss and take profit limits." },
      { id: "timing", title: "Timing", description: "Shape trade window behavior." },
    ],
  },
  {
    id: "indicators",
    title: "Indicators",
    summary: "Attach indicator-based guards and filters.",
    accent: "#2146d0",
    sectionId: "indicators",
    groups: [
      { id: "sources", title: "Indicator Source", description: "Pick the raw indicator source." },
      { id: "comparisons", title: "Comparisons", description: "Turn indicator values into filters." },
    ],
  },
  {
    id: "conditions",
    title: "Conditions",
    summary: "Define entry, exit, and trade management rules.",
    accent: "#f59e0b",
    sectionId: "conditions",
    groups: [
      { id: "entry", title: "Entry Conditions", description: "When to open a trade." },
      { id: "exit", title: "Exit Conditions", description: "When to close a trade." },
      { id: "management", title: "Trade Management", description: "Martingale, stop loss, take profit." },
      { id: "variables", title: "Variables", description: "Set and manage strategy variables." },
      { id: "notifications", title: "Notifications", description: "Alert and notification settings." },
    ],
  },
  {
    id: "restart",
    title: "Restart",
    summary: "Set how the bot should restart after a win or loss.",
    accent: "#8b5cf6",
    sectionId: "restart",
    groups: [
      { id: "recovery", title: "Recovery", description: "Restart behavior after outcomes." },
    ],
  },
];

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
  { label: "Hours", value: "h" },
  { label: "Days", value: "d" },
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
  { label: "None", value: "none" },
  { label: "SMA (Simple Moving Average)", value: "sma" },
  { label: "EMA (Exponential Moving Average)", value: "ema" },
  { label: "Bollinger Bands", value: "bollinger" },
  { label: "Donchian Channels", value: "donchian" },
  { label: "Moving Average Envelope", value: "ma_envelope" },
  { label: "VWAP (Volume Weighted Average Price)", value: "vwap" },
  { label: "Rainbow Moving Average", value: "rainbow_ma" },
  { label: "Ichimoku Cloud", value: "ichimoku" },
  { label: "Parabolic SAR", value: "parabolic_sar" },
  { label: "Alligator", value: "alligator" },
  { label: "Zig Zag", value: "zigzag" },
  { label: "Fractal Bands", value: "fractal_bands" },
  { label: "Pivot Points", value: "pivot_points" },
  { label: "RSI (Relative Strength Index)", value: "rsi" },
  { label: "MACD (Moving Average Convergence Divergence)", value: "macd" },
  { label: "Stochastic Oscillator", value: "stochastic" },
  { label: "Aroon", value: "aroon" },
  { label: "SMI (Stochastic Momentum Index)", value: "smi" },
  { label: "Williams %R", value: "williams_r" },
  { label: "CCI (Commodity Channel Index)", value: "cci" },
  { label: "ROC (Rate of Change)", value: "roc" },
  { label: "ATR (Average True Range)", value: "atr" },
  { label: "ADX (Average Directional Index)", value: "adx" },
  { label: "OBV (On-Balance Volume)", value: "obv" },
  { label: "Awesome Oscillator", value: "awesome" },
  { label: "DPO (Detrended Price Oscillator)", value: "dpo" },
  { label: "Volume", value: "volume" },
];

export const CONDITION_OPTIONS: FieldOption[] = [
  // Comparison Operators
  { label: "=", value: "EQ" },
  { label: "≠", value: "NEQ" },
  { label: ">", value: "GT" },
  { label: "≥", value: "GTE" },
  { label: "<", value: "LT" },
  { label: "≤", value: "LTE" },
  
  // Logic Operators
  { label: "AND", value: "AND" },
  { label: "OR", value: "OR" },
  { label: "NOT", value: "NOT" },
  
  // Tick Conditions
  { label: "Current Tick Value", value: "CURRENT_TICK" },
  { label: "Tick Count", value: "TICK_COUNT" },
  { label: "Every Tick", value: "EVERY_TICK" },
  { label: "Count Down", value: "COUNT_DOWN" },
  
  // Position Conditions
  { label: "Has Position", value: "HAS_POSITION" },
  { label: "No Position", value: "NO_POSITION" },
  { label: "Position P&L", value: "POSITION_PL" },
  { label: "Drawdown", value: "DRAWDOWN" },
  
  // Martingale Conditions
  { label: "Trade Again", value: "TRADE_AGAIN" },
  { label: "Loss Threshold Reached", value: "LOSS_THRESHOLD" },
  { label: "Profit Threshold Reached", value: "PROFIT_THRESHOLD" },
  { label: "Max Stake Reached", value: "MAX_STAKE_REACHED" },
  
  // Price Conditions
  { label: "Price Above", value: "PRICE_GT" },
  { label: "Price Below", value: "PRICE_LT" },
  { label: "Price Between", value: "PRICE_BETWEEN" },
  { label: "Price Outside", value: "PRICE_OUTSIDE" },
  
  // Trade Management
  { label: "Stop Loss Hit", value: "STOP_LOSS_HIT" },
  { label: "Take Profit Hit", value: "TAKE_PROFIT_HIT" },
  { label: "Sell by Count Down", value: "SELL_BY_COUNT_DOWN" },
  { label: "Sell by Take Profit", value: "SELL_BY_TAKE_PROFIT" },
  
  // Time Conditions
  { label: "Time of Day", value: "TIME_OF_DAY" },
  { label: "Day of Week", value: "DAY_OF_WEEK" },
  { label: "Duration Elapsed", value: "DURATION_ELAPSED" },
  
  // Math Conditions
  { label: "Greater than", value: "MATH_GT" },
  { label: "Less than", value: "MATH_LT" },
  { label: "Equal to", value: "MATH_EQ" },
  { label: "Not equal to", value: "MATH_NEQ" },
];

// ============================================================
// MATH OPERATORS
// ============================================================

export const MATH_OPERATORS: FieldOption[] = [
  { label: "+", value: "ADD" },
  { label: "-", value: "SUBTRACT" },
  { label: "×", value: "MULTIPLY" },
  { label: "÷", value: "DIVIDE" },
  { label: "%", value: "MODULO" },
  { label: "^", value: "POWER" },
];

// ============================================================
// LIST OPERATORS
// ============================================================

export const LIST_OPERATORS: FieldOption[] = [
  { label: "Add", value: "ADD" },
  { label: "Remove", value: "REMOVE" },
  { label: "Contains", value: "CONTAINS" },
  { label: "Length", value: "LENGTH" },
  { label: "Get", value: "GET" },
  { label: "Set", value: "SET" },
  { label: "Clear", value: "CLEAR" },
];

// ============================================================
// TEXT OPERATORS
// ============================================================

export const TEXT_OPERATORS: FieldOption[] = [
  { label: "Concatenate", value: "CONCAT" },
  { label: "Contains", value: "CONTAINS" },
  { label: "Starts with", value: "STARTS_WITH" },
  { label: "Ends with", value: "ENDS_WITH" },
  { label: "Length", value: "LENGTH" },
  { label: "Replace", value: "REPLACE" },
  { label: "To Upper", value: "TO_UPPER" },
  { label: "To Lower", value: "TO_LOWER" },
  { label: "Split", value: "SPLIT" },
  { label: "Join", value: "JOIN" },
];

// ============================================================
// TIME UNITS
// ============================================================

export const TIME_UNITS: FieldOption[] = [
  { label: "Seconds", value: "SECONDS" },
  { label: "Minutes", value: "MINUTES" },
  { label: "Hours", value: "HOURS" },
  { label: "Days", value: "DAYS" },
  { label: "Weeks", value: "WEEKS" },
  { label: "Months", value: "MONTHS" },
];


export const RESTART_CONDITION_OPTIONS: FieldOption[] = [
  { label: "After Win", value: "AFTER_WIN" },
  { label: "After Loss", value: "AFTER_LOSS" },
  { label: "After Win or Loss", value: "AFTER_WIN_OR_LOSS" },
  { label: "After Profit Threshold", value: "AFTER_PROFIT_THRESHOLD" },
  { label: "After Loss Threshold", value: "AFTER_LOSS_THRESHOLD" },
  { label: "Trade Again After Purchase", value: "TRADE_AGAIN_AFTER_PURCHASE" },
  { label: "Never", value: "NEVER" },
];

export const CONDITION_COLOR = "#6b7280"; // Grey
export const VARIABLE_COLOR = "#6b7280";
export const LOGIC_COLOR = "#6b7280"; 
export const MATH_COLOR = "#6b7280";
export const LIST_COLOR = "#6b7280";
export const TEXT_COLOR = "#6b7280";
export const TIME_COLOR = "#6b7280";
export const NOTIFICATION_COLOR = "#6b7280";

export const BLOCK_TEMPLATES: BlockTemplate[] = [
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
      // {
      //   kind: "dropdown",
      //   name: "DIGIT_OPERATOR",
      //   label: "Operator",
      //   defaultValue: "MATCHES",
      //   options: [
      //     { label: "Matches", value: "MATCHES" },
      //     { label: "Differs", value: "DIFFERS" },
      //     { label: "Even", value: "EVEN" },
      //     { label: "Odd", value: "ODD" },
      //     { label: "Over", value: "OVER" },
      //     { label: "Under", value: "UNDER" },
      //     { label: "Prime", value: "PRIME" },
      //     { label: "Non Prime", value: "NON_PRIME" },
      //   ],
      // },
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
  type: "indicator_name",
  title: "Indicator Name",
  description: "Select the technical indicator to use.",
  categoryId: "indicators",
  groupId: "sources",
  order: 10,
  color: "#6b7280",
  layout: "statement",
  sectionId: "indicators",
  fields: [
    {
      kind: "dropdown",
      name: "INDICATOR",
      label: "Name",
      defaultValue: "none",
      options: INDICATOR_OPTIONS,
    },
  ],
},

// Indicator Period Block - For setting the period
{
  type: "indicator_period",
  title: "Indicator Period",
  description: "Set the period for the selected indicator.",
  categoryId: "indicators",
  groupId: "sources",
  order: 11,
  color: "#6b7280",
  layout: "statement",
  sectionId: "indicators",
  fields: [
    {
      kind: "number",
      name: "PERIOD",
      label: "Period",
      defaultValue: 14,
      min: 1,
      max: 200,
      precision: 1,
    },
  ],
},

// Indicator Rule Block - Combines Name and Period (hidden in palette)
{
  type: "indicator_rule",
  title: "Indicator",
  description: "Add a technical indicator with period.",
  categoryId: "indicators",
  groupId: "sources",
  order: 12,
  color: "#6b7280",
  layout: "statement",
  sectionId: "indicators",
  hiddenInPalette: true,
  fields: [
    {
      kind: "dropdown",
      name: "INDICATOR",
      label: "Name",
      defaultValue: "none",
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
  ],
},

// Indicator Compare Block - For comparing indicator values
{
  type: "indicator_compare",
  title: "Indicator Compare",
  description: "Compare an indicator output against a threshold.",
  categoryId: "indicators",
  groupId: "comparisons",
  order: 20,
  color: "#6b7280",
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
      options: [
        { label: "Greater than", value: "GT" },
        { label: "Less than", value: "LT" },
        { label: "Equals", value: "EQ" },
        { label: "Not equal", value: "NEQ" },
      ],
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

// Indicators Settings - Hidden block used for snapshot
{
  type: "indicators_settings",
  title: "Indicators Settings",
  description: "Capture the default indicator state for the section.",
  categoryId: "indicators",
  groupId: "sources",
  order: 5,
  color: "#6b7280",
  layout: "statement",
  sectionId: "indicators",
  hiddenInPalette: true,
  serializeInSnapshot: true,
  fields: [
    {
      kind: "dropdown",
      name: "INDICATOR",
      label: "Name",
      defaultValue: "none",
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
  ],
},
  // ============================================================
  // CONDITION BLOCKS - Complete Deriv-Style Set
  // ============================================================

  // ----- VARIABLES -----
  
  {
    type: "variable_set_bool",
    title: "Set Boolean",
    description: "Set a true/false variable.",
    categoryId: "conditions",
    groupId: "variables",
    order: 10,
    color: VARIABLE_COLOR,
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "text",
        name: "VAR_NAME",
        label: "Variable",
        defaultValue: "isBought",
        placeholder: "e.g., isBought",
      },
      {
        kind: "checkbox",
        name: "VAR_VALUE",
        label: "Value",
        defaultValue: false,
      },
    ],
  },
  
  {
    type: "variable_set_number",
    title: "Set Number",
    description: "Set a numeric variable.",
    categoryId: "conditions",
    groupId: "variables",
    order: 11,
    color: VARIABLE_COLOR,
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "text",
        name: "VAR_NAME",
        label: "Variable",
        defaultValue: "currentStake",
        placeholder: "e.g., currentStake",
      },
      {
        kind: "number",
        name: "VAR_VALUE",
        label: "Value",
        defaultValue: 0,
        min: -1000000,
        max: 1000000,
        precision: 0.5,
      },
    ],
  },
  
  {
    type: "variable_set_text",
    title: "Set Text",
    description: "Set a text variable.",
    categoryId: "conditions",
    groupId: "variables",
    order: 12,
    color: VARIABLE_COLOR,
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "text",
        name: "VAR_NAME",
        label: "Variable",
        defaultValue: "notification",
        placeholder: "e.g., notification",
      },
      {
        kind: "text",
        name: "VAR_VALUE",
        label: "Value",
        defaultValue: "",
        placeholder: "e.g., Trade executed",
      },
    ],
  },
  
  {
    type: "variable_get",
    title: "Get Variable",
    description: "Get the value of a variable.",
    categoryId: "conditions",
    groupId: "variables",
    order: 13,
    color: VARIABLE_COLOR,
    layout: "statement",
    sectionId: "conditions",
    output: true,
    outputType: "Number",
    fields: [
      {
        kind: "dropdown",
        name: "VAR_NAME",
        label: "Variable",
        defaultValue: "isBought",
        options: [
          { label: "isBought", value: "isBought" },
          { label: "currentStake", value: "currentStake" },
          { label: "notification", value: "notification" },
          { label: "totalProfit", value: "totalProfit" },
          { label: "maxStake", value: "maxStake" },
          { label: "tickCount", value: "tickCount" },
        ],
      },
    ],
  },
  
  {
    type: "variable_rename",
    title: "Rename Variable",
    description: "Rename an existing variable.",
    categoryId: "conditions",
    groupId: "variables",
    order: 14,
    color: VARIABLE_COLOR,
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "text",
        name: "OLD_NAME",
        label: "Old Name",
        defaultValue: "isBought",
        placeholder: "e.g., isBought",
      },
      {
        kind: "text",
        name: "NEW_NAME",
        label: "New Name",
        defaultValue: "isSold",
        placeholder: "e.g., isSold",
      },
    ],
  },
  
  {
    type: "variable_delete",
    title: "Delete Variable",
    description: "Delete a variable.",
    categoryId: "conditions",
    groupId: "variables",
    order: 15,
    color: VARIABLE_COLOR,
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "text",
        name: "VAR_NAME",
        label: "Variable Name",
        defaultValue: "isBought",
        placeholder: "e.g., isBought",
      },
    ],
  },

  // ----- LOGIC -----
  
  {
    type: "logic_if",
    title: "If",
    description: "Conditional logic block.",
    categoryId: "conditions",
    groupId: "logic",
    order: 20,
    color: LOGIC_COLOR,
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "dropdown",
        name: "CONDITION",
        label: "Condition",
        defaultValue: "CURRENT_TICK",
        options: CONDITION_OPTIONS,
      },
      {
        kind: "text",
        name: "VALUE",
        label: "Value",
        defaultValue: "",
        placeholder: "e.g., 100",
      },
      {
        kind: "text",
        name: "VALUE_2",
        label: "Value 2",
        defaultValue: "",
        placeholder: "e.g., 200 (for between)",
      },
    ],
  },
  
  {
    type: "logic_else",
    title: "Else",
    description: "Else branch for conditional logic.",
    categoryId: "conditions",
    groupId: "logic",
    order: 21,
    color: LOGIC_COLOR,
    layout: "statement",
    sectionId: "conditions",
    fields: [],
  },
  
  {
    type: "logic_compare",
    title: "Compare",
    description: "Compare two values.",
    categoryId: "conditions",
    groupId: "logic",
    order: 22,
    color: LOGIC_COLOR,
    layout: "statement",
    sectionId: "conditions",
    output: true,
    outputType: "Boolean",
    fields: [
      {
        kind: "text",
        name: "LEFT",
        label: "Left",
        defaultValue: "Current Tick Value",
        placeholder: "e.g., Current Tick Value",
      },
      {
        kind: "dropdown",
        name: "OPERATOR",
        label: "Operator",
        defaultValue: "GT",
        options: [
          { label: "=", value: "EQ" },
          { label: "≠", value: "NEQ" },
          { label: ">", value: "GT" },
          { label: "≥", value: "GTE" },
          { label: "<", value: "LT" },
          { label: "≤", value: "LTE" },
        ],
      },
      {
        kind: "text",
        name: "RIGHT",
        label: "Right",
        defaultValue: "Tick Count",
        placeholder: "e.g., Tick Count",
      },
    ],
  },
  
  {
    type: "logic_gate",
    title: "Logic Gate",
    description: "Combine conditions with AND, OR, or NOT.",
    categoryId: "conditions",
    groupId: "logic",
    order: 23,
    color: LOGIC_COLOR,
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
          { label: "NOT", value: "NOT" },
        ],
      },
    ],
  },

  // ----- MATH -----
  
  {
    type: "math_operation",
    title: "Math",
    description: "Perform a mathematical operation.",
    categoryId: "conditions",
    groupId: "math",
    order: 30,
    color: MATH_COLOR,
    layout: "statement",
    sectionId: "conditions",
    output: true,
    outputType: "Number",
    fields: [
      {
        kind: "text",
        name: "VALUE_1",
        label: "Value 1",
        defaultValue: "0",
        placeholder: "e.g., 10",
      },
      {
        kind: "dropdown",
        name: "OPERATOR",
        label: "Operator",
        defaultValue: "ADD",
        options: MATH_OPERATORS,
      },
      {
        kind: "text",
        name: "VALUE_2",
        label: "Value 2",
        defaultValue: "0",
        placeholder: "e.g., 5",
      },
    ],
  },
  
  {
    type: "math_current_tick",
    title: "Current Tick Value",
    description: "Get the current tick value.",
    categoryId: "conditions",
    groupId: "math",
    order: 31,
    color: MATH_COLOR,
    layout: "statement",
    sectionId: "conditions",
    output: true,
    outputType: "Number",
    fields: [],
  },
  
  {
    type: "math_tick_count",
    title: "Tick Count",
    description: "Get the current tick count.",
    categoryId: "conditions",
    groupId: "math",
    order: 32,
    color: MATH_COLOR,
    layout: "statement",
    sectionId: "conditions",
    output: true,
    outputType: "Number",
    fields: [],
  },

  // ----- LISTS -----
  
  {
    type: "list_create",
    title: "Create List",
    description: "Create a new list.",
    categoryId: "conditions",
    groupId: "lists",
    order: 40,
    color: LIST_COLOR,
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "text",
        name: "LIST_NAME",
        label: "List Name",
        defaultValue: "myList",
        placeholder: "e.g., tradeHistory",
      },
      {
        kind: "text",
        name: "INITIAL_VALUES",
        label: "Initial Values",
        defaultValue: "",
        placeholder: "e.g., 1,2,3",
      },
    ],
  },
  
  {
    type: "list_operation",
    title: "List Operation",
    description: "Perform an operation on a list.",
    categoryId: "conditions",
    groupId: "lists",
    order: 41,
    color: LIST_COLOR,
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "text",
        name: "LIST_NAME",
        label: "List",
        defaultValue: "myList",
        placeholder: "e.g., tradeHistory",
      },
      {
        kind: "dropdown",
        name: "OPERATOR",
        label: "Operation",
        defaultValue: "ADD",
        options: LIST_OPERATORS,
      },
      {
        kind: "text",
        name: "VALUE",
        label: "Value",
        defaultValue: "",
        placeholder: "e.g., 100",
      },
    ],
  },
  
  {
    type: "list_contains",
    title: "List Contains",
    description: "Check if a list contains a value.",
    categoryId: "conditions",
    groupId: "lists",
    order: 42,
    color: LIST_COLOR,
    layout: "statement",
    sectionId: "conditions",
    output: true,
    outputType: "Boolean",
    fields: [
      {
        kind: "text",
        name: "LIST_NAME",
        label: "List",
        defaultValue: "myList",
        placeholder: "e.g., tradeHistory",
      },
      {
        kind: "text",
        name: "VALUE",
        label: "Value",
        defaultValue: "",
        placeholder: "e.g., 100",
      },
    ],
  },
  
  {
    type: "list_length",
    title: "List Length",
    description: "Get the length of a list.",
    categoryId: "conditions",
    groupId: "lists",
    order: 43,
    color: LIST_COLOR,
    layout: "statement",
    sectionId: "conditions",
    output: true,
    outputType: "Number",
    fields: [
      {
        kind: "text",
        name: "LIST_NAME",
        label: "List",
        defaultValue: "myList",
        placeholder: "e.g., tradeHistory",
      },
    ],
  },

  // ----- TEXT -----
  
  {
    type: "text_operation",
    title: "Text",
    description: "Perform a text operation.",
    categoryId: "conditions",
    groupId: "text",
    order: 50,
    color: TEXT_COLOR,
    layout: "statement",
    sectionId: "conditions",
    output: true,
    outputType: "String",
    fields: [
      {
        kind: "dropdown",
        name: "OPERATOR",
        label: "Operation",
        defaultValue: "CONCAT",
        options: TEXT_OPERATORS,
      },
      {
        kind: "text",
        name: "TEXT_1",
        label: "Text 1",
        defaultValue: "",
        placeholder: "e.g., Hello",
      },
      {
        kind: "text",
        name: "TEXT_2",
        label: "Text 2",
        defaultValue: "",
        placeholder: "e.g., World",
      },
    ],
  },
  
  {
    type: "text_contains",
    title: "Text Contains",
    description: "Check if text contains a substring.",
    categoryId: "conditions",
    groupId: "text",
    order: 51,
    color: TEXT_COLOR,
    layout: "statement",
    sectionId: "conditions",
    output: true,
    outputType: "Boolean",
    fields: [
      {
        kind: "text",
        name: "TEXT",
        label: "Text",
        defaultValue: "",
        placeholder: "e.g., Hello World",
      },
      {
        kind: "text",
        name: "SUBSTRING",
        label: "Substring",
        defaultValue: "",
        placeholder: "e.g., World",
      },
    ],
  },

  // ----- TIME -----
  
  {
    type: "time_delay",
    title: "Delay",
    description: "Wait for a specified duration.",
    categoryId: "conditions",
    groupId: "time",
    order: 60,
    color: TIME_COLOR,
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "number",
        name: "DURATION",
        label: "Duration",
        defaultValue: 5,
        min: 1,
        max: 3600,
        precision: 1,
      },
      {
        kind: "dropdown",
        name: "UNIT",
        label: "Unit",
        defaultValue: "SECONDS",
        options: TIME_UNITS,
      },
    ],
  },
  
  {
    type: "time_at",
    title: "At Time",
    description: "Execute at a specific time.",
    categoryId: "conditions",
    groupId: "time",
    order: 61,
    color: TIME_COLOR,
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "text",
        name: "TIME",
        label: "Time",
        defaultValue: "09:00",
        placeholder: "e.g., 09:00",
      },
    ],
  },
  
  {
    type: "time_count_down",
    title: "Count Down",
    description: "Count down from a value.",
    categoryId: "conditions",
    groupId: "time",
    order: 62,
    color: TIME_COLOR,
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "number",
        name: "START",
        label: "Start",
        defaultValue: 10,
        min: 1,
        max: 1000,
        precision: 1,
      },
      {
        kind: "number",
        name: "CURRENT",
        label: "Current",
        defaultValue: 10,
        min: 0,
        max: 1000,
        precision: 1,
      },
    ],
  },

  // ----- NOTIFICATIONS -----
  
  {
    type: "notification",
    title: "Notify",
    description: "Send a notification.",
    categoryId: "conditions",
    groupId: "notifications",
    order: 70,
    color: NOTIFICATION_COLOR,
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "text",
        name: "MESSAGE",
        label: "Message",
        defaultValue: "Trade executed",
        placeholder: "e.g., Trade executed",
      },
      {
        kind: "checkbox",
        name: "WITH_SOUND",
        label: "Play sound",
        defaultValue: true,
      },
      {
        kind: "checkbox",
        name: "WITH_POPUP",
        label: "Show popup",
        defaultValue: true,
      },
    ],
  },
  
  {
    type: "notification_stats",
    title: "Current Stats",
    description: "Display current strategy stats.",
    categoryId: "conditions",
    groupId: "notifications",
    order: 71,
    color: NOTIFICATION_COLOR,
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "dropdown",
        name: "STAT",
        label: "Statistic",
        defaultValue: "totalProfit",
        options: [
          { label: "Total Profit", value: "totalProfit" },
          { label: "Total Trades", value: "totalTrades" },
          { label: "Win Rate", value: "winRate" },
          { label: "Current Stake", value: "currentStake" },
          { label: "Max Stake", value: "maxStake" },
          { label: "Loss Streak", value: "lossStreak" },
          { label: "Win Streak", value: "winStreak" },
        ],
      },
    ],
  },

  // ----- ENTRY/EXIT CONDITIONS -----
  
  {
    type: "condition_entry",
    title: "Entry Condition",
    description: "Define when to enter a trade.",
    categoryId: "conditions",
    groupId: "entry",
    order: 80,
    color: CONDITION_COLOR,
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "dropdown",
        name: "CONDITION",
        label: "Condition",
        defaultValue: "ALWAYS",
        options: [
          { label: "Always", value: "ALWAYS" },
          { label: "Price Above", value: "PRICE_GT" },
          { label: "Price Below", value: "PRICE_LT" },
          { label: "Price Between", value: "PRICE_BETWEEN" },
          { label: "Current Tick Value", value: "CURRENT_TICK" },
          { label: "Tick Count", value: "TICK_COUNT" },
          { label: "Has Position", value: "HAS_POSITION" },
          { label: "No Position", value: "NO_POSITION" },
          { label: "Trade Again", value: "TRADE_AGAIN" },
          { label: "Loss Threshold Reached", value: "LOSS_THRESHOLD" },
          { label: "Profit Threshold Reached", value: "PROFIT_THRESHOLD" },
        ],
      },
      {
        kind: "text",
        name: "VALUE",
        label: "Value",
        defaultValue: "",
        placeholder: "e.g., 100",
      },
      {
        kind: "text",
        name: "VALUE_2",
        label: "Value 2",
        defaultValue: "",
        placeholder: "e.g., 200 (for between)",
      },
    ],
  },
  
  {
    type: "condition_exit",
    title: "Exit Condition",
    description: "Define when to exit a trade.",
    categoryId: "conditions",
    groupId: "exit",
    order: 81,
    color: CONDITION_COLOR,
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "dropdown",
        name: "CONDITION",
        label: "Condition",
        defaultValue: "SELL_BY_COUNT_DOWN",
        options: [
          { label: "Sell by Count Down", value: "SELL_BY_COUNT_DOWN" },
          { label: "Sell by Take Profit", value: "SELL_BY_TAKE_PROFIT" },
          { label: "Stop Loss Hit", value: "STOP_LOSS_HIT" },
          { label: "Take Profit Hit", value: "TAKE_PROFIT_HIT" },
          { label: "Time of Day", value: "TIME_OF_DAY" },
          { label: "Duration Elapsed", value: "DURATION_ELAPSED" },
          { label: "Current Tick Value", value: "CURRENT_TICK" },
          { label: "Tick Count", value: "TICK_COUNT" },
        ],
      },
      {
        kind: "text",
        name: "VALUE",
        label: "Value",
        defaultValue: "5",
        placeholder: "e.g., 5",
      },
    ],
  },

  // ----- MARTINGALE -----
  
  {
    type: "martingale_settings",
    title: "Conditions Settings",
    description: "Configure martingale trade management.",
    categoryId: "conditions",
    groupId: "management",
    order: 90,
    color: CONDITION_COLOR,
    layout: "statement",
    sectionId: "conditions",
    fields: [
      {
        kind: "number",
        name: "INITIAL_STAKE",
        label: "Initial Stake",
        defaultValue: 10,
        min: 0.5,
        max: 50000,
        precision: 0.5,
      },
      {
        kind: "number",
        name: "MULTIPLIER",
        label: "Multiplier",
        defaultValue: 2,
        min: 1.1,
        max: 10,
        precision: 0.1,
      },
      {
        kind: "number",
        name: "MAX_STAKE",
        label: "Max Stake",
        defaultValue: 50,
        min: 0.5,
        max: 50000,
        precision: 0.5,
      },
      {
        kind: "number",
        name: "PROFIT_THRESHOLD",
        label: "Profit Threshold",
        defaultValue: 100,
        min: 0,
        max: 10000,
        precision: 0.5,
      },
      {
        kind: "number",
        name: "LOSS_THRESHOLD",
        label: "Loss Threshold",
        defaultValue: 50,
        min: 0,
        max: 10000,
        precision: 0.5,
      },
      {
        kind: "checkbox",
        name: "TRADE_AGAIN",
        label: "Trade Again After Win",
        defaultValue: true,
      },
    ],
  },
  
  {
    type: "martingale_trade_again",
    title: "Trade Again",
    description: "Check if martingale should trade again.",
    categoryId: "conditions",
    groupId: "management",
    order: 91,
    color: CONDITION_COLOR,
    layout: "statement",
    sectionId: "conditions",
    output: true,
    outputType: "Boolean",
    fields: [],
  },
  
  {
    type: "martingale_size",
    title: "Martingale Size",
    description: "Get the current martingale size.",
    categoryId: "conditions",
    groupId: "management",
    order: 92,
    color: CONDITION_COLOR,
    layout: "statement",
    sectionId: "conditions",
    output: true,
    outputType: "Number",
    fields: [],
  },
  {
    type: "restart_when",
    title: "Restart When",
    description: "Choose when the bot should restart.",
    categoryId: "restart",
    groupId: "recovery",
    order: 10,
    color: "#6b7280",
    layout: "statement",
    sectionId: "restart",
    fields: [
      {
        kind: "dropdown",
        name: "CONDITION",
        label: "Restart When",
        defaultValue: "AFTER_LOSS",
        options: RESTART_CONDITION_OPTIONS,
      },
    ],
  },

  // Restart Settings - Hidden for snapshot (keep for compatibility)
  {
    type: "restart_settings",
    title: "Restart Settings",
    description: "Capture restart behavior for snapshot.",
    categoryId: "restart",
    groupId: "recovery",
    order: 5,
    color: "#6b7280",
    layout: "statement",
    sectionId: "restart",
    hiddenInPalette: true,
    serializeInSnapshot: true,
    fields: [
      {
        kind: "dropdown",
        name: "CONDITION",
        label: "Restart When",
        defaultValue: "AFTER_LOSS",
        options: RESTART_CONDITION_OPTIONS,
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
