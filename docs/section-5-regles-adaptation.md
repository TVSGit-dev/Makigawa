# Section 5 — Règles d'adaptation

> **Statut : spécification complète et implémentée.** Les douze décisions sont
> arrêtées, et l'échelle de charge est étalonnée sur des journées réelles
> depuis le 6 septembre 2026. Les règles vivent dans `src/rules/`.
>
> Dernière révision : 6 septembre 2026.

---

## Avertissement, à lire une fois

**Je ne suis pas ton entraîneur, et ce document n'est pas un avis médical.**
Ce qu'il contient, c'est ce que dit la littérature sur l'entraînement et la
fatigue, rassemblé et confronté à ta situation particulière. Les chiffres
proposés sont des points de départ argumentés, pas des vérités.

Trois marquages courent dans tout le document :

| Marquage | Ce que ça veut dire |
|---|---|
| **Établi** | consensus large dans la littérature |
| **Discuté** | les études ne s'accordent pas, ou dépendent du contexte |
| **À trancher** | c'est ta décision, je propose et j'argumente |

Ce qui finit dans le code, ce sont les règles de la **partie E**, et rien
d'autre. Les parties A à D expliquent d'où elles viennent — sans quoi tu ne
pourrais ni les contester ni les corriger dans six mois.

---

## Comment lire ce document

- **Partie A — Le corps.** Comment on encaisse, comment on récupère, et à
  quel moment ça casse.
- **Partie B — Les styles.** Les grandes façons de répartir l'effort, et
  laquelle te concerne.
- **Partie C — Les semaines-types.** Cinq gabarits de semaine.
- **Partie D — Le curseur d'intention.** Dépasser ses limites, ou se
  reposer — et comment l'app en tient compte sans devenir dangereuse.
- **Partie E — Les règles.** Le déterministe, ce que le code exécute.
- **Partie F — Les décisions arrêtées.**

---

# Partie A — Ce que le corps encaisse

## A.1 Le principe, en une phrase

**On ne progresse pas pendant l'entraînement, on progresse pendant la
récupération.** L'effort crée un stress ; l'adaptation se produit après, si
et seulement si la récupération est suffisante. *(Établi.)*

Le corollaire est la moitié du projet : **si la récupération manque, le
stress ne se transforme pas en progrès, il s'accumule en fatigue.** Un
entraînement de plus n'est pas toujours un progrès de plus ; c'est parfois un
progrès de moins.

C'est pour ça que Makigawa peut légitimement *retirer* des séances. Retirer
n'est pas renoncer.

## A.2 Les deux horloges

intervals.icu calcule trois nombres, et le projet a décidé de ne jamais les
recalculer. Voici ce qu'ils veulent dire.

| | Nom | Horizon | Ce que c'est |
|---|---|---|---|
| **CTL** | Fitness / Forme | ~42 jours | ce que tu as encaissé sur le long terme |
| **ATL** | Fatigue | ~7 jours | ce que tu as encaissé récemment |
| **TSB** | Forme du jour | CTL − ATL | fatigué (négatif) ou frais (positif) |

Deux repères chiffrés de la littérature, utiles comme garde-fous :

**La vitesse de montée du CTL.** *(Discuté, fourchettes convergentes.)*

| Montée hebdomadaire | Lecture |
|---|---|
| **+3 à +5** | prudent, soutenable — recommandé en reprise |
| **+5 à +7** | agressif mais tenable si la récupération suit |
| **> +10** | drapeau rouge : risque de blessure, maladie, surentraînement |

**Le plancher de TSB.** Rester sous −30 à −40 pendant plusieurs semaines
d'affilée est le signe qu'on creuse plus vite qu'on ne remplit.

> ⚠️ **Ces deux repères viennent d'athlètes qui s'entraînent
> volontairement.** Toi, une grande partie de ta charge est *subie* — tu dois
> aller travailler. Ça change la lecture, et c'est le sujet du A.5.

## A.3 Les quatre degrés de fatigue

C'est la partie la plus importante pour ta question sur « dépasser ses
limites ». Il y a quatre états, pas deux, et la frontière entre le deuxième
et le troisième est ce qui sépare un progrès d'un mur. *(Établi — consensus
ECSS/ACSM.)*

| État | Durée de la baisse de forme | Issue |
|---|---|---|
| **Fatigue aiguë** | heures à jours | normale, quotidienne |
| **Surcharge fonctionnelle** (FOR) | jusqu'à ~2 semaines | **suivie de surcompensation → progrès** |
| **Surcharge non fonctionnelle** (NFOR) | 3-4 semaines à plusieurs mois | pas de surcompensation, récupération longue |
| **Syndrome de surentraînement** (OTS) | mois, parfois années | l'accident |

