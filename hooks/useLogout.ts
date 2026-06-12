"use client";

import { useCallback } from "react";
import { useMutation, gql } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

const LOGOUT_MUTATION = gql`
  mutation Logout($refreshToken: String!) {
    logout(refreshToken: $refreshToken)
  }
`;

export function useLogout() {
  const { logout } = useAuth();
  const router     = useRouter();

  const [logoutMutation, { loading }] = useMutation(LOGOUT_MUTATION);

  const handleLogout = useCallback(async () => {
    const rt = localStorage.getItem("iwms:rt");
    try {
      if (rt) await logoutMutation({ variables: { refreshToken: rt } });
    } finally {
      // Always clear local state regardless of server response
      logout();
      router.push("/login");
    }
  }, [logoutMutation, logout, router]);

  return { logout: handleLogout, loading };
}
