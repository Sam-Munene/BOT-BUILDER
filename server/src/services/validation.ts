/**
 * Strategy Validation Service - TypeScript
 */

import { Strategy, MarketSettings, ExecutionSettings, Conditions, PositionManager, ValidationResult } from '../types/blockly';

export interface ApiPayload {
  request: string;
  symbol: string;
  contract_type: string;
  stake: number;
  duration: number;
  duration_unit: string;
  barrier?: number;
  barrier_low?: number;
  barrier_high?: number;
  digit_target?: number;
  digit_low?: number;
  digit_high?: number;
}

export interface ApiValidationResult {
  valid: boolean;
  errors: string[];
}

export class ValidationService {
  /**
   * Validate complete strategy
   */
  validateStrategy(strategy: Strategy): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required blocks
    if (!strategy.market) {
      errors.push('Market settings are required');
    }

    if (!strategy.execution) {
      errors.push('Execution settings are required');
    }

    // Validate market settings
    if (strategy.market) {
      const marketErrors = this.validateMarket(strategy.market);
      errors.push(...marketErrors);
    }

    // Validate execution settings
    if (strategy.execution) {
      const execErrors = this.validateExecution(strategy.execution);
      errors.push(...execErrors);
    }

    // Validate conditions
    if (strategy.conditions) {
      const conditionErrors = this.validateConditions(strategy.conditions);
      errors.push(...conditionErrors);
    }

    // Validate position manager
    if (strategy.positionManager) {
      const posErrors = this.validatePositionManager(strategy.positionManager);
      warnings.push(...posErrors);
    }

    // Check for potential issues
    if (strategy.market && strategy.execution) {
      // Check if stake is reasonable
      if (strategy.execution.stake > 1000) {
        warnings.push('High stake amount - consider risk management');
      }

      // Check for stop loss
      if (!strategy.positionManager) {
        warnings.push('No position manager - consider adding stop loss');
      }

      // Check for take profit
      if (strategy.positionManager && strategy.positionManager.takeProfit === 0) {
        warnings.push('Take profit is set to 0 - consider setting a profit target');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      hasWarnings: warnings.length > 0,
    };
  }

  /**
   * Validate market settings
   */
  private validateMarket(market: MarketSettings): string[] {
    const errors: string[] = [];

    if (!market.symbol) {
      errors.push('Symbol is required');
    }

    if (!market.category) {
      errors.push('Contract category is required');
    }

    if (!market.contractType) {
      errors.push('Contract type is required');
    }

    // Validate barriers based on contract type
    if (this.requiresBarrier(market.contractType)) {
      if (market.barrier === undefined || market.barrier === null) {
        errors.push(`Barrier is required for ${market.contractType}`);
      }
    }

    if (this.requiresDoubleBarrier(market.contractType)) {
      if (market.barrierLow === undefined || market.barrierHigh === undefined) {
        errors.push(`Double barrier is required for ${market.contractType}`);
      }
      if (market.barrierLow !== undefined && market.barrierHigh !== undefined) {
        if (market.barrierLow >= market.barrierHigh) {
          errors.push('Lower barrier must be less than upper barrier');
        }
      }
    }

    if (this.requiresDigit(market.contractType)) {
      if (market.digitTarget === undefined || market.digitTarget === null) {
        errors.push(`Digit target is required for ${market.contractType}`);
      }
      if (market.digitTarget !== undefined) {
        if (market.digitTarget < 0 || market.digitTarget > 9) {
          errors.push('Digit target must be between 0 and 9');
        }
      }
    }

    if (this.requiresDigitRange(market.contractType)) {
      if (market.digitLow === undefined || market.digitHigh === undefined) {
        errors.push(`Digit range is required for ${market.contractType}`);
      }
      if (market.digitLow !== undefined && market.digitHigh !== undefined) {
        if (market.digitLow >= market.digitHigh) {
          errors.push('Digit low must be less than digit high');
        }
        if (market.digitLow < 0 || market.digitLow > 8) {
          errors.push('Digit low must be between 0 and 8');
        }
        if (market.digitHigh < 1 || market.digitHigh > 9) {
          errors.push('Digit high must be between 1 and 9');
        }
      }
    }

    return errors;
  }

  /**
   * Validate execution settings
   */
  private validateExecution(execution: ExecutionSettings): string[] {
    const errors: string[] = [];

    if (!execution.stake || execution.stake <= 0) {
      errors.push('Stake must be greater than 0');
    }

    if (!execution.duration || execution.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }

    if (!execution.durationUnit) {
      errors.push('Duration unit is required');
    }

    if (execution.stake > 50000) {
      errors.push('Stake exceeds maximum limit (50000)');
    }

    if (execution.duration > 1000) {
      errors.push('Duration exceeds maximum limit (1000)');
    }

    return errors;
  }

