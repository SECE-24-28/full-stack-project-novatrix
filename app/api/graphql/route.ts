import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { NextRequest } from "next/server";
import { schema } from "@/lib/graphql/schema";
import { prisma } from "@/lib/prisma/client";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import type { GraphQLContext } from "@/types/auth";

const server = new ApolloServer<GraphQLContext>({
  schema,
  formatError: (formattedError) => {
    // Never leak stack traces in production
    if (process.env.NODE_ENV === "production") {
      const { extensions, message } = formattedError;
      return { message, extensions: { code: extensions?.code ?? "INTERNAL_SERVER_ERROR" } };
    }
    return formattedError;
  },
});

const handler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(server, {
  context: async (req) => {
    // Try Authorization header first, then fallback to cookie
    const headerToken  = extractBearerToken(req.headers.get("authorization"));
    const cookieToken  = req.cookies.get("accessToken")?.value ?? null;
    const token        = headerToken ?? cookieToken;

    let auth = null;
    if (token) {
      try {
        const payload = await verifyAccessToken(token);
        auth = { userId: payload.sub, email: payload.email, role: payload.role };
      } catch {
        // Expired or tampered — treat as unauthenticated
      }
    }

    return {
      auth,
      prisma,
      ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null,
      userAgent: req.headers.get("user-agent") ?? null,
    };
  },
});

export { handler as GET, handler as POST };
