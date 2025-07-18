"use client";

import React, { useEffect, useState } from "react";
import styles from "./profile.module.css";
import Header from "@/app/components/header/base/Header";
import { FaFacebookF, FaLinkedinIn, FaGithub, FaPen } from "react-icons/fa";
import { getUserProfile, UserProfileDataResponse } from "@/app/api/user/user";
import { fetchUserXP } from "@/app/api/learn/learn";
import { useAuth } from "@/app/context/AuthContext";
import GradientButton from "@/app/components/buttons/base/GradientButton";
import EditProfileModal from "@/app/components/modal/base/EditProfileModal";
import {
  DifficultyBreakdown,
  getSolvedProblems,
  SolvedProblemsResponse,
} from "@/app/api/problems/problems";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const getBadgeInfo = (badge: string) => {
  const tier = badge.replace(/^T/, "");
  const badgeConfigs = {
    T5: {
      name: "Recruit",
      color: "#808080",
      xpRange: "0 - 500 XP",
      glowColor: "rgba(128, 128, 128, 0.5)",
      animationDelay: "0s",
    },
    T4: {
      name: "Journeyman",
      color: "#DAA520",
      xpRange: "501 - 1100 XP",
      glowColor: "rgba(218, 165, 32, 0.5)",
      animationDelay: "0.2s",
    },
    T3: {
      name: "Sentinel",
      color: "#2E8B57",
      xpRange: "1101 - 2000 XP",
      glowColor: "rgba(46, 139, 87, 0.5)",
      animationDelay: "0.4s",
    },
    T2: {
      name: "Mythic",
      color: "#DC143C",
      xpRange: "2001 - 2700 XP",
      glowColor: "rgba(220, 20, 60, 0.5)",
      animationDelay: "0.6s",
    },
    T1: {
      name: "Eternal",
      color: "#00BFFF",
      xpRange: "2701+ XP",
      glowColor: "rgba(0, 191, 255, 0.5)",
      animationDelay: "0.8s",
    },
  };

  return badgeConfigs[badge as keyof typeof badgeConfigs] || badgeConfigs["T5"];
};

const getBadgesToDisplay = (userBadges: string[]) => {
  if (!userBadges || userBadges.length === 0) return [];

  const highestBadge = userBadges.reduce((highest, current) => {
    const currentTier = parseInt(current.replace("T", ""));
    const highestTier = parseInt(highest.replace("T", ""));
    return currentTier < highestTier ? current : highest;
  });

  const highestTier = parseInt(highestBadge.replace("T", ""));
  const badgesToShow = [];

  for (let i = highestTier; i <= 5; i++) {
    badgesToShow.push(`T${i}`);
  }

  return badgesToShow;
};

