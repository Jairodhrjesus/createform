"use client";

import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";
import Dashboard from "@/components/Dashboard";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Home() {
  const { authStatus, user, signOut } = useAuthenticator();

  const isLoading = authStatus === "configuring";
  const isAuthenticated = authStatus === "authenticated";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingSpinner />
        <p className="ml-4 text-gray-600">Verificando sesion...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-black">
      <nav className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-blue-600">
            SaaS Encuestas
          </h1>
          <Link
            href="/submissions"
            className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold transition"
          >
            Ver Respuestas
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {isAuthenticated ? (
          <main>
            <div className="flex justify-between items-center mb-8 bg-white p-4 rounded shadow-sm">
              <div>
                <p className="text-sm text-gray-500">Logueado como:</p>
                <p className="font-mono text-sm font-bold">
                  {user?.signInDetails?.loginId || user?.username}
                </p>
              </div>
              <button
                onClick={signOut}
                className="text-sm text-red-500 hover:text-red-700 font-semibold"
              >
                Cerrar Sesion
              </button>
            </div>

            <Dashboard />
          </main>
        ) : (
          <div className="max-w-md mx-auto bg-white p-6 rounded shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-center">
              Inicia sesion o registrate
            </h2>
            <Authenticator />
          </div>
        )}
      </div>
    </div>
  );
}
