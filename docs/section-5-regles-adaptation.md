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
> **de la charge**, pas comme un détail. **Retenu**, à un seul tap.
>
> **Précision du 6 septembre.** La montre de l'athlète enregistre ses nuits, et
> intervals.icu en dispose déjà : il n'y a donc rien à saisir à l'aveugle. Mais
> les deux mesures divergent — un score de sommeil peut annoncer une excellente
> nuit là où deux réveils l'ont hachée, parce qu'il compte des durées et des
> phases, pas des interruptions.
>
> La saisie n'est donc pas un « bouton nuit difficile » mais un **démenti** :
> l'app affiche ce que la montre a mesuré, et un tap le contredit. C'est plus
> juste — le ressenti est un marqueur reconnu de surcharge (A.3), et il ne se
> déduit pas d'un score. C'est aussi moins coûteux : rien à saisir les jours
> où les deux s'accordent, c'est-à-dire la plupart.

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
musculaires (163 à 172 bpm) forment une couche de tempo. **C'est un pyramidal,
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
5. **La journée est déjà chargée sans elle** — ajouté le 7 septembre 2026

Sinon, la réponse est **oui**, et l'app ne fait rien — c'est le cas le plus
fréquent, et une app qui ne fait rien quand tout va bien est une app qui
fonctionne.

> **La cinquième condition était implicite, et c'est un défaut qui l'a
> révélée.** Tant qu'un aller-retour musculaire comptait à tort pour une séance
> de qualité, l'espacement du E.4 refusait de placer quoi que ce soit le jour
> même. La marque de trajet corrigée, ce refus a disparu — et l'app s'est mise
> à poser un sweet spot sur une journée qui portait déjà 115 de charge, soit
> une journée plus lourde que tout ce que l'athlète a jamais fait.
>
> La condition dit maintenant ce que les autres supposaient : on ne pose pas
> une séance de qualité sur une journée que le reste a déjà rendue chargée. Le
> E.11 la posait déjà pour lui seul, sur le test FTP ; elle vaut pour toutes.

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

## E.8 La sortie ouverte

Décidée le 6 septembre 2026, à la demande de l'athlète.

Une **sortie ouverte** est une séance sans structure, qui ne porte qu'une
**charge visée** : « sors, vise 140 ». Elle existe parce que dehors, le
terrain, la météo et le groupe décident de l'intensité — prescrire des blocs
de puissance sur une route vallonnée revient à prescrire ce qu'on ne contrôle
pas.

C'est la seule chose que Makigawa **crée** au lieu de recopier. La frontière
tient quand même, et pour une raison précise : **une sortie ouverte n'a pas de
contenu.** Il n'y a ni bloc, ni zone, ni ordre — rien qu'un objectif. L'app ne
compose donc aucune séance ; elle pose une intention, ce qui est exactement son
rôle. Le jour où l'athlète veut de la structure, elle vient d'intervals.icu
comme le reste.

**Les règles la traitent comme n'importe quelle séance.** Sa charge visée est
sa charge : elle situe la sortie sur l'échelle du E.1, elle décide si c'est une
séance de qualité, et le E.2 s'y applique mot pour mot. Une sortie ouverte à
200 peut donc être décalée, et elle est refusée le lendemain d'une journée
chargée comme le serait un seuil de 45 minutes.

**Une exception à la cascade du E.3** : « réduire » ne peut pas raccourcir une
structure qui n'existe pas. Sur une sortie ouverte, réduire signifie
**diviser la charge visée par deux**, ce qui revient au même — rouler moitié
moins, ou moitié moins fort, l'athlète voit sur place. C'est le seul cas où la
réduction se lit en charge et non en durée, et c'est cohérent : la sortie
ouverte est définie par sa charge, pas par ses blocs.

**Les charges proposées sont ancrées sur des relevés réels**, pas sur une
grille théorique :

| Charge visée | Ce que ça vaut chez l'athlète |
|---|---|
| 40 | une heure tranquille |
| 75 | une heure et demie sans forcer |
| 115 | l'équivalent d'un aller-retour musculaire |
| 140 | la sortie de 35 km |
| 200 | la sortie de 50 km |
| 270 | au-delà de 60 km |

Ce n'est pas un calcul de charge maison : l'app n'estime rien, elle relaie un
objectif que l'athlète choisit. La charge **réalisée**, elle, viendra
d'intervals.icu comme toutes les autres.

## E.9 Composer une séance

Décidée le 6 septembre 2026, à la demande de l'athlète : *« tous les chiffres
viennent d'intervals.icu, l'organisation vient de Makigawa »*.

L'app assemble des séances à partir de **motifs relevés sur les séances réelles
de l'athlète** — sweet spot en over-under, seuil en over-under, 30/30, 30/15,
navette lactate — auxquels s'ajoutent l'endurance et le tempo, absents des
séances fournies mais indispensables à une semaine de décharge et à la
répartition d'intensité de la partie B.

**Ce que l'app ne décide pas** : aucune intensité n'est écrite en watts. Toutes
le sont en pourcentage de FTP, donc c'est la FTP d'intervals.icu qui les
résout — et le jour où le test de la phase 5 la corrige, **toutes les séances
composées se recalibrent d'un coup**. Aucune charge n'est envoyée non plus :
intervals.icu la calcule depuis la structure.

**Ce que l'app décide** : combien de blocs, combien de répétitions, la longueur
de l'échauffement, et le jour.

Trois règles de forme, tirées des séances de référence :

- **Un bloc de travail ne dépasse pas ce que la famille en fait.** Vingt
  minutes pour le sweet spot et le seuil, douze pour le 30/30. Sans cette
  borne, viser la bonne durée totale produisait des monstres — trente minutes
  d'over-unders d'affilée là où la référence en fait deux fois quinze.
- **À durée égale, on coupe en blocs.** La récupération entre les blocs est ce
  qui permet de tenir l'intensité jusqu'au dernier.
- **L'échauffement entre dans le calcul.** Celui des séances fournies dure
  treize minutes ; sur une séance de trente, il ne resterait rien. Un
  échauffement court de sept minutes existe pour ça.

**Une famille n'annonce que les durées qu'elle sait tenir.** La navette lactate
ne monte pas à soixante-quinze minutes sans qu'on lui invente un volume que les
séances de référence ne contiennent pas — l'app ne la propose donc pas à cette
durée. Promettre une durée qu'on ne sait pas remplir serait promettre à faux.

**Une séance composée n'a pas encore de charge** quand on choisit son jour :
c'est intervals.icu qui la calculera. Les jours sont alors examinés sur tout le
reste — la veille chargée, la séance de qualité voisine, le renfo trop proche.
C'est moins qu'un verdict complet, et l'app le dit ; c'est vrai, ce qui vaut
mieux qu'une charge inventée. Le verdict complet vient à la lecture suivante.

## E.10 Le planning de la semaine

Décidé le 6 septembre 2026, après le premier usage réel. L'athlète l'a dit en
une phrase : *« je ne veux pas encoder moi-même, je veux que, en fonction de la
charge et la fatigue, Makigawa fasse le planning et me propose des séances pour
m'améliorer. »*

Jusqu'ici l'app savait **ajuster** ce qui existait et **poser** ce qu'on lui
demandait. Elle ne savait pas **proposer**. C'était le manque, et il expliquait
pourquoi un calendrier vide le restait.

### Combien de séances

Le quota du mode en cours (partie D) : une en prudent, deux en normal, trois en
ambitieux. Ce ne sont pas des séances en plus des règles, ce sont les mêmes
règles utilisées à l'endroit : au lieu de refuser après coup, on cherche les
jours qui conviennent et on s'y installe.

### Lesquelles

**La forme d'intervals.icu décide de ce qui est disponible.** Une CTL basse veut
dire un corps qui n'a pas encaissé de travail dur depuis longtemps ; lui poser
du VO2 max la première semaine est le meilleur moyen de le blesser ou de le
dégoûter.

| Forme (CTL) | Familles ouvertes |
|---|---|
| moins de 25 | endurance, tempo, sweet spot |
| 25 à 39 | + seuil |
| 40 et plus | + VO2 max, navette lactate |

C'est une progression, pas un classement : les familles du bas restent
disponibles à tous les niveaux, et une semaine de décharge s'y appuie.

**La séance la plus exigeante passe en premier** dans la semaine, les suivantes
descendent. Elle est placée quand la fraîcheur est la meilleure — la reporter
en fin de semaine reviendrait à la faire sur des jambes déjà entamées.

### Quel jour

Le premier jour de l'horizon où le E.2 dit oui, la séance déjà proposée
comprise. **Chaque séance retenue entre dans le décor de la suivante** : sans
cela l'app en placerait deux le même jour, ou deux d'affilée, et se
contredirait au premier examen.

Quand aucun jour ne convient, la séance n'est pas proposée. L'app en propose
moins plutôt que de proposer mal.

### Ce que le planning n'est pas

Un contrat. C'est un point de départ que les règles modifieront jour après
jour — et rien n'est écrit sans un tap, comme partout ailleurs (E.7). L'athlète
peut par ailleurs écarter une proposition ou la repousser, et le plan se
recalcule autour de son choix (E.14).

### Ce qui manque encore

**La reprise du E.5 est détectée depuis le E.15**, qui sait distinguer une
séance d'un trajet dans l'historique. Le plafond de +10 % par semaine
s'applique donc, et le E.16 le tient en ne proposant qu'un cran de plus à la
fois.

## E.11 Le test FTP

Décidé le 6 septembre 2026. Le protocole est celui de l'athlète lui-même — son
fichier « 20 Minute FTP Test » — et Makigawa n'y touche pas. Ce qu'elle apporte
est, comme toujours, le **quand**.

**Un test exige plus qu'une séance de qualité.** Passé sur des jambes lourdes,
il ne mesure pas la FTP : il mesure la fatigue, et il rend un chiffre trop bas
que l'athlète traînera ensuite dans toutes ses séances, puisque toutes sont
écrites en pourcentage de cette FTP. Une mauvaise mesure ne coûte pas une
séance, elle coûte un cycle.

Quatre conditions s'ajoutent donc au E.2 :

0. **Le jour lui-même doit être léger.** Les règles ordinaires laissent passer
   une séance de qualité sur une journée qui porte déjà du travail ; pour un
   test, c'est disqualifiant.
1. **La fraîcheur doit être positive.** Pas seulement au-dessus du plancher du
   mode : au-dessus de zéro. C'est la seule règle du projet qui exige mieux que
   « pas trop fatigué ».
2. **Les deux jours précédents doivent être légers.** Les trajets ne comptent
   pas — ils n'entament pas ce qu'un test sollicite.
3. **Rien de chargé le lendemain non plus.** Un test est un effort maximal ; le
   poser la veille d'une grosse journée gâche les deux.

**L'app ne propose donc pas quatorze jours, elle en propose un** — le premier
qui remplit tout cela. Quand aucun ne convient, elle le dit et explique
laquelle des quatre conditions manque, plutôt que de laisser chercher.

**Le test n'entre pas dans le planning automatique du E.10.** Il se demande.
Un plan qui glisserait un test maximal entre deux séances serait un plan qui
n'a pas compris ce qu'est un test.

## E.12 Le démenti de nuit

La décision 8, enfin construite. intervals.icu reçoit déjà les données de
sommeil de la montre : l'app **affiche ce que la montre a mesuré**, et un seul
tap la contredit.

**Pourquoi un démenti et non une saisie.** Un score de sommeil compte des
durées et des phases. Se lever deux fois pour un enfant coûte quelques minutes
sur chaque compteur, donc le score reste bon — et la nuit a pourtant été
hachée. Les deux mesurent des choses différentes, et aucune n'a tort. Mais pour
l'entraînement, c'est le ressenti qui porte le signal : le sentiment subjectif
de fatigue est un marqueur reconnu de surcharge (A.3), et il précède souvent
les chiffres.

Les jours où les deux sont d'accord — la grande majorité — **il n'y a rien à
saisir**. Ce qui se perdait avant, c'était précisément l'information des jours
de désaccord.