const isBadgeEarned = (badge: string, userBadges: string[]) => {
  if (!userBadges || userBadges.length === 0) return false;

  const highestTier = Math.min(
    ...userBadges.map((b) => parseInt(b.replace("T", "")))
  );
  const checkingTier = parseInt(badge.replace("T", ""));

  return checkingTier >= highestTier;
};

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [userXp, setUserXp] = useState(0);
  const [userProblemData, setUserProblemData] = useState<DifficultyBreakdown>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadUserXpData = async () => {
    const [userXp] = await Promise.all([fetchUserXP(user?.id)]);
    setUserXp(userXp.total_xp);
  };

  const loadUserProblemData = async () => {
    const data = await getSolvedProblems();
    setUserProblemData(data.data.difficultyBreakdown);
  };

  useEffect(() => {
    loadUserXpData();
    loadUserProblemData();
  }, []);

  const generateHeatmapData = () => {
    const data = [];
    for (let i = 0; i < 365; i++) {
      const level = Math.floor(Math.random() * 5);
      data.push(level);
    }
    return data;
  };
  const getUserData = async () => {
    const data = await getUserProfile();
    if (data) {
      localStorage.setItem("user_profile_data", JSON.stringify(data));
    }
  };

  const heatmapData = generateHeatmapData();
  const [userData, setUserData] = useState<UserProfileDataResponse | null>(
    null
  );

  const loadUserData = async () => {
    const userDataString = await localStorage.getItem("user_profile_data");
    if (userDataString) {
      const parsedData: UserProfileDataResponse = JSON.parse(userDataString);
      setUserData(parsedData);
      console.warn(parsedData);
    }
  };

  const handleProfileUpdate = async () => {
    await getUserData();
    await loadUserData();
  };

  useEffect(() => {
    getUserData();
    loadUserData();
  }, []);


  const totalProblems = (userProblemData?.easy || 0) + (userProblemData?.medium || 0) + (userProblemData?.hard || 0);

  // Chart data configuration
  const chartData = {
    labels: ['Easy', 'Medium', 'Hard'],
    datasets: [
      {
        data: [
          userProblemData?.easy || 0,
          userProblemData?.medium || 0,
          userProblemData?.hard || 0,
        ],
        backgroundColor: [
          '#10b981', // Easy - Green
          '#f59e0b', // Medium - Orange
          '#ef4444', // Hard - Red
        ],
        borderColor: [
          '#059669',
          '#d97706',
          '#dc2626',
        ],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // We'll use custom legend
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#e0e0e0',
        bodyColor: '#e0e0e0',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2,
      }
    }
  };

  return (
    <>
      <EditProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userData={userData}
        onProfileUpdate={handleProfileUpdate}
      />
      <div style={{ paddingBottom: 50 }}>
        <Header userXP={userXp} />
      </div>
      <div className={styles.pageBackground}>
        <div className={styles.profileContainer}>
          {/* Profile Header */}
          <div className={styles.profileHeader}>
            <div className={styles.profileImageSection}>
              <img
                src={userData?.profile_picture}
                alt="Profile"
                className={styles.profileImage}
              />
              <div className={styles.socialLinks}>
                <a
                  href={userData?.github_link || "#"}
                  className={styles.socialLink}
                  title="GitHub"
                >
                  <FaGithub />
                </a>
                <a
                  href={userData?.linkedin_link || "#"}
                  className={styles.socialLink}
                  title="LinkedIn"
                >
                  <FaLinkedinIn />
                </a>
                <a
                  href={userData?.facebook_link || "#"}
                  className={styles.socialLink}
                  title="Facebook"
                >
                  <FaFacebookF />
                </a>
              </div>
              <div className={styles.contactInfo}>
                <strong>Contact me at:</strong>
                <br />
                {userData?.email}
              </div>
            </div>

            <div className={styles.userInfo}>
              <div
                style={{
                  flexDirection: "row",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <h1 className={styles.userName}>{userData?.username}</h1>
                <GradientButton
                  onClick={() => {
                    setIsModalOpen(true);
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <FaPen />
                    <h3>&nbsp;Edit Profile</h3>
                  </div>
                </GradientButton>
              </div>
              <p className={styles.userTitle}>
                {userData?.role ||
                  "No role specified. Click 'Edit Profile' to add one!"}
              </p>

              <div className={styles.badgesContainer}>
                <h3 className={styles.badgesTitle}>
                  <span className={styles.badgesTitleIcon}>🏆</span>
                  Achievement Badges
                </h3>
                <div className={styles.badgesContent}>
                  {userData?.badges?.length ? (
                    <div className={styles.badgesList}>
                      {getBadgesToDisplay(userData.badges).map(
                        (badge: string, index: number) => {
                          const badgeInfo = getBadgeInfo(badge);
                          const isEarned = isBadgeEarned(
                            badge,
                            userData.badges
                          );
                          return (
                            <div
                              key={badge}
                              className={`${styles.badgeItem} ${
                                styles[`badge${badge}`]
                              } ${
                                isEarned
                                  ? styles.badgeEarned
                                  : styles.badgeNotEarned
                              }`}
                              style={
                                {
                                  "--badge-color": badgeInfo.color,
                                  "--badge-glow": badgeInfo.glowColor,
                                  "--animation-delay": `${index * 0.2}s`,
                                } as React.CSSProperties
                              }
                            >
                              <div className={styles.badgeImageContainer}>
                                <img
                                  src={`/T${badge.replace(/^T/, "")}.png`}
                                  alt={`${badgeInfo.name} Badge`}
                                  className={styles.badgeImage}
                                />
                                <div className={styles.badgeGlow}></div>
                                {!isEarned && (
                                  <div className={styles.badgeLock}>🔒</div>
                                )}
                              </div>
                              <div className={styles.badgeInfo}>
                                <span className={styles.badgeName}>
                                  {badgeInfo.name}
                                </span>
                                <span className={styles.badgeXP}>
                                  {badgeInfo.xpRange}
                                </span>
                              </div>
                              <div className={styles.badgeRarity}>{badge}</div>
                              {isEarned && (
                                <div className={styles.badgeEarnedIndicator}>
                                  ✓
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <div className={styles.noBadgesContainer}>
                      <div className={styles.noBadgesIcon}>🎯</div>
                      <span className={styles.noBadgesText}>
                        No badges earned yet
                      </span>
                      <span className={styles.noBadgesSubtext}>
                        Complete challenges to unlock achievements!
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.userBio}>
                <p>
                  {userData?.bio ||
                    "No bio provided yet. Click 'Edit Profile' to add one!"}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Content Grid */}
          <div className={styles.profileContent}>
            {/* Contest Ranking & Heatmap */}
            <div className={styles.glassCard}>
              <h3 className={styles.cardTitle}>Contest Ranking</h3>
              <div className={styles.rankingInfo}>
                <div className={styles.rankStat}>
                  <div className={styles.rankNumber}>1,247</div>
                  <div className={styles.rankLabel}>Global Rank</div>
                </div>
                <div className={styles.rankStat}>
                  <div className={styles.rankNumber}>2,150</div>
                  <div className={styles.rankLabel}>Rating</div>
                </div>
                <div className={styles.rankStat}>
                  <div className={styles.rankNumber}>89</div>
                  <div className={styles.rankLabel}>Contests</div>
                </div>
              </div>

              <div className={styles.heatmapContainer}>
                <h4 style={{ marginBottom: "15px", color: "#e0e0e0" }}>
                  Activity Heatmap
                </h4>
                <div className={styles.heatmapGrid}>
                  {heatmapData.map((level, index) => (
                    <div
                      key={index}
                      className={`${styles.heatmapCell} ${
                        level > 0 ? styles[`level${level}`] : ""
                      }`}
                      title={`Day ${index + 1}: ${level} problems solved`}
                    />
                  ))}
                </div>
                <div className={styles.heatmapLegend}>
                  <span>Less</span>
                  <div className={styles.legendItem}>
                    <div
                      className={`${styles.legendColor} ${styles.heatmapCell}`}
                    />
                    <div
                      className={`${styles.legendColor} ${styles.heatmapCell} ${styles.level1}`}
                    />
                    <div
                      className={`${styles.legendColor} ${styles.heatmapCell} ${styles.level2}`}
                    />
                    <div
                      className={`${styles.legendColor} ${styles.heatmapCell} ${styles.level3}`}
                    />
                    <div
                      className={`${styles.legendColor} ${styles.heatmapCell} ${styles.level4}`}
                    />
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>

            <div className={styles.glassCard}>
              <h3 className={styles.cardTitle}>Problems Solved</h3>
              <div className={styles.problemsChart}>
                <div className={styles.pieChartContainer}>
                  {totalProblems > 0 ? (
                    <Pie data={chartData} options={chartOptions} />
                  ) : (
                    <div className={styles.noProblemsSolved}>
                      <div className={styles.noProblemsSolvedIcon}>📊</div>
                      <span>No problems solved yet</span>
                    </div>
                  )}
                </div>
                <div className={styles.problemsLegend}>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendDot} ${styles.easy}`}></div>
                    <span>Easy: {userProblemData?.easy || 0}</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div
                      className={`${styles.legendDot} ${styles.medium}`}
                    ></div>
                    <span>Medium: {userProblemData?.medium || 0}</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendDot} ${styles.hard}`}></div>
                    <span>Hard: {userProblemData?.hard || 0}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <div className={styles.rankNumber}>
                  {totalProblems}
                </div>
                <div className={styles.rankLabel}>Total Problems</div>
              </div>
            </div>

            <div className={`${styles.glassCard} ${styles.fullWidthCard}`}>
              <h3 className={styles.cardTitle}>
                Programming Languages & Tech Stack
              </h3>
              <div className={styles.techStack}>
                {userData?.tech_stack && userData.tech_stack.length > 0 ? (
                  userData.tech_stack.map((tech: string, idx: number) => (
                    <div className={styles.techTag} key={idx}>
                      {tech}
                    </div>
                  ))
                ) : (
                  <span style={{ color: "#aaa" }}>No tech stack specified</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
