/**
 * Utility Blocks Code Generator - TypeScript
 */

import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

/**
 * Register utility generators
 */
export function registerUtilityGenerators(Blockly: BlocklyInterface): void {
  if (!Blockly || !Blockly.JavaScript) {
    console.error('Blockly.JavaScript not available');
    return;
  }

  Blockly.JavaScript['set_variable'] = function(block: BlocklyBlock): string {
    const name = block.getFieldValue('VAR_NAME') || 'myVar';
    const value = block.getFieldValue('VAR_VALUE') || '0';
    return `// Set Variable\nlet ${name} = ${value};\n`;
  };

  console.log('✅ Utility generators registered');
}