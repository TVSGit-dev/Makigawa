# Section 5 — Règles d'adaptation

> **Statut : brouillon de travail, à retravailler.** Ce document est la
> référence citée par `CLAUDE.md`. Il vit sur sa propre branche
> (`docs/regles-adaptation`) précisément pour être repris autant de fois
> qu'il le faudra sans bloquer le code.
>
> Dernière révision : 5 septembre 2026.

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
- **Partie F — Ce qui reste ouvert.**

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
> décale la journée d'un cran vers « chargée ». C'est **à trancher** (partie
> F) : ça coûte un tap, et le projet tient à ne pas devenir une corvée.

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

> **Ma recommandation : 2:1.** Pas parce que tu serais fragile, mais parce
> que la littérature fait dépendre ce choix de la **capacité de
> récupération**, et que la tienne est contrainte par deux enfants en bas âge
> et un sommeil que tu ne pilotes pas. Le 3:1 suppose des semaines de charge
> pleines et une récupération correcte entre elles. **À trancher.**

En décharge : **réduire le volume de 40 à 60 %**, garder une ou deux sorties
courtes avec quelques accélérations brèves pour ne pas s'éteindre.

## C.1 Semaine de reprise

**Quand :** après 14 jours ou plus sans séance N1/N2 (voir E.5).

- Volume de qualité réduit, remontée de **+10 % par semaine maximum**
- Pas de séance au-dessus du tempo la première semaine
- Les trajets continuent normalement — ils ne comptent pas comme reprise
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

> **À trancher :** faut-il que ces retours automatiques soient
> **contraignants** (l'app impose) ou **suggérés** (l'app propose, tu passes
> outre) ? Je penche pour contraignant sur le seul cas du troisième
> « ambitieux » — c'est là que le coût d'une erreur est le plus élevé et que
> le jugement du moment est le moins fiable, puisque la perte de lucidité
> fait partie des symptômes.

---

# Partie E — Les règles déterministes

**C'est cette partie que le code implémente.** Le reste du document
l'explique.

Rappel du cadre posé par `CLAUDE.md` et non rediscuté ici : les seuils sont
en **bpm**, jamais en watts ni en zones ; aucune règle ne dépend de la FTP ;
aucune donnée de puissance n'est lue sur les activités électriques.

## E.1 Classification des journées

| Journée | Condition |
|---|---|
| **Légère** | < 10 min cumulées au-dessus de 150 bpm |
| **Moyenne** | 10 à 30 min au-dessus de 150 bpm |
| **Chargée** | > 30 min au-dessus de 150 bpm, **ou** tout passage au-dessus de 175 bpm |

> ⚠️ **Un trou que je signale.** Une journée à 3 heures de vélo à 145 bpm
> sort actuellement en **légère**, alors qu'elle est objectivement fatigante.
> Le seuil de 150 bpm ignore le volume passé juste en dessous.
>
> **Proposition à trancher :** ajouter une bascule sur la durée — plus de
> 2 h 30 d'activité dans la journée, quelle que soit l'intensité, fait passer
> au minimum en **moyenne**. C'est cohérent avec le A.4 : la charge, ce n'est
> pas que l'intensité.

**Rappel de calibration.** Les seuils de 150 et 175 bpm **n'ont pas encore
été validés sur des journées réelles**. Le contrôle prévu (phase 6) est
simple : un aller-retour électrique doit sortir en légère, un aller-retour
musculaire en chargée. **Ne pas déplacer ces seuils avant ce contrôle.**

## E.2 Séance manquée

Ordre imposé : **décalée → sinon dégradée → sinon abandonnée.** Jamais
ajoutée à une autre séance. Aucune dette.

Les détails manquaient. Propositions :

| Question | Proposition | Justification |
|---|---|---|
| Décalée de combien ? | **2 jours maximum** | au-delà, elle ne sert plus l'intention de la semaine |
| Décalée où ? | jamais sur une journée chargée, jamais à côté d'une autre séance de qualité | E.4 |
| « Dégradée » = quoi ? | **structure gardée, durée réduite d'environ 40 %, étage le plus haut retiré** | conserve l'intention, retire le coût |
| Abandon après quand ? | **3 jours sans place trouvée** | au-delà on transporte un cadavre |

