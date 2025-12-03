"use client";

import { Authenticator } from "@aws-amplify/ui-react";

export default function AmplifyAuthProvider({ children }: { children: React.ReactNode }) {
  return <Authenticator.Provider>{children}</Authenticator.Provider>;
}
