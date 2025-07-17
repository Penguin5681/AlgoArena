import { useAuth } from "@/app/context/AuthContext";
import styles from "../css/Header.module.css";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import TeamModal from "@/app/components/team/TeamModal";
import { getCurrentTeam } from "@/app/api/teams/manage-team";
import { useRouter } from "next/navigation";
import GradientButton from "@/app/components/buttons/base/GradientButton";
import { fetchUserXP } from "@/app/api/learn/learn";
import { getUserData } from "@/app/api/authentication/auth";
import { UserProfileDataResponse } from "@/app/api/user/user";

interface HeaderProps {
  onLogout?: () => void;
  userXP?: number;
}

export default function Header({ onLogout, userXP }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [hasTeam, setHasTeam] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const profileCardRef = useRef<HTMLDivElement>(null);
  const userInfoRef = useRef<HTMLDivElement>(null);
  const [userTeam, setUserTeam] = useState<string | null>();
  const [userStatus, setUserStatus] = useState<"online" | "idle" | "offline">(
    "online"
  );
  const [profileUrl, setProfileUrl] = useState<string | null>();
  const toggleProfileCard = () => {
    setShowProfileCard(!showProfileCard);
  };
  const [userData, setUserData] = useState<UserProfileDataResponse | null>(
    null
  );

  const loadTeamData = async () => {
    const teamData = await getCurrentTeam();
    console.log(teamData?.name);
    if (teamData) {
      setUserTeam(teamData.name);
    }
    console.warn("TEAM NOT FOUND");
  };

  const loadUserData = async () => {
    const userDataString = await localStorage.getItem("user_profile_data");
    if (userDataString) {
      const parsedData: UserProfileDataResponse = JSON.parse(userDataString);
      setUserData(parsedData);
      console.warn(parsedData);
    }
  };

  useEffect(() => {
    loadUserData();
    loadTeamData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showProfileCard &&
        profileCardRef.current &&
        userInfoRef.current &&
        !profileCardRef.current.contains(event.target as Node) &&
        !userInfoRef.current.contains(event.target as Node)
      ) {
        setShowProfileCard(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileCard]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showProfileCard) {
        setShowProfileCard(false);
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [showProfileCard]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const data = getUserData()?.profile_picture;
    setProfileUrl(data);
  }, [user]);

  useEffect(() => {
    const checkTeamStatus = async () => {
      try {
        const team = await getCurrentTeam();
        setHasTeam(team !== null);
      } catch (error) {
        console.error("Error checking team status:", error);
        setHasTeam(false);
      }
    };

    if (user) {
      checkTeamStatus();
    }
  }, [user]);

  const handleTeamClick = () => {
    if (hasTeam) {
      router.push("/team");
    } else {
      setShowTeamModal(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "#10b981";
      case "idle":
        return "#f59e0b";
      case "offline":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        <div className={styles.container}>
          <div className={styles.logoSection}>
            <Link href="/dashboard">
              <div className={styles.logo}>
                <div className={styles.logoImageWrapper}>
                  <Image
                    src="/app-logo.png"
                    alt="Algo Arena"
                    width={30}
                    height={30}
                  />
                </div>
                <span className={styles.logoText}>Algo Arena</span>
              </div>
            </Link>
          </div>

          <nav className={styles.navigation}>
            <Link href="/core-modules/learn-module" className={styles.navLink}>
              <span>Learn</span>
            </Link>
            <Link
              href="/core-modules/problem-module"
              className={styles.navLink}
            >
              <span>Problems</span>
            </Link>
            <div
              className={styles.navLink}
              onClick={handleTeamClick}
              style={{ cursor: "pointer" }}
            >
              <div className={styles.teamIndicatorWrapper}>
                <span>My Team</span>
                {hasTeam && <span className={styles.teamIndicator}>•</span>}
              </div>
            </div>
            <Link
              href="/core-modules/leaderboard-module"
              className={styles.navLink}
            >
              <span>Leaderboard</span>
            </Link>
          </nav>

          <div className={styles.userSection}>
            {user && (
              <div className={styles.userProfile}>
                <div
                  className={styles.userInfo}
                  onClick={toggleProfileCard}
                  ref={userInfoRef}
                >
                  {typeof userXP !== "undefined" && (
                    <div className={styles.xpDisplay}>
                      <span>💎</span> {userXP.toLocaleString()} XP
                    </div>
                  )}
                  <span className={styles.username}>{user.username}</span>
                  <div className={styles.avatar}>
                    {profileUrl ? (
                      <Image
                        src={profileUrl}
                        alt="Profile"
                        width={32}
                        height={32}
                        className={styles.avatarImage}
                        unoptimized={true}
                      />
                    ) : (
                      <div className={styles.defaultAvatar}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {showProfileCard && (
                  <div className={styles.profileCard} ref={profileCardRef}>
                    <div className={styles.profileCardImageSection}>
                      <div className={styles.profileCardAvatar}>
                        {user.profile_picture ? (
                          <Image
                            src={user.profile_picture}
                            alt="Profile"
                            width={120}
                            height={120}
                            className={styles.profileCardAvatarImage}
                            unoptimized={true}
                          />
                        ) : (
                          <div className={styles.profileCardDefaultAvatar}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div
                          className={styles.statusIndicator}
                          style={{
                            backgroundColor: getStatusColor(userStatus),
                          }}
                        />
                      </div>
                    </div>

                    <div className={styles.profileCardContent}>
                      <h3 className={styles.profileCardName}>
                        {user.username}
                      </h3>
                      <p className={styles.profileCardTitle}>
                        {userData?.role}
                      </p>

                      <div className={styles.profileCardInfo}>
                        <div className={styles.profileCardLocation}>
                          <span>📍 India</span>
                        </div>

                        <div className={styles.profileCardStatus}>
                          <span className={styles.statusLabel}>Status:</span>
                          <span
                            className={styles.statusValue}
                            style={{ color: getStatusColor(userStatus) }}
                          >
                            {userStatus.charAt(0).toUpperCase() +
                              userStatus.slice(1)}
                          </span>
                        </div>

                        <div className={styles.profileCardTeam}>
                          <span className={styles.teamLabel}>Team:</span>
                          <span className={styles.teamValue}>{userTeam}</span>
                        </div>
                      </div>

                      <div className={styles.profileCardActions}>
                        <Link href="/core-modules/profile-module">
                          <GradientButton>View Profile</GradientButton>
                        </Link>
                        <GradientButton
                          onClick={logout}
                          style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#ef4444",
                          }}
                        >
                          Logout
                        </GradientButton>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <TeamModal
        isOpen={showTeamModal}
        onClose={() => {
          setShowTeamModal(false);
          // Refresh team status after modal closes
          if (user) {
            getCurrentTeam()
              .then((team) => setHasTeam(team !== null))
              .catch(() => setHasTeam(false));
          }
        }}
      />
    </>
  );
}
