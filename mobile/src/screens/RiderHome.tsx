import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GMap, GMapHandle } from '../components/GMap';
import { TopBar } from '../components/TopBar';
import { Button, Card, Icon, IconButton, T } from '../components/ui';
import { offset } from '../services/geo';
import { useLoc } from '../services/useUserLocation';
import { useApp } from '../store/AppStore';
import { C, R, shadow } from '../theme';

export default function RiderHome({ openMenu }: { openMenu: () => void }) {
  const app = useApp();
  const { t } = app;
  const loc = useLoc();
  const ins = useSafeAreaInsets();
  const map = useRef<GMapHandle>(null);
  const [sheetH, setSheetH] = useState(300);
  const centered = useRef(false);

  useEffect(() => {
    if (loc.pos && !centered.current) {
      centered.current = true;
      map.current?.center(loc.pos, 0.012);
    }
  }, [loc.pos]);

  // Voitures disponibles autour de l'utilisateur (démo)
  const cars = useRef<{ p: any; heading: number }[]>([]);
  if (loc.pos && cars.current.length === 0) cars.current = [0.35, 0.6, 0.9, 1.2, 0.5].map((km, i) => ({ p: offset(loc.pos!, km, i * 72 + 20), heading: i * 67 }));

  const greet = app.name ? t('hello', { name: app.name.split(' ')[0] }) : t('whereTo');
  return (
    <View style={{ flex: 1 }}>
      <GMap ref={map} user={loc.pos} extraCars={cars.current} bottomPad={sheetH} topPad={ins.top + 70} />
      <TopBar onMenu={openMenu} />
      <IconButton
        label={t('myPosition')}
        style={[s.locate, { bottom: sheetH + 14 }]}
        onPress={async () => {
          const p = loc.pos || (await loc.refresh());
          if (p) map.current?.center(p, 0.008);
          else loc.openSettings();
        }}
      >
        <Icon name="locate" color={loc.state === 'granted' ? C.blue : C.muted} />
      </IconButton>

      <View style={[s.sheet, { paddingBottom: ins.bottom + 16 }]} onLayout={e => setSheetH(e.nativeEvent.layout.height)}>
        <View style={s.grab} />
        {loc.state === 'denied' || loc.state === 'off' ? (
          <Card style={{ backgroundColor: C.amberSoft, borderColor: '#F3D9A5', gap: 8 }}>
            <Text style={T.h3}>{t('locationOff')}</Text>
            <Text style={T.muted}>{t('locationOffSub')}</Text>
            <Button small title={t('enableLocation')} kind="dark" onPress={() => (loc.state === 'off' ? loc.openSettings() : loc.refresh().then(p => { if (!p) loc.openSettings(); }))} />
          </Card>
        ) : (
          <View style={s.here}>
            <View style={s.hereDot} />
            {loc.addr ? (
              <Text style={[T.muted, { flex: 1 }]} numberOfLines={1}>
                {loc.addr.title}
                {loc.addr.city ? ' · ' + loc.addr.city : ''}
              </Text>
            ) : (
              <>
                <ActivityIndicator size="small" color={C.green} />
                <Text style={T.muted}>{t('locating')}</Text>
              </>
            )}
          </View>
        )}
        <Text style={[T.eyebrow, { marginTop: 4 }]}>{greet}</Text>
        <Text style={T.h1}>{t('whereTo')}</Text>
        <Pressable style={s.search} onPress={() => app.go({ name: 'search' })} accessibilityRole="search">
          <Icon name="search" color={C.text} />
          <Text style={[T.h3, { flex: 1, color: C.muted }]}>{t('searchDest')}</Text>
        </Pressable>
        <View style={s.badges}>
          <View style={s.badge}>
            <Icon name="cash" size={18} color={C.green} />
            <Text style={s.badgeT}>{t('cashOnly')}</Text>
          </View>
          <Pressable style={s.badge} onPress={() => app.go({ name: 'cities' })}>
            <Icon name="map" size={18} color={C.red} />
            <Text style={s.badgeT}>{t('allMorocco')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  locate: { position: 'absolute', right: 16 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, paddingHorizontal: 18, paddingTop: 10, gap: 10, ...shadow },
  grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.line, alignSelf: 'center', marginBottom: 4 },
  here: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hereDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.blue, borderWidth: 2, borderColor: '#CFE2FA' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: R.md, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99, backgroundColor: C.bg },
  badgeT: { fontSize: 12.5, fontWeight: '700', color: C.text },
});
