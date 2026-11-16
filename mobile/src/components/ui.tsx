import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient as SvgGrad, Path, Polygon, Polyline, Stop } from 'react-native-svg';
import { C, R, shadow } from '../theme';

/* ---------- Logo vectoriel (pièces séparables pour l'animation d'ouverture) ---------- */
export const PIECES = {
  p1: '2,2 22,22 9.5,35.5 2,28',
  p2: '25,25.5 50.5,51 25,76.5 11.5,63 23,51 12,39',
  p3: '23.7,10.2 64,50.5 23.7,90.8',
  p4: '2,98 22,78 9.5,64.5 2,72',
};
export function MarkPiece({ piece, size }: { piece: keyof typeof PIECES; size: number }) {
  const red = piece === 'p1' || piece === 'p2';
  const id = 'g' + piece;
  return (
    <Svg width={size * 0.76} height={size} viewBox="0 0 76 100" style={StyleSheet.absoluteFill}>
      <Defs>
        <SvgGrad id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={red ? '#E5405D' : '#34DB9C'} />
          <Stop offset="0.5" stopColor={red ? '#B81D3A' : '#14A870'} />
          <Stop offset="1" stopColor={red ? '#8A1426' : '#0A835A'} />
        </SvgGrad>
      </Defs>
      {piece === 'p3' ? (
        <Polyline points={PIECES.p3} fill="none" stroke={`url(#${id})`} strokeWidth={12.4} strokeMiterlimit={10} />
      ) : (
        <Polygon points={PIECES[piece]} fill={`url(#${id})`} />
      )}
    </Svg>
  );
}
export function Mark({ size = 40 }: { size?: number }) {
  return (
    <View style={{ width: size * 0.76, height: size }}>
      {(['p1', 'p2', 'p3', 'p4'] as const).map(p => (
        <MarkPiece key={p} piece={p} size={size} />
      ))}
    </View>
  );
}
export function Wordmark({ size = 32 }: { size?: number }) {
  const st: TextStyle = { fontSize: size, fontWeight: '900', letterSpacing: -size * 0.03, includeFontPadding: false };
  return (
    <Text style={[st, { writingDirection: 'ltr' }]}>
      <Text style={{ color: C.red }}>S</Text>
      <Text style={{ color: C.green }}>ii</Text>
      <Text style={{ color: C.red }}>r!</Text>
    </Text>
  );
}

/* ---------- Typo ---------- */
export const T = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.4 },
  h2: { fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.2 },
  h3: { fontSize: 16, fontWeight: '700', color: C.text },
  body: { fontSize: 15, color: C.text },
  muted: { fontSize: 13.5, color: C.muted },
  small: { fontSize: 12, color: C.muted },
  eyebrow: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase' },
  num: { fontVariant: ['tabular-nums'] },
});

/* ---------- Boutons ---------- */
type BtnProps = { title: string; onPress?: () => void; kind?: 'primary' | 'red' | 'ghost' | 'dark'; disabled?: boolean; loading?: boolean; icon?: React.ReactNode; style?: StyleProp<ViewStyle>; small?: boolean };
export function Button({ title, onPress, kind = 'primary', disabled, loading, icon, style, small }: BtnProps) {
  const grad = kind === 'primary' ? ['#18B97C', C.green] : kind === 'red' ? ['#D63250', C.red] : kind === 'dark' ? ['#1C2925', C.ink] : null;
  const fg = kind === 'ghost' ? C.text : '#fff';
  const inner = (
    <View style={[styles.btnInner, small && { paddingVertical: 10, paddingHorizontal: 14 }]}>
      {loading ? <ActivityIndicator color={fg} /> : icon}
      <Text style={[styles.btnText, { color: fg }, small && { fontSize: 14 }]} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
  return (
    <Pressable
      accessibilityRole="button"
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [styles.btn, kind === 'ghost' && styles.btnGhost, (disabled || loading) && { opacity: 0.5 }, pressed && { transform: [{ scale: 0.98 }] }, style]}
    >
      {grad ? (
        <LinearGradient colors={grad as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: R.md }}>
          {inner}
        </LinearGradient>
      ) : (
        inner
      )}
    </Pressable>
  );
}

export function IconButton({ onPress, children, label, style }: { onPress?: () => void; children: React.ReactNode; label: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }, style]}>
      {children}
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Pill({ text, color = C.green, bg = C.greenSoft }: { text: string; color?: string; bg?: string }) {
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, alignSelf: 'flex-start' }}>
      <Text style={{ color, fontSize: 11.5, fontWeight: '800' }}>{text}</Text>
    </View>
  );
}

export function Plate({ p }: { p: string[] }) {
  return (
    <View style={styles.plate}>
      <Text style={styles.plateT}>{p[0]}</Text>
      <View style={styles.plateSep} />
      <Text style={styles.plateT}>{p[1]}</Text>
      <View style={styles.plateSep} />
      <Text style={styles.plateT}>{p[2]}</Text>
    </View>
  );
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const ini = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 2;
  return (
    <LinearGradient colors={h ? ['#C42540', '#6E1020'] : ['#14A870', '#0A5A3D']} style={{ width: size, height: size, borderRadius: size / 3, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.34 }}>{ini}</Text>
    </LinearGradient>
  );
}

