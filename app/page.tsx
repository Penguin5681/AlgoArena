"use client";

import styles from "./page.module.css";
import Image from "next/image";
import GradientButton from "@/app/components/buttons/base/GradientButton";
import GoogleButton from "@/app/components/buttons/base/GoogleButton";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signInWithGoogle } from "@/app/api/authentication/google-auth";
import { saveAuthToken, saveUserData } from "@/app/api/authentication/auth";

export default function GetStartedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // if (!isLoading && isAuthenticated) {
      window.location.href = "/core-modules/leaderboard-module";
    // }
  }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleSigningIn(true);
    setErrorMessage(null);

    try {
      const response = await signInWithGoogle();
      saveAuthToken(response.token);
      saveUserData(response.user);

      window.location.href = "/dashboard";
    } catch (error: any) {
      if (error.message !== "Sign-in Cancelled") {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Google authentication failed. Please try again"
        );
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.pageBackground}>
        <div className={styles.column}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.pageBackground}>
      <div className={styles.column}>
        <Image src={"/app-logo.png"} alt={"Logo"} width={90} height={90} />
        <h2>Welcome to Algo arena</h2>
        <div className={styles.emptySpace} />
        <h3>Practice. Compete. Grow with your squad.</h3>

        {errorMessage && (
          <div className={`${styles.message} ${styles.messageError}`}>
            {errorMessage}
          </div>
        )}

        <div className={styles.buttonContainer} style={{ gap: "16px" }}>
          <Link href={"/auth_module/signup"}>
            <GradientButton>Continue with Email</GradientButton>
          </Link>
          <GoogleButton
            onClick={handleGoogleSignIn}
            disabled={isGoogleSigningIn || isLoading}
          />
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
