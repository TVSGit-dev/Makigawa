# CLAUDE.md

Contexte permanent du projet. À lire avant toute modification.

## Le projet en une phrase

Interface mobile personnelle (PWA, un seul utilisateur) posée au-dessus
d'**intervals.icu**, pour consulter et encoder ses séances sans ouvrir
le site web.

## Ce qu'on ne fait pas

- **Aucun calcul de charge maison.** Fitness / Fatigue / Forme viennent
  d'intervals.icu. On les affiche, on ne les recalcule pas.
- Pas de multi-utilisateur, pas de comptes, pas de monétisation.
- Pas d'analyse fine de puissance.
- Pas de modèle prédictif. Les règles d'adaptation sont déterministes.

## Constantes athlète

| Donnée | Valeur | Statut |
|---|---|---|
| Poids | 80 kg | confirmé |
| FCmax | 200 bpm | confirmé |
| FTP | ~240 W | estimation Garmin, **non confirmée par test** |
| `T_effort` | 150 bpm (75 % FCmax) | seuil de travail |
| `T_haut` | 175 bpm (87 % FCmax) | seuil haut |

**Aucune règle métier ne doit dépendre de la FTP.** Les seuils sont en
bpm, délibérément : la FTP est incertaine, le cardio est mesuré.

## Sources de données

- **Garmin Connect** → intervals.icu, en direct. Sorties extérieures.
- **Zwift** → intervals.icu, en direct. Garmin ne relaie pas Zwift
  vers les tiers.
- **Strava : volontairement exclu.** Ne pas le rajouter. Il estime une
  puissance fausse sur les trajets électriques (306 W relevés là où
  l'athlète en produit ~133) et crée des doublons avec Garmin.

## Règle critique — vélo électrique

L'athlète fait 6-7 trajets par semaine, majoritairement en vélo
électrique. Ces trajets portent **60 à 100 % de sa charge hebdomadaire**.

Deux conséquences non négociables :

1. **Ignorer `average_watts` et toute donnée de puissance sur les
   activités de type `EBikeRide`.** Il n'y a pas de capteur de puissance
   sur ce vélo (`has_device_watts: false`). Toute valeur de puissance y
   est une estimation fausse.
2. La charge de ces trajets vient du **cardio**, telle que calculée par
   intervals.icu. Ne pas appliquer de coefficient correcteur maison.

La puissance n'est exploitable que sur `Ride` (capteur présent) et
`VirtualRide` (Zwift).

## Règles d'adaptation

Spécifiées dans `docs/section-5-regles-adaptation.md`. Résumé :

- **Classification des journées** par temps cumulé au-dessus de 150 bpm :
  légère (< 10 min), moyenne (10-30 min), chargée (> 30 min ou tout
  passage > 175 bpm).
- **Séance manquée** : décalée, sinon dégradée, sinon abandonnée.
  Jamais ajoutée à une autre séance. Pas de dette.
- **Arbitrage** semaine chargée : on retire mobilité, puis renfo,
  puis sortie.
- **Anti-empilement** : pas de renfo jambes sur une journée chargée.
  Jamais deux journées chargées consécutives planifiées.
- **Reprise** : 14 jours sans séance N1/N2 → volume réduit, +10 %/semaine
  max pendant 3 semaines. Les trajets quotidiens ne remettent pas le
  compteur à zéro.

Ne pas modifier ces règles sans le signaler explicitement.

## Contraintes d'interface

L'application doit être **tolérante, pas culpabilisante**. C'est une
contrainte technique, pas une intention :

- Pas de série ni de compteur de jours consécutifs.
- Pas de dette affichée, pas de « séance en retard ».
- Une séance abandonnée disparaît, elle ne laisse pas de trace rouge.

Contexte : deux enfants en bas âge, disponibilité irrégulière, aucun
objectif de compétition.

## Sécurité

- **La clé API intervals.icu ne doit jamais apparaître dans le front.**
  Elle vit côté serveur : fonction serverless, ou secret de dépôt pour
  le job planifié.
- Ne jamais la committer, même en exemple. Utiliser `.env.example`.

## Priorités fonctionnelles

Dans l'ordre :

1. Vue mobile du calendrier — aujourd'hui et cette semaine.
2. Encodage rapide d'une séance faite / dégradée / manquée, en quelques taps.
3. Replanification automatique selon les règles ci-dessus.
4. Distinction visuelle claire électrique / musculaire.

Secondaire : bibliothèque de séances courtes (15-30 min), vue de charge
sur les dernières semaines.

## Ordre de développement

1. API intervals.icu **en lecture seule** d'abord : lister les activités,
   lire le calendrier.
2. Écriture ensuite : créer, modifier, supprimer un événement de test.
3. Règles d'adaptation, avec tests unitaires sur des journées réelles.
4. Interface en dernier.

Ne pas commencer l'interface avant que les règles soient testées.

## État de la mise en place

> **À mettre à jour.** Voir `docs/mise-en-place-etapes.md`.

- [ ] Compte intervals.icu créé
- [ ] Garmin connecté, historique importé
- [ ] Profil athlète renseigné (poids, FCmax, zones)
- [ ] Vélo électrique configuré à 100 % Fitness / Fatigue
- [ ] Données vérifiées, pas de doublons
- [ ] Zwift connecté
- [ ] Test FTP fait
- [ ] Clé API générée

## Conventions

- Français dans la documentation et les commentaires métier.
- Anglais pour le code.
- Un seul utilisateur : ne pas introduire d'abstraction multi-athlète.
- Si un choix technique n'est pas tranché dans ce fichier, demander
  plutôt que supposer.