**Voilà la réponse honnête à « dépasser ses limites ».** Ce que tu cherches
s'appelle la surcharge fonctionnelle : tu creuses volontairement, tu es moins
bon pendant quelques jours à deux semaines, puis tu remontes **plus haut
qu'avant**.

Mais ce qui fait la différence entre FOR et NFOR n'est presque pas l'intensité
du creux — **c'est le temps qu'on y passe et le fait d'en sortir.** Creuser
trois semaines sans relâcher ne donne pas trois fois plus de progrès : ça
donne un autre état, dont on sort en mois et non en jours.

> **Conséquence de conception, non négociable :** un mode « ambitieux » doit
> être **borné dans le temps et suivi d'une décharge**. Une app qui laisse
> creuser indéfiniment ne rend pas service, elle fabrique la panne. C'est le
> garde-fou de la partie D.

Les marqueurs qui détectent la surcharge fonctionnelle, dans la littérature :
baisse de puissance, fréquence cardiaque sous-maximale et de récupération
modifiées, effort perçu qui monte à charge égale, et surtout **perte de
l'envie de s'entraîner**. Aucun marqueur biologique ne fait consensus.
*(Discuté.)*

Retiens le dernier : **la perte d'envie est un signal, pas un défaut de
caractère.**

## A.4 Le sommeil et le reste de la vie

C'est là que ton cas se distingue nettement de la littérature.

**Établi :** le sommeil est le moment où l'adaptation se produit. Dormir
moins de 8 heures ou mal est associé à plus de blessures, plus de maladies,
une moins bonne qualité d'entraînement. Le manque de sommeil augmente le
cortisol et baisse l'hormone de croissance — exactement l'inverse de ce que
l'adaptation demande. Les athlètes d'endurance à gros volume ont souvent
besoin de 8 à 10 heures.

**Établi aussi :** le stress de la vie et le stress de l'entraînement puisent
dans **le même compte**. Le corps ne distingue pas une nuit hachée par un
enfant d'une séance d'intervalles : les deux consomment de la capacité
d'adaptation.

**Et voilà ton contexte :** deux enfants en bas âge. Ton sommeil n'est pas une
variable que tu contrôles. Recommander « dors 9 heures » serait inutile.

> **Conséquence de conception :** l'app doit traiter une mauvaise nuit comme
> **de la charge**, pas comme un détail. Concrètement, c'est le seul endroit
> où j'introduirais une saisie manuelle — un bouton « nuit difficile » qui
> décale la journée d'un cran vers « chargée ». **Retenu**, à un seul tap :
> c'est le seul endroit où la saisie manuelle vaut son coût.

## A.5 Le cas particulier : ta charge est en grande partie subie

Voici l'observation qui structure tout le reste, et je n'ai trouvé aucune
littérature qui la traite directement — elle se déduit.

**Établi :** les trajets en vélo électrique atteignent bel et bien des
intensités modérées à vigoureuses, et améliorent la condition
cardiorespiratoire. Ce n'est pas du déplacement passif, c'est de
l'entraînement.

**Ton chiffre :** 6-7 trajets par semaine, portant **60 à 100 % de ta charge
hebdomadaire**.

Assemble les deux et tu obtiens une situation inhabituelle :

> **Ta base d'endurance est déjà construite, et tu ne peux pas l'arrêter.**
> Elle n'est pas un choix d'entraînement, c'est ton trajet domicile-travail.

Trois conséquences directes, qui commandent les parties suivantes :

1. **Tu n'as pas besoin d'ajouter du volume facile.** Il est déjà là, en
   quantité. Ce serait même l'erreur classique : empiler du z2 sur du z2.
2. **Ta marge d'entraînement, c'est la qualité** — le petit pourcentage
   intense. Elle est rare, donc précieuse, donc à protéger.
3. **Ta variable d'ajustement principale n'est pas « en faire plus », c'est
   « placer au bon endroit ».** D'où le rôle de Makigawa : le *quand* et le
   *si*, jamais le *quoi*.

---

# Partie B — Les styles d'entraînement

Quatre grandes façons de répartir l'effort entre facile, moyen et dur. Je les
donne toutes parce que tu les as demandées et qu'elles servent à construire
des semaines différentes — mais la partie B.5 dit laquelle te concerne, et
pourquoi les autres sont surtout là pour comprendre.

## B.1 Polarisé — « 80/20 »

**Le principe.** Environ 80 % du temps en facile, 20 % en dur, et
**presque rien au milieu**. La zone intermédiaire est évitée délibérément :
assez dure pour fatiguer, pas assez pour déclencher les adaptations du haut.

Répartition typique : 75-80 % facile, 0-5 % moyen, 15-20 % dur.

