import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { LatLng } from '../data/catalog';
import { addressOf, currentPosition, ensureLocation, LocState, watchPosition } from './geo';

/** Position réelle de l'utilisateur, suivie en continu, avec l'adresse lisible. */
export function useUserLocation() {
  const [state, setState] = useState<LocState>('unknown');
  const [pos, setPos] = useState<LatLng | null>(null);
  const [addr, setAddr] = useState<{ title: string; city: string } | null>(null);

  const refresh = useCallback(async () => {
    const st = await ensureLocation();
    setState(st);
    if (st !== 'granted') return null;
    const p = await currentPosition();
    if (p) {
      setPos(p);
      addressOf(p).then(setAddr);
    }
    return p;
  }, []);

  useEffect(() => {
    refresh();
    // Revenir des réglages du téléphone relance la localisation
    const sub = AppState.addEventListener('change', s => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    if (state !== 'granted') return;
    return watchPosition(p => setPos(p));
  }, [state]);

  const openSettings = () => Linking.openSettings().catch(() => {});
  return { state, pos, addr, refresh, openSettings };
}

type Loc = ReturnType<typeof useUserLocation>;
const LocCtx = createContext<Loc | null>(null);
export function LocationProvider({ children }: { children: React.ReactNode }) {
  const v = useUserLocation();
  return React.createElement(LocCtx.Provider, { value: v }, children);
}
export const useLoc = () => useContext(LocCtx)!;
