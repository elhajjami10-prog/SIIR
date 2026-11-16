import React, { useEffect, useRef } from 'react';
import { Alert, Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Card, Icon, IconButton, Mark, Pill, T, Wordmark } from '../components/ui';
import { CITIES } from '../data/catalog';
import { LANGS } from '../i18n';
import { useApp } from '../store/AppStore';
import { C, R } from '../theme';

/* ---------- Menu latéral ---------- */
export function Menu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const app = useApp();
  const { t } = app;
  const ins = useSafeAreaInsets();
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(x, { toValue: open ? 1 : 0, duration: 260, useNativeDriver: true }).start();
  }, [open]);
  const go = (fn: () => void) => {
    onClose();
    setTimeout(fn, 180);
  };
  const driver = app.role === 'driver';
  const items: [string, string, () => void][] = [
    ['clock', t('myTrips'), () => app.go({ name: 'trips' })],
    ...(driver
      ? ([
          ['ticket', t('subscription'), () => app.go({ name: 'subscription' })],
          ['chart', t('earnings'), () => app.go({ name: 'earnings' })],
        ] as [string, string, () => void][])
      : []),
    ['globe', t('language'), () => app.go({ name: 'language' })],
    ['map', t('cities'), () => app.go({ name: 'cities' })],
    ['help', t('help'), () => Alert.alert(t('help'), 'support@siir.ma\n+212 5 22 00 47 00')],
  ];
  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.overlay, opacity: x }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel={t('cancel')} />
      </Animated.View>
      <Animated.View style={[s.drawer, { paddingTop: ins.top + 18, paddingBottom: ins.bottom + 18, transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [app.rtl ? 340 : -340, 0] }) }] }, app.rtl ? { right: 0 } : { left: 0 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, direction: 'ltr' }}>
          <Mark size={24} />
          <Wordmark size={22} />
        </View>
        <View style={s.who}>
          <Avatar name={app.name || 'SIIR'} />
          <View style={{ flex: 1 }}>
            <Text style={T.h3}>{app.name}</Text>
            <Text style={T.small}>{app.phone}</Text>
          </View>
        </View>
        <View style={{ gap: 2, flex: 1 }}>
          {items.map(([ic, label, fn]) => (
            <Pressable key={label} onPress={() => go(fn)} style={({ pressed }) => [s.item, pressed && { backgroundColor: C.bg }]}>
              <Icon name={ic} color={C.muted} />
              <Text style={[T.h3, { flex: 1 }]}>{label}</Text>
              {ic === 'ticket' && app.subActive && <Pill text={t('active')} />}
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => go(app.switchRole)} style={[s.switch, { backgroundColor: driver ? C.greenSoft : C.redSoft }]}>
          <Icon name={driver ? 'user' : 'car'} size={26} color={driver ? C.green : C.red} />
          <View style={{ flex: 1 }}>
            <Text style={T.h3}>{driver ? t('switchToRider') : t('switchToDriver')}</Text>
            <Text style={T.small}>{driver ? t('switchToRiderSub') : t('switchToDriverSub')}</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() =>
            Alert.alert(t('resetDemo'), '', [
              { text: t('cancel'), style: 'cancel' },
              { text: t('resetDemo'), style: 'destructive', onPress: () => go(app.resetAll) },
            ])
          }
        >
          <Text style={[T.small, { textAlign: 'center', marginTop: 10 }]}>{t('resetDemo')}</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

/* ---------- Gabarit de page ---------- */
function Page({ title, children }: { title: string; children: React.ReactNode }) {
  const app = useApp();
  const ins = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[s.head, { paddingTop: ins.top + 10 }]}>
        <IconButton label="Retour" onPress={app.back} style={{ elevation: 0, shadowOpacity: 0, backgroundColor: C.bg }}>
          <Icon name="back" />
        </IconButton>
        <Text style={T.h2}>{title}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: ins.bottom + 30 }}>{children}</ScrollView>
    </View>
  );
}