**Ce que dit la preuve.** *(Discuté.)* Efficace pour le VO2max et l'économie
de mouvement. Mais sa supériorité n'apparaît nettement que sur des
interventions **courtes (< 12 semaines)** et chez des athlètes **déjà bien
entraînés**. Seiler lui-même parle d'un « optimum de population » : le mieux
pour la plupart, pas pour tous.

**La limite pratique :** le modèle ne fonctionne que si les 80 % font
beaucoup. Sur 4 heures par semaine, 80 % de facile, ce sont 3 h 12 de facile,
et le « 20 % » se réduit à 48 minutes. Ça marche mal.

## B.2 Pyramidal

**Le principe.** Large base de facile, une **couche assumée de tempo** au
milieu, un sommet étroit d'intensité. Contrairement au polarisé, la zone
intermédiaire n'est pas évitée : elle est un étage du bâtiment.

**Ce que dit la preuve.** Les cyclistes d'élite, mesurés, s'entraînent
autour de 77 % zone basse, 15 % zone moyenne, 8 % zone haute — ce qui est
pyramidal, pas polarisé. Pour les cyclistes à 6-12 h par semaine, la
littérature appliquée converge : **pyramidal avec des blocs ponctuels de
sweet spot** est l'approche la plus pratique. *(Établi comme pratique
dominante ; discuté comme supériorité.)*

## B.3 Seuil / Sweet Spot

**Le principe.** Concentrer le travail autour de 84-97 % de la FTP — assez
dur pour progresser, assez soutenable pour en faire beaucoup. Chez toi, avec
une FTP de 221 W, ça tombe sur **185-214 W**.

**Ce que dit la preuve.** Efficace et rentable quand le temps manque. **Mais
doit être périodisé en blocs, jamais pratiqué toute l'année** — c'est le
piège classique du cycliste pressé, qui finit par tout faire à intensité
moyenne et par ne plus progresser nulle part.

## B.4 Par blocs

**Le principe.** Concentrer une qualité sur un bloc de 1 à 8 semaines, puis
passer à une autre.

**Ce que dit la preuve.** Améliore VO2max, puissance de pointe et seuils.
Exigeant en discipline de récupération. *(Établi, mais pour athlètes
structurés.)*

**Franchement :** peu adapté à une disponibilité irrégulière. Un bloc
suppose de pouvoir tenir un enchaînement. Je le mentionne pour être complet,
pas pour te le recommander maintenant.

## B.5 Ce qui te concerne, et pourquoi

Reprends le A.5 : ta base est déjà construite par tes trajets, et tu ne peux
pas l'arrêter.

**Tu n'as donc pas à choisir un modèle — tu en subis déjà un.** Tes trajets
électriques (~129 bpm) forment une large base facile ; tes allers-retours
musculaires (~160 bpm) forment une couche de tempo. **C'est un pyramidal,
imposé par ta vie plutôt que choisi.**

> **La proposition :** ne pas lutter contre. Considérer la base comme
> acquise, et faire porter tout l'effort de conception sur **le sommet** —
> les une ou deux séances de qualité par semaine que tu peux réellement
> placer.

Ce qui donne une répartition des rôles claire :

| | Qui s'en occupe |
|---|---|
| La base facile | tes trajets, automatiquement |
| La couche tempo | tes allers-retours musculaires |
| Le sommet, rare et précieux | **les séances que Makigawa protège** |

Et ça explique pourquoi la règle d'anti-empilement est la plus importante du
lot : quand la base est fixe et abondante, la seule chose qui puisse mal se
passer, c'est **une séance de qualité posée sur une journée déjà chargée**.

---

# Partie C — Les semaines-types

Cinq gabarits. Ils décrivent une **intention de semaine**, pas un planning
figé — c'est la partie E qui dit quoi faire quand la réalité s'en écarte.

## C.0 Le rythme de fond : charger, puis décharger

**Établi.** Alterner des semaines de charge et une semaine allégée est un des
outils les mieux étayés de l'entraînement. Deux rythmes existent :

| Rythme | Pour qui |
|---|---|
| **3:1** — trois semaines de charge, une allégée | standard, athlètes bien récupérés |
| **2:1** — deux semaines de charge, une allégée | forte contrainte de vie, récupération limitée, masters |

> **Retenu : 2:1.** Pas parce que l'athlète serait fragile, mais parce que la
> littérature fait dépendre ce choix de la **capacité de récupération**, et
> que la sienne est contrainte par deux enfants en bas âge et un sommeil qu'il
> ne pilote pas. Le 3:1 suppose des semaines de charge pleines et une
> récupération correcte entre elles.

En décharge : **réduire le volume de 40 à 60 %**, garder une ou deux sorties
courtes avec quelques accélérations brèves pour ne pas s'éteindre.

## C.1 Semaine de reprise

