/**
 * Blockly Type Definitions
 */

export interface BlocklyBlock {
  type: string;
  id: string;
  init: () => void;
  jsonInit: (json: any) => void;
  getFieldValue: (name: string) => any;
  setFieldValue: (value: any, name: string) => void;
  getField: (name: string) => any;
  moveBy: (x: number, y: number) => void;
  render: () => void;
  initSvg: () => void;
  getConnections_: (all: boolean) => any[];
  unplug: (heal: boolean) => void;
  targetBlock: () => BlocklyBlock | null;
}

export interface BlocklyWorkspace {
  newBlock: (type: string) => BlocklyBlock;
  clear: () => void;
  getAllBlocks: () => BlocklyBlock[];
  addChangeListener: (listener: (event: any) => void) => void;
  clearSelection: () => void;
  select: (block: BlocklyBlock) => void;
  getMetrics: () => any;
  getBlockById: (id: string) => BlocklyBlock | null;
}

export interface BlocklyJavaScript {
  workspaceToCode: (workspace: BlocklyWorkspace) => string;
  valueToCode: (block: BlocklyBlock, name: string, order: number) => string;
  ORDER_NONE: number;
  ORDER_ATOMIC: number;
  ORDER_FUNCTION_CALL: number;
  ORDER_RELATIONAL: number;
  [key: string]: any;
}

export interface BlocklyInterface {
  Blocks: {
    [key: string]: {
      init: () => void;
      onchange?: (event: any) => void;
    };
  };
  JavaScript: BlocklyJavaScript;
  inject: (container: string, config: any) => BlocklyWorkspace;
  Xml: {
    workspaceToDom: (workspace: BlocklyWorkspace) => any;
    domToText: (dom: any) => string;
    textToDom: (text: string) => any;
    domToWorkspace: (dom: any, workspace: BlocklyWorkspace) => void;
  };
  Events: {
    FIELD_CHANGE: string;
    BLOCK_MOVE: string;
  };
  VERSION: string;
}

export interface Strategy {
  market?: MarketSettings;
  execution?: ExecutionSettings;
  conditions?: Conditions;
  restart?: RestartSettings;
  variables?: Record<string, any>;
  positionManager?: PositionManager;
  _api_payload?: any;
}

export interface MarketSettings {
  symbol: string;
  category: string;
  contractType: string;
  barrier?: number;
  barrierLow?: number;
  barrierHigh?: number;
  digitTarget?: number;
  digitLow?: number;
  digitHigh?: number;
}

export interface ExecutionSettings {
  stake: number;
  duration: number;
  durationUnit: string;
}

export interface Conditions {
  purchase?: Condition;
  sell?: Condition;
}

export interface Condition {
  type: string;
  value: string;
}

export interface RestartSettings {
  onWin?: ResetStake;
  onLoss?: ResetStake;
}

export interface ResetStake {
  resetStake: number;
}

export interface PositionManager {
  maxPositions: number;
  stopLoss: number;
  takeProfit: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  hasWarnings?: boolean;
}

export type GeneratorReturn = string | [string, number];