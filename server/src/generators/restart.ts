/**
 * Restart Blocks Code Generator - TypeScript
 */

import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

/**
 * Register restart generators
 */
export function registerRestartGenerators(Blockly: BlocklyInterface): void {
  if (!Blockly || !Blockly.JavaScript) {
    console.error('Blockly.JavaScript not available');
    return;
  }

  Blockly.JavaScript['restart_on_win'] = function(block: BlocklyBlock): string {
    const stake = block.getFieldValue('STAKE') || 10;
    return `// Restart on Win\nconst RESTART_WIN = {\n  resetStake: ${stake}\n};\n`;
  };

  Blockly.JavaScript['restart_on_loss'] = function(block: BlocklyBlock): string {
    const stake = block.getFieldValue('STAKE') || 10;
    return `// Restart on Loss\nconst RESTART_LOSS = {\n  resetStake: ${stake}\n};\n`;
  };

  console.log('✅ Restart generators registered');
}