**Quand :** après 14 jours ou plus sans séance de qualité (voir E.5).

- Volume de qualité réduit, remontée de **+10 % par semaine maximum**
- Pas de séance au-dessus du tempo la première semaine
- Les trajets continuent normalement — ils ne remettent pas le compteur à zéro
- Durée : 3 semaines, puis on passe en base

**Pourquoi ces chiffres.** Deux semaines d'arrêt coûtent seulement 4 à 7 % de
VO2max, et la force ne bouge quasiment pas avant 4 semaines. Ce n'est donc
**pas la perte de forme** qui commande la prudence. C'est ceci : **les tissus
conjonctifs se réadaptent plus lentement que les muscles, et les deux
premières semaines de retour sont la fenêtre de risque la plus élevée.** Tu
te sens capable avant d'être prêt. *(Établi.)*

## C.2 Semaine de base — le défaut

- La base vient des trajets, on n'y touche pas
- **Une** séance de qualité, placée sur une journée légère
- Mobilité selon disponibilité
- Objectif : tenir, pas progresser

C'est la semaine la plus fréquente, et ce n'est pas un échec. Avec deux
enfants en bas âge, tenir *est* le résultat.

## C.3 Semaine de développement

- **Deux** séances de qualité, jamais consécutives, jamais sur journée chargée
- Renfo placé selon la règle des 24-48 h (voir E.4)
- Montée de CTL visée : **+3 à +5** en mode normal

## C.4 Semaine de décharge

- Volume de qualité **−40 à −60 %**
- On garde une sortie courte avec quelques accélérations de 10-30 s
- Les trajets continuent — on ne peut pas les arrêter, et ce n'est pas grave
- **Aucune séance retirée ici ne compte comme manquée**

Ce dernier point est une règle d'interface autant que d'entraînement : une
décharge est une décision, pas un échec, et l'app ne doit surtout pas la
présenter comme une dette.

## C.5 Semaine subie

**Quand :** maladie, enfant malade, nuits hachées, surcharge professionnelle.

- Tout le structuré saute
- Les trajets restent, parce qu'ils sont ta vie et pas ton entraînement
- **Aucune trace, aucun rattrapage, aucun compteur**
- On repart en base, ou en reprise si le seuil des 14 jours est franchi

---

# Partie D — Le curseur d'intention

Tu as demandé que le système tienne compte de **la volonté de dépasser ses
limites ou de se reposer**. Voici comment le faire sans que ça devienne
dangereux.

Trois modes, choisis par toi, à la semaine :

| | 🌱 Prudent | ⚖️ Normal | 🔥 Ambitieux |
|---|---|---|---|
| Montée de CTL visée | 0 à +3 | +3 à +5 | +5 à +7 |
| Plancher de TSB toléré | −10 | −20 | −30 |
| Journées chargées planifiées / semaine | 1 | 2 | 3 |
| Deux journées chargées consécutives | jamais | jamais | **tolérées une fois** |
| Séance manquée | abandonnée directement | décalée puis dégradée | décalée agressivement |

## Le garde-fou, qui n'est pas négociable

**Le mode ambitieux est borné à 2 semaines consécutives, et il est
obligatoirement suivi d'une semaine de décharge.**

Ce n'est pas de la prudence excessive, c'est la définition même de ce que tu
cherches (A.3) : la surcharge **fonctionnelle** ne devient un progrès que si
tu en sors. Creuser sans remonter, ce n'est pas creuser plus profond — c'est
changer d'état, et l'autre état se paie en mois.

Concrètement, l'app :

- refuse un troisième « ambitieux » d'affilée et impose une décharge
- repasse en prudent si le TSB reste sous le plancher plus de 5 jours
- repasse en prudent après une semaine subie

> **Retenu : contraignant pour le seul troisième « ambitieux » d'affilée**,
> suggéré partout ailleurs. C'est là que le coût d'une erreur est le plus
> élevé et que le jugement du moment est le moins fiable, puisque la perte de
> lucidité fait partie des symptômes.

---
# Partie E — Les règles

**C'est cette partie que le code implémente.** Le reste du document
l'explique.

> **Reconstruite à partir de zéro.** Les règles esquissées dans `CLAUDE.md`
> étaient les prémices d'une idée, pas une spécification. L'athlète a demandé
> de les abandonner plutôt que de les compléter : ce qui suit est **déduit de
> la partie A**, et n'hérite de rien.

## E.0 Les cinq principes dont tout découle

| | Principe | D'où il vient |
|---|---|---|
| 1 | **La base est acquise et subie.** Les règles n'agissent que sur les séances de qualité — jamais sur les trajets, qu'on ne peut ni déplacer ni supprimer. | A.5 |
| 2 | **La qualité est rare, donc on la protège.** Une séance bien placée vaut mieux que deux mal placées. | B.5 |
| 3 | **La récupération est contrainte.** À doute égal, on allège. | A.4 |
| 4 | **Rien n'est urgent.** Aucune compétition, donc aucune séance indispensable. | contexte |
| 5 | **Aucune trace de ce qui n'a pas eu lieu.** | contraintes d'interface |

