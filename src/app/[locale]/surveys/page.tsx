import { redirect } from "next/navigation";

export default function SurveysIndexPage({
  params,
}: {
  params: { locale: string };
}) {
  // Por ahora redirigimos al dashboard principal del locale.
  redirect(`/${params.locale}`);
}
