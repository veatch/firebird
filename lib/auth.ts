import { NextAuthOptions } from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'playlist-read-private'
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'spotify' && account.access_token) {
        try {
          // Create or update user in database
          await prisma.user.upsert({
            where: { spotifyId: user.id },
            update: {
              accessToken: account.access_token,
              refreshToken: account.refresh_token || '',
              updatedAt: new Date()
            },
            create: {
              spotifyId: user.id,
              accessToken: account.access_token,
              refreshToken: account.refresh_token || ''
            }
          })
          return true
        } catch (error) {
          console.error('Error creating/updating user:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.user.id = token.id as string
      return session
    }
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
  },
} 