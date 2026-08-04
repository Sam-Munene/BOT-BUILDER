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
      indicators: [],
      conditions: { entry: null, exit: null, management: null, variables: [], notifications: null, stats: [] },
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

      const entryMatch = code.match(/ENTRY_CONDITION\s*=\s*\{[^}]*type:\s*"([^"]*)"[^}]*value:\s*"([^"]*)"[^}]*value2:\s*"([^"]*)"/);
      const legacyPurchMatch = code.match(/PURCHASE_CONDITION\s*=\s*\{[^}]*type:\s*"([^"]*)"[^}]*value:\s*"([^"]*)"/);
      if (entryMatch) {
        strategy.conditions.entry = {
          type: entryMatch[1] || 'ALWAYS',
          value: entryMatch[2] || '',
          value2: entryMatch[3] || ''
        };
      } else if (legacyPurchMatch) {
        strategy.conditions.entry = {
          type: legacyPurchMatch[1] || 'ALWAYS',
          value: legacyPurchMatch[2] || ''
        };
      }

      const exitMatch = code.match(/EXIT_CONDITION\s*=\s*\{[^}]*type:\s*"([^"]*)"[^}]*value:\s*"([^"]*)"[^}]*value2:\s*"([^"]*)"/);
      const legacySellMatch = code.match(/SELL_CONDITION\s*=\s*\{[^}]*type:\s*"([^"]*)"[^}]*value:\s*"([^"]*)"/);
      if (exitMatch) {
        strategy.conditions.exit = {
          type: exitMatch[1] || 'SELL_BY_COUNT_DOWN',
          value: exitMatch[2] || '',
          value2: exitMatch[3] || ''
        };
      } else if (legacySellMatch) {
        strategy.conditions.exit = {
          type: legacySellMatch[1] || 'SELL_BY_COUNT_DOWN',
          value: legacySellMatch[2] || ''
        };
      }

      const managementMatch = code.match(/MARTINGALE_SETTINGS\s*=\s*\{[^}]*initialStake:\s*([\d.]+)[^}]*multiplier:\s*([\d.]+)[^}]*maxStake:\s*([\d.]+)[^}]*profitThreshold:\s*([\d.]+)[^}]*lossThreshold:\s*([\d.]+)[^}]*tradeAgain:\s*(true|false)/i);
      if (managementMatch) {
        strategy.conditions.management = {
          initialStake: parseFloat(managementMatch[1]) || 10,
          multiplier: parseFloat(managementMatch[2]) || 2,
          maxStake: parseFloat(managementMatch[3]) || 50,
          profitThreshold: parseFloat(managementMatch[4]) || 100,
          lossThreshold: parseFloat(managementMatch[5]) || 50,
          tradeAgain: managementMatch[6].toLowerCase() === 'true'
        };
      }

      const indicatorsSettingsMatch = code.match(/INDICATORS_SETTINGS\s*=\s*\{[^}]*indicator:\s*"([^"]*)"[^}]*period:\s*([\d.]+)[^}]*symbol:\s*"([^"]*)"[^}]*active:\s*(true|false)[^}]*comparison:\s*\{[^}]*left:\s*"([^"]*)"[^}]*operator:\s*"([^"]*)"[^}]*threshold:\s*([\d.]+)/i);
      if (indicatorsSettingsMatch) {
        strategy.indicators = [{
          type: indicatorsSettingsMatch[1] || 'none',
          period: parseFloat(indicatorsSettingsMatch[2]) || 14,
          symbol: indicatorsSettingsMatch[3] || 'VIX_100',
          active: indicatorsSettingsMatch[4].toLowerCase() === 'true',
          comparison: {
            left: indicatorsSettingsMatch[5] || 'indicator',
            operator: indicatorsSettingsMatch[6] || 'GT',
            threshold: parseFloat(indicatorsSettingsMatch[7]) || 50
          }
        }];
      }

      const restartSettingsMatch = code.match(/RESTART_SETTINGS\s*=\s*\{\s*condition:\s*\{\s*type:\s*"([^"]*)"\s*\}\s*\}/i);
      if (restartSettingsMatch) {
        strategy.restart.condition = {
          type: restartSettingsMatch[1] || 'AFTER_LOSS'
        };
      }

      const notificationMatch = code.match(/__BOT_BUILDER_NOTIFICATIONS\.push\(\{\s*message:\s*"([^"]*)"[^}]*withSound:\s*(true|false)[^}]*withPopup:\s*(true|false)/i)
        || code.match(/NOTIFICATION_SETTINGS\s*=\s*\{[^}]*message:\s*"([^"]*)"[^}]*withSound:\s*(true|false)[^}]*withPopup:\s*(true|false)/i);
      if (notificationMatch) {
        strategy.conditions.notifications = {
          message: notificationMatch[1] || 'Trade executed',
          withSound: notificationMatch[2].toLowerCase() === 'true',
          withPopup: notificationMatch[3].toLowerCase() === 'true'
        };
      }

      const statMatches = [
        ...code.matchAll(/__BOT_BUILDER_STATS\.push\(\{\s*stat:\s*"([^"]*)"/g),
        ...code.matchAll(/NOTIFICATION_STATS\s*=\s*\{[^}]*stat:\s*"([^"]*)"/g),
      ];
      if (statMatches.length) {
        strategy.conditions.stats = statMatches.map((match) => ({ stat: match[1] || 'totalProfit' }));
      }

      const logicMatches = [...code.matchAll(/__BOT_BUILDER_LOGIC\.push\(\{\s*type:\s*"([^"]*)"([^}]*)\}\);?/g)];
      if (logicMatches.length) {
        strategy.conditions.logic = logicMatches.map((match) => ({
          type: match[1],
          raw: match[2] || ''
        }));
      }

      const listMatches = [...code.matchAll(/__BOT_BUILDER_LISTS\.push\(\{\s*op:\s*"([^"]*)"[^}]*name:\s*"([^"]*)"([^}]*)\}\);?/g)];
      if (listMatches.length) {
        strategy.conditions.lists = listMatches.map((match) => ({
          op: match[1],
          name: match[2],
          raw: match[3] || ''
        }));
      }

      const variableMatches = [
        ...code.matchAll(/__BOT_BUILDER_VARIABLES\.push\(\{\s*type:\s*"([^"]+)"[^}]*name:\s*"([^"]*)"[^}]*value:\s*(true|false|"[^"]*"|[\d.]+)/gi),
        ...code.matchAll(/VARIABLE_SET_(BOOL|NUMBER|TEXT)\s*=\s*\{[^}]*name:\s*"([^"]*)"[^}]*value:\s*(true|false|"[^"]*"|[\d.]+)/gi),
      ];
      if (variableMatches.length) {
        strategy.conditions.variables = variableMatches.map((match) => {
          const kind = match[1].toLowerCase();
          const rawValue = match[3];
          let value: string | number | boolean = rawValue;
          if (rawValue === 'true' || rawValue === 'false') {
            value = rawValue === 'true';
          } else if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
            value = rawValue.slice(1, -1);
          } else {
            value = parseFloat(rawValue);
          }
          return {
            type: kind,
            name: match[2] || '',
            value
          };
        });
      }
    } catch (error) {
      console.warn('Error parsing strategy:', error);
    }

    return strategy;
  }
};
