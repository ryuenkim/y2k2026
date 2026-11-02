# Y2K Tech Shop

## Run the frontend

```powershell
npm install
npm run dev
```

Set `VITE_API` in `frontend/.env.local` if the backend is not running at `http://localhost:4000/api/v1`.

## Deploy on Render

Create a Render **Static Site** from the frontend repository with:

- Build command: `npm install && npm run build`
- Publish directory: `dist`

Set `VITE_API` to the deployed backend URL ending in `/api/v1`, along with the
`VITE_FIREBASE_*` variables. Vite embeds these values during the build, so deploy
again after changing them.

## Run the backend

From `backend/`, install dependencies and start the API with `npm install` and `npm run dev`. The server loads environment variables from `backend/config/.env`.

Copy `frontend/.env.example` to `frontend/.env.local` and `backend/config/.env.example` to `backend/config/.env` before configuring the integrations below. Keep the copied `.env` files out of source control.

## Profile photo gallery

Account profiles support up to 8 PNG, JPG, or WebP photos (2 MB each), stored through the backend's Cloudinary configuration. Product cards, product details, and the profile display multiple photos with previous/next controls.

## Google and Facebook sign-in setup

Social sign-in uses Firebase Authentication in the frontend and verifies Firebase ID tokens on the backend.

1. Create a Firebase project, add a Web app, and enable Google and/or Facebook under **Authentication → Sign-in method**.
2. For Facebook, add the Facebook App ID and App Secret to the Firebase provider settings. In Meta for Developers, add Firebase's OAuth redirect URI to the Facebook Login valid OAuth redirect URIs, and ensure the Facebook app requests the `email` permission.
3. Add `localhost` under **Authentication → Settings → Authorized domains** for local testing, and add your production domain when deployed.
4. Set these variables in `frontend/.env.local` using the Firebase Web app configuration:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
5. Create a Firebase service account and set these backend variables in `backend/config/.env`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (preserve line breaks as `\n`)
6. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_EMAIL`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, and `SMTP_FROM_NAME` there to send order status and receipt emails.
7. Restart the Vite frontend and backend after setting the variables.

Keep service-account credentials out of source control. Google sign-in requires a verified email. Facebook sign-in also works when Facebook does not return an email; in that case, the customer is sent to their profile to add one before checkout so order updates and receipts have a destination. An email is only used to link a Facebook sign-in to an existing account when Facebook marks it verified.

For an existing MongoDB database, update the unique email index once so multiple email-less Facebook accounts can be stored. Check the current index with `db.users.getIndexes()`, then replace the existing `email_1` index with:

```javascript
db.users.dropIndex("email_1")
db.users.createIndex({ email: 1 }, { unique: true, sparse: true })
```

New databases get the sparse unique index from the user model automatically.
