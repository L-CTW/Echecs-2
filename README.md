# Échecs — Cathédrale Gothique

Jeu d’échecs 3D pensé pour **iPad** (Safari, plein écran) : nef gothique de nuit, vitraux colorés, torches vacillantes, sol miroitant. Pièces **marbre blanc** contre **obsidienne**, prises en éclats et étincelles avec zoom caméra, **4 vues**, sons ambiants et **IA adverse** (Noirs).

## Jouer

### Sur iPad

1. Ouvrez l’URL de l’app (ou `npm run dev` sur le même réseau via l’IP affichée par Vite).
2. Touchez l’écran une fois pour activer le son.
3. **Touchez une pièce blanche**, puis une case verte (ou une prise orange).
4. Changez de vue avec les boutons en bas (Dramatique, Joueur, Galerie, Évêché).

### En local

```bash
npm install
npm run dev
```

Puis ouvrez `http://127.0.0.1:5173`.

```bash
npm run build
npm run preview
```

## Contrôles

| Action | Gestuelle |
|--------|-----------|
| Sélectionner / jouer | Toucher pièce ou case |
| Nouvelle partie | Bouton « Nouvelle partie » |
| Annuler | Dernier coup (votre tour uniquement) |

Vous êtes les **Blancs** ; l’ordinateur joue les Noirs.

## Stack

- [Vite](https://vitejs.dev/) + TypeScript
- [Three.js](https://threejs.org/) (éclairage, ombres, bloom)
- [chess.js](https://github.com/jhlywa/chess.js) (règles & IA minimax)
