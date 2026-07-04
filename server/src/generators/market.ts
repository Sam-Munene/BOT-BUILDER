/**
 * Market Settings Code Generator - TypeScript
 */

import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

/**
 * Register market generators
 */
export function registerMarketGenerators(Blockly: BlocklyInterface): void {
  if (!Blockly || !Blockly.JavaScript) {
    console.error('Blockly.JavaScript not available');
    return;
  }

  // Register the generator for market_settings block
  Blockly.JavaScript['market_settings'] = function(block: BlocklyBlock): string {
    const symbol = block.getFieldValue('SYMBOL') || 'VIX_100';
    const category = block.getFieldValue('CATEGORY') || 'path_independent';
    const contractType = block.getFieldValue('CONTRACT_TYPE') || 'UP';
    
    return `// Market Settings\nconst MARKET = {\n  symbol: "${symbol}",\n  category: "${category}",\n  contractType: "${contractType}"\n};\n`;
  };

  console.log('✅ Market generator registered');
}