export function Trips() {
  const app = useApp();
  const { t } = app;
  const list = app.trips.filter(x => x.role === app.role);
  return (
    <Page title={t('myTrips')}>
      {list.length === 0 && <Text style={T.muted}>{t('noTrips')}</Text>}
      {list.map(x => (
        <Card key={x.id} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={T.small}>
              {app.dateFmt(x.at)} · {t('cat_' + x.cat)}
            </Text>
            <Pill text={x.status === 'completed' ? '✓' : '✕'} color={x.status === 'completed' ? C.green : C.red} bg={x.status === 'completed' ? C.greenSoft : C.redSoft} />
          </View>
          <Text style={T.h3} numberOfLines={1}>{x.from}</Text>
          <Text style={T.h3} numberOfLines={1}>→ {x.to}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={T.small}>
              {x.with} · {x.km.toFixed(1)} {t('km')} · {t('cashOnly')}
            </Text>
            <Text style={[T.h3, T.num]}>{app.money(x.price + (x.tip || 0))}</Text>
          </View>
        </Card>
      ))}
    </Page>
  );
}

export function Earnings() {
  const app = useApp();
  const { t } = app;
  const mine = app.trips.filter(x => x.role === 'driver' && x.status === 'completed');
  const sod = new Date();
  sod.setHours(0, 0, 0, 0);
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(sod.getTime() - (6 - i) * 864e5);
    const v = mine.filter(x => new Date(x.at).toDateString() === d.toDateString()).reduce((a, x) => a + x.price + (x.tip || 0), 0);
    return { d, v };
  });
  const max = Math.max(1, ...days.map(x => x.v));
  const today = days[6].v, week = days.reduce((a, x) => a + x.v, 0);
  return (
    <Page title={t('earnings')}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1 }}>
          <Text style={T.eyebrow}>{t('todayEarnings')}</Text>
          <Text style={[T.h1, T.num]}>{app.money(today)}</Text>
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={T.eyebrow}>{t('weekEarnings')}</Text>
          <Text style={[T.h1, T.num]}>{app.money(week)}</Text>
        </Card>
      </View>
      <Card>
        <View style={s.bars}>
          {days.map((x, i) => (
            <View key={i} style={s.barCol}>
              <View style={[s.bar, { height: `${Math.max(3, (x.v / max) * 100)}%`, backgroundColor: i === 6 ? C.red : C.green }]} />
              <Text style={T.small}>{x.d.toLocaleDateString(app.lang === 'ar' ? 'ar-MA' : app.lang === 'en' ? 'en-GB' : 'fr-MA', { weekday: 'narrow' })}</Text>
            </View>
          ))}
        </View>
      </Card>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name="check" color={C.green} />
        <Text style={[T.h3, { flex: 1 }]}>{t('noCommission')}</Text>
      </Card>
      <Card style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={T.h3}>{t('trips')}</Text>
        <Text style={[T.h3, T.num]}>{mine.length}</Text>
      </Card>
    </Page>
  );
}

export function Language() {
  const app = useApp();
  const { t } = app;
  return (
    <Page title={t('language')}>
      {LANGS.map(l => (
        <Pressable key={l.id} onPress={() => app.setLang(l.id)} style={[s.opt, app.lang === l.id && s.optOn]}>
          <Text style={[T.h3, { flex: 1 }]}>{l.label}</Text>
          {app.lang === l.id && <Icon name="check" color={C.green} />}
        </Pressable>
      ))}
      <Text style={T.small}>{t('langRestart')}</Text>
    </Page>
  );
}

export function Cities() {
  const app = useApp();
  const { t } = app;
  return (
    <Page title={t('cities')}>
      <Card style={{ backgroundColor: C.greenSoft, borderColor: 'transparent' }}>
        <Text style={T.h3}>{t('allMorocco')}</Text>
      </Card>
      <Card style={{ paddingVertical: 4 }}>
        {CITIES.map((c, i) => (
          <View key={c.id} style={[s.city, i > 0 && { borderTopWidth: 1, borderColor: C.line }]}>
            <Icon name="pin" size={18} color={c.launch ? C.red : C.muted} />
            <Text style={[T.h3, { flex: 1 }]}>{c[app.lang]}</Text>
            {c.launch ? <Pill text={t('launchCity')} color={C.red} bg={C.redSoft} /> : <Pill text={t('active')} />}
          </View>
        ))}
      </Card>
    </Page>
  );
}

const s = StyleSheet.create({
  drawer: { position: 'absolute', top: 0, bottom: 0, width: 310, backgroundColor: '#fff', paddingHorizontal: 18, gap: 16 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderColor: C.line },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 8, borderRadius: 12 },
  switch: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: R.lg },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: C.line },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 150, gap: 8 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: '100%' },
  bar: { width: '100%', borderRadius: 6 },
  opt: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: R.md, borderWidth: 1.5, borderColor: C.line, backgroundColor: '#fff' },
  optOn: { borderColor: C.green, backgroundColor: C.greenSoft },
  city: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
});
