import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

export function registerRestartBlocks(Blockly: BlocklyInterface): void {
  if (!Blockly) {
    console.error('Blockly not loaded');
    return;
  }

  Blockly.Blocks['restart_on_win'] = {
    init: function(this: BlocklyBlock): void {
      const block = this as any;
      block.setColour('#831843');
      block.setTooltip('Configure restart after a win');
      block.setInputsInline(true);
      block.appendDummyInput('HEADER')
        .appendField('🏆 Restart on Win')
        .appendField('Reset stake to $')
        .appendField(new (Blockly as any).FieldNumber(10, 0.5, 50000, 0.5), 'STAKE');
    }
  };

  Blockly.Blocks['restart_on_loss'] = {
    init: function(this: BlocklyBlock): void {
      const block = this as any;
      block.setColour('#831843');
      block.setTooltip('Configure restart after a loss');
      block.setInputsInline(true);
      block.appendDummyInput('HEADER')
        .appendField('💔 Restart on Loss')
        .appendField('Reset stake to $')
        .appendField(new (Blockly as any).FieldNumber(10, 0.5, 50000, 0.5), 'STAKE');
    }
  };
}
