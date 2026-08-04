/**
 * Indicator Code Generator - TypeScript
 */

import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

/**
 * Register indicator generators
 */
export function registerIndicatorGenerators(Blockly: BlocklyInterface): void {
  if (!Blockly || !Blockly.JavaScript) {
    console.error('Blockly.JavaScript not available');
    return;
  }

  // Value block - returns tuple [string, number]
  Blockly.JavaScript['indicator'] = function(block: BlocklyBlock): [string, number] {
    const indicator = block.getFieldValue('INDICATOR') || 'RSI';
    const period = block.getFieldValue('PERIOD') || 14;
    const symbol = block.getFieldValue('SYMBOL') || 'VIX_100';
    return [`getIndicator('${indicator}', ${period}, '${symbol}')`, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  };

  // Value block - returns tuple [string, number]
  Blockly.JavaScript['condition_indicator'] = function(block: BlocklyBlock): [string, number] {
    const indicator = Blockly.JavaScript.valueToCode(block, 'INDICATOR', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    const operator = block.getFieldValue('OPERATOR') || 'GT';
    const threshold = Blockly.JavaScript.valueToCode(block, 'THRESHOLD', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    
    const opMap: Record<string, string> = {
      'GT': '>',
      'LT': '<',
      'GTE': '>=',
      'LTE': '<=',
      'EQ': '==='
    };
    
    return [`${indicator} ${opMap[operator]} ${threshold}`, Blockly.JavaScript.ORDER_RELATIONAL];
  };

  Blockly.JavaScript['indicators_settings'] = function(block: BlocklyBlock): string {
    const indicator = block.getFieldValue('INDICATOR') || 'none';
    const period = block.getFieldValue('PERIOD') || 14;
    const symbol = block.getFieldValue('SYMBOL') || 'VIX_100';
    const active = String(block.getFieldValue('ACTIVE') ?? 'TRUE').toUpperCase() === 'TRUE';
    const left = block.getFieldValue('LEFT') || 'indicator';
    const operator = block.getFieldValue('OPERATOR') || 'GT';
    const threshold = block.getFieldValue('THRESHOLD') || 50;
    return `const INDICATORS_SETTINGS = {\n  indicator: "${indicator}",\n  period: ${period},\n  symbol: "${symbol}",\n  active: ${active},\n  comparison: {\n    left: "${left}",\n    operator: "${operator}",\n    threshold: ${threshold}\n  }\n};\n`;
  };

  console.log('✅ Indicator generators registered');
}
