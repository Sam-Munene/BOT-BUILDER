import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

export function registerMarketBlocks(Blockly: BlocklyInterface): void {
  if (!Blockly) {
    console.error('Blockly not loaded');
    return;
  }

  Blockly.Blocks['market_settings'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'market_settings',
        message0: '🏦 Market Settings',
        message1: 'Symbol %1',
        args1: [{ type: 'field_dropdown', name: 'SYMBOL', options: [['VIX_100', 'VIX_100']] }],
        message2: 'Category %1',
        args2: [{ type: 'field_dropdown', name: 'CATEGORY', options: [['Up/Down', 'path_independent']] }],
        message3: 'Contract Type %1',
        args3: [{ type: 'field_dropdown', name: 'CONTRACT_TYPE', options: [['UP', 'UP']] }],
        colour: '#1e40af',
        tooltip: 'Configure market settings',
      });
    }
  };
}