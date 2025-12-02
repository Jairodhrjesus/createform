"use client";

import { useState, useEffect } from "react";
import Link from "next/link"; // Necesario para la navegación a la página de edición
import { client } from "@/utils/amplify-utils";
import type { Schema } from "@/amplify/data/resource";

export default function Dashboard() {
  // Estado local para guardar la lista de encuestas
  const [surveys, setSurveys] = useState<Schema["Survey"]["type"][]>([]);

  // 1. Suscribirse a los datos en tiempo real
  useEffect(() => {
    const subscription = client.models.Survey.observeQuery().subscribe({
      next: ({ items }) => {
        setSurveys([...items]);
      },
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. Función para crear una encuesta
  const handleCreateSurvey = async () => {
    // Es importante usar window.prompt para evitar problemas con la navegación
    const title = window.prompt("¿Cómo se llamará tu nueva encuesta?");
    if (!title) return;

    // Payload de datos y cast para saltar el bug de tipado conocido
    const payload = {
        title: title,
        description: "Borrador inicial",
        isActive: true,
    };
    
    // Guardar en DynamoDB
    const { errors } = await client.models.Survey.create(
        payload as unknown as Schema["Survey"]["createType"]
    );

    if (errors) {
      console.error(errors);
      alert("Error al crear la encuesta");
    }
  };

  // 3. Función para borrar
  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que quieres borrarla?")) return;
    await client.models.Survey.delete({ id });
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Mis Encuestas</h2>
        <button
          onClick={handleCreateSurvey}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
        >
          + Crear Nueva
        </button>
      </div>

      {surveys.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300">
          <p className="text-gray-500">No tienes encuestas creadas.</p>
          <p className="text-sm text-gray-400">¡Dale al botón azul!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {surveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition flex justify-between items-center"
            >
              <div>
                <h3 className="font-bold text-lg text-blue-900">{survey.title}</h3>
                <p className="text-xs text-gray-400 font-mono mt-1">ID: {survey.id}</p>
                {/* Enlace para compartir la versión embebible */}
                <p className="text-xs text-gray-500 mt-2">
                    Link público (Embed): 
                    <code className="text-blue-500 ml-1 cursor-pointer select-all">
                        {`http://localhost:3000/embed/${survey.id}`}
                    </code>
                </p>
              </div>
              
              <div className="flex gap-3">
                {/* ESTE ES EL BOTÓN QUE REDIRIGE AL EDITOR DINÁMICO */}
                <Link 
                  href={`/surveys/${survey.id}`}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700 font-semibold"
                >
                  Editar
                </Link>

                <button 
                  onClick={() => handleDelete(survey.id)}
                  className="px-3 py-1 text-sm bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"
                >
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}