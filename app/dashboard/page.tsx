"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/app/components/header/base/Header";
import styles from "./dashboard.module.css";

export default function DashboardScreen() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth_module/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.dashboardContainer}>
      <Header onLogout={handleLogout} />
      
      <main className={styles.content}>
        <div className={styles.welcome}>
          <h1>Welcome, {user?.username}!</h1>
          <p>Your Algo Arena journey starts here.</p>
        </div>

        <div className={styles.statsSection}>
          <div className={styles.statsCard}>
            <h3>Problems Solved</h3>
            <div className={styles.statValue}>0</div>
          </div>
          
          <div className={styles.statsCard}>
            <h3>Current Rank</h3>
            <div className={styles.statValue}>Beginner</div>
          </div>
          
          <div className={styles.statsCard}>
            <h3>Contests Joined</h3>
            <div className={styles.statValue}>0</div>
          </div>
        </div>

        <div className={styles.activitySection}>
          <h2>Recent Activity</h2>
          <div className={styles.emptyState}>
            <p>You haven't solved any problems yet. Start your journey by tackling your first challenge!</p>
            <button className={styles.actionButton}>Browse Problems</button>
          </div>
        </div>
      </main>
    </div>
  );
}
