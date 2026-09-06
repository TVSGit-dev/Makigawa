# Bibliothèque de séances

> Un catalogue à recopier dans l'éditeur d'intervals.icu. Makigawa ne crée
> jamais de contenu de séance — elle décide du **quand** et du **si**.
>
> Établi le 6 septembre 2026, à partir des sorties réelles de l'athlète.

---

## Comment s'en servir

Chaque séance donne un nom et une structure en notation de zones, celle
qu'intervals.icu attend dans le champ `description` :

```
- 5m z2
- 5m z3
```

Une ligne par bloc. `5m` pour cinq minutes, `z2` pour la zone de puissance 2.
Créer la séance dans intervals.icu, coller la structure, la poser dans le
calendrier. Makigawa la lira ensuite.

**Les charges annoncées sont des estimations**, calées sur les relevés de
l'athlète : environ 95 points de charge par heure sur le vélo musculaire, un
peu moins sur les sorties longues où l'intensité retombe.

---

## Ce que les zones valent, chez toi

Avec la FTP réglée à 221 W :

| Zone | Nom | Puissance |
|---|---|---|
| z1 | Récupération active | 1 – 121 W |
| z2 | Endurance | 122 – 165 W |
| z3 | Tempo | 166 – 198 W |
| z4 | Seuil | 199 – 232 W |
| z5 | VO2 max | 233 – 265 W |
| z6 | Anaérobie | 266 – 331 W |

> ⚠️ **Une réserve sérieuse sur ces valeurs.** Les meilleures puissances de
> 20 minutes enregistrées sur les sorties réelles sont de **175 W** et
> **161 W**. Une FTP de 221 W en supposerait plutôt 230. L'écart est trop
> grand pour être ignoré : les séances en z4 et z5 de ce catalogue risquent
> d'être infaisables telles quelles.
>
> Ce ne sont pas des tests — ce sont des sorties avec descentes, arrêts et
> circulation, ce qui tire les moyennes vers le bas. Mais le doute reste
> entier, et **le test FTP de la phase 5 est ce qui le lèvera**. En attendant :
> si une séance en z4 paraît impossible à tenir, ce n'est pas un manque de
> forme, c'est probablement la FTP qui est trop haute.

---

# Séances d'intérieur — 30 minutes

## Récupération 30

Charge estimée **20**. Pour le lendemain d'une journée chargée.

```
- 10m z1
- 10m z2
- 10m z1
```

## Endurance 30

Charge estimée **35**. La séance par défaut quand le temps manque.

```
- 5m z1
- 22m z2
- 3m z1
```

## Tempo 30

Charge estimée **45**. Trois blocs courts, le premier vrai travail.

```
- 6m z2
- 4m z3
- 3m z2
- 4m z3
- 3m z2
- 4m z3
- 6m z2
```

## Sweet spot 30

Charge estimée **50**. Le meilleur rapport rendement / temps quand on est
pressé — à ne pas faire toutes les semaines.

```
- 8m z2
- 6m z3
- 3m z2
- 6m z3
- 7m z2
```

## VO2 max 30

Charge estimée **55**. Cinq minutes de travail dur, le reste sert à les
rendre possibles.

```
- 10m z2
- 1m z5
- 2m z2
- 1m z5
- 2m z2
- 1m z5
- 2m z2
- 1m z5
- 2m z2
- 1m z5
- 2m z2
- 5m z1
```

---

# Séances d'intérieur — 45 minutes

## Endurance 45

Charge estimée **55**. Longue et facile ; celle qui construit la base sans
coûter de fraîcheur.

```
- 5m z1
- 35m z2
- 5m z1
```

## Tempo 45

Charge estimée **70**.

```
- 8m z2
- 8m z3
- 4m z2
- 8m z3
- 4m z2
- 8m z3
- 5m z2
```

## Sweet spot 45

Charge estimée **75**.

```
- 10m z2
- 12m z3
- 5m z2
- 12m z3
- 6m z2
```

## Seuil 45

Charge estimée **80**. Deux blocs de huit minutes au seuil — la séance la
plus exigeante du catalogue à cette durée.

