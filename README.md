# Makigawa

Interface mobile personnelle posée au-dessus d’**intervals.icu** : consulter
les séances à venir et encoder ce qui a été fait, sans ouvrir le site web.
Construite comme une **PWA installable** — une app web qui s’ajoute à l’écran
d’accueil d’Android et se comporte comme une app native.

Voir `CLAUDE.md` pour le contexte, les règles métier et les contraintes.

**Local-first** : les données restent dans le stockage du navigateur, sur le
téléphone. Pas de compte, pas de serveur, pas de synchronisation — rien ne
quitte l’appareil, et l’app fonctionne sans réseau. Corollaire à garder en
tête : effacer les données du site depuis Chrome efface l’historique, d’où
l’intérêt d’un export une fois qu’il y aura des sorties à perdre.

Pour l’instant le dépôt ne contient que le « raccord » : le squelette technique
et l’écran de vérification qui confirme que tout fonctionne sur le téléphone.
Les fonctionnalités de suivi viennent ensuite.

La page porte une balise `noindex` : elle n’est pas indexée par les moteurs de
recherche. Un `robots.txt` ne conviendrait pas ici, il n’est lu qu’à la racine
du domaine, qui dépend d’un autre dépôt.

## Installer sur le téléphone

1. Ouvrir **https://tvsgit-dev.github.io/Makigawa/** dans Chrome sur Android.
2. Chrome propose l’installation (bannière, ou bouton « Installer sur l’écran
   d’accueil » dans l’app). Sinon : menu ⋮ → **Ajouter à l’écran d’accueil**.
3. Lancer Makigawa depuis l’écran d’accueil. L’écran « Raccord » doit afficher
   *App installée*, *Hors-ligne : prêt* et *HTTPS*.

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
seul le site déployé en HTTPS permet de tester le raccord complet.

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
scripts/generate-icons.mjs    Génération des icônes PNG (sans dépendance)
public/                       Icônes, favicon — copiés tels quels
src/pwa/                      Service worker, invite d’installation, mode d’affichage
src/components/               Éléments d’interface
src/App.tsx                   Écran « Raccord »
vite.config.ts                Build + manifest de la PWA
```