Le principe 4 mérite d'être dit franchement : **une séance perdue est
perdue.** Elle ne se rattrape pas, ne se reporte pas indéfiniment, et ne
laisse rien derrière elle. C'est ce qui distingue cette app d'un plan
d'entraînement.

## E.1 Ce que l'app observe

Une seule mesure, et un signal.

### La charge du jour

**Proposition : la somme des charges d'entraînement du jour, telles que
calculées par intervals.icu** (`icu_training_load`), toutes activités
confondues.

Pourquoi ce choix plutôt que compter les minutes au-dessus d'un seuil de
fréquence cardiaque, comme l'esquissait `CLAUDE.md` :

| | Minutes au-dessus de 150 bpm | Charge d'intervals.icu |
|---|---|---|
| Calcul maison ? | oui — le projet l'interdit ailleurs | non, elle est fournie |
| Tient compte de la durée ? | non, une longue sortie à 145 bpm compte pour zéro | oui |
| Comparable entre vélo, électrique, renfo ? | mal | oui |
| Dépend de valeurs incertaines ? | du seuil choisi | de la LTHR, actuellement douteuse |

Le premier point est décisif : `CLAUDE.md` pose qu'on ne recalcule jamais la
charge soi-même. Compter des minutes au-dessus d'un seuil, c'est fabriquer sa
propre mesure de charge à côté de celle qui existe déjà.

Le deuxième règle gratuitement le trou que j'avais signalé : trois heures à
145 bpm produisent une charge élevée chez intervals.icu, alors qu'elles
comptaient pour zéro minute au-dessus de 150.

### L'échelle de charge

Une seule échelle à cinq niveaux, qui sert **deux fois** : pour situer une
séance prise isolément, et pour situer une journée entière une fois ses
activités additionnées. Même unité, même vocabulaire, deux agrégations.

| Niveau | Charge | Ce qu'on y trouve |
|---|---|---|
| **0 — Négligeable** | < 20 | mobilité, étirements |
| **1 — Légère** | 20 à 55 | un aller-retour en vélo électrique |
| **2 — Modérée** | 55 à 90 | la séance « Chill », une endurance courte |
| **3 — Soutenue** | 90 à 135 | un aller-retour musculaire |
| **4 — Lourde** | > 135 | une belle balade, une sortie longue |

**Étalonnées le 6 septembre 2026** sur des journées réelles relevées par
l'athlète :

| Repère | Charge constatée | Niveau |
|---|---|---|
| Aller-retour en vélo électrique | 30 à 40 | 1 |
| Séance « Chill », une heure d'intérieur | 69 | 2 |
| Aller-retour musculaire | 110 à 120 | 3 |
| Belle balade, une seule sortie | 140 | 4 |

Les bornes sont placées à mi-chemin entre ces repères, ce qui laisse une
quinzaine de points de marge de chaque côté : un trajet électrique un peu
appuyé reste léger, un aller-retour musculaire un peu doux reste chargé.

Elles restent un **paramètre** et non une constante figée. Le poids ou la LTHR
changent, les charges d'intervals.icu suivent, et les bornes se redéplacent par
la même méthode.

> **Ce que l'étalonnage a corrigé.** Les bornes déduites à l'aveugle —
> 15 / 40 / 70 / 110 — plaçaient l'aller-retour électrique juste sous une
> borne et l'aller-retour musculaire au sommet de l'échelle, sans aucune
> marge. Les repères tombaient dans les bonnes catégories, mais par chance
> plutôt que par construction.

### Le vélo électrique dans cette échelle

L'athlète situe le vélo électrique du côté de la mobilité, et c'est juste au
niveau d'un trajet : chacun pèse peu, niveau 1 au plus.

Mais ce n'est pas contradictoire avec le A.5, qui pose que ces trajets portent
60 à 100 % de la charge hebdomadaire. **Chaque trajet est léger ; c'est leur
accumulation qui fait le volume.** Six à sept trajets par semaine, à 25 ou 30
de charge chacun, pèsent plus lourd que deux séances structurées.

Deux conséquences à ne pas confondre :

- **Un trajet n'est jamais une séance.** Makigawa ne le planifie pas, ne le
  déplace pas, ne le supprime pas. Il n'entre dans aucune règle d'espacement.
- **Sa charge compte toujours.** Elle s'additionne dans la journée et pèse
  donc sur la décision du E.2. L'ignorer reviendrait à ignorer l'essentiel de
  ce que l'athlète encaisse.

