# Mise en place — de zéro à données propres

> Ordre à respecter. Chaque phase dépend de la précédente.
> Phases 0 à 5 : faisables depuis le téléphone. Phase 6+ : ordinateur.

> **Avancement au 5 septembre 2026** — phases 0 à 3 faites. Compte créé,
> Garmin connecté, import d'historique confirmé. Profil renseigné, avec une
> FTP volontairement basse à 221 W. Vélo électrique réglé, sa charge vient
> bien du cardio — le point le plus délicat de la mise en place est passé.
>
> En attente : la LTHR, rendue à intervals.icu pour ré-estimation, et le
> contrôle des zones qui en dépend. **Prochaine étape : phase 4**, le
> contrôle des données importées.

---

## Phase 0 — Décisions à acter avant de créer quoi que ce soit

- [x] **Ne pas connecter Strava.** Le brief le prévoyait « en secours ».
      À écarter : Strava estime une puissance fausse sur les trajets
      électriques (306 W relevés là où tu en produis ~133), et cumulé avec
      Garmin il crée des doublons d'activités. Garmin a déjà tout
      l'historique, Strava n'apporte rien.
- [x] **Sources retenues : Garmin Connect + Zwift, en direct.**
- [ ] Vérifier que tes activités Garmin ne sont pas en privé global.
      Les activités privées ne remontent pas.

---

## Phase 1 — Création du compte intervals.icu

- [x] Créer le compte sur intervals.icu.
- [x] **Au moment de l'inscription, choisir Garmin Connect comme source.**
      C'est proposé dans le parcours de création. Le faire à ce moment-là
      évite d'avoir à reconfigurer ensuite.
- [x] Autoriser la connexion OAuth vers Garmin.
- [x] **Régler la date de reprise de l'historique.** Fait : l'import a
      fonctionné, c'est sur ces données qu'intervals.icu calcule. Reste à
      confirmer sa profondeur — c'est l'objet de la phase 4, qui vérifie la
      présence des trajets de juillet-août.

> Point d'attention : si tu changes ton mot de passe Garmin plus tard, le
> jeton OAuth est invalidé et il faut refaire la connexion.

---

## Phase 2 — Profil athlète

À renseigner avant que les calculs de charge tournent, sinon tout
l'historique sera calculé avec des valeurs par défaut fausses.

- [x] Poids : **80 kg**
- [x] FCmax : **200 bpm**
- [x] FTP : **221 W**, posée délibérément sous les 240 W estimés par
      Garmin. L'athlète juge les 240 W atteignables, mais préfère viser bas
      après six semaines sans sortie musculaire — même raisonnement que
      celui qui, en phase 5, interdit le test FTP en première séance.
      À confirmer par ce test.
- [ ] **LTHR : ré-estimation en cours.** Posée à la main à 168 bpm le
      5 septembre, puis rendue à intervals.icu — l'athlète ne veut pas d'un
      chiffre inventé, et l'import d'historique étant confirmé, l'estimation
      sur données réelles est possible. Reporter ici la valeur obtenue.
      Quelle qu'elle soit dans la fourchette 168-172, 150 bpm se situe entre
      87 et 89 % du seuil : le classement de ce repère bouge peu.
- [ ] Vérifier les zones cardio une fois la LTHR ré-estimée : où tombe
      150 bpm, le `T_effort` de la section 5 ? Le premier contrôle avait été
      obtenu en ajustant la LTHR plutôt qu'en la constatant, il ne valait
      donc pas confirmation. Cette fois l'observation sera indépendante.

---

## Phase 3 — Traitement du vélo électrique

C'est le point le plus délicat de toute la mise en place, et celui qui
casse silencieusement si on le rate.

- [x] Vérifier comment intervals.icu classe tes `EBikeRide` : type
      d'activité reconnu, et surtout **s'il compte dans la charge**.
- [x] Par défaut, l'électrique peut être exclu du calcul Fitness/Fatigue.
      Or il porte 60 à 100 % de ta charge réelle. Il faut le faire
      compter.
