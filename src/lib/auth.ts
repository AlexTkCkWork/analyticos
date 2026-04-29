import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Credentials from 'next-auth/providers/credentials'
import {DrizzleAdapter} from "@auth/drizzle-adapter"
import {db} from '@/lib/db'
import {users} from '@/lib/db/schema'
import {eq} from 'drizzle-orm'
import {compare} from 'bcryptjs'
import {z} from 'zod'

const CredentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

export const {auth, handlers, signIn, signOut} = NextAuth({
    adapter: DrizzleAdapter(db),

    providers: [
        GitHub({
            clientId: process.env.AUTH_GITHUB_ID!,
            clientSecret: process.env.AUTH_GITHUB_SECRET!,
        }),
        Credentials({
            credentials: {
                email: {label: 'Email', type: 'email'},
                password: {label: 'Password', type: 'password'},
            },
            async authorize(credentials) {
                const parsed = CredentialsSchema.safeParse(credentials);

                if (!parsed.success) return null;

                const {email, password} = parsed.data;

                const user = await db.query.users.findFirst({
                    where: eq(users.email, email),
                });

                if (!user?.hashedPassword) return null;

                const valid = await compare(password, user.hashedPassword);

                if (!valid) return null;

                return user;
            }
        })
    ],

    session: {
        strategy: 'database',
    },

    callbacks: {
        async session({session, user}) {
            if (session.user) {
                session.user.id = user.id
            }

            return session
        }
    },

    pages: {
        signIn: '/login',
        error: '/auth/error'
    }
})