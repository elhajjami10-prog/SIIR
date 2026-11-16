import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DevSettings, I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import { CatId, LatLng, PlanId, PLANS, SubMethod } from '../data/catalog';
import { Lang, LOCALE, translate } from '../i18n';

export type Trip = {
  id: string;
  role: 'rider' | 'driver';
  from: string;
  to: string;
  km: number;
  price: number;
  cat: CatId;
  with: string;
  at: number;
  rating?: number;
  tip?: number;
  status: 'completed' | 'cancelled';
};

export type SubPayment = { id: string; plan: PlanId; method: SubMethod; amount: number; ref: string; at: number; status: 'pending' | 'paid' };

export type Subscription = { status: 'none' | 'pending' | 'active'; plan?: PlanId; method?: SubMethod; ref?: string; expiresAt?: number };

export type Persisted = {
  lang: Lang;
  onboarded: boolean;
  phone: string;
  name: string;
  role: 'rider' | 'driver';
  sub: Subscription;
  payments: SubPayment[];
  trips: Trip[];
};

const KEY = 'siir:v1';
const sysLang = (): Lang => {
  const code = Localization.getLocales()[0]?.languageCode;
  return code === 'ar' ? 'ar' : code === 'en' ? 'en' : 'fr';
};
const initial = (): Persisted => ({ lang: sysLang(), onboarded: false, phone: '', name: '', role: 'rider', sub: { status: 'none' }, payments: [], trips: [] });

export type Screen =
  | { name: 'rider' }
  | { name: 'search' }
  | { name: 'choose'; from: { coords: LatLng; title: string }; to: { coords: LatLng; title: string } }
  | { name: 'driver' }
  | { name: 'subscription' }
  | { name: 'trips' }
  | { name: 'earnings' }
  | { name: 'language' }
  | { name: 'cities' };

type Ctx = Persisted & {
  ready: boolean;
  t: (k: string, v?: Record<string, string | number>) => string;
  rtl: boolean;
  set: (patch: Partial<Persisted>) => void;
  setLang: (l: Lang) => void;
  stack: Screen[];
  go: (s: Screen) => void;
  back: () => void;
  home: () => void;
  switchRole: () => void;
  addTrip: (t: Trip) => void;
  buySubscription: (plan: PlanId, method: SubMethod) => SubPayment;
  confirmPayment: (id: string) => void;
  subActive: boolean;
  money: (n: number) => string;
  dateFmt: (t: number) => string;
  resetAll: () => void;
};

const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => useContext(AppCtx)!;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(initial);
  const [ready, setReady] = useState(false);
  const [stack, setStack] = useState<Screen[]>([{ name: 'rider' }]);
  const [now, setNow] = useState(Date.now());
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(s => {
        if (s) {
          const p = { ...initial(), ...JSON.parse(s) } as Persisted;
          setState(p);
          setStack([{ name: p.role === 'driver' ? 'driver' : 'rider' }]);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
    const iv = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (saveRef.current) clearTimeout(saveRef.current);
    saveRef.current = setTimeout(() => AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {}), 250);
  }, [state, ready]);

  const set = useCallback((patch: Partial<Persisted>) => setState(s => ({ ...s, ...patch })), []);

  const setLang = useCallback((l: Lang) => {
    setState(s => ({ ...s, lang: l }));
    const wantRtl = l === 'ar';
    if (I18nManager.isRTL !== wantRtl) {
      I18nManager.allowRTL(wantRtl);
      I18nManager.forceRTL(wantRtl);
      // Laisse le temps à la sauvegarde avant de recharger pour appliquer le sens d'écriture
      setTimeout(() => {
        AsyncStorage.setItem(KEY, JSON.stringify({ ...state, lang: l }))
          .catch(() => {})
          .finally(() => Updates.reloadAsync().catch(() => DevSettings.reload()));
      }, 400);
    }
  }, [state]);

  const subActive = state.sub.status === 'active' && (state.sub.expiresAt || 0) > now;

  const value = useMemo<Ctx>(() => {
    const t = (k: string, v?: Record<string, string | number>) => translate(state.lang, k, v);
    return {
      ...state,
      ready,
      t,
      rtl: I18nManager.isRTL,
      set,
      setLang,
      stack,
      go: s => setStack(st => [...st, s]),
      back: () => setStack(st => (st.length > 1 ? st.slice(0, -1) : st)),
      home: () => setStack(st => [st[0]]),
      switchRole: () => {
        const role = state.role === 'rider' ? 'driver' : 'rider';
        setState(s => ({ ...s, role }));
        setStack([{ name: role }]);
      },
      addTrip: tr => setState(s => ({ ...s, trips: [tr, ...s.trips].slice(0, 100) })),
      buySubscription: (plan, method) => {
        const p = PLANS.find(x => x.id === plan)!;
        const pay: SubPayment = {
          id: Math.random().toString(36).slice(2, 10),
          plan,
          method,
          amount: p.price,
          ref: 'SIIR-' + Math.floor(100000 + Math.random() * 900000),
          at: Date.now(),
          status: method === 'cmi' ? 'paid' : 'pending',
        };
        setState(s => {
          const base = s.sub.status === 'active' && (s.sub.expiresAt || 0) > Date.now() ? s.sub.expiresAt! : Date.now();
          const sub: Subscription =
            method === 'cmi'
              ? { status: 'active', plan, method, ref: pay.ref, expiresAt: base + p.days * 864e5 }
              : s.sub.status === 'active' && (s.sub.expiresAt || 0) > Date.now()
                ? s.sub // le renouvellement en attente ne coupe pas l'abonnement en cours
                : { status: 'pending', plan, method, ref: pay.ref };
          return { ...s, sub, payments: [pay, ...s.payments] };
        });
        return pay;
      },
      confirmPayment: id =>
        setState(s => {
          const pay = s.payments.find(x => x.id === id);
          if (!pay || pay.status === 'paid') return s;
          const p = PLANS.find(x => x.id === pay.plan)!;
          const base = s.sub.status === 'active' && (s.sub.expiresAt || 0) > Date.now() ? s.sub.expiresAt! : Date.now();
          return {
            ...s,
            payments: s.payments.map(x => (x.id === id ? { ...x, status: 'paid' } : x)),
            sub: { status: 'active', plan: pay.plan, method: pay.method, ref: pay.ref, expiresAt: base + p.days * 864e5 },
          };
        }),
      subActive,
      money: n => `${Math.round(n).toLocaleString(LOCALE[state.lang])} ${t('dh')}`,
      dateFmt: ts => new Date(ts).toLocaleDateString(LOCALE[state.lang], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      resetAll: () => {
        AsyncStorage.removeItem(KEY).catch(() => {});
        setState({ ...initial(), lang: state.lang });
        setStack([{ name: 'rider' }]);
      },
    };
  }, [state, ready, stack, subActive, set, setLang]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
