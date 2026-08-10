import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

type ConditionShape = {
  valueVisible: boolean;
  value2Visible: boolean;
  valueLabel: string;
  value2Label: string;
};

function getConditionField(Blockly: BlocklyInterface, options: Array<[string, string]>, defaultValue: string): any {
  const FieldDropdown = (Blockly as any).FieldDropdown;
  return new FieldDropdown(options, (value: string) => value || defaultValue);
}

function getTextField(Blockly: BlocklyInterface, defaultValue: string): any {
  const FieldTextInput = (Blockly as any).FieldTextInput;
  return new FieldTextInput(defaultValue);
}

function getConditionValue(condition: string): string {
  return String(condition ?? "").trim().toUpperCase();
}

function getValueLabels(condition: string, side: "value" | "value2", mode: "entry" | "exit"): string {
  const normalized = getConditionValue(condition);
  if (mode === "entry") {
    switch (normalized) {
      case "PRICE_GT":
      case "PRICE_LT":
        return "Price";
      case "PRICE_BETWEEN":
        return side === "value" ? "Lower price" : "Upper price";
      case "CURRENT_TICK":
        return "Tick price";
      case "TICK_COUNT":
        return "Tick count";
      case "TIME_OF_DAY":
        return "End time";
      case "DURATION_ELAPSED":
        return "Duration";
      case "LOSS_THRESHOLD":
        return "Loss %";
      case "PROFIT_THRESHOLD":
        return "Profit %";
      default:
        return side === "value2" ? "Value 2" : "Value";
    }
  }

  switch (normalized) {
    case "PRICE_GT":
    case "PRICE_LT":
      return "Price";
    case "PRICE_BETWEEN":
      return side === "value" ? "Lower price" : "Upper price";
    case "SELL_BY_COUNT_DOWN":
      return "Duration";
    case "CURRENT_TICK":
      return "Tick price";
    case "TICK_COUNT":
      return "Tick count";
    case "TIME_OF_DAY":
      return "End time";
    case "DURATION_ELAPSED":
      return "Duration";
    case "SELL_BY_TAKE_PROFIT":
      return "Profit";
    default:
      return side === "value2" ? "Value 2" : "Value";
  }
}

function getEntryShape(condition: string): ConditionShape {
  switch (getConditionValue(condition)) {
    case "ALWAYS":
    case "HAS_POSITION":
    case "NO_POSITION":
      return { valueVisible: false, value2Visible: false, valueLabel: "Value", value2Label: "Value 2" };
    case "PRICE_BETWEEN":
      return {
        valueVisible: true,
        value2Visible: true,
        valueLabel: getValueLabels(condition, "value", "entry"),
        value2Label: getValueLabels(condition, "value2", "entry"),
      };
    case "TIME_OF_DAY":
      return {
        valueVisible: true,
        value2Visible: false,
        valueLabel: getValueLabels(condition, "value", "entry"),
        value2Label: getValueLabels(condition, "value2", "entry"),
      };
    case "DURATION_ELAPSED":
      return {
        valueVisible: true,
        value2Visible: false,
        valueLabel: getValueLabels(condition, "value", "entry"),
        value2Label: getValueLabels(condition, "value2", "entry"),
      };
    case "TICK_COUNT":
      return {
        valueVisible: true,
        value2Visible: false,
        valueLabel: getValueLabels(condition, "value", "entry"),
        value2Label: getValueLabels(condition, "value2", "entry"),
      };
    case "CURRENT_TICK":
      return {
        valueVisible: true,
        value2Visible: false,
        valueLabel: getValueLabels(condition, "value", "entry"),
        value2Label: getValueLabels(condition, "value2", "entry"),
      };
    case "LOSS_THRESHOLD":
    case "PROFIT_THRESHOLD":
      return {
        valueVisible: true,
        value2Visible: false,
        valueLabel: getValueLabels(condition, "value", "entry"),
        value2Label: getValueLabels(condition, "value2", "entry"),
      };
    default:
      return {
        valueVisible: true,
        value2Visible: false,
        valueLabel: getValueLabels(condition, "value", "entry"),
        value2Label: getValueLabels(condition, "value2", "entry"),
      };
  }
}

function getExitShape(condition: string): ConditionShape {
  switch (getConditionValue(condition)) {
    case "STOP_LOSS_HIT":
    case "TAKE_PROFIT_HIT":
      return { valueVisible: false, value2Visible: false, valueLabel: "Value", value2Label: "Value 2" };
    case "PRICE_BETWEEN":
      return {
        valueVisible: true,
        value2Visible: true,
        valueLabel: getValueLabels(condition, "value", "exit"),
        value2Label: getValueLabels(condition, "value2", "exit"),
      };
    case "SELL_BY_COUNT_DOWN":
      return {
        valueVisible: true,
        value2Visible: false,
        valueLabel: getValueLabels(condition, "value", "exit"),
        value2Label: getValueLabels(condition, "value2", "exit"),
      };
    case "TIME_OF_DAY":
      return {
        valueVisible: true,
        value2Visible: false,
        valueLabel: getValueLabels(condition, "value", "exit"),
        value2Label: getValueLabels(condition, "value2", "exit"),
      };
    case "DURATION_ELAPSED":
      return {
        valueVisible: true,
        value2Visible: false,
        valueLabel: getValueLabels(condition, "value", "exit"),
        value2Label: getValueLabels(condition, "value2", "exit"),
      };
    case "CURRENT_TICK":
      return {
        valueVisible: true,
        value2Visible: false,
        valueLabel: getValueLabels(condition, "value", "exit"),
        value2Label: getValueLabels(condition, "value2", "exit"),
      };
    case "TICK_COUNT":
      return {
        valueVisible: true,
        value2Visible: false,
        valueLabel: getValueLabels(condition, "value", "exit"),
        value2Label: getValueLabels(condition, "value2", "exit"),
      };
    case "PRICE_GT":
    case "PRICE_LT":
      return {
        valueVisible: true,
        value2Visible: false,
        valueLabel: getValueLabels(condition, "value", "exit"),
        value2Label: getValueLabels(condition, "value2", "exit"),
      };
    default:
      return {
        valueVisible: true,
        value2Visible: false,
        valueLabel: getValueLabels(condition, "value", "exit"),
        value2Label: getValueLabels(condition, "value2", "exit"),
      };
  }
}

