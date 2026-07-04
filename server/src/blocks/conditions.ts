import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

export function registerConditionBlocks(Blockly: BlocklyInterface): void {
  if (!Blockly) {
    console.error('Blockly not loaded');
    return;
  }

  Blockly.Blocks['condition_purchase'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'condition_purchase',
        message0: '📈 Purchase Condition',
        message1: 'When %1',
        args1: [{ type: 'field_dropdown', name: 'CONDITION', options: [['Always', 'ALWAYS']] }],
        message2: 'Value %1',
        args2: [{ type: 'field_input', name: 'VALUE', text: '100' }],
        colour: '#92400e',
        tooltip: 'Define when to purchase',
      });
    }
  };

  Blockly.Blocks['condition_sell'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'condition_sell',
        message0: '📉 Sell Condition',
        message1: 'When %1',
        args1: [{ type: 'field_dropdown', name: 'CONDITION', options: [['Always', 'ALWAYS']] }],
        message2: 'Value %1',
        args2: [{ type: 'field_input', name: 'VALUE', text: '100' }],
        colour: '#92400e',
        tooltip: 'Define when to sell',
      });
    }
  };
}