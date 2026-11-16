import * as Location from 'expo-location';
import { LatLng } from '../data/catalog';
import { Lang } from '../i18n';

/**
 * Clé Google Maps Platform (Places API (New) + Routes API).
 * À définir dans mobile/.env : EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
 * Sans clé, l'app utilise OpenStreetMap (Nominatim + OSRM), gratuit et sans compte.
 */
export const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

/* ---------------- Géolocalisation ---------------- */
export type LocState = 'unknown' | 'granted' | 'denied' | 'off';

export async function ensureLocation(): Promise<LocState> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return 'denied';
    const on = await Location.hasServicesEnabledAsync();
    return on ? 'granted' : 'off';
  } catch {
    return 'denied';
  }
}

export async function currentPosition(): Promise<LatLng | null> {
  try {
    const last = await Location.getLastKnownPositionAsync({ maxAge: 60_000 });
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      new Promise<null>(res => setTimeout(() => res(null), 8000)),
    ]);
    const p = pos || last;
    return p ? { latitude: p.coords.latitude, longitude: p.coords.longitude } : null;
  } catch {
    return null;
  }
}

export function watchPosition(cb: (p: LatLng) => void) {
  let sub: Location.LocationSubscription | null = null;
  let stopped = false;
  Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 15, timeInterval: 5000 }, l =>
    cb({ latitude: l.coords.latitude, longitude: l.coords.longitude }),
  )
    .then(s => (stopped ? s.remove() : (sub = s)))
    .catch(() => {});
  return () => {
    stopped = true;
    sub?.remove();
  };
}

export async function addressOf(p: LatLng): Promise<{ title: string; city: string }> {
  try {
    const [a] = await Location.reverseGeocodeAsync(p);
    if (a) {
      const street = [a.streetNumber, a.street].filter(Boolean).join(' ');
      const title = street || a.name || a.district || a.subregion || a.city || '';
      return { title, city: a.city || a.subregion || a.region || '' };
    }
  } catch {}
  return { title: `${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`, city: '' };
}

/* ---------------- Recherche de lieux ---------------- */
export type Place = { id: string; name: string; address: string; coords?: LatLng; googleId?: string };

export async function searchPlaces(q: string, near: LatLng, lang: Lang, signal?: AbortSignal): Promise<Place[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  if (GOOGLE_KEY) {
    try {
      const r = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GOOGLE_KEY },
        body: JSON.stringify({
          input: query,
          includedRegionCodes: ['ma'],
          languageCode: lang,
          locationBias: { circle: { center: near, radius: 50000 } },
        }),
      });
      const j = await r.json();
      const out: Place[] = (j.suggestions || [])
        .filter((s: any) => s.placePrediction)
        .map((s: any) => ({
          id: s.placePrediction.placeId,
          googleId: s.placePrediction.placeId,
          name: s.placePrediction.structuredFormat?.mainText?.text || s.placePrediction.text?.text,
          address: s.placePrediction.structuredFormat?.secondaryText?.text || '',
        }));
      if (out.length) return out;
    } catch (e: any) {
      if (e?.name === 'AbortError') return [];
    }
  }
  try {
    const d = 0.35;
    const url =
      'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&countrycodes=ma' +
      `&accept-language=${lang}&q=${encodeURIComponent(query)}` +
      `&viewbox=${near.longitude - d},${near.latitude + d},${near.longitude + d},${near.latitude - d}`;
    const r = await fetch(url, { signal, headers: { 'User-Agent': 'SIIR-App/1.0 (mobile)', Accept: 'application/json' } });
    const j = await r.json();
    const out: Place[] = (j || []).map((x: any) => ({
      id: String(x.place_id),
      name: x.name || String(x.display_name).split(',')[0],
      address: String(x.display_name).split(',').slice(1, 4).join(',').trim(),
      coords: { latitude: +x.lat, longitude: +x.lon },
    }));
    if (out.length) return out;
  } catch (e: any) {
    if (e?.name === 'AbortError') return [];
  }
  // Dernier recours : géocodeur natif de l'appareil
  try {
    const res = await Location.geocodeAsync(query + ', Maroc');
    return res.slice(0, 5).map((g, i) => ({
      id: 'geo' + i,
      name: query,
      address: `${g.latitude.toFixed(4)}, ${g.longitude.toFixed(4)}`,
      coords: { latitude: g.latitude, longitude: g.longitude },
    }));
  } catch {
    return [];
  }
}

