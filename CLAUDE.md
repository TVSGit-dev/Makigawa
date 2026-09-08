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
- **Pas d'éditeur de séance à la main.** L'athlète ne compose pas une séance
  bloc par bloc dans Makigawa : intervals.icu a déjà l'outil pour ça.
  Makigawa, elle, **assemble** des séances à partir de motifs — voir la
  frontière ci-dessous, révisée le 6 septembre 2026.

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

> **Révisé le 7 septembre 2026 (E.19).** L'app **n'écrit plus rien**, sauf
> supprimer. Le plan des deux prochaines semaines vit dans Makigawa ;
> intervals.icu tient la vérité de ce qui a été fait. Le tableau ci-dessus
> reste vrai sur le fond — le *quoi* vient d'intervals.icu, le *quand* et le
> *si* viennent de Makigawa — mais Makigawa ne le pousse plus nulle part.

### Ce que le plan dit, et dans quelle unité

Révisé le 7 septembre 2026 (E.23). Le plan ne donne plus une recette à recopier
mais **une intention** : un style, une dose, et la forme des blocs — assez pour
reconnaître une séance équivalente dans le catalogue de Zwift, pas assez pour la
retaper.

- **Les watts s'affichent, ils ne se décident pas.** Un pourcentage résolu par
  la FTP d'intervals.icu se lit dans l'unité de Zwift ; la décision reste le
  pourcentage, donc le test FTP recalibre tout sans qu'une séance ne bouge.
- **La charge d'une sortie ne s'estime pas, elle se lit** dans l'historique de
  l'athlète : « tes sorties de cette distance ont pesé 190 à 215 ». Une formule
  donnerait un nombre plausible ; ses propres sorties donnent le vrai.
- **La dose se dit à la semaine et aux jours qui restent.** L'objectif est la
  moyenne des trois dernières semaines complètes plus 10 % — le plafond du E.20
  gardant le dernier mot. Une journée sans rien ne crée aucune dette : le reste
  se répartit sur les jours restants.
- **La semaine compte ce qui est prévu, pas seulement ce qui est fait** (E.28).
  Les trajets marqués et les séances posées entrent dans la jauge dès qu'on les
  marque ; le passé, lui, ne se projette pas. Une **proposition** de Makigawa
  n'y entre jamais : elle n'engage à rien, et c'est justement le reste à placer
  qu'elle vient remplir.

### La frontière, telle que l'athlète l'a formulée

> **Tous les chiffres viennent d'intervals.icu, l'organisation vient de
> Makigawa.** — 6 septembre 2026

C'est la formulation qui fait foi, et elle remplace « les séances sont
créées et stockées dans intervals.icu, jamais définies dans Makigawa ».
Makigawa **compose** désormais des séances. Ce qui n'a pas bougé, c'est
d'où viennent les nombres.

| Ce qui vient d'intervals.icu | Ce qui vient de Makigawa |
|---|---|
| La FTP, les zones, la LTHR, la FCmax | Le choix de la famille de séance |
| Les intensités, écrites en **% de FTP** et jamais en watts | Combien de blocs, combien de répétitions |
| La charge, calculée depuis la structure | La longueur de l'échauffement |
| La forme, la fatigue, la fraîcheur | Le jour, et la progression d'une semaine à l'autre |

Deux garde-fous en découlent, tenus par des tests :

- **Aucune intensité n'est jamais écrite en watts.** Une cible en pourcentage
  est résolue par la FTP d'intervals.icu, donc elle suit le test FTP ; une
  cible en watts la figerait.
- **Aucune charge n'est envoyée** pour une séance structurée. intervals.icu la
  calcule depuis les blocs. La seule exception est la sortie ouverte, qui n'a
  pas de blocs — sa charge visée est tout ce qui la définit.

Les motifs eux-mêmes sont **relevés sur les séances réelles de l'athlète**,
dans `src/workouts/families.ts` : sweet spot en over-under, seuil en
over-under, 30/30, 30/15, navette lactate.

**Cinq familles y ont été ajoutées**, et toujours pour la même raison : un trou
dans le catalogue empêchait une règle de répondre. Endurance et tempo d'abord,
parce qu'un catalogue qui ne contient que du seuil et au-dessus est
inutilisable une semaine de décharge. Puis, le 8 septembre (E.25), après
comparaison avec les catalogues de TrainerRoad et de Zwift : **récupération
active**, parce que rien n'existait sous l'endurance ; **seuil continu**, parce
que le seuil n'existait qu'en over-under ; **VO2 max long**, parce que trente
secondes tiennent le cœur haut sans installer la consommation maximale.

