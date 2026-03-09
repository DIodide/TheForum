import { db, eq, users } from "@the-forum/database";
import NextAuth from "next-auth";
import type { MicrosoftEntraIDProfile } from "next-auth/providers/microsoft-entra-id";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { env } from "~/env";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: env.AUTH_AZURE_AD_CLIENT_ID,
      clientSecret: env.AUTH_AZURE_AD_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${env.AUTH_AZURE_AD_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) return false;

      const entraProfile = profile as unknown as MicrosoftEntraIDProfile;

      // Extract NetID from UPN (e.g., "iamin@princeton.edu" → "iamin")
      const upn = entraProfile.upn ?? entraProfile.preferred_username ?? profile.email;
      const netId = upn.split("@")[0]?.toLowerCase();

      // Upsert user
      const existing = await db.select().from(users).where(eq(users.netId, netId)).limit(1);

      if (existing.length === 0) {
        await db.insert(users).values({
          netId,
          email: profile.email,
          displayName: profile.name ?? netId,
        });
      } else {
        await db
          .update(users)
          .set({
            displayName: profile.name ?? existing[0]?.displayName,
            email: profile.email,
            updatedAt: new Date(),
          })
          .where(eq(users.netId, netId));
      }

      return true;
    },

    async jwt({ token, profile }) {
      if (profile?.email) {
        const entraProfile = profile as unknown as MicrosoftEntraIDProfile;
        const upn = entraProfile.upn ?? entraProfile.preferred_username ?? profile.email;
        const netId = upn.split("@")[0]?.toLowerCase();

        const [user] = await db.select().from(users).where(eq(users.netId, netId)).limit(1);

        if (user) {
          token.userId = user.id;
          token.netId = user.netId;
          token.onboarded = user.onboarded;
        }
      } else if (token.userId) {
        // Re-check onboarded status from DB on subsequent requests
        const [user] = await db
          .select({ onboarded: users.onboarded })
          .from(users)
          .where(eq(users.id, token.userId as string))
          .limit(1);
        if (user) {
          token.onboarded = user.onboarded;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.netId = token.netId as string;
        session.user.onboarded = token.onboarded as boolean;
      }
      return session;
    },
  },
});
