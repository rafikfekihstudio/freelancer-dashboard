import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "./db"
import { users } from "./db/schema"
import { eq } from "drizzle-orm"

declare module "next-auth" {
  interface User {
    role: string
    avatarUrl: string | null
  }
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      image?: string | null
    }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null
        const email = credentials.email as string
        const password = credentials.password as string

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .get()

        if (!user) return null

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      const uid = Number(token.sub)
      if (uid) {
        const fresh = await db
          .select({ avatarUrl: users.avatarUrl })
          .from(users)
          .where(eq(users.id, uid))
          .get()
        token.picture = fresh?.avatarUrl ?? null
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string
        session.user.id = token.sub as string
        session.user.image = token.picture as string | null | undefined
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
