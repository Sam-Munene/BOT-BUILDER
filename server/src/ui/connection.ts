/**
 * Connection UI Component - TypeScript
 */

import { wsService, WebSocketMessage, CONNECTION_STATUS, ConnectionStatus } from '../services/websocket';

export interface AuthenticatedData {
  user_id: number;
  is_demo: boolean;
  trading_version: number;
}

export interface TickData {
  type: 'tick';
  symbol: string;
  price: number;
  epoch_ms: number;
}

export class ConnectionUI {
  private statusElement: HTMLElement | null = null;
  private connectButton: HTMLButtonElement | null = null;
  private tokenInput: HTMLInputElement | null = null;
  private symbolSelect: HTMLSelectElement | null = null;
  private subscribeButton: HTMLButtonElement | null = null;
  private messageLog: HTMLElement | null = null;
  private priceElement: HTMLElement | null = null;
  private isSubscribed: boolean = false;
  private currentSymbol: string = 'VIX_100';

  init(): void {
    this.statusElement = document.getElementById('connectionStatus');
    this.connectButton = document.getElementById('connectBtn') as HTMLButtonElement;
    this.tokenInput = document.getElementById('tokenInput') as HTMLInputElement;
    this.symbolSelect = document.getElementById('symbolSelect') as HTMLSelectElement;
    this.subscribeButton = document.getElementById('subscribeBtn') as HTMLButtonElement;
    this.messageLog = document.getElementById('messageLog');
    this.priceElement = document.getElementById('currentPrice');

    if (this.connectButton) {
      this.connectButton.addEventListener('click', () => this.toggleConnection());
    }

    if (this.subscribeButton) {
      this.subscribeButton.addEventListener('click', () => this.toggleSubscription());
    }

    if (this.symbolSelect) {
      this.symbolSelect.addEventListener('change', (e) => {
        this.currentSymbol = (e.target as HTMLSelectElement).value;
        if (this.isSubscribed) {
          wsService.unsubscribe(this.currentSymbol);
          wsService.subscribe(this.currentSymbol);
          this.logMessage(`📡 Switched to ${this.currentSymbol}`);
        }
      });
    }

    wsService.on('statusChange', (status: ConnectionStatus) => this.updateStatus(status));
    wsService.on('connected', () => this.onConnected());
    wsService.on('disconnected', () => this.onDisconnected());
    wsService.on('authenticated', (data: AuthenticatedData) => this.onAuthenticated(data));
    wsService.on('tick', (data: TickData) => this.onTick(data));
    wsService.on('message', (data: WebSocketMessage) => this.logMessage(JSON.stringify(data)));
    wsService.on('error', (error: Error) => this.onError(error));
    wsService.on('order', (data: any) => this.onOrder(data));
    wsService.on('proposal', (data: any) => this.onProposal(data));

    this.updateStatus(wsService.getStatus() as ConnectionStatus);
  }

  private toggleConnection(): void {
    if (wsService.isConnected()) {
      wsService.disconnect();
    } else {
      const token = this.tokenInput?.value || null;
      wsService.connect(token);
    }
  }

  private toggleSubscription(): void {
    if (!wsService.isConnected()) {
      this.logMessage('⚠️ Not connected to WebSocket');
      return;
    }

    const symbol = this.symbolSelect?.value || 'VIX_100';

    if (!this.isSubscribed) {
      wsService.subscribe(symbol);
      this.isSubscribed = true;
      if (this.subscribeButton) this.subscribeButton.textContent = 'Unsubscribe';
      this.logMessage(`📡 Subscribed to ${symbol}`);
    } else {
      wsService.unsubscribe(symbol);
      this.isSubscribed = false;
      if (this.subscribeButton) this.subscribeButton.textContent = 'Subscribe';
      this.logMessage(`📡 Unsubscribed from ${symbol}`);
    }
  }

  private updateStatus(status: ConnectionStatus): void {
    if (!this.statusElement) return;

    const statusMap: Record<ConnectionStatus, { class: string; label: string }> = {
      [CONNECTION_STATUS.DISCONNECTED]: { class: 'disconnected', label: 'Disconnected' },
      [CONNECTION_STATUS.CONNECTING]: { class: 'connecting', label: 'Connecting...' },
      [CONNECTION_STATUS.CONNECTED]: { class: 'connected', label: 'Connected' },
      [CONNECTION_STATUS.ERROR]: { class: 'error', label: 'Error' },
    };

    const info = statusMap[status] || statusMap[CONNECTION_STATUS.DISCONNECTED];
    this.statusElement.className = `connection-status ${info.class}`;
    this.statusElement.textContent = info.label;

    if (this.connectButton) {
      this.connectButton.textContent = status === CONNECTION_STATUS.CONNECTED ? 'Disconnect' : 'Connect';
      this.connectButton.className = status === CONNECTION_STATUS.CONNECTED ? 'btn btn-danger' : 'btn btn-primary';
    }

    if (this.subscribeButton) {
      this.subscribeButton.disabled = status !== CONNECTION_STATUS.CONNECTED;
    }
  }