export async function resolvePlace(p: Place, lang: Lang): Promise<Place | null> {
  if (p.coords) return p;
  if (!p.googleId || !GOOGLE_KEY) return null;
  try {
    const r = await fetch(`https://places.googleapis.com/v1/places/${p.googleId}?languageCode=${lang}`, {
      headers: { 'X-Goog-Api-Key': GOOGLE_KEY, 'X-Goog-FieldMask': 'location,displayName,formattedAddress' },
    });
    const j = await r.json();
    if (!j.location) return null;
    return { ...p, coords: { latitude: j.location.latitude, longitude: j.location.longitude } };
  } catch {
    return null;
  }
}

/* ---------------- Itinéraires ---------------- */
export type Route = { coords: LatLng[]; km: number; minutes: number; approx?: boolean };

export function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371, toR = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * toR, dLon = (b.longitude - a.longitude) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * toR) * Math.cos(b.latitude * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function decodePolyline(str: string): LatLng[] {
  let index = 0, lat = 0, lng = 0;
  const out: LatLng[] = [];
  while (index < str.length) {
    for (const k of [0, 1]) {
      let b, shift = 0, result = 0;
      do {
        b = str.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (k === 0) lat += d;
      else lng += d;
    }
    out.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return out;
}

export async function getRoute(a: LatLng, b: LatLng): Promise<Route> {
  if (GOOGLE_KEY) {
    try {
      const r = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_KEY,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify({
          origin: { location: { latLng: a } },
          destination: { location: { latLng: b } },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
        }),
      });
      const j = await r.json();
      const rt = j.routes?.[0];
      if (rt?.polyline?.encodedPolyline) {
        return {
          coords: decodePolyline(rt.polyline.encodedPolyline),
          km: rt.distanceMeters / 1000,
          minutes: Math.max(1, Math.round(parseInt(rt.duration, 10) / 60)),
        };
      }
    } catch {}
  }
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a.longitude},${a.latitude};${b.longitude},${b.latitude}?overview=full&geometries=geojson`;
    const r = await fetch(url, { headers: { 'User-Agent': 'SIIR-App/1.0 (mobile)' } });
    const j = await r.json();
    const rt = j.routes?.[0];
    if (rt) {
      return {
        coords: rt.geometry.coordinates.map(([lon, lat]: number[]) => ({ latitude: lat, longitude: lon })),
        km: rt.distance / 1000,
        // OSRM ne connaît pas le trafic : marge de 35 % pour la circulation urbaine marocaine
        minutes: Math.max(1, Math.round((rt.duration / 60) * 1.35)),
      };
    }
  } catch {}
  const km = haversineKm(a, b) * 1.3;
  return { coords: [a, b], km, minutes: Math.max(1, Math.round((km / 25) * 60)), approx: true };
}

/** Point situé à la fraction t (0..1) d'une polyligne, avec le cap en degrés. */
export function along(coords: LatLng[], t: number): { p: LatLng; heading: number } {
  if (coords.length < 2) return { p: coords[0], heading: 0 };
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const d = haversineKm(coords[i - 1], coords[i]);
    seg.push(d);
    total += d;
  }
  let target = Math.min(1, Math.max(0, t)) * total;
  for (let i = 0; i < seg.length; i++) {
    if (target <= seg[i] || i === seg.length - 1) {
      const k = seg[i] ? Math.min(1, target / seg[i]) : 1;
      const A = coords[i], B = coords[i + 1];
      const heading = (Math.atan2(B.longitude - A.longitude, B.latitude - A.latitude) * 180) / Math.PI;
      return { p: { latitude: A.latitude + (B.latitude - A.latitude) * k, longitude: A.longitude + (B.longitude - A.longitude) * k }, heading };
    }
    target -= seg[i];
  }
  return { p: coords[coords.length - 1], heading: 0 };
}

/** Point aléatoire à une distance donnée (km) — sert à simuler chauffeurs et demandes en démo. */
export function offset(p: LatLng, km: number, angleDeg = Math.random() * 360): LatLng {
  const a = (angleDeg * Math.PI) / 180;
  return {
    latitude: p.latitude + (km / 111) * Math.cos(a),
    longitude: p.longitude + (km / (111 * Math.cos((p.latitude * Math.PI) / 180))) * Math.sin(a),
  };
}
