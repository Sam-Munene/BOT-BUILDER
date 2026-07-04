/**
 * Condition Blocks Code Generator - TypeScript
 */

import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

/**
 * Register condition generators
 */
export function registerConditionGenerators(Blockly: BlocklyInterface): void {
  if (!Blockly || !Blockly.JavaScript) {
    console.error('Blockly.JavaScript not available');
    return;
  }

  // Statement blocks - return string
  Blockly.JavaScript['condition_purchase'] = function(block: BlocklyBlock): string {
    const condition = block.getFieldValue('CONDITION') || 'ALWAYS';
    const value = block.getFieldValue('VALUE') || '';
    return `// Purchase Condition\nconst PURCHASE_CONDITION = {\n  type: "${condition}",\n  value: "${value}"\n};\n`;
  };

  Blockly.JavaScript['condition_sell'] = function(block: BlocklyBlock): string {
    const condition = block.getFieldValue('CONDITION') || 'ALWAYS';
    const value = block.getFieldValue('VALUE') || '';
    return `// Sell Condition\nconst SELL_CONDITION = {\n  type: "${condition}",\n  value: "${value}"\n};\n`;
  };

  console.log('✅ Condition generators registered');
}