  /**
   * Validate conditions
   */
  private validateConditions(conditions: Conditions): string[] {
    const errors: string[] = [];

    // Purchase condition
    if (conditions.purchase) {
      if (!conditions.purchase.type) {
        errors.push('Purchase condition type is required');
      }
      
      if (conditions.purchase.type !== 'ALWAYS' && !conditions.purchase.value) {
        errors.push('Purchase condition value is required');
      }
    }

    // Sell condition
    if (conditions.sell) {
      if (!conditions.sell.type) {
        errors.push('Sell condition type is required');
      }
      
      if (conditions.sell.type !== 'ALWAYS' && !conditions.sell.value) {
        errors.push('Sell condition value is required');
      }
    }

    return errors;
  }

  /**
   * Validate position manager
   */
  private validatePositionManager(positionManager: PositionManager): string[] {
    const errors: string[] = [];

    if (positionManager.maxPositions < 1) {
      errors.push('Max positions must be at least 1');
    }

    if (positionManager.stopLoss < 0 || positionManager.stopLoss > 100) {
      errors.push('Stop loss must be between 0 and 100');
    }

    if (positionManager.takeProfit < 0 || positionManager.takeProfit > 100) {
      errors.push('Take profit must be between 0 and 100');
    }

    return errors;
  }

  /**
   * Check if contract type requires barrier
   */
  private requiresBarrier(contractType: string): boolean {
    const barrierTypes = ['HIGH', 'LOW', 'KNOCK_IN', 'KNOCK_OUT'];
    return barrierTypes.includes(contractType);
  }

  /**
   * Check if contract type requires double barrier
   */
  private requiresDoubleBarrier(contractType: string): boolean {
    const barrierTypes = ['ENDS_BETWEEN', 'ENDS_OUTSIDE', 'STAYS_IN', 'STAYS_OUT'];
    return barrierTypes.includes(contractType);
  }

  /**
   * Check if contract type requires digit target
   */
  private requiresDigit(contractType: string): boolean {
    const digitTypes = ['MATCHES', 'DIFFERS', 'OVER', 'UNDER'];
    return digitTypes.includes(contractType);
  }

  /**
   * Check if contract type requires digit range
   */
  private requiresDigitRange(contractType: string): boolean {
    const digitTypes = ['RANGE_IN', 'RANGE_OUT'];
    return digitTypes.includes(contractType);
  }

  /**
   * Validate strategy JSON before sending to API
   */
  validateApiPayload(payload: any): ApiValidationResult {
    const required = ['request', 'symbol', 'contract_type', 'stake', 'duration', 'duration_unit'];
    const missing = required.filter(field => !payload[field]);
    
    if (missing.length > 0) {
      return {
        valid: false,
        errors: [`Missing required fields: ${missing.join(', ')}`]
      };
    }

    // Validate barrier fields based on contract type
    const contractType = payload.contract_type;
    const errors: string[] = [];

    if (this.requiresBarrier(contractType) && !payload.barrier) {
      errors.push(`Barrier is required for ${contractType}`);
    }

    if (this.requiresDoubleBarrier(contractType)) {
      if (!payload.barrier_low || !payload.barrier_high) {
        errors.push(`Double barrier is required for ${contractType}`);
      }
      if (payload.barrier_low >= payload.barrier_high) {
        errors.push('Lower barrier must be less than upper barrier');
      }
    }

    if (this.requiresDigit(contractType) && payload.digit_target === undefined) {
      errors.push(`Digit target is required for ${contractType}`);
    }
    if (this.requiresDigit(contractType) && payload.digit_target !== undefined) {
      if (payload.digit_target < 0 || payload.digit_target > 9) {
        errors.push('Digit target must be between 0 and 9');
      }
    }

    if (this.requiresDigitRange(contractType)) {
      if (!payload.digit_low || !payload.digit_high) {
        errors.push(`Digit range is required for ${contractType}`);
      }
      if (payload.digit_low !== undefined && payload.digit_high !== undefined) {
        if (payload.digit_low >= payload.digit_high) {
          errors.push('Digit low must be less than digit high');
        }
        if (payload.digit_low < 0 || payload.digit_low > 8) {
          errors.push('Digit low must be between 0 and 8');
        }
        if (payload.digit_high < 1 || payload.digit_high > 9) {
          errors.push('Digit high must be between 1 and 9');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton
export const validationService = new ValidationService();