function rebuildConditionInputs(
  Blockly: BlocklyInterface,
  block: any,
  conditionFieldName: string,
  shapeResolver: (condition: string) => ConditionShape,
): void {
  const condition = String(block.getFieldValue(conditionFieldName) || "");
  const shape = shapeResolver(condition);
  const currentValue = String(block.getFieldValue("VALUE") ?? "");
  const currentValue2 = String(block.getFieldValue("VALUE_2") ?? "");

  if (block.getInput?.("VALUE_ROW")) {
    block.removeInput("VALUE_ROW", true);
  }
  if (block.getInput?.("VALUE_2_ROW")) {
    block.removeInput("VALUE_2_ROW", true);
  }

  if (shape.valueVisible) {
    block.appendDummyInput("VALUE_ROW")
      .appendField(shape.valueLabel)
      .appendField(getTextField(Blockly, currentValue || ""), "VALUE");
  }

  if (shape.value2Visible) {
    block.appendDummyInput("VALUE_2_ROW")
      .appendField(shape.value2Label)
      .appendField(getTextField(Blockly, currentValue2 || ""), "VALUE_2");
  }

  if (typeof block.render === "function") {
    block.render();
  }
}

function wireDynamicConditionBlock(
  Blockly: BlocklyInterface,
  block: any,
  conditionFieldName: string,
  shapeResolver: (condition: string) => ConditionShape,
): void {
  const updateShape = (): void => {
    rebuildConditionInputs(Blockly, block, conditionFieldName, shapeResolver);
  };

  block.updateShape_ = updateShape;

  const conditionField = typeof block.getField === "function" ? block.getField(conditionFieldName) : null;
  if (conditionField && typeof conditionField.setValidator === "function") {
    conditionField.setValidator((value: string) => {
      window.setTimeout(updateShape, 0);
      return value;
    });
  }

  updateShape();
}

export function registerConditionBlocks(Blockly: BlocklyInterface): void {
  if (!Blockly) {
    console.error('Blockly not loaded');
    return;
  }

  Blockly.Blocks['condition_entry'] = {
    init: function(this: BlocklyBlock): void {
      const block = this as any;
      block.setColour('#92400e');
      block.setTooltip('Define when to enter a trade');
      block.setInputsInline(true);

      block.appendDummyInput('HEADER')
        .appendField('📈 Entry Condition');

      block.appendDummyInput('CONDITION_ROW')
        .appendField('When')
        .appendField(getConditionField(Blockly, [
          ['Always', 'ALWAYS'],
          ['Price Above', 'PRICE_GT'],
          ['Price Below', 'PRICE_LT'],
          ['Price Between', 'PRICE_BETWEEN'],
          ['Current Tick Value', 'CURRENT_TICK'],
          ['Tick Count', 'TICK_COUNT'],
          ['Has Position', 'HAS_POSITION'],
          ['No Position', 'NO_POSITION'],
          ['Loss Threshold Reached', 'LOSS_THRESHOLD'],
          ['Profit Threshold Reached', 'PROFIT_THRESHOLD'],
          ['Time of Day', 'TIME_OF_DAY'],
          ['Duration Elapsed', 'DURATION_ELAPSED'],
        ], 'ALWAYS'), 'CONDITION');

      wireDynamicConditionBlock(Blockly, block, 'CONDITION', getEntryShape);
    },
  };

  Blockly.Blocks['condition_exit'] = {
    init: function(this: BlocklyBlock): void {
      const block = this as any;
      block.setColour('#92400e');
      block.setTooltip('Define when to exit a trade');
      block.setInputsInline(true);

      block.appendDummyInput('HEADER')
        .appendField('📉 Exit Condition');

      block.appendDummyInput('CONDITION_ROW')
        .appendField('When')
        .appendField(getConditionField(Blockly, [
          ['Sell by Count Down', 'SELL_BY_COUNT_DOWN'],
          ['Sell by Take Profit', 'SELL_BY_TAKE_PROFIT'],
          ['Price Above', 'PRICE_GT'],
          ['Price Below', 'PRICE_LT'],
          ['Price Between', 'PRICE_BETWEEN'],
          ['Current Tick Value', 'CURRENT_TICK'],
          ['Tick Count', 'TICK_COUNT'],
          ['Stop Loss Hit', 'STOP_LOSS_HIT'],
          ['Take Profit Hit', 'TAKE_PROFIT_HIT'],
          ['Time of Day', 'TIME_OF_DAY'],
          ['Duration Elapsed', 'DURATION_ELAPSED'],
        ], 'SELL_BY_COUNT_DOWN'), 'CONDITION');

      wireDynamicConditionBlock(Blockly, block, 'CONDITION', getExitShape);
    },
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
