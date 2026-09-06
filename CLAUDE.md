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

**Les cibles de séance sont en watts, les décisions en bpm.** Constaté le
5 septembre : la notation `z2`, `z3` du `description` désigne des **zones de
puissance**, calculées sur la FTP. La préférence initiale pour des cibles en
bpm tombe, et la répartition qui s'installe est cohérente — la puissance sert
au *contenu* des séances d'intérieur, où le capteur est réel ; le cardio sert
aux *décisions*, où le vélo électrique n'a que lui.

Deux conséquences. Les séances existantes sont calibrées sur une FTP de 221 W
posée volontairement basse, leurs cibles sont donc un peu douces — l'effet
recherché pour une reprise. Et le jour où le test de la phase 5 corrigera la
FTP, **toutes les cibles se recalibrent d'un coup**, sans retoucher une seule
séance.

### Ce que l'API renvoie pour une séance planifiée

**Constaté le 5 septembre 2026**, la réserve est levée. Le calendrier se lit
sur `/events`, qui renvoie une soixantaine de champs par entrée. Une séance
porte `category: "WORKOUT"`, un `name`, un `type` d'activité (`Ride`…), des
bornes `start_date_local` et `end_date_local`, un `moving_time`, une charge
prévue `icu_training_load`, et les projections `icu_atl` / `icu_ctl` — à
afficher, jamais à recalculer.

**La structure de la séance arrive en texte**, dans `description`, une ligne
par bloc en notation de zones (`- 5m z2`). Makigawa la relaie telle quelle :
elle ne la compose pas, ne la découpe pas, ne la traduit pas.

Le calendrier porte aussi des **repères qui ne sont pas des séances** — un
`SEASON_START` a été constaté. Filtrer sur `category` plutôt que supposer
que tout événement du calendrier est une chose à faire.


## Constantes athlète

| Donnée | Valeur | Statut |
|---|---|---|
| Poids | 80 kg | confirmé |
| FCmax | 202 bpm | relevée par intervals.icu sur l'historique |
| FTP | 221 W | sous les 240 W estimés (eFTP : 205 W), **non confirmée par test** |
| LTHR (FC seuil) | 183 bpm | valeur d'intervals.icu, **origine à confirmer** |
| `T_effort` | 150 bpm (74 % FCmax, 82 % LTHR) | seuil de travail |
| `T_haut` | 175 bpm (87 % FCmax, 96 % LTHR) | seuil haut |

**Aucune règle métier ne doit dépendre de la FTP.** Les seuils sont en
bpm, délibérément : la FTP est incertaine, le cardio est mesuré.

**Les zones d'intervals.icu ne portent aucune règle non plus.** La
classification des journées compare des bpm bruts à 150 et 175, jamais un
nom de zone.

Cette indépendance vient de servir. Avec la LTHR de 183 bpm affichée par
intervals.icu, 150 bpm tombe en bas de zone **aérobie** (Z2, 148-162) et non
en bas de tempo (163-171) comme le supposait la phase 2 ; 175 bpm tombe en
Z4 SubThreshold. Le contrôle de cohérence prévu échoue donc, **sans qu'aucune
règle ne bouge**. La justification « 150 bpm = bas de zone tempo » ne tient
plus ; le seuil, lui, reste à 150 bpm et garde son rôle : il sépare un trajet
électrique (~129 bpm) d'un aller-retour musculaire (~160 bpm).

Le contrôle qui vaut est celui de la phase 6, sur des journées réelles : un
aller-retour électrique doit sortir en légère, un aller-retour musculaire en
chargée. Tant qu'il n'a pas été fait, ne pas déplacer les seuils.

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

**Spécifiées dans `docs/section-5-regles-adaptation.md`**, qui fait foi. Le
résumé qui figurait ici décrivait une esquisse abandonnée le 5 septembre 2026 —
notamment une classification en minutes au-dessus de 150 bpm, et un arbitrage
de semaine chargée qui supposait un volume de séances que l'athlète n'a pas.
Implémentées dans `src/rules/`.

En bref :

