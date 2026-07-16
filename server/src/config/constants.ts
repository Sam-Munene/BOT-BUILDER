/**
 * HFT19 API Constants - TypeScript
 */

export const CONFIG = {
  API: {
    WS_URL: 'wss://hft.safarigari.com',
    REST_URL: 'https://api.safarigari.com',
  },
} as const;

export const CONTRACT_CATEGORIES = {
  path_independent: {
    label: 'Up/Down',
    types: ['UP', 'DOWN', 'HIGH', 'LOW', 'KNOCK_IN', 'KNOCK_OUT'],
    requiresBarrier: ['HIGH', 'LOW', 'KNOCK_IN', 'KNOCK_OUT'],
  },
  path_dependent: {
    label: 'In/Out',
    types: ['ENDS_BETWEEN', 'ENDS_OUTSIDE', 'STAYS_IN', 'STAYS_OUT'],
    requiresBarrier: true,
    requiresDoubleBarrier: ['ENDS_BETWEEN', 'ENDS_OUTSIDE', 'STAYS_IN', 'STAYS_OUT'],
  },
  digits: {
    label: 'Digits',
    types: ['MATCHES', 'DIFFERS', 'EVEN', 'ODD', 'OVER', 'UNDER', 'PRIME', 'NON_PRIME', 'RANGE_IN', 'RANGE_OUT'],
    requiresDigit: ['MATCHES', 'DIFFERS', 'OVER', 'UNDER'],
    requiresDigitRange: ['RANGE_IN', 'RANGE_OUT'],
  },
} as const;

export const DURATION_UNITS = [
  { value: 't', label: 'Ticks' },
  { value: 's', label: 'Seconds' },
  { value: 'm', label: 'Minutes' },
  { value: 'h', label: 'Hours' },
  { value: 'd', label: 'Days' },
] as const;

export const SYMBOLS = [
  { value: 'VIX_100', label: 'Volatility 100 Index' },
  { value: 'VIX_50', label: 'Volatility 50 Index' },
  { value: 'VIX_25', label: 'Volatility 25 Index' },
  { value: 'VIX_75', label: 'Volatility 75 Index' },
] as const;

export const CONDITION_TYPES = [
  { value: 'ALWAYS', label: 'Always' },
  { value: 'PRICE_GT', label: 'Price >' },
  { value: 'PRICE_LT', label: 'Price <' },
  { value: 'DIGIT_LAST', label: 'Last digit ==' },
  { value: 'TICK_COUNT', label: 'Tick count >=' },
  { value: 'RSI_GT', label: 'RSI >' },
  { value: 'RSI_LT', label: 'RSI <' },
  { value: 'SMA_GT', label: 'SMA >' },
  { value: 'SMA_LT', label: 'SMA <' },
  { value: 'MACD_CROSS', label: 'MACD Cross' },
] as const;

export const INDICATOR_TYPES = [
  { value: 'RSI', label: 'RSI', periodDefault: 14 },
  { value: 'SMA', label: 'SMA', periodDefault: 20 },
  { value: 'MACD', label: 'MACD', periodDefault: 12 },
  { value: 'BB', label: 'Bollinger Bands', periodDefault: 20 },
  { value: 'STOCH', label: 'Stochastic', periodDefault: 14 },
] as const;

export const BLOCK_TYPES = {
  MARKET: 'market_settings',
  EXECUTION: 'execution_settings',
  CONDITION_PURCHASE: 'condition_purchase',
  CONDITION_SELL: 'condition_sell',
  RESTART_WIN: 'restart_on_win',
  RESTART_LOSS: 'restart_on_loss',
  SET_VARIABLE: 'set_variable',
  INDICATOR: 'indicator',
  POSITION_MANAGER: 'position_manager',
  CONNECTION: 'websocket_connection',
  BARRIER: 'barrier',
  DOUBLE_BARRIER: 'double_barrier',
  DIGIT_TARGET: 'digit_target',
  DIGIT_RANGE: 'digit_range',
} as const;

export const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
} as const;

export type ConnectionStatus = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS];

export const POSITION_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
} as const;

export type PositionStatus = typeof POSITION_STATUS[keyof typeof POSITION_STATUS];
