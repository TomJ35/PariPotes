# 🎲 PariPotes

Un site de paris **entre amis**, avec des **points fictifs**, sur les petites choses du quotidien : un prof absent, un pote en retard, le nombre de minutes de retard du bus, le classement d'arrivée à la cantine…

> Aucun argent réel. Uniquement du fun, des points et de la mauvaise foi.

---

## ✨ Fonctionnalités

- **Groupes privés** : chaque groupe est rejoint via un **code d'invitation**.
- **Paris variés** : choix multiple, valeur exacte, classement.
- **Cotes dynamiques** (pari mutuel) : les gains dépendent de la répartition des mises.
- **Règles configurables** : points de départ, mise min/max, commission, bonus quotidien… modifiables sans toucher à la logique.
- **Classement du groupe** et historique des paris.
- **100 % responsive** : pensé mobile d'abord, confortable aussi sur ordinateur.
- **Navigation fluide** : barre d'onglets en bas sur mobile, barre latérale sur grand écran, transitions rapides.

---

## 🧱 Stack technique

| Couche | Choix |
|---|---|
| Front | React + Vite |
| Routage | React Router |
| Back | Node.js + Express |
| Base de données | SQLite (via `better-sqlite3`) |
| Conteneurisation | Docker + Docker Compose |

Objectif : **rester simple**.

> Convention : **le texte affiché est en français, le code (variables, fonctions, commentaires, commits) est en anglais.**

---

## 🚀 Démarrage rapide

### Avec Docker (recommandé)

```bash
git clone <url-du-depot>
cd paripotes
docker compose up --build
```

Le site est disponible sur http://localhost:3000.

La base SQLite est stockée dans le volume `./data` (conservée entre les redémarrages).

### En développement (sans Docker)

```bash
# Terminal 1 : API
cd server
npm install
npm run dev        # http://localhost:3001

# Terminal 2 : front
cd client
npm install
npm run dev        # http://localhost:5173 (proxy vers l'API)
```

---

## 🗂️ Structure du projet

```
paripotes/
├── client/                  # Front React + Vite
│   └── src/
│       ├── components/      # Composants réutilisables (BetCard, Tabs…)
│       ├── pages/           # Pages (Home, Group, BetDetail, Create, Leaderboard…)
│       ├── i18n/fr.json     # Tous les textes affichés (français)
│       ├── api/             # Appels à l'API
│       └── styles/          # Variables CSS, thème, breakpoints
├── server/
│   └── src/
│       ├── routes/          # Routes Express
│       ├── services/        # Logique métier (payout, settlement…)
│       ├── bet-types/       # Un fichier par type de pari
│       ├── db/              # Schéma SQLite + migrations
│       └── config/rules.json  # Règles du jeu modifiables
├── data/                    # Fichier SQLite (volume Docker)
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🎯 Types de paris

Chaque type est un module indépendant dans `server/src/bet-types/` avec la même interface : validation, enregistrement d'une mise, calcul des gagnants. Ajouter un nouveau type = ajouter un fichier.

### 1. Choix multiple (`multiple_choice`)
Plusieurs options, une seule gagne.
> *« Qui arrive en premier ce matin ? » → Léa / Hugo / Sam / Personne*

### 2. Valeur exacte (`exact_value`)
Les joueurs devinent un nombre. Le plus proche gagne (égalités : le gain est partagé).
> *« Combien de minutes de retard pour Hugo ? »*

### 3. Classement (`ranking`)
Les joueurs classent les options. Le score dépend de la proximité avec le classement réel (le meilleur score gagne, ou le podium se partage la cagnotte).
> *« Ordre d'arrivée des potes à la soirée »*

---

## 💰 Calcul des gains (pari mutuel)

Toutes les mises d'un pari forment une **cagnotte**. Une fois le résultat connu :

```
cagnotte   = somme de toutes les mises
commission = cagnotte × house_fee_percent   (0 % par défaut)
à_partager = cagnotte − commission