### Ce qui compte comme séance de qualité

Le niveau d'une séance planifiée décide de ce que les règles lui font :

| Niveau de la séance | Traitement |
|---|---|
| 0 — Négligeable | mobilité : jamais déplacée, jamais bloquante, jamais bloquée |
| 1 — Légère | un trajet : n'est jamais une séance, sa charge compte quand même |
| 2 à 4 — Modérée à lourde | **séance de qualité** : toutes les règles d'espacement s'appliquent |

C'est ce qui permet à une séance de mobilité de cohabiter avec n'importe quoi,
sans jamais déclencher un décalage ni en subir un.

> **Le seuil de qualité d'une séance est un cran plus bas que celui d'une
> journée chargée**, et l'étalonnage explique pourquoi. Une séance et une
> journée ne vivent pas dans la même plage : la séance « Chill » pèse 69 quand
> un aller-retour musculaire en pèse 110 à 120. Aligner les deux seuils ferait
> qu'une heure d'intérieur structurée ne serait pas une séance de qualité, ce
> qu'elle est manifestement.

### La journée, dans la même échelle

Le reste du document parle de journées légères, moyennes et chargées. Ce ne
sont pas d'autres catégories, seulement des regroupements de la même échelle
appliquée au total du jour :

| Journée | Niveau du total | Exemple attendu |
|---|---|---|
| **Légère** | 0 ou 1 | un aller-retour en vélo électrique |
| **Moyenne** | 2 | électrique plus une mobilité, ou une endurance courte |
| **Chargée** | 3 ou 4, **ou un pic** | un aller-retour musculaire, une belle balade |

La colonne de droite est **confirmée par les relevés du 6 septembre**. Si un
jour elle cessait de l'être, ce sont les bornes qu'on déplacerait — jamais les
règles.

### Le pic

Indépendamment de la charge totale, **tout passage prolongé à haute fréquence
cardiaque bascule la journée en « chargée »**. Une charge quotidienne modérée
peut cacher un effort maximal court, qui coûte cher nerveusement sans peser
lourd dans la charge.

**Retenu : 2 minutes cumulées au-dessus de 175 bpm.** Les 175 bpm
correspondent à 87 % de la FCmax. La durée minimale est ce qui manquait :
sans elle, un unique battement suffisait à basculer la journée, et un sprint
de trente secondes pour attraper un feu aurait le même poids qu'un effort
maximal. Deux minutes soutenues à ce niveau sont un vrai effort.

## E.2 La question centrale

Toutes les règles se ramènent à une seule question, posée pour chaque séance
de qualité planifiée :

> **Aujourd'hui est-il un bon jour pour cette séance ?**

La réponse est **non** si l'une de ces conditions est vraie :

1. **Hier était une journée chargée** (voir E.4 pour le cas du renfo)
2. **Les deux derniers jours cumulent deux journées au moins moyennes**
3. **Le TSB est sous le plancher du mode en cours** (partie D)
4. **Le mode est « prudent » et une séance de qualité a déjà eu lieu cette
   semaine**

Sinon, la réponse est **oui**, et l'app ne fait rien — c'est le cas le plus
fréquent, et une app qui ne fait rien quand tout va bien est une app qui
fonctionne.

> **Retenu avec réserve.** La condition 2 est la plus discutable : elle
> interdit une séance après deux journées moyennes consécutives, ce qui, avec
> 6-7 trajets par semaine, risque d'arriver souvent. Si le contrôle de la
> phase 6 montre qu'elle bloque trop, la desserrer à « deux journées
> chargées ».

## E.3 Quand la réponse est non

Trois issues, dans cet ordre. **Aucune ne produit de dette.**

### 1. Décaler

Chercher, dans les **deux jours suivants**, un jour où la réponse à E.2
devient oui.

Pourquoi deux et pas plus : au-delà, la séance ne sert plus l'intention de la
semaine, et elle encombre un calendrier qui devrait rester lisible. **À
trancher** si tu préfères trois.

### 2. Réduire

Si aucun jour ne convient, proposer une version courte : **durée réduite
d'environ moitié, intensité inchangée.**

C'est un choix, et voici son argument. L'autre option serait de garder la
durée et de retirer l'étage le plus intense. Mais ta ressource rare, c'est
l'intensité (B.5) : ton volume facile est déjà abondant, tes trajets s'en
chargent. Retirer l'intensité transforme une séance de qualité en un trajet
de plus. **Raccourcir préserve ce qui manque ; adoucir détruit ce qui est
rare.**

### 3. Laisser tomber

Si même la version courte ne passe pas, **la séance disparaît**. Pas de
report, pas de marque, pas de mention. Elle n'a jamais existé.

## E.4 L'espacement

