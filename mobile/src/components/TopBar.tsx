import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../store/AppStore';
import { C, shadow } from '../theme';
import { Icon, IconButton } from './ui';

/** Barre du haut : menu + bascule Passager / Chauffeur (l'app 2-en-1). */
export function TopBar({ onMenu, right }: { onMenu: () => void; right?: React.ReactNode }) {
  const app = useApp();
  const ins = useSafeAreaInsets();
  const seg = (role: 'rider' | 'driver') => {
    const on = app.role === role;
    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        onPress={() => !on && app.switchRole()}
        style={[s.segBtn, on && { backgroundColor: role === 'rider' ? C.green : C.red }]}
      >
        <Icon name={role === 'rider' ? 'user' : 'car'} size={16} color={on ? '#fff' : C.muted} />
        <Text style={[s.segT, { color: on ? '#fff' : C.muted }]}>{app.t(role)}</Text>
      </Pressable>
    );
  };
  return (
    <View style={[s.bar, { top: ins.top + 10 }]} pointerEvents="box-none">
      <IconButton label={app.t('menu')} onPress={onMenu}>
        <Icon name="menu" />
      </IconButton>
      <View style={s.seg}>
        {seg('rider')}
        {seg('driver')}
      </View>
      {right || <View style={{ width: 46 }} />}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { position: 'absolute', left: 14, right: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 5 },
  seg: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 99, padding: 4, ...shadow },
  segBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 99 },
  segT: { fontWeight: '800', fontSize: 13 },
});
