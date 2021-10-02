type Emitter = {
  new (obj?: Partial<Emitter>): Emitter;
  _callbacks: { [event: string]: Function[] };
  emit: (event: string, ...args: []) => Emitter;
  listeners: (event: string) => Function[];
  hasListeners: (event: string) => boolean;
  on: (event: string, callback: (payload?: unknown) => void) => Emitter;
  addEventListener: (event: string, callback: (payload?: unknown) => void) => Emitter;
  off: (event?: string, fn?: Function) => Emitter;
  removeListener: (event: string, fn: Function) => Emitter;
  removeAllListeners: () => Emitter;
  removeEventListeners: (event: string) => Emitter;
};
export type SocketClient = Emitter & {
  new (socketMock: SocketMock): SocketClient;
  connected: boolean;
  disconnected: boolean;
  _socketMock: SocketMock;
  _emitFn: (event: string, ...args: []) => Emitter;
  emit: (eventKey: string, payload?: unknown, ack?: () => void) => void;
  fireEvent: (eventKey: string, payload: unknown) => void;
  close: () => SocketClient;
  disconnect: () => SocketClient;
};
export type SocketMock = Emitter & {
  new (): SocketMock;
  generalCallbacks: {};
  joinedRooms: string[];
  rooms: string[];
  socketClient: SocketClient;
  broadcast: {
    to: (roomKey: string) => {
      emit: (eventKey: string, payload?: unknown) => void;
    };
  };
  _emitFn: () => void;
  emitEvent: (eventKey: string, payload?: unknown, ack?: () => void) => void;
  onEmit: (eventKey: string, callback: (payload?: string, roomKey?: string) => void) => void;
  emit: (eventKey: string, payload?: unknown) => void;
  join: (roomKey: string) => void;
  leave: (roomKey: string) => void;
  monitor: (value: string) => string;
  disconnect: (callback?: () => void) => SocketMock;
};
