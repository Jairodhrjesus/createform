import { getRequestConfig } from "next-intl/server";

const locales = ["es", "en"] as const;

export default getRequestConfig(async ({ locale }) => {
  const resolved: string =
    locale && locales.includes(locale as (typeof locales)[number]) ? locale : "es";

  return {
    locale: resolved,
    messages: (await import(`../../messages/${resolved}.json`)).default,
  };
});