**Ce que le démenti fait.** Il force le mode **prudent** pour la journée :
plancher de fraîcheur à −10, une seule séance de qualité, une seule journée
chargée. Ni plus ni moins. C'est un effet borné, réversible d'un tap, et qui ne
touche qu'aujourd'hui — une mauvaise nuit ne condamne pas la semaine.

Le démenti **n'est jamais envoyé à intervals.icu**. Il vit dans le téléphone,
comme les identifiants : c'est un ressenti, pas une mesure, et le calendrier
n'a pas à en porter la trace.

## E.13 Les trajets, et la souplesse

Deux ajouts demandés le 6 septembre 2026.

### Les trajets se planifient

Ils arrivent de Garmin, mais l'athlète veut aussi pouvoir les **poser
d'avance** — parce qu'un aller-retour connu change ce que la journée peut
encore porter, et que le savoir la veille vaut mieux que le découvrir après.

Deux formes, nommées comme il les nomme, et chargées comme il les a mesurées :

| | Type | Aller | Aller-retour |
|---|---|---|---|
| **Chill Commute** | électrique | 18 | 35 |
| **Hard Commute** | musculaire | 58 | 115 |

**Un trajet posé reste un trajet.** Il n'a pas de structure, sa charge visée
est tout ce qui le définit, et le E.1 le situe comme n'importe quelle autre
journée. Le Chill Commute reste de niveau 1 ; le Hard Commute, lui, monte au
niveau 3 en aller-retour — c'est bien une journée chargée, et les règles la
traitent comme telle. C'est déjà ce qu'elles faisaient sur les trajets
observés ; elles le font maintenant aussi d'avance.

### La souplesse

Le psoas et l'iliaque sont **raccourcis à chaque coup de pédale** et ne
s'allongent jamais pendant la sortie. La recherche est nette sur trois points :
étirer ne suffit pas seul, les tenues doivent durer **60 à 90 secondes** et non
quinze, et l'ensemble ne vaut que combiné à du renforcement des fessiers et du
tronc.

La séance de souplesse n'a **ni puissance, ni zone, ni charge** — c'est la
seule chose du catalogue qui n'en a pas. Elle porte une charge visée
volontairement basse, qui la place au niveau 0 : elle ne bloque rien, elle
n'est jamais une séance de qualité, et elle peut se poser n'importe quel jour,
y compris le lendemain d'une journée chargée. C'est précisément là qu'elle sert
le plus.

## E.14 Refuser une proposition, ou la repousser

Demandé le 6 septembre 2026 : *« une possibilité de refuser une proposition de
planification ou un décalage de la première séance proposée — avec évidemment
une adaptation du reste. »*

Le E.7 dit que l'app propose et que l'athlète confirme. Mais jusqu'ici **ne pas
confirmer était le seul refus possible**, et il ne disait rien : le plan
revenait identique au rafraîchissement suivant. Un refus qui ne change rien
n'est pas un refus, c'est une insistance — ce que les contraintes d'interface
interdisent.

### Deux gestes, parce qu'il y a deux axes

Une proposition tient en deux choses, **quoi** et **quand**. Chacune se refuse
séparément, et confondre les deux rendrait l'app sourde.

- **« Pas celle-ci »** écarte la *famille*, pas le jour. L'app propose autre
  chose au même endroit. Écarter la séance exacte ne servirait à rien : le
  planificateur choisit par famille (E.10), il reproposerait le même seuil un
  jour plus tard, et l'athlète aurait raison de croire qu'on ne l'a pas
  entendu.
- **« Plus tard »** repousse le *jour*, pas la séance. Le plan ne commence pas
  avant le jour choisi.

### Repousser, mais jusqu'où — révisé le 9 septembre 2026

Le geste unique de septembre ne repoussait que d'un jour, et se répétait :
deux taps repoussaient de deux jours. Demandé et abandonné le même jour, pour
une raison simple — *« soit demain, soit un autre jour, et qu'une liste
apparaisse pour mettre le jour précis »*. Repousser à samedi depuis un mardi
demandait quatre taps, et rien à l'écran ne disait où l'on en était.

**Deux gestes, donc, là où il n'y en avait qu'un :**

- **« Demain »** — le cas courant, en un tap. Le libellé nomme le jour réel
  quand la proposition n'est pas aujourd'hui : « demain » à côté d'une séance
  proposée jeudi serait un mensonge.
- **« Un autre jour »** ouvre la liste des jours restants de l'horizon, et il
  en désigne un.

### Un jour choisi est un souhait, pas un ordre

C'est le point qui décide, et il découle du E.7 : **l'app propose, l'athlète
confirme** — pas l'inverse. Le jour choisi devient le premier jour acceptable,
et le plan repart de là. Quand le E.2 dit oui, la séance tombe exactement là ;
quand il dit non — une journée déjà chargée, une fraîcheur sous le plancher —
elle glisse au premier jour suivant qui convient.

**Et l'app le dit.** Glisser en silence serait le seul vrai défaut possible
ici : l'athlète a demandé jeudi, il voit samedi, et rien ne le lui explique.
Une ligne nomme donc le jour demandé, le jour obtenu, et le motif — celui-là
même que le journal enregistre déjà (E.21), pas une phrase écrite pour
l'occasion.

Forcer le jour serait l'autre solution, et le projet ne la prend pas : elle
reviendrait à poser une séance de qualité sur une journée que les règles
refusent, c'est-à-dire à faire taire le E.2 d'un tap.

### L'adaptation du reste

Le plan est **recalculé en entier**, jamais rapiécé. Les séances suivantes sont
placées par rapport à la première (E.10) ; déplacer celle-ci sans replacer les
autres produirait deux séances collées, ce que le E.4 interdit. Recalculer
coûte quelques millisecondes et ne peut pas se contredire.

Le report déplace la fenêtre entière : l'horizon des quatorze jours repart du
premier jour encore acceptable, de sorte que repousser ne réduit jamais ce
qu'on peut proposer. C'est vrai du jour choisi dans la liste comme du
lendemain : les deux gestes posent le même plancher, ils ne diffèrent que par
le nombre de taps.

### Ce qu'un refus ne fait pas

- **Il ne crée pas de dette.** La séance écartée ne revient pas « en retard »,
  et rien n'en garde la trace (E.6).
- **Il ne dégrade pas la semaine.** L'app propose la famille suivante dans son
  ordre, pas systématiquement plus douce : refuser du seuil parce qu'on n'en a
  pas envie ne veut pas dire qu'on est fatigué. La fatigue est déjà lue
  ailleurs, et elle n'a pas besoin de ce signal-ci.
- **Il ne part pas dans intervals.icu.** Comme le démenti de nuit (E.12), c'est
  un ressenti et non une mesure : il vit dans le téléphone et le calendrier
  n'en porte aucune trace.

### Combien de temps il tient

Un refus vaut pour l'horizon du plan — quatorze jours — puis s'oublie de
lui-même. Un report s'oublie quand sa date passe. Et les deux se défont d'un
tap : rien ne s'installe sans qu'on puisse le retirer, exactement comme le
démenti de nuit.

### Quand il ne reste rien

Si toutes les familles ouvertes sont écartées, l'app **ne propose rien et le
dit**, avec le geste pour revenir en arrière. Elle ne va pas repêcher une
famille refusée pour avoir quelque chose à montrer : ce serait redemander ce
qu'on vient de lui refuser.

## E.15 La séance d'après

Demandé le 6 septembre 2026, comme deuxième des cinq idées. C'est la pièce qui
manquait à tout le reste : **l'app savait ce qu'elle avait proposé, elle ne
savait pas ce qui avait été fait.**

Trois choses en dépendent — la reprise du E.5, restée non détectée depuis le
début ; les niveaux du E.16, qui montent quand une séance est tenue ; et le
simple fait de pouvoir dire à l'athlète ce qu'il a fait plutôt que ce qu'il
avait prévu.

### Retrouver la séance dans ce qui a été fait

Trois moyens, dans cet ordre, et le premier qui répond gagne.

1. **Le lien d'intervals.icu.** Une activité porte `paired_event_id` quand elle
   a été démarrée depuis la séance planifiée. C'est intervals.icu qui apparie,
   pas Makigawa : on relaie, on ne devine pas.
2. **Le même jour, la même nature.** Une séance de vélo prévue mardi et un
   `Ride` de mardi sont la même chose. S'il y en a plusieurs, celle dont la
   charge est la plus proche.
3. **Rien.** Aucune activité ce jour-là qui puisse être cette séance.

**Un `EBikeRide` n'apparie jamais.** C'est la règle critique du projet : un
trajet électrique porte une charge, mais ce n'est pas une séance, et l'y voir
ferait passer un aller-retour pour un sweet spot tenu.

### Ce que la comparaison dit

Les deux charges viennent d'intervals.icu — celle qu'il a calculée depuis la
structure prévue, celle qu'il a mesurée sur l'activité. Makigawa n'en calcule
aucune, elle les met côte à côte.

| Réalisé | Verdict |
|---|---|
| 85 % ou plus du prévu | **tenue** |
| 50 à 85 % | **allégée** |
| moins de 50 %, ou rien | **absente** |

Quatre-vingt-cinq pour cent parce qu'une séance faite à ce niveau-là **est** la
séance : il y manque un retour au calme ou une répétition, pas le travail. En
dessous de la moitié, c'en est une autre.

### Ce que l'athlète en voit

**Ce qu'il a fait, jamais ce qu'il a manqué.** L'app liste les séances tenues
et allégées ; les absentes ne s'affichent nulle part. C'est la contrainte
d'interface prise au mot : une séance abandonnée disparaît, elle ne laisse pas
de trace rouge, et un compteur d'assiduité serait exactement la trace rouge que
le projet s'interdit.

Les absentes ne sont pas perdues pour autant : elles servent en interne, à ne
pas faire monter un niveau qu'on n'a pas gagné.

### Un trajet n'est jamais une séance, et le code doit le dire

Constaté le 7 septembre en relisant tout : le drapeau manquait. Un aller-retour
musculaire pèse 115, donc l'échelle du E.1 en faisait une **séance de qualité**
— et en mode prudent il consommait la seule séance de la semaine. L'athlète
allait au travail, et l'app en concluait qu'il s'était entraîné.

La règle critique du projet le disait depuis le début : *les trajets n'en sont
jamais, mais leur charge compte toujours*. Une séance planifiée porte désormais
la marque, et `isQuality` la lit avant tout le reste. Sa charge, elle, continue
de peser la journée comme n'importe quelle autre — c'est bien une journée
chargée, et le E.2 s'en écarte pour cette raison-là, pas parce qu'il la
prendrait pour un entraînement.

### La reprise, enfin détectable

Le E.5 attendait ceci depuis le début. Le compteur repart à zéro à chaque
**activité de qualité réalisée** — niveau 2 ou plus sur l'échelle du E.1, d'une
nature qui sollicite la filière aérobie.

**Les trajets ne le remettent pas à zéro**, comme le E.5 l'exige. L'électrique
est écarté par son type ; le musculaire l'est par son nom, `Hard Commute`, qui
est celui que l'athlète leur donne lui-même dans Garmin. C'est le seul point
faible de la détection, et il est assumé : un trajet musculaire non reconnu
remet le compteur à zéro, donc l'app ne passe pas en reprise. Elle en propose
alors autant que d'habitude — l'échelle de forme du E.10 continue, elle, de
tenir le plafond.

Au-delà de quatorze jours, la semaine **passe en prudent** — soit exactement
« une seule séance de qualité la première semaine ». Le mode se relâche de
lui-même dès qu'une séance de qualité est faite, puisque le compteur repart à
zéro ; le plafond de **+10 % par semaine** est alors tenu par le E.16, qui ne
propose qu'un cran de plus à la fois.

C'est le comportement que le E.5 demande, sans inventer une machine à états de
trois semaines dont rien ne dirait où elle en est. Et le mode forcé est celui
qu'affiche l'en-tête : le troisième garde-fou après le A.3 et le E.12, calculé
au même endroit qu'eux, de sorte que l'app ne puisse pas annoncer un mode et en
appliquer un autre.

