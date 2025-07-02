'use client';

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/app/components/header/base/Header";
import styles from "./team.module.css";
import { getCurrentTeam, leaveTeam, promoteToAdmin, deleteTeam, TeamInfo } from "@/app/api/teams/manage-team";
import Image from "next/image";

export default function TeamPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');

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

  // Helper function to check if current user is admin
  const isCurrentUserAdmin = () => {
    if (!team || !user) return false;
    const currentUserMember = team.members.find(member => member.email === user.email);
    return currentUserMember?.is_admin || false;
  };

  const fetchTeamInfo = async () => {
    try {
      setLoadingTeam(true);
      const teamData = await getCurrentTeam();
      setTeam(teamData);
      console.log('Team data:', teamData);
      console.log('Members:', teamData?.members);
      console.log('Current user:', user);
      console.log('Is current user admin?', teamData?.members.find(m => m.email === user?.email)?.is_admin);
      
      if (!teamData) {
        router.push('/dashboard'); 
      }
    } catch (err) {
      setError('Failed to load team information');
      console.error('Error fetching team:', err);
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave this team?')) {
      return;
    }

    try {
      setActionLoading('leave');
      await leaveTeam();
      router.push('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave team';
      setError(errorMessage);
    } finally {
      setActionLoading('');
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone and will remove all members.')) {
      return;
    }

    try {
      setActionLoading('delete');
      await deleteTeam();
      router.push('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete team';
      setError(errorMessage);
    } finally {
      setActionLoading('');
    }
  };

  const handlePromoteUser = async (memberEmail: string, username: string) => {
    if (!confirm(`Are you sure you want to promote ${username} to admin?`)) {
      return;
    }

    try {
      setActionLoading(`promote-${memberEmail}`);
      const response = await promoteToAdmin({ targetUserEmail: memberEmail });
      console.log('Promotion successful:', response);
      
      // Show success message
      alert(`${username} has been promoted to admin successfully!`);
      
      // Refresh team data to reflect changes
      await fetchTeamInfo();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to promote user';
      setError(errorMessage);
      console.error('Promotion error:', err);
    } finally {
      setActionLoading('');
    }
  };

  const copyJoinCode = () => {
    if (team?.join_code) {
      navigator.clipboard.writeText(team.join_code);
      alert('Join code copied to clipboard!');
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
              onClick={() => router.push('/dashboard')}
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
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        <div className={styles.teamHeader}>
          <div className={styles.teamInfo}>
            <h1>{team.name}</h1>
            <div className={styles.teamMeta}>
              <span className={styles.memberCount}>{team.members.length} members</span>
              {currentUserIsAdmin && <span className={styles.adminBadge}>Admin</span>}
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
              <div key={`${member.email}-${index}`} className={styles.memberCard}>
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
                  {member.is_admin && <span className={styles.adminLabel}>Admin</span>}
                  {currentUserIsAdmin && !member.is_admin && member.email !== user?.email && (
                    <button 
                      className={styles.promoteButton}
                      onClick={() => handlePromoteUser(member.email, member.username)}
                      disabled={actionLoading === `promote-${member.email}`}
                    >
                      {actionLoading === `promote-${member.email}` ? 'Promoting...' : 'Promote'}
                    </button>
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
              disabled={actionLoading === 'delete'}
            >
              {actionLoading === 'delete' ? 'Deleting...' : 'Delete Team'}
            </button>
          ) : (
            <button 
              className={styles.leaveButton}
              onClick={handleLeaveTeam}
              disabled={actionLoading === 'leave'}
            >
              {actionLoading === 'leave' ? 'Leaving...' : 'Leave Team'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}