  private onConnected(): void {
    this.logMessage('✅ Connected to WebSocket');
  }

  private onDisconnected(): void {
    this.logMessage('❌ Disconnected from WebSocket');
    this.isSubscribed = false;
    if (this.subscribeButton) this.subscribeButton.textContent = 'Subscribe';
    if (this.priceElement) this.priceElement.textContent = '--';
  }

  private onAuthenticated(data: AuthenticatedData): void {
    const userType = data.is_demo ? 'Demo' : 'Real';
    this.logMessage(`🔐 Authenticated as ${userType} user ${data.user_id}`);
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement) {
      userInfoElement.textContent = `User: ${data.user_id} (${userType})`;
    }
  }

  private onTick(data: TickData): void {
    const price = data.price.toFixed(2);
    const symbol = data.symbol;
    this.logMessage(`📊 ${symbol}: ${price}`);

    if (this.priceElement) {
      this.priceElement.textContent = price;
      const changeElement = document.getElementById('priceChange');
      if (changeElement && this.priceElement.dataset.lastPrice) {
        const lastPrice = parseFloat(this.priceElement.dataset.lastPrice);
        const currentPrice = data.price;
        const change = currentPrice - lastPrice;
        if (change > 0) {
          changeElement.textContent = `▲ +${change.toFixed(2)}`;
          changeElement.className = 'price-change positive';
        } else if (change < 0) {
          changeElement.textContent = `▼ ${change.toFixed(2)}`;
          changeElement.className = 'price-change negative';
        } else {
          changeElement.textContent = '─ 0.00';
          changeElement.className = 'price-change neutral';
        }
      }
      this.priceElement.dataset.lastPrice = data.price.toString();
    }
  }

  private onOrder(data: any): void {
    const contractId = data.contract_id;
    const symbol = data.symbol;
    const contractType = data.contract_type;
    const stake = data.stake;
    const payout = data.payout;
    
    this.logMessage(`📈 Order placed: ${symbol} ${contractType} (ID: ${contractId})`);
    this.logMessage(`   Stake: $${stake} | Payout: $${payout.toFixed(2)}`);
    
    const orderHistoryElement = document.getElementById('orderHistory');
    if (orderHistoryElement) {
      const entry = document.createElement('div');
      entry.className = 'order-entry';
      entry.innerHTML = `
        <span class="order-id">#${contractId}</span>
        <span class="order-symbol">${symbol}</span>
        <span class="order-type">${contractType}</span>
        <span class="order-stake">$${stake}</span>
        <span class="order-payout">$${payout.toFixed(2)}</span>
        <span class="order-time">${new Date().toLocaleTimeString()}</span>
      `;
      orderHistoryElement.prepend(entry);
      // Fix: Check if lastChild exists before removing
      while (orderHistoryElement.children.length > 50) {
        const lastChild = orderHistoryElement.lastChild;
        if (lastChild) {
          orderHistoryElement.removeChild(lastChild);
        }
      }
    }
  }

  private onProposal(data: any): void {
    const proposalId = data.proposal_id;
    const payout = data.primary?.payout || 0;
    const profitPct = data.primary?.profit_pct || 0;
    
    this.logMessage(`💡 Proposal received: ${proposalId}`);
    this.logMessage(`   Payout: $${payout.toFixed(2)} (${profitPct.toFixed(1)}% profit)`);
    
    const proposalElement = document.getElementById('proposalInfo');
    if (proposalElement) {
      proposalElement.innerHTML = `
        <div class="proposal-payout">$${payout.toFixed(2)}</div>
        <div class="proposal-profit">${profitPct.toFixed(1)}%</div>
        <div class="proposal-id">ID: ${proposalId}</div>
      `;
    }
  }

  private onError(error: Error): void {
    this.logMessage(`❌ Error: ${error.message}`);
  }

  private logMessage(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${message}`;
    console.log(formatted);

    if (this.messageLog) {
      const entry = document.createElement('div');
      entry.textContent = formatted;
      entry.className = 'log-entry';
      this.messageLog.prepend(entry);
      // Fix: Check if lastChild exists before removing
      while (this.messageLog.children.length > 100) {
        const lastChild = this.messageLog.lastChild;
        if (lastChild) {
          this.messageLog.removeChild(lastChild);
        }
      }
    }
  }

  clearLogs(): void {
    if (this.messageLog) {
      this.messageLog.innerHTML = '';
    }
    this.logMessage('🗑 Logs cleared');
  }

  destroy(): void {
    if (this.connectButton) {
      this.connectButton.removeEventListener('click', () => this.toggleConnection());
    }
    if (this.subscribeButton) {
      this.subscribeButton.removeEventListener('click', () => this.toggleSubscription());
    }
    wsService.disconnect();
    this.statusElement = null;
    this.connectButton = null;
    this.tokenInput = null;
    this.symbolSelect = null;
    this.subscribeButton = null;
    this.messageLog = null;
    this.priceElement = null;
  }
}

export const connectionUI = new ConnectionUI();