## E.16 Les niveaux par zone

Demandé le 6 septembre 2026, première des cinq idées, empruntée aux
*Progression Levels* de TrainerRoad. C'est la vraie réponse à *« propose-moi
des séances pour m'améliorer »* : jusqu'ici l'app choisissait sur la CTL
seule, ce qui est grossier — la forme dit ce que le corps encaisse en général,
pas ce qu'il tient dans une zone donnée.

### Une zone, pas une famille

Les familles du E.9 se regroupent en six zones. Deux familles d'une même zone
partagent leur niveau, parce qu'elles construisent la même chose : tenir un
30/15 prouve quelque chose sur le 30/30.

| Zone | Familles |
|---|---|
| endurance | endurance |
| tempo | tempo |
| sweet spot | sweet spot, sweet spot continu |
| seuil | seuil |
| VO2 max | 30/30, 30/15 |
| anaérobie | navette lactate |

### D'où vient le niveau

**Il ne se stocke pas, il se lit.** Le niveau d'une zone est celui de la plus
grosse séance de cette zone que l'athlète a **tenue** ces six dernières
semaines (E.15). Rien n'est compté à part, rien ne dérive, rien n'est à migrer
le jour où le code change.

Ce qui mesure une séance est son **temps de travail** : les secondes passées
dans les blocs d'effort, récupérations et échauffement exclus. C'est ce que
Makigawa a le droit de compter — c'est de l'organisation, pas de la
physiologie. Les intensités, elles, restent celles des familles, relevées chez
l'athlète, et la FTP qui les résout reste celle d'intervals.icu.

Dix échelons par zone, parce que les zones ne se travaillent pas aux mêmes
durées : dix minutes de VO2 max sont beaucoup, dix minutes d'endurance ne sont
rien.

### Ce que le niveau décide

**La séance proposée vise un cran au-dessus de ce qui a été tenu.** Un cran,
pas deux : c'est la définition même d'une progression, et c'est aussi la seule
façon de rester sous le plafond de +10 % par semaine du E.5.

Trois choses le bornent, dans cet ordre :

1. **L'échelle de forme du E.10** décide des zones ouvertes. Un niveau élevé en
   VO2 max ne rouvre pas le VO2 max si la CTL est basse.
2. **La reprise du E.5**, quand elle s'applique, ramène au niveau tenu sans le
   cran supplémentaire. On reprend là où on s'était arrêté, on ne progresse pas
   le premier jour.
3. **Un plafond de temps**, parce que la contrainte de l'athlète n'est pas sa
   forme mais son agenda : deux enfants en bas âge. Aucune séance proposée ne
   dépasse soixante-quinze minutes, quel que soit le niveau atteint.

### Ce qui fait descendre un niveau

**Rien, sauf le temps.** Une séance manquée ne retire pas de niveau — ce serait
la trace rouge que le projet s'interdit. Un niveau retombe seulement parce que
la séance qui le portait sort de la fenêtre de six semaines, ce qui est
exactement la façon dont on perd une adaptation.

Six semaines, parce que la recherche de la partie A donne cet ordre de
grandeur : la force tient quatre à six semaines sans baisse notable, et le
VO2max se dégrade plus vite mais partiellement.

### Ce que les niveaux ne voient pas

**Les séances dont la famille n'est pas reconnaissable.** Le niveau est
attribué par le nom de la séance, celui que Makigawa écrit elle-même. Une
séance venue de la bibliothèque du coach, posée par l'app mais nommée
autrement, compte comme une séance tenue au sens du E.15 — donc pour la reprise
— mais ne fait monter aucun niveau.

C'est une sous-estimation, jamais une sur-estimation : l'app propose alors plus
doux que ce que l'athlète peut tenir. Le sens le moins risqué, comme pour le
pic du E.1.

## E.17 Le compagnon de trajet

Demandé le 6 septembre 2026, troisième des cinq idées. L'athlète fait six à
sept trajets par semaine et ils portent **60 à 100 % de sa charge
hebdomadaire** : c'est, de loin, la décision qu'il prend le plus souvent. Elle
se prenait sans l'app.

### La question, telle qu'elle se pose vraiment

Ce n'est pas *« est-ce que j'y vais ? »* — il y va de toute façon. C'est **tes
jambes, ou la batterie ?** Et la réponse a des conséquences réelles : un
aller-retour musculaire pèse 115, soit une journée chargée au sens du E.1 ; le
même trajet en électrique en pèse 35, et n'est jamais une séance.

Trois réponses, de la plus exigeante à la plus économe :

| Réponse | Charge | Niveau |
|---|---|---|
| Aller-retour musculaire | ~115 | 3 — journée chargée |
| Un seul des deux musculaire | ~58 | 2 — séance de qualité |
| Électrique | ~35 | 1 — jamais une séance |

Ce sont les relevés de l'athlète (E.13), pas des estimations.

### Comment l'app répond

**Avec le E.2, mot pour mot.** Elle propose la réponse la plus exigeante que la
question centrale accepte pour aujourd'hui : d'abord l'aller-retour, puis un
seul, puis l'électrique — qui passe toujours, puisqu'il n'est jamais une séance
de qualité.

Aucune règle nouvelle n'est écrite ici. Un trajet musculaire *est* une séance
de qualité dès qu'il atteint le niveau 2, donc les quatre conditions du E.2 s'y
appliquent déjà : la fraîcheur, la veille chargée, le voisinage d'une autre
séance, le quota de la semaine. C'est le même moteur, posé sur une autre
question.

### Ce qu'elle ne fait pas

- **Elle n'interdit rien.** Les trois réponses restent posables d'un tap ;
  l'app dit laquelle elle recommande et pourquoi, pas laquelle est permise.
- **Elle ne suppose pas les jours de travail.** Le bloc s'affiche du lundi au
  vendredi parce que ce sont des trajets domicile-travail ; le week-end, poser
  un trajet reste possible par le menu ordinaire. C'est un choix d'affichage,
  pas une règle sur la vie de l'athlète.
- **Elle ne culpabilise pas la batterie.** Prendre l'électrique un jour où le
  E.2 dit non est le bon choix, pas un renoncement — et c'est exactement ce que
  la règle critique du projet dit depuis le début : ces trajets portent la
  charge, ils ne sont pas l'entraînement.

### Révision du 7 septembre 2026 : l'athlète déclare, l'app en tient compte

La recommandation est **retirée**. L'athlète l'a dit en une phrase :

> *« On s'en fiche de mettre comment je vais au travail, puisqu'on n'est
> intéressé que par les résultats que la journée a donnés. »*

Il a raison, et la contradiction était dans le projet depuis le début : le
`CLAUDE.md` dit que les trajets **ne se posent pas, ils arrivent de Garmin**.
Leur recommander un mode revenait à prescrire ce que l'app observe.

Ce qui reste est bien plus utile : **marquer d'avance les jours de trajet**, et
en tenir compte dans le plan.

| Marque | Charge | Ce que la journée devient |
|---|---|---|
| électrique | 35 | légère — elle ne bloque rien |
| musculaire | 115 | chargée — le E.2 s'en écarte, et de ses voisins |
| aucun | 0 | une journée libre |

**Une marque par jour suffit** : l'athlète fait d'office l'aller et le retour de
la même manière. Distinguer les deux sens ajouterait un tap sans ajouter une
information.

**Les jours de semaine sont électriques par défaut**, parce que c'est ce que le
`CLAUDE.md` relève — « majoritairement en vélo électrique ». Ne rien compter
serait la pire des approximations : ces trajets portent 60 à 100 % de la charge
hebdomadaire, et un plan qui les ignore planifie dans le vide.

La marque **ne part pas dans intervals.icu** (E.19). C'est une intention, pas
une mesure ; ce qui a réellement été fait arrivera de Garmin, et c'est lui qui
comptera.

## E.18 La semaine de décharge

Demandé le 6 septembre 2026, quatrième des cinq idées. Le rythme 2:1 est
arrêté depuis le 5 septembre (C.0, décision 7) et décrit en C.4 — mais **l'app
ne l'a jamais proposé**. Une règle spécifiée que rien n'applique n'est pas une
règle.

### Ce qui compte comme semaine de charge

**Une semaine qui a porté au moins une séance de qualité tenue** (E.15). Deux
d'affilée, et la troisième est proposée en décharge.

Ce n'est pas le tonnage qui compte, ce sont les semaines d'entraînement. Le
tonnage dirait n'importe quoi ici : les trajets portent 60 à 100 % de la charge
hebdomadaire de l'athlète, donc une semaine où il n'a fait que rouler au
travail pèserait autant qu'une semaine de travail dur. Et avec un quota d'une à
deux séances de qualité par semaine, une semaine qui en a porté une **est** une
semaine de charge pour lui.

**Une semaine de décharge acceptée ne compte jamais comme semaine de charge**,
même si une séance y a été tenue. Sans quoi le cycle se mordrait la queue dès
la première décharge.

### Ce que la décharge change

Le C.4 dit : volume de qualité **−40 à −60 %**, une sortie courte gardée avec
un peu d'intensité, et les trajets qui continuent.

En termes de l'app :

- **Une seule séance de qualité** — le quota du mode prudent.
- **Moitié moins de travail**, à intensité inchangée : la séance proposée vise
  l'échelon du E.16 le plus proche de la moitié du temps de travail tenu. C'est
  le même arbitrage que le « réduire » du E.3, décision 6.
- **L'intensité ne baisse pas.** C'est ce qui remplace les « accélérations
  brèves » du C.4 : garder la famille et son motif suffit à ne pas s'éteindre,
  et cela évite d'inventer une séance qui n'existe nulle part.
- **Les trajets continuent.** On ne peut pas les arrêter, et ce n'est pas grave.

### Elle se propose, elle ne s'impose pas

Comme tout le reste (E.7). Un tap l'accepte pour la semaine en cours, un autre
l'écarte — et l'écarter ne la fait pas reposer le lendemain. Les deux vivent
dans le téléphone, jamais dans intervals.icu.

**Aucune séance retirée par une décharge ne compte comme manquée.** Le C.4 en
faisait déjà une règle d'interface autant que d'entraînement : une décharge est
une décision, pas un échec, et l'app ne la présente jamais comme une dette.

## E.19 Makigawa n'écrit plus, elle raisonne

Décidé le 7 septembre 2026, et cette décision **remplace** celles du 6 qui
faisaient de l'app un outil d'écriture — « poser une séance est du ressort de
Makigawa », la sortie ouverte créée par l'app, l'encodage en quelques taps.
L'athlète l'a dit ainsi :

> *« On s'est orienté vers quelque chose de trop complexe trop tôt. Il ne faut
> pas que Makigawa écrive dans intervals pour l'instant. […] Cette application
> ne doit pas implémenter quelque chose mais doit réfléchir par elle-même à
> augmenter la dose d'effort d'une manière chirurgicale afin de ne pas me
> blesser et de progresser. »*

### Ce que l'app fait désormais

Elle **lit** intervals.icu — les activités qu'y verse Garmin, la charge, la
forme, la fatigue — et elle **raisonne** : elle tient un plan de deux semaines,
le montre, et le corrige à chaque nouvelle lecture. Elle ne le pousse nulle
part.

Le plan vit dans l'app. C'est le renversement : jusqu'ici le calendrier
d'intervals.icu était la mémoire du plan et Makigawa y écrivait ; maintenant
c'est Makigawa qui tient le plan et intervals.icu qui tient la vérité de ce qui
a été fait.

### Pourquoi c'est mieux, et pas seulement plus simple

L'app construisait sa capacité d'agir avant sa capacité de juger. Or c'est la
lecture qui rend le jugement bon, et l'écriture ne fait que rendre une erreur
permanente : un mauvais plan poussé dans le calendrier se retrouve dans Garmin,
sur la montre, et se nettoie à la main.