Trois règles de placement, dont deux viennent directement de la recherche sur
l'entraînement concurrent *(établi)* :

- **Deux séances de qualité ne se suivent jamais.** Un jour d'écart minimum.
- **Renfo jambes et séance d'endurance dure : 48 h d'écart**, dans les deux
  sens. Ni renfo la veille d'une grosse sortie, ni l'inverse. C'est un jour de
  plus que l'espacement de deux séances de qualité quelconques, et cette
  différence est ce qui rend la règle utile : à un seul jour d'écart, le
  contrôle précédent l'intercepterait à chaque fois et elle ne servirait
  jamais.
- **Si les deux tombent le même jour :** endurance d'abord, **3 h d'écart
  minimum**. La signalisation de l'endurance met environ 3 h à retomber,
  celle de la force dure ~18 h.

Et une bonne nouvelle qui vaut d'être connue : **le vélo interfère nettement
moins avec la force que la course à pied**, faute de contraction excentrique
destructrice. Ton renfo et ton vélo cohabitent mieux qu'ils ne le feraient
chez un coureur.

## E.5 La reprise

**Après 14 jours sans séance de qualité**, l'app passe en mode reprise
pendant 3 semaines : une seule séance de qualité la première semaine, et
une progression de **+10 % par semaine au maximum**.

**Les trajets ne remettent pas ce compteur à zéro.** Ils entretiennent la base
mais ne sollicitent ni le haut de la filière aérobie, ni les tissus qui se
déconditionnent le plus vite.

C'est la seule règle de l'esquisse initiale que je reprends telle quelle,
parce que la recherche la valide précisément :

- 2 semaines d'arrêt coûtent **4 à 7 % de VO2max** seulement
- la force tient **4 à 6 semaines** sans baisse notable
- mais retrouver prend **plus longtemps que perdre**
- et surtout : **les tissus conjonctifs se réadaptent plus lentement que les
  muscles**, ce qui fait des deux premières semaines de retour la fenêtre où
  l'on se blesse

**Le risque n'est donc pas de manquer de forme, c'est de se sentir capable
avant d'être prêt.** Un seuil de 14 jours et une remontée bornée à +10 % sont
la réponse adaptée.

## E.6 Ce que l'app ne fait jamais

Ces interdictions sont des règles au même titre que les autres, et elles
priment sur toutes les précédentes :

- **Jamais de rattrapage.** Une séance perdue n'est jamais ajoutée à une
  autre, ni compensée ailleurs.
- **Jamais de dette affichée**, ni de « séance en retard », ni de compteur de
  jours consécutifs.
- **Jamais deux journées chargées planifiées d'affilée.**
- **Jamais de renfo jambes planifié sur une journée chargée.**
- **Jamais de modification du contenu d'une séance** au-delà de la réduction
  de durée du E.3 — le contenu appartient à intervals.icu.

## E.7 L'app propose, l'athlète confirme

**Aucune écriture dans le calendrier intervals.icu ne se fait sans un geste
de l'athlète.** L'app calcule sa décision, l'affiche avec sa raison, et
attend. Un tap l'applique, un autre la refuse.

C'est un choix contre la « replanification automatique » que visait
initialement `CLAUDE.md`, et il se justifie de deux façons.

D'abord la confiance : les règles n'ont jamais tourné sur des données réelles,
leurs bornes sont provisoires, et un calendrier modifié en silence par une
règle mal calibrée est difficile à démêler après coup. Ensuite la réversibilité :
passer de « propose » à « agit seul » quand la confiance sera établie est un
changement mineur ; revenir en arrière après une mauvaise surprise coûte bien
plus.

**Conséquence pour le code :** le moteur de règles produit des *propositions*,
pas des actions. Il reste une fonction pure, sans effet de bord — ce qui le
rend testable, et ce qui laisse à l'interface la charge de demander.

---

# Partie F — Les décisions arrêtées

Les neuf points ont été tranchés le 5 septembre 2026. Ils sont désormais la
spécification, pas une proposition.

| # | Question | Décision |
|---|---|---|
| 1 | Mesure de la charge | **charge quotidienne d'intervals.icu**, pas un comptage de minutes |
| 2 | Bornes des cinq niveaux | **étalonnées le 6 septembre** : 20 / 55 / 90 / 135 |
| 3 | Seuil du pic | **175 bpm**, avec une durée minimale à fixer |
| 4 | Condition 2 du E.2 | **gardée**, à desserrer si la phase 6 montre qu'elle bloque |
| 5 | Décalage d'une séance | **2 jours** au maximum |
| 6 | « Réduire » | **durée de moitié, intensité inchangée** |
| 7 | Rythme charge/décharge | **2:1** |
| 8 | Saisie « nuit difficile » | **oui**, un seul tap |
| 9 | Retours automatiques | **imposés** pour le 3ᵉ « ambitieux », suggérés ailleurs |

