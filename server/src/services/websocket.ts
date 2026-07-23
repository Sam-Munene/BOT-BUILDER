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
  message?: unknown;
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
  private wsUrl: string = 'wss://hft.derinance.com';
  private authToken: string | null = null;
  private authenticated: boolean = false;
  private suppressReconnectOnce: boolean = false;
  private authenticateOnOpen: boolean = true;

  connect(token: string | null = null, authenticateOnOpen = true): void {
    if (token !== null) {
      this.authToken = token.trim() || null;
    }
    this.authenticateOnOpen = authenticateOnOpen;
    this.authenticated = false;
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
        this.send({ request: 'ping' });
        if (this.authenticateOnOpen && this.authToken) {
          this.authenticate(this.authToken);
        }
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

      this.ws.onclose = (event: CloseEvent) => {
        this.status = CONNECTION_STATUS.DISCONNECTED as ConnectionStatus;
        this.authenticated = false;
        this.emit('statusChange', this.status);
        this.emit('disconnected', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        if (this.suppressReconnectOnce) {
          this.suppressReconnectOnce = false;
          return;
        }
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
          if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
          const nextToken = this.authToken ?? token;
          this.reconnectTimeout = setTimeout(() => this.connect(nextToken, this.authenticateOnOpen), delay);
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
    this.authToken = token.trim() || null;
    this.authenticated = false;
    return this.send({ request: 'auth', token });
  }

  private asRecord(value: unknown): Record<string, any> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as Record<string, any>;
  }

  private extractAuthenticatedData(data: WebSocketMessage): Record<string, any> | null {
    const nested = data.data ?? data.message;
    const payload =
      nested && typeof nested === "object" && !Array.isArray(nested)
        ? nested
        : data && typeof data === "object"
          ? data
          : null;

    if (!payload) return null;

    const hasAuthShape =
      "user_id" in payload ||
      "is_demo" in payload ||
      data.type === "authenticated" ||
      data.request === "auth";

    return hasAuthShape ? payload : null;
  }

  private extractEventPayload(data: WebSocketMessage): Record<string, any> | null {
    const candidates = [data.data, data.message, data];
    for (const candidate of candidates) {
      const record = this.asRecord(candidate);
      if (record) return record;
    }
    return null;
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
    const authenticatedData = this.extractAuthenticatedData(data);
    if (data.status === 'ok' && authenticatedData) {
      this.authenticated = true;
      this.emit('authenticated', authenticatedData);
      return;
    }
    const payload = this.extractEventPayload(data);
    if (data.status === 'ok' && Array.isArray(data.data)) {
      this.emit('symbols', data.data);
      return;
    }
    if (data.status === 'ok' && payload && Array.isArray((payload as Record<string, unknown>).contract_types)) {
      this.emit('contract_types', payload);
      return;
    }
    if (data.status === 'ok' && payload && Array.isArray((payload as Record<string, unknown>).defaults)) {
      this.emit('proposal_defaults', payload);
      return;
    }
    const message = data as unknown as { message?: unknown };
    if (data.status === 'ok' && Array.isArray(message.message)) {
      this.emit('symbols', message.message);
      return;
    }
    const eventType = String(payload?.type ?? data.type ?? payload?.request ?? data.request ?? "").trim();
    const requestType = String(payload?.request ?? data.request ?? "").trim();

    if (eventType === 'tick' || requestType === 'tick') {
      this.emit('tick', data);
      return;
    }
    if (eventType === 'proposal' || requestType === 'proposal') {
      this.emit('proposal', payload);
      return;
    }
    if (eventType === 'order_buy' || eventType === 'contract_created' || requestType === 'order_buy' || requestType === 'contract_created') {
      this.emit('contract_created', payload);
      this.emit('order', payload);
      return;
    }
    if (eventType === 'contract_activated' || requestType === 'contract_activated') {
      this.emit('contract_activated', payload);
      return;
    }
    if (eventType === 'contract_detail' || requestType === 'contract_detail') {
      this.emit('contract_detail', payload);
      return;
    }
    if (eventType === 'contract_history' || requestType === 'contract_history') {
      this.emit('contract_history', payload);
      return;
    }
    if (eventType === 'contract_settled' || eventType === 'contract_settlement' || requestType === 'contract_settled' || requestType === 'contract_settlement') {
      this.emit('contract_settled', payload);
      return;
    }
    if (data.status === 'error') {
      this.emit('error', data);
      return;
    }
    this.emit('message', data);
  }

  requestSymbols(): boolean {
    return this.send({ request: 'symbols' });
  }

  requestContractTypes(symbol: string): boolean {
    return this.send({ request: 'contract_types', symbol });
  }

  requestProposalDefaults(symbol: string): boolean {
    return this.send({ request: 'proposal_defaults', symbol });
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

  requestContractDetail(contractId: string | number): boolean {
    return this.send({ request: 'contract_detail', contract_id: contractId });
  }

  requestContractHistory(limit = 20, offset = 0): boolean {
    return this.send({ request: 'contract_history', limit, offset });
  }

  requestProposal(params: OrderParams): boolean {
    return this.send({ request: 'proposal', ...params });
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
    this.suppressReconnectOnce = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status = CONNECTION_STATUS.DISCONNECTED as ConnectionStatus;
    this.authenticated = false;
    this.emit('statusChange', this.status);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === CONNECTION_STATUS.CONNECTED;
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }
}

export const wsService = new WebSocketService();
