import Constants, { ExecutionEnvironment } from 'expo-constants';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import Svg, { Path, Rect } from 'react-native-svg';
import { DEFAULT_CENTER, LatLng } from '../data/catalog';
import { C } from '../theme';

/**
 * Google Maps sur Android (Expo Go et builds) et sur iOS dès qu'une clé iOS est configurée dans le build.
 * Expo Go sur iPhone ne contient pas le SDK Google Maps : la carte Apple y est utilisée à la place.
 */
const iosHasGoogle = Platform.OS === 'ios' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient && !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
export const MAP_PROVIDER = Platform.OS === 'android' || iosHasGoogle ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

export type GMapHandle = { fit: (pts: LatLng[], bottomPad?: number) => void; center: (p: LatLng, zoomDelta?: number) => void };

type Props = {
  user?: LatLng | null;
  pickup?: LatLng | null;
  dest?: LatLng | null;
  route?: LatLng[];
  routeColor?: string;
  car?: { p: LatLng; heading: number } | null;
  extraCars?: { p: LatLng; heading: number }[];
  topPad?: number;
  bottomPad?: number;
};

export const GMap = forwardRef<GMapHandle, Props>(function GMap({ user, pickup, dest, route, routeColor = C.green, car, extraCars, topPad = 90, bottomPad = 300 }, ref) {
  const map = useRef<MapView>(null);
  useImperativeHandle(ref, () => ({
    fit: (pts, bp) => {
      const valid = pts.filter(Boolean);
      if (valid.length === 1) return map.current?.animateToRegion({ ...valid[0], latitudeDelta: 0.012, longitudeDelta: 0.012 }, 600);
      map.current?.fitToCoordinates(valid, { edgePadding: { top: topPad + 30, right: 50, bottom: (bp ?? bottomPad) + 30, left: 50 }, animated: true });
    },
    center: (p, d = 0.01) => map.current?.animateToRegion({ ...p, latitudeDelta: d, longitudeDelta: d }, 600),
  }));
  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={map}
        provider={MAP_PROVIDER}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...(user || DEFAULT_CENTER), latitudeDelta: 0.04, longitudeDelta: 0.04 }}
        showsUserLocation={!!user}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        toolbarEnabled={false}
        mapPadding={{ top: topPad, right: 0, bottom: bottomPad, left: 0 }}
      >
        {route && route.length > 1 && (
          <>
            <Polyline coordinates={route} strokeColor="rgba(11,20,17,0.25)" strokeWidth={9} />
            <Polyline coordinates={route} strokeColor={routeColor} strokeWidth={5} />
          </>
        )}
        {pickup && (
          <Marker coordinate={pickup} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View style={[s.dot, { borderColor: C.green }]}>
              <View style={[s.dotIn, { backgroundColor: C.green }]} />
            </View>
          </Marker>
        )}
        {dest && (
          <Marker coordinate={dest} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View style={[s.sq, { backgroundColor: C.red }]}>
              <View style={s.sqIn} />
            </View>
          </Marker>
        )}
        {(extraCars || []).map((c, i) => (
          <Marker key={i} coordinate={c.p} anchor={{ x: 0.5, y: 0.5 }} flat rotation={c.heading} tracksViewChanges={false}>
            <CarIcon color="#3D4A45" />
          </Marker>
        ))}
        {car && (
          <Marker coordinate={car.p} anchor={{ x: 0.5, y: 0.5 }} flat rotation={car.heading} tracksViewChanges={false}>
            <CarIcon color={C.ink} big />
          </Marker>
        )}
      </MapView>
    </View>
  );
});

function CarIcon({ color, big }: { color: string; big?: boolean }) {
  const w = big ? 26 : 20;
  return (
    <Svg width={w} height={w * 1.8} viewBox="0 0 20 36">
      <Rect x={2} y={2} width={16} height={32} rx={6} fill={color} stroke="#fff" strokeWidth={1.5} />
      <Path d="M5 9h10l-1.5 5h-7z" fill="#9FD9C1" />
      <Path d="M6 26h8l1 4H5z" fill="#9FD9C1" opacity={0.7} />
      <Rect x={4} y={2.5} width={3} height={1.6} rx={0.8} fill="#FFF6C8" />
      <Rect x={13} y={2.5} width={3} height={1.6} rx={0.8} fill="#FFF6C8" />
    </Svg>
  );
}

const s = StyleSheet.create({
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 4, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  dotIn: { width: 6, height: 6, borderRadius: 3 },
  sq: { width: 20, height: 20, borderRadius: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  sqIn: { width: 6, height: 6, backgroundColor: '#fff', borderRadius: 1 },
});
