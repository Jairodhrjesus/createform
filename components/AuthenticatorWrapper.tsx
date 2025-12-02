"use client";

import type { ReactNode } from "react";
import { Authenticator } from "@aws-amplify/ui-react";

/**
 * Wraps children with the Amplify Authenticator context provider.
 */
export default function AuthenticatorWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <Authenticator.Provider>{children}</Authenticator.Provider>;
}
