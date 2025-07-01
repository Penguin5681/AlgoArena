'use client';

import styles from "./page.module.css";
import Image from "next/image";
import GradientButton from "@/app/components/buttons/base/GradientButton";
import GoogleButton from "@/app/components/buttons/base/GoogleButton";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GetStartedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

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

        <div className={styles.buttonContainer} style={{ gap: "16px" }}>
          <Link href={"/auth_module/signup"}>
            <GradientButton>Continue with Email</GradientButton>
          </Link>
          <GoogleButton onClick={undefined} />
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
