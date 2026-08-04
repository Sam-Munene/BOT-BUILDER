import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

export function registerConditionBlocks(Blockly: BlocklyInterface): void {
  if (!Blockly) {
    console.error('Blockly not loaded');
    return;
  }

  Blockly.Blocks['condition_entry'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'condition_entry',
        message0: '📈 Entry Condition',
        message1: 'When %1',
        args1: [{
          type: 'field_dropdown',
          name: 'CONDITION',
          options: [['Always', 'ALWAYS']],
        }],
        message2: 'Value %1',
        args2: [{ type: 'field_input', name: 'VALUE', text: '100' }],
        message3: 'Value 2 %1',
        args3: [{ type: 'field_input', name: 'VALUE_2', text: '' }],
        colour: '#92400e',
        tooltip: 'Define when to enter a trade',
      });
    }
  };

  Blockly.Blocks['condition_exit'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'condition_exit',
        message0: '📉 Exit Condition',
        message1: 'When %1',
        args1: [{
          type: 'field_dropdown',
          name: 'CONDITION',
          options: [['Sell by Count Down', 'SELL_BY_COUNT_DOWN']],
        }],
        message2: 'Value %1',
        args2: [{ type: 'field_input', name: 'VALUE', text: '5' }],
        colour: '#92400e',
        tooltip: 'Define when to exit a trade',
      });
    }
  };

  Blockly.Blocks['martingale_settings'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'martingale_settings',
        message0: '🧠 Utility / Risk Settings',
        message1: 'Initial Stake %1',
        args1: [{ type: 'field_number', name: 'INITIAL_STAKE', value: 10, min: 0.5, max: 50000, precision: 0.5 }],
        message2: 'Multiplier %1',
        args2: [{ type: 'field_number', name: 'MULTIPLIER', value: 2, min: 1.1, max: 10, precision: 0.1 }],
        message3: 'Max Stake %1',
        args3: [{ type: 'field_number', name: 'MAX_STAKE', value: 50, min: 0.5, max: 50000, precision: 0.5 }],
        message4: 'Profit Threshold %1',
        args4: [{ type: 'field_number', name: 'PROFIT_THRESHOLD', value: 100, min: 0, max: 10000, precision: 0.5 }],
        message5: 'Loss Threshold %1',
        args5: [{ type: 'field_number', name: 'LOSS_THRESHOLD', value: 50, min: 0, max: 10000, precision: 0.5 }],
        message6: 'Trade Again After Win %1',
        args6: [{ type: 'field_checkbox', name: 'TRADE_AGAIN', checked: true }],
        colour: '#92400e',
        tooltip: 'Configure trade management',
      });
    }
  };

  Blockly.Blocks['notification'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'notification',
        message0: '🔔 Notify',
        message1: 'Message %1',
        args1: [{ type: 'field_input', name: 'MESSAGE', text: 'Trade executed' }],
        message2: 'Play sound %1',
        args2: [{ type: 'field_checkbox', name: 'WITH_SOUND', checked: true }],
        message3: 'Show popup %1',
        args3: [{ type: 'field_checkbox', name: 'WITH_POPUP', checked: true }],
        colour: '#92400e',
        tooltip: 'Configure notifications',
      });
    }
  };

  Blockly.Blocks['notification_stats'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'notification_stats',
        message0: '📊 Current Stats',
        message1: 'Statistic %1',
        args1: [{
          type: 'field_dropdown',
          name: 'STAT',
          options: [
            ['Total Profit', 'totalProfit'],
            ['Total Trades', 'totalTrades'],
            ['Win Rate', 'winRate'],
            ['Current Stake', 'currentStake'],
            ['Max Stake', 'maxStake'],
            ['Loss Streak', 'lossStreak'],
            ['Win Streak', 'winStreak'],
          ],
        }],
        colour: '#92400e',
        tooltip: 'Display strategy statistics',
      });
    }
  };
}