**À trancher, notamment « dégradée ».** Retirer l'étage haut, c'est
transformer une séance de VO2max en tempo — ce qui change sa nature. L'autre
option est de garder l'intensité et de couper la durée de moitié : la séance
reste ce qu'elle est, en plus court. **Je penche pour la seconde** au vu du
B.5 : ta qualité est rare, la dénaturer coûte plus cher que la raccourcir.

## E.3 Arbitrage d'une semaine chargée

Ordre de retrait : **mobilité → renfo → sortie.**

> **À trancher :** cet ordre me paraît discutable. La mobilité est ce qui
> coûte le moins et protège le plus quand tout le reste s'accumule ; c'est
> aussi la seule chose faisable en 10 minutes un soir. **Je proposerais
> plutôt : renfo → sortie → mobilité**, la mobilité étant la dernière à
> tomber. Mais c'est ton entraînement et ton ressenti — tranche.

Déclencheur : **à trancher.** Proposition — trois journées chargées non
planifiées dans les sept derniers jours.

## E.4 Anti-empilement

Règles existantes, conservées :

- Pas de renfo jambes sur une journée chargée
- Jamais deux journées chargées **planifiées** consécutives

Ajouts issus de la recherche sur l'entraînement concurrent *(établi)* :

- **Renfo lourd → 24 à 48 h avant une séance d'endurance dure.** L'inverse
  aussi : ne pas poser un renfo jambes le lendemain d'une grosse sortie.
- **Si les deux tombent le même jour :** l'endurance d'abord, **3 h
  d'écart minimum**. La signalisation musculaire de l'endurance met environ
  3 h à retomber, celle de la force dure ~18 h.
- **Bonne nouvelle :** le vélo interfère nettement moins avec la force que
  la course à pied, parce qu'il n'y a pas de contraction excentrique
  destructrice. Ton renfo et ton vélo cohabitent mieux qu'ils ne le
  feraient chez un coureur.

## E.5 Reprise

**14 jours sans séance N1/N2** déclenche le mode reprise : volume réduit,
**+10 % par semaine maximum, pendant 3 semaines**.

**Les trajets quotidiens ne remettent pas le compteur à zéro.** C'est
volontaire et bien fondé : ils entretiennent la base (A.5) mais ne sollicitent
ni le haut de la filière aérobie, ni les tissus qui se déconditionnent le plus
vite.

Ce que la recherche confirme et nuance :

- 2 semaines d'arrêt : **−4 à −7 % de VO2max**. Peu.
- La force tient **4 à 6 semaines** sans baisse notable.
- Mais retrouver le niveau prend **plus longtemps que le perdre**.
- Et le vrai risque n'est pas la perte de forme, c'est que **les tissus
  conjonctifs se réadaptent plus lentement que les muscles** : les deux
  premières semaines de retour sont la fenêtre où l'on se blesse.

> **Conclusion :** le seuil de 14 jours et la remontée à +10 % sont bien
> calibrés. Je ne propose aucun changement.

---

# Partie F — Ce qui reste à trancher

Rien de ce qui suit n'est bloquant pour commencer à coder les règles, mais
chaque point change un comportement de l'app.

| # | Question | Ma proposition |
|---|---|---|
| 1 | Rythme charge/décharge : 3:1 ou 2:1 ? | **2:1**, au vu de la contrainte de sommeil |
| 2 | Une saisie « nuit difficile » ? | oui, un seul tap, elle décale la journée d'un cran |
| 3 | Bascule de classification sur la durée ? | oui, > 2 h 30 → au minimum « moyenne » |
| 4 | « Dégradée » = durée réduite, ou étage retiré ? | **durée réduite**, l'intensité est ce qui est rare |
| 5 | Ordre d'arbitrage | **renfo → sortie → mobilité**, et non l'inverse |
| 6 | Déclencheur d'arbitrage | 3 journées chargées non planifiées sur 7 jours |
| 7 | Retour automatique en prudent : imposé ou suggéré ? | **imposé** pour le 3ᵉ « ambitieux », suggéré ailleurs |
| 8 | Seuils 150 / 175 bpm | **ne rien changer avant le contrôle de la phase 6** |

---

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
