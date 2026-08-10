/**
 * Strategy Service - Handles strategy parsing and building
 */

import {
  MarketSettings,
  ExecutionSettings,
  Conditions,
  Condition,
  TradeManagement,
  StrategyVariable,
  StrategyStat,
} from '../types/blockly';

export interface ExecutionResult {
  success: boolean;
  contract_id?: number;
  symbol?: string;
  contract_type?: string;
  stake?: number;
  payout?: number;
  entry_price?: number;
  timestamp?: string;
  error?: string;
}

export interface StrategySummary {
  status: 'success' | 'failed';
  message: string;
  contractId?: number;
  symbol?: string;
  contractType?: string;
  stake?: number;
  payout?: number;
  entryPrice?: number;
  timestamp?: string;
}

export interface ParseResult {
  market: MarketSettings | null;
  execution: ExecutionSettings | null;
  indicators: Array<Record<string, any>>;
  conditions: Conditions;
  restart: {
    condition?: { type: string } | null;
    onWin: { resetStake: number } | null;
    onLoss: { resetStake: number } | null;
  };
  variables: Record<string, any>;
  positionManager?: any;
  _api_payload?: any;
}

function inferExitGroup(type: string): string {
  const normalized = String(type ?? '').trim().toUpperCase();
  if (['TIME_OF_DAY', 'DURATION_ELAPSED', 'SELL_BY_COUNT_DOWN'].includes(normalized)) return 'time';
  if (['STOP_LOSS_HIT', 'TAKE_PROFIT_HIT', 'SELL_BY_TAKE_PROFIT'].includes(normalized)) return 'risk';
  return 'price';
}

