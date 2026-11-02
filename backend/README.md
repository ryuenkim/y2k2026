# Backend setup

Order placement, cancellation, and administrator order updates use MongoDB transactions. MongoDB must run as a replica set, including for local development.

For a single-node local replica set named `rs0`:

1. Start `mongod` with `--replSet rs0`.
2. Run `mongosh --eval "rs.initiate()"` once against that instance.
3. Copy `config/.env.example` to `config/.env` and set `DB_LOCAL_URI` to the example replica-set URI.
4. Add Firebase and SMTP credentials to `config/.env` to enable Google sign-in and receipt emails.

Set the remaining secrets and service credentials in `config/.env`; do not commit that file.
