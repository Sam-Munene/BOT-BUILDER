import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

export function registerIndicatorBlocks(Blockly: BlocklyInterface): void {
  if (!Blockly) {
    console.error('Blockly not loaded');
    return;
  }

  Blockly.Blocks['indicator'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'indicator',
        message0: '📊 %1',
        args0: [{ type: 'field_dropdown', name: 'INDICATOR', options: [['RSI', 'RSI']] }],
        message1: 'Period %1',
        args1: [{ type: 'field_number', name: 'PERIOD', value: 14, min: 1, max: 1000 }],
        message2: 'Symbol %1',
        args2: [{ type: 'field_dropdown', name: 'SYMBOL', options: [['VIX_100', 'VIX_100']] }],
        output: 'Number',
        colour: '#8b5cf6',
        tooltip: 'Technical indicator value',
      });
    }
  };

  Blockly.Blocks['condition_indicator'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'condition_indicator',
        message0: '🔍 Indicator Condition',
        message1: '%1 %2 %3',
        args1: [
          { type: 'input_value', name: 'INDICATOR', check: 'Number' },
          { type: 'field_dropdown', name: 'OPERATOR', options: [['>', 'GT']] },
          { type: 'input_value', name: 'THRESHOLD', check: 'Number' }
        ],
        output: 'Boolean',
        colour: '#8b5cf6',
        tooltip: 'Compare indicator value to threshold',
      });
    }
  };
}