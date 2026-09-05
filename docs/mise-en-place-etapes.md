# Mise en place — de zéro à données propres

> Ordre à respecter. Chaque phase dépend de la précédente.
> Phases 0 à 5 : faisables depuis le téléphone. Phase 6+ : ordinateur.

---

## Phase 0 — Décisions à acter avant de créer quoi que ce soit

- [ ] **Ne pas connecter Strava.** Le brief le prévoyait « en secours ».
      À écarter : Strava estime une puissance fausse sur les trajets
      électriques (306 W relevés là où tu en produis ~133), et cumulé avec
      Garmin il crée des doublons d'activités. Garmin a déjà tout
      l'historique, Strava n'apporte rien.
- [ ] **Sources retenues : Garmin Connect + Zwift, en direct.**
- [ ] Vérifier que tes activités Garmin ne sont pas en privé global.
      Les activités privées ne remontent pas.

---

## Phase 1 — Création du compte intervals.icu

- [ ] Créer le compte sur intervals.icu.
- [ ] **Au moment de l'inscription, choisir Garmin Connect comme source.**
      C'est proposé dans le parcours de création. Le faire à ce moment-là
      évite d'avoir à reconfigurer ensuite.
- [ ] Autoriser la connexion OAuth vers Garmin.
- [ ] **Régler la date de reprise de l'historique.** Par défaut, seules les
      nouvelles activités sont téléchargées. Il faut cliquer sur la date
      pour la reculer. Viser au moins janvier 2026, idéalement plus tôt.

> Point d'attention : si tu changes ton mot de passe Garmin plus tard, le
> jeton OAuth est invalidé et il faut refaire la connexion.

---

## Phase 2 — Profil athlète

À renseigner avant que les calculs de charge tournent, sinon tout
l'historique sera calculé avec des valeurs par défaut fausses.

- [ ] Poids : **80 kg**
- [ ] FCmax : **200 bpm**
- [ ] FTP : laisser vide ou mettre 240 W en provisoire, à confirmer
      en phase 5.
- [ ] **LTHR : ne pas deviner.** Laisser intervals.icu l'estimer une fois
      l'historique importé. Tes données suggèrent 168-172, mais une
      estimation sur données réelles vaudra mieux qu'un chiffre posé
      à la main.
- [ ] Vérifier les zones cardio générées et qu'elles placent bien
      150 bpm en bas de zone tempo (c'est le `T_effort` de la section 5).

---

## Phase 3 — Traitement du vélo électrique

C'est le point le plus délicat de toute la mise en place, et celui qui
casse silencieusement si on le rate.

- [ ] Vérifier comment intervals.icu classe tes `EBikeRide` : type
      d'activité reconnu, et surtout **s'il compte dans la charge**.
- [ ] Par défaut, l'électrique peut être exclu du calcul Fitness/Fatigue.
      Or il porte 60 à 100 % de ta charge réelle. Il faut le faire
      compter.
- [ ] Dans les réglages de type d'activité, mettre l'électrique à
      **100 % Fitness et 100 % Fatigue** (un utilisateur a rapporté que
      la catégorie disparaît à 100 % de fatigue — si ça arrive, mettre 99).
- [ ] Vérifier que la charge de ces trajets est bien calculée **depuis le
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
      avec puissance (~182 W) et cardio (~160 bpm).
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