La limite tient : **on ajoute une famille quand un trou bloque une règle,
jamais pour la variété.** Les sprints neuromusculaires ne franchissent pas ce
test et ne sont pas dans le catalogue.

**La récupération est la seule zone dont on ne monte pas.** Faire plus long à
50 % ne prouve rien ; elle existe pour que le plan ait un mot à dire les jours
où il ne faut rien demander.

**Les quatre styles de l'athlète**, relevés le 6 septembre, organisent
l'interface :

1. **Sortie longue** — dehors, sans structure, une charge visée.
2. **Séance Zwift** — 30 à 75 min, composée par Makigawa, pour tout donner.
3. **Zwift libre** — sur le home-trainer, sans consigne, une charge visée.
4. **Trajets** — 17 km et 200 m D+ entre Stockel et Wavre, aller et retour.
   Ils ne se posent pas : ils arrivent de Garmin. Leur charge compte toujours.

**La sortie ouverte est la seule séance sans structure que Makigawa crée** —
décision du 6 septembre 2026, spécifiée en E.8. *Dormante depuis le
7 septembre : l'app la propose, elle ne la crée plus (E.19).* C'est une séance extérieure sans structure,
qui ne porte qu'une charge visée. La frontière tient parce qu'**une sortie
ouverte n'a pas de contenu** : ni bloc, ni zone, ni ordre. L'app pose une
intention, elle ne compose pas une séance. Dès qu'il faut de la structure, elle
vient d'intervals.icu comme le reste.

**Poser une séance est du ressort de Makigawa** — décision du 6 septembre 2026,
**abandonnée le 7** (E.19) : l'app dit quel jour conviendrait, elle ne recopie
plus rien.
intervals.icu range les séances dans une bibliothèque, sans date ; l'app la lit
et propose les jours qui conviennent, puis recopie la séance choisie sur le
jour choisi. La structure est recopiée telle quelle. C'est la même frontière
qu'ailleurs : le contenu vient d'intervals.icu, le moment vient de Makigawa —
et poser d'avance vaut mieux que refuser après coup.

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
| FTP | 221 W dans le profil | **intervals.icu l'estime en continu, et l'app lit cette estimation** (E.24) ; Garmin donnait 240 W au 6 septembre 2026 — non confirmée par test |
| LTHR (FC seuil) | 183 bpm | valeur d'intervals.icu, **origine à confirmer** |
| `T_effort` | 150 bpm (74 % FCmax, 82 % LTHR) | seuil de travail — **sépare le facile du modéré depuis le E.29** ; il n'était employé nulle part avant |
| `T_haut` | 175 bpm (87 % FCmax, 96 % LTHR) | seuil haut |

**Aucune règle métier ne doit dépendre de la FTP.** Les seuils sont en
bpm, délibérément : la FTP est incertaine, le cardio est mesuré.

**Ce que la courbe Garmin apporte, et ce qu'elle ne règle pas.** Relevée le
6 septembre 2026 sur douze mois : 2,5 W/kg en septembre 2025, un creux à
2,25 en novembre, puis une montée régulière jusqu'à **3,0 W/kg**, stable
depuis juillet. À 80 kg cela fait **240 W**, soit 8 % au-dessus du profil.

Cela lève la contradiction apparente avec les 175 W de meilleure puissance
de 20 minutes relevés en juin et juillet : ces sorties n'étaient pas des
tests, donc ce chiffre est un **plancher observé**, pas une estimation. Il ne
disait rien de ce que l'athlète peut produire en cherchant.

Une réserve subsiste : on ne sait pas si Garmin exclut les trajets
électriques de son estimation. La règle critique du projet les exclut par
principe ; rien ne garantit que Garmin fasse pareil. **Le test de la phase 5
reste ce qui tranche**, et il tranche d'autant plus vite que les séances
composées sont écrites en pourcentage de FTP : corriger le profil les
recalibre toutes d'un coup.

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
- **Une proposition se refuse**, et le plan se recalcule en entier autour du
  refus : « pas celle-ci » écarte la famille, « plus tard » repousse le jour.
  Ni l'un ni l'autre ne crée de dette, et rien n'en part dans intervals.icu.
- **L'app relit ce qui a été fait** : elle apparie une séance prévue à
  l'activité qui l'a réalisée, d'abord par le lien d'intervals.icu. Elle
  n'affiche que les séances tenues — jamais les manquées, qui ne servent qu'en
  interne.
