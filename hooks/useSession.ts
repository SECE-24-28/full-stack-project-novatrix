"use client";

import { useQuery, gql } from "@apollo/client";
import { useAuth } from "@/components/providers/AuthProvider";
import type { AuthUser } from "@/components/providers/AuthProvider";

const ME_QUERY = gql`
  query Me {
    me {
      id email firstName lastName role isActive
    }
  }
`;

interface UseSessionReturn {
  user:            AuthUser | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  /** Re-fetch the server session (e.g. after role change) */
  refresh:         () => void;
}

/**
 * Extends useAuth by validating the local session against the server.
 * Use this in layouts that need guaranteed server-side confirmation.
 */
export function useSession(): UseSessionReturn {
  const { user, isAuthenticated, logout, login, isLoading: authLoading } = useAuth();

  const { loading, refetch } = useQuery<{ me: AuthUser | null }>(ME_QUERY, {
    skip:        !isAuthenticated,
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      if (!data.me) {
        // Server no longer recognises this session
        logout();
      }
    },
    onError: () => {
      // GraphQL UNAUTHENTICATED error — clear local session
      logout();
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading: authLoading || loading,
    refresh:   refetch,
  };
}