- [x] Dans les réglages de type d'activité, mettre l'électrique à
      **100 % Fitness et 100 % Fatigue** (un utilisateur a rapporté que
      la catégorie disparaît à 100 % de fatigue — si ça arrive, mettre 99).
- [x] Vérifier que la charge de ces trajets est bien calculée **depuis le
      cardio**. Sans capteur de puissance sur ce vélo, ça devrait se faire
      seul, mais à contrôler sur les premières activités.

> Limite connue : la stratégie « puissance prioritaire sur cardio » est
> globale dans intervals.icu, elle ne se règle pas par sport. Comme ton
> vélo musculaire a un capteur et l'électrique non, ça devrait bien se
> passer. À vérifier plutôt qu'à supposer.

---

## Phase 4 — Contrôle des données importées

Ne pas passer à la suite avant que ça soit vérifié.

- [ ] Les trajets de juillet-août sont bien là, sans doublons.
- [ ] Les Hard Commutes du 6 et 15 juillet apparaissent en `Ride`
      avec puissance et cardio (~160 bpm). intervals.icu affiche la
      puissance **normalisée** : attendre **~220 W**, et non les ~182 W
      de la reconstitution initiale. Les deux décrivent la même sortie.
- [ ] Les Chill Commutes apparaissent en `EBikeRide` avec cardio
      (~129 bpm) et **sans puissance aberrante**.
- [ ] La sortie du 27 juillet est là (35,9 km, 1 h 25, 387 m D+).
- [ ] La courbe de charge des 9 dernières semaines ressemble à ce qu'on a
      reconstitué : creux fin juillet - début août, remontée en volume
      sur août.

---

## Phase 5 — Connexion Zwift et test FTP

- [ ] Connecter Zwift **en direct** à intervals.icu, avant la séance.
      Garmin ne relaie pas les activités Zwift vers les tiers : sans cette
      connexion, ta séance n'arrive nulle part.
- [ ] Faire une ou deux séances Zwift faciles d'abord.
- [ ] **Ne pas faire le test FTP en première séance.** Tu n'as pas roulé
      en musculaire depuis 6 semaines. Un test à froid donnera un plancher,
      pas ta vraie valeur, et servira ensuite de référence pendant des mois.
- [ ] Test de 20 min quand les jambes sont revenues.
- [ ] Reporter la FTP obtenue dans le profil.

> Le test est une journée **chargée** au sens de la section 5.1. Ne pas le
> planifier la veille ou le lendemain d'un aller-retour musculaire.

---

## Phase 6 — Période d'observation (2 à 3 semaines)

- [ ] Laisser tourner sans rien automatiser.
- [ ] Poser manuellement quelques séances dans le calendrier
      intervals.icu pour voir comment l'API les représente.
- [ ] Faire au moins une séance N1 et une N2 pour avoir de la matière.
- [ ] Vérifier que les seuils de la section 5.1 tombent juste sur des
      journées réelles : un aller-retour électrique doit sortir en
      **légère**, un aller-retour musculaire en **chargée**.

C'est là qu'on ajuste les seuils si besoin. Les régler après avoir écrit
le code coûte beaucoup plus cher.

---

## Phase 7 — Sur ordinateur

- [ ] Générer la clé API depuis la page de réglages du compte.
- [ ] Relever l'athlete ID.
- [ ] **Ne jamais mettre la clé dans le front.** Fonction serverless côté
      serveur, ou secret de dépôt pour le job planifié.
- [ ] Explorer l'API en lecture d'abord : lister les activités, lire le
      calendrier.
- [ ] Puis écriture : poser un événement de test, le modifier, le
      supprimer.
- [ ] Seulement ensuite : implémenter les règles de la section 5.
- [ ] Interface PWA en dernier.

---

## Ce qu'on ne fait pas maintenant

- Aucune ligne d'interface avant la phase 7.
- Aucune automatisation avant la phase 6.
- Pas de bibliothèque de séances de renfo tant que les règles ne tournent
  pas — c'est du contenu, ça se remplit vite, et ça ne bloque rien.
