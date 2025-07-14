"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/app/components/header/base/Header";
import styles from "./team.module.css";
import {
  getCurrentTeam,
  leaveTeam,
  promoteToAdmin,
  demoteAdmin,
  deleteTeam,
  TeamInfo,
} from "@/app/api/teams/manage-team";
import Image from "next/image";
import { io } from "socket.io-client";

export default function TeamPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: "System",
      message: "Welcome to team chat!",
      timestamp: new Date(),
      isSystem: true,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const socket = io("http://localhost:5001");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth_module/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTeamInfo();
    }
  }, [isAuthenticated]);

  const isCurrentUserAdmin = () => {
    if (!team || !user) return false;
    const currentUserMember = team.members.find(
      (member) => member.email === user.email
    );
    return currentUserMember?.is_admin || false;
  };

  const fetchTeamInfo = async () => {
    try {
      setLoadingTeam(true);
      const teamData = await getCurrentTeam();
      setTeam(teamData);
      console.log("Team data:", teamData);
      console.log("Members:", teamData?.members);
      console.log("Current user:", user);
      console.log(
        "Is current user admin?",
        teamData?.members.find((m) => m.email === user?.email)?.is_admin
      );

      if (!teamData) {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Failed to load team information");
      console.error("Error fetching team:", err);
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleLeaveTeam = async () => {
    if (!confirm("Are you sure you want to leave this team?")) {
      return;
    }

    try {
      setActionLoading("leave");
      await leaveTeam();
      router.push("/dashboard");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to leave team";
      setError(errorMessage);
    } finally {
      setActionLoading("");
    }
  };

  const handleDeleteTeam = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this team? This action cannot be undone and will remove all members."
      )
    ) {
      return;
    }

    try {
      setActionLoading("delete");
      await deleteTeam();
      router.push("/dashboard");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete team";
      setError(errorMessage);
    } finally {
      setActionLoading("");
    }
  };

  const handlePromoteUser = async (memberEmail: string, username: string) => {
    if (!confirm(`Are you sure you want to promote ${username} to admin?`)) {
      return;
    }

    try {
      setActionLoading(`promote-${memberEmail}`);
      const response = await promoteToAdmin({ targetUserEmail: memberEmail });
      console.log("Promotion successful:", response);

      alert(`${username} has been promoted to admin successfully!`);

      await fetchTeamInfo();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to promote user";
      setError(errorMessage);
      console.error("Promotion error:", err);
    } finally {
      setActionLoading("");
    }
  };

  const handleDemoteUser = async (memberEmail: string, username: string) => {
    if (!confirm(`Are you sure you want to demote ${username} from admin?`)) {
      return;
    }

    try {
      setActionLoading(`demote-${memberEmail}`);
      const response = await demoteAdmin({ targetUserEmail: memberEmail });
      console.log("Demotion successful:", response);

      alert(`${username} has been demoted from admin successfully!`);

      await fetchTeamInfo();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to demote user";
      setError(errorMessage);
      console.error("Demotion error:", err);
    } finally {
      setActionLoading("");
    }
  };

  const copyJoinCode = () => {
    if (team?.join_code) {
      navigator.clipboard.writeText(team.join_code);
      alert("Join code copied to clipboard!");
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newMessage = {
      id: chatMessages.length + 1,
      sender: user?.username || "You",
      message: chatMessage.trim(),
      timestamp: new Date(),
      isSystem: false,
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setChatMessage("");

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        "That's interesting!",
        "I agree with that.",
        "Let me think about that...",
        "Good point!",
        "Thanks for sharing that.",
        "I'll look into that.",
      ];
      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];

      setChatMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: "Team Bot",
          message: randomResponse,
          timestamp: new Date(),
          isSystem: false,
        },
      ]);
    }, 1500);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading || loadingTeam) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading team information...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!team) {
    return (
      <div className={styles.teamContainer}>
        <Header onLogout={handleLogout} />
        <main className={styles.content}>
          <div className={styles.emptyState}>
            <h1>No Team Found</h1>
            <p>You are not currently a member of any team.</p>
            <button
              className={styles.actionButton}
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const currentUserIsAdmin = isCurrentUserAdmin();

  return (
    <div className={styles.teamContainer}>
      <Header onLogout={handleLogout} />

      <main className={styles.content}>
        {error && (
          <div className={styles.errorMessage}>
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        <div className={styles.teamHeader}>
          <div className={styles.teamInfo}>
            <h1>{team.name}</h1>
            <div className={styles.teamMeta}>
              <span className={styles.memberCount}>
                {team.members.length} members
              </span>
              {currentUserIsAdmin && (
                <span className={styles.adminBadge}>Admin</span>
              )}
            </div>
          </div>

          {currentUserIsAdmin && (
            <div className={styles.joinCodeSection}>
              <label>Invite Code</label>
              <div className={styles.joinCodeContainer}>
                <code className={styles.joinCode}>{team.join_code}</code>
                <button className={styles.copyButton} onClick={copyJoinCode}>
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.membersSection}>
          <h2>Team Members</h2>
          <div className={styles.membersList}>
            {team.members.map((member, index) => (
              <div
                key={`${member.email}-${index}`}
                className={styles.memberCard}
              >
                <div className={styles.memberInfo}>
                  <div className={styles.memberAvatar}>
                    {member.profile_picture ? (
                      <Image
                        src={member.profile_picture}
                        alt={member.username}
                        width={40}
                        height={40}
                        className={styles.avatarImage}
                        unoptimized={true}
                      />
                    ) : (
                      <div className={styles.defaultAvatar}>
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={styles.memberDetails}>
                    <h3>{member.username}</h3>
                    <p>{member.email}</p>
                  </div>
                </div>

                <div className={styles.memberActions}>
                  {member.is_admin && (
                    <span className={styles.adminLabel}>Admin</span>
                  )}

                  {/* Show admin action buttons only if current user is admin and not acting on themselves */}
                  {currentUserIsAdmin && member.email !== user?.email && (
                    <div className={styles.adminButtons}>
                      {!member.is_admin ? (
                        // Show promote button for non-admin members
                        <button
                          className={styles.promoteButton}
                          onClick={() =>
                            handlePromoteUser(member.email, member.username)
                          }
                          disabled={actionLoading === `promote-${member.email}`}
                        >
                          {actionLoading === `promote-${member.email}`
                            ? "Promoting..."
                            : "Promote"}
                        </button>
                      ) : (
                        // Show demote button for admin members
                        <button
                          className={styles.demoteButton}
                          onClick={() =>
                            handleDemoteUser(member.email, member.username)
                          }
                          disabled={actionLoading === `demote-${member.email}`}
                        >
                          {actionLoading === `demote-${member.email}`
                            ? "Demoting..."
                            : "Demote"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.teamActions}>
          {currentUserIsAdmin ? (
            <button
              className={styles.deleteButton}
              onClick={handleDeleteTeam}
              disabled={actionLoading === "delete"}
            >
              {actionLoading === "delete" ? "Deleting..." : "Delete Team"}
            </button>
          ) : (
            <button
              className={styles.leaveButton}
              onClick={handleLeaveTeam}
              disabled={actionLoading === "leave"}
            >
              {actionLoading === "leave" ? "Leaving..." : "Leave Team"}
            </button>
          )}
        </div>
      </main>

      <div className={styles.floatingChat}>
        {/* Chat Window */}
        <div
          className={`${styles.chatWindow} ${chatOpen ? styles.chatOpen : ""}`}
        >
          <div className={styles.chatHeader}>
            <div className={styles.chatTitle}>
              <div className={styles.chatIcon}>💬</div>
              <span>Team Chat</span>
            </div>
            <button
              className={styles.chatCloseButton}
              onClick={() => setChatOpen(false)}
            >
              ×
            </button>
          </div>

          <div className={styles.chatMessages}>
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.chatMessage} ${
                  msg.isSystem ? styles.systemMessage : ""
                }`}
              >
                <div className={styles.messageHeader}>
                  <span className={styles.messageSender}>{msg.sender}</span>
                  <span className={styles.messageTime}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div className={styles.messageContent}>{msg.message}</div>
              </div>
            ))}

            {isTyping && (
              <div className={styles.typingIndicator}>
                <div className={styles.typingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>Team Bot is typing...</span>
              </div>
            )}
          </div>

          <form className={styles.chatForm} onSubmit={handleSendMessage}>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Type a message..."
              className={styles.chatInput}
            />
            <button type="submit" className={styles.chatSendButton}>
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>

        {/* Chat Toggle Button */}
        <button
          className={`${styles.chatToggle} ${
            chatOpen ? styles.chatToggleOpen : ""
          }`}
          onClick={() => setChatOpen(!chatOpen)}
        >
          {chatOpen ? (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
            </svg>
          )}
        </button>

        {/* Notification Badge */}
        <div className={styles.chatNotification}>
          <span>2</span>
        </div>
      </div>
    </div>
  );
}
