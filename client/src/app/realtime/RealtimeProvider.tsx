import type { PropsWithChildren } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { applyRealtimeEvent, parseRealtimeEvent } from './events';
import { parseRealtimeActiveContext, type RealtimeActiveContext } from './activeContext';
import { getRealtimeUrl } from './wsUrl';
import { ContextRegistration } from '../../shared/lib';

export interface RealtimeSocket {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  close(): void;
}

interface RealtimeProviderProps extends PropsWithChildren {
  activeContext?: RealtimeActiveContext;
  socketFactory?: (url: string) => RealtimeSocket;
}

export function RealtimeProvider({
  children,
  activeContext = {},
  socketFactory,
}: RealtimeProviderProps) {
  const client = useQueryClient();
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
    const socket = createSocket(getRealtimeUrl());
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
    const onError: EventListener = () => undefined;

    socket.addEventListener('message', onMessage);
    socket.addEventListener('error', onError);
    return () => {
      socket.removeEventListener('message', onMessage);
      socket.removeEventListener('error', onError);
      socket.close();
    };
  }, [client, socketFactory]);

  return (
    <ContextRegistration.Provider value={registerActiveContext}>
      {children}
    </ContextRegistration.Provider>
  );
}
