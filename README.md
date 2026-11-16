<p align="center"><img src="assets/siir-logo-light.png" alt="SIIR!" width="420"></p>

# SIIR! — application VTC 2‑en‑1 pour le Maroc

- **`mobile/`** : application **native iOS / Android** (React Native + Expo) — Google Maps, géolocalisation réelle, FR / AR / EN. Voir [`mobile/README.md`](mobile/README.md).
- **Racine** : version web de démonstration (passager, chauffeur, admin) et back-office admin.

**Modèle économique** : les passagers paient la course **en espèces** ; les chauffeurs paient un **abonnement** (180 DH / semaine, 350 DH / 2 semaines, 650 DH / mois) par carte CMI, virement ou Wafacash — 0 % de commission.

Prototype de test : **une seule application** pour les passagers et les chauffeurs (bascule depuis le menu), plus une **console admin**.

## Accès de test
Ouvrez `index.html` (ou la version publiée) avec l'une de ces ancres :

| Profil | Lien |
|---|---|
| Accueil test | `index.html` |
| Passager | `index.html#passager` |
| Chauffeur | `index.html#chauffeur` |
| Admin | `index.html#admin` |

**Scénario temps réel :** ouvrez l'onglet chauffeur et l'onglet passager dans le même navigateur → chauffeur « GO » → passager commande → le chauffeur accepte, arrive, saisit le PIN, termine → l'admin voit tout en direct.

## Fonctionnalités
- **Passager** : recherche de lieux, Maison/Travail, arrêt intermédiaire, 7 catégories (Eco, Confort, Femme, XL, Moto, Black, Colis), prix en DH, majoration, codes promo, paiement en espèces, courses planifiées, suivi live, PIN, chat, appel masqué, centre de sécurité & SOS, partage, notation, pourboire, reçu, historique, parrainage, support, **Siir Drive** (autopartage à la minute).
- **Chauffeur** : en ligne/hors ligne, carte de chaleur, demandes avec compte à rebours, acceptation auto, mode destination, navigation, PIN, abonnement obligatoire (CMI / virement / Wafacash), gains (jour/semaine) sans commission, documents, véhicule, défis & bonus.
- **Admin** : KPI, carte en direct, courses, chauffeurs (validation/suspension), passagers, **abonnements** (validation des virements / Wafacash, revenus), tarification par catégorie, promotions, zones & majoration, support/SOS, villes.

## Structure
- `src/siir.html` — source de l'application (HTML/CSS/JS, sans dépendance)
- `build.sh` — génère `index.html` autonome
- `assets/` — logo vectorisé HD (`siir-mark.svg`, `siir-logo-*.svg/png`, icône 512 px), logo original
- `.github/workflows/pages.yml` — déploiement GitHub Pages

## Limites du prototype (à brancher en production)
Données de démo en `localStorage` (synchronisées entre onglets d'un même navigateur, pas entre appareils) ; carte de Casablanca stylisée ; paiement carte (CMI), SMS/OTP, appels relais, notifications push et backend temps réel à intégrer.
