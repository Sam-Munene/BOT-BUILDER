import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

export function registerUtilityBlocks(Blockly: BlocklyInterface): void {
  if (!Blockly) {
    console.error('Blockly not loaded');
    return;
  }

  Blockly.Blocks['set_variable'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'set_variable',
        message0: '📝 Set Variable',
        message1: '%1 = %2',
        args1: [
          { type: 'field_input', name: 'VAR_NAME', text: 'myVar' },
          { type: 'field_input', name: 'VAR_VALUE', text: '0' }
        ],
        colour: '#1e293b',
        tooltip: 'Set a variable value',
      });
    }
  };

  Blockly.Blocks['websocket_connection'] = {
    init: function(this: BlocklyBlock): void {
      this.jsonInit({
        type: 'websocket_connection',
        message0: '🔌 WebSocket Connection',
        message1: 'URL %1',
        args1: [{ type: 'field_input', name: 'WS_URL', text: 'wss://hft.safarigari.com' }],
        message2: 'Token %1',
        args2: [{ type: 'field_input', name: 'TOKEN', text: '' }],
        colour: '#1e293b',
        tooltip: 'Configure WebSocket connection',
      });
    }
  };
}