- **Elle se souvient de ce qu'elle a proposé**, faute de pouvoir l'écrire
  (E.22). Une proposition est tenue quand une activité du même jour a duré au
  moins 85 % du temps proposé et pèse une charge de qualité. C'est la **seule
  sur-estimation** que le projet accepte, et elle est bornée : un cran, sous le
  plafond du E.20, effacé au bout de six semaines.
- **Un niveau par zone**, lu sur la plus grosse séance qu'il a tenue dans cette
  zone en six semaines. La séance suivante vise un cran au-dessus. Rien ne fait
  descendre un niveau sauf le temps.
- **La forme ne monte que de 10 % par semaine.** Quand elle monte déjà aussi
  vite, le plan tient son niveau au lieu de le monter — on ne progresse pas en
  ajoutant à ce qui monte déjà (E.20).
- **Les trajets se marquent d'avance, ils ne se recommandent pas.** Une marque
  par jour — électrique, musculaire, ou rien — parce que l'aller et le retour
  se font d'office de la même manière. Le plan s'écarte des jours musculaires,
  qui sont des journées chargées. L'app ne dit plus comment aller au travail :
  elle ne s'intéresse qu'à ce que la journée a donné (E.17, révisé le
  7 septembre).
- **Le cycle 2:1 se propose enfin.** Après deux semaines qui ont porté une
  séance tenue, l'app propose d'alléger : une seule séance, moitié moins de
  travail, la même intensité. Rien de retiré ne compte comme manqué.
- **Une proposition dit ce qu'elle vaut** : l'écart entre le niveau tenu dans
  la zone et celui qu'elle vise, en un mot — à ta portée, productive, un pari,
  inconnu (E.26). C'est une soustraction entre deux nombres déjà connus, et
  elle sert au refus, qui se faisait sinon à l'aveugle. « Inconnu » n'est pas
  un avertissement : une zone vierge est normale au début.
- **La variabilité du matin est la sixième condition du E.2** (E.30). Les cinq
  autres regardent toutes en arrière ; celle-ci est le seul signal du jour.
  Moyenne glissante sur sept jours du logarithme du rMSSD, comparée à une
  demi-mesure de dispersion sous la ligne de base des vingt-huit dernières.
  Elle ne parle qu'au-dessous — une bonne nuit ne donne aucune permission de
  plus — et elle ferme l'intensité, pas la journée : le plan redescend sur
  l'endurance et la récupération au lieu de disparaître. **Muette tant que la
  base n'est pas faite**, soit une vingtaine de nuits mesurées.
- **La répartition d'intensité se lit, elle ne se vise pas** (E.29). Trois
  bandes — sous 150 bpm, entre 150 et 175, au-dessus — comptées sur les courbes
  que l'app télécharge déjà. La recherche ne tranche pas entre polarisé et
  pyramidal, donc l'app n'affiche aucun objectif : elle montre le piège réel du
  cycliste peu disponible, celui où tout devient modéré.

Ne pas modifier ces règles sans le signaler explicitement, et modifier le
document avant le code.

## Contraintes d'interface

**Un seul chiffre en grand : la fraîcheur.** Révisé le 7 septembre 2026, après
avoir regardé comment Whoop présente son score de récupération — un nombre
lisible à bout de bras, sa lecture en une phrase, et le reste plus petit en
dessous. Trois nombres à égalité obligent à comparer ; un seul répond. La forme
et la fatigue restent, en satellites.

**Le poids d'une journée est une jauge, pas un mot.** Quatorze lignes disant
« légère » sont quatorze fois du bruit ; la profondeur du rose le dit d'un coup
d'œil. Le mot ne reste que pour la journée chargée, la seule dont on veuille
être averti.

**La palette est grise, rose et noire** — choix de l'athlète, 6 septembre 2026.
La sévérité s'exprime par la profondeur du rose plutôt que par de nouvelles
couleurs : une app d'entraînement n'a pas besoin d'un feu tricolore. Une seule
exception, tenue par le projet lui-même : **la distinction électrique /
musculaire**, où le gris dit « ce ne sont pas tes jambes » et le rose dit
« si ».

**L'app s'ouvre sur le calendrier des deux prochaines semaines** — révisé le
7 septembre 2026. La carte « Aujourd'hui » est retirée : elle existait pour
poser la question du trajet, et cette question ne se pose plus (E.17 révisé).
Aujourd'hui est simplement la première ligne du calendrier, et c'est assez.

**Elle nomme le rayon, pas l'article** — 8 septembre 2026 (E.27). Zwift range
ses séances dans des collections qui portent le même vocabulaire que les zones
du projet ; l'app nomme la bonne et dit quoi y chercher. C'est un panneau
indicateur, pas une recette : la frontière du E.9 tient, et l'app ne prétend
pas que la séance existe.

