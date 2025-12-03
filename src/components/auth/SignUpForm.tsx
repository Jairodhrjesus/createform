"use client";

import type { FormEvent } from "react";
import { useTranslations } from "next-intl";

type SignUpFormProps = {
  email: string;
  password: string;
  name: string;
  isLoading: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSwitchToSignIn: () => void;
};

export default function SignUpForm({
  email,
  password,
  name,
  isLoading,
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onNameChange,
  onSwitchToSignIn,
}: SignUpFormProps) {
  const t = useTranslations("SignUpForm");

  return (
    <form onSubmit={onSubmit} className="space-y-5 animate-fadeIn">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-bold text-gray-900">{t("title")}</h3>
      </div>
      <div>
        <label htmlFor="signUpEmail" className="block text-sm font-medium text-gray-700 mb-1">
          {t("emailLabel")}
        </label>
        <input
          id="signUpEmail"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b282c] focus:border-[#6b282c] outline-none"
          placeholder={t("placeholderEmail")}
        />
      </div>
      <div>
        <label htmlFor="signUpName" className="block text-sm font-medium text-gray-700 mb-1">
          {t("nameLabel")}
        </label>
        <input
          id="signUpName"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b282c] focus:border-[#6b282c] outline-none"
          placeholder={t("placeholderName")}
        />
      </div>
      <div>
        <label htmlFor="signUpPassword" className="block text-sm font-medium text-gray-700 mb-1">
          {t("passwordLabel")}
        </label>
        <input
          id="signUpPassword"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b282c] focus:border-[#6b282c] outline-none"
          placeholder={t("placeholderPassword")}
        />
        <p className="text-xs text-gray-400 mt-1">{t("passwordHint")}</p>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-[#6b282c] hover:bg-[#562023] transition-colors disabled:opacity-70"
      >
        {isLoading ? t("loading") : t("submit")}
      </button>
      <div className="mt-6 text-center text-sm text-gray-500">
        {t("switchPrompt")}{" "}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="font-medium text-[#6b282c] hover:underline"
        >
          {t("switchCta")}
        </button>
      </div>
    </form>
  );
}
