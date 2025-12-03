import nextIntl from "next-intl/plugin";

// Apuntamos explícitamente al archivo de request i18n
const withNextIntl = nextIntl("./src/i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withNextIntl(nextConfig);
