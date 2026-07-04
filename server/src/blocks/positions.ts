import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

export function registerPositionBlocks(Blockly: BlocklyInterface): void {
  if (!Blockly) {
    console.error('Blockly not loaded');
    return;
  }

  Blockly.Blocks['position_manager'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'position_manager',
        message0: '📈 Position Manager',
        message1: 'Max positions %1',
        args1: [{ type: 'field_number', name: 'MAX_POSITIONS', value: 3, min: 1, max: 20 }],
        message2: 'Stop Loss %1%',
        args2: [{ type: 'field_number', name: 'STOP_LOSS', value: 5, min: 0.1, max: 50, precision: 0.1 }],
        message3: 'Take Profit %1%',
        args3: [{ type: 'field_number', name: 'TAKE_PROFIT', value: 10, min: 0.1, max: 100, precision: 0.1 }],
        colour: '#6366f1',
        tooltip: 'Manage multiple positions',
      });
    }
  };

  Blockly.Blocks['position_status'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'position_status',
        message0: '📊 Position Status',
        message1: 'Symbol %1',
        args1: [{ type: 'field_dropdown', name: 'SYMBOL', options: [['VIX_100', 'VIX_100']] }],
        output: 'Position',
        colour: '#6366f1',
        tooltip: 'Get position status',
      });
    }
  };
}