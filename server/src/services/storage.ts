/**
 * Storage Service - TypeScript
 */

export interface StorageData {
  name: string;
  xml: string;
  code: string;
  json: any;
  timestamp: string;
  version: string;
}

export interface StorageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  name?: string;
}

export class StorageService {
  private readonly prefix: string = 'botbuilder_';

  /**
   * Save strategy
   */
  saveStrategy(name: string, data: StorageData): StorageResult {
    try {
      const key = `${this.prefix}strategy_${name}`;
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(`${this.prefix}current`, name);
      
      // Save to history
      this.addToHistory(name);
      
      return { success: true, name };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Load strategy
   */
  loadStrategy(name: string): StorageResult<StorageData> {
    try {
      const key = `${this.prefix}strategy_${name}`;
      const dataStr = localStorage.getItem(key);
      if (!dataStr) {
        return { success: false, error: 'Strategy not found' };
      }
      return { success: true, data: JSON.parse(dataStr) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current strategy name
   */
  getCurrentStrategy(): string | null {
    return localStorage.getItem(`${this.prefix}current`);
  }

  /**
   * Get all strategy names
   */
  getAllStrategies(): string[] {
    const keys = Object.keys(localStorage)
      .filter(k => k.startsWith(`${this.prefix}strategy_`));
    return keys.map(k => k.replace(`${this.prefix}strategy_`, ''));
  }

  /**
   * Delete strategy
   */
  deleteStrategy(name: string): StorageResult {
    try {
      const key = `${this.prefix}strategy_${name}`;
      localStorage.removeItem(key);
      if (this.getCurrentStrategy() === name) {
        localStorage.removeItem(`${this.prefix}current`);
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Add to history
   */
  private addToHistory(name: string): void {
    try {
      const historyKey = `${this.prefix}history`;
      let history: string[] = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      // Remove existing entry
      history = history.filter(item => item !== name);
      
      // Add to front
      history.unshift(name);
      
      // Keep last 50
      history = history.slice(0, 50);
      
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (error) {
      console.error('History update error:', error);
    }
  }

  /**
   * Get history
   */
  getHistory(): string[] {
    try {
      const historyKey = `${this.prefix}history`;
      return JSON.parse(localStorage.getItem(historyKey) || '[]');
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    const keys = Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix));
    keys.forEach(k => localStorage.removeItem(k));
  }

  /**
   * Get storage usage
   */
  getStorageUsage(): { used: number; total: number; percentage: number } {
    try {
      let total = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length * 2; // UTF-16 uses 2 bytes per character
        }
      }
      // Estimate total available (usually 5MB for localStorage)
      const limit = 5 * 1024 * 1024;
      return {
        used: total,
        total: limit,
        percentage: (total / limit) * 100
      };
    } catch (error) {
      return { used: 0, total: 0, percentage: 0 };
    }
  }
}

// Export singleton
export const storageService = new StorageService();