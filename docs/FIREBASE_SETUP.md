# Firebase Push Notifications Setup

Push notifications use **Firebase Cloud Messaging (FCM)** only. No in-app notification inbox on the backend.

## 1. Create Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/)
2. **Add project** (Spark/free plan is enough)
3. Enable **Cloud Messaging** (enabled by default)

## 2. Web app (frontend)

1. Project settings → **Your apps** → Add **Web** app
2. Copy the Firebase config object → use as `VITE_FIREBASE_*` env vars in the frontend
3. Project settings → **Cloud Messaging** → **Web Push certificates** → Generate key pair → `VITE_FIREBASE_VAPID_KEY`

## 3. Service account (backend)

1. Project settings → **Service accounts**
2. **Generate new private key** → downloads JSON file
3. Add to backend `.env` (do **not** commit the JSON file):

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Copy `project_id`, `client_email`, and `private_key` from the JSON. Keep `\n` in the private key string (quoted).

## 4. Restart backend

```bash
npm run start:dev
```

You should see: `Firebase initialized (project: your-project-id)`

If vars are missing: `Firebase not configured — push notifications disabled`.

## 5. Client flow

1. User logs in
2. Frontend requests notification permission + FCM token
3. `POST /notifications/devices/register` with `{ token, platform: "web" }`
4. When a backend event fires → FCM push to all registered tokens for that user
5. On logout → `DELETE /notifications/devices/:token`

## Events that trigger push

| Event | Recipients |
|-------|------------|
| User registered | All admins |
| Email verified | All admins |
| Owner KYC submitted | All admins |
| Owner KYC approved / rejected | Owner |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No push received | Check backend Firebase env vars and server logs |
| `messaging/registration-token-not-registered` | Token expired — re-register after login |
| Web push not showing | Browser permission denied; check VAPID key |
| CORS / mixed content | Use HTTPS in production for web push |
