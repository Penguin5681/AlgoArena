"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
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
import { getAuthToken } from "@/app/api/authentication/auth";
import Image from "next/image";
import { io, Socket } from "socket.io-client";

interface ChatMessage {
  id: number;
  content: string;
  sender_id: number;
  sender_username: string;
  sender_profile_picture?: string;
  created_at: string;
  team_id: number;
}

interface TypingUser {
  userId: number;
  username: string;
}

export default function TeamPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth_module/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTeamInfo();
    }

    // NOTE: Socket Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.warn("The socket has been disconnected because the component has been unmounted");
      }
    };
  }, [isAuthenticated]);

  // NOTE: This useEffect block is problematic (Bad Code)
  /* 
  useEffect(() => {
    if (isAuthenticated && team?.id) {
      initializeSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isAuthenticated, team?.id]);
  */

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight + 20;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (chatOpen) {
      setUnreadCount(0);
    }
  }, [chatOpen]);

  const initializeSocket = async (teamId: number | undefined) => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token || !teamId) return;

      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      socketRef.current = io("http://localhost:5001", {
        auth: {
          token: token,
        },
      });

      const socket = socketRef.current;

      socket.on("connect", () => {
        console.log("Connected to chat server");
        setIsConnected(true);
        socket.emit("joinTeam", teamId);
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from chat server");
        setIsConnected(false);
      });

      socket.on("newTeamMessage", (message: ChatMessage) => {
        setChatMessages((prev) => {
          if (prev.some((msg) => msg.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });

        if (!chatOpen) {
          setUnreadCount((prev) => prev + 1);
        }
      });

      socket.on("userJoined", (data: { username: string }) => {
        console.log(`${data.username} joined the team`);
      });

      socket.on("userLeft", (data: { username: string }) => {
        console.log(`${data.username} left the team`);
      });

      socket.on(
        "userTyping",
        (data: { userId: number; username: string; isTyping: boolean }) => {
          if (data.userId === user?.id) return;

          setTypingUsers((prev) => {
            if (data.isTyping) {
              if (!prev.find((u) => u.userId === data.userId)) {
                return [
                  ...prev,
                  { userId: data.userId, username: data.username },
                ];
              }
              return prev;
            } else {
              return prev.filter((u) => u.userId !== data.userId);
            }
          });
        }
      );

      socket.on("error", (error: { message: string }) => {
        console.error("Socket error:", error.message);
        setError(error.message);
      });

      await loadChatHistory(teamId);
    } catch (err) {
      console.error("Failed to initialize socket:", err);
    }
  };

  const loadChatHistory = async (teamId: number | undefined) => {
    try {
      const token = getAuthToken();
      if (!token || !teamId) return;

      const response = await fetch(
        `http://localhost:5001/api/team-chat/${teamId}/messages?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(response);

      if (response.ok) {
        const data = await response.json();
        setChatMessages(data.data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !socketRef.current || !team?.id) return;

    try {
      socketRef.current.emit("sendTeamMessage", {
        teamId: team.id,
        content: chatMessage.trim(),
      });

      setChatMessage("");

      socketRef.current.emit("typing", {
        teamId: team.id,
        isTyping: false,
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message");
    }
  };

  const handleTyping = () => {
    if (!socketRef.current || !team?.id) return;

    socketRef.current.emit("typing", {
      teamId: team.id,
      isTyping: true,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && team?.id) {
        socketRef.current.emit("typing", {
          teamId: team.id,
          isTyping: false,
        });
      }
    }, 3000);
  };

  const isCurrentUserAdmin = () => {
    if (!team || !user) return false;
    const currentUserMember = team.members.find(
      (member) => member.email === user.email
    );
    return currentUserMember?.is_admin || false;
  };

  // NOTE: This code has been changed for the good. ref L:70
  const fetchTeamInfo = async () => {
    try {
      setLoadingTeam(true);
      const teamData = await getCurrentTeam();
      setTeam(teamData);

      // if (!teamData) {
      //   router.push("/dashboard");
      // }

      // NOTE: Now the socket would be initialzed after the team is confirmed
      if (teamData) {
        initializeSocket(teamData.id);
      } else {
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
      alert(`${username} has been promoted to admin successfully!`);
      await fetchTeamInfo();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to promote user";
      setError(errorMessage);
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
      alert(`${username} has been demoted from admin successfully!`);
      await fetchTeamInfo();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to demote user";
      setError(errorMessage);
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
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
              <span
                className={`${styles.connectionStatus} ${
                  isConnected ? styles.connected : styles.disconnected
                }`}
              >
                {isConnected ? "🟢 Online" : "🔴 Offline"}
              </span>
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

                  {currentUserIsAdmin && member.email !== user?.email && (
                    <div className={styles.adminButtons}>
                      {!member.is_admin ? (
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

      {/* Real-time Chat */}
      <div className={styles.floatingChat}>
        <div
          className={`${styles.chatWindow} ${chatOpen ? styles.chatOpen : ""}`}
        >
          <div className={styles.chatHeader}>
            <div className={styles.chatTitle}>
              <div className={styles.chatIcon}>💬</div>
              <span>Team Chat</span>
              <span
                className={`${styles.connectionIndicator} ${
                  isConnected ? styles.connected : styles.disconnected
                }`}
              >
                {isConnected ? "●" : "●"}
              </span>
            </div>
            <button
              className={styles.chatCloseButton}
              onClick={() => setChatOpen(false)}
            >
              ×
            </button>
          </div>

          <div className={styles.chatMessages} ref={chatMessagesRef}>
            {chatMessages.length === 0 ? (
              <div className={styles.emptyChatState}>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              chatMessages.map((msg, index) => {
                const showDate =
                  index === 0 ||
                  formatDate(msg.created_at) !==
                    formatDate(chatMessages[index - 1].created_at);

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className={styles.dateSeperator}>
                        {formatDate(msg.created_at)}
                      </div>
                    )}
                    <div
                      className={`${styles.chatMessage} ${
                        msg.sender_id === user?.id ? styles.ownMessage : ""
                      }`}
                    >
                      <div className={styles.messageHeader}>
                        <div className={styles.senderInfo}>
                          {msg.sender_profile_picture ? (
                            <Image
                              src={msg.sender_profile_picture}
                              alt={msg.sender_username}
                              width={20}
                              height={20}
                              className={styles.senderAvatar}
                              unoptimized={true}
                            />
                          ) : (
                            <div className={styles.senderAvatarDefault}>
                              {msg.sender_username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className={styles.messageSender}>
                            {msg.sender_username}
                          </span>
                        </div>
                        <span className={styles.messageTime}>
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      <div className={styles.messageContent}>{msg.content}</div>
                    </div>
                  </div>
                );
              })
            )}

            {typingUsers.length > 0 && (
              <div className={styles.typingIndicator}>
                <div className={styles.typingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>
                  {typingUsers.length === 1
                    ? `${typingUsers[0].username} is typing...`
                    : `${typingUsers.length} people are typing...`}
                </span>
              </div>
            )}
          </div>

          <form className={styles.chatForm} onSubmit={handleSendMessage}>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => {
                setChatMessage(e.target.value);
                handleTyping();
              }}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              className={styles.chatInput}
              disabled={!isConnected}
            />
            <button
              type="submit"
              className={styles.chatSendButton}
              disabled={!isConnected || !chatMessage.trim()}
            >
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

        {unreadCount > 0 && (
          <div className={styles.chatNotification}>
            <span>{unreadCount > 99 ? "99+" : unreadCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}