```
- 12m z2
- 8m z4
- 5m z2
- 8m z4
- 5m z2
- 7m z1
```

## VO2 max 45

Charge estimée **85**. Quatre blocs de trois minutes, récupération égale.

```
- 12m z2
- 3m z5
- 3m z2
- 3m z5
- 3m z2
- 3m z5
- 3m z2
- 3m z5
- 12m z1
```

---

# Sorties longues

## Ce sur quoi elles sont calées

Deux sorties réelles servent de référence :

| Sortie | Distance | D+ | Temps roulant | Vitesse | FC moyenne | Puissance |
|---|---|---|---|---|---|---|
| Ballade en Willy, 27 juillet | 35,9 km | 387 m | 1 h 25 | 25,4 km/h | 160 bpm | 161 W |
| Croisière BWTH, 27 juin | 47,2 km | 665 m | 2 h 20 | 20,3 km/h | 149 bpm | 121 W |

**Un constat qui vaut d'être noté.** La longue sortie roulante tourne à
149 bpm de moyenne, la plus vallonnée au kilomètre à 160. Le seuil `T_effort`
du projet est à **150 bpm** : il tombe exactement entre les deux. Ce n'est pas
une preuve, mais c'est un indice de plus que ce seuil sépare bien ce qu'il
prétend séparer.

Le terrain est vallonné — de 10 à 14 mètres de dénivelé par kilomètre — et les
estimations ci-dessous en tiennent compte.

## Le catalogue

| Sortie | D+ estimé | Temps roulant | Porte à porte | Charge estimée |
|---|---|---|---|---|
| **35 km** | ~370 m | 1 h 30 | ~1 h 50 | **140** |
| **40 km** | ~420 m | 1 h 45 | ~2 h 05 | **160** |
| **50 km** | ~530 m | 2 h 15 | ~2 h 40 | **200** |
| **60 km** | ~630 m | 2 h 45 | ~3 h 15 | **235** |
| **80 km** | ~840 m | 3 h 45 | ~4 h 20 | **310** |
| **100 km** | ~1050 m | 4 h 45 | ~5 h 30 | **370** |

> **Le « porte à porte » compte autant que le temps roulant.** Sur la sortie
> de 35,9 km, l'écart était de vingt-neuf minutes — arrêts, feux, pauses. Avec
> deux enfants en bas âge, c'est ce chiffre-là qui décide si la sortie est
> possible.

## L'échelle à monter

**Ta forme actuelle est basse** — le CTL relevé le 5 septembre était de 17,7.
Les six sorties ne sont donc pas six choix équivalents mais **une échelle**,
et il vaut mieux la monter un barreau à la fois, en laissant deux à trois
semaines entre deux barreaux.

| Sortie | Quand |
|---|---|
| 35 km | disponible maintenant |
| 40 km | maintenant, sur une bonne semaine |
| 50 km | dans 2-3 semaines |
| 60 km | dans 5-6 semaines |
| 80 km | pas avant novembre |
| 100 km | un objectif, pas une séance |

Rien n'interdit de les poser toutes dans le calendrier dès aujourd'hui :
**Makigawa refusera d'elle-même celles qui tombent mal.** Une sortie à 370 de
charge fait une journée de niveau 4, et les règles ne la laisseront passer que
si les journées autour sont dégagées. C'est exactement le rôle qu'on leur a
donné.

## Les structures

Sur route, le terrain commande plus que la montre. Ces structures disent une
**intention**, pas un chronomètre : le bloc en z3 se place sur une bosse, pas
à la minute près.

### Sortie 35 km

```
- 15m z2
- 55m z2
- 15m z3
- 5m z1
```

### Sortie 40 km

```
- 15m z2
- 60m z2
- 20m z3
- 10m z2
```

### Sortie 50 km

```
- 20m z2
- 70m z2
- 15m z3
- 10m z2
- 20m z2
```

### Sortie 60 km

```
- 20m z2
- 90m z2
- 20m z3
- 15m z2
- 20m z2
```

