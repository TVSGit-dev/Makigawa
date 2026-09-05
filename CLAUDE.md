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
- **Pas d'éditeur de séance.** Le contenu des séances se crée dans
  intervals.icu, qui a déjà l'outil pour ça.

## Répartition des rôles

Décision du 5 septembre 2026, à la découverte de l'éditeur de séances
d'intervals.icu.

| intervals.icu | Makigawa |
|---|---|
| Le **quoi** : structure d'une séance, intervalles, cibles | Le **quand** et le **si** |
| Le calendrier, comme stockage de référence | Décale, dégrade, abandonne |
| Fitness / Fatigue / Forme | Les affiche, ne les recalcule pas |

Les séances sont **créées et stockées dans intervals.icu**, jamais définies
dans Makigawa. L'app lit ce calendrier, applique les règles d'adaptation et
réécrit les événements. Elle décide du moment, pas du contenu.

Deux conséquences immédiates : aucun éditeur de séance à construire, et la
bibliothèque peut se remplir à la main dès maintenant, sans attendre une
ligne de code.

Préférer des **cibles en bpm** plutôt qu'en watts à la création d'une
séance, pour la même raison que les seuils : la FTP n'est pas confirmée.

**Réserve** : la façon dont l'API représente une séance planifiée reste à
constater. C'est l'objet de la phase 6 de `docs/mise-en-place-etapes.md` —
poser quelques séances à la main, puis regarder ce que l'API en dit.

## Constantes athlète

| Donnée | Valeur | Statut |
|---|---|---|
| Poids | 80 kg | confirmé |
| FCmax | 200 bpm | confirmé |
| FTP | 221 W | posée à la main le 5/09, **non confirmée par test** |
| LTHR (FC seuil) | 168 bpm | posée à la main, bas de la fourchette 168-172 |
| `T_effort` | 150 bpm (75 % FCmax) | seuil de travail |
| `T_haut` | 175 bpm (87 % FCmax) | seuil haut |

**Aucune règle métier ne doit dépendre de la FTP.** Les seuils sont en
bpm, délibérément : la FTP est incertaine, le cardio est mesuré.

**Les zones d'intervals.icu ne portent aucune règle non plus.** La
classification des journées compare des bpm bruts à 150 et 175, jamais un
nom de zone. Que 150 bpm tombe en bas de zone tempo (89 % d'une LTHR à 168)
est un contrôle de cohérence, pas une dépendance : le jour où intervals.icu
ré-estime la LTHR sur l'historique et déplace les zones, aucune règle ne
bouge.

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

1. **Ignorer toute donnée de puissance sur les activités de type
   `EBikeRide`** : moyenne (`average_watts`), normalisée / pondérée, pic,
   courbe, et tout champ à venir. Il n'y a pas de capteur de puissance
   sur ce vélo (`has_device_watts: false`). Toute valeur de puissance y
   est une estimation fausse, quelle que soit la façon dont elle est
   présentée. **Exclure par principe, jamais par nom de champ** : ne
   nommer qu'`average_watts` laisserait passer la puissance normalisée,
   qui est justement celle affichée par défaut.
2. La charge de ces trajets vient du **cardio**, telle que calculée par
   intervals.icu. Ne pas appliquer de coefficient correcteur maison.

La puissance n'est exploitable que sur `Ride` (capteur présent) et
`VirtualRide` (Zwift).

**Moyenne ou normalisée : toujours préciser laquelle.** Pour une même
sortie, intervals.icu affiche par défaut la puissance **normalisée**,
systématiquement plus élevée que la moyenne arithmétique. Elle pondère les
à-coups, qui coûtent plus cher physiologiquement qu'un effort régulier de
même moyenne — d'où un écart d'autant plus grand que le parcours est haché.
Sur le Hard Commute de référence : **220 W normalisés**, contre ~182 W
relevés dans la reconstitution initiale. Les deux nombres décrivent la même
sortie ; les comparer entre eux n'a pas de sens.

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

**Décision du 5 septembre 2026 : pas de serveur.** L'app est un client
local à un seul utilisateur ; la clé est saisie sur le téléphone. Ceci
remplace la consigne initiale « elle vit côté serveur », qui imposerait
un hébergeur, des secrets à gérer et une authentification pour ne pas
exposer les données — hors de proportion pour un usage personnel.

- **La clé API intervals.icu ne doit jamais apparaître dans le code.**
  Ni en dur, ni dans le bundle, ni derrière un préfixe `VITE_` : ce
  préfixe l'embarquerait dans le JavaScript servi au navigateur.
- Elle est saisie par l'athlète dans l'app et conservée dans le
  `localStorage` de son téléphone. Elle n'est transmise qu'à
  intervals.icu, jamais à un tiers.
- Ne jamais la committer, même en exemple. Utiliser `.env.example`.
- **Réserve non levée** : si intervals.icu refuse les appels directs
  depuis un navigateur (politique CORS), un relais deviendra nécessaire.
  Il devra rester sans état et sans secret — le téléphone continuerait
  d'envoyer la clé, le relais ne ferait que transmettre.

## Priorités fonctionnelles

Dans l'ordre :

1. Vue mobile du calendrier — aujourd'hui et cette semaine.
2. Encodage rapide d'une séance faite / dégradée / manquée, en quelques taps.
3. Replanification automatique selon les règles ci-dessus.
4. Distinction visuelle claire électrique / musculaire.

Secondaire : vue de charge sur les dernières semaines. La bibliothèque de
séances courtes (15-30 min) se constitue dans intervals.icu — c'est du
contenu, pas du code, et elle ne bloque rien.

## Ordre de développement

1. API intervals.icu **en lecture seule** d'abord : lister les activités,
   lire le calendrier.
2. Écriture ensuite : créer, modifier, supprimer un événement de test.
3. Règles d'adaptation, avec tests unitaires sur des journées réelles.
4. Interface en dernier.

Ne pas commencer l'interface avant que les règles soient testées.

## État de la mise en place

> Dernière mise à jour : 5 septembre 2026. Détail des phases dans
> `docs/mise-en-place-etapes.md`.

- [x] Compte intervals.icu créé
- [x] Garmin connecté (OAuth autorisé)
- [ ] Historique importé, date de reprise reculée — **non vérifié**
- [x] Profil athlète renseigné (poids, FCmax, FTP, LTHR, zones)
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
