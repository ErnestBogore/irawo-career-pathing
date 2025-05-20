# Career Quest – Outil gamifié de career-pathing

Ce projet est une application Next.js ultra-légère conçue pour être déployée sur Vercel en un clic. Aucune base de données ni authentification : tout se passe côté navigateur + fonctions serverless.

## 🏃‍♂️ Quick start

1. Clone puis installe les dépendances :
```bash
pnpm i # ou npm install / yarn install
```
2. Ajoute ta clé OpenAI :
```bash
cp .env.local.example .env.local
# puis édite .env.local et renseigne
OPENAI_API_KEY=sk-....
```
3. Lance localement :
```bash
pnpm dev
```

## 🚀 Déploiement sur Vercel

1. Pousse le repo sur GitHub.
2. Sur vercel.com, *New Project* ➜ choisis ce repo.
3. Dans *Environment variables*, ajoute `OPENAI_API_KEY`.
4. Clique *Deploy*.

## ✨ Fonctionnement

1. **Upload du CV** (`.txt` ou `.pdf`).
2. **Questions d'aspiration** (rôle rêvé, tâches préférées, environnement).
3. Appel à l'API `/api/careers` qui interroge **OpenAI** et renvoie jusqu'à 5 suggestions au format JSON.
4. Affichage gamifié avec barres de progression.

> Aucune donnée n'est stockée après la session. 