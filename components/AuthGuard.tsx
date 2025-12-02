"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

/**
 * Route guard that redirects unauthenticated users and shows a spinner while loading.
 */
export default function AuthGuard({
  children,
  required = true,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const router = useRouter();

  const isLoading = authStatus === "configuring";

  useEffect(() => {
    if (required && authStatus === "unauthenticated") {
      router.push("/");
    }
  }, [authStatus, router, required]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
        <p className="ml-4 text-gray-600">Verificando sesion...</p>
      </div>
    );
  }

  if (required && authStatus !== "authenticated") {
    return null;
  }

  return <>{children}</>;
}