Une app qui ne fait que proposer peut se tromper sans conséquence. C'est la
condition pour qu'elle apprenne à ne plus se tromper.

### La seule écriture qui reste

**Supprimer un événement.** C'est ce qui défait ce qui a déjà été écrit, donc
la seule écriture qui va dans le sens du retrait. Elle demande un appui long de
deux secondes — un geste qu'on ne fait pas par accident — et l'app ne
supprime jamais d'elle-même.

### Ce qui reste, et ce qui part

**Reste tout ce qui alimente ce que l'app montre** : le catalogue de familles,
la composition de séances, les niveaux par zone, la routine de souplesse et le
protocole du test FTP. Ils ne partent nulle part, mais ils s'affichent — et
c'est en s'affichant qu'ils servent.

**Part ce qui ne servait qu'à écrire** : la machinerie de décalage et de
réduction, la pose d'une séance de bibliothèque, la sortie ouverte. Du code
qu'aucun chemin n'atteint est un piège pour le prochain lecteur, et l'athlète
avait raison d'appeler ça de la complexité prématurée. Il se retrouve dans
l'historique du dépôt le jour où l'écriture reviendra.

Les trajets, eux, ne se posaient déjà pas : ils arrivent de Garmin. Sur ce
point rien ne change.

## E.20 La dose, et la vitesse à laquelle elle monte

C'est la part « chirurgicale » du E.19. Progresser, c'est en faire un peu plus
qu'avant ; se blesser, c'est en faire trop d'un coup. La différence entre les
deux n'est pas la quantité, c'est **la vitesse**.

### Ce qu'on mesure, et ce qu'on ne mesure pas

**La forme d'intervals.icu monte à une certaine vitesse.** La CTL d'aujourd'hui
moins celle d'il y a sept jours donne des points de forme par semaine. C'est
une soustraction sur deux nombres d'intervals.icu — la même arithmétique que la
fraîcheur, et le projet n'en fait pas d'autre.

Aucune charge n'est estimée ici. L'app ne sait pas ce que pèsera une séance
qu'elle propose — c'est intervals.icu qui le calcule depuis la structure — et
elle n'essaie pas de le deviner.

### Le plafond

**+10 % de la forme par semaine**, le chiffre du E.5, appliqué désormais tout
le temps et non plus seulement en reprise.

Un pourcentage plutôt qu'un nombre fixe, parce qu'il suit l'athlète : à une CTL
de 20 il autorise 2 points par semaine, à 45 il en autorise 4,5. C'est
exactement la fourchette que la littérature donne pour une montée soutenable, et
elle se resserre d'elle-même quand la forme est basse — c'est-à-dire quand les
tissus sont les moins prêts.

### Ce que le plafond change

Quand la forme monte **déjà** aussi vite que le plafond l'autorise, le plan
**tient son niveau** au lieu de le monter d'un cran (E.16). Rien n'est retiré,
rien n'est réduit : la semaine ressemble à la précédente, et c'est tout ce
qu'il faut. On ne progresse pas en ajoutant à ce qui monte déjà.

Les trajets comptent dans cette montée comme le reste, et c'est essentiel :
ils portent 60 à 100 % de la charge hebdomadaire de l'athlète. Une semaine de
six trajets musculaires fait monter sa forme sans qu'aucune séance ait été
faite — et le plafond doit le voir.

### Ce qu'il ne fait pas

- **Il ne fait pas redescendre.** Une montée trop rapide n'est pas une faute à
  corriger, c'est une raison d'attendre. Le plan garde son niveau jusqu'à ce
  que la vitesse retombe.
- **Il ne bloque pas une séance.** C'est le E.2 qui décide si un jour convient ;
  le plafond ne décide que du **niveau** de ce qu'on propose.
- **Il ne s'applique pas quand la forme est inconnue.** Sans deux relevés de
  CTL à sept jours d'écart, il n'y a pas de vitesse, et une donnée manquante ne
  se transforme jamais en interdiction.

## E.21 Ce que l'app garde, et ce qu'elle note

Trois ajouts du 7 septembre 2026, qui ne changent aucune règle mais changent ce
que l'app sait d'elle-même.

### Le pic, enfin mesuré

Le E.1 fait basculer une journée en chargée dès **deux minutes cumulées
au-dessus de 175 bpm**. Cette règle n'avait jamais fonctionné : `peakSeconds`
valait zéro, faute de courbe cardiaque.

L'app lit désormais la courbe de chaque activité récente —
`/activity/{id}/streams.json?types=heartrate` — et compte les secondes
au-dessus du seuil. C'est un comptage, pas une estimation : les battements
viennent de la montre, via intervals.icu, et le seuil est celui du E.1.

Trois précautions :

- **Une seule lecture par activité.** Le résultat est gardé dans le téléphone,
  indexé par l'identifiant de l'activité. Une courbe ne change jamais.
- **Quatorze jours en arrière**, pas six semaines : au-delà, une journée ne
  pèse plus sur aucune décision.
- **Un échec ne bloque rien.** Sans courbe, le pic reste à zéro et la journée
  pèse par sa charge seule — exactement le comportement d'avant.

Le sens de l'erreur change, et il faut le dire : jusqu'ici l'app
**sous-estimait** toujours. Elle mesure maintenant, et peut donc retenir une
séance qu'elle aurait proposée. C'est le but.

### Ce que l'app a refusé, et pourquoi

La phase 6 consiste à *observer les règles sur des semaines réelles, et
corriger les bornes plutôt que le code*. Encore faut-il voir les règles agir.

L'app tient donc un **journal de ses propres refus** : le jour, ce qui a été
écarté, et le motif. Rien d'autre.

C'est de l'instrumentation sur l'app, jamais sur l'athlète. Le journal
n'enregistre **aucune séance manquée**, aucun écart, aucune assiduité — il
n'enregistre que des décisions que Makigawa a prises. La différence n'est pas
cosmétique : l'un se relit pour corriger un seuil, l'autre serait la dette que
le projet s'interdit.

Il vit dans le téléphone, garde trente jours, et sert à répondre à une question
précise : la condition 2 du E.2, retenue avec réserve, bloque-t-elle vraiment
trop souvent ?

### La zone, lue sur la structure quand le nom ne dit rien

Le E.16 attribue la zone d'une séance tenue **par son nom**, celui que Makigawa
écrit. Une séance nommée autrement ne faisait monter aucun niveau.

À défaut de nom reconnaissable, l'app lit maintenant la **structure** : la plus
haute intensité tenue au moins vingt secondes désigne la zone, et la forme du
motif départage le sweet spot du seuil, qui se ressemblent en intensité. C'est
moins sûr qu'un nom, donc c'est un recours et non la règle — le nom garde la
priorité.

## E.22 Reconnaître la séance qu'elle a proposée

Défaut trouvé le 7 septembre 2026, et c'est le E.19 qui l'a créé.

Depuis que l'app n'écrit plus, ses propositions n'existent nulle part dans
intervals.icu. Or l'appariement du E.15 compare les **événements du
calendrier** aux activités : sans événement, rien à apparier. Conséquence
mesurée sur un cas réel — l'athlète fait exactement la séance proposée, Zwift
la verse dans intervals.icu, et l'app n'en voit rien.

Deux systèmes entiers étaient donc inertes :

- **les niveaux par zone (E.16)**, qui ne pouvaient plus jamais monter ;
- **le cycle 2:1 (E.18)**, qui compte les semaines ayant porté une séance
  tenue, et n'en aurait jamais compté aucune.

La reprise du E.5, elle, n'était pas touchée : elle lit les activités
directement.

### Se souvenir de ce qu'on a proposé

L'app garde ses propositions dans le téléphone — le jour, la famille, la zone,
la durée et le temps de travail. Six semaines, comme la fenêtre des niveaux.

Ce n'est pas une écriture au sens du E.19 : rien ne part vers intervals.icu, et
la mémoire ne sert qu'à se relire.

### Reconnaître qu'elle a été faite

Une proposition est **tenue** quand, le jour où elle était proposée, une
activité réunit trois conditions :

1. elle sollicite la filière aérobie et **n'est pas un trajet** ;
2. elle a duré au moins **85 %** du temps proposé — le même seuil que le E.15,
   appliqué à la durée ;
3. sa charge atteint le **niveau de qualité** du E.1.

Deux durées et une charge, toutes trois mesurées par la montre ou par
intervals.icu. Aucune n'est estimée par l'app — la règle du projet tient.

### La réserve, dite franchement

**C'est la première fois que l'app peut sur-estimer.** Une sortie libre d'une
heure, le jour où un sweet spot de quarante minutes était proposé, sera comptée
comme ce sweet spot, et fera monter le niveau de sweet spot.

Trois choses bornent le mal, et c'est ce qui rend la règle acceptable :

- le niveau ne monte que **d'un cran** (E.16) ;
- le plafond de montée du E.20 retient la progression si la forme grimpe déjà ;
- un niveau **retombe** si la séance qui le portait sort des six semaines, donc
  une attribution isolée s'efface d'elle-même.

L'alternative était de ne rien faire monter du tout, ce qui est faux à coup
sûr. Une erreur bornée et réversible vaut mieux qu'une certitude fausse.

### Le raccourci qui ferme la boucle autrement

Un bouton copie la structure d'une séance proposée dans le presse-papier,
prête à coller dans l'éditeur d'intervals.icu. C'est l'athlète qui écrit, pas
l'app : le E.19 tient.

Une séance ainsi posée devient un vrai événement du calendrier, donc le E.15
l'apparie comme n'importe quelle autre — sans aucune des réserves ci-dessus.
C'est le chemin le plus sûr, et l'app le laisse à portée de pouce.

## E.23 Une intention, pas une recette

Demandé le 7 septembre 2026, et c'est un recentrage plus qu'un ajout. L'athlète
l'a expliqué ainsi :

> *« Mon but avec ce planning est de voir un style de séance et une catégorie de
> charge à faire. Ensuite, je chercherai une séance plus ou moins équivalente
> sur Zwift. […] Pour les sorties plus longues, j'aimerais avoir un niveau de
> puissance à tenir en moyenne en fonction d'une distance, et avoir la charge
> équivalente. »*

L'app composait une séance bloc par bloc et la donnait à recopier. Ce n'est pas
ce dont il a besoin : il a besoin de **savoir quoi faire et combien**, puis de
trouver lui-même la séance qui y ressemble dans le catalogue de Zwift.

### Ce que l'app dit d'une séance

Trois choses, dans cet ordre : le **style**, la **dose**, et la **forme des
blocs**.

> **Sweet spot · 45 min · charge soutenue**
> 2 × 12 min en alternant 90 s à 95 % et 90 s à 85 %, récup 4 min

La notation complète disparaît de l'écran. Elle n'a jamais servi qu'à être
recopiée, et l'athlète ne recopie plus.

**Les pourcentages s'accompagnent de leur équivalent en watts** quand la FTP est
connue — `95 % (≈ 210 W)`. Zwift affiche des watts ; une intention illisible
dans l'unité de l'outil n'est pas une intention.

Ceci ne contredit pas la règle des watts, qui interdit d'**écrire** une
intensité en watts parce qu'elle se figerait. Ici la décision reste un
pourcentage, et le watt n'est qu'un affichage résolu par la FTP
d'intervals.icu : le jour du test, tout se recalibre sans qu'une seule séance
ne bouge.

### Ce que l'app dit de la dose

Deux mailles, parce que l'athlète les a demandées toutes les deux.

**La semaine**, qui est la maille à laquelle la charge s'accumule vraiment :

> Les trois dernières semaines : 310, 280, 340. Cette semaine, vise **325**.
> Déjà acquis : 140.

L'objectif est la moyenne des trois dernières semaines complètes, **plus 10 %**
— le même dix pour cent que le E.20, appliqué cette fois à la quantité sur
laquelle l'athlète peut agir. Et le plafond du E.20 garde le dernier mot :
quand la forme monte déjà trop vite, l'objectif **tient** au lieu de monter.

