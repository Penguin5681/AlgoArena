"use client";

import Header from "@/app/components/header/base/Header";
import styles from "./leaderboard.module.css";
import { getUserData } from "@/app/api/authentication/auth";
import { fetchUserXP } from "@/app/api/learn/learn";
import React, { useEffect, useState } from "react";

export default function LeaderboardPage() {
  const [userXp, setUserXp] = useState(0);
  const [activeTab, setActiveTab] = useState<"global" | "team">("global");
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalUser, setModalUser] = useState<UserProfile | null>(null);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  const limit = 20;

  const stats = {
    totalUsers,
    totalContests: 0,
  };

  const fetchLeaderboard = async (
    page: number = 1,
    append: boolean = false
  ) => {
    try {
      if (page === 1) setIsLoading(true);
      else setLoadingMore(true);

      setError(null);

      const BASE_URL = "http://localhost:5000";

      const offset = (page - 1) * limit;
      const response = await fetch(
        `${BASE_URL}/api/leaderboard/users?limit=${limit}&offset=${offset}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LeaderboardResponse = await response.json();

      if (data.success) {
        setTotalUsers(data.data.totalUsers);
        setCurrentPage(data.data.pagination.page);
        setTotalPages(data.data.pagination.totalPages);

        if (append) {
          setUsers((prev) => [...prev, ...data.data.users]);
        } else {
          setUsers(data.data.users);
        }
      } else {
        throw new Error("Failed to fetch leaderboard data");
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load leaderboard"
      );
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
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

  // Fetch team leaderboard
  const fetchTeamLeaderboard = async () => {
    setTeamLoading(true);
    setTeamError(null);
    const BASE_URL = "http://localhost:5000";
    try {
      const res = await fetch(`${BASE_URL}/api/team/2/leaderboard`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data: TeamLeaderboardResponse = await res.json();
      if (data.success) {
        setTeamMembers(data.data.members);
      } else {
        setTeamError("Failed to fetch team leaderboard");
      }
    } catch (e) {
      setTeamError(
        e instanceof Error ? e.message : "Failed to load team leaderboard"
      );
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    getUserXp();
    fetchLeaderboard(1, false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load more users
  const handleLoadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      fetchLeaderboard(currentPage + 1, true);
    }
  };

  // Fetch team leaderboard when tab changes to "team"
  useEffect(() => {
    if (activeTab === "team") {
      fetchTeamLeaderboard();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  // Format countdown to HH:MM:SS
  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "🏅";
    }
  };

  const getAvatar = (username: string) =>
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
      username
    )}`;

  const getRankName = (badges: string[]) => {
    if (!badges || badges.length === 0) return "Novice";

    const badgeMap: { [key: string]: string } = {
      T1: "Eternal",
      T2: "Mythic",
      T3: "Sentinel",
      T4: "Journeyman",
      T5: "Recruit",
    };

    const highestBadge = badges.sort()[0];
    return badgeMap[highestBadge] || "Novice";
  };

  const sortedUsers = [...users].sort((a, b) => b.total_xp - a.total_xp);

  // Modal fetch
  const openUserModal = async (email: string) => {
    setModalOpen(true);
    setModalLoading(true);
    setModalUser(null);
    const BASE_URL = "http://localhost:5000";
    try {
      const res = await fetch(
        `${BASE_URL}/api/profile/get-profile/${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );
      const data = await res.json();
      setModalUser(data);
    } catch (e) {
      setModalUser(null);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className={styles.pageBackground}>
      <div className={styles.backgroundOverlay}></div>
      <div className={styles.floatingShapes}>
        <div className={styles.shape1}></div>
        <div className={styles.shape2}></div>
        <div className={styles.shape3}></div>
        <div className={styles.shape4}></div>
      </div>

      <Header userXP={userXp} />

      <div className={styles.container}>
        {/* Title with animation */}
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>
            <span className={styles.titleText}>Leaderboard</span>
            <div className={styles.titleGlow}></div>
          </h1>
          <p className={styles.subtitle}>
            Compete with the best coders worldwide
          </p>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tabButton} ${
                activeTab === "global" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("global")}
            >
              <span className={styles.tabIcon}>🌍</span>
              Global Ranking
            </button>
            <button
              className={`${styles.tabButton} ${
                activeTab === "team" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("team")}
            >
              <span className={styles.tabIcon}>👥</span>
              Team Ranking
            </button>
            <div className={styles.tabIndicator}></div>
          </div>
        </div>

        {/* Enhanced Leaderboard Table */}
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <h2>
              {activeTab === "global" ? "🏆 Top Performers" : "👥 Team Ranking"}
            </h2>
            {activeTab === "global" && (
              <div
                className={styles.refreshButton}
                onClick={() => fetchLeaderboard(1, false)}
                style={{ cursor: "pointer" }}
              >
                <span>🔄</span>
              </div>
            )}
            {activeTab === "team" && (
              <div
                className={styles.refreshButton}
                onClick={fetchTeamLeaderboard}
                style={{ cursor: "pointer" }}
              >
                <span>🔄</span>
              </div>
            )}
          </div>
          <div className={styles.tableWrapper}>
            {/* GLOBAL RANKING TABLE */}
            {activeTab === "global" && (
              <table className={styles.leaderboardTable}>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Coder</th>
                    <th>XP Points</th>
                    <th>Rank</th>
                    <th>Badges</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{ textAlign: "center", padding: "3rem" }}
                      >
                        <div style={{ fontSize: "1.2rem" }}>
                          Loading leaderboard...
                        </div>
                      </td>
                    </tr>
                  ) : sortedUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{ textAlign: "center", padding: "3rem" }}
                      >
                        <div style={{ fontSize: "1.2rem" }}>No users found</div>
                      </td>
                    </tr>
                  ) : (
                    sortedUsers.map((entry, index) => (
                      <tr
                        key={entry.id}
                        className={`${styles.tableRow} ${
                          index < 3 ? styles.topThree : ""
                        }`}
                        style={{
                          animationDelay: `${index * 0.1}s`,
                          cursor: "pointer",
                        }}
                        onClick={() => openUserModal(entry.email)}
                      >
                        <td className={styles.rankCell}>
                          <div className={styles.rankContainer}>
                            <span className={styles.rankNumber}>
                              {index + 1}
                            </span>
                            <span className={styles.rankIcon}>
                              {getRankIcon(index + 1)}
                            </span>
                          </div>
                        </td>
                        <td className={styles.userCell}>
                          <div className={styles.userInfo}>
                            <div className={styles.avatarContainer}>
                              <img
                                src={
                                  entry.profile_picture ||
                                  getAvatar(entry.username)
                                }
                                alt={entry.username}
                                className={styles.avatar}
                              />
                              <div className={styles.avatarGlow}></div>
                            </div>
                            <div className={styles.userDetails}>
                              <span className={styles.username}>
                                {entry.username}
                              </span>
                              <span className={styles.userStats}>
                                {entry.role || "Coder"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className={styles.xpCell}>
                          <div className={styles.xpContainer}>
                            <span className={styles.xpNumber}>
                              {entry.total_xp.toLocaleString()}
                            </span>
                            <span className={styles.xpLabel}>XP</span>
                          </div>
                        </td>
                        <td className={styles.rankBadgeCell}>
                          <span
                            className={`${styles.rankBadge} ${
                              styles[getRankName(entry.badges).toLowerCase()]
                            }`}
                          >
                            {getRankName(entry.badges)}
                          </span>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: "0.25rem",
                              flexWrap: "wrap",
                            }}
                          >
                            {entry.badges && entry.badges.length > 0 ? (
                              entry.badges.map((badge) => (
                                <span
                                  key={badge}
                                  style={{
                                    background: "rgba(79, 70, 229, 0.2)",
                                    color: "#a5b4fc",
                                    padding: "0.25rem 0.5rem",
                                    borderRadius: "12px",
                                    fontSize: "0.75rem",
                                    fontWeight: "600",
                                    border: "1px solid rgba(79, 70, 229, 0.3)",
                                  }}
                                >
                                  {badge}
                                </span>
                              ))
                            ) : (
                              <span
                                style={{ color: "rgba(255, 255, 255, 0.5)" }}
                              >
                                -
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* TEAM RANKING TABLE */}
            {activeTab === "team" && (
              <table className={styles.leaderboardTable}>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Member</th>
                    <th>XP Points</th>
                    <th>Role</th>
                    <th>Badges</th>
                  </tr>
                </thead>
                <tbody>
                  {teamLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{ textAlign: "center", padding: "3rem" }}
                      >
                        <div style={{ fontSize: "1.2rem" }}>
                          Loading team leaderboard...
                        </div>
                      </td>
                    </tr>
                  ) : teamError ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          padding: "3rem",
                          color: "#ff6b6b",
                        }}
                      >
                        {teamError}
                      </td>
                    </tr>
                  ) : teamMembers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{ textAlign: "center", padding: "3rem" }}
                      >
                        <div style={{ fontSize: "1.2rem" }}>
                          No team members found
                        </div>
                      </td>
                    </tr>
                  ) : (
                    [...teamMembers]
                      .sort((a, b) => b.total_xp - a.total_xp)
                      .map((member, idx) => (
                        <tr
                          key={member.id}
                          className={styles.tableRow}
                          style={{
                            animationDelay: `${idx * 0.1}s`,
                            cursor: "pointer",
                          }}
                          onClick={() => openUserModal(member.email)}
                        >
                          <td className={styles.rankCell}>
                            <div className={styles.rankContainer}>
                              <span className={styles.rankNumber}>
                                {idx + 1}
                              </span>
                              <span className={styles.rankIcon}>
                                {getRankIcon(idx + 1)}
                              </span>
                            </div>
                          </td>
                          <td className={styles.userCell}>
                            <div className={styles.userInfo}>
                              <div className={styles.avatarContainer}>
                                <img
                                  src={
                                    member.profile_picture ||
                                    getAvatar(member.username)
                                  }
                                  alt={member.username}
                                  className={styles.avatar}
                                />
                                <div className={styles.avatarGlow}></div>
                              </div>
                              <div className={styles.userDetails}>
                                <span className={styles.username}>
                                  {member.username}
                                </span>
                                <span className={styles.userStats}>
                                  {member.is_admin
                                    ? "Admin"
                                    : member.role || "Member"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className={styles.xpCell}>
                            <div className={styles.xpContainer}>
                              <span className={styles.xpNumber}>
                                {member.total_xp.toLocaleString()}
                              </span>
                              <span className={styles.xpLabel}>XP</span>
                            </div>
                          </td>
                          <td className={styles.rankBadgeCell}>
                            <span
                              className={`${styles.rankBadge} ${
                                styles[getRankName(member.badges).toLowerCase()]
                              }`}
                            >
                              {getRankName(member.badges)}
                            </span>
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                gap: "0.25rem",
                                flexWrap: "wrap",
                              }}
                            >
                              {member.badges && member.badges.length > 0 ? (
                                member.badges.map((badge) => (
                                  <span
                                    key={badge}
                                    style={{
                                      background: "rgba(79, 70, 229, 0.2)",
                                      color: "#a5b4fc",
                                      padding: "0.25rem 0.5rem",
                                      borderRadius: "12px",
                                      fontSize: "0.75rem",
                                      fontWeight: "600",
                                      border:
                                        "1px solid rgba(79, 70, 229, 0.3)",
                                    }}
                                  >
                                    {badge}
                                  </span>
                                ))
                              ) : (
                                <span
                                  style={{ color: "rgba(255, 255, 255, 0.5)" }}
                                >
                                  -
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            )}
          </div>
          {/* Only show load more for global */}
          {activeTab === "global" && currentPage < totalPages && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "2rem",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  background: "rgba(79, 70, 229, 0.2)",
                  border: "1px solid rgba(79, 70, 229, 0.3)",
                  borderRadius: "25px",
                  padding: "0.75rem 2rem",
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: loadingMore ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  opacity: loadingMore ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loadingMore) {
                    e.currentTarget.style.background = "rgba(79, 70, 229, 0.3)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loadingMore) {
                    e.currentTarget.style.background = "rgba(79, 70, 229, 0.2)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                {loadingMore
                  ? "Loading..."
                  : `Load More (${currentPage}/${totalPages})`}
              </button>
            </div>
          )}
        </div>
      </div>

      {comingSoonOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setComingSoonOpen(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            style={{ textAlign: "center", minWidth: 280 }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🚧</div>
            <div
              style={{ fontSize: "1.4rem", fontWeight: 700, color: "#a5b4fc" }}
            >
              Coming Soon
            </div>
            <div style={{ color: "#e0e0e0", margin: "1rem 0 2rem 0" }}>
              This feature will be available in a future update.
            </div>
            <button
              className={styles.modalCloseBtn}
              onClick={() => setComingSoonOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {modalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setModalOpen(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {modalLoading ? (
              <div className={styles.modalLoading}>Loading...</div>
            ) : modalUser ? (
              <div className={styles.profileModalBody}>
                <div className={styles.profileModalHeader}>
                  <img
                    src={
                      modalUser.profile_picture || getAvatar(modalUser.username)
                    }
                    alt={modalUser.username}
                    className={styles.profileModalAvatar}
                  />
                  <div>
                    <div className={styles.profileModalName}>
                      {modalUser.username}
                    </div>
                    <div className={styles.profileModalRole}>
                      {modalUser.role || "Coder"}
                    </div>
                  </div>
                </div>
                <div className={styles.profileModalBio}>
                  {modalUser.bio || (
                    <span style={{ color: "#aaa" }}>No bio provided.</span>
                  )}
                </div>
                <div className={styles.profileModalBadges}>
                  {modalUser.badges && modalUser.badges.length > 0 ? (
                    modalUser.badges.map((badge) => (
                      <span
                        key={badge}
                        className={`${styles.rankBadge} ${
                          styles[getRankName([badge]).toLowerCase()]
                        }`}
                        style={{ marginRight: 8, marginBottom: 8 }}
                      >
                        {getRankName([badge])}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "#aaa" }}>No badges</span>
                  )}
                  {modalUser.tech_stack && modalUser.tech_stack.length > 0 && (
                    <div className={styles.profileModalSection}>
                      <div className={styles.profileModalSectionTitle}>
                        Tech Stack
                      </div>
                      <div className={styles.profileModalTags}>
                        {modalUser.tech_stack.map((tech) => (
                          <span key={tech} className={styles.profileModalTag}>
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {modalUser.programming_languages &&
                    modalUser.programming_languages.length > 0 && (
                      <div className={styles.profileModalSection}>
                        <div className={styles.profileModalSectionTitle}>
                          Programming Languages
                        </div>
                        <div className={styles.profileModalTags}>
                          {modalUser.programming_languages.map((lang) => (
                            <span key={lang} className={styles.profileModalTag}>
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
                <div className={styles.profileModalLinks}>
                  {modalUser.github_link && (
                    <a
                      href={modalUser.github_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                    </a>
                  )}
                  {modalUser.linkedin_link && (
                    <a
                      href={modalUser.linkedin_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      LinkedIn
                    </a>
                  )}
                  {modalUser.facebook_link && (
                    <a
                      href={modalUser.facebook_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Facebook
                    </a>
                  )}
                </div>
                <button
                  className={styles.modalCloseBtn}
                  onClick={() => setModalOpen(false)}
                >
                  Close
                </button>
              </div>
            ) : (
              <div className={styles.modalLoading}>Failed to load profile.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
