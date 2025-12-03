"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface UserData {
  name: string;
  email: string;
  username: string;
}

interface UserProfileSettingsProps {
  user: UserData;
  onUpdateName?: (newName: string) => Promise<void>;
  onUpdateEmail?: (newEmail: string) => Promise<void>;
  onChangePassword?: (oldP: string, newP: string) => Promise<void>;
}

export default function UserProfileSettings({
  user,
  onUpdateName,
  onUpdateEmail,
  onChangePassword,
}: UserProfileSettingsProps) {
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const t = useTranslations("Settings");

  const brandColor = "text-[#6b282c]";
  const brandRing = "focus:ring-[#6b282c]";

  const handleNameUpdate = async (name: string) => {
    if (!onUpdateName) return;
    setPending(true);
    setFeedback(null);
    try {
      await onUpdateName(name);
      setFeedback(t("button_update"));
    } catch (err: any) {
      setFeedback(err?.message || "Error");
    } finally {
      setPending(false);
    }
  };

  const handleEmailUpdate = async (email: string) => {
    if (!onUpdateEmail) return;
    setPending(true);
    setFeedback(null);
    try {
      await onUpdateEmail(email);
      setFeedback(t("button_update"));
    } catch (err: any) {
      setFeedback(err?.message || "Error");
    } finally {
      setPending(false);
    }
  };

  const handlePasswordChange = async (oldP: string, newP: string) => {
    if (!onChangePassword) return;
    setPending(true);
    setFeedback(null);
    try {
      await onChangePassword(oldP, newP);
      setFeedback(t("button_change_password"));
    } catch (err: any) {
      setFeedback(err?.message || "Error");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("profile_title")}</h1>
      <p className="text-gray-500 mb-8">{t("profile_subtitle")}</p>
      {feedback && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          {feedback}
        </div>
      )}

      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("info")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "info"
                ? `border-[#6b282c] ${brandColor}`
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {t("tab_info")}
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "security"
                ? `border-[#6b282c] ${brandColor}`
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {t("tab_security")}
          </button>
        </nav>
      </div>

      <div className="bg-white shadow-lg rounded-xl p-8">
        {activeTab === "info" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">{t("section_basic_info")}</h2>
            <p className="text-sm text-gray-500">{t("section_basic_info_desc")}</p>

            <div className="border-t pt-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t("field_name")}
              </label>
              <input
                id="name"
                type="text"
                defaultValue={user.name || user.username}
                className={`w-full max-w-lg px-3 py-2 border border-gray-300 rounded-lg shadow-sm ${brandRing} focus:border-[#6b282c] outline-none`}
                placeholder={t("field_name_placeholder")}
              />
              <button
                onClick={() => {
                  const input = document.getElementById("name") as HTMLInputElement | null;
                  if (input?.value) void handleNameUpdate(input.value);
                }}
                disabled={pending}
                className={`mt-3 px-4 py-2 bg-gray-50 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 ${brandColor} transition disabled:opacity-60`}
              >
                {pending ? t("loading") : t("button_update")}
              </button>
            </div>

            <div className="border-t pt-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t("field_email")}
              </label>
              <input
                id="email"
                type="email"
                defaultValue={user.email}
                className={`w-full max-w-lg px-3 py-2 border border-gray-300 rounded-lg shadow-sm ${brandRing} focus:border-[#6b282c] outline-none`}
                placeholder="ejemplo@createform.com"
              />
              <p className="text-xs text-gray-500 mt-1">{t("field_email_warning")}</p>
              <button
                onClick={() => {
                  const input = document.getElementById("email") as HTMLInputElement | null;
                  if (input?.value) void handleEmailUpdate(input.value);
                }}
                disabled={pending}
                className={`mt-3 px-4 py-2 bg-gray-50 border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 ${brandColor} transition disabled:opacity-60`}
              >
                {pending ? t("loading") : t("button_update")}
              </button>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">{t("section_security_title")}</h2>
            <p className="text-sm text-gray-500">{t("section_security_desc")}</p>

            <form
              className="space-y-4 border-t pt-6"
              onSubmit={(e) => {
                e.preventDefault();
                const oldP = (document.getElementById("old_password") as HTMLInputElement | null)?.value || "";
                const newP = (document.getElementById("new_password") as HTMLInputElement | null)?.value || "";
                if (oldP && newP) {
                  void handlePasswordChange(oldP, newP);
                }
              }}
            >
              <div>
                <label htmlFor="old_password" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("field_old_password")}
                </label>
                <input
                  id="old_password"
                  type="password"
                  className={`w-full max-w-lg px-3 py-2 border border-gray-300 rounded-lg shadow-sm ${brandRing} focus:border-[#6b282c] outline-none`}
                />
              </div>

              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                  {t("field_new_password")}
                </label>
                <input
                  id="new_password"
                  type="password"
                  className={`w-full max-w-lg px-3 py-2 border border-gray-300 rounded-lg shadow-sm ${brandRing} focus:border-[#6b282c] outline-none`}
                />
                <p className="text-xs text-gray-500 mt-1">{t("field_new_password_req")}</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="px-4 py-2 bg-[#6b282c] text-white rounded-lg shadow-sm text-sm font-medium hover:bg-[#562023] transition-colors disabled:opacity-60"
                >
                  {pending ? t("loading") : t("button_change_password")}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