**Les jours qui viennent**, où le reste se répartit. Ce n'est pas un quota
quotidien : une journée sans rien ne crée aucune dette, le reste se
redistribue simplement sur les jours restants. La différence est celle que le
E.6 pose depuis le début — répartir n'est pas devoir.

Aucune charge n'est calculée ici. Les totaux hebdomadaires sont des **sommes de
charges quotidiennes d'intervals.icu**, et l'objectif est un pourcentage de
cette somme. C'est la même arithmétique que la fraîcheur, qui est une
soustraction.

### Ce que l'app dit d'une sortie longue

L'athlète part de la **distance** — c'est ainsi qu'il pense ses sorties.

> **50 km** — tiens environ **180 W** de moyenne.
> Tes sorties de 45 à 55 km autour de cette allure ont pesé **190 à 215**.

L'allure vient d'un pourcentage de FTP résolu comme ci-dessus. **La charge, elle,
n'est pas estimée : elle est lue dans l'historique de l'athlète.** Une formule
donnerait un nombre plausible ; ses propres sorties donnent le vrai, avec son
terrain, son vélo et son vent.

Quand l'historique ne contient rien de comparable, l'app ne dit rien plutôt
qu'un chiffre inventé. C'est la règle du projet, et c'est aussi la seule
réponse honnête.

## E.24 La FTP estimée

Décidé le 8 septembre 2026, en regardant ce que font les concurrents.

**Le test FTP est la seule case jamais cochée du projet.** Il l'est depuis le
premier jour, et le E.11 a beau savoir dire quel jour conviendrait, il ne s'est
toujours pas fait. Pendant ce temps toutes les séances sont écrites en
pourcentage d'une FTP de 221 W posée à la main, dont on sait depuis le
6 septembre qu'elle est probablement 8 % trop basse.

TrainerRoad a résolu ça en estimant la FTP à partir des efforts déjà produits,
plutôt qu'en attendant un test. **intervals.icu le fait aussi**, et l'app le
lisait déjà sans le savoir : la réponse de `/wellness` porte, par sport, une
FTP estimée à côté de la forme et de la fatigue. Makigawa rapatrie cette
réponse chaque jour et en garde le contenu brut.

**Donc l'app ne demande rien de plus. Elle lit ce qu'elle avait déjà.**

### Ce qu'elle en dit

Un seul énoncé, et seulement quand il y a quelque chose à dire :

> Ton profil dit **221 W**. Tes efforts disent **240 W**.
> Tes séances sont donc **8 % trop douces**.

Trois règles l'encadrent :

- **L'écart doit valoir la peine.** En dessous de 5 %, l'app se tait : c'est le
  bruit d'une estimation, pas une nouvelle.
- **Elle ne corrige rien.** La FTP du profil appartient à intervals.icu ;
  l'app la lit, la compare, et laisse l'athlète décider. C'est la frontière du
  projet, appliquée à la donnée la plus tentante à corriger.
- **Elle ne remplace pas le test.** Une estimation lue sur des efforts qui
  n'étaient pas maximaux reste un plancher, exactement comme les 175 W de juin,
  devenus 188 W le 9 septembre sans qu'aucun test ait été fait.
  Le E.11 garde son rôle ; l'estimation dit seulement s'il devient urgent.

### Pourquoi ça ne casse aucune règle

`CLAUDE.md` interdit qu'une règle métier dépende de la FTP, et cette interdiction
tient toujours : **l'estimation ne touche que l'affichage**. Les quatre
conditions du E.2 comparent des bpm bruts et des charges d'intervals.icu ; les
niveaux du E.16 comptent des secondes de travail ; la dose du E.23 somme des
charges. Aucun de ces trois n'a jamais vu une FTP, et aucun ne la verra.

**Et elle ne change même pas les watts affichés.** La tentation était là : le
E.23 affiche « 95 % (210 W) », et résoudre ce pourcentage par l'estimation
donnerait 228 W. Ce serait corriger la FTP sans le dire — exactement ce que la
règle du dessus interdit — et donner un nombre qui ne correspond à rien de ce
que l'athlète voit ailleurs, ni dans intervals.icu ni dans Zwift.

Les watts restent donc résolus par la FTP du profil. **L'estimation ne fait
qu'une chose : dire qu'il est temps de faire le test.** Elle se range à côté du
E.11, pas dans les séances.

### Quand elle est absente

L'estimation vient d'un champ qu'on n'a pas encore constaté sur la vraie
réponse. Le projet a une habitude pour ça : **lire prudemment, et ne rien
casser quand ce n'est pas là**. Sans estimation, l'app affiche la FTP du profil
comme elle le fait depuis le début. C'est exactement le comportement du pic
avant le E.21 — l'absence de donnée n'est jamais une panne.

## E.25 Les trois familles qui manquaient

Décidé le 8 septembre 2026, après avoir comparé le catalogue de l'app à celui
de TrainerRoad, de Zwift et de FasCat.

Les huit familles du E.9 sont **relevées sur les séances réelles de l'athlète**,
et c'est ce qui leur donne leur autorité. Trois trous s'y voient pourtant, et
chacun empêche l'app de répondre à une question qu'elle se pose elle-même.

### Récupération active

Il n'y a **rien sous l'endurance**. Le jour où il ne faut rien demander, le
catalogue n'a donc aucun mot — au mieux une endurance raccourcie, qui n'est pas
la même chose. Une demi-heure à 50 % ne construit rien et ne coûte rien ; c'est
précisément son intérêt, et aucune des huit familles ne le fait.

**Elle ne remplace pas la décharge du E.18**, qui garde son principe — moitié
moins de travail, intensité inchangée. Elle existe pour les jours où même ça
serait trop, et c'est l'athlète qui la prend, dans le catalogue du E.27. Le
plan la propose seulement quand il descend jusqu'au barreau le plus doux.

### Seuil continu

Le `seuil` de l'app n'existe qu'en **over-under** — 120 s à 95 %, 30 s à 110 %.
C'est bien le motif de l'athlète, et il reste. Mais le bloc continu — 2 × 20 min
à 98 % — est le motif le plus répandu du monde entier, et c'est celui qui
remplit les collections « Threshold » de Zwift. Tant qu'il manque, l'app ne peut
pas proposer ce que l'athlète trouvera le plus facilement.

### VO2 long

`vo2-30-30` et `vo2-30-15` sont des **intermittents** : le cœur reste haut, mais
trente secondes ne suffisent pas à installer la consommation maximale. Les blocs
de 3 à 5 minutes le font, et l'échelle de la zone `vo2` le montre en creux —
elle monte jusqu'à 1080 s de travail, toujours par tranches de trente secondes.

### Ce que cette décision coûte

**Ces trois motifs ne sont pas relevés chez l'athlète.** C'est une entorse à la
règle du E.9, et elle est assumée pour la même raison que la première : deux
familles y avaient déjà été ajoutées — endurance et tempo — parce qu'un
catalogue troué rend le plan incapable de répondre.

La limite reste la même. On ajoute une famille **quand un trou empêche une
règle de fonctionner**, jamais pour la variété. La quatrième candidate, les
sprints neuromusculaires, ne franchit pas ce test : l'anaérobie a déjà la
navette lactate, et rien dans le projet ne réclame un sprint isolé. Elle
n'est pas retenue.

### La zone de récupération

L'échelle des zones du E.16 en gagne une, la première : `recuperation`. Elle a
sa propre échelle de niveaux, et elle est **la seule dont on ne cherche pas à
monter**. Un niveau de récupération n'a pas de sens comme progression ; la zone
existe pour que le plan ait un mot à dire les jours où il ne faut rien
demander.

Conséquence sur le E.16 : la règle « la séance suivante vise un cran au-dessus »
**ne s'applique pas** à cette zone. Elle propose toujours la même chose.

## E.26 Dire ce que vaut le cran proposé

Décidé le 8 septembre 2026, emprunté aux *Difficulty Levels* de TrainerRoad.

Le E.16 sait deux choses qu'il ne dit pas : le niveau que l'athlète a **tenu**
dans une zone, et le niveau de la séance **proposée**. Il propose un cran
au-dessus sans jamais dire ce que ce cran vaut.

Or l'écart entre les deux est toute l'information. Un cran au-dessus d'un
niveau tenu la semaine dernière, ce n'est pas la même chose qu'un cran au-dessus
d'un niveau tenu il y a cinq semaines, ni qu'une proposition dans une zone où
rien n'a jamais été tenu.

**Quatre mots suffisent**, lus sur cet écart seul :

| Écart au niveau tenu | Ce que l'app dit |
|---|---|
| au niveau ou en dessous | **à ta portée** |
| un cran au-dessus | **productive** |
| deux crans | **un pari** |
| trois ou plus, ou rien de tenu | **inconnu** |

Ce n'est pas une mesure de plus : c'est une **soustraction** entre deux nombres
que l'app connaît déjà. Aucune donnée nouvelle, aucun appel supplémentaire.

**Ça sert au refus.** Le E.14 permet d'écarter une famille ou de repousser un
jour, mais l'athlète refuse à l'aveugle : rien ne lui dit si la proposition est
raisonnable ou ambitieuse. Un mot le lui dit, et le refus devient un choix.

**« Inconnu » n'est pas un avertissement.** Une zone où rien n'a été tenu est
une zone normale au début, et l'app ne doit pas en faire un reproche — ce serait
la culpabilisation que `CLAUDE.md` interdit. Le mot est descriptif : elle ne
sait pas, elle le dit.

## E.27 Où chercher, et tout le catalogue

Décidé le 8 septembre 2026.

### Le panneau indicateur

Le E.23 a fait de la proposition une **intention** : un style, une dose, la
forme des blocs. L'athlète va ensuite chercher l'équivalent dans Zwift. Cette
dernière étape, l'app la laisse entièrement à sa charge.

Elle n'a pourtant rien à inventer pour l'aider. **Zwift range ses séances dans
des collections qui portent exactement le même vocabulaire** que les zones du
projet : Recovery, Endurance, Tempo, Sweet Spot, Threshold, VO2 Max. Il suffit
de nommer la bonne, et de dire quoi y chercher :

> **Zwift → Workouts → Sweet Spot**
> vise ~45 min, des blocs de 10 à 15 min

Ce n'est pas une recette — la frontière du E.9 tient, l'app ne dicte toujours
aucun contenu. C'est un **panneau indicateur**, et il est du côté Makigawa de
la frontière : le *quand* et le *où*, jamais le *quoi*.

**L'app ne prétend pas que la séance existe.** Elle nomme un rayon, pas un
article. Si rien dans ce rayon ne ressemble à la dose proposée, c'est le
catalogue de Zwift qui décide, et l'athlète choisit au plus près — c'était déjà
sa méthode avant que l'app en parle.

### Parcourir soi-même

L'athlète ne voit jamais que ce qui lui est proposé. Les onze familles existent,
l'app en connaît le rôle, et rien de tout cela ne lui est accessible.

**Le catalogue s'ouvre.** Chaque famille avec ce à quoi elle sert, le niveau
tenu dans sa zone, et où la chercher dans Zwift. C'est le E.7 poussé d'un cran :
l'app propose, l'athlète confirme — et s'il n'est d'accord avec rien, il choisit
lui-même au lieu de refuser trois fois.

Ce n'est pas un éditeur de séance : rien ne s'y compose et rien ne s'y écrit. On
y lit ce que l'app sait déjà, dans l'ordre où elle le sait.


## E.28 La semaine se lit d'avance

Constaté le 8 septembre 2026, sur une remarque de l'athlète : la charge de la
semaine affichait **zéro** alors qu'il avait marqué ses trajets et que des
séances étaient posées dans son calendrier.

**Deux parties de l'app ne pesaient pas la même journée pareil.** Le E.2 lit la
charge d'un trajet marqué (E.13) et déclare la journée chargée ; la dose du
E.23, elle, ne comptait que les activités déjà remontées de Garmin. La même
journée valait 115 pour les règles et 0 pour la jauge.

