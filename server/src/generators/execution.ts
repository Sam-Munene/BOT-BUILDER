/**
 * Execution Settings Code Generator - TypeScript
 */

import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

/**
 * Register execution generators
 */
export function registerExecutionGenerators(Blockly: BlocklyInterface): void {
  if (!Blockly || !Blockly.JavaScript) {
    console.error('Blockly.JavaScript not available');
    return;
  }

  Blockly.JavaScript['execution_settings'] = function(block: BlocklyBlock): string {
    const stake = block.getFieldValue('STAKE') || 10;
    const duration = block.getFieldValue('DURATION') || 5;
    const unit = block.getFieldValue('DURATION_UNIT') || 't';
    return `// Execution Settings\nconst EXECUTION = {\n  stake: ${stake},\n  duration: ${duration},\n  durationUnit: "${unit}"\n};\n`;
  };

  console.log('✅ Execution generator registered');
}