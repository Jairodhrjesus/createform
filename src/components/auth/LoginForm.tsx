"use client";

import type { FormEvent } from "react";
import { useTranslations } from "next-intl";

type LoginFormProps = {
  email: string;
  password: string;
  isLoading: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSwitchToSignUp: () => void;
  onForgotPassword: () => void;
};

export default function LoginForm({
  email,
  password,
  isLoading,
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onSwitchToSignUp,
  onForgotPassword,
}: LoginFormProps) {
  const t = useTranslations("LoginForm");

  return (
    <form onSubmit={onSubmit} className="space-y-5 animate-fadeIn">
      <div>
        <label htmlFor="signInEmail" className="block text-sm font-medium text-gray-700 mb-1">
          {t("emailLabel")}
        </label>
        <input
          id="signInEmail"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b282c] focus:border-[#6b282c] outline-none"
          placeholder={t("placeholderEmail")}
        />
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="signInPassword" className="block text-sm font-medium text-gray-700">
            {t("passwordLabel")}
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-[#6b282c] hover:underline font-medium"
          >
            {t("forgot")}
          </button>
        </div>
        <input
          id="signInPassword"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b282c] focus:border-[#6b282c] outline-none"
          placeholder={t("placeholderPassword")}
        />
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
          onClick={onSwitchToSignUp}
          className="font-medium text-[#6b282c] hover:underline"
        >
          {t("switchCta")}
        </button>
      </div>
    </form>
  );
}
