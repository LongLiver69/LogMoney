import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      username: string;
      role: "admin" | "user";
      approved: boolean;
    };
  }

  interface User {
    id: string;
    username: string;
    role: "admin" | "user";
    approved: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Vui lòng nhập tên đăng nhập và mật khẩu");
        }

        await dbConnect();

        const user = await User.findOne({
          username: (credentials.username as string).toLowerCase(),
        });

        if (!user) {
          throw new Error("Tên đăng nhập hoặc mật khẩu không đúng");
        }

        // Plain text password comparison
        if (credentials.password !== user.password) {
          throw new Error("Tên đăng nhập hoặc mật khẩu không đúng");
        }

        if (!user.approved && user.role !== "admin") {
          throw new Error(
            "Tài khoản chưa được phê duyệt. Vui lòng liên hệ admin."
          );
        }

        return {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          role: user.role,
          approved: user.approved,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.approved = user.approved;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as "admin" | "user";
        session.user.approved = token.approved as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