**Le catalogue s'ouvre.** L'athlète ne voyait jamais que ce qui lui était
proposé. Les onze familles sont désormais lisibles, avec ce que chacune
construit et le niveau tenu dans sa zone — le E.7 poussé d'un cran : s'il n'est
d'accord avec rien, il choisit lui-même au lieu de refuser trois fois. Ce n'est
pas un éditeur de séance : rien ne s'y compose et rien ne s'y écrit.

L'application doit être **tolérante, pas culpabilisante**. C'est une
contrainte technique, pas une intention :

- Pas de série ni de compteur de jours consécutifs.
- Pas de dette affichée, pas de « séance en retard ».
- Une séance abandonnée disparaît, elle ne laisse pas de trace rouge.

Contexte : deux enfants en bas âge, disponibilité irrégulière, aucun
objectif de compétition.

## Ce que l'app écrit

**Rien, sauf supprimer** — décision du 7 septembre 2026, spécifiée en E.19.

Le plan des deux prochaines semaines vit dans Makigawa. intervals.icu tient la
vérité de ce qui a été fait, Garmin l'y verse, et l'app lit. Une app qui ne
fait que proposer peut se tromper sans conséquence, ce qui est la condition
pour qu'elle apprenne à ne plus se tromper.

La suppression d'un événement reste, derrière un appui long de deux secondes :
c'est ce qui défait ce qui a déjà été écrit.

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

Réordonnées le 7 septembre 2026 (E.19), l'app passant en lecture seule :

1. **Le plan des deux prochaines semaines**, tenu par Makigawa, corrigé à
   chaque lecture d'intervals.icu.
2. **La dose et sa vitesse** : la forme monte-t-elle trop vite pour qu'on en
   rajoute ? (E.20)
3. Vue mobile du calendrier — aujourd'hui et cette semaine.
4. Distinction visuelle claire électrique / musculaire.

L'encodage en quelques taps et la replanification écrite dans intervals.icu
sont **retirés** : ils supposaient une app qui écrit.

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

Les quatre étapes sont franchies. **L'étape 2 est ensuite revenue en arrière**
le 7 septembre : l'app n'écrit plus (E.19). Ce n'est pas un retour en arrière
du projet mais du périmètre — la capacité d'écrire est démontrée, elle attend
que le jugement soit bon.

La suite se joue en phase 6 : observer les règles sur des semaines réelles, et
corriger les bornes plutôt que le code.

### La souplesse

**Constaté le 6 septembre 2026 :** fourmis dans la jambe gauche après une
trentaine de kilomètres, et un psoas gauche moins mobile que le droit.

Le psoas et l'iliaque sont raccourcis à chaque coup de pédale et ne s'allongent
jamais pendant la sortie. La routine de `src/workouts/mobility.ts` en tient
compte : mobilité avant, tenues de 60 à 90 s après, et du renforcement — les
trois ensemble, parce qu'étirer seul ne tient pas.

**Les fourmis ne sont pas un sujet d'entraînement.** Une compression nerveuse
qui revient à la même distance relève d'abord d'une étude posturale, et d'un
avis médical si elle dure au-delà de la sortie ou s'accompagne de faiblesse.
L'app n'a pas à en juger, et n'en juge pas.

### Ce que l'app mesure

**Le pic à 175 bpm est mesuré depuis le 7 septembre 2026** (E.21). L'app lit la
courbe cardiaque de chaque activité des quatorze derniers jours et compte les
secondes au-dessus du seuil. Les battements viennent de la montre via
intervals.icu ; le déduire des zones reste exclu — les règles comparent des bpm
bruts, jamais un nom de zone.

Une lecture par activité, gardée dans le téléphone : une courbe ne change
jamais. Et un échec de lecture ne bloque rien — sans courbe, le pic reste à
zéro et la journée pèse par sa charge seule, comme avant. Le sens de l'erreur
a changé : l'app sous-estimait toujours, elle mesure maintenant.

**La reprise se détecte depuis le 6 septembre** (E.15) : l'app distingue
une séance d'un trajet dans l'historique, donc le compteur du E.5 fonctionne.
Il reste un point faible, assumé : un trajet musculaire n'est reconnu que par
son nom, `Hard Commute`, celui que l'athlète leur donne dans Garmin.

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
- [ ] Test FTP fait — **l'app dit maintenant à quel point il presse** : elle
      compare la FTP du profil à l'estimation d'intervals.icu et se tait sous
      5 % d'écart (E.24). Elle ne corrige rien : c'est le test qui tranche
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
