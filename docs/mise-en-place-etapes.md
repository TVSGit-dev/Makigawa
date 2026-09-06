# Mise en place — de zéro à données propres

> Ordre à respecter. Chaque phase dépend de la précédente.
> Phases 0 à 5 : faisables depuis le téléphone. Phase 6+ : ordinateur.

> **Avancement au 5 septembre 2026** — phases 0 à 3 faites. Compte créé,
> Garmin connecté, import d'historique confirmé. Profil renseigné, avec une
> FTP volontairement basse à 221 W. Vélo électrique réglé, sa charge vient
> bien du cardio — le point le plus délicat de la mise en place est passé.
>
> Phase 2 complétée le 5 septembre au soir : FCmax relevée à 202 bpm, LTHR
> affichée à 183 bpm — 15 bpm au-dessus de l'attendu, ce qui fait échouer le
> contrôle des zones sans toucher aux règles. Import confirmé depuis le
> 7 septembre 2025, soit un an. Phase 4 vérifiée dans la foulée.
>
> **Phases 0 à 4 faites, Zwift connecté, clé API générée.** Et surtout :
> **la réserve CORS est levée** — intervals.icu accepte les appels directs
> depuis le navigateur, le test de connexion a rapatrié les activités. Pas
> de relais à construire, l'app reste un client local.
>
> La lecture du calendrier fonctionne : `/events` était le bon point
> d'entrée, et la forme d'une séance planifiée est désormais consignée dans
> `CLAUDE.md`. Reste le test FTP, qui attend les jambes.
>
> **Prochaine étape : l'écriture**, troisième point de la phase 7 — poser un
> événement de test, le modifier, le supprimer. C'est elle qui dira si le
> navigateur autorise aussi les autres méthodes HTTP.

---

## Phase 0 — Décisions à acter avant de créer quoi que ce soit

- [x] **Ne pas connecter Strava.** Le brief le prévoyait « en secours ».
      À écarter : Strava estime une puissance fausse sur les trajets
      électriques (306 W relevés là où tu en produis ~133), et cumulé avec
      Garmin il crée des doublons d'activités. Garmin a déjà tout
      l'historique, Strava n'apporte rien.
- [x] **Sources retenues : Garmin Connect + Zwift, en direct.**
- [x] Vérifier que tes activités Garmin ne sont pas en privé global.
      Les activités privées ne remontent pas. Implicitement confirmé : les
      activités sont bien arrivées dans intervals.icu.

---

## Phase 1 — Création du compte intervals.icu

- [x] Créer le compte sur intervals.icu.
- [x] **Au moment de l'inscription, choisir Garmin Connect comme source.**
      C'est proposé dans le parcours de création. Le faire à ce moment-là
      évite d'avoir à reconfigurer ensuite.
- [x] Autoriser la connexion OAuth vers Garmin.
- [x] **Régler la date de reprise de l'historique.** Fait et confirmé :
      l'import démarre au **7 septembre 2025**, soit un an d'historique —
      bien au-delà du janvier 2026 visé. C'est sur ces données
      qu'intervals.icu calcule.

> Point d'attention : si tu changes ton mot de passe Garmin plus tard, le
> jeton OAuth est invalidé et il faut refaire la connexion.

> **Sur la plausibilité d'une LTHR à 183.** Les Hard Commutes tournent à
> ~160 bpm de moyenne, deux fois par semaine. Avec une LTHR à 168, cela
> ferait 95 % du seuil, en soutenu et répété — difficilement tenable au
> quotidien. Avec 183, cela fait 87 %, un effort tempo exigeant mais
> répétable. L'usage réel penche donc plutôt vers 183 que vers 168. Ce n'est
> pas une preuve, c'est un argument de vraisemblance.

---

## Phase 2 — Profil athlète

À renseigner avant que les calculs de charge tournent, sinon tout
l'historique sera calculé avec des valeurs par défaut fausses.

- [x] Poids : **80 kg**
- [x] FCmax : **202 bpm** — valeur affichée par intervals.icu, relevée sur
      l'historique, et non les 200 bpm supposés.
- [x] FTP : **221 W**, posée délibérément sous les 240 W estimés par
      Garmin. L'athlète juge les 240 W atteignables, mais préfère viser bas
      après six semaines sans sortie musculaire — même raisonnement que
      celui qui, en phase 5, interdit le test FTP en première séance.
      intervals.icu estime de son côté une **eFTP à 205 W**, plus basse
      encore : l'intuition de viser bas est confortée. À confirmer par le
      test de 20 min.
- [x] **LTHR : 183 bpm**, valeur affichée par intervals.icu après avoir
      rendu le réglage plutôt que de le choisir. C'est **15 bpm au-dessus**
      des 168-172 attendus, et 90,6 % de la FCmax — haut pour un seuil.
      **Reste à confirmer** : intervals.icu présente-t-il 183 comme une
      estimation sur données, ou comme une valeur par défaut ? Le champ
      « HRRc Min FC » affiche le même nombre, ce qui pourrait indiquer une
      valeur liée plutôt qu'estimée.
