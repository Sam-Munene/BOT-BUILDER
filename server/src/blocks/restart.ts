import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

export function registerRestartBlocks(Blockly: BlocklyInterface): void {
  if (!Blockly) {
    console.error('Blockly not loaded');
    return;
  }

  Blockly.Blocks['restart_on_win'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'restart_on_win',
        message0: '🏆 Restart on Win',
        message1: 'Reset stake to $%1',
        args1: [{ type: 'field_number', name: 'STAKE', value: 10, min: 0.5, max: 50000, precision: 0.5 }],
        colour: '#831843',
        tooltip: 'Configure restart after a win',
      });
    }
  };

  Blockly.Blocks['restart_on_loss'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'restart_on_loss',
        message0: '💔 Restart on Loss',
        message1: 'Reset stake to $%1',
        args1: [{ type: 'field_number', name: 'STAKE', value: 10, min: 0.5, max: 50000, precision: 0.5 }],
        colour: '#831843',
        tooltip: 'Configure restart after a loss',
      });
    }
  };
}