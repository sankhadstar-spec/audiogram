// Google sign-in via Auth.js (NextAuth v5)
// npm install next-auth@beta @auth/prisma-adapter
//
// Setup (Google Cloud Console):
// 1. console.cloud.google.com -> APIs & Services -> Credentials -> Create OAuth client ID
// 2. Application type: Web application
// 3. Authorized redirect URI: https://YOUR_DOMAIN/api/auth/callback/google
//    (and http://localhost:3000/api/auth/callback/google for local dev)
// 4. Copy the Client ID + Client Secret into .env (see .env.example)

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "database" },
  callbacks: {
    // expose the internal user id on the session so API routes can use it directly
    async session({ session, user }) {
      if (session.user) (session.user as { id: string }).id = user.id;
      return session;
    },
  },
  pages: {
    signIn: "/", // the "Sign in with Google" button on the feed triggers this inline
  },
});
