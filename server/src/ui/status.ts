/**
 * Status UI Component
 */

export const StatusUI = {
  update(type: string, message: string): void {
    const badge = document.getElementById('statusBadge');
    if (badge) {
      badge.className = `status-badge ${type}`;
      badge.textContent = message;
    }
  },

  running(message: string = 'Running...'): void {
    this.update('running', message);
  },

  ready(message: string = 'Ready'): void {
    this.update('ready', message);
  },

  error(message: string = 'Error'): void {
    this.update('error', message);
  },

  updateBlockCount(count: number): void {
    const el = document.getElementById('blockCount');
    if (el) {
      el.textContent = `${count} blocks`;
    }
  },

  showResults(result: any): void {
    const box = document.getElementById('resultsBox');
    if (!box) return;

    if (!result || !result.success) {
      box.innerHTML = `
        <span class="error">❌ ${result?.error || 'Execution failed'}</span>
        ${result?.timestamp ? `<div style="font-size:10px;color:#666;margin-top:4px;">${result.timestamp}</div>` : ''}
      `;
      return;
    }

    box.innerHTML = `
      <div class="success">✅ Strategy executed successfully!</div>
      <div style="margin-top:8px;font-size:11px;color:#8888aa;">
        <div>Contract ID: ${result.contract_id || 'N/A'}</div>
        <div>Symbol: ${result.symbol || 'N/A'}</div>
        <div>Type: ${result.contract_type || 'N/A'}</div>
        <div>Stake: $${result.stake?.toFixed(2) || '0'}</div>
        <div>Payout: $${result.payout?.toFixed(2) || '0'}</div>
        <div>Entry Price: ${result.entry_price?.toFixed(2) || 'N/A'}</div>
        <div style="font-size:10px;color:#666;margin-top:4px;">${result.timestamp || ''}</div>
      </div>
    `;
  },

  clearResults(): void {
    const box = document.getElementById('resultsBox');
    if (box) {
      box.innerHTML = '<span class="text-muted">Run your strategy to see results</span>';
    }
  }
};