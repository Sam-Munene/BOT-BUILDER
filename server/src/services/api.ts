/**
 * API Service - Handles communication with backend
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface ExecuteStrategyParams {
  code: string;
  symbol?: string;
  parameters?: Record<string, any>;
}

export interface SaveStrategyParams {
  name: string;
  xml: string;
  code: string;
  json: any;
}

export class ApiService {
  private baseUrl: string = '/api';

  /**
   * Execute a strategy
   * @param code - Generated JavaScript code
   * @param params - Additional parameters
   */
  async executeStrategy(code: string, params: Record<string, any> = {}): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          ...params,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('API execute error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Save strategy to server
   * @param data - Strategy data
   */
  async saveStrategy(data: SaveStrategyParams): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/strategies/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('API save error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Load strategy from server
   * @param id - Strategy ID
   */
  async loadStrategy(id: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/strategies/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('API load error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all strategies
   */
  async getStrategies(): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/strategies`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('API get strategies error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete strategy
   * @param id - Strategy ID
   */
  async deleteStrategy(id: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/strategies/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('API delete error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return await response.json();
    } catch (error: any) {
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Get market data
   * @param symbol - Market symbol
   * @param interval - Time interval
   * @param limit - Number of data points
   */
  async getMarketData(symbol: string, interval: string = '1m', limit: number = 100): Promise<ApiResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/market-data/${symbol}?interval=${interval}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('API market data error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export singleton
export const apiService = new ApiService();