/* ---------- Icônes (traits simples, 24×24) ---------- */
const ICONS: Record<string, string> = {
  menu: 'M4 7h16M4 12h16M4 17h10',
  close: 'M6 6l12 12M18 6L6 18',
  back: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  search: 'M16 16l4.5 4.5M11 4.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z',
  locate: 'M12 2v3M12 19v3M2 12h3M19 12h3M12 8a4 4 0 100 8 4 4 0 000-8z',
  pin: 'M12 21s-6.5-6-6.5-11a6.5 6.5 0 0113 0c0 5-6.5 11-6.5 11zM12 7.7a2.3 2.3 0 100 4.6 2.3 2.3 0 000-4.6z',
  cash: 'M2.5 6.5h19v11h-19zM12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM6 9.5v5M18 9.5v5',
  phone: 'M6 3.5h3l1.5 4-2 1.5a11 11 0 006.5 6.5l1.5-2 4 1.5v3a2 2 0 01-2 2A16 16 0 014 5.5a2 2 0 012-2z',
  share: 'M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6M6 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM18 3.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM18 15.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
  shield: 'M12 3l7.5 3v5.5c0 4.6-3.2 8-7.5 9.5-4.3-1.5-7.5-4.9-7.5-9.5V6zM8.8 12l2.2 2.2 4.2-4.4',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8-4.3-4.1 5.9-.8z',
  car: 'M4 16.5V12l2-5h12l2 5v4.5M3 12h18M6.5 16.5v2M17.5 16.5v2',
  user: 'M12 4.7a3.8 3.8 0 100 7.6 3.8 3.8 0 000-7.6zM4.5 20c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5',
  clock: 'M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM12 7.5V12l3 2',
  globe: 'M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5z',
  help: 'M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM9.6 9.5a2.5 2.5 0 114 2c-.9.6-1.6 1.1-1.6 2.3M12 17h.01',
  map: 'M3 6l6-2.5 6 2.5 6-2.5v14.5l-6 2.5-6-2.5-6 2.5zM9 3.5v14.5M15 6v14.5',
  chart: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3',
  ticket: 'M3 8a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-4z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  nav: 'M12 3l7 18-7-4-7 4z',
  card: 'M3 6h18v12.5H3zM3 10h18M7 15h4',
  bank: 'M3 10h18M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18M12 3l9 5H3z',
  store: 'M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6',
  copy: 'M8 8h12v12H8zM16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3',
  refresh: 'M20 11a8 8 0 10-2.3 5.7M20 4v7h-7',
  power: 'M12 3v8M7 6.5a7.5 7.5 0 1010 0',
  alert: 'M12 3l9.5 17h-19zM12 10v4.5M12 17.5h.01',
};
export function Icon({ name, size = 22, color = C.text, fill }: { name: string; size?: number; color?: string; fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={ICONS[name] || ''} fill={fill || 'none'} stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* ---------- Véhicule vu de côté (liste des catégories) ---------- */
export function Vehicle({ color, moto, w = 64 }: { color: string; moto?: boolean; w?: number }) {
  const h = w * 0.56;
  if (moto)
    return (
      <Svg width={w} height={h} viewBox="0 0 60 34">
        <Circle cx={13} cy={25} r={6} fill="none" stroke={color} strokeWidth={2.4} />
        <Circle cx={47} cy={25} r={6} fill="none" stroke={color} strokeWidth={2.4} />
        <Path d="M13 25l10-11h12l12 11M33 9h6l3 5" fill="none" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M22 14h14l-3 6H24z" fill={color} />
      </Svg>
    );
  return (
    <Svg width={w} height={h} viewBox="0 0 60 34">
      <Path d="M3 24v-6c0-2 1-3 3-3.5L14 13l7-6c1.2-1 2.6-1.5 4-1.5h12c2 0 3.5.6 5 2l6 6 9 1.5c2 .3 3 1.5 3 3.5V24z" fill={color} />
      <Path d="M17 13l5-4.5c.8-.6 1.6-1 2.6-1H32v5.5zM34 7.5h1c1.4 0 2.4.4 3.4 1.4l3.6 4.1H34z" fill="#fff" opacity={0.85} />
      <G>
        <Circle cx={15} cy={25} r={5} fill={C.ink} stroke="#fff" strokeWidth={2} />
        <Circle cx={46} cy={25} r={5} fill={C.ink} stroke="#fff" strokeWidth={2} />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: R.md, overflow: 'hidden' },
  btnGhost: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.line },
  btnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, paddingHorizontal: 18 },
  btnText: { fontSize: 16, fontWeight: '800' },
  iconBtn: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow },
  card: { backgroundColor: C.card, borderRadius: R.lg, padding: 14, borderWidth: 1, borderColor: C.line },
  plate: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#1a1a1a', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', gap: 6 },
  plateT: { fontWeight: '800', fontSize: 13, color: '#111', fontVariant: ['tabular-nums'] },
  plateSep: { width: 1, height: 14, backgroundColor: '#999' },
});
