import { createContext, useContext, useEffect } from 'react';

export const ContextRegistration = createContext<(value: unknown) => void>(() => undefined);

export function useContextRegistration(value: unknown): void {
  const register = useContext(ContextRegistration);
  useEffect(() => {
    register(value);
    return () => register(undefined);
  }, [register, value]);
}
