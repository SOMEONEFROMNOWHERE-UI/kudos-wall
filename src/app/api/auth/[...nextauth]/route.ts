import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email || !user.name) return false;
      
      try {
        await dbConnect();
        
        // Find or create user
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
