import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { applyRealtimeEvent, parseRealtimeEvent } from './events';
import { parseRealtimeActiveContext, type RealtimeActiveContext } from './activeContext';
import { getRealtimeUrl } from './wsUrl';
import { ContextRegistration } from '../../shared/lib';

const RECONNECT_DELAY_MS = 1000;

export interface RealtimeSocket {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  close(): void;
}

export interface RealtimeStatus {
  isDisconnected: boolean;
}

interface RealtimeProviderProps {
  children: ReactNode | ((status: RealtimeStatus) => ReactNode);
  activeContext?: RealtimeActiveContext;
  socketFactory?: (url: string) => RealtimeSocket;
}

export function RealtimeProvider({
  children,
  activeContext = {},
  socketFactory,
}: RealtimeProviderProps) {
  const client = useQueryClient();
  const [isDisconnected, setIsDisconnected] = useState(false);
  const activeContextRef = useRef(activeContext);
  activeContextRef.current = activeContext;
  const registerActiveContext = useCallback((context: unknown) => {
    activeContextRef.current = parseRealtimeActiveContext(context) ?? {};
  }, []);

  useEffect(() => {
    if (!socketFactory && typeof WebSocket === 'undefined') {
      return;
    }

    const createSocket = socketFactory ?? ((url: string) => new WebSocket(url));
    let socket: RealtimeSocket | undefined;
    let removeSocketListeners: (() => void) | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    let disconnected = false;

    const markDisconnected = () => {
      if (disposed) return;
      disconnected = true;
      setIsDisconnected(true);
      if (reconnectTimer !== undefined) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = undefined;
        connect();
      }, RECONNECT_DELAY_MS);
    };

    const connect = () => {
      if (disposed) return;
      let nextSocket: RealtimeSocket;
      try {
        nextSocket = createSocket(getRealtimeUrl());
      } catch {
        markDisconnected();
        return;
      }
      socket = nextSocket;
      const onMessage: EventListener = (event) => {
        let raw: unknown;
        try {
          raw = JSON.parse((event as MessageEvent<string>).data) as unknown;
        } catch {
          return;
        }
        const parsed = parseRealtimeEvent(raw);
        if (parsed) void applyRealtimeEvent(client, parsed, activeContextRef.current);
      };
      const onOpen: EventListener = () => {
        if (disposed || !disconnected) return;
        disconnected = false;
        setIsDisconnected(false);
        void client.invalidateQueries();
      };
      const onClose: EventListener = () => {
        if (socket !== nextSocket) return;
        removeListeners();
        socket = undefined;
        markDisconnected();
      };
      const onError: EventListener = () => {
        if (socket !== nextSocket) return;
        removeListeners();
        socket = undefined;
        nextSocket.close();
        markDisconnected();
      };
      const removeListeners = () => {
        nextSocket.removeEventListener('message', onMessage);
        nextSocket.removeEventListener('open', onOpen);
        nextSocket.removeEventListener('close', onClose);
        nextSocket.removeEventListener('error', onError);
      };
      removeSocketListeners = removeListeners;

      nextSocket.addEventListener('message', onMessage);
      nextSocket.addEventListener('open', onOpen);
      nextSocket.addEventListener('close', onClose);
      nextSocket.addEventListener('error', onError);
    };

    connect();
    return () => {
      disposed = true;
      if (reconnectTimer !== undefined) clearTimeout(reconnectTimer);
      removeSocketListeners?.();
      socket?.close();
    };
  }, [client, socketFactory]);

  return (
    <ContextRegistration.Provider value={registerActiveContext}>
      {typeof children === 'function' ? children({ isDisconnected }) : children}
    </ContextRegistration.Provider>
  );
}
