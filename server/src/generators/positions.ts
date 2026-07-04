/**
 * Position Manager Code Generator - TypeScript
 */

import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

/**
 * Register position generators
 */
export function registerPositionGenerators(Blockly: BlocklyInterface): void {
  if (!Blockly || !Blockly.JavaScript) {
    console.error('Blockly.JavaScript not available');
    return;
  }

  // Statement block - returns string
  Blockly.JavaScript['position_manager'] = function(block: BlocklyBlock): string {
    const maxPositions = block.getFieldValue('MAX_POSITIONS') || 3;
    const stopLoss = block.getFieldValue('STOP_LOSS') || 5;
    const takeProfit = block.getFieldValue('TAKE_PROFIT') || 10;
    return `// Position Manager\nconst POSITION_MANAGER = {\n  maxPositions: ${maxPositions},\n  stopLoss: ${stopLoss / 100},\n  takeProfit: ${takeProfit / 100}\n};\n`;
  };

  // Value block - returns tuple [string, number]
  Blockly.JavaScript['position_status'] = function(block: BlocklyBlock): [string, number] {
    const symbol = block.getFieldValue('SYMBOL') || 'VIX_100';
    return [`getPositionStatus('${symbol}')`, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  };

  console.log('✅ Position generators registered');
}