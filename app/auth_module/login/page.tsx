"use client";

import styles from "../signup/page.module.css";
import Image from "next/image";
import EditText from "@/app/components/inputs/base/EditText";
import { useState, useEffect } from "react";
import GradientButton from "@/app/components/buttons/base/GradientButton";
import GoogleButton from "@/app/components/buttons/base/GoogleButton";
import {
  getUserData,
  login,
  saveAuthToken,
  saveUserData,
} from "@/app/api/authentication/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithGoogle } from "@/app/api/authentication/google-auth";
import { getUserProfile, UserProfileDataResponse } from "@/app/api/user/user";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [userApiData, setUserApiData] =
    useState<UserProfileDataResponse | null>(null);

  const [formErrors, setFormErrors] = useState<{
    identifier?: string;
    password?: string;
    general?: string;
  }>();

  useEffect(() => {
    const email = searchParams.get("email");
    const passwordParam = searchParams.get("password");
    const isSignupSuccess = searchParams.get("signup_success") === "true";

    if (isSignupSuccess && email && passwordParam) {
      setIdentifier(email);
      setPassword(passwordParam);
      setSignupSuccess(true);

      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      setTimeout(() => {
        handleAutoLogin(email, passwordParam);
      }, 1500);
    }
  }, [searchParams]);

  const validateCredentials = () => {
    const errors: {
      identifier?: string;
      password?: string;
    } = {};

    if (!identifier.trim()) {
      errors.identifier = "Username or email is required";
    }

    if (!password) {
      errors.password = "Password is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAutoLogin = async (email: string, pwd: string) => {
    setIsLoggingIn(true);
    setFormErrors({});

    try {
      const response = await login({
        identifier: email,
        password: pwd,
      });

      saveAuthToken(response.token);
      saveUserData(response.user);

      window.location.href = "/dashboard";
    } catch (error) {
      setFormErrors({
        general:
          error instanceof Error
            ? error.message
            : "Auto-login failed. Please login manually.",
      });
      setSignupSuccess(false);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const getUserData = async () => {
    const data = await getUserProfile();
    if (data) {
      setUserApiData(data);
      localStorage.setItem("user_profile_data", JSON.stringify(data));
    }
  };

  const handleLogin = async () => {
    if (!validateCredentials()) {
      return;
    }

    setIsLoggingIn(true);
    setFormErrors({});

    try {
      const response = await login({
        identifier,
        password,
      });

      saveAuthToken(response.token);
      saveUserData(response.user);
      await getUserData();

      window.location.href = "/dashboard";
    } catch (error) {
      setFormErrors({
        general:
          error instanceof Error
            ? error.message
            : "Login failed. Please try again.",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setFormErrors({});

    try {
      const response = await signInWithGoogle();
      saveAuthToken(response.token);
      saveUserData(response.user);

      window.location.href = "/dashboard";
    } catch (error: any) {
      if (error.message !== "Sign-in Cancelled") {
        setFormErrors({
          general:
            error instanceof Error
              ? error.message
              : "Google authentication failed. Please try again",
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={styles.pageBackground}>
      <div className={styles.column}>
        <Image src={"/app-logo.png"} alt={"Logo"} width={90} height={90} />
        <h2>Welcome back to Algo arena</h2>
        <div className={styles.emptySpace} />
        <h3>Sign in to continue your journey.</h3>

        {signupSuccess && (
          <div
            className={`${styles.message} ${styles.messageSuccess}`}
            style={{ marginBottom: "20px", marginTop: "20px" }}
          >
            🎉 Account created successfully! Logging you in...
          </div>
        )}

        <div className={styles.inputWrapper}>
          <div className={styles.formField}>
            <EditText
              value={identifier}
              placeholder={"Enter your Username or Email"}
              type={"text"}
              onChange={(event) => {
                setIdentifier(event.target.value);
              }}
            />
            {formErrors?.identifier && (
              <div className={`${styles.message} ${styles.messageError}`}>
                {formErrors.identifier}
              </div>
            )}
          </div>

          <div className={styles.formField}>
            <EditText
              value={password}
              placeholder={"Enter your Password"}
              type={"password"}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
            />
            {formErrors?.password && (
              <div className={`${styles.message} ${styles.messageError}`}>
                {formErrors.password}
              </div>
            )}
          </div>
        </div>

        {formErrors?.general && (
          <div className={`${styles.message} ${styles.messageError}`}>
            {formErrors.general}
          </div>
        )}

        <GradientButton onClick={handleLogin} disabled={isLoggingIn}>
          {isLoggingIn ? "Signing In..." : "Sign In"}
        </GradientButton>

        <div style={{ marginBottom: "20px" }} />

        <GoogleButton onClick={handleGoogleSignIn} disabled={isLoggingIn} />

        <div className={styles.signInTextWrapper}>
          <span>Don't have an account? &nbsp;</span>
          <span
            className={styles.signInText}
            onClick={() => router.push("/auth_module/signup")}
            style={{ cursor: "pointer" }}
          >
            Sign Up
          </span>
        </div>

        <div className={styles.bottomContainer}>
          <span className={styles.bottomText}>Terms of Services</span>
          &nbsp; &#183; &nbsp;
          <span className={styles.bottomText}>Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}
