export type LatLng = { latitude: number; longitude: number };

/** Villes couvertes : le service est actif partout au Maroc, Casablanca est la ville de lancement. */
export const CITIES: { id: string; fr: string; ar: string; en: string; center: LatLng; launch?: boolean }[] = [
  { id: 'casablanca', fr: 'Casablanca', ar: 'الدار البيضاء', en: 'Casablanca', center: { latitude: 33.5731, longitude: -7.5898 }, launch: true },
  { id: 'rabat', fr: 'Rabat', ar: 'الرباط', en: 'Rabat', center: { latitude: 34.0209, longitude: -6.8416 } },
  { id: 'marrakech', fr: 'Marrakech', ar: 'مراكش', en: 'Marrakesh', center: { latitude: 31.6295, longitude: -7.9811 } },
  { id: 'tanger', fr: 'Tanger', ar: 'طنجة', en: 'Tangier', center: { latitude: 35.7595, longitude: -5.834 } },
  { id: 'fes', fr: 'Fès', ar: 'فاس', en: 'Fez', center: { latitude: 34.0181, longitude: -5.0078 } },
  { id: 'agadir', fr: 'Agadir', ar: 'أكادير', en: 'Agadir', center: { latitude: 30.4278, longitude: -9.5981 } },
  { id: 'meknes', fr: 'Meknès', ar: 'مكناس', en: 'Meknes', center: { latitude: 33.8935, longitude: -5.5473 } },
  { id: 'oujda', fr: 'Oujda', ar: 'وجدة', en: 'Oujda', center: { latitude: 34.6814, longitude: -1.9086 } },
  { id: 'kenitra', fr: 'Kénitra', ar: 'القنيطرة', en: 'Kenitra', center: { latitude: 34.261, longitude: -6.5802 } },
  { id: 'tetouan', fr: 'Tétouan', ar: 'تطوان', en: 'Tetouan', center: { latitude: 35.5889, longitude: -5.3626 } },
  { id: 'eljadida', fr: 'El Jadida', ar: 'الجديدة', en: 'El Jadida', center: { latitude: 33.2316, longitude: -8.5007 } },
  { id: 'nador', fr: 'Nador', ar: 'الناظور', en: 'Nador', center: { latitude: 35.1681, longitude: -2.9335 } },
  { id: 'benimellal', fr: 'Béni Mellal', ar: 'بني ملال', en: 'Beni Mellal', center: { latitude: 32.3373, longitude: -6.3498 } },
  { id: 'safi', fr: 'Safi', ar: 'آسفي', en: 'Safi', center: { latitude: 32.2994, longitude: -9.2372 } },
  { id: 'essaouira', fr: 'Essaouira', ar: 'الصويرة', en: 'Essaouira', center: { latitude: 31.5085, longitude: -9.7595 } },
  { id: 'ouarzazate', fr: 'Ouarzazate', ar: 'ورزازات', en: 'Ouarzazate', center: { latitude: 30.9335, longitude: -6.937 } },
  { id: 'laayoune', fr: 'Laâyoune', ar: 'العيون', en: 'Laayoune', center: { latitude: 27.1253, longitude: -13.1625 } },
  { id: 'dakhla', fr: 'Dakhla', ar: 'الداخلة', en: 'Dakhla', center: { latitude: 23.6848, longitude: -15.9579 } },
];
export const DEFAULT_CENTER = CITIES[0].center;

export type CatId = 'eco' | 'comfort' | 'femme' | 'xl' | 'moto';
/** Tarifs passager (payés en espèces au chauffeur), arrondis au dirham. */
export const CATEGORIES: { id: CatId; base: number; km: number; min: number; minFare: number; eta: number; seats: number; color: string }[] = [
  { id: 'eco', base: 7, km: 3.4, min: 0.45, minFare: 15, eta: 3, seats: 4, color: '#14A870' },
  { id: 'comfort', base: 9, km: 4.4, min: 0.6, minFare: 22, eta: 5, seats: 4, color: '#1E6FD9' },
  { id: 'femme', base: 8, km: 3.8, min: 0.5, minFare: 18, eta: 6, seats: 4, color: '#C2447A' },
  { id: 'xl', base: 12, km: 5.6, min: 0.75, minFare: 30, eta: 8, seats: 6, color: '#D98A0B' },
  { id: 'moto', base: 4, km: 2.1, min: 0.25, minFare: 10, eta: 2, seats: 1, color: '#B81D3A' },
];

export function fare(catId: CatId, km: number, minutes: number) {
  const c = CATEGORIES.find(x => x.id === catId)!;
  return Math.round(Math.max(c.minFare, c.base + c.km * km + c.min * minutes));
}

export type PlanId = 'week' | 'twoWeeks' | 'month';
/** Abonnements chauffeur : aucune commission sur les courses. */
export const PLANS: { id: PlanId; price: number; days: number; badge?: 'popular' | 'best' }[] = [
  { id: 'week', price: 180, days: 7 },
  { id: 'twoWeeks', price: 350, days: 14, badge: 'popular' },
  { id: 'month', price: 650, days: 30, badge: 'best' },
];

export type SubMethod = 'cmi' | 'virement' | 'wafacash';

/** Coordonnées de paiement de l'entreprise : À REMPLACER par les vraies avant la mise en production. */
export const COMPANY_PAYMENT = {
  beneficiary: 'SIIR SARL',
  bank: 'À configurer',
  rib: '000 000 0000000000000000 00',
  wafacashName: 'SIIR SARL',
};

export const DRIVER_DEMO = {
  name: 'Youssef El Amrani',
  car: 'Dacia Logan',
  color: { fr: 'Blanc', ar: 'أبيض', en: 'White' },
  plate: ['48213', 'أ', '6'],
  rating: 4.93,
};

export const RIDER_DEMO_NAMES = ['Salma Kettani', 'Yassine Amrani', 'Ghita Bennis', 'Reda Lazrak', 'Houda Tahiri', 'Adam Benkirane'];
export const DRIVER_POOL = [
  { name: 'Fatima Zahra Benali', car: 'Toyota Corolla', plate: ['20931', 'ب', '6'], rating: 4.97 },
  { name: 'Hamza Ouazzani', car: 'Hyundai Accent', plate: ['66120', 'أ', '6'], rating: 4.81 },
  { name: 'Omar Tazi', car: 'Skoda Octavia', plate: ['77045', 'هـ', '6'], rating: 4.88 },
  { name: 'Khadija Idrissi', car: 'Peugeot 301', plate: ['30418', 'د', '6'], rating: 4.95 },
  { name: 'Anas Chraibi', car: 'Yamaha NMAX', plate: ['4512', 'ب', '6'], rating: 4.86 },
];
