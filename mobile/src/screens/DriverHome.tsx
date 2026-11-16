import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GMap, GMapHandle } from '../components/GMap';
import { TopBar } from '../components/TopBar';
import { Avatar, Button, Card, Icon, IconButton, Pill, T } from '../components/ui';
import { CATEGORIES, DEFAULT_CENTER, fare, LatLng, RIDER_DEMO_NAMES } from '../data/catalog';
import { addressOf, along, getRoute, haversineKm, offset } from '../services/geo';
import { useLoc } from '../services/useUserLocation';
import { useApp } from '../store/AppStore';
import { C, R, shadow } from '../theme';

type Req = { rider: string; rating: number; pickup: LatLng; pickupT: string; dest: LatLng; destT: string; km: number; minutes: number; price: number; toPickupKm: number; pin: string; approach: LatLng[]; route: LatLng[] };
type Stage = 'idle' | 'request' | 'toPickup' | 'waiting' | 'onTrip' | 'collect';
const APPROACH_MS = 20000, TRIP_MS = 26000, REQ_S = 15;

export default function DriverHome({ openMenu }: { openMenu: () => void }) {
  const app = useApp();
  const { t } = app;
  const loc = useLoc();
  const ins = useSafeAreaInsets();
  const map = useRef<GMapHandle>(null);
  const [online, setOnline] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [req, setReq] = useState<Req | null>(null);
  const [phaseAt, setPhaseAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [pinIn, setPinIn] = useState('');
  const [pinErr, setPinErr] = useState(false);
  const [sheetH, setSheetH] = useState(320);
  const me = loc.pos || DEFAULT_CENTER;

  const todays = app.trips.filter(x => x.role === 'driver' && x.status === 'completed' && new Date(x.at).toDateString() === new Date().toDateString());
  const today = todays.reduce((a, x) => a + x.price + (x.tip || 0), 0);

  useEffect(() => {
    if (loc.pos && stage === 'idle') map.current?.center(loc.pos, 0.02);
  }, [!!loc.pos]);

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, []);

  // Si l'abonnement expire, le chauffeur repasse hors ligne
  useEffect(() => {
    if (!app.subActive && online) setOnline(false);
  }, [app.subActive]);

  // Démo : génère une demande réelle près de la position GPS du chauffeur
  useEffect(() => {
    if (!online || stage !== 'idle') return;
    let alive = true;
    const tm = setTimeout(async () => {
      const pickup = offset(me, 0.6 + Math.random() * 1.2);
      const dest = offset(pickup, 2.5 + Math.random() * 5);
      const [a, b, pa, pb] = await Promise.all([getRoute(me, pickup), getRoute(pickup, dest), addressOf(pickup), addressOf(dest)]);
      if (!alive) return;
      const cat = CATEGORIES[0];
      setReq({
        rider: RIDER_DEMO_NAMES[Math.floor(Math.random() * RIDER_DEMO_NAMES.length)],
        rating: 4.6 + Math.random() * 0.4,
        pickup, dest, pickupT: pa.title, destT: pb.title,
        km: b.km, minutes: b.minutes, price: fare(cat.id, b.km, b.minutes),
        toPickupKm: a.km, pin: String(1000 + Math.floor(Math.random() * 9000)),
        approach: a.coords, route: b.coords,
      });
      phase('request');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      map.current?.fit([me, pickup, dest], sheetH);
    }, 5000 + Math.random() * 4000);
    return () => {
      alive = false;
      clearTimeout(tm);
    };
  }, [online, stage]);

  const phase = (s: Stage) => {
    setStage(s);
    setPhaseAt(Date.now());
  };
  const el = now - phaseAt;
  const reqLeft = Math.max(0, REQ_S - Math.floor(el / 1000));
  useEffect(() => {
    if (stage === 'request' && reqLeft === 0) {
      setReq(null);
      phase('idle');
    }
  }, [reqLeft, stage]);

  const progress = stage === 'toPickup' ? Math.min(0.97, el / APPROACH_MS) : stage === 'onTrip' ? Math.min(0.97, el / TRIP_MS) : 0;
  const car =
    stage === 'toPickup' && req ? along(req.approach, progress) :
    stage === 'waiting' && req ? { p: req.pickup, heading: 0 } :
    stage === 'onTrip' && req ? along(req.route, progress) :
    stage === 'collect' && req ? { p: req.dest, heading: 0 } : null;

  const navigate = (p: LatLng) => {
    const g = Platform.OS === 'ios' ? `comgooglemaps://?daddr=${p.latitude},${p.longitude}&directionsmode=driving` : `google.navigation:q=${p.latitude},${p.longitude}`;
    Linking.openURL(g).catch(() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}&travelmode=driving`));
  };

  const complete = () => {
    if (!req) return;
    app.addTrip({ id: Date.now() + '', role: 'driver', from: req.pickupT, to: req.destT, km: req.km, price: req.price, cat: 'eco', with: req.rider, at: Date.now(), status: 'completed' });
    setReq(null);
    setPinIn('');
    phase('idle');
    if (loc.pos) map.current?.center(loc.pos, 0.02);
  };

  const subDays = app.sub.expiresAt ? Math.max(0, (app.sub.expiresAt - Date.now()) / 864e5) : 0;

  return (
    <View style={{ flex: 1 }}>
      <GMap
        ref={map}
        user={loc.pos}
        pickup={req && stage !== 'idle' ? req.pickup : null}
        dest={req && stage !== 'idle' ? req.dest : null}
        route={stage === 'request' || stage === 'toPickup' ? req?.approach : req && stage !== 'idle' ? req.route : undefined}
        routeColor={stage === 'onTrip' || stage === 'waiting' ? C.red : C.green}
        car={car}
        bottomPad={sheetH}
        topPad={ins.top + 70}
      />
      <TopBar
        onMenu={openMenu}
        right={
          <Pressable style={s.earn} onPress={() => app.go({ name: 'earnings' })}>
            <Text style={s.earnL}>{t('todayEarnings')}</Text>
            <Text style={[s.earnV, T.num]}>{app.money(today)}</Text>
          </Pressable>
        }
      />
      {stage === 'idle' && (
        <IconButton label={t('myPosition')} style={[s.locate, { bottom: sheetH + 14 }]} onPress={() => (loc.pos ? map.current?.center(loc.pos, 0.012) : loc.refresh())}>
          <Icon name="locate" color={C.blue} />
        </IconButton>
      )}

      <View style={[s.sheet, { paddingBottom: ins.bottom + 14 }]} onLayout={e => setSheetH(e.nativeEvent.layout.height)}>
        <View style={s.grab} />

        {stage === 'idle' && !app.subActive && (
          <>
            <Card style={{ backgroundColor: app.sub.status === 'pending' ? C.amberSoft : C.redSoft, borderColor: 'transparent', gap: 6 }}>
              <Text style={T.h2}>{app.sub.status === 'pending' ? t('pendingTitle') : app.sub.expiresAt ? t('subExpired') : t('subRequired')}</Text>
              <Text style={T.muted}>{app.sub.status === 'pending' ? t('pendingSub') : t('subRequiredSub')}</Text>
            </Card>
            <Button kind="red" title={app.sub.status === 'pending' ? t('subscription') : t('choosePlan')} icon={<Icon name="ticket" color="#fff" />} onPress={() => app.go({ name: 'subscription' })} />
            <Text style={[T.small, { textAlign: 'center' }]}>{t('noCommission')}</Text>
          </>
        )}

        {stage === 'idle' && app.subActive && !online && (
          <>
            <Text style={[T.h2, { textAlign: 'center' }]}>{t('readyToDrive', { name: (app.name || 'SIIR').split(' ')[0] })}</Text>
            <Pressable onPress={() => setOnline(true)} style={{ alignSelf: 'center' }} accessibilityRole="button" accessibilityLabel={t('goOnline')}>
              <LinearGradient colors={['#2EE59D', C.green]} style={s.go}>
                <Text style={s.goT}>GO</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => app.go({ name: 'subscription' })} style={s.subRow}>
              <Icon name="ticket" color={C.green} />
              <Text style={[T.h3, { flex: 1 }]}>{t('subActive')}</Text>
              <Text style={[T.small, T.num]}>{subDays >= 1 ? t('daysLeft', { n: Math.floor(subDays) }) : t('hoursLeft', { n: Math.ceil(subDays * 24) })}</Text>
            </Pressable>
          </>
        )}

        {stage === 'idle' && app.subActive && online && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Pill text={t('online')} />
                <Text style={[T.h2, { marginTop: 6 }]}>{t('lookingRides')}</Text>
              </View>
              <Pressable onPress={() => setOnline(false)} accessibilityLabel={t('goOffline')}>
                <LinearGradient colors={['#E5405D', C.red]} style={s.stop}>
                  <Icon name="power" color="#fff" />
                </LinearGradient>
              </Pressable>
            </View>
            <Text style={T.small}>{t('noCommission')}</Text>
          </>
        )}

        {stage === 'request' && req && (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={T.eyebrow}>{t('newRequest')} · {t('cat_eco')}</Text>
                <Text style={[s.fare, T.num]}>{app.money(req.price)}</Text>
                <Text style={T.small}>{t('cashOnly')}</Text>
              </View>
              <View style={s.ring}>
                <Text style={[T.h2, T.num]}>{reqLeft}</Text>
              </View>
            </View>
            <Stops a={req.pickupT} aSub={`${req.toPickupKm.toFixed(1)} ${t('km')}`} b={req.destT} bSub={`${req.km.toFixed(1)} ${t('km')} · ${req.minutes} ${t('min')}`} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Avatar name={req.rider} size={30} />
              <Text style={T.muted}>
                {req.rider} · ★ {req.rating.toFixed(2)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button kind="ghost" title={t('decline')} style={{ flex: 1 }} onPress={() => { setReq(null); phase('idle'); }} />
              <Button title={t('accept')} style={{ flex: 2 }} onPress={() => { phase('toPickup'); map.current?.fit([me, req.pickup], sheetH); }} />
            </View>
          </View>
        )}

        {(stage === 'toPickup' || stage === 'waiting' || stage === 'onTrip') && req && (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={T.eyebrow}>{stage === 'toPickup' ? t('toPickup') : stage === 'waiting' ? t('waitingRider') : t('toDest')}</Text>
                <Text style={T.h2} numberOfLines={1}>{stage === 'onTrip' ? req.destT : req.pickupT}</Text>
              </View>
              {stage !== 'waiting' && <Button small kind="dark" title={t('navigate')} icon={<Icon name="nav" size={16} color="#fff" />} onPress={() => navigate(stage === 'onTrip' ? req.dest : req.pickup)} />}
            </View>
            <View style={s.progress}>
              <View style={{ height: '100%', width: `${(stage === 'waiting' ? 1 : progress) * 100}%`, backgroundColor: stage === 'onTrip' ? C.red : C.green }} />
            </View>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 }}>
              <Avatar name={req.rider} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={T.h3}>{req.rider}</Text>
                <Text style={T.small}>
                  {t('cashOnly')} · {app.money(req.price)}
                </Text>
              </View>
            </Card>
            {stage === 'toPickup' && <Button title={t('arrived')} onPress={() => phase('waiting')} />}
            {stage === 'waiting' && (
              <>
                <Text style={T.h3}>{t('enterPin')}</Text>
                <TextInput
                  style={[s.pinIn, pinErr && { borderColor: C.red }]}
                  value={pinIn}
                  onChangeText={v => { setPinIn(v.replace(/\D/g, '').slice(0, 4)); setPinErr(false); }}
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="• • • •"
                  placeholderTextColor={C.faint}
                />
                <Text style={T.small}>{pinErr ? t('wrongPin') : t('pinDemo', { pin: req.pin })}</Text>
                <Button kind="red" title={t('startRide')} disabled={pinIn.length !== 4} onPress={() => (pinIn === req.pin ? phase('onTrip') : setPinErr(true))} />
              </>
            )}
            {stage === 'onTrip' && <Button kind="red" title={t('endRide')} onPress={() => phase('collect')} />}
          </View>
        )}

        {stage === 'collect' && req && (
          <View style={{ alignItems: 'center', gap: 10 }}>
            <Icon name="cash" size={40} color={C.green} />
            <Text style={T.h2}>{t('collectCash', { amount: app.money(req.price) })}</Text>
            <Text style={[s.fare, T.num]}>{app.money(req.price)}</Text>
            <Button title={t('collected')} style={{ alignSelf: 'stretch' }} onPress={complete} />
          </View>
        )}
      </View>
    </View>
  );
}

function Stops({ a, aSub, b, bSub }: { a: string; aSub: string; b: string; bSub: string }) {
  return (
    <View style={{ gap: 8, padding: 12, borderRadius: R.md, backgroundColor: C.bg }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.green, marginTop: 5 }} />
        <View style={{ flex: 1 }}>
          <Text style={T.h3} numberOfLines={1}>{a}</Text>
          <Text style={T.small}>{aSub}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: C.red, marginTop: 5 }} />
        <View style={{ flex: 1 }}>
          <Text style={T.h3} numberOfLines={1}>{b}</Text>
          <Text style={T.small}>{bSub}</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  locate: { position: 'absolute', right: 16 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, paddingHorizontal: 16, paddingTop: 10, gap: 12, ...shadow },
  grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.line, alignSelf: 'center' },
  earn: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center', ...shadow },
  earnL: { fontSize: 10, fontWeight: '700', color: C.muted, textTransform: 'uppercase' },
  earnV: { fontSize: 14, fontWeight: '900', color: C.green },
  go: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: C.greenSoft },
  goT: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  stop: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: R.md, backgroundColor: C.greenSoft },
  fare: { fontSize: 32, fontWeight: '900', color: C.text },
  ring: { width: 58, height: 58, borderRadius: 29, borderWidth: 4, borderColor: C.green, alignItems: 'center', justifyContent: 'center' },
  progress: { height: 4, borderRadius: 2, backgroundColor: C.line, overflow: 'hidden' },
  pinIn: { fontSize: 28, fontWeight: '800', textAlign: 'center', letterSpacing: 14, paddingVertical: 10, borderRadius: R.md, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.bg, color: C.text },
});