gain d'un gagnant = à_partager × (sa mise / somme des mises gagnantes)
```

La cote affichée évolue en direct selon la répartition des mises :

```
cote ≈ à_partager / mises sur cette option
```

Cas particuliers :
- **Personne n'a gagné** → toutes les mises sont remboursées.
- **Pari annulé** → toutes les mises sont remboursées.
- **Égalité** → les gagnants se partagent la cagnotte au prorata de leurs mises.

---

## ⚙️ Règles modifiables

Toutes les règles sont dans **`server/src/config/rules.json`**. Modifier le fichier suffit, aucun code à toucher.

```json
{
  "starting_points": 1000,
  "min_bet": 10,
  "max_bet_percent_of_balance": 50,
  "house_fee_percent": 0,
  "daily_bonus": 50,
  "bankruptcy_refill": 100,
  "betting_closes_before_event_minutes": 0,
  "who_can_create_bets": "everyone",
  "who_can_settle_bets": "creator_or_admin",
  "settlement_requires_confirmation": true
}
```

| Règle | Rôle |
|---|---|
| `starting_points` | Points donnés en rejoignant un groupe |
| `min_bet` | Mise minimale |
| `max_bet_percent_of_balance` | Plafond de mise, en % du solde |
| `house_fee_percent` | Commission prélevée sur la cagnotte |
| `daily_bonus` | Points offerts chaque jour de connexion |
| `bankruptcy_refill` | Points redonnés si le solde tombe à 0 |
| `betting_closes_before_event_minutes` | Clôture des mises avant l'événement |
| `who_can_create_bets` | `everyone` ou `admin` |
| `who_can_settle_bets` | `creator`, `admin` ou `creator_or_admin` |
| `settlement_requires_confirmation` | Un 2ᵉ joueur doit valider le résultat |

> Évolution possible : surcharger ces règles **par groupe** depuis l'interface (stockées en base).

---

## 🔐 Groupes et accès

1. Un joueur crée un groupe → il reçoit un **code d'invitation** (ex. `K7P2-XQ9M`).
2. Ses amis entrent le code et choisissent un pseudo.
3. Chaque joueur a un **solde par groupe**.
4. Les paris, soldes et classements sont **isolés par groupe**.

Authentification : pseudo + mot de passe (simple)

---

## 📱 Responsive et navigation

- **Mobile first** : conçu à partir de 360 px de large.
- **Mobile** : barre d'onglets fixe en bas (Paris · Créer · Classement · Profil), zones tactiles ≥ 44 px.
- **Tablette / ordinateur** : barre latérale, contenu en grille.
- **Parcours court** : créer un pari en 3 étapes maximum, miser en 2 appuis.
- **Transitions** légères, états de chargement (squelettes), aucun rechargement de page.
- Accessibilité de base : contrastes, focus visibles, libellés explicites.

---

## 🌐 Langue

- Tous les textes affichés sont dans `client/src/i18n/fr.json`.
- Le code, les noms de variables, les routes d'API, les tables SQL et les commits sont **en anglais**.

---

## 🗄️ Modèle de données (aperçu)

| Table | Contenu |
|---|---|
| `groups` | Nom, code d'invitation |
| `users` | Pseudo, authentification |
| `memberships` | Utilisateur ↔ groupe, solde, rôle |
| `bets` | Question, type, statut, options, date de clôture |
| `wagers` | Mise d'un joueur sur un pari (choix, montant) |
| `transactions` | Historique des points (mise, gain, bonus, remboursement) |

Statuts d'un pari : `open` → `closed` → `settled` (ou `cancelled`).

---

## 🗺️ Feuille de route

### V1 : MVP
- [ ] Création d'un compte
- [ ] Création / rejoindre un groupe via code
- [ ] Création de paris (3 types)
- [ ] Mises et cotes dynamiques
- [ ] Résolution des paris et distribution des gains
- [ ] Classement du groupe
- [ ] Interface responsive complète

### V2 : idées
- [ ] Règles modifiables par groupe depuis l'interface
- [ ] Commentaires sur les paris
- [ ] Badges et statistiques (meilleur pronostiqueur, série de victoires)

---
