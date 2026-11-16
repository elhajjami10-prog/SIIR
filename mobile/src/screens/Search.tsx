import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconButton, T } from '../components/ui';
import { DEFAULT_CENTER, LatLng } from '../data/catalog';
import { haversineKm, Place, resolvePlace, searchPlaces } from '../services/geo';
import { useLoc } from '../services/useUserLocation';
import { useApp } from '../store/AppStore';
import { C, R } from '../theme';

type Field = 'from' | 'to';

export default function Search() {
  const app = useApp();
  const { t } = app;
  const loc = useLoc();
  const ins = useSafeAreaInsets();
  const [field, setField] = useState<Field>('to');
  const [from, setFrom] = useState<{ coords: LatLng; title: string } | null>(loc.pos ? { coords: loc.pos, title: t('myPosition') } : null);
  const [q, setQ] = useState({ from: '', to: '' });
  const [res, setRes] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const ctrl = useRef<AbortController | null>(null);
  const near = from?.coords || loc.pos || DEFAULT_CENTER;

  useEffect(() => {
    const query = q[field];
    ctrl.current?.abort();
    if (query.trim().length < 2) {
      setRes([]);
      setBusy(false);
      return;
    }
    setBusy(true);
    const c = new AbortController();
    ctrl.current = c;
    const tm = setTimeout(() => {
      searchPlaces(query, near, app.lang, c.signal)
        .then(r => !c.signal.aborted && setRes(r))
        .finally(() => !c.signal.aborted && setBusy(false));
    }, 380);
    return () => {
      clearTimeout(tm);
      c.abort();
    };
  }, [q, field]);

  const pick = async (p: Place) => {
    setBusy(true);
    const full = await resolvePlace(p, app.lang);
    setBusy(false);
    if (!full?.coords) return;
    const sel = { coords: full.coords, title: full.name };
    if (field === 'from') {
      setFrom(sel);
      setQ(x => ({ ...x, from: '' }));
      setField('to');
      return;
    }
    const start = from || (loc.pos ? { coords: loc.pos, title: t('myPosition') } : null);
    if (!start) {
      setField('from');
      return;
    }
    app.go({ name: 'choose', from: start, to: sel });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.head, { paddingTop: ins.top + 10 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconButton label="Retour" onPress={app.back} style={{ elevation: 0, shadowOpacity: 0, backgroundColor: C.bg }}>
            <Icon name="back" />
          </IconButton>
          <Text style={T.h2}>{t('whereTo')}</Text>
        </View>
        <View style={s.fields}>
          <View style={s.rail}>
            <View style={[s.dot, { backgroundColor: C.green }]} />
            <View style={s.line} />
            <View style={[s.dot, { backgroundColor: C.red, borderRadius: 2 }]} />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <TextInput
              style={[s.input, field === 'from' && s.inputOn]}
              placeholder={t('pickup')}
              placeholderTextColor={C.faint}
              value={field === 'from' ? q.from : from?.title || ''}
              onFocus={() => setField('from')}
              onChangeText={v => setQ(x => ({ ...x, from: v }))}
            />
            <TextInput
              style={[s.input, field === 'to' && s.inputOn]}
              placeholder={t('destination')}
              placeholderTextColor={C.faint}
              autoFocus
              value={q.to}
              onFocus={() => setField('to')}
              onChangeText={v => setQ(x => ({ ...x, to: v }))}
              returnKeyType="search"
            />
          </View>
        </View>
      </View>
      {field === 'from' && loc.pos && (
        <Pressable style={s.row} onPress={() => { setFrom({ coords: loc.pos!, title: t('myPosition') }); setField('to'); }}>
          <View style={[s.ic, { backgroundColor: '#E6F0FD' }]}>
            <Icon name="locate" size={18} color={C.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={T.h3}>{t('myPosition')}</Text>
            {loc.addr && <Text style={T.small} numberOfLines={1}>{loc.addr.title}</Text>}
          </View>
        </Pressable>
      )}
      {busy && <ActivityIndicator style={{ marginTop: 16 }} color={C.green} />}
      <FlatList
        data={res}
        keyboardShouldPersistTaps="handled"
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingBottom: ins.bottom + 20 }}
        ListEmptyComponent={!busy && q[field].trim().length >= 2 ? <Text style={[T.muted, { padding: 20 }]}>{t('noResults')}</Text> : undefined}
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [s.row, pressed && { backgroundColor: C.bg }]} onPress={() => pick(item)}>
            <View style={s.ic}>
              <Icon name="pin" size={18} color={C.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={T.h3} numberOfLines={1}>{item.name}</Text>
              {!!item.address && <Text style={T.small} numberOfLines={1}>{item.address}</Text>}
            </View>
            {item.coords && (
              <Text style={[T.small, T.num]}>
                {haversineKm(near, item.coords).toFixed(1)} {t('km')}
              </Text>
            )}
          </Pressable>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  head: { paddingHorizontal: 16, paddingBottom: 14, gap: 14, borderBottomWidth: 1, borderColor: C.line },
  fields: { flexDirection: 'row', gap: 10 },
  rail: { width: 14, alignItems: 'center', paddingVertical: 20 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { flex: 1, width: 2, backgroundColor: C.line, marginVertical: 4 },
  input: { backgroundColor: C.bg, borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, fontWeight: '600', color: C.text, borderWidth: 1.5, borderColor: 'transparent' },
  inputOn: { borderColor: C.green, backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderColor: C.line },
  ic: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
});
