"use client";

import { type FormEvent } from "react";
import { useTranslations } from "next-intl";

export type ForgotPasswordStep = "request" | "verify-code" | "reset-password";

type ForgotPasswordFormProps = {
  email: string;
  code: string;
  newPassword: string;
  isLoading: boolean;
  step: ForgotPasswordStep;

  onEmailSubmit: (e: FormEvent) => void;
  onCodeSubmit: (e: FormEvent) => void;
  onPasswordSubmit: (e: FormEvent) => void;

  onEmailChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onBackToLogin: () => void;
};

export default function ForgotPasswordForm({
  email,
  code,
  newPassword,
  isLoading,
  step,
  onEmailSubmit,
  onCodeSubmit,
  onPasswordSubmit,
  onEmailChange,
  onCodeChange,
  onNewPasswordChange,
  onBackToLogin,
}: ForgotPasswordFormProps) {
  const t = useTranslations("ForgotPassword");

  const renderStep = () => {
    switch (step) {
      case "request":
        return (
          <form onSubmit={onEmailSubmit} className="space-y-5 animate-fadeIn">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">{t("requestTitle")}</h3>
              <p className="text-sm text-gray-500 mt-1">{t("requestDescription")}</p>
            </div>
            <div>
              <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
                {t("emailLabel")}
              </label>
              <input
                id="resetEmail"
                name="email"
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b282c] focus:border-[#6b282c] outline-none"
                placeholder={t("placeholderEmail")}
                aria-label={t("emailLabel")}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-[#6b282c] hover:bg-[#562023] transition-colors disabled:opacity-70"
            >
              {isLoading ? t("sending") : t("sendCode")}
            </button>
          </form>
        );

      case "verify-code":
        return (
          <form onSubmit={onCodeSubmit} className="space-y-5 animate-fadeIn">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">{t("verifyTitle")}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {t("verifyDescription", { email })}
              </p>
            </div>
            <div>
              <label htmlFor="resetCode" className="block text-sm font-medium text-gray-700 mb-1">
                {t("codeLabel")}
              </label>
              <input
                id="resetCode"
                name="code"
                type="text"
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                required
                autoFocus
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b282c] focus:border-[#6b282c] outline-none text-center text-xl tracking-widest uppercase"
                placeholder={t("placeholderCode")}
                aria-label={t("codeLabel")}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-[#6b282c] hover:bg-[#562023] transition-colors"
            >
              {t("verifyCode")}
            </button>
          </form>
        );

      case "reset-password":
        return (
          <form onSubmit={onPasswordSubmit} className="space-y-5 animate-fadeIn">
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">{t("resetTitle")}</h3>
              <p className="text-sm text-gray-500 mt-1">{t("resetDescription")}</p>
            </div>

            <input
              id="hidden-username"
              type="text"
              name="username"
              value={email}
              readOnly
              className="hidden"
              autoComplete="username"
              aria-hidden="true"
              tabIndex={-1}
              aria-label="Usuario asociado"
              placeholder="Usuario"
            />

            <div>
              <label htmlFor="resetNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                {t("newPasswordLabel")}
              </label>
              <input
                id="resetNewPassword"
                name="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => onNewPasswordChange(e.target.value)}
                required
                autoFocus
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b282c] focus:border-[#6b282c] outline-none"
                placeholder={t("placeholderPassword")}
                aria-label={t("newPasswordLabel")}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-[#6b282c] hover:bg-[#562023] transition-colors disabled:opacity-70"
            >
              {isLoading ? t("updating") : t("confirmChange")}
            </button>
          </form>
        );
    }
  };

  return (
    <div>
      {renderStep()}

      <div className="mt-8 text-center border-t border-gray-100 pt-6">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
        >
          {t("back")}
        </button>
      </div>
    </div>
  );
}
