# Makigawa

Interface mobile personnelle posée au-dessus d’**intervals.icu** : un plan
d’entraînement de deux semaines qui se corrige tout seul, sans ouvrir le site
web. Construite comme une **PWA installable** — une app web qui s’ajoute à
l’écran d’accueil d’Android et se comporte comme une app native.

Voir `CLAUDE.md` pour le contexte, les règles métier et les contraintes, et
`docs/section-5-regles-adaptation.md` pour la spécification qui fait foi.

**L’app ne fait que lire.** Garmin verse les activités dans intervals.icu,
intervals.icu calcule la charge, la forme et la fatigue, Makigawa lit tout cela
et en déduit ce qu’il y a à faire les quatorze jours qui viennent. Elle n’écrit
rien dans le calendrier — la seule exception est la suppression d’un événement,
derrière un appui long de deux secondes.

Ce qu’elle sait faire :

- **Tenir un plan de deux semaines** et le replacer à chaque lecture — la
  question centrale étant, séance par séance, « aujourd’hui est-il un bon jour
  pour celle-ci ? »
- **Composer les séances elle-même**, sur des motifs relevés chez l’athlète, en
  pourcentage de FTP et jamais en watts.
- **Doser la progression** : un niveau par zone, lu sur ce qui a été tenu, et
  un plafond de +10 % de forme par semaine au-delà duquel elle n’ajoute rien.
- **Compter les trajets domicile-travail**, qui portent l’essentiel de la
  charge hebdomadaire et se marquent d’avance dans le calendrier.

**Local-first** : ce que l’athlète choisit — sa marque de trajet, un refus, une
décharge acceptée — reste dans le stockage du navigateur, sur le téléphone. Pas
de compte, pas de serveur, pas de synchronisation. Corollaire à garder en tête :
effacer les données du site depuis Chrome efface ces choix ; les activités et le
calendrier, eux, vivent dans intervals.icu et se relisent.

La page porte une balise `noindex` : elle n’est pas indexée par les moteurs de
recherche. Un `robots.txt` ne conviendrait pas ici, il n’est lu qu’à la racine
du domaine, qui dépend d’un autre dépôt.

## Installer sur le téléphone

1. Ouvrir **https://tvsgit-dev.github.io/Makigawa/** dans Chrome sur Android.
2. Chrome propose l’installation (bannière, ou bouton « Installer sur l’écran
   d’accueil » dans l’app). Sinon : menu ⋮ → **Ajouter à l’écran d’accueil**.
3. Lancer Makigawa depuis l’écran d’accueil. Le bloc **Ce téléphone**, en bas de
   l’écran, doit afficher *App installée*, *Hors-ligne : prêt* et *HTTPS*.

Saisir ensuite l’identifiant athlète et la clé API intervals.icu, puis
**Tester la connexion**. Les identifiants restent dans le stockage local du
téléphone et ne sont envoyés qu’à intervals.icu.

Pour vérifier le mode hors-ligne : activer le mode avion, puis relancer l’app
depuis l’écran d’accueil. Elle doit démarrer normalement.

## Développement

```bash
npm install
npm run dev        # serveur local, service worker actif
npm run build      # vérification des types + build de production dans dist/
npm run preview    # sert dist/ comme en production
npm run typecheck  # types seuls
npm run icons      # régénère les icônes PNG depuis scripts/generate-icons.mjs
```

`npm run dev` écoute sur toutes les interfaces (`--host`) : depuis un téléphone
sur le même réseau Wi-Fi, l’URL est `http://<ip-de-la-machine>:5173/Makigawa/`.
Attention, en HTTP simple le navigateur bloque le GPS et le service worker —
seul le site déployé en HTTPS permet de tout tester.

## Déploiement

Chaque push sur `main` ou `claude/mobile-execution-m4j7mk` déclenche
`.github/workflows/deploy.yml`, qui construit le site et le publie sur GitHub
Pages.

**Réglage à faire une seule fois** : dans *Settings → Pages* du dépôt, choisir
**Source : GitHub Actions**. Tant que ce n’est pas fait, le workflow échoue à
l’étape « Configurer Pages » — le jeton d’un workflow n’a pas le droit de créer
le site Pages lui-même, seul le propriétaire du dépôt peut l’activer.

Deux contraintes propres aux dépôts **privés** :

- Publier des Pages depuis un dépôt privé demande un plan **GitHub Pro** (ou
  Team / Enterprise). Sur un compte gratuit, l’option n’est disponible que pour
  les dépôts publics.
- Même avec Pro, le site publié est **accessible publiquement** ; seul le code
  reste privé. Restreindre l’accès au site demande GitHub Enterprise.

Si aucune des deux ne convient, les alternatives qui déploient un dépôt privé
sans le rendre public sont Vercel, Netlify et Cloudflare Pages (niveaux
gratuits) : il suffit alors de remplacer ce workflow et de construire avec
`VITE_BASE=/`.

L’horodatage du build est affiché en haut de l’app : il permet de confirmer d’un
coup d’œil que le téléphone a bien reçu la dernière version. Quand une nouvelle
version est déployée, l’app affiche une bannière « Mettre à jour » plutôt que de
se recharger toute seule — utile pour ne pas perdre l’écran en pleine sortie.

### Chemin de base

Le site est servi sous `/Makigawa/`, d’où `base: '/Makigawa/'` dans
`vite.config.ts`. Pour un domaine personnalisé ou un déploiement à la racine,
construire avec `VITE_BASE=/ npm run build`.

## Structure

```
.github/workflows/deploy.yml  Build + déploiement GitHub Pages
docs/                         La spécification des règles, qui fait foi
scripts/generate-icons.mjs    Génération des icônes PNG (sans dépendance)
public/                       Icônes, favicon — copiés tels quels
src/api/                      Lecture d’intervals.icu (et la seule suppression)
src/rules/                    Le moteur : l’échelle de charge, la question du
                              E.2, la reprise, la décharge, la vitesse de montée
src/workouts/                 Les familles de séances, leur composition, les
                              niveaux par zone, la routine de souplesse
src/storage/                  Ce que le téléphone retient, et rien de plus
src/components/               L’interface
vite.config.ts                Build + manifest de la PWA
```

Le moteur est **une fonction pure** : il ne connaît pas le réseau, ne touche à
rien, et produit des propositions. C’est ce qui le rend testable — 250 tests
environ, dont plusieurs gardent des décisions de fond plutôt que du code
(aucune intensité en watts, aucune charge inventée, aucune écriture depuis
l’interface).