- **Une échelle de charge à cinq niveaux**, en charges d'intervals.icu, qui
  situe aussi bien une séance seule qu'une journée entière. Ses bornes sont
  provisoires et se relèvent en phase 6.
- **Une question unique**, posée séance par séance : aujourd'hui est-il un bon
  jour pour celle-ci ? Quatre conditions y répondent non.
- **Trois issues quand c'est non** : décaler de deux jours au plus, sinon
  réduire de moitié, sinon laisser tomber. Aucune ne produit de dette.
- **Les règles n'agissent que sur les séances de qualité**, à partir du
  niveau 3. Les trajets n'en sont jamais, mais leur charge compte toujours.
- **L'app propose, l'athlète confirme.** Aucune écriture sans un geste de sa
  part — ce qui fait du moteur une fonction pure.

Ne pas modifier ces règles sans le signaler explicitement, et modifier le
document avant le code.

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
- **Réserve CORS levée le 5 septembre 2026.** intervals.icu accepte les
  appels directs depuis un navigateur : le test de connexion a rapatrié les
  activités depuis la page. Aucun relais n'est nécessaire, l'app reste un
  client purement local. Le contrôle préalable du navigateur est passé, ce
  qui est le point dur — l'en-tête `Authorization` force ce contrôle. À
  reconstater tout de même au moment de l'écriture : créer ou modifier un
  événement emploie d'autres méthodes HTTP, donc un contrôle distinct.
  **Reconstaté le 6 septembre : l'écriture passe aussi.** `POST`, `PUT` et
  `DELETE` franchissent le contrôle préalable. L'architecture sans serveur
  tient de bout en bout.

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

1. ~~API intervals.icu **en lecture seule** d'abord : lister les activités,
   lire le calendrier.~~ **Fait.**
2. ~~Écriture ensuite : créer, modifier, supprimer un événement de test.~~
   **Fait**, et l'échafaudage de test retiré le 6 septembre : l'app écrit
   maintenant pour de vrai.
3. ~~Règles d'adaptation, avec tests unitaires sur des journées réelles.~~
   **Fait**, dans `src/rules/`.
4. ~~Interface en dernier.~~ **Fait** le 6 septembre.

Les quatre étapes sont franchies. La suite se joue en phase 6 : observer les
règles sur des semaines réelles, et corriger les bornes plutôt que le code.

### Ce que l'app ne mesure pas encore

**Le pic à 175 bpm n'est pas mesuré.** Le E.1 fait basculer une journée en
chargée dès deux minutes cumulées au-dessus de 175 bpm ; le connaître demande
la courbe de fréquence cardiaque de chaque activité, que l'app ne rapatrie
pas. Le déduire des zones d'intervals.icu est exclu — les règles comparent des
bpm bruts, jamais un nom de zone.

`peakSeconds` vaut donc zéro, et une journée pèse par sa charge seule. C'est
une sous-estimation, jamais une sur-estimation : l'app peut proposer une
séance là où le pic l'aurait retenue, elle n'en retirera jamais une à tort.

## État de la mise en place

> Dernière mise à jour : 5 septembre 2026. Détail des phases dans
> `docs/mise-en-place-etapes.md`.

- [x] Compte intervals.icu créé
- [x] Garmin connecté (OAuth autorisé)
- [x] Historique importé — confirmé, c'est la base des calculs d'intervals.icu
- [x] Profil athlète renseigné (poids, FCmax, FTP, LTHR, zones)
- [x] Vélo électrique configuré, charge confirmée depuis le cardio
- [x] Données vérifiées, pas de doublons
- [x] Zwift connecté — doublon avec Garmin à surveiller à la première séance
- [ ] Test FTP fait
- [x] Clé API générée, connexion établie depuis le téléphone
- [x] Écriture dans le calendrier confirmée depuis le navigateur — le
      contrôle CORS des méthodes d'écriture passe, l'app reste sans serveur
- [x] Interface construite : lecture de forme, propositions, confirmation

## Conventions

- Français dans la documentation et les commentaires métier.
- Anglais pour le code.
- Un seul utilisateur : ne pas introduire d'abstraction multi-athlète.
- Si un choix technique n'est pas tranché dans ce fichier, demander
  plutôt que supposer.
