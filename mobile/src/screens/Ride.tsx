import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GMap, GMapHandle } from '../components/GMap';
import { Avatar, Button, Card, Icon, IconButton, Pill, Plate, T, Vehicle } from '../components/ui';
import { CATEGORIES, CatId, DRIVER_POOL, fare, LatLng } from '../data/catalog';
import { along, getRoute, offset, Route } from '../services/geo';
import { useApp } from '../store/AppStore';
import { C, R, shadow } from '../theme';

type Stage = 'choose' | 'searching' | 'coming' | 'arrived' | 'ontrip' | 'done';
type Pt = { coords: LatLng; title: string };

// Durées accélérées pour la démo
const APPROACH_MS = 22000, WAIT_MS = 7000, TRIP_MS = 28000;

export default function Ride({ from, to }: { from: Pt; to: Pt }) {
  const app = useApp();
  const { t } = app;
  const ins = useSafeAreaInsets();
  const map = useRef<GMapHandle>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [cat, setCat] = useState<CatId>('eco');
  const [note, setNote] = useState('');
  const [stage, setStage] = useState<Stage>('choose');
  const [driver, setDriver] = useState<(typeof DRIVER_POOL)[number] | null>(null);
  const [approach, setApproach] = useState<LatLng[]>([]);
  const [phaseAt, setPhaseAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [sheetH, setSheetH] = useState(360);
  const [sos, setSos] = useState(false);
  const [stars, setStars] = useState(0);
  const [tip, setTip] = useState(0);
  const pin = useMemo(() => String(1000 + Math.floor(Math.random() * 9000)), []);

  useEffect(() => {
    getRoute(from.coords, to.coords).then(r => {
      setRoute(r);
      setTimeout(() => map.current?.fit(r.coords, sheetH), 300);
    });
  }, []);

  // Horloge de la simulation
  useEffect(() => {
    if (stage === 'choose' || stage === 'done') return;
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, [stage]);

  const el = now - phaseAt;
  useEffect(() => {
    if (stage === 'coming' && el > APPROACH_MS) next('arrived');
    else if (stage === 'arrived' && el > WAIT_MS) next('ontrip');
    else if (stage === 'ontrip' && el > TRIP_MS) next('done');
  }, [now]);

  const next = (s: Stage) => {
    setStage(s);
    setPhaseAt(Date.now());
    setNow(Date.now());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const price = route ? fare(cat, route.km, route.minutes) : 0;
  const catName = t('cat_' + cat);

  const order = async () => {
    next('searching');
    const d = DRIVER_POOL[Math.floor(Math.random() * DRIVER_POOL.length)];
    const start = offset(from.coords, 1.1 + Math.random() * 0.8);
    const r = await getRoute(start, from.coords);
    setTimeout(() => {
      setDriver(d);
      setApproach(r.coords);
      next('coming');
      map.current?.fit([start, from.coords], sheetH);
    }, 3500);
  };

  useEffect(() => {
    if (stage === 'ontrip' && route) map.current?.fit(route.coords, sheetH);
  }, [stage]);

  const progress = stage === 'coming' ? Math.min(1, el / APPROACH_MS) : stage === 'ontrip' ? Math.min(1, el / TRIP_MS) : 0;
  const car =
    stage === 'coming' && approach.length ? along(approach, progress) :
    stage === 'arrived' ? { p: from.coords, heading: 0 } :
    stage === 'ontrip' && route ? along(route.coords, progress) : null;
  const etaMin = Math.max(1, Math.ceil((1 - progress) * 5));
  const arrival = new Date(Date.now() + Math.max(1, Math.ceil((1 - progress) * (route?.minutes || 10))) * 60e3).toLocaleTimeString(app.lang === 'ar' ? 'ar-MA' : 'fr-MA', { hour: '2-digit', minute: '2-digit' });

  const cancel = () =>
    Alert.alert(t('cancelConfirm'), '', [
      { text: t('keep'), style: 'cancel' },
      {
        text: t('cancelRide'),
        style: 'destructive',
        onPress: () => {
          if (driver) app.addTrip({ id: Date.now() + '', role: 'rider', from: from.title, to: to.title, km: route?.km || 0, price: 0, cat, with: driver.name, at: Date.now(), status: 'cancelled' });
          app.home();
        },
      },
    ]);

  const finish = () => {
    app.addTrip({ id: Date.now() + '', role: 'rider', from: from.title, to: to.title, km: route?.km || 0, price, cat, with: driver?.name || '', at: Date.now(), rating: stars, tip, status: 'completed' });
    Alert.alert(t('thanks'));
    app.home();
  };

  return (
    <View style={{ flex: 1 }}>
      <GMap
        ref={map}
        user={null}
        pickup={from.coords}
        dest={to.coords}
        route={stage === 'coming' ? approach : route?.coords}
        routeColor={stage === 'coming' ? C.green : stage === 'choose' ? C.green : C.red}
        car={car}
        bottomPad={sheetH}
        topPad={ins.top + 70}
      />
      <View style={[s.top, { top: ins.top + 10 }]}>
        {stage === 'choose' && (
          <IconButton label="Retour" onPress={app.back}>
            <Icon name="back" />
          </IconButton>
        )}
        {stage !== 'choose' && stage !== 'done' && (
          <IconButton label={t('safety')} onPress={() => setSos(true)} style={{ marginLeft: 'auto' }}>
            <Icon name="shield" color={C.red} />
          </IconButton>
        )}
      </View>

      <View style={[s.sheet, { paddingBottom: ins.bottom + 14 }]} onLayout={e => setSheetH(e.nativeEvent.layout.height)}>
        <View style={s.grab} />
        {stage === 'choose' && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[T.h3, { flex: 1 }]} numberOfLines={1}>
                {from.title} → {to.title}
              </Text>
              {route && (
                <Text style={[T.small, T.num]}>
                  {route.km.toFixed(1)} {t('km')} · {route.minutes} {t('min')}
                </Text>
              )}
            </View>
            {!route ? (
              <ActivityIndicator color={C.green} style={{ marginVertical: 30 }} />
            ) : (
              <ScrollView style={{ maxHeight: 290 }} contentContainerStyle={{ gap: 6 }}>
                {route.approx && <Text style={[T.small, { color: C.amber }]}>{t('routeError')}</Text>}
                {CATEGORIES.map(c => {
                  const on = c.id === cat;
                  return (
                    <Pressable key={c.id} onPress={() => setCat(c.id)} style={[s.cat, on && s.catOn]} accessibilityRole="radio" accessibilityState={{ selected: on }}>
                      <Vehicle color={c.color} moto={c.id === 'moto'} w={58} />
                      <View style={{ flex: 1 }}>
                        <Text style={T.h3}>{t('cat_' + c.id)}</Text>
                        <Text style={T.small} numberOfLines={1}>
                          {c.eta} {t('min')} · {t('catd_' + c.id)}
                        </Text>
                      </View>
                      <Text style={[T.h3, T.num]}>{app.money(fare(c.id, route.km, route.minutes))}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            <View style={s.cash}>
              <Icon name="cash" color={C.green} />
              <View style={{ flex: 1 }}>
                <Text style={T.h3}>{t('cashOnly')}</Text>
                <Text style={T.small}>{t('cashOnlySub')}</Text>
              </View>
            </View>
            <TextInput style={s.note} placeholder={t('noteDriver')} placeholderTextColor={C.faint} value={note} onChangeText={setNote} maxLength={120} />
            <Button title={t('order', { cat: catName, price: app.money(price) })} disabled={!route} onPress={order} />
          </>
        )}

        {stage === 'searching' && (
          <View style={{ alignItems: 'center', gap: 10, paddingVertical: 10 }}>
            <ActivityIndicator size="large" color={C.green} />
            <Text style={T.h2}>{t('findingDriver')}</Text>
            <Text style={T.muted}>{t('findingDriverSub')}</Text>
            <Button kind="ghost" title={t('cancel')} onPress={app.home} style={{ alignSelf: 'stretch', marginTop: 6 }} />
          </View>
        )}

        {(stage === 'coming' || stage === 'arrived' || stage === 'ontrip') && driver && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={T.h2}>
                  {stage === 'coming' ? t('driverComing', { n: etaMin }) : stage === 'arrived' ? t('driverArrived') : t('onTrip', { time: arrival })}
                </Text>
                {stage === 'arrived' && <Text style={T.muted}>{t('driverArrivedSub')}</Text>}
              </View>
              {stage !== 'ontrip' && (
                <View style={{ alignItems: 'center' }}>
                  <Text style={T.eyebrow}>{t('pin')}</Text>
                  <Text style={s.pin}>{pin}</Text>
                </View>
              )}
            </View>
            <View style={s.progress}>
              <View style={[s.progressIn, { width: `${(stage === 'arrived' ? 1 : progress) * 100}%`, backgroundColor: stage === 'ontrip' ? C.red : C.green }]} />
            </View>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={driver.name} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={T.h3}>{driver.name}</Text>
                <Text style={T.small}>
                  ★ {driver.rating.toFixed(2)} · {driver.car}
                </Text>
                <Plate p={driver.plate} />
              </View>
            </Card>
            <View style={s.actions}>
              <Action icon="phone" label={t('call')} onPress={() => Alert.alert(t('call'), '+212 5 22 00 47 47')} />
              <Action
                icon="share"
                label={t('share')}
                onPress={() => Share.share({ message: t('shareText', { driver: driver.name, plate: driver.plate.join(' '), time: arrival }) }).catch(() => {})}
              />
              <Action icon="shield" label={t('safety')} onPress={() => setSos(true)} red />
            </View>
            {stage !== 'ontrip' && <Button kind="ghost" title={t('cancelRide')} onPress={cancel} />}
          </>
        )}

        {stage === 'done' && driver && (
          <View style={{ gap: 12 }}>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Pill text={t('rideDone')} />
              <Text style={T.eyebrow}>{t('payCash')}</Text>
              <Text style={[s.total, T.num]}>{app.money(price + tip)}</Text>
              <Text style={T.h3}>{t('rateDriver', { name: driver.name.split(' ')[0] })}</Text>
            </View>
            <View style={s.stars}>
              {[1, 2, 3, 4, 5].map(i => (
                <Pressable key={i} onPress={() => setStars(i)} accessibilityLabel={`${i}`}>
                  <Icon name="star" size={38} color={stars >= i ? C.amber : C.faint} fill={stars >= i ? C.amber : undefined} />
                </Pressable>
              ))}
            </View>
            <Text style={T.eyebrow}>{t('tip')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[0, 5, 10, 20].map(v => (
                <Pressable key={v} onPress={() => setTip(v)} style={[s.chip, tip === v && s.chipOn]}>
                  <Text style={{ fontWeight: '800', color: tip === v ? C.green : C.text }}>{v ? app.money(v) : t('noTip')}</Text>
                </Pressable>
              ))}
            </View>
            <Button title={t('send')} disabled={!stars} onPress={finish} />
          </View>
        )}
      </View>

      <Modal visible={sos} transparent animationType="slide" onRequestClose={() => setSos(false)}>
        <Pressable style={s.overlay} onPress={() => setSos(false)} />
        <View style={[s.modal, { paddingBottom: ins.bottom + 16 }]}>
          <Text style={[T.h2, { color: C.red }]}>{t('emergency')}</Text>
          {[
            ['19', 'police'],
            ['177', 'gendarmerie'],
            ['15', 'ambulance'],
          ].map(([n, k]) => (
            <Pressable key={n} style={s.sosRow} onPress={() => Linking.openURL('tel:' + n).catch(() => {})}>
              <Icon name="phone" color={C.red} />
              <Text style={[T.h3, { flex: 1 }]}>{t(k)}</Text>
              <Text style={[T.h2, T.num]}>{n}</Text>
            </Pressable>
          ))}
          {driver && (
            <Button
              kind="dark"
              title={t('shareTrip')}
              onPress={() => Share.share({ message: t('shareText', { driver: driver.name, plate: driver.plate.join(' '), time: arrival }) }).catch(() => {})}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

function Action({ icon, label, onPress, red }: { icon: string; label: string; onPress: () => void; red?: boolean }) {
  return (
    <Pressable style={s.action} onPress={onPress}>
      <Icon name={icon} color={red ? C.red : C.text} />
      <Text style={[T.small, { fontWeight: '700', color: C.text }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  top: { position: 'absolute', left: 14, right: 14, flexDirection: 'row' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, paddingHorizontal: 16, paddingTop: 10, gap: 10, ...shadow },
  grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.line, alignSelf: 'center' },
  cat: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: R.md, borderWidth: 1.5, borderColor: 'transparent' },
  catOn: { borderColor: C.green, backgroundColor: C.greenSoft },
  cash: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: R.md, backgroundColor: C.bg },
  note: { backgroundColor: C.bg, borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.text },
  pin: { fontSize: 22, fontWeight: '900', letterSpacing: 4, color: C.green, fontVariant: ['tabular-nums'] },
  progress: { height: 4, borderRadius: 2, backgroundColor: C.line, overflow: 'hidden' },
  progressIn: { height: '100%', borderRadius: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 11, borderRadius: R.md, backgroundColor: C.bg },
  total: { fontSize: 38, fontWeight: '900', color: C.text },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 99, backgroundColor: C.bg, borderWidth: 1.5, borderColor: 'transparent' },
  chipOn: { borderColor: C.green, backgroundColor: C.greenSoft },
  overlay: { flex: 1, backgroundColor: C.overlay },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: 18, gap: 10 },
  sosRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: R.md, backgroundColor: C.redSoft },
});
