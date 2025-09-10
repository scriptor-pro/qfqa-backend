# QFQA Backend

Backend API pour l'application QFQA - Une application d'emploi du temps bienveillante pour les personnes TDAH, autistes ou les deux.

## 🚀 Démarrage rapide

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
```

### Production

```bash
npm start
```

## 📋 API Endpoints

Le serveur fonctionne sur le port 3001 par défaut.

### Santé et test

- `GET /health` - Vérification de l'état du serveur
- `GET /api/test` - Test de l'API avec la liste des endpoints

### Authentification (`/api/auth`)

- `POST /api/auth/register` - Inscription
  ```json
  {
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }
  ```

- `POST /api/auth/login` - Connexion
  ```json
  {
    "email": "test@example.com", 
    "password": "password123"
  }
  ```

- `GET /api/auth/check-username/:username` - Vérifier la disponibilité d'un nom d'utilisateur
- `GET /api/auth/verify` - Vérifier un token JWT (Header: `Authorization: Bearer <token>`)
- `POST /api/auth/logout` - Déconnexion

### Planning (`/api/schedule`) 

*Nécessite authentification*

- `GET /api/schedule/elements` - Récupérer les éléments du planning
- `POST /api/schedule/elements` - Créer un nouvel élément
  ```json
  {
    "title": "Petit déjeuner",
    "type": "fixed",
    "startTime": "08:00",
    "endTime": "08:30",
    "energyRequired": 2,
    "category": "routine"
  }
  ```
- `PUT /api/schedule/elements/:id` - Modifier un élément
- `DELETE /api/schedule/elements/:id` - Supprimer un élément
- `POST /api/schedule/elements/:id/move` - Déplacer un élément flottant

### Énergie (`/api/schedule`) 

*Nécessite authentification*

- `GET /api/schedule/energy` - Récupérer le niveau d'énergie actuel
- `POST /api/schedule/energy` - Mettre à jour le niveau d'énergie
  ```json
  {
    "level": 3
  }
  ```

### Utilisateur (`/api/user`)

*Nécessite authentification*

- `GET /api/user/profile` - Récupérer le profil utilisateur
- `PUT /api/user/profile` - Mettre à jour le profil
- `GET /api/user/stats?period=day|week|month` - Récupérer les statistiques
- `POST /api/user/setup` - Configuration initiale (onboarding)
- `POST /api/user/change-password` - Changer le mot de passe
- `DELETE /api/user/account` - Supprimer le compte

## 🔧 Configuration

Variables d'environnement (fichier `.env`) :

```
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## 📁 Structure du projet

```
src/
├── app.js              # Point d'entrée principal
├── routes/             # Définition des routes API
│   ├── auth.js         # Authentification
│   ├── schedule.js     # Planning et énergie
│   └── user.js         # Gestion utilisateur
├── middleware/         # Middlewares personnalisés (à implémenter)
├── models/            # Modèles de données (à implémenter) 
└── utils/             # Utilitaires (à implémenter)
```

## 🚧 À implémenter

- [ ] Base de données (MongoDB/PostgreSQL)
- [ ] Authentification JWT complète
- [ ] Hachage des mots de passe
- [ ] Validation avancée des données
- [ ] Tests unitaires et d'intégration
- [ ] Documentation API (Swagger)
- [ ] Gestion des erreurs améliorée
- [ ] Logs structurés
- [ ] Rate limiting
- [ ] HTTPS en production

## 🧪 Tests

```bash
# Tests à implémenter
npm test
```

## 📝 Notes de développement

- Actuellement, les données sont simulées (pas de base de données)
- L'authentification JWT est simplifiée pour les tests
- Les mots de passe ne sont pas hashés (à corriger en production)
- Tous les endpoints avec authentification acceptent n'importe quel token non vide

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajouter une nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request