### Sortie 80 km

Deux blocs de tempo seulement, placés tôt : au-delà de trois heures, ce qui
compte est de finir en mangeant et en buvant, pas d'ajouter de l'intensité.

```
- 20m z2
- 80m z2
- 15m z3
- 20m z2
- 15m z3
- 60m z2
- 15m z1
```

### Sortie 100 km

Aucune intensité prescrite. À cette distance, la difficulté **est** la
distance.

```
- 25m z2
- 120m z2
- 20m z1
- 100m z2
- 20m z1
```

---

## Ce que ce catalogue ne contient pas

**Le renfo et la mobilité.** Ils n'ont pas de structure en zones de puissance
et se créent autrement dans intervals.icu. Les règles les traitent quand même :
le renfo par sa nature `force`, qui demande 48 h d'écart avec une séance
d'endurance, et la mobilité par sa charge, trop faible pour être une séance de
qualité.

**Des séances importées de Zwift.** Elles n'ont pas pu être récupérées : Zwift
n'expose pas de bibliothèque publique accessible, et le domaine n'est pas
joignable depuis l'environnement de développement. Les séances ci-dessus sont
composées à partir des principes de la section 5 et calées sur les zones de
l'athlète, ce qui vaut mieux qu'un import générique.

---

# Le planning des trois prochaines semaines

Du 7 au 27 septembre 2026. **Vérifié par le moteur de règles** — le test
`src/rules/plan.test.ts` le rejoue et échouera si les règles ou l'échelle
changent au point de le démonter.

Rythme **2:1** : deux semaines de charge, une allégée. Les trajets sont
supposés à 35 de charge par journée, soit un aller-retour électrique.

## Semaine 1 — charge

| Jour | | Charge | Journée |
|---|---|---|---|
| lun 7 | Trajets | 35 | légère |
| **mar 8** | Trajets + **Endurance 45** | 90 | **chargée** |
| mer 9 | Trajets | 35 | légère |
| jeu 10 | Trajets | 35 | légère |
| ven 11 | — | 0 | légère |
| **sam 12** | **Sortie 35 km** | 140 | **chargée** |
| dim 13 | — | 0 | légère |

## Semaine 2 — charge

| Jour | | Charge | Journée |
|---|---|---|---|
| lun 14 | Trajets | 35 | légère |
| **mar 15** | Trajets + **Tempo 45** | 105 | **chargée** |
| mer 16 | Trajets | 35 | légère |
| jeu 17 | Trajets + Endurance 30 | 70 | moyenne |
| ven 18 | — | 0 | légère |
| **sam 19** | **Sortie 40 km** | 160 | **chargée** |
| dim 20 | — | 0 | légère |

## Semaine 3 — décharge

| Jour | | Charge | Journée |
|---|---|---|---|
| lun 21 | Trajets | 35 | légère |
| mar 22 | Trajets + Récupération 30 | 55 | moyenne |
| mer 23 | Trajets | 35 | légère |
| jeu 24 | Trajets | 35 | légère |
| ven 25 | — | 0 | légère |
| sam 26 | Tempo 30 | 45 | légère |
| dim 27 | — | 0 | légère |

## Ce que le planning respecte

| | |
|---|---|
| Journées chargées | 2, 2, puis 0 — le quota du mode normal est de 2 |
| Deux chargées d'affilée | jamais |
| Charge hebdomadaire | 335, 405, puis 205 |
| Décharge | 51 % de la plus grosse semaine, dans la fourchette 40-60 % |

**La semaine 3 garde une sortie courte avec du tempo**, comme la section 5 le
demande : une décharge allège, elle n'éteint pas.

## Ce que le planning n'est pas

Un contrat. C'est un **point de départ** que Makigawa modifiera au fil des
jours : la sortie du samedi se décalera si le vendredi devient chargé, la
séance du mardi se réduira si la nuit a été mauvaise. Le planning à deux
semaines donne l'intention, l'ajustement quotidien donne le réel.

C'est exactement la division prévue — le calendrier dit **quoi**, les règles
disent **quand** et **si**.