Trois précisions s'y sont ajoutées le même jour :

| # | Question | Décision |
|---|---|---|
| 10 | Reconnaître une séance de qualité | **par sa charge prévue**, sur une échelle à cinq niveaux (E.1) |
| 11 | Durée minimale du pic | **2 minutes** cumulées au-dessus de 175 bpm |
| 12 | Autonomie de l'app | **elle propose, l'athlète confirme** (E.7) |

**Plus rien n'est en attente de mesure.** Les bornes des cinq niveaux, dernière
inconnue, ont été étalonnées le 6 septembre sur des journées réelles. Elles
restent un paramètre du code et non une constante figée : le jour où le profil
de l'athlète change, elles se redéplacent sans qu'aucune règle ne bouge.

## Ce que je n'ai pas décidé à ta place

Deux choses figuraient dans l'esquisse et **n'ont pas été reprises**, faute de
fondement :

- **L'arbitrage de semaine chargée** (retirer mobilité, puis renfo, puis
  sortie). Avec une seule ou deux séances de qualité par semaine, il n'y a
  rien à arbitrer : le E.2 traite déjà chaque séance individuellement. Cette
  règle supposait un volume que tu n'as pas.
- **Les niveaux de séance N1 / N2.** Ils apparaissaient sans être définis
  nulle part. Le document parle de « séances de qualité » sans hiérarchie ;
  si tu veux des niveaux, il faut d'abord dire ce qu'ils recouvrent.

## Sources

Fondements physiologiques et charge d'entraînement :

- [Prevention, diagnosis and treatment of the overtraining syndrome — consensus ECSS / ACSM](https://researchportal.lih.lu/en/publications/prevention-diagnosis-and-treatment-of-the-overtraining-syndrome-j/)
- [A Systematic Review on Markers of Functional Overreaching in Endurance Athletes](https://journals.humankinetics.com/downloadpdf/journals/ijspp/16/8/article-p1065.pdf)
- [A Coach's Guide to ATL, CTL & TSB — TrainingPeaks](https://www.trainingpeaks.com/coach-blog/a-coachs-guide-to-atl-ctl-tsb/)
- [CTL Ramp Rates, TSB floors & Loading Patterns — Alan Couzens](https://www.alancouzens.com/blog/CTLramp.html)

Répartition de l'intensité et périodisation :

- [Training Periodization, Intensity Distribution, and Volume in Trained Cyclists: A Systematic Review](https://journals.humankinetics.com/view/journals/ijspp/18/2/article-p112.xml)
- [Comparison of Polarized Versus Other Types of Endurance Training Intensity Distribution: Systematic Review with Meta-analysis](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11329428/)
- [The Effect of Polarized Training Intensity Distribution on VO2max and Work Economy](https://pmc.ncbi.nlm.nih.gov/articles/PMC11679080/)
- [Effects of a 16-Week Training Program with a Pyramidal Intensity Distribution on Recreational Male Cyclists](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10820066/)
- [Complete Guide to Polarized Training with Dr. Stephen Seiler — Fast Talk Labs](https://www.fasttalklabs.com/pathways/polarized-training/)

Décharge, désentraînement, reprise :

- [Cycling Rest Week Guide — Structure, Volume, Timing](https://roadmancycling.com/blog/cycling-rest-week-guide)
- [A Guide to Detraining — Stronger by Science](https://www.strongerbyscience.com/detraining/)
- [Detraining explained: how quickly do you lose fitness? — BikeRadar](https://www.bikeradar.com/advice/fitness-and-training/detraining-how-quickly-do-you-lose-fitness)

Sommeil, stress de vie, autorégulation :

- [The Effect of Sleep Quality and Quantity on Athlete's Health and Perceived Training Quality](https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2021.705650/full)
- [The Impact of Inadequate Sleep on Overtraining Syndrome in College Athletes](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11015874/)
- [Using Heart Rate Variability to Schedule the Intensity of Your Training — TrainingPeaks](https://www.trainingpeaks.com/blog/using-heart-rate-variability-to-schedule-the-intensity-of-your-training/)

Entraînement concurrent (force et endurance) :

- [The effects, mechanisms, and influencing factors of concurrent strength and endurance training with different sequences](https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2025.1692399/full)
- [The Role of Intra-Session Exercise Sequence in the Interference Effect: Systematic Review with Meta-Analysis](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5752732/)

Vélo électrique :

- [E-cycling and health benefits: A systematic literature review with meta-analyses](https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2022.1031004/full)
- [The self-selected intensity of physical activity during real-life e-bike commuting](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12834821/)
- [Health benefits of electrically-assisted cycling: a systematic review](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6249962/)
