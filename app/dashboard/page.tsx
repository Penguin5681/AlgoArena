"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/app/components/header/base/Header";
import styles from "./dashboard.module.css";
import { getUserData } from "../api/authentication/auth";
import { fetchUserXP } from "../api/learn/learn";
import { getSolvedProblems } from "../api/problems/problems";
import { getUserProfile, UserProfileDataResponse } from "../api/user/user";

const getBadgeInfo = (badge: string) => {
  const tier = badge.replace(/^T/, "");
  const badgeConfigs = {
    T5: {
      name: "Recruit",
      color: "#808080",
      xpRange: "0 - 500 XP",
      glowColor: "rgba(128, 128, 128, 0.5)",
    },
    T4: {
      name: "Journeyman",
      color: "#DAA520",
      xpRange: "501 - 1100 XP",
      glowColor: "rgba(218, 165, 32, 0.5)",
    },
    T3: {
      name: "Sentinel",
      color: "#2E8B57",
      xpRange: "1101 - 2000 XP",
      glowColor: "rgba(46, 139, 87, 0.5)",
    },
    T2: {
      name: "Mythic",
      color: "#DC143C",
      xpRange: "2001 - 2700 XP",
      glowColor: "rgba(220, 20, 60, 0.5)",
    },
    T1: {
      name: "Eternal",
      color: "#00BFFF",
      xpRange: "2701+ XP",
      glowColor: "rgba(0, 191, 255, 0.5)",
    },
  };

  return badgeConfigs[badge as keyof typeof badgeConfigs] || badgeConfigs["T5"];
};

const getCurrentBadge = (userBadges: string[]) => {
  if (!userBadges || userBadges.length === 0) return "T5";

  const highestBadge = userBadges.reduce((highest, current) => {
    const currentTier = parseInt(current.replace("T", ""));
    const highestTier = parseInt(highest.replace("T", ""));
    return currentTier < highestTier ? current : highest;
  });

  return highestBadge;
};

export default function DashboardScreen() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [userXp, setUserXp] = useState(0);
  const [solvedProblems, setSolvedProblems] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfileDataResponse | null>(null);

  const loadSolvedProblems = async () => {
    const data = await getSolvedProblems();
    setSolvedProblems(data.data.totalSolved);
  };

  const getUserXp = async () => {
    try {
      const userData = await getUserData();
      const userId = userData?.id;
      if (userId) {
        const userXpData = await fetchUserXP(userId);
        setUserXp(userXpData.total_xp);
      }
    } catch (error) {
      console.error("Error fetching user XP:", error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profileData = await getUserProfile();
      setUserProfile(profileData);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    getUserXp();
    loadSolvedProblems();
    loadUserProfile();
  }, []);

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

  const currentBadge = getCurrentBadge(userProfile?.badges || []);
  const badgeInfo = getBadgeInfo(currentBadge);

  return (
    <div className={styles.dashboardContainer}>
      <Header onLogout={handleLogout} userXP={userXp} />

      <main className={styles.content}>
        <div className={styles.welcome}>
          <h1>Welcome back, {user?.username}!</h1>
          <p>Ready to conquer new algorithms and climb the leaderboard?</p>
        </div>

        {/* Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.heroCard}>
            <div className={styles.heroContent}>
              <h2>🚀 Start Your Journey</h2>
              <p>Solve challenging problems, earn XP, and become an algorithm master!</p>
              <div className={styles.heroButtons}>
                <button
                  onClick={() => router.push("/core-modules/problem-module")}
                  className={styles.primaryButton}
                >
                  Solve Problems
                </button>
                <button
                  onClick={() => router.push("/core-modules/learn-module")}
                  className={styles.secondaryButton}
                >
                  Learn Concepts
                </button>
              </div>
            </div>
            <div className={styles.heroIllustration}>
              <div className={styles.floatingIcon}>💡</div>
              <div className={styles.floatingIcon}>🎯</div>
              <div className={styles.floatingIcon}>⚡</div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className={styles.statsSection}>
          <div className={styles.statsCard}>
            <div className={styles.statIcon}>📊</div>
            <h3>Problems Solved</h3>
            <div className={styles.statValue}>{solvedProblems}</div>
            <div className={styles.statProgress}>
              <div className={styles.progressBar} style={{ width: `${Math.min((solvedProblems / 100) * 100, 100)}%` }}></div>
            </div>
          </div>

          <div className={styles.statsCard}>
            <div className={styles.statIcon}>🏆</div>
            <h3>Current Rank</h3>
            <div className={styles.statValue}>{badgeInfo.name}</div>
            <div className={styles.badgeContainer}>
              <div className={styles.badgeImageContainer}>
                <img
                  src={`/${currentBadge}.png`}
                  alt={`${badgeInfo.name} Badge`}
                  className={styles.badgeImage}
                />
                <div 
                  className={styles.badgeGlow}
                  style={{ 
                    boxShadow: `0 0 20px ${badgeInfo.glowColor}` 
                  }}
                ></div>
              </div>
              <div className={styles.badgeText}>{currentBadge}</div>
            </div>
          </div>

          <div className={styles.statsCard}>
            <div className={styles.statIcon}>🎮</div>
            <h3>Contests Joined</h3>
            <div className={styles.statValue}>0</div>
            <div className={styles.statSubtext}>Join your first contest!</div>
          </div>

          <div className={styles.statsCard}>
            <div className={styles.statIcon}>⚡</div>
            <h3>Total XP</h3>
            <div className={styles.statValue}>{userXp}</div>
            <div className={styles.xpBar}>
              <div className={styles.xpProgress} style={{ width: `${Math.min((userXp % 100), 100)}%` }}></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <h2>Quick Actions</h2>
          <div className={styles.actionGrid}>
            <div className={styles.actionCard} onClick={() => router.push("/core-modules/problem-module")}>
              <div className={styles.actionIcon}>🧩</div>
              <h3>Daily Challenge</h3>
              <p>Solve today's featured problem</p>
            </div>
            <div className={styles.actionCard} onClick={() => router.push("/core-modules/contest-module")}>
              <div className={styles.actionIcon}>🏁</div>
              <h3>Live Contests</h3>
              <p>Join ongoing competitions</p>
            </div>
            <div className={styles.actionCard} onClick={() => router.push("/core-modules/learn-module")}>
              <div className={styles.actionIcon}>📚</div>
              <h3>Study Path</h3>
              <p>Learn new algorithms</p>
            </div>
            <div className={styles.actionCard} onClick={() => router.push("/leaderboard")}>
              <div className={styles.actionIcon}>🥇</div>
              <h3>Leaderboard</h3>
              <p>See your ranking</p>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className={styles.activitySection}>
          <h2>Recent Activity</h2>
          <div className={styles.emptyState}>
            <div className={styles.emptyIllustration}>
              <div className={styles.emptyIcon}>📈</div>
            </div>
            <h3>Your journey starts here!</h3>
            <p>
              Start solving problems to see your progress and achievements. Every expert was once a beginner!
            </p>
            <button
              onClick={() => router.push("/core-modules/problem-module")}
              className={styles.actionButton}
            >
              Browse Problems
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}