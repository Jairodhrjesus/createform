"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthenticator } from "@aws-amplify/ui-react";
import AuthGuard from "@/components/AuthGuard";
import { client } from "@/utils/amplify-utils";
import type { Schema } from "@/amplify/data/resource";

type SubmissionType = Schema["Submission"]["type"];

export default function SubmissionsPage() {
  const { authStatus, user, signOut } = useAuthenticator();

  const [submissions, setSubmissions] = useState<SubmissionType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      return;
    }

    const subscription = client.models.Submission.observeQuery().subscribe({
      next: ({ items }) => {
        setSubmissions(
          items.sort((a, b) =>
            (b.createdAt || "") > (a.createdAt || "") ? 1 : -1
          )
        );
        setLoading(false);
      },
      error: (err) => {
        console.error("Error cargando submissions (permiso?):", err);
        setLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [authStatus]);

  const getAnswerDetails = (submission: SubmissionType) => {
    try {
      const answersObj = JSON.parse(submission.answersContent as string);
      const count = Object.keys(answersObj).length;
      return `(${count} respuestas)`;
    } catch (e) {
      console.error("Error parsing answersContent:", e);
      return "(Error de formato)";
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-100 text-black">
        <nav className="bg-white shadow-sm px-6 py-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold tracking-tight text-blue-600">
              <Link href="/">Dashboard de Encuestas</Link>
            </h1>
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500">Admin: {user?.username}</p>
              <button
                onClick={signOut}
                className="text-sm text-red-500 hover:text-red-700 font-semibold"
              >
                Cerrar Sesion
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-extrabold mb-6 text-gray-800">
            Historial de Respuestas (Submissions)
          </h2>

          {loading && (
            <p className="text-center text-gray-500">Cargando datos...</p>
          )}

          {!loading && submissions.length === 0 && (
            <p className="text-center text-gray-500 py-10 border border-dashed rounded-lg bg-white">
              Aun no hay respuestas guardadas en tu base de datos.
            </p>
          )}

          {!loading && submissions.length > 0 && (
            <div className="grid gap-4">
              {submissions.map((s) => (
                <div
                  key={s.id}
                  className="bg-white p-6 rounded-lg shadow-md border flex justify-between items-center"
                >
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">
                      ID de Sesion:{" "}
                      <code className="font-mono text-xs">
                        {s.respondentId?.substring(0, 8)}...
                      </code>
                    </p>

                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-extrabold text-blue-800">
                        {s.totalScore} pts
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 font-semibold rounded-full text-sm">
                        {s.outcomeTitle}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Guardado el:{" "}
                      {s.createdAt
                        ? new Date(s.createdAt as string).toLocaleString()
                        : "Sin fecha"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {getAnswerDetails(s)}
                    </p>
                    <button
                      onClick={() =>
                        alert(`Respuestas JSON: ${s.answersContent}`)
                      }
                      className="mt-2 text-sm text-gray-700 hover:text-black underline"
                    >
                      Ver JSON Completo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
