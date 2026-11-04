# Backend setup

Order placement, cancellation, and administrator order updates use MongoDB transactions. MongoDB must run as a replica set, including for local development.

For a single-node local replica set named `rs0`:

1. Start `mongod` with `--replSet rs0`.
2. Run `mongosh --eval "rs.initiate()"` once against that instance.
3. Copy `config/.env.example` to `config/.env` and set `DB_LOCAL_URI` to the example replica-set URI.
4. Add Firebase and SMTP credentials to `config/.env` to enable Google sign-in and receipt emails.

Set the remaining secrets and service credentials in `config/.env`; do not commit that file.

## Deploy on Render

Create a Render **Web Service** from the backend repository with:

- Root directory: repository root
- Build command: `npm install`
- Start command: `npm start`

Add the production environment variables in Render. Set `NODE_ENV=production` and
`FRONTEND_URL` to the deployed frontend URL. Also configure `MONGO_URI` (or the
database variable used by your deployment), `JWT_SECRET`, Firebase, Cloudinary,
and SMTP credentials as needed. For Mailtrap, configure `SMTP_HOST`,
`SMTP_PORT=2525`, `SMTP_SECURE=false`, `SMTP_EMAIL`, `SMTP_PASSWORD`,
`SMTP_FROM_EMAIL`, and `SMTP_FROM_NAME`. Render supplies `PORT` automatically.
