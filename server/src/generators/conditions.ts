/**
 * Condition Blocks Code Generator - TypeScript
 */

import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

function asJsString(value: unknown, fallback = ''): string {
  return JSON.stringify(typeof value === 'string' ? value : fallback);
}

function asJsNumber(value: unknown, fallback = 0): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : String(fallback);
}

function asJsBoolean(value: unknown, fallback = false): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'true' || normalized === 'false') return normalized;
  return fallback ? 'true' : 'false';
}

function asJsRaw(value: unknown, fallback = '0'): string {
  const text = String(value ?? '').trim();
  return text ? text : fallback;
}

function toJsArrayLiteral(raw: unknown): string {
  const items = String(raw ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => Boolean(item));
  if (items.length === 0) return '[]';
  const values = items.map((item) => {
    const numeric = Number(item);
    return Number.isFinite(numeric) ? String(numeric) : JSON.stringify(item);
  });
  return `[${values.join(', ')}]`;
}

function inferExitGroup(type: string): string {
  const normalized = String(type ?? '').trim().toUpperCase();
  if (['TIME_OF_DAY', 'DURATION_ELAPSED', 'SELL_BY_COUNT_DOWN'].includes(normalized)) return 'time';
  if (['STOP_LOSS_HIT', 'TAKE_PROFIT_HIT', 'SELL_BY_TAKE_PROFIT'].includes(normalized)) return 'risk';
  return 'price';
}