- [x] Zones cardio observées, sans ajustement préalable cette fois — et
      **le contrôle échoue**. Avec une LTHR de 183, 150 bpm tombe en bas de
      Z2 Aérobie (148-162) et non en bas de tempo (163-171) ; 175 bpm tombe
      en Z4 SubThreshold (172-182). Il faudrait une LTHR de 169 bpm pour que
      150 tombe où la phase 2 le supposait. Sans conséquence sur les règles,
      qui comparent des bpm bruts, mais la justification « bas de zone
      tempo » de `T_effort` ne tient plus. Le contrôle qui vaut est celui de
      la phase 6, sur des journées réelles.

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

> **Vérifié le 5 septembre 2026.** Contrôle visuel d'ensemble par l'athlète,
> sans relevé chiffré poste par poste : les données correspondent à ce qui
> était attendu. Le point sensible — pas de puissance aberrante sur les
> `EBikeRide` — est par ailleurs couvert par la phase 3, où la charge de ces
> trajets a été constatée comme venant du cardio.

- [x] Les trajets de juillet-août sont bien là, sans doublons.
- [x] Les Hard Commutes du 6 et 15 juillet apparaissent en `Ride`
      avec puissance et cardio (~160 bpm). intervals.icu affiche la
      puissance **normalisée** : attendre **~220 W**, et non les ~182 W
      de la reconstitution initiale. Les deux décrivent la même sortie.
- [x] Les Chill Commutes apparaissent en `EBikeRide` avec cardio
      (~129 bpm) et **sans puissance aberrante**.
- [x] La sortie du 27 juillet est là (35,9 km, 1 h 25, 387 m D+).
- [x] La courbe de charge des 9 dernières semaines ressemble à ce qu'on a
      reconstitué : creux fin juillet - début août, remontée en volume
      sur août.

---

## Phase 5 — Connexion Zwift et test FTP

- [x] Connecter Zwift **en direct** à intervals.icu, avant la séance.
      Garmin ne relaie pas les activités Zwift vers les tiers : sans cette
      connexion, ta séance n'arrive nulle part. Fait le 5 septembre.
      Zwift alimente aussi Garmin Connect, d'où une crainte de doublon —
      mais c'est la prémisse ci-dessus qui l'écarte : si Garmin relayait,
      la connexion directe aurait été inutile. **À constater sur la
      première séance** : une seule activité doit apparaître.
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
- [x] Poser manuellement quelques séances dans le calendrier
      intervals.icu pour voir comment l'API les représente. Fait le
      5 septembre : la forme est consignée dans `CLAUDE.md`, la réserve est
      levée. À poursuivre pour couvrir d'autres types — le renfo et la
      mobilité n'ont pas encore été observés.
- [ ] Faire au moins une séance N1 et une N2 pour avoir de la matière.
- [ ] Vérifier que les seuils de la section 5.1 tombent juste sur des
      journées réelles : un aller-retour électrique doit sortir en
      **légère**, un aller-retour musculaire en **chargée**.

C'est là qu'on ajuste les seuils si besoin. Les régler après avoir écrit
le code coûte beaucoup plus cher.

---

## Phase 7 — Sur ordinateur

- [x] Générer la clé API depuis la page de réglages du compte. Fait le
      5 septembre, en avance sur son rang pour lever au plus tôt la
      réserve CORS.
- [x] Relever l'athlete ID.
- [x] **Ne jamais mettre la clé dans le front.** Consigne dépassée dans sa
      lettre : la décision du 5 septembre supprime le serveur. La clé est
      saisie sur le téléphone et vit dans son `localStorage`, jamais dans
      le dépôt ni dans le bundle — l'esprit est respecté.
- [x] Explorer l'API en lecture d'abord : lister les activités **(fait :
      le test de connexion les rapatrie)**, lire le calendrier **(fait :
      l'app affiche les séances des quatorze prochains jours)**.
- [x] Puis écriture : poser un événement de test, le modifier, le
      supprimer. L'app porte un test d'écriture qui enchaîne les trois et
      vérifie la disparition ; il pose une **note** et non une séance, pour
      qu'un ménage raté ne fausse aucune charge.
- [x] Seulement ensuite : implémenter les règles de la section 5. **Fait**,
      dans `src/rules/`, avec 92 tests.
- [x] Interface PWA en dernier. **Faite le 6 septembre** : forme du jour,
      curseur d'intention, propositions séance par séance avec leur raison,
      et confirmation avant toute écriture.

---

## Ce qu'on ne fait pas maintenant

- Aucune ligne d'interface avant la phase 7.
- Aucune automatisation avant la phase 6.
- Pas de bibliothèque de séances de renfo tant que les règles ne tournent
  pas — c'est du contenu, ça se remplit vite, et ça ne bloque rien.
