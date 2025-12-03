"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "aws-amplify/auth";
import { useAuthenticator } from "@aws-amplify/ui-react";
import AuthFlow from "@/components/auth/AuthFlow";
import Navbar from "@/components/layout/Navbar";
import Dashboard from "@/components/dashboard/Dashboard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Home() {
  const { authStatus, user } = useAuthenticator((context) => [
    context.authStatus,
    context.user,
  ]);
  const [displayName, setDisplayName] = useState("");

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error saliendo:", error);
    }
  }, []);

  useEffect(() => {
    const nameFromUser =
      user?.signInDetails?.loginId ||
      (user as any)?.attributes?.preferred_username ||
      (user as any)?.attributes?.email ||
      user?.username ||
      (user as any)?.attributes?.name ||
      "";
    if (nameFromUser) setDisplayName(nameFromUser);
  }, [user]);

  const userName = displayName || user?.signInDetails?.loginId || user?.username;

  if (authStatus === "configuring") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (authStatus !== "authenticated") {
    return <AuthFlow />;
  }

  return (
    <div className="flex min-h-screen lg:h-screen flex-col overflow-y-auto lg:overflow-hidden bg-gray-50 text-black">
      <Navbar userName={userName} onSignOut={handleSignOut} />
      <div className="flex w-full flex-1 min-h-0 px-4 py-4 sm:px-6 lg:px-8 overflow-visible lg:overflow-hidden">
        <Dashboard />
      </div>
    </div>
  );
}
