/**
 * Panels UI Component
 */

export const PanelsUI = {
  updateJSON(data: any): void {
    const el = document.getElementById('jsonOutput');
    if (el) {
      el.textContent = JSON.stringify(data, null, 2);
    }
  },

  updateCode(code: string): void {
    const el = document.getElementById('codeOutput');
    if (el) {
      el.textContent = code || '// No blocks yet';
    }
  },

  clear(): void {
    this.updateJSON({});
    this.updateCode('// No blocks yet');
    const statusUI = require('./status').StatusUI;
    if (statusUI && statusUI.clearResults) {
      statusUI.clearResults();
    }
  },

  updateFromWorkspace(workspace: any): void {
    if (!workspace) return;
    try {
      // Check if JavaScript generator is available
      if (!window.Blockly || !window.Blockly.JavaScript) {
        console.warn('Blockly.JavaScript not available');
        this.updateCode('// Blockly.JavaScript not available');
        return;
      }

      const code = window.Blockly.JavaScript.workspaceToCode(workspace);
      this.updateCode(code);
      
      // Parse strategy from code
      const strategy = this.parseStrategy(code);
      this.updateJSON(strategy);
      
      const blocks = workspace.getAllBlocks();
      const statusUI = require('./status').StatusUI;
      if (statusUI && statusUI.updateBlockCount) {
        statusUI.updateBlockCount(blocks.length);
      }
    } catch (error: any) {
      console.error('Panel update error:', error);
      this.updateCode(`// Error: ${error.message || 'Unknown error'}`);
    }
  },

  parseStrategy(code: string): any {
    const strategy: any = { 
      market: null, 
      execution: null, 
      conditions: { purchase: null, sell: null },
      restart: { onWin: null, onLoss: null }
    };
    
    try {
      const marketMatch = code.match(/MARKET\s*=\s*\{[^}]*symbol:\s*"([^"]*)"[^}]*category:\s*"([^"]*)"[^}]*contractType:\s*"([^"]*)"/);
      if (marketMatch) {
        strategy.market = { 
          symbol: marketMatch[1] || 'VIX_100', 
          category: marketMatch[2] || 'path_independent', 
          contractType: marketMatch[3] || 'UP' 
        };
      }

      const execMatch = code.match(/EXECUTION\s*=\s*\{[^}]*stake:\s*([\d.]+)[^}]*duration:\s*([\d.]+)[^}]*durationUnit:\s*"([^"]*)"/);
      if (execMatch) {
        strategy.execution = { 
          stake: parseFloat(execMatch[1]) || 10, 
          duration: parseFloat(execMatch[2]) || 5, 
          durationUnit: execMatch[3] || 't' 
        };
      }

      const purchMatch = code.match(/PURCHASE_CONDITION\s*=\s*\{[^}]*type:\s*"([^"]*)"[^}]*value:\s*"([^"]*)"/);
      if (purchMatch) {
        strategy.conditions.purchase = {
          type: purchMatch[1] || 'ALWAYS',
          value: purchMatch[2] || ''
        };
      }

      const sellMatch = code.match(/SELL_CONDITION\s*=\s*\{[^}]*type:\s*"([^"]*)"[^}]*value:\s*"([^"]*)"/);
      if (sellMatch) {
        strategy.conditions.sell = {
          type: sellMatch[1] || 'ALWAYS',
          value: sellMatch[2] || ''
        };
      }
    } catch (error) {
      console.warn('Error parsing strategy:', error);
    }

    return strategy;
  }
};