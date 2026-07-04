import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

export function registerExecutionBlocks(Blockly: BlocklyInterface): void {
  if (!Blockly) {
    console.error('Blockly not loaded');
    return;
  }

  Blockly.Blocks['execution_settings'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'execution_settings',
        message0: '🎯 Execution Settings',
        message1: 'Stake $%1',
        args1: [{ type: 'field_number', name: 'STAKE', value: 10, min: 0.5, max: 50000, precision: 0.5 }],
        message2: 'Duration %1 %2',
        args2: [
          { type: 'field_number', name: 'DURATION', value: 5, min: 1, max: 1000 },
          { type: 'field_dropdown', name: 'DURATION_UNIT', options: [['Ticks', 't']] }
        ],
        colour: '#166534',
        tooltip: 'Configure execution parameters',
      });
    }
  };
}