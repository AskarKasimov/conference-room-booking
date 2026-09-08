import type { PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { applyRealtimeEvent, parseRealtimeEvent, type RealtimeActiveContext } from './events';
import { getRealtimeUrl } from './wsUrl';

export interface RealtimeSocket {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  close(): void;
}

const ActiveContextRegistration = createContext<
  (context: RealtimeActiveContext | undefined) => void
>(() => undefined);

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
  const registerActiveContext = useCallback((context: RealtimeActiveContext | undefined) => {
    activeContextRef.current = context ?? {};
  }, []);

  useEffect(() => {
    if (!socketFactory && (typeof WebSocket === 'undefined' || import.meta.env.MODE === 'test')) {
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
    <ActiveContextRegistration.Provider value={registerActiveContext}>
      {children}
    </ActiveContextRegistration.Provider>
  );
}

export function useRealtimeActiveContext(context: RealtimeActiveContext | undefined): void {
  const register = useContext(ActiveContextRegistration);
  useEffect(() => {
    register(context);
    return () => register(undefined);
  }, [context, register]);
}