export class StrategyService {
  /**
   * Parse strategy from generated code
   * @param code - Generated JavaScript code
   */
  parseStrategy(code: string): ParseResult {
    const strategy: ParseResult = {
      market: null,
      execution: null,
      indicators: [],
      conditions: {
        entry: null,
        exit: null,
        exits: [],
        management: null,
        variables: [],
        notifications: null,
        stats: [],
        purchase: null,
        sell: null,
      },
      restart: {
        condition: null,
        onWin: null,
        onLoss: null
      },
      variables: {}
    };

    // Parse market settings
    const marketMatch = code.match(
      /MARKET\s*=\s*\{[^}]*symbol:\s*"([^"]*)"[^}]*category:\s*"([^"]*)"[^}]*contractType:\s*"([^"]*)"/
    );
    if (marketMatch) {
      const market: MarketSettings = {
        symbol: marketMatch[1],
        category: marketMatch[2],
        contractType: marketMatch[3]
      };

      // Parse barrier if present
      const barrierMatch = code.match(/barrier:\s*([\d.]+)/);
      if (barrierMatch) {
        market.barrier = parseFloat(barrierMatch[1]);
      }

      // Parse double barrier
      const barrierLowMatch = code.match(/barrierLow:\s*([\d.]+)/);
      const barrierHighMatch = code.match(/barrierHigh:\s*([\d.]+)/);
      if (barrierLowMatch && barrierHighMatch) {
        market.barrierLow = parseFloat(barrierLowMatch[1]);
        market.barrierHigh = parseFloat(barrierHighMatch[1]);
      }

      // Parse digit target
      const digitTargetMatch = code.match(/digitTarget:\s*([\d.]+)/);
      if (digitTargetMatch) {
        market.digitTarget = parseFloat(digitTargetMatch[1]);
      }

      // Parse digit range
      const digitLowMatch = code.match(/digitLow:\s*([\d.]+)/);
      const digitHighMatch = code.match(/digitHigh:\s*([\d.]+)/);
      if (digitLowMatch && digitHighMatch) {
        market.digitLow = parseFloat(digitLowMatch[1]);
        market.digitHigh = parseFloat(digitHighMatch[1]);
      }

      strategy.market = market;
    }

    // Parse execution settings
    const execMatch = code.match(
      /EXECUTION\s*=\s*\{[^}]*stake:\s*([\d.]+)[^}]*duration:\s*([\d.]+)[^}]*durationUnit:\s*"([^"]*)"/
    );
    if (execMatch) {
      strategy.execution = {
        stake: parseFloat(execMatch[1]),
        duration: parseFloat(execMatch[2]),
        durationUnit: execMatch[3]
      };
    }

    const parseCondition = (pattern: RegExp): Condition | null => {
      const match = code.match(pattern);
      if (!match) return null;
      return {
        type: match[1],
        value: match[2],
        value2: match[3] ?? '',
      };
    };

    strategy.conditions.entry =
      parseCondition(/ENTRY_CONDITION\s*=\s*\{[^}]*type:\s*"([^"]*)"[^}]*value:\s*"([^"]*)"[^}]*value2:\s*"([^"]*)"/)
      ?? parseCondition(/PURCHASE_CONDITION\s*=\s*\{[^}]*type:\s*"([^"]*)"[^}]*value:\s*"([^"]*)"/);

    strategy.conditions.exit =
      parseCondition(/EXIT_CONDITION\s*=\s*\{[^}]*type:\s*"([^"]*)"[^}]*value:\s*"([^"]*)"[^}]*value2:\s*"([^"]*)"/)
      ?? parseCondition(/SELL_CONDITION\s*=\s*\{[^}]*type:\s*"([^"]*)"[^}]*value:\s*"([^"]*)"/);

    const exitBlockMatches = [
      ...code.matchAll(/__BOT_BUILDER_EXIT_CONDITIONS\.push\(\{\s*type:\s*"([^"]*)"[^}]*value:\s*"([^"]*)"[^}]*group:\s*"([^"]*)"/g),
      ...code.matchAll(/EXIT_CONDITION_\d+\s*=\s*\{[^}]*type:\s*"([^"]*)"[^}]*value:\s*"([^"]*)"[^}]*group:\s*"([^"]*)"/g),
    ];
    if (exitBlockMatches.length > 0) {
      strategy.conditions.exits = exitBlockMatches.map((match) => ({
        type: match[1],
        value: match[2],
        group: match[3] || inferExitGroup(match[1]),
      }));
      strategy.conditions.exit = strategy.conditions.exit ?? strategy.conditions.exits[0] ?? null;
    }

    const managementMatch = code.match(
      /MARTINGALE_SETTINGS\s*=\s*\{[^}]*initialStake:\s*([\d.]+)[^}]*multiplier:\s*([\d.]+)[^}]*maxStake:\s*([\d.]+)[^}]*profitThreshold:\s*([\d.]+)[^}]*lossThreshold:\s*([\d.]+)[^}]*tradeAgain:\s*(true|false)/i
    );
    if (managementMatch) {
      strategy.conditions.management = {
        initialStake: parseFloat(managementMatch[1]),
        multiplier: parseFloat(managementMatch[2]),
        maxStake: parseFloat(managementMatch[3]),
        profitThreshold: parseFloat(managementMatch[4]),
        lossThreshold: parseFloat(managementMatch[5]),
        tradeAgain: managementMatch[6].toLowerCase() === 'true',
      };
    }

    const indicatorsSettingsMatch = code.match(
      /INDICATORS_SETTINGS\s*=\s*\{[^}]*indicator:\s*"([^"]*)"[^}]*period:\s*([\d.]+)[^}]*symbol:\s*"([^"]*)"[^}]*active:\s*(true|false)[^}]*comparison:\s*\{[^}]*left:\s*"([^"]*)"[^}]*operator:\s*"([^"]*)"[^}]*threshold:\s*([\d.]+)/i
    );
    if (indicatorsSettingsMatch) {
      strategy.indicators.push({
        type: indicatorsSettingsMatch[1],
        period: parseFloat(indicatorsSettingsMatch[2]),
        symbol: indicatorsSettingsMatch[3],
        active: indicatorsSettingsMatch[4].toLowerCase() === 'true',
        comparison: {
          left: indicatorsSettingsMatch[5],
          operator: indicatorsSettingsMatch[6],
          threshold: parseFloat(indicatorsSettingsMatch[7]),
        },
      });
    }

    const restartSettingsMatch = code.match(
      /RESTART_SETTINGS\s*=\s*\{\s*condition:\s*\{\s*type:\s*"([^"]*)"\s*\}\s*\}/i
    );
    if (restartSettingsMatch) {
      strategy.restart.condition = {
        type: restartSettingsMatch[1],
      };
    }

    const notificationMatch = code.match(
      /__BOT_BUILDER_NOTIFICATIONS\.push\(\{\s*message:\s*"([^"]*)"[^}]*withSound:\s*(true|false)[^}]*withPopup:\s*(true|false)/i
    ) ?? code.match(
      /NOTIFICATION_SETTINGS\s*=\s*\{[^}]*message:\s*"([^"]*)"[^}]*withSound:\s*(true|false)[^}]*withPopup:\s*(true|false)/i
    );
    if (notificationMatch) {
      strategy.conditions.notifications = {
        message: notificationMatch[1],
        withSound: notificationMatch[2].toLowerCase() === 'true',
        withPopup: notificationMatch[3].toLowerCase() === 'true',
      };
    }

    const statMatches = [
      ...code.matchAll(/__BOT_BUILDER_STATS\.push\(\{\s*stat:\s*"([^"]*)"/g),
      ...code.matchAll(/NOTIFICATION_STATS\s*=\s*\{[^}]*stat:\s*"([^"]*)"/g),
    ];
    if (statMatches.length > 0) {
      strategy.conditions.stats = statMatches.map((match) => ({ stat: match[1] }));
    }

    const logicMatches = [...code.matchAll(/__BOT_BUILDER_LOGIC\.push\(\{\s*type:\s*"([^"]*)"([^}]*)\}\);?/g)];
    if (logicMatches.length > 0) {
      strategy.conditions.logic = logicMatches.map((match) => ({
        type: match[1],
        raw: match[2] ?? '',
      }));
    }

    const listMatches = [...code.matchAll(/__BOT_BUILDER_LISTS\.push\(\{\s*op:\s*"([^"]*)"[^}]*name:\s*"([^"]*)"([^}]*)\}\);?/g)];
    if (listMatches.length > 0) {
      strategy.conditions.lists = listMatches.map((match) => ({
        op: match[1],
        name: match[2],
        raw: match[3] ?? '',
      }));
    }

    const variableMatches = [
      ...code.matchAll(/__BOT_BUILDER_VARIABLES\.push\(\{\s*type:\s*"([^"]+)"[^}]*name:\s*"([^"]*)"[^}]*value:\s*(true|false|"[^"]*"|[\d.]+)/gi),
      ...code.matchAll(/VARIABLE_(BOOL|NUMBER|TEXT)\s*=\s*\{[^}]*name:\s*"([^"]*)"[^}]*value:\s*(true|false|"[^"]*"|[\d.]+)/gi),
    ];
    if (variableMatches.length > 0) {
      strategy.conditions.variables = variableMatches.map((match) => {
        const kind = String(match[1]).toLowerCase() as StrategyVariable["type"];
        const rawValue = match[3];
        let value: string | number | boolean = rawValue;
        if (rawValue === 'true' || rawValue === 'false') {
          value = rawValue === 'true';
        } else if (/^".*"$/.test(rawValue)) {
          value = rawValue.slice(1, -1);
        } else {
          value = Number(rawValue);
        }
        return {
          type: kind,
          name: match[2],
          value,
        };
      });
    }

    // Parse restart on win
    const winMatch = code.match(/RESTART_WIN\s*=\s*\{[^}]*resetStake:\s*([\d.]+)/);
    if (winMatch) {
      strategy.restart.onWin = {
        resetStake: parseFloat(winMatch[1])
      };
    }

    // Parse restart on loss
    const lossMatch = code.match(/RESTART_LOSS\s*=\s*\{[^}]*resetStake:\s*([\d.]+)/);
    if (lossMatch) {
      strategy.restart.onLoss = {
        resetStake: parseFloat(lossMatch[1])
      };
    }

    // Parse position manager
    const posMatch = code.match(
      /POSITION_MANAGER\s*=\s*\{[^}]*maxPositions:\s*([\d.]+)[^}]*stopLoss:\s*([\d.]+)[^}]*takeProfit:\s*([\d.]+)/
    );
    if (posMatch) {
      strategy.positionManager = {
        maxPositions: parseFloat(posMatch[1]),
        stopLoss: parseFloat(posMatch[2]),
        takeProfit: parseFloat(posMatch[3])
      };
    }

    // Build API payload if market and execution exist
    if (strategy.market && strategy.execution) {
      const payload: any = {
        request: 'order_buy',
        symbol: strategy.market.symbol,
        contract_type: strategy.market.contractType,
        stake: strategy.execution.stake,
        duration: strategy.execution.duration,
        duration_unit: strategy.execution.durationUnit
      };

      // Add barrier if present
      if (strategy.market.barrier !== undefined) {
        payload.barrier = strategy.market.barrier;
      }
      if (strategy.market.barrierLow !== undefined) {
        payload.barrier_low = strategy.market.barrierLow;
      }
      if (strategy.market.barrierHigh !== undefined) {
        payload.barrier_high = strategy.market.barrierHigh;
      }
      if (strategy.market.digitTarget !== undefined) {
        payload.digit_target = strategy.market.digitTarget;
      }
      if (strategy.market.digitLow !== undefined) {
        payload.digit_low = strategy.market.digitLow;
      }
      if (strategy.market.digitHigh !== undefined) {
        payload.digit_high = strategy.market.digitHigh;
      }

      strategy._api_payload = payload;
    }

    return strategy;
  }

  /**
   * Build strategy name from parameters
   */
  buildStrategyName(market: MarketSettings | null, execution: ExecutionSettings | null): string {
    if (!market || !execution) return 'My Strategy';
    return `${market.symbol}_${market.contractType}_${execution.stake}`;
  }

  /**
   * Validate strategy
   * @param strategy - Parsed strategy
   */
  validateStrategy(strategy: ParseResult): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!strategy.market) {
      errors.push('Market settings are required');
    }
    if (!strategy.execution) {
      errors.push('Execution settings are required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate execution summary
   * @param result - Execution result
   */
  generateSummary(result: any): StrategySummary {
    if (!result || !result.success) {
      return {
        status: 'failed',
        message: result?.error || 'Execution failed'
      };
    }

    return {
      status: 'success',
      message: 'Strategy executed successfully',
      contractId: result.contract_id,
      symbol: result.symbol,
      contractType: result.contract_type,
      stake: result.stake,
      payout: result.payout,
      entryPrice: result.entry_price,
      timestamp: result.timestamp
    };
  }

  /**
   * Generate human-readable strategy description
   */
  generateDescription(strategy: ParseResult): string {
    const parts: string[] = [];

    if (strategy.market) {
      parts.push(`Trade ${strategy.market.symbol}`);
      parts.push(`Contract type: ${strategy.market.contractType}`);
    }

    if (strategy.execution) {
      parts.push(`Stake: $${strategy.execution.stake}`);
      parts.push(`Duration: ${strategy.execution.duration} ${strategy.execution.durationUnit}`);
    }

    const entry = strategy.conditions.entry ?? strategy.conditions.purchase;
    const exit = strategy.conditions.exits?.length ? strategy.conditions.exits[0] : (strategy.conditions.exit ?? strategy.conditions.sell);

    if (entry) {
      parts.push(`Entry when: ${entry.type} ${entry.value}${entry.value2 ? ` ${entry.value2}` : ''}`);
    }

    if (exit) {
      parts.push(`Exit when: ${exit.type} ${exit.value}`);
    }

    if (strategy.conditions.exits && strategy.conditions.exits.length > 1) {
      const grouped = strategy.conditions.exits
        .map((condition) => `${condition.group ?? inferExitGroup(condition.type)}: ${condition.type}${condition.value ? ` ${condition.value}` : ''}`)
        .join(' | ');
      parts.push(`Exit groups: ${grouped}`);
    }

    if (strategy.conditions.management) {
      const management = strategy.conditions.management as TradeManagement;
      parts.push(`Management: stake ${management.initialStake} x${management.multiplier}`);
    }

    return parts.join(' • ');
  }
}

// Export singleton
export const strategyService = new StrategyService();