Ce n'est pas un cas limite, c'est le cas ordinaire : **les trajets portent 60 à
100 % de la charge hebdomadaire**, ils se marquent d'avance, et une jauge qui
les ignore affiche zéro six jours sur sept.

### Ce que la semaine compte, jour par jour

| Le jour | Ce qui compte |
|---|---|
| Passé | **ce qui a été fait**, et rien d'autre |
| Aujourd'hui et après | **le plus grand des deux** : ce qui a été fait, ou ce qui est prévu |

**Le passé ne se projette pas.** Un trajet marqué mais non fait n'a rien pesé,
et c'est intervals.icu qui tient la vérité de ce qui a été fait (E.19). Une
semaine passée se lit donc exactement comme avant, ce qui garde l'objectif
comparable d'une semaine à l'autre.

**Aujourd'hui et après, le plus grand des deux plutôt que leur somme**, pour
deux raisons. Le trajet du matin peut être remonté quand celui du soir ne l'est
pas encore, et la marque vaut l'aller-retour : elle reste alors la meilleure
lecture des deux. Et additionner compterait deux fois ce qui n'a été fait
qu'une.

**Rien n'est estimé.** Les charges de trajet sont celles que l'athlète a
mesurées (E.13), celles des séances posées sont celles qu'intervals.icu a
calculées, celles des activités faites sont lues telles quelles. La jauge ne
fait que des sommes et une soustraction, comme tout le E.23.

### Ce qu'une proposition ne compte pas

**Une séance que Makigawa propose n'entre pas dans la semaine.** Deux raisons,
et la seconde suffirait :

- elle n'a **pas de charge** — intervals.icu la calculerait depuis la
  structure, et l'app ne lui envoie plus rien (E.19) ;
- elle **n'engage à rien**. L'app propose, l'athlète confirme (E.7). La compter
  d'avance ferait de chaque proposition une dette, ce que le projet s'interdit
  depuis le E.6.

C'est précisément à quoi sert « il reste X à placer » : les propositions sont
ce qui *remplit* ce reste, pas ce qui le consomme d'avance.

### Ce que la jauge montre

Deux parts plutôt qu'un seul nombre — **ce qui est fait**, et **ce qui est
prévu par-dessus**. Un seul total les confondrait, alors que la différence est
justement ce qui se lit d'un coup d'œil : ce qui est acquis, et ce sur quoi on
compte encore.

Le reste à placer se calcule sur les deux : ce sur quoi on compte n'est plus à
trouver.

### Ce que ça révèle

Quand les trajets marqués suffisent à couvrir l'objectif, la jauge le dit et le
reste tombe à zéro. **Ce n'est pas une erreur** : c'est le constat qui fonde
tout le projet, enfin visible à l'écran. Ses trajets font l'essentiel de son
entraînement ; ce qu'il ajoute par-dessus est sa marge de progression, pas le
gros de sa charge.


## E.29 Les trois bandes

Décidé le 8 septembre 2026, en regardant ce que l'app télécharge et jette.

Depuis le E.21, l'app lit la **courbe cardiaque entière** de chaque activité des
quatorze derniers jours. Elle en tire un seul nombre — les secondes au-dessus
de 175 bpm — et jette le reste. Compter dans trois bandes au lieu d'une est la
**même lecture**, déjà payée, déjà gardée dans le téléphone.

Et les bornes existent depuis le premier jour, dans les constantes athlète :

| Bande | Bornes | Ce que c'est |
|---|---|---|
| **Facile** | sous 150 bpm | `T_effort` : au-dessous, le corps n'est pas au travail |
| **Modéré** | 150 à 175 bpm | entre les deux seuils |
| **Dur** | au-dessus de 175 bpm | `T_haut` : le pic du E.1, inchangé |

**`T_effort` était une constante fantôme.** Elle figure dans `CLAUDE.md` depuis
le début, elle vient de l'esquisse de phase 2 abandonnée le 5 septembre, et
elle n'apparaissait nulle part dans le code. Elle retrouve ici un emploi, et
c'est le seul honnête : elle sépare un trajet électrique (~129 bpm) d'un
aller-retour musculaire (163 à 172 bpm), donc elle sépare bien le facile du
modéré.

### Un constat, jamais une cible

**L'app dit la répartition. Elle ne dit pas laquelle viser.** C'est délibéré, et
c'est ce que dit la littérature la plus récente : sur 41 études et 797
cyclistes entraînés, aucune différence significative entre polarisé et
non-polarisé ; une méta-analyse en réseau ne sépare pas non plus polarisé et
pyramidal. Le pyramidal conviendrait même plutôt mieux quand les heures sont
comptées, ce qui est le cas de l'athlète.

Afficher un objectif « 80 / 20 » serait donc **prendre parti là où la recherche
ne tranche pas** — exactement ce que la partie B du document reproche aux
raccourcis. La partie B garde ses sources ; le E.29 n'en tire aucune règle.

### Ce que ça sert vraiment

Le piège du cycliste peu disponible n'est pas de mal doser le polarisé : c'est
que **tout devienne modéré**. Jamais assez facile pour récupérer, jamais assez
dur pour progresser. Avec cinq trajets par semaine entre 129 et 172 bpm, c'est
le risque réel, et rien dans l'app ne permettait de le voir.

**Mesuré le 9 septembre 2026, et c'est exactement ça.** L'aller-retour
musculaire du jour tourne à 172 puis 163 bpm de moyenne : les deux trajets
tombent presque entiers dans la bande du milieu. Ce ne sont pas les trajets qui
sont mal faits — c'est qu'ils occupent à eux seuls la zone où l'on progresse le
moins, et c'est ce que les trois pourcentages servent à voir.

Trois pourcentages le montrent d'un coup d'œil. L'athlète en fait ce qu'il
veut : le document ne lui dit pas quoi en penser.

### Ce que le stockage devient

Le pic gardé par activité devient trois nombres. Les mesures déjà faites ne se
convertissent pas — une seconde au-dessus de 175 ne dit rien des deux autres
bandes — donc **elles sont abandonnées et l'app relit une fois**. C'est ce
qu'elle fait déjà à la première ouverture, et une demi-mesure fausserait la
répartition sans qu'on le voie.

Le E.1 ne bouge pas : le pic reste la bande dure, au même seuil.

## E.30 La variabilité

Décidé le 8 septembre 2026. C'est la deuxième donnée que l'app rapatriait sans
la lire, et de loin la plus utile.

**Les cinq conditions du E.2 regardent toutes en arrière** : la veille,
l'avant-veille, la fraîcheur — elle-même en retard, puisqu'elle se calcule sur
des charges déjà encaissées — le quota de la semaine, la charge du jour. Aucune
ne regarde comment le corps va **ce matin**. Le seul signal du jour est le
démenti de nuit du E.12, et c'est un tap.

Or Garmin pousse vers intervals.icu la fréquence cardiaque de repos, le sommeil
et la **variabilité nocturne (rMSSD)**, et tout cela arrive dans la réponse de
`/wellness` que l'app lit déjà chaque jour. Comme la FTP estimée du E.24 :
aucun appel supplémentaire.

### La méthode, et pourquoi c'en est une

La variabilité d'une seule nuit ne dit rien — elle bouge d'un jour à l'autre
pour vingt raisons. Ce qui dit quelque chose est **sa moyenne glissante sur
sept jours**, comparée à la normale de l'athlète lui-même :

1. Chaque jour, le **logarithme naturel** du rMSSD. La mesure est asymétrique ;
   son logarithme ne l'est pas, et c'est la forme sous laquelle la littérature
   la traite.
2. La **moyenne glissante sur sept jours** de ce logarithme : la normale du
   moment.
3. Sur les vingt-huit dernières moyennes glissantes, leur **moyenne et leur
   écart-type** : la ligne de base.
4. Le seuil est **la moitié d'un écart-type** sous cette ligne — le plus petit
   changement qui vaille la peine d'être noté.

Sous ce seuil, l'app ne propose pas d'intensité. Au-dessus, rien ne change.

**Rien n'est calculé qui ne soit mesuré.** Un logarithme, une moyenne, un
écart-type, une comparaison — la même arithmétique que la fraîcheur, qui est
une soustraction. La variabilité vient de la montre, via intervals.icu.

L'essai qui fonde la méthode a comparé, chez des cyclistes, un plan guidé par
la variabilité à un plan fixe : puissance maximale, puissance au second seuil
et contre-la-montre de quarante minutes, tous trois meilleurs dans le groupe
guidé.

### Une sixième condition au E.2

Elle a la même forme que les cinq autres — un motif nommé, un refus, aucune
dette — avec deux réserves qui lui sont propres.

**Elle ne s'applique qu'à ce qui demande de l'intensité.** Un trajet n'est
jamais refusé, une endurance ni une récupération non plus. Une variabilité
basse dit « pas d'intensité aujourd'hui », jamais « ne bouge pas ».

Reconnaître ce qui en demande prend deux formes, parce qu'il y a deux sortes de
séances. Celle qui vient d'intervals.icu porte une charge, et le E.1 tranche.
Celle que **Makigawa compose n'en a pas** — intervals.icu la calculerait depuis
la structure, et l'app ne lui envoie plus rien (E.19) — donc elle le **déclare**
elle-même, d'après sa zone. Sans cette déclaration, la règle n'aurait écarté
que ce qui vient d'ailleurs, c'est-à-dire à peu près rien.

**Et le plan redescend au lieu de disparaître.** Le planificateur ne propose
plus, ce jour-là, que les deux zones qu'on peut faire quand le corps n'est pas
prêt. Sans ce repli il proposait ses familles habituelles, la règle les refusait
toutes, et l'app affichait « rien de prévu » — ce qui se lit « ne bouge pas »,
exactement ce que la règle ne dit pas.

**Elle ne parle qu'au-dessous.** Une variabilité au-dessus de la normale ne
donne aucune permission supplémentaire : le plan ne devient pas plus ambitieux
parce qu'une nuit a été bonne. Le projet monte de 10 % par semaine (E.20), et
cette limite-là ne se négocie pas contre une mesure du matin.

### Tant que la base n'est pas faite

**L'app se tait, et dit combien de jours il lui manque.** Il faut quatorze
moyennes glissantes pour qu'un écart-type veuille dire quelque chose, donc une
vingtaine de nuits mesurées. Avant cela, la condition ne se déclenche jamais et
le plan se comporte exactement comme avant.

C'est la même prudence que partout : sans donnée, l'app ne devine pas. Et c'est
une raison de commencer à mesurer tôt plutôt que d'attendre d'en avoir besoin.

### Ce qui n'est pas repris

**Le Body Battery et le Training Readiness de Garmin** arrivent dans la même
réponse et ne sont pas lus. Ce sont des scores propriétaires dont la formule
n'est publiée nulle part, et le projet s'interdit les chiffres qu'il ne
comprend pas — c'est la règle qui interdit déjà de recalculer une charge. Les
afficher serait sans danger ; les faire décider ne l'est pas.

**La fréquence cardiaque de repos** est lue pour rien de plus qu'un affichage.
Elle dérive lentement et dit à peu près ce que dit la variabilité, en moins
sensible ; en faire une seconde condition ajouterait du bruit, pas du signal.


## E.31 La météo du trajet

Demandé le 9 septembre 2026. L'athlète fait six à sept trajets par semaine entre
Stockel et Wavre, aller le matin et retour le soir, et il s'habille avant de
partir sans savoir ce qu'il va rencontrer.

### Un second tiers, et pourquoi celui-là

Jusqu'ici l'app ne parlait qu'à intervals.icu. Ajouter une source est une
décision de sécurité autant que de fonction, et **une seule candidate passe les
règles du projet** : `api.open-meteo.com`.

- **Aucune clé.** C'est la condition qui élimine tout le reste. Une clé
  météo dans le bundle serait exactement ce que la section Sécurité interdit —
  le préfixe `VITE_` l'embarquerait dans le JavaScript servi au navigateur, et
  une app sans serveur n'a nulle part où la cacher.
