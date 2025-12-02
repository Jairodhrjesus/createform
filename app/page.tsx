"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import Dashboard from "@/components/Dashboard"; 
import Link from "next/link"; // Importamos Link

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 text-black">
      {/* Barra de navegación superior */}
      <nav className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-blue-600">
            SaaS Encuestas
          </h1>
          {/* Nuevo: Botón para ir al historial de respuestas */}
          <Link 
             href="/submissions" 
             className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold transition"
          >
            Ver Respuestas
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Authenticator>
          {({ signOut, user }) => (
            <main>
              {/* Cabecera del usuario */}
              <div className="flex justify-between items-center mb-8 bg-white p-4 rounded shadow-sm">
                <div>
                  <p className="text-sm text-gray-500">Logueado como:</p>
                  <p className="font-mono text-sm font-bold">{user?.signInDetails?.loginId || user?.username}</p>
                </div>
                <button 
                  onClick={signOut} 
                  className="text-sm text-red-500 hover:text-red-700 font-semibold"
                >
                  Cerrar Sesión
                </button>
              </div>
              
              {/* Aquí cargamos tu componente conectado a BD */}
              <Dashboard />
              
            </main>
          )}
        </Authenticator>
      </div>
    </div>
  );
}