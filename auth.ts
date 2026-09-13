import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { TypeORMAdapter } from "@auth/typeorm-adapter"

import authConfig from "@/auth.config"
import { authEntities } from "@/lib/database/entities"
import { authenticateUser } from "@/lib/services/auth.service"

const dataSource = process.env.DATABASE_URL
  ? {
      type: "mysql" as const,
      url: process.env.DATABASE_URL,
      connectorPackage: "mysql2" as const,
      synchronize: false,
    }
  : {
      type: "mysql" as const,
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT ?? 3306),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      connectorPackage: "mysql2" as const,
      synchronize: false,
    }

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: TypeORMAdapter(dataSource, { entities: authEntities }),
  providers: [
    Google({
      allowDangerousEmailAccountLinking: false,
      authorization: {
        params: { prompt: "select_account" },
      },
    }),
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null
        }

        return authenticateUser(credentials.email, credentials.password)
      },
    }),
  ],
  session: { strategy: "jwt" },
  trustHost: true,
})
