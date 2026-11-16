import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { MarkPiece, Wordmark } from '../components/ui';
import { C } from '../theme';

/** Ouverture animée : les 4 pièces du logo s'assemblent, puis « Siir! » apparaît. */
export default function Intro({ onDone }: { onDone: () => void }) {
  const size = 120;
  const pieces = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const word = useRef(new Animated.Value(0)).current;
  const tag = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(1)).current;
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    Animated.timing(out, { toValue: 0, duration: 380, useNativeDriver: true }).start(onDone);
  };

  useEffect(() => {
    const ease = Easing.bezier(0.16, 1, 0.3, 1);
    Animated.sequence([
      Animated.stagger(140, pieces.map(v => Animated.timing(v, { toValue: 1, duration: 700, easing: ease, useNativeDriver: true }))),
      Animated.parallel([
        Animated.timing(word, { toValue: 1, duration: 600, easing: ease, useNativeDriver: true }),
        Animated.timing(tag, { toValue: 1, duration: 600, delay: 250, useNativeDriver: true }),
      ]),
      Animated.timing(bar, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
    ]).start(() => setTimeout(finish, 150));
  }, []);

  const from = [
    { x: -60, y: -60 },
    { x: -90, y: 0 },
    { x: 80, y: 0 },
    { x: -60, y: 60 },
  ];
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: out, zIndex: 50 }]}>
      <Pressable style={{ flex: 1 }} onPress={finish} accessibilityLabel="Passer l'introduction">
        <LinearGradient colors={['#FFFFFF', '#F1F7F4']} style={s.wrap}>
          <View style={s.row}>
            <View style={{ width: size * 0.76, height: size }}>
              {(['p1', 'p2', 'p3', 'p4'] as const).map((p, i) => (
                <Animated.View
                  key={p}
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      opacity: pieces[i],
                      transform: [
                        { translateX: pieces[i].interpolate({ inputRange: [0, 1], outputRange: [from[i].x, 0] }) },
                        { translateY: pieces[i].interpolate({ inputRange: [0, 1], outputRange: [from[i].y, 0] }) },
                        { scale: pieces[i].interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
                        { rotate: pieces[i].interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '0deg'] }) },
                      ],
                    },
                  ]}
                >
                  <MarkPiece piece={p} size={size} />
                </Animated.View>
              ))}
            </View>
            <Animated.View style={{ opacity: word, transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
              <Wordmark size={84} />
            </Animated.View>
          </View>
          <Animated.View style={[s.tagRow, { opacity: tag }]}>
            <Text style={s.ar}>سير</Text>
            <Text style={s.tag}>YALLAH · ON Y VA</Text>
          </Animated.View>
          <View style={s.track}>
            <Animated.View style={{ height: '100%', width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }}>
              <LinearGradient colors={[C.red, C.green]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
            </Animated.View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 18, direction: 'ltr' },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ar: { fontSize: 22, fontWeight: '800', color: C.text },
  tag: { fontSize: 12, fontWeight: '700', letterSpacing: 3, color: C.muted },
  track: { width: 170, height: 3, borderRadius: 3, backgroundColor: C.line, overflow: 'hidden' },
});
