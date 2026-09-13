import Google from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"

const authConfig = {
  providers: [Google],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        return profile?.email_verified === true
      }

      return true
    },
  },
} satisfies NextAuthConfig

export default authConfig
