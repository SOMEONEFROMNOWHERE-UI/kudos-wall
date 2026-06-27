import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect, { memoryDb } from '@/lib/mongodb';
import User from '@/lib/models/User';
import { v4 as uuidv4 } from 'uuid';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const name = user.name || user.email.split('@')[0];
      user.name = name;
      
      try {
        const db = await dbConnect();
        
        if (!db) {
          // Use in-memory database
          let existingUser = memoryDb.users.find((u: any) => u.name === user.name);
          if (!existingUser) {
            memoryDb.users.push({
              _id: uuidv4(),
              name: user.name,
              streak: 0,
              lastKudosGiven: null,
              createdAt: new Date().toISOString()
            });
          }
          return true;
        }

        // Find or create user in MongoDB
        const existingUser = await User.findOne({ name: user.name });
        
        if (!existingUser) {
          // New user
          await User.create({
            name: user.name,
            streak: 0,
            lastKudosGiven: null,
          });
        }
        
        return true;
      } catch (error) {
        console.error('Error during signIn:', error);
        return false;
      }
    },
    async session({ session }) {
      // Pass the user name through the session
      return session;
    }
  },
  pages: {
    signIn: '/', // Using our custom landing page
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
