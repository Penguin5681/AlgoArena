import { useAuth } from "@/app/context/AuthContext";
import styles from '../css/Header.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface HeaderProps {
  onLogout?: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  return (
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
          <Link href="/teams" className={styles.navLink}>
            <span>My Team</span>
          </Link>
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
                <div className={`${styles.chevron} ${showDropdown ? styles.chevronOpen : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              
              {showDropdown && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownContent}>
                    <Link href="/profile" className={styles.dropdownItem}>
                      <span className={styles.dropdownIcon}>👤</span>
                      Profile
                    </Link>
                    <Link href="/settings" className={styles.dropdownItem}>
                      <span className={styles.dropdownIcon}>⚙️</span>
                      Settings
                    </Link>
                    <div className={styles.divider}></div>
                    <button 
                      className={styles.logoutButton} 
                      onClick={onLogout}
                    >
                      <span className={styles.dropdownIcon}>🚪</span>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}