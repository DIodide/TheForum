# Spec: Authentication (Microsoft EntraID)

## Overview
Princeton students authenticate via Microsoft EntraID (Azure AD) using their university credentials. Auth.js v5 handles the OAuth2 Authorization Code flow. The NetID is extracted from the Microsoft Graph `userPrincipalName` field.

## Requirements

### P0
- Users sign in with Princeton Microsoft credentials
- NetID extracted from `userPrincipalName` (e.g., `iamin@princeton.edu` → `iamin`)
- User record created/updated in DB on first/subsequent sign-ins
- Session includes: `userId`, `netId`, `displayName`, `email`, `onboarded` flag
- Unauthenticated users can only access the landing page
- Un-onboarded users are redirected to `/onboarding`
- Sign out clears session and redirects to landing page

### P1
- Full Microsoft logout (redirect to Microsoft's logout endpoint, then back to app)
- Session refresh without re-authentication (Auth.js handles via JWT rotation)

## Auth.js Configuration

**Provider:** `AzureADProvider` from `next-auth/providers/azure-ad`

**Env vars:**
```
AUTH_SECRET=<random-secret>
AUTH_AZURE_AD_CLIENT_ID=<from-entra-registration>
AUTH_AZURE_AD_CLIENT_SECRET=<from-entra-registration>
AUTH_AZURE_AD_TENANT_ID=2ff60116-7431-425d-b5af-077d7791bda4
```

**Callbacks:**
- `signIn`: Upsert user in `users` table. Return `true` to allow sign-in.
- `jwt`: Add `userId`, `netId`, `onboarded` to JWT token.
- `session`: Expose `userId`, `netId`, `onboarded` on `session.user`.

**Adapter:** `DrizzleAdapter` from `@auth/drizzle-adapter` — but note that Auth.js adapters expect specific table names (`accounts`, `sessions`, `verification_tokens`). We may use JWT strategy instead to avoid extra tables.

**Strategy:** JWT (stateless sessions, no DB session table needed).

## Middleware

```
Matcher: everything except /, /api/auth/*, /_next/*, /favicon.ico, static assets

Logic:
  1. Get session via auth()
  2. No session → redirect to /
  3. Session but !onboarded → redirect to /onboarding (unless already there)
  4. On /onboarding but already onboarded → redirect to /explore
  5. Otherwise → pass through
```

## Azure AD App Registration

Steps (from reference implementation README):
1. Go to https://entra.microsoft.com
2. Register new application
3. Set redirect URI: `http://localhost:3000/api/auth/callback/azure-ad` (dev)
4. Generate client secret
5. Note: Application (client) ID, Client secret value, Tenant ID
6. API permissions: `User.Read` (Microsoft Graph) — should be granted by default
