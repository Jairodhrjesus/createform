"use client";
import { useAuthenticator } from "@aws-amplify/ui-react";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/layout/Navbar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SurveyResultsPanel from "@/components/submissions/SurveyResultsPanel";
import { useSubmissionsBySurvey } from "@/components/submissions/hooks/useSubmissionsBySurvey";
import { useSurveyMeta } from "@/components/submissions/hooks/useSurveyMeta";
import { useMemo } from "react";
import { useParams } from "next/navigation";

export default function SurveySubmissionsPage() {
  const params = useParams<{ id: string }>();
  const surveyId = params?.id;
  const { authStatus, user, signOut } = useAuthenticator();

  const userName = useMemo(() => {
    return (
      user?.signInDetails?.loginId ||
      (user as any)?.attributes?.preferred_username ||
      (user as any)?.attributes?.email ||
      user?.username ||
      ""
    );
  }, [user]);

  if (!surveyId) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <Navbar userName={userName} onSignOut={signOut} />
          <main className="mx-auto flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <h2 className="text-xl font-bold">Encuesta no encontrada</h2>
              <p>La encuesta que buscas no existe o no tienes permiso para verla.</p>
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  const { survey, loading: loadingMeta, error: errorMeta } = useSurveyMeta(surveyId);
  const { submissions, loading: loadingSubmissions, error: errorSubmissions } = useSubmissionsBySurvey(surveyId);

  const isLoading = loadingMeta || loadingSubmissions;
  const error = errorMeta || errorSubmissions;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar userName={userName} onSignOut={signOut} />
        <main className="mx-auto flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <p className="font-bold">Error cargando datos</p>
              <p className="text-sm">{error.message}</p>
            </div>
          )}

          {!isLoading && !error && !survey && (
            <div className="text-center py-12">
              <h2 className="text-xl font-bold">Encuesta no encontrada</h2>
              <p>La encuesta que buscas no existe o no tienes permiso para verla.</p>
            </div>
          )}

          {survey && (
            <SurveyResultsPanel 
              survey={survey}
              submissions={submissions}
              isLoading={isLoading}
            />
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
