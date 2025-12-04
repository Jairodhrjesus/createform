"use client";

import { Spinner } from "@radix-ui/themes";

// Simple spinner to display while checking authentication state
export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <Spinner size="3" />
    </div>
  );
}
