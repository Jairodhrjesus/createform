"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  signIn,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
} from "aws-amplify/auth";
import AuthLayout from "./AuthLayout";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import ForgotPasswordForm from "./ForgotPasswordForm";

type AuthView =
  | "signIn"
  | "signUp"
  | "confirmSignUp"
  | "forgotPasswordRequest"
  | "forgotPasswordVerify"
  | "forgotPasswordReset";

export default function AuthFlow() {
  const t = useTranslations("AuthFlow");

  const [view, setView] = useState<AuthView>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const clearFeedback = () => {
    setError("");
    setMessage("");
  };

  const switchView = (nextView: AuthView) => {
    clearFeedback();
    setView(nextView);
  };

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await signIn({ username: email, password });
    } catch (err: any) {
      if (err?.name === "NotAuthorizedException") {
        setError(t("signInErrorNotAuthorized"));
      } else if (err?.name === "UserNotFoundException") {
        setError(t("signInErrorUserNotFound"));
      } else if (err?.name === "UserNotConfirmedException") {
        setView("confirmSignUp");
        setMessage(t("signInErrorUserNotConfirmed"));
      } else {
        setError(err?.message || t("signInErrorGeneric"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const { nextStep } = await signUp({
        username: email,
        password,
        options: {
          // Cognito usa atributos snake_case en la API
          userAttributes: { email, preferred_username: name },
        },
      });

      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setMessage(t("confirmCodeSent", { email }));
        setView("confirmSignUp");
      } else {
        setMessage(t("accountCreated"));
        setView("signIn");
      }
    } catch (err: any) {
      if (err?.name === "UsernameExistsException") {
        setError(t("signUpErrorExists"));
      } else if (err?.name === "InvalidPasswordException") {
        setError(t("signUpErrorWeak"));
      } else {
        setError(err?.message || t("signUpErrorGeneric"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      setMessage(t("accountVerified"));
      setPassword("");
      setView("signIn");
    } catch (err: any) {
      setError(err?.message || t("codeInvalid"));
    } finally {
      setIsLoading(false);
    }
  };

  // Paso A: Pedir código (API Call)
  const handleForgotRequest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await resetPassword({ username: email });
      setView("forgotPasswordVerify");
    } catch (err: any) {
      setError(err?.message || t("resetSendFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  // Paso B: Verificar Formato del Código (Validación Local)
  const handleVerifyCodeFormat = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError(t("codeFormatInvalid"));
      return;
    }
    setError("");
    setView("forgotPasswordReset");
  };

  // Paso C: Confirmar Cambio (API Call Real)
  const handleForgotReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
      setMessage(t("resetSuccess"));
      setView("signIn");
    } catch (err: any) {
      setError(err.message || t("resetFailed"));
      if (err.name === "CodeMismatchException") {
        setView("forgotPasswordVerify");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-md text-sm text-green-700">
          {message}
        </div>
      )}

      {view === "signIn" && (
        <LoginForm
          email={email}
          password={password}
          isLoading={isLoading}
          onSubmit={handleSignIn}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSwitchToSignUp={() => switchView("signUp")}
          onForgotPassword={() => switchView("forgotPasswordRequest")}
        />
      )}

      {view === "signUp" && (
        <SignUpForm
          email={email}
          password={password}
          name={name}
          isLoading={isLoading}
          onSubmit={handleSignUp}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onNameChange={setName}
          onSwitchToSignIn={() => switchView("signIn")}
        />
      )}

      {view === "confirmSignUp" && (
        <form onSubmit={handleConfirmSignUp} className="space-y-5 animate-fadeIn">
          <div className="mb-4 text-center">
            <h3 className="text-lg font-bold text-gray-900">{t("confirmTitle")}</h3>
            <p className="text-sm text-gray-500 mt-1">{t("confirmSubtitle", { email })}</p>
          </div>
          <div>
            <label htmlFor="confirmCode" className="block text-sm font-medium text-gray-700 mb-1">
              {t("confirmLabel")}
            </label>
            <input
              id="confirmCode"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b282c] focus:border-[#6b282c] outline-none text-center tracking-widest text-xl"
              placeholder="123456"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-[#6b282c] hover:bg-[#562023] transition-colors disabled:opacity-70"
          >
            {isLoading ? t("confirmSubmitting") : t("confirmSubmit")}
          </button>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => switchView("signIn")}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              {t("confirmBack")}
            </button>
          </div>
        </form>
      )}

      {view === "forgotPasswordRequest" && (
        <ForgotPasswordForm
          step="request"
          email={email}
          code={code}
          newPassword={newPassword}
          isLoading={isLoading}
          onEmailSubmit={handleForgotRequest}
          onCodeSubmit={handleVerifyCodeFormat}
          onPasswordSubmit={handleForgotReset}
          onEmailChange={setEmail}
          onCodeChange={setCode}
          onNewPasswordChange={setNewPassword}
          onBackToLogin={() => switchView("signIn")}
        />
      )}

      {view === "forgotPasswordVerify" && (
        <ForgotPasswordForm
          step="verify-code"
          email={email}
          code={code}
          newPassword={newPassword}
          isLoading={isLoading}
          onEmailSubmit={handleForgotRequest}
          onCodeSubmit={handleVerifyCodeFormat}
          onPasswordSubmit={handleForgotReset}
          onEmailChange={setEmail}
          onCodeChange={setCode}
          onNewPasswordChange={setNewPassword}
          onBackToLogin={() => switchView("signIn")}
        />
      )}

      {view === "forgotPasswordReset" && (
        <ForgotPasswordForm
          step="reset-password"
          email={email}
          code={code}
          newPassword={newPassword}
          isLoading={isLoading}
          onEmailSubmit={handleForgotRequest}
          onCodeSubmit={handleVerifyCodeFormat}
          onPasswordSubmit={handleForgotReset}
          onEmailChange={setEmail}
          onCodeChange={setCode}
          onNewPasswordChange={setNewPassword}
          onBackToLogin={() => switchView("signIn")}
        />
      )}
    </AuthLayout>
  );
}
