// Wires Auth.js (NextAuth v5 beta) handlers into Next.js App Router.
// Without this file every /api/auth/* request (sign-in, callback, session, sign-out) 404s.
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
