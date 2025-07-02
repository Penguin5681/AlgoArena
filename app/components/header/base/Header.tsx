import { useAuth } from "@/app/context/AuthContext";
import styles from '../css/Header.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import TeamModal from '@/app/components/team/TeamModal';
import { getCurrentTeam } from '@/app/api/teams/manage-team';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onLogout?: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [hasTeam, setHasTeam] = useState<boolean | null>(null);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if user has a team
  useEffect(() => {
    const checkTeamStatus = async () => {
      try {
        const team = await getCurrentTeam();
        setHasTeam(team !== null);
      } catch (error) {
        console.error('Error checking team status:', error);
        setHasTeam(false);
      }
    };

    if (user) {
      checkTeamStatus();
    }
  }, [user]);

  const handleTeamClick = () => {
    if (hasTeam) {
      router.push('/team');
    } else {
      setShowTeamModal(true);
    }
  };

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.container}>
          <div className={styles.logoSection}>
            <Link href="/dashboard">
              <div className={styles.logo}>
                <div className={styles.logoImageWrapper}>
                  <Image src="/app-logo.png" alt="Algo Arena" width={30} height={30} />
                </div>
                <span className={styles.logoText}>Algo Arena</span>
              </div>
            </Link>
          </div>

          <nav className={styles.navigation}>
            <Link href="/learn" className={styles.navLink}>
              <span>Learn</span>
            </Link>
            <Link href="/problems" className={styles.navLink}>
              <span>Problems</span>
            </Link>
            <div 
              className={styles.navLink} 
              onClick={handleTeamClick}
              style={{ cursor: 'pointer' }}
            >
                <div className={styles.teamIndicatorWrapper}>
              <span>My Team</span>
              {hasTeam && <span className={styles.teamIndicator}>•</span>}      
                </div>
              
            </div>
            <Link href="/rankings" className={styles.navLink}>
              <span>Rankings</span>
            </Link>
          </nav>

          <div className={styles.userSection}>
            {user && (
              <div className={styles.userProfile}>
                <div className={styles.userInfo} onClick={toggleDropdown}>
                  <span className={styles.username}>{user.username}</span>
                  <div className={styles.avatar}>
                    {user.profilePicture ? (
                      <Image
                        src={user.profilePicture} 
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
                
                {showDropdown && (
                  <div className={styles.dropdown}>
                    <Link href="/profile" className={styles.dropdownItem}>Profile</Link>
                    <Link href="/settings" className={styles.dropdownItem}>Settings</Link>
                    <div className={styles.divider}></div>
                    <button 
                      className={styles.logoutButton} 
                      onClick={onLogout}
                    >
                      Logout
                    </button>
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
            getCurrentTeam().then(team => setHasTeam(team !== null)).catch(() => setHasTeam(false));
          }
        }}
      />
    </>
  );
}