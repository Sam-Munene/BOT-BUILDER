/**
 * Barrier Code Generator - TypeScript
 */

import { BlocklyInterface, BlocklyBlock } from '../types/blockly';

/**
 * Register barrier generators
 */
export function registerBarrierGenerators(Blockly: BlocklyInterface): void {
  if (!Blockly || !Blockly.JavaScript) {
    console.error('Blockly.JavaScript not available');
    return;
  }

  // Value blocks - return tuple [string, number]
  Blockly.JavaScript['barrier'] = function(block: BlocklyBlock): [string, number] {
    const barrierType = block.getFieldValue('BARRIER_TYPE') || 'single';
    const value = block.getFieldValue('BARRIER_VALUE') || 2.5;
    const direction = block.getFieldValue('BARRIER_DIRECTION') || 'above';
    
    if (barrierType === 'single') {
      const sign = direction === 'above' ? '' : '-';
      return [`${sign}${value}`, Blockly.JavaScript.ORDER_ATOMIC];
    }
    
    return [`${value}`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['double_barrier'] = function(block: BlocklyBlock): [string, number] {
    const low = block.getFieldValue('BARRIER_LOW') || -3.0;
    const high = block.getFieldValue('BARRIER_HIGH') || 3.0;
    return [`{ low: ${low}, high: ${high} }`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['digit_target'] = function(block: BlocklyBlock): [string, number] {
    const target = block.getFieldValue('DIGIT_TARGET') || 5;
    return [`${target}`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['digit_range'] = function(block: BlocklyBlock): [string, number] {
    const low = block.getFieldValue('DIGIT_LOW') || 3;
    const high = block.getFieldValue('DIGIT_HIGH') || 6;
    return [`{ low: ${low}, high: ${high} }`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  console.log('✅ Barrier generators registered');
}