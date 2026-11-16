# SIIR! — application mobile native (iOS & Android)

React Native + Expo (SDK 58), TypeScript. Une seule app : passager **et** chauffeur, bascule en haut de l'écran ou dans le menu.

## Ce que contient l'app
- **Ouverture animée** : les pièces du logo s'assemblent puis « Siir! » apparaît.
- **Langues** : français, arabe (interface en sens droite-à-gauche), anglais. Langue du téléphone détectée au premier lancement.
- **Inscription** : numéro marocain (+212) → code SMS (simulé en test) → nom.
- **Carte Google Maps** (Android, et iOS dans les builds avec clé) avec **géolocalisation réelle** : position GPS suivie en continu, adresse lisible, bouton « me localiser », invitation à activer la localisation si elle est coupée.
- **Recherche d'adresses partout au Maroc** et **itinéraires réels** :
  - avec clé Google : Places API (New) + Routes API (trafic en temps réel) ;
  - sans clé : OpenStreetMap (Nominatim + OSRM), gratuit.
- **Passager** : 5 catégories (Eco, Confort, Femme, XL, Moto), prix en DH arrondi au dirham, **paiement en espèces uniquement**, suivi du chauffeur sur la carte, code PIN, partage du trajet, numéros d'urgence (19, 177, 15), notation et pourboire.
- **Chauffeur** : **abonnement obligatoire** pour passer en ligne — 180 DH (1 semaine), 350 DH (2 semaines), 650 DH (1 mois) — payé par **carte CMI**, **virement** ou **Wafacash** ; 0 % de commission ; demandes générées autour de sa vraie position ; navigation via Google Maps / Waze ; vérification du PIN ; encaissement en espèces ; gains du jour et de la semaine.

## Tester sur votre téléphone (Expo Go)
1. Installez **Expo Go** depuis le Play Store ou l'App Store.
2. Sur un ordinateur avec Node.js 20+ :
   ```bash
   git clone https://github.com/elhajjami10-prog/SIIR.git
   cd SIIR/mobile
   git checkout claude/siir-vtc-app-morocco-m3bja5
   npm install
   npx expo start --tunnel
   ```
3. Scannez le QR code avec Expo Go (Android) ou l'appareil photo (iPhone).

> Sur iPhone, Expo Go n'inclut pas le SDK Google Maps : la carte Apple s'affiche à la place. Google Maps apparaît sur iPhone dans un build de développement ou de production (voir plus bas).

## Clé Google Maps
1. Dans Google Cloud Console, créez un projet et activez : **Maps SDK for Android**, **Maps SDK for iOS**, **Places API (New)**, **Routes API**.
2. Créez une clé, restreignez-la (applications Android `ma.siir.app` / iOS `ma.siir.app` + ces 4 APIs).
3. Copiez `.env.example` en `.env` et renseignez `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.

## Builds pour les stores (EAS)
```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview   # APK installable directement
npx eas-cli@latest build --platform ios                          # nécessite un compte Apple Developer
```

## À brancher pour la production
| Élément | État actuel | Prochaine étape |
|---|---|---|
| Mise en relation passager ↔ chauffeur | Simulée sur l'appareil | Backend temps réel (ex. Firebase / Supabase ou API Node + WebSocket) |
| Code SMS | Tout code à 4 chiffres accepté | Fournisseur SMS (ex. Twilio, Infobip) |
| Paiement CMI des abonnements | Simulé | Contrat CMI + page de paiement 3-D Secure |
| Virement / Wafacash | Référence générée, validation manuelle (simulée) | Validation par l'admin dans le back-office |
| Coordonnées bancaires SIIR | `À configurer` dans `src/data/catalog.ts` | Renseigner le vrai RIB et le nom du bénéficiaire |

## Structure
```
App.tsx                    navigation entre écrans
src/screens/               Intro, Onboarding, RiderHome, Search, Ride, DriverHome, Subscription, Pages (menu, trajets, gains, langue, villes)
src/components/            GMap (Google Maps), TopBar (bascule passager/chauffeur), ui (logo, boutons, icônes)
src/services/geo.ts        GPS, adresses, recherche de lieux, itinéraires
src/i18n/index.ts          traductions FR / AR / EN
src/data/catalog.ts        villes, catégories, tarifs, formules d'abonnement
src/store/AppStore.tsx     état persistant (compte, abonnement, trajets)
```
