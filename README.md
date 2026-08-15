# Matrimony Expo MVP + Node/Express/MongoDB Backend

## Stack
- Mobile: React Native + Expo
- Navigation: React Navigation
- API: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT + bcryptjs
- Image upload: Multer (local MVP storage)

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Set `MONGO_URI`, `JWT_SECRET`, and `PORT` in `.env`.

The backend exposes:
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/profiles
- GET /api/profiles/:id
- POST /api/interests/:profileId
- GET /api/interests/sent
- GET /api/me

Uploaded images are stored in `backend/uploads`.

## 2. Expo app

```bash
cd mobile
npm install
npx expo start
```

Create `mobile/.env` from `.env.example` and set:

```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:5000/api
```

For a physical Android phone, do not use `localhost`; use the computer's LAN IP and keep both devices on the same Wi-Fi.

## Notes
This is an MVP. For production:
- use HTTPS
- store images in S3/Cloudinary instead of local uploads
- add refresh tokens
- add email/phone verification
- add rate limiting and stronger validation
- add moderation/report/block features
- use a production MongoDB deployment
