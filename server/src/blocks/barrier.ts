import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

export function registerBarrierBlocks(Blockly: BlocklyInterface): void {
  if (!Blockly) {
    console.error('Blockly not loaded');
    return;
  }

  Blockly.Blocks['barrier'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'barrier',
        message0: '🎯 Barrier',
        message1: 'Type %1',
        args1: [{ type: 'field_dropdown', name: 'BARRIER_TYPE', options: [['Single', 'single']] }],
        message2: 'Value %1',
        args2: [{ type: 'field_number', name: 'BARRIER_VALUE', value: 2.5, min: 0.001, max: 100, precision: 0.001 }],
        message3: 'Direction %1',
        args3: [{ type: 'field_dropdown', name: 'BARRIER_DIRECTION', options: [['Above', 'above']] }],
        colour: '#f59e0b',
        tooltip: 'Configure barrier for contract',
      });
    }
  };

  Blockly.Blocks['double_barrier'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'double_barrier',
        message0: '🔲 Double Barrier',
        message1: 'Lower %1',
        args1: [{ type: 'field_number', name: 'BARRIER_LOW', value: -3.0, min: -100, max: 0, precision: 0.001 }],
        message2: 'Upper %1',
        args2: [{ type: 'field_number', name: 'BARRIER_HIGH', value: 3.0, min: 0, max: 100, precision: 0.001 }],
        colour: '#f59e0b',
        tooltip: 'Configure double barrier for contract',
      });
    }
  };

  Blockly.Blocks['digit_target'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'digit_target',
        message0: '🔢 Digit Target',
        message1: 'Target %1',
        args1: [{ type: 'field_number', name: 'DIGIT_TARGET', value: 5, min: 0, max: 9 }],
        colour: '#f59e0b',
        tooltip: 'Configure digit target for contract',
      });
    }
  };

  Blockly.Blocks['digit_range'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'digit_range',
        message0: '🔢 Digit Range',
        message1: 'Low %1',
        args1: [{ type: 'field_number', name: 'DIGIT_LOW', value: 3, min: 0, max: 8 }],
        message2: 'High %1',
        args2: [{ type: 'field_number', name: 'DIGIT_HIGH', value: 6, min: 1, max: 9 }],
        colour: '#f59e0b',
        tooltip: 'Configure digit range for contract',
      });
    }
  };
}