"use client";

import AuthGuard from "@/components/AuthGuard";
import UserProfileSettings from "@/components/user/UserProfileSettings";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { updateUserAttributes, updatePassword } from "aws-amplify/auth";

export default function SettingsPage() {
  const { user } = useAuthenticator();

  const userData = {
    name: user?.attributes?.name || user?.username || "",
    email: (user as any)?.attributes?.email || "",
    username: user?.username || "",
  };

  return (
    <AuthGuard>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <UserProfileSettings
          user={userData}
          onUpdateName={async (newName) => {
            await updateUserAttributes({
              user,
              userAttributes: { name: newName },
            });
          }}
          onUpdateEmail={async (newEmail) => {
            await updateUserAttributes({
              user,
              userAttributes: { email: newEmail },
            });
          }}
          onChangePassword={async (oldP, newP) => {
            await updatePassword({ oldPassword: oldP, newPassword: newP });
          }}
        />
      </div>
    </AuthGuard>
  );
}