export function registerConditionGenerators(Blockly: BlocklyInterface): void {
  if (!Blockly || !Blockly.JavaScript) {
    console.error('Blockly.JavaScript not available');
    return;
  }

  Blockly.JavaScript['condition_entry'] = function(block: BlocklyBlock): string {
    const condition = asJsString(block.getFieldValue('CONDITION') || 'ALWAYS');
    const value = asJsString(block.getFieldValue('VALUE') || '');
    const value2 = asJsString(block.getFieldValue('VALUE_2') || '');
    return `const ENTRY_CONDITION = {\n  type: ${condition},\n  value: ${value},\n  value2: ${value2}\n};\n`;
  };

  Blockly.JavaScript['condition_exit'] = function(block: BlocklyBlock): string {
    const condition = asJsString(block.getFieldValue('CONDITION') || 'SELL_BY_COUNT_DOWN');
    const value = asJsString(block.getFieldValue('VALUE') || '');
    const group = asJsString(inferExitGroup(block.getFieldValue('CONDITION') || 'SELL_BY_COUNT_DOWN'));
    return `globalThis.__BOT_BUILDER_EXIT_CONDITIONS = globalThis.__BOT_BUILDER_EXIT_CONDITIONS || [];\nglobalThis.__BOT_BUILDER_EXIT_CONDITIONS.push({ type: ${condition}, value: ${value}, group: ${group} });\n`;
  };

  Blockly.JavaScript['martingale_settings'] = function(block: BlocklyBlock): string {
    const initialStake = asJsNumber(block.getFieldValue('INITIAL_STAKE') || 10, 10);
    const multiplier = asJsNumber(block.getFieldValue('MULTIPLIER') || 2, 2);
    const maxStake = asJsNumber(block.getFieldValue('MAX_STAKE') || 50, 50);
    const profitThreshold = asJsNumber(block.getFieldValue('PROFIT_THRESHOLD') || 100, 100);
    const lossThreshold = asJsNumber(block.getFieldValue('LOSS_THRESHOLD') || 50, 50);
    const tradeAgain = asJsBoolean(block.getFieldValue('TRADE_AGAIN') ?? true, true);
    return `const MARTINGALE_SETTINGS = {\n  initialStake: ${initialStake},\n  multiplier: ${multiplier},\n  maxStake: ${maxStake},\n  profitThreshold: ${profitThreshold},\n  lossThreshold: ${lossThreshold},\n  tradeAgain: ${tradeAgain}\n};\n`;
  };

  Blockly.JavaScript['variable_set_bool'] = function(block: BlocklyBlock): string {
    const name = asJsString(block.getFieldValue('VAR_NAME') || 'isBought');
    const value = asJsBoolean(block.getFieldValue('VAR_VALUE') ?? false, false);
    return `globalThis.__BOT_BUILDER_VARIABLES = globalThis.__BOT_BUILDER_VARIABLES || [];\nglobalThis.__BOT_BUILDER_VARIABLES.push({ type: "bool", name: ${name}, value: ${value} });\n`;
  };

  Blockly.JavaScript['variable_set_number'] = function(block: BlocklyBlock): string {
    const name = asJsString(block.getFieldValue('VAR_NAME') || 'currentStake');
    const value = asJsNumber(block.getFieldValue('VAR_VALUE') || 0, 0);
    return `globalThis.__BOT_BUILDER_VARIABLES = globalThis.__BOT_BUILDER_VARIABLES || [];\nglobalThis.__BOT_BUILDER_VARIABLES.push({ type: "number", name: ${name}, value: ${value} });\n`;
  };

  Blockly.JavaScript['variable_set_text'] = function(block: BlocklyBlock): string {
    const name = asJsString(block.getFieldValue('VAR_NAME') || 'notification');
    const value = asJsString(block.getFieldValue('VAR_VALUE') || '');
    return `globalThis.__BOT_BUILDER_VARIABLES = globalThis.__BOT_BUILDER_VARIABLES || [];\nglobalThis.__BOT_BUILDER_VARIABLES.push({ type: "text", name: ${name}, value: ${value} });\n`;
  };

  Blockly.JavaScript['variable_get'] = function(block: BlocklyBlock): [string, number] {
    const name = String(block.getFieldValue('VAR_NAME') || 'isBought');
    return [`globalThis[${JSON.stringify(name)}]`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['variable_rename'] = function(block: BlocklyBlock): string {
    const oldName = asJsString(block.getFieldValue('OLD_NAME') || 'isBought');
    const newName = asJsString(block.getFieldValue('NEW_NAME') || 'isSold');
    return `globalThis.__BOT_BUILDER_VARIABLE_OPS = globalThis.__BOT_BUILDER_VARIABLE_OPS || [];\nglobalThis.__BOT_BUILDER_VARIABLE_OPS.push({ op: "rename", oldName: ${oldName}, newName: ${newName} });\n`;
  };

  Blockly.JavaScript['variable_delete'] = function(block: BlocklyBlock): string {
    const name = asJsString(block.getFieldValue('VAR_NAME') || 'isBought');
    return `globalThis.__BOT_BUILDER_VARIABLE_OPS = globalThis.__BOT_BUILDER_VARIABLE_OPS || [];\nglobalThis.__BOT_BUILDER_VARIABLE_OPS.push({ op: "delete", name: ${name} });\n`;
  };

  Blockly.JavaScript['notification'] = function(block: BlocklyBlock): string {
    const message = asJsString(block.getFieldValue('MESSAGE') || 'Trade executed');
    const withSound = asJsBoolean(block.getFieldValue('WITH_SOUND') ?? true, true);
    const withPopup = asJsBoolean(block.getFieldValue('WITH_POPUP') ?? true, true);
    return `globalThis.__BOT_BUILDER_NOTIFICATIONS = globalThis.__BOT_BUILDER_NOTIFICATIONS || [];\nglobalThis.__BOT_BUILDER_NOTIFICATIONS.push({ message: ${message}, withSound: ${withSound}, withPopup: ${withPopup} });\n`;
  };

  Blockly.JavaScript['notification_stats'] = function(block: BlocklyBlock): string {
    const stat = asJsString(block.getFieldValue('STAT') || 'totalProfit');
    return `globalThis.__BOT_BUILDER_STATS = globalThis.__BOT_BUILDER_STATS || [];\nglobalThis.__BOT_BUILDER_STATS.push({ stat: ${stat} });\n`;
  };

  Blockly.JavaScript['logic_if'] = function(block: BlocklyBlock): string {
    const condition = asJsString(block.getFieldValue('CONDITION') || 'CURRENT_TICK');
    const value = asJsString(block.getFieldValue('VALUE') || '');
    const value2 = asJsString(block.getFieldValue('VALUE_2') || '');
    return `globalThis.__BOT_BUILDER_LOGIC = globalThis.__BOT_BUILDER_LOGIC || [];\nglobalThis.__BOT_BUILDER_LOGIC.push({ type: ${condition}, value: ${value}, value2: ${value2} });\n`;
  };

  Blockly.JavaScript['logic_else'] = function(): string {
    return `globalThis.__BOT_BUILDER_LOGIC = globalThis.__BOT_BUILDER_LOGIC || [];\nglobalThis.__BOT_BUILDER_LOGIC.push({ type: "ELSE" });\n`;
  };

  Blockly.JavaScript['logic_compare'] = function(block: BlocklyBlock): [string, number] {
    const left = asJsRaw(block.getFieldValue('LEFT') || '0', '0');
    const operator = String(block.getFieldValue('OPERATOR') || 'GT').toUpperCase();
    const right = asJsRaw(block.getFieldValue('RIGHT') || '0', '0');
    const opMap: Record<string, string> = {
      EQ: '===',
      NEQ: '!==',
      GT: '>',
      GTE: '>=',
      LT: '<',
      LTE: '<=',
    };
    return [`(${left} ${opMap[operator] || '>'} ${right})`, Blockly.JavaScript.ORDER_RELATIONAL];
  };

  Blockly.JavaScript['logic_gate'] = function(block: BlocklyBlock): [string, number] {
    const operator = String(block.getFieldValue('OPERATOR') || 'AND').toUpperCase();
    return [`globalThis.__BOT_BUILDER_LOGIC = globalThis.__BOT_BUILDER_LOGIC || [];\nglobalThis.__BOT_BUILDER_LOGIC.push({ type: ${JSON.stringify(operator)} });\n`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['math_operation'] = function(block: BlocklyBlock): [string, number] {
    const left = asJsRaw(block.getFieldValue('VALUE_1') || '0', '0');
    const operator = String(block.getFieldValue('OPERATOR') || 'ADD').toUpperCase();
    const right = asJsRaw(block.getFieldValue('VALUE_2') || '0', '0');
    const opMap: Record<string, string> = {
      ADD: '+',
      SUBTRACT: '-',
      MULTIPLY: '*',
      DIVIDE: '/',
      MODULO: '%',
      POWER: '**',
    };
    return [`(${left} ${opMap[operator] || '+'} ${right})`, Blockly.JavaScript.ORDER_RELATIONAL];
  };

  Blockly.JavaScript['math_current_tick'] = function(): [string, number] {
    return ['globalThis.__BOT_BUILDER_CURRENT_TICK ?? 0', Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['math_tick_count'] = function(): [string, number] {
    return ['globalThis.__BOT_BUILDER_TICK_COUNT ?? 0', Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['list_create'] = function(block: BlocklyBlock): string {
    const name = asJsString(block.getFieldValue('LIST_NAME') || 'myList');
    const values = toJsArrayLiteral(block.getFieldValue('INITIAL_VALUES') || '');
    return `globalThis.__BOT_BUILDER_LISTS = globalThis.__BOT_BUILDER_LISTS || [];\nglobalThis.__BOT_BUILDER_LISTS.push({ op: "create", name: ${name}, values: ${values} });\n`;
  };

  Blockly.JavaScript['list_operation'] = function(block: BlocklyBlock): string {
    const name = asJsString(block.getFieldValue('LIST_NAME') || 'myList');
    const operator = asJsString(block.getFieldValue('OPERATOR') || 'ADD');
    const value = asJsString(block.getFieldValue('VALUE') || '');
    return `globalThis.__BOT_BUILDER_LISTS = globalThis.__BOT_BUILDER_LISTS || [];\nglobalThis.__BOT_BUILDER_LISTS.push({ op: ${operator}, name: ${name}, value: ${value} });\n`;
  };

  Blockly.JavaScript['list_contains'] = function(block: BlocklyBlock): [string, number] {
    const name = asJsString(block.getFieldValue('LIST_NAME') || 'myList');
    const value = asJsRaw(block.getFieldValue('VALUE') || 'null', 'null');
    return [`(globalThis.__BOT_BUILDER_LISTS?.find((item) => item.name === ${name})?.values ?? []).includes(${value})`, Blockly.JavaScript.ORDER_RELATIONAL];
  };

  Blockly.JavaScript['list_length'] = function(block: BlocklyBlock): [string, number] {
    const name = asJsString(block.getFieldValue('LIST_NAME') || 'myList');
    return [`(globalThis.__BOT_BUILDER_LISTS?.find((item) => item.name === ${name})?.values ?? []).length`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['text_operation'] = function(block: BlocklyBlock): string {
    const operator = asJsString(block.getFieldValue('OPERATOR') || 'CONCAT');
    const text1 = asJsString(block.getFieldValue('TEXT_1') || '');
    const text2 = asJsString(block.getFieldValue('TEXT_2') || '');
    return `globalThis.__BOT_BUILDER_TEXT = globalThis.__BOT_BUILDER_TEXT || [];\nglobalThis.__BOT_BUILDER_TEXT.push({ op: ${operator}, text1: ${text1}, text2: ${text2} });\n`;
  };

  Blockly.JavaScript['text_contains'] = function(block: BlocklyBlock): [string, number] {
    const text = asJsString(block.getFieldValue('TEXT') || '');
    const substring = asJsString(block.getFieldValue('SUBSTRING') || '');
    return [`${text}.includes(${substring})`, Blockly.JavaScript.ORDER_RELATIONAL];
  };

  Blockly.JavaScript['time_delay'] = function(block: BlocklyBlock): string {
    const duration = asJsNumber(block.getFieldValue('DURATION') || 5, 5);
    const unit = asJsString(block.getFieldValue('UNIT') || 'SECONDS');
    return `globalThis.__BOT_BUILDER_TIME = globalThis.__BOT_BUILDER_TIME || [];\nglobalThis.__BOT_BUILDER_TIME.push({ op: "DELAY", duration: ${duration}, unit: ${unit} });\n`;
  };

  Blockly.JavaScript['time_at'] = function(block: BlocklyBlock): string {
    const time = asJsString(block.getFieldValue('TIME') || '09:00');
    return `globalThis.__BOT_BUILDER_TIME = globalThis.__BOT_BUILDER_TIME || [];\nglobalThis.__BOT_BUILDER_TIME.push({ op: "AT_TIME", time: ${time} });\n`;
  };

  Blockly.JavaScript['time_count_down'] = function(block: BlocklyBlock): string {
    const start = asJsNumber(block.getFieldValue('START') || 10, 10);
    const current = asJsNumber(block.getFieldValue('CURRENT') ?? 10, Number(start));
    return `globalThis.__BOT_BUILDER_TIME = globalThis.__BOT_BUILDER_TIME || [];\nglobalThis.__BOT_BUILDER_TIME.push({ op: "COUNT_DOWN", start: ${start}, current: ${current} });\n`;
  };

  // Backwards-compatible aliases for older palette/code paths.
  Blockly.JavaScript['condition_purchase'] = Blockly.JavaScript['condition_entry'];
  Blockly.JavaScript['condition_sell'] = Blockly.JavaScript['condition_exit'];

  console.log('✅ Condition generators registered');
}
