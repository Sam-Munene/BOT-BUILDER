/**
 * WebSocket Service - HFT19 API Connection
 */

export const CONNECTION_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
} as const;

export type ConnectionStatus = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS];

export interface WebSocketMessage {
  request?: string;
  status?: string;
  code?: number;
  type?: string;
  data?: any;
  message?: string;
  symbol?: string;
  price?: number;
  epoch_ms?: number;
  user_id?: number;
  is_demo?: boolean;
  contract_id?: number;
  proposal_id?: string;
}

export interface OrderParams {
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

export type WebSocketEventHandler = (data: any) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = CONNECTION_STATUS.DISCONNECTED as ConnectionStatus;
  private messageHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private wsUrl: string = 'wss://hftserver.safarigari.com';

  connect(token: string | null = null): void {
    if (this.ws && this.status === CONNECTION_STATUS.CONNECTED) return;

    this.status = CONNECTION_STATUS.CONNECTING as ConnectionStatus;
    this.emit('statusChange', this.status);

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        this.status = CONNECTION_STATUS.CONNECTED as ConnectionStatus;
        this.reconnectAttempts = 0;
        this.emit('statusChange', this.status);
        this.emit('connected');
        if (token) this.authenticate(token);
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          this.handleMessage(data);
        } catch (error) {
          console.error('WebSocket parse error:', error);
        }
      };

      this.ws.onerror = (error: Event) => {
        this.status = CONNECTION_STATUS.ERROR as ConnectionStatus;
        this.emit('statusChange', this.status);
        this.emit('error', error);
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        this.status = CONNECTION_STATUS.DISCONNECTED as ConnectionStatus;
        this.emit('statusChange', this.status);
        this.emit('disconnected');
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
          if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = setTimeout(() => this.connect(token), delay);
        }
      };
    } catch (error) {
      this.status = CONNECTION_STATUS.ERROR as ConnectionStatus;
      this.emit('statusChange', this.status);
      this.emit('error', error);
      console.error('WebSocket connection error:', error);
    }
  }

  authenticate(token: string): boolean {
    return this.send({ request: 'auth', token });
  }

  send(data: Record<string, any>): boolean {
    if (this.ws && this.status === CONNECTION_STATUS.CONNECTED) {
      try {
        this.ws.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('WebSocket send error:', error);
        return false;
      }
    }
    console.warn('WebSocket not connected');
    return false;
  }

  private handleMessage(data: WebSocketMessage): void {
    if (data.status === 'ok' && data.data?.user_id) {
      this.emit('authenticated', data.data);
      return;
    }
    if (data.type === 'tick') {
      this.emit('tick', data);
      return;
    }
    if (data.data?.type === 'proposal') {
      this.emit('proposal', data.data);
      return;
    }
    if (data.data?.type === 'order_buy') {
      this.emit('order', data.data);
      return;
    }
    if (data.status === 'error') {
      this.emit('error', data);
      return;
    }
    this.emit('message', data);
  }

  subscribe(symbol: string): boolean {
    return this.send({ request: 'subscribe', symbol });
  }

  unsubscribe(symbol: string): boolean {
    return this.send({ request: 'unsubscribe', symbol });
  }

  placeOrder(params: OrderParams): boolean {
    return this.send({ request: 'order_buy', ...params });
  }

  on(event: string, handler: WebSocketEventHandler): void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: WebSocketEventHandler): void {
    if (!this.messageHandlers.has(event)) return;
    const handlers = this.messageHandlers.get(event)!;
    const index = handlers.indexOf(handler);
    if (index !== -1) handlers.splice(index, 1);
  }

  private emit(event: string, data?: any): void {
    if (!this.messageHandlers.has(event)) return;
    this.messageHandlers.get(event)!.forEach((handler) => {
      try { handler(data); } catch (error) { console.error('Handler error:', error); }
    });
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status = CONNECTION_STATUS.DISCONNECTED as ConnectionStatus;
    this.emit('statusChange', this.status);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === CONNECTION_STATUS.CONNECTED;
  }
}

export const wsService = new WebSocketService();