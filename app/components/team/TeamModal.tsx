'use client';

import React, { useState } from 'react';
import Modal from '../modal/base/Modal';
import styles from '../modal/css/Modal.module.css';
import { createTeam, joinTeam } from '@/app/api/teams/manage-team';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

enum TeamModalState {
  INITIAL,
  JOIN_TEAM,
  CREATE_TEAM,
  SUCCESS
}

const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose }) => {
  const [modalState, setModalState] = useState(TeamModalState.INITIAL);
  const [teamCode, setTeamCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ 
    type: 'create' | 'join', 
    teamId?: number, 
    joinCode?: string 
  } | null>(null);

  const resetModal = () => {
    setModalState(TeamModalState.INITIAL);
    setTeamCode('');
    setTeamName('');
    setError('');
    setSuccessData(null);
  };

  const handleJoinTeam = async () => {
    if (!teamCode.trim()) {
      setError('Please enter a team code');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      const response = await joinTeam({ joinCode: teamCode.trim() });
      
      setSuccessData({ type: 'join' });
      setModalState(TeamModalState.SUCCESS);
      
      // Optionally refresh user data or team info here
      console.log('Successfully joined team:', response.message);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join team';
      
      // Handle specific error messages from your backend
      if (errorMessage === 'User already in a team') {
        setError('You are already a member of a team. Leave your current team first.');
      } else if (errorMessage === 'Team not found') {
        setError('Invalid team code. Please check and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }
    
    if (teamName.length < 3) {
      setError('Team name must be at least 3 characters long');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      const response = await createTeam({ name: teamName.trim() });
      
      setSuccessData({ 
        type: 'create', 
        teamId: response.teamId, 
        joinCode: response.joinCode 
      });
      setModalState(TeamModalState.SUCCESS);
      
      // Optionally refresh user data or team info here
      console.log('Successfully created team:', response);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create team';
      
      // Handle specific error messages from your backend
      if (errorMessage === 'User already in a team') {
        setError('You are already a member of a team. Leave your current team first.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderSuccessView = () => (
    <div style={{ textAlign: 'center', padding: '16px 0' }}>
      <div style={{ 
        width: '60px', 
        height: '60px', 
        background: 'linear-gradient(135deg, #635cfe, #5fc5ff)', 
        borderRadius: '50%', 
        margin: '0 auto 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      {successData?.type === 'create' ? (
        <>
          <h3 style={{ margin: '0 0 8px', color: 'white' }}>Team Created Successfully!</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '16px' }}>
            Your team has been created. Share this code with others to invite them:
          </p>
          <div style={{ 
            background: 'rgba(99, 92, 254, 0.15)', 
            border: '1px solid rgba(99, 92, 254, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            margin: '16px 0',
            fontFamily: 'monospace',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#5fc5ff'
          }}>
            {successData.joinCode}
          </div>
        </>
      ) : (
        <>
          <h3 style={{ margin: '0 0 8px', color: 'white' }}>Joined Team Successfully!</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '16px' }}>
            Welcome to your new team! You can now participate in team challenges.
          </p>
        </>
      )}
      
      <button 
        className={styles.actionButton}
        onClick={() => {
          resetModal();
          onClose();
        }}
        style={{ marginTop: '16px' }}
      >
        Continue
      </button>
    </div>
  );

  const renderInitialView = () => (
    <div className={styles.buttonContainer}>
      <button 
        className={styles.modalButton}
        onClick={() => setModalState(TeamModalState.JOIN_TEAM)}
      >
        <div className={styles.buttonContent}>
          <span className={styles.buttonTitle}>Join a Team</span>
          <span className={styles.buttonDescription}>Join an existing team using an invite code</span>
        </div>
        <div className={styles.modalButtonIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="8.5" cy="7" r="4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 8V14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 11H17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>
      
      <button 
        className={styles.modalButton}
        onClick={() => setModalState(TeamModalState.CREATE_TEAM)}
      >
        <div className={styles.buttonContent}>
          <span className={styles.buttonTitle}>Create a Team</span>
          <span className={styles.buttonDescription}>Start a new team and invite others to join</span>
        </div>
        <div className={styles.modalButtonIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>
    </div>
  );

  const renderJoinTeamView = () => (
    <>
      <button 
        className={styles.backButton}
        onClick={() => {
          setModalState(TeamModalState.INITIAL);
          setError('');
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>
      
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>Enter Team Code</label>
        <input 
          type="text" 
          className={styles.inputField}
          value={teamCode}
          onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
          placeholder="e.g. TEAM-123456"
          maxLength={20}
        />
        {error && <p className={styles.errorText}>{error}</p>}
      </div>
      
      <button 
        className={styles.actionButton}
        onClick={handleJoinTeam}
        disabled={isLoading || !teamCode.trim()}
      >
        {isLoading ? 'Joining...' : 'Join Team'}
      </button>
    </>
  );

  const renderCreateTeamView = () => (
    <>
      <button 
        className={styles.backButton}
        onClick={() => {
          setModalState(TeamModalState.INITIAL);
          setError('');
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>
      
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>Team Name</label>
        <input 
          type="text" 
          className={styles.inputField}
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Enter your team name"
          maxLength={50}
        />
        {error && <p className={styles.errorText}>{error}</p>}
      </div>
      
      <button 
        className={styles.actionButton}
        onClick={handleCreateTeam}
        disabled={isLoading || !teamName.trim()}
      >
        {isLoading ? 'Creating...' : 'Create Team'}
      </button>
    </>
  );

  const renderContent = () => {
    switch (modalState) {
      case TeamModalState.SUCCESS:
        return renderSuccessView();
      case TeamModalState.JOIN_TEAM:
        return renderJoinTeamView();
      case TeamModalState.CREATE_TEAM:
        return renderCreateTeamView();
      case TeamModalState.INITIAL:
      default:
        return renderInitialView();
    }
  };

  const getTitle = () => {
    switch (modalState) {
      case TeamModalState.SUCCESS:
        return successData?.type === 'create' ? 'Team Created' : 'Team Joined';
      case TeamModalState.JOIN_TEAM:
        return 'Join a Team';
      case TeamModalState.CREATE_TEAM:
        return 'Create a Team';
      case TeamModalState.INITIAL:
      default:
        return 'My Team';
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {
        resetModal();
        onClose();
      }}
      title={getTitle()}
    >
      {renderContent()}
    </Modal>
  );
};

export default TeamModal;