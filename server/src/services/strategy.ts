/**
 * Strategy Service - Handles strategy parsing and building
 */

import { Strategy, MarketSettings, ExecutionSettings, Conditions, RestartSettings } from '../types/blockly';

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
  conditions: {
    purchase: { type: string; value: string } | null;
    sell: { type: string; value: string } | null;
  };
  restart: {
    onWin: { resetStake: number } | null;
    onLoss: { resetStake: number } | null;
  };
  variables: Record<string, any>;
  positionManager?: any;
  _api_payload?: any;
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
      conditions: {
        purchase: null,
        sell: null
      },
      restart: {
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

    // Parse purchase condition
    const purchMatch = code.match(
      /PURCHASE_CONDITION\s*=\s*\{[^}]*type:\s*"([^"]*)"[^}]*value:\s*"([^"]*)"/
    );
    if (purchMatch) {
      strategy.conditions.purchase = {
        type: purchMatch[1],
        value: purchMatch[2]
      };
    }

    // Parse sell condition
    const sellMatch = code.match(
      /SELL_CONDITION\s*=\s*\{[^}]*type:\s*"([^"]*)"[^}]*value:\s*"([^"]*)"/
    );
    if (sellMatch) {
      strategy.conditions.sell = {
        type: sellMatch[1],
        value: sellMatch[2]
      };
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

    if (strategy.conditions.purchase) {
      const cond = strategy.conditions.purchase;
      parts.push(`Buy when: ${cond.type} ${cond.value}`);
    }

    if (strategy.conditions.sell) {
      const cond = strategy.conditions.sell;
      parts.push(`Sell when: ${cond.type} ${cond.value}`);
    }

    return parts.join(' • ');
  }
}

// Export singleton
export const strategyService = new StrategyService();