- **Rien de personnel ne part.** La requête porte des coordonnées et des dates.
  Pas d'identifiant, pas de clé intervals.icu, pas d'activité.
- **Des coordonnées fixes, pas la géolocalisation.** Le trajet ne bouge pas ;
  demander la position du téléphone ajouterait une permission et une surface de
  vie privée pour un renseignement qu'on a déjà. La route est une constante
  athlète, au même titre que la FCmax.

### Les deux fenêtres

Le trajet du matin part **entre 8 et 9 h**, celui du soir **entre 17 et 18 h**.
L'app lit ces deux tranches, et rien d'autre : la météo de midi ne le concerne
pas, il est au bureau.

Sur les deux heures d'une fenêtre, elle retient **ce qu'il va rencontrer de plus
défavorable** — la température la plus basse, la probabilité de pluie la plus
haute, la rafale la plus forte. Une moyenne lisserait précisément l'averse
contre laquelle on s'habille.

### L'horizon, et son honnêteté

Le plan couvre quatorze jours, **la météo n'en couvre que sept**. Au-delà, une
prévision ne dit plus rien d'utilisable pour choisir une veste, et l'afficher
donnerait à une supposition l'apparence d'un renseignement. Les jours sans
prévision n'affichent rien — c'est la règle du projet, appliquée à une
troisième donnée.

### Ce que ça ne devient pas

**La météo ne décide rien.** Elle ne déplace pas une séance, ne change pas une
proposition, n'entre dans aucune des six conditions du E.2. Une pluie annoncée
ne fait pas d'un mardi un mauvais jour pour du seuil — la séance est à
l'intérieur, et un trajet se fait sous la pluie comme il se fait au sec. Elle
s'affiche, et c'est tout.

## E.32 Comment s'habiller

La suite immédiate du E.31, demandée en même temps : un chiffre de température
ne dit pas quoi mettre.

### Sur quelle température

**Sur la température ressentie, pas sur la température de l'air**, et elle est
lue chez Open-Meteo (`apparent_temperature`) plutôt que calculée. Elle intègre
déjà le vent et l'humidité ; la recalculer serait refaire moins bien ce que le
fournisseur fait, et le projet ne recalcule pas ce qu'il lit.

### Les bandes

**Leurs bornes sont celles des guides d'habillement du cyclisme**, qui
s'accordent : manches courtes au-dessus de 20 °C, manchettes ou gilet de 16 à
20, sous-vêtement avec manchettes et jambières de 8 à 16, et le thermique en
dessous de 8. Elles ne sont pas inventées, et elles ne sont pas négociables au
caprice : ce sont des repères publiés.

| Ressenti | Ce que ça demande |
|---|---|
| **20 °C et plus** | maillot manches courtes, cuissard |
| **16 à 20** | manches courtes, manchettes ou gilet coupe-vent, cuissard |
| **8 à 16** | sous-vêtement technique, manches longues, cuissard, jambières, gants légers, couvre-orteils |
| **3 à 8** | sous-vêtement thermique, manches longues, collant thermique, gants, tour de cou, couvre-chaussures |
| **sous 3** | sous-vêtement thermique, manches longues, collant thermique, veste coupe-vent, gants d'hiver, tour de cou d'hiver, couvre-chaussures d'hiver, sous-casque |

**Une seule borne est ajoutée par le projet, celle de 3 °C.** Les guides
s'arrêtent à « sous 8 °C » ; à Bruxelles cela couvre tout l'hiver, et un matin
à 1 °C ne demande pas la même chose qu'un matin à 7. La coupure ne change rien
au-dessus de 8.

#### Révisé le 9 septembre 2026, en confrontant la table à un placard réel

L'athlète a donné sa garde-robe pièce par pièce. Quatre choses sont ressorties,
et la première est un défaut.

**« Tout cela » ne se programme pas, et le code ne l'a pas suivi.** La ligne
« sous 3 » disait *tout cela, plus la veste* ; l'implémentation a écrit une
liste, et cette liste a perdu en route le **maillot manches longues** et le
**tour de cou**. À −2 °C l'app habillait donc le cou nu, avec une sous-couche
sous une veste et rien entre les deux — alors que la même ligne finissait par
« rien de découvert ». Les cinq lignes sont désormais **explicites**, sans
renvoi à la précédente : une bande dit tout ce qu'elle demande.

Ce que la substitution garde de légitime : les gants deviennent des gants
d'hiver, le tour de cou et les couvre-chaussures passent à leur version
d'hiver. **Une pièce remplacée par sa version plus chaude, oui ; une pièce qui
disparaît quand il fait plus froid, non.**

**Le même défaut touchait le cuissard**, et il a été trouvé en écrivant le
garde-fou plutôt qu'en relisant. Il ne figurait qu'au-dessus de 20 °C, et rien
ne le remplaçait avant le collant à 3 °C : entre 8 et 20, l'app ne nommait donc
**aucun bas**. Les jambières se portent pourtant par-dessus un cuissard, elles
ne le remplacent pas. Il figure désormais dans les trois bandes qu'il concerne,
et c'est le collant qui le remplace en dessous de 3 — une vraie substitution,
celle-là.

**Un test tient la règle** : entre deux bandes voisines, toute pièce de la plus
douce doit ou bien rester, ou bien avoir une version plus chaude nommément
déclarée. Aucune ne peut simplement s'évaporer.

**Les pieds n'existaient qu'en dessous de 3 °C.** Les mains avaient trois
crans — légers, fermés, hiver — et les pieds un seul. Rien ne justifiait
l'asymétrie : les couvre-orteils servent de 8 à 16 °C, les couvre-chaussures de
3 à 8. Le mécanisme n'est pas nouveau, il est seulement appliqué là aussi.

**Le tour de cou se dédouble** pour la même raison que les gants : un cache-cou
de mi-saison et un d'hiver ne sont pas la même pièce.

**Il manquait un bas de pluie.** C'est le manque qui coûtait le plus cher — la
pluie retire sept degrés, la plus grosse correction du dispositif, et elle
n'habillait que le haut du corps. Voir la correction de pluie plus bas.

### Les deux corrections, et leur sens

**Un trajet électrique retire trois degrés au ressenti.** C'est contre-intuitif
et c'est pourtant le sens juste : les guides sont écrits pour du vélo
musculaire, donc ils supposent déjà la chaleur d'un effort. L'assistance en
produit moins, et **les propres chiffres de l'athlète le disent mieux que la
littérature** : 129 bpm en électrique contre 160 en musculaire, 35 de charge
contre 115, soit à peu près moitié moins de chaleur produite. Le musculaire ne
corrige rien, puisque c'est la référence des guides.

**C'est le seul nombre estimé de tout le dispositif**, et il est reconnu comme
tel. La direction est publiée ; la grandeur ne l'est nulle part. Trois degrés,
donc, **délibérément moins que la bande de pluie** — celle-ci vaut sept degrés
et elle est mesurée, celle-là est une estimation. Se tromper vers le chaud est
la faute la plus coûteuse : on part frais exprès, et on se change au bureau.

**En degrés et non en bandes, et cela compte.** Un premier essai sautait une
bande entière : douze degrés en électrique ressortaient en tenue d'hiver, tour
de cou compris, ce qui se voyait à l'écran dès la première capture. Une bande
vaut cinq à huit degrés ; l'appliquer partout fait le même écart à 19 °C, où
l'assistance ne change rien à ce qu'on met, et à 11 °C, où elle change tout.

**La pluie, elle, en retire sept**, et ajoute l'imperméable. Ce n'est pas une
estimation du projet : les guides le disent tel quel — *douze degrés sous la
pluie en valent cinq*, ce qui fait bien monter d'une bande. L'imperméable
s'ajoute sans que rien ne soit compté deux fois, puisque les guides
recommandent les deux ensemble. Le vent est déjà dans la température ressentie
et n'entre pas ici.

**Depuis le 9 septembre 2026, elle ajoute aussi le bas de pluie.** La
correction valait sept degrés et n'habillait pourtant que le buste : c'était le
plus gros déséquilibre du dispositif. Les deux pièces s'ajoutent ensemble et
**à toute température**, comme l'imperméable le faisait déjà seul — ce qui se
justifie mieux ici qu'ailleurs, puisqu'il ne s'agit pas de rouler mais
d'**arriver au bureau**. Arriver les jambes trempées est précisément le
problème que ce bas résout, et il le résout à 18 °C comme à 4. L'athlète
confirme ou non, comme pour le reste.

### Une seule échelle, et l'écran dit les deux nombres

**Les deux corrections se comptent en degrés sur le même ressenti**, et le
nombre qui en sort est celui qui choisit la bande. Un premier essai mélangeait
les deux mécaniques — des degrés pour l'assistance, un saut de bande pour la
pluie — et l'écran affichait alors « comme pour 5° » à côté d'une tenue de
grand froid. Les deux nombres se contredisaient, ce qui est pire que de se
tromper : l'app ne savait plus dire ce qu'elle faisait.

Le ressenti annoncé s'affiche tel quel — l'app ne maquille pas un thermomètre.
Quand une correction l'écarte de ce pour quoi on s'habille, la ligne de tenue
le dit : « comme pour 9° : en électrique tu chauffes moins ». Sans ce pont,
« 12° » à côté d'une tenue de 9° passe pour une erreur de l'app plutôt que pour
la correction qu'elle est.

### Ce que la bande ne dit qu'une fois

La bande la plus large des guides couvre huit degrés : un matin à 12 °C et un
soir à 18 en tombent tous deux dans la même. Réimprimer la liste ne dirait rien
de plus que « rien à changer », donc le soir affiche **« même tenue qu'au
matin »**. C'est la même économie que la jauge de journée, qui ne met un mot
que sur la journée chargée.

### « Il est normal d'avoir un peu froid au départ »

C'est la formulation de l'athlète, et c'est aussi celle des guides : *dress for
fifteen minutes in, not the car park*. L'app le dit, une fois, plutôt que de
laisser croire à une erreur de sa part — sans quoi elle serait corrigée à la
hausse chaque matin et l'athlète arriverait trempé de sueur.

### Ce qu'il faut emporter

L'athlète se change au bureau, **mais ne peut pas transporter grand-chose**.
Quand les deux fenêtres tombent dans la même bande, il n'y a rien à dire. Quand
elles diffèrent, l'app nomme **ce que le soir demande en plus du matin**, et
rien d'autre : c'est cela seul qui doit tenir dans le sac.

Elle ne fait pas de liste de valise. Elle ne dit pas non plus de retirer une
couche le soir — enlever ne se transporte pas.

### D'où viennent ces nombres

Relevés le 9 septembre 2026, sur les guides d'habillement du cyclisme. Ils
s'accordent à un ou deux degrés près, ce qui est précisément pourquoi le projet
les prend tels quels au lieu d'en inventer :

- Cycling Weekly, *What to wear cycling: a temperature-by-temperature dress
  guide* — les bornes de 20 et 8 °C, et « manchettes et gilet règlent 80 % du
  problème entre 10 et 20 ».
- POC, *How to dress for cycling by temperature*, et Pactimo, *Cycling
  clothing: what to wear in different temperatures* — le découpage 8-16 °C.
- Down the Road, *What to wear cycling by temperature* — « douze degrés sous la
  pluie en valent cinq, monte d'une bande » ; c'est la source de la correction
  de pluie, et la seule des deux corrections qui soit publiée.
- Tenways et Heybike, guides d'habillement pour vélo à assistance — la
  **direction** de la correction électrique : moins de chaleur produite, donc
  se couvrir davantage. Aucun ne la chiffre, d'où les trois degrés estimés du
  projet.

Tous répètent la même chose sur le départ : *dress for fifteen minutes in, not
the car park*.

### La garde-robe — le second temps

Demandé en même temps que le reste, et livré le 9 septembre 2026.

**L'app fournit les catégories, l'athlète fournit les pièces.** C'est la seule
répartition qui respecte sa consigne — *ne rien inventer, ne rien proposer au
hasard*. Les catégories sont exactement celles que nomment les guides, celles
dont les bandes se servaient déjà ; ce qu'il possède dans chacune, lui seul le
sait, et il le dit dans l'écran « Ma garde-robe ».

Une liste pré-remplie aurait été l'erreur : elle aurait mis dans son placard
des affaires qu'il n'a pas, et l'app se serait mise à conseiller des
couvre-chaussures imaginaires.

#### Amendé le 9 septembre 2026 : ce que « pré-remplie » interdisait vraiment

L'athlète a fini par donner ses pièces, une par une, en photos et en listes.
Elles sont dans `docs/garde-robe.md`, et l'app démarre désormais **avec**.

Ce n'est pas un revirement, parce que **la règle ne portait pas sur le
remplissage, elle portait sur son auteur**. Ce qui était interdit, c'est que
l'app *devine* — qu'elle décide qu'il possède des couvre-chaussures parce que
la plupart des cyclistes en ont. Ce qui est écrit maintenant vient
intégralement de lui : chacun des vingt noms a été relevé sur ses photos ou sa
liste. Aucun n'a été supposé, et le seul qui a failli l'être — un sous-vêtement
mi-saison poussé dans la case thermique — a été refusé après vérification chez
le fabricant, avant qu'il ne nomme la bonne pièce le lendemain.

Trois garde-fous tiennent la frontière, et un test tient chacun :

- **Une fois par version.** La déclaration porte un numéro ; elle n'est posée
  qu'une fois pour ce numéro. Le monter la repose, et **seulement sur un
  placard vide** — c'est ainsi que le défaut du 9 septembre a pu être rattrapé
  sans que personne n'y perde une réponse.
- **Il gagne toujours.** Une seule réponse enregistrée, fût-ce « je n'ai pas
  cette pièce », et rien n'est réécrit — d'une version à l'autre comprise.
  C'est ce qui distingue une valeur de départ d'une valeur imposée.
- **Rien ne s'invente en chemin.** Le vocabulaire reste celui des guides, la
  déclaration ne peut nommer que des catégories existantes, et un test compte
  qu'elle en couvre exactement vingt — le document et le code ne peuvent plus
  annoncer deux chiffres différents.

#### Le défaut du 9 septembre, et ce qu'il apprend

La première version posait la déclaration si le téléphone ne portait **aucun
enregistrement**. Or ouvrir l'écran de garde-robe et quitter un champ vide
appelle `forget`, qui enregistre `{}` — et `localStorage` en rend la *chaîne*
« {} », vraie en JavaScript. Un placard vide passait donc pour un placard
rempli, et l'athlète a vu « 0 sur 20 » après le déploiement.

Deux leçons, et la seconde est la vraie :

- **Compter les réponses, jamais la présence d'un enregistrement.** « Il a
  répondu quelque chose » et « quelque chose est écrit » ne sont pas la même
  question.
- **Une marque sans version condamne le téléphone qu'elle a marqué.** La marque
  était posée avant la vérification, donc le téléphone se retrouvait marqué
  *et* vide, sans recours. Toute décision qu'on ne prend qu'une fois doit
  pouvoir être reprise ; c'est à cela que sert le numéro.

Ce qui n'a pas bougé : l'app n'a toujours **aucun avis** sur ce qu'il devrait
posséder. Elle ne conseille pas d'achat, ne remplace pas une pièce manquante
par une autre, et ne déplace aucune bande. Le fait que les vingt cases soient
aujourd'hui remplies ne change rien à cela — le jour où il en videra une, elle
reprendra son nom générique et l'app continuera de la proposer, sans un mot de
plus.

**Elles sont vingt depuis le 9 septembre 2026**, et non plus seize. Les quatre
ajoutées — bas de pluie, couvre-orteils, couvre-chaussures d'hiver, tour de cou
d'hiver — ne sortent pas d'une envie de complétude : elles sortent du placard
réel de l'athlète, où quatre pièces n'avaient aucune case. **C'est le sens de
lecture qui compte** : la garde-robe n'a pas été pliée pour entrer dans les
catégories, ce sont les catégories qui ont été corrigées là où elles
décrivaient mal ce qu'il porte. Une pièce qu'il ne possède pas ne crée pas de
catégorie ; une catégorie qu'il remplit et que l'app n'avait pas, si.

Le relevé lui-même est dans **`docs/garde-robe.md`** : les vingt pièces avec
leurs références, les arbitrages là où plusieurs candidats se disputaient une
case, et ce qui reste délibérément hors des catégories. **Ce document n'est lu
par aucune ligne de code** — ce serait la liste pré-remplie que le E.32
interdit. C'est une trace, pour recopier sans rechercher et pour racheter sans
se tromper de modèle.

**Trois réponses par catégorie, et la troisième compte autant que les deux
autres.**

| Ce qu'il répond | Ce que l'app en fait |
|---|---|
| Il **nomme** sa pièce | C'est son nom qui s'affiche dans le plan : « gants Rogelli noirs », pas « gants légers » |
| Il déclare **ne pas l'avoir** | Elle **cesse de la proposer**, et le dit — « il te manque : jambières » |
| Il **ne dit rien** | La pièce garde son nom générique, ce qui est le comportement du premier temps |

Une garde-robe vide ne casse donc rien : c'est l'état de départ, et l'app
conseille pendant ce temps-là comme elle le faisait avant l'écran.

### Ce qu'une pièce manquante ne déclenche pas

**Aucun remplacement.** L'app ne sait pas si son coupe-vent vaut un
imperméable, et le supposer serait exactement ce qu'elle s'interdit ailleurs.
Elle retire la pièce de la tenue, la nomme à part, et s'arrête là.

**Aucun conseil d'achat.** Elle n'a pas d'avis sur ce qu'il devrait posséder,
seulement sur ce qu'il fait froid. Un test lit le bloc du jour et refuse le
moindre « achète » ou « il te faudrait ».

**Aucun changement de bande.** Les degrés décident, la garde-robe ne fait que
filtrer ce qui en sort. Une pièce absente ne réchauffe ni ne refroidit le
raisonnement.

### Ce que le sac va peser

Chaque catégorie porte un encombrement — **poche** ou **sac** — parce que
l'athlète se change au bureau mais ne transporte pas grand-chose. Quand ce que
le soir demande en plus tient dans une poche, l'app le dit ; sinon elle se
tait, parce qu'elle ne connaît ni la taille de son sac ni ce qu'il y met déjà.
C'est tout ce qu'elle peut affirmer honnêtement d'un encombrement.

### Ce qui reste hors de portée

**Elle ne sait pas ce qu'il a déjà porté cette semaine**, ni ce qui est au
lavage. Une garde-robe dit ce qu'on possède, pas ce qui est propre, et l'app
n'a aucun moyen de l'apprendre sans le lui demander tous les jours — ce qui
serait un compteur de plus, exactement ce que le projet refuse.


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
| 8 | Saisie « nuit difficile » | **oui**, un seul tap, en démenti du score de la montre |
| 9 | Retours automatiques | **imposés** pour le 3ᵉ « ambitieux », suggérés ailleurs |

Des précisions s'y sont ajoutées, le même jour puis le lendemain :

| # | Question | Décision |
|---|---|---|
| 10 | Reconnaître une séance de qualité | **par sa charge prévue**, sur une échelle à cinq niveaux (E.1) |
| 11 | Durée minimale du pic | **2 minutes** cumulées au-dessus de 175 bpm |
| 12 | Autonomie de l'app | **elle propose, l'athlète confirme** (E.7) |
| 13 | Sorties extérieures sans structure | **la sortie ouverte** : une charge visée, pas de blocs (E.8) |
| 14 | Qui compose les séances | **Makigawa les assemble**, sur des motifs relevés chez l'athlète ; les chiffres restent à intervals.icu (E.9) |
| 15 | Qui fait le planning | **Makigawa le propose**, selon la forme et la fatigue ; l'athlète accepte (E.10) |
| 16 | Le test FTP | **un seul jour proposé**, sous quatre conditions plus strictes que le E.2 (E.11) |
| 17 | Effet du démenti de nuit | **force le mode prudent pour la journée**, rien de plus (E.12) |
| 18 | Trajets et souplesse | **se posent d'avance**, sans structure ; la souplesse au niveau 0 (E.13) |
| 19 | Refuser une proposition | **deux gestes** — écarter la famille, ou repousser le jour ; le plan est recalculé en entier (E.14). *Révisé le 9 septembre* : repousser offre « demain » ou une liste de jours, et le jour choisi est un souhait que l'app honore ou explique |
| 20 | Savoir ce qui a été fait | **le lien d'intervals.icu d'abord**, le jour et la nature ensuite ; 85 % du prévu vaut tenue (E.15) |
| 21 | Progresser | **un niveau par zone**, lu sur le temps de travail tenu en six semaines, et la séance suivante vise un cran au-dessus (E.16) |
| 22 | Le choix du trajet | **le E.2 y répond**, sur trois réponses relevées : aller-retour musculaire, un seul, ou électrique (E.17) |
| 23 | Déclencher la décharge | **deux semaines qui ont porté une séance tenue**, et la troisième est proposée en décharge (E.18) |
| 24 | Ce que l'app écrit | **plus rien, sauf supprimer** ; le plan vit dans Makigawa, la vérité dans intervals.icu (E.19) |
| 25 | La vitesse de montée | **+10 % de forme par semaine**, lu sur la CTL ; au plafond, le plan tient son niveau (E.20) |
| 26 | Les trajets dans le plan | **l'athlète les marque d'avance**, électrique ou musculaire ; l'app n'en recommande plus aucun (E.17, révisé) |
| 27 | Le pic et le journal | **le pic se mesure** sur la courbe cardiaque ; l'app note ses propres refus, jamais les séances manquées (E.21) |
| 28 | Reconnaître une séance proposée | **par le jour et la durée** — 85 % du temps proposé et une charge de qualité ; seule sur-estimation acceptée du projet, et elle est bornée (E.22) |
| 29 | Ce que le plan dit | **un style, une dose, la forme des blocs** — plus de notation à recopier ; les watts sont affichés, jamais décidés ; la charge d'une sortie se lit dans l'historique (E.23) |
| 30 | La FTP estimée | **lue sur `/wellness`**, comparée au profil, jamais corrigée ; elle ne touche que l'affichage (E.24) |
| 31 | Les trous du catalogue | **trois familles ajoutées** — récupération active, seuil continu, VO2 long ; une famille s'ajoute quand un trou bloque une règle, jamais pour la variété (E.25) |
| 32 | La difficulté d'une proposition | **l'écart au niveau tenu**, dit en un mot : à ta portée, productive, un pari, inconnu (E.26) |
| 33 | Trouver la séance | **le rayon, pas l'article** : l'app nomme la collection Zwift et la dose ; le catalogue s'ouvre pour choisir soi-même (E.27) |
| 34 | La charge de la semaine | **ce qui est fait plus ce qui est prévu** — le passé ne se projette pas, et une proposition ne compte jamais d'avance (E.28) |
| 35 | La répartition d'intensité | **trois bandes lues sur la courbe déjà téléchargée** — 150 et 175 bpm ; un constat, jamais une cible (E.29) |
| 36 | La variabilité | **moyenne glissante sur 7 jours du ln(rMSSD)**, comparée à une demi-écart-type sous la ligne de base ; sixième condition du E.2, muette tant que la base n'est pas faite (E.30) |
| 37 | La météo du trajet | **Open-Meteo, sans clé**, sur les fenêtres 8-9 h et 17-18 h ; sept jours au plus, et elle ne décide rien (E.31) |
| 38 | Comment s'habiller | **des bandes de ressenti relevées dans les guides** (20 / 16 / 8) ; deux corrections en degrés sur la même échelle — trois pour l'électrique, le seul nombre estimé, sept pour la pluie, qui est publié (E.32) |
| 39 | La garde-robe | **l'app fournit les catégories, l'athlète les pièces** ; ce qu'il déclare ne pas avoir cesse d'être proposé, sans remplacement ni conseil d'achat (E.32) |

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
