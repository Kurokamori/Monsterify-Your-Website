import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { PageHeader } from '@components/layouts/PageHeader';
import { GiftRewards } from '@components/submissions/GiftRewards';
import { SuccessMessage } from '@components/common/SuccessMessage';
import { ErrorMessage } from '@components/common/ErrorMessage';
import notificationService from '../../services/notificationService';
import type { MissedChatItem, DesignApproval, RewardsSummary, NotificationSummary } from '../../services/notificationService';
import trainerService from '../../services/trainerService';
import monsterService from '../../services/monsterService';

type Tab = 'chats' | 'design-approvals' | 'rewards';

interface Trainer {
  id: number;
  name: string;
}

interface Monster {
  id: number;
  name: string;
  species1?: string;
  species2?: string;
  species3?: string;
  trainer_id?: number;
}

const NotificationsPage = () => {
  useDocumentTitle('Notifications');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('chats');

  // Chat tab state
  const [chats, setChats] = useState<MissedChatItem[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);

  // Design approval tab state
  const [approvals, setApprovals] = useState<DesignApproval[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalActionId, setApprovalActionId] = useState<number | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Rewards tab state
  const [rewardsSummary, setRewardsSummary] = useState<RewardsSummary | null>(null);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [showGiftRewards, setShowGiftRewards] = useState(false);
  const [giftLevels, setGiftLevels] = useState(0);
  const [userTrainers, setUserTrainers] = useState<Trainer[]>([]);
  const [userMonsters, setUserMonsters] = useState<Monster[]>([]);
  const [claimingGifts, setClaimingGifts] = useState(false);

  // Summary counts for tab badges (fetched eagerly on mount)
  const [summary, setSummary] = useState<NotificationSummary | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/profile/notifications');
      return;
    }
    notificationService.getSummary().then(setSummary).catch(() => {/* badge counts optional */});
  }, [isAuthenticated, navigate]);

  const loadChats = useCallback(async () => {
    setChatsLoading(true);
    setError(null);
    try {
      const data = await notificationService.getMissedChats();
      setChats(data);
    } catch {
      setError('Failed to load missed chats.');
    } finally {
      setChatsLoading(false);
    }
  }, []);

  const loadApprovals = useCallback(async () => {
    setApprovalsLoading(true);
    setError(null);
    try {
      const data = await notificationService.getPendingApprovals();
      setApprovals(data);
    } catch {
      setError('Failed to load pending approvals.');
    } finally {
      setApprovalsLoading(false);
    }
  }, []);

  const loadRewards = useCallback(async () => {
    setRewardsLoading(true);
    setError(null);
    try {
      const data = await notificationService.getRewardsSummary();
      setRewardsSummary(data);
    } catch {
      setError('Failed to load rewards summary.');
    } finally {
      setRewardsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'chats') loadChats();
    else if (activeTab === 'design-approvals') loadApprovals();
    else if (activeTab === 'rewards') loadRewards();
  }, [activeTab, isAuthenticated, loadChats, loadApprovals, loadRewards]);

  const handleAccept = async (id: number) => {
    setApprovalActionId(id);
    setError(null);
    try {
      await notificationService.acceptApproval(id);
      setSuccessMsg('Approval accepted. Reference and rewards have been applied.');
      setApprovals((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept approval.');
    } finally {
      setApprovalActionId(null);
    }
  };

  const handleReject = async (id: number) => {
    setApprovalActionId(id);
    setError(null);
    try {
      await notificationService.rejectApproval(id);
      setSuccessMsg('Approval rejected.');
      setApprovals((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject approval.');
    } finally {
      setApprovalActionId(null);
    }
  };

  const handleAcceptAll = async () => {
    setBulkActionLoading(true);
    setError(null);
    try {
      await notificationService.acceptAll();
      setSuccessMsg('All approvals accepted. References and rewards have been applied.');
      setApprovals([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept all approvals.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleRejectAll = async () => {
    setBulkActionLoading(true);
    setError(null);
    try {
      await notificationService.rejectAll();
      setSuccessMsg('All approvals rejected.');
      setApprovals([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject all approvals.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleClaimGiftRewards = async () => {
    setClaimingGifts(true);
    setError(null);
    try {
      const result = await notificationService.claimGiftRewards();
      setGiftLevels(result.giftLevels);

      const [trainersRes, monstersRes] = await Promise.all([
        trainerService.getUserTrainers(),
        monsterService.getMonstersByUserId(),
      ]);
      setUserTrainers(trainersRes.trainers ?? []);
      setUserMonsters((monstersRes ?? []).map(m => ({ ...m, name: m.name ?? '' })) as Monster[]);
      setShowGiftRewards(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim gift rewards.');
    } finally {
      setClaimingGifts(false);
    }
  };

  const handleGiftRewardsComplete = () => {
    setShowGiftRewards(false);
    setGiftLevels(0);
    setSuccessMsg('Gift rewards claimed successfully!');
    loadRewards();
  };

  const handleGiftRewardsCancel = () => {
    setShowGiftRewards(false);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getReferenceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      trainer: 'Trainer Ref',
      monster: 'Monster Ref',
      'mega image': 'Mega Image',
      'trainer mega': 'Trainer Mega',
    };
    return labels[type] ?? type;
  };

  if (!isAuthenticated) return null;

  if (showGiftRewards) {
    return (
      <div className="main-container">
        <GiftRewards
          giftLevels={giftLevels}
          userTrainers={userTrainers}
          userMonsters={userMonsters}
          onComplete={handleGiftRewardsComplete}
          onCancel={handleGiftRewardsCancel}
          submissionType="reference"
        />
      </div>
    );
  }

  const trainerApprovals = approvals.filter((a) => a.referenceType === 'trainer' || a.referenceType === 'trainer mega');
  const monsterApprovals = approvals.filter((a) => a.referenceType === 'monster' || a.referenceType === 'mega image');

  // Use loaded data count if available, otherwise fall back to summary
  const approvalBadgeCount = approvals.length > 0
    ? approvals.length
    : (summary?.pendingDesignApprovals ?? 0);

  const hasRewards = rewardsSummary
    ? (rewardsSummary.totalGiftLevels > 0 || rewardsSummary.pendingBossRewards > 0 || rewardsSummary.pendingMissionRewards > 0)
    : (summary ? (summary.unclaimedGiftRewards > 0 || summary.pendingBossRewards > 0 || summary.pendingMissionRewards > 0) : false);

  return (
    <div className="main-container notifications-page">
      <PageHeader
        title="Notifications"
        subtitle="Missed messages, pending design approvals, and unclaimed rewards."
      />

      {successMsg && <SuccessMessage message={successMsg} onClose={() => setSuccessMsg(null)} />}
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Tab Navigation */}
      <div className="notifications-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'chats'}
          className={`notifications-tab${activeTab === 'chats' ? ' notifications-tab--active' : ''}`}
          onClick={() => setActiveTab('chats')}
        >
          <i className="fas fa-comment-dots"></i>
          Chat Messages
          {chats.length > 0 && (
            <span className="notifications-tab__badge">{chats.length}</span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'design-approvals'}
          className={`notifications-tab${activeTab === 'design-approvals' ? ' notifications-tab--active' : ''}`}
          onClick={() => setActiveTab('design-approvals')}
        >
          <i className="fas fa-paint-brush"></i>
          Design Approvals
          {approvalBadgeCount > 0 && (
            <span className="notifications-tab__badge">{approvalBadgeCount}</span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'rewards'}
          className={`notifications-tab${activeTab === 'rewards' ? ' notifications-tab--active' : ''}`}
          onClick={() => setActiveTab('rewards')}
        >
          <i className="fas fa-star"></i>
          Rewards
          {hasRewards && (
            <span className="notifications-tab__badge notifications-tab__badge--urgent">!</span>
          )}
        </button>
      </div>

      {/* Tab 1 – Chat Messages */}
      {activeTab === 'chats' && (
        <div role="tabpanel">
          {chatsLoading ? (
            <div className="notifications-loading">
              <i className="fas fa-spinner fa-spin"></i>
              Loading missed chats…
            </div>
          ) : chats.length === 0 ? (
            <div className="notifications-empty">
              <i className="fas fa-check-circle notifications-empty__icon"></i>
              <p>You're all caught up — no missed messages.</p>
            </div>
          ) : (
            <div className="notifications-chat-list">
              {chats.map((chat) => (
                <div key={`${chat.roomId}-${chat.trainerId}`} className="notification-chat-item">
                  <div>
                    <div className="notification-chat-item__meta">
                      <span className="notification-chat-item__trainer">{chat.trainerName}</span>
                      <span className="notification-chat-item__room">
                        <i className="fas fa-hashtag" style={{ fontSize: '0.7em' }}></i>{' '}
                        {chat.roomName ?? 'Direct Message'}
                      </span>
                      {chat.senderTrainerName && (
                        <span className="notification-chat-item__from">
                          from {chat.senderTrainerName}
                        </span>
                      )}
                    </div>
                    {chat.lastMessagePreview && (
                      <p className="notification-chat-item__preview">{chat.lastMessagePreview}</p>
                    )}
                  </div>
                  <div className="notification-chat-item__actions">
                    {chat.lastMessageAt && (
                      <span className="notification-chat-item__date">{formatDate(chat.lastMessageAt)}</span>
                    )}
                    <Link
                      to={`/toys/group-chats?room=${chat.roomId}&trainer=${chat.trainerId}`}
                      className="button primary sm"
                    >
                      Open Chat
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2 – Design Approvals */}
      {activeTab === 'design-approvals' && (
        <div role="tabpanel">
          {approvalsLoading ? (
            <div className="notifications-loading">
              <i className="fas fa-spinner fa-spin"></i>
              Loading pending approvals…
            </div>
          ) : approvals.length === 0 ? (
            <div className="notifications-empty">
              <i className="fas fa-clipboard-check notifications-empty__icon"></i>
              <p>No pending design approvals.</p>
            </div>
          ) : (
            <>
              <div className="notifications-approvals-toolbar">
                <span className="notifications-approvals-toolbar__count">
                  {approvals.length} pending approval{approvals.length !== 1 ? 's' : ''}
                </span>
                <div className="notifications-approvals-toolbar__actions">
                  <button
                    type="button"
                    className="button primary sm"
                    onClick={handleAcceptAll}
                    disabled={bulkActionLoading}
                  >
                    <i className="fas fa-check-double"></i> Accept All
                  </button>
                  <button
                    type="button"
                    className="button ghost sm"
                    onClick={handleRejectAll}
                    disabled={bulkActionLoading}
                  >
                    <i className="fas fa-times"></i> Reject All
                  </button>
                </div>
              </div>

              {trainerApprovals.length > 0 && (
                <div className="notifications-approval-section">
                  <p className="notifications-approval-section__heading">Trainer References</p>
                  <div className="notifications-approval-list">
                    {trainerApprovals.map((approval) => (
                      <ApprovalCard
                        key={approval.id}
                        approval={approval}
                        getReferenceTypeLabel={getReferenceTypeLabel}
                        onAccept={handleAccept}
                        onReject={handleReject}
                        actionLoading={approvalActionId === approval.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {monsterApprovals.length > 0 && (
                <div className="notifications-approval-section">
                  <p className="notifications-approval-section__heading">Monster References</p>
                  <div className="notifications-approval-list">
                    {monsterApprovals.map((approval) => (
                      <ApprovalCard
                        key={approval.id}
                        approval={approval}
                        getReferenceTypeLabel={getReferenceTypeLabel}
                        onAccept={handleAccept}
                        onReject={handleReject}
                        actionLoading={approvalActionId === approval.id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab 3 – Rewards */}
      {activeTab === 'rewards' && (
        <div role="tabpanel">
          {rewardsLoading ? (
            <div className="notifications-loading">
              <i className="fas fa-spinner fa-spin"></i>
              Loading rewards…
            </div>
          ) : (
            <div className="notifications-rewards-grid">
              {/* Gift Reference Rewards */}
              <div className={`notification-reward-card${rewardsSummary && rewardsSummary.totalGiftLevels > 0 ? ' notification-reward-card--has-rewards' : ''}`}>
                <div className="notification-reward-card__header">
                  <div className={`notification-reward-card__icon${!rewardsSummary || rewardsSummary.totalGiftLevels === 0 ? ' notification-reward-card__icon--none' : ''}`}>
                    <i className="fas fa-gift"></i>
                  </div>
                  <h3 className="notification-reward-card__title">Gift Reference Rewards</h3>
                </div>
                <div className="notification-reward-card__body">
                  {rewardsSummary && rewardsSummary.totalGiftLevels > 0 ? (
                    <>
                      <div className="notification-reward-card__highlight">
                        <i className="fas fa-star"></i>
                        {rewardsSummary.totalGiftLevels} gift levels waiting
                      </div>
                      <p>Someone drew references for your characters — distribute these bonus levels among your trainers and monsters.</p>
                      <button
                        type="button"
                        className="button primary"
                        onClick={handleClaimGiftRewards}
                        disabled={claimingGifts}
                        style={{ marginTop: 'var(--spacing-small)', width: '100%' }}
                      >
                        {claimingGifts
                          ? <><i className="fas fa-spinner fa-spin"></i> Loading…</>
                          : <><i className="fas fa-gift"></i> Claim {rewardsSummary.totalGiftLevels} Gift Levels</>
                        }
                      </button>
                    </>
                  ) : (
                    <p>No pending gift reference rewards.</p>
                  )}
                </div>
              </div>

              {/* Boss Rewards */}
              <div className={`notification-reward-card${rewardsSummary && rewardsSummary.pendingBossRewards > 0 ? ' notification-reward-card--has-rewards' : ''}`}>
                <div className="notification-reward-card__header">
                  <div className={`notification-reward-card__icon${!rewardsSummary || rewardsSummary.pendingBossRewards === 0 ? ' notification-reward-card__icon--none' : ''}`}>
                    <i className="fas fa-skull-crossbones"></i>
                  </div>
                  <h3 className="notification-reward-card__title">Boss Rewards</h3>
                </div>
                <div className="notification-reward-card__body">
                  {rewardsSummary && rewardsSummary.pendingBossRewards > 0 ? (
                    <>
                      <div className="notification-reward-card__highlight">
                        <i className="fas fa-trophy"></i>
                        {rewardsSummary.pendingBossRewards} unclaimed reward{rewardsSummary.pendingBossRewards !== 1 ? 's' : ''}
                      </div>
                      <p>You have boss rewards waiting to be claimed.</p>
                      <Link
                        to="/adventures?tab=boss"
                        className="button primary"
                        style={{ marginTop: 'var(--spacing-small)', display: 'flex', justifyContent: 'center' }}
                      >
                        <i className="fas fa-arrow-right"></i> Go to Boss
                      </Link>
                    </>
                  ) : (
                    <p>No pending boss rewards.</p>
                  )}
                </div>
              </div>

              {/* Mission Rewards */}
              <div className={`notification-reward-card${rewardsSummary && rewardsSummary.pendingMissionRewards > 0 ? ' notification-reward-card--has-rewards' : ''}`}>
                <div className="notification-reward-card__header">
                  <div className={`notification-reward-card__icon${!rewardsSummary || rewardsSummary.pendingMissionRewards === 0 ? ' notification-reward-card__icon--none' : ''}`}>
                    <i className="fas fa-scroll"></i>
                  </div>
                  <h3 className="notification-reward-card__title">Mission Rewards</h3>
                </div>
                <div className="notification-reward-card__body">
                  {rewardsSummary && rewardsSummary.pendingMissionRewards > 0 ? (
                    <>
                      <div className="notification-reward-card__highlight">
                        <i className="fas fa-check-circle"></i>
                        {rewardsSummary.pendingMissionRewards} completed mission{rewardsSummary.pendingMissionRewards !== 1 ? 's' : ''}
                      </div>
                      <p>You have completed missions with unclaimed rewards.</p>
                      <Link
                        to="/adventures?tab=missions"
                        className="button primary"
                        style={{ marginTop: 'var(--spacing-small)', display: 'flex', justifyContent: 'center' }}
                      >
                        <i className="fas fa-arrow-right"></i> Go to Missions
                      </Link>
                    </>
                  ) : (
                    <p>No pending mission rewards.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ApprovalCardProps {
  approval: DesignApproval;
  getReferenceTypeLabel: (type: string) => string;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  actionLoading: boolean;
}

function ApprovalCard({ approval, getReferenceTypeLabel, onAccept, onReject, actionLoading }: ApprovalCardProps) {
  const submitterName = approval.submitterDisplayName ?? approval.submitterUsername ?? 'Unknown';
  const [imgError, setImgError] = useState(false);

  return (
    <div className="notification-approval-card">
      {/* Thumbnail */}
      {approval.referenceUrl && !imgError ? (
        <a href={approval.referenceUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={approval.referenceUrl}
            alt="Reference thumbnail"
            className="notification-approval-card__thumb"
            onError={() => setImgError(true)}
          />
        </a>
      ) : (
        <div className="notification-approval-card__thumb-placeholder">
          <i className="fas fa-image"></i>
        </div>
      )}

      {/* Info */}
      <div className="notification-approval-card__info">
        <div className="notification-approval-card__header">
          <span className="notification-approval-card__type">
            {getReferenceTypeLabel(approval.referenceType)}
          </span>
          <span className="notification-approval-card__name">{approval.trainerName}</span>
          {approval.monsterName && (
            <span className="notification-approval-card__monster">— {approval.monsterName}</span>
          )}
        </div>
        <div className="notification-approval-card__submeta">
          <span>From: <strong>{submitterName}</strong></span>
          <span><strong>{approval.rewardLevels}</strong> levels &middot; <strong>{approval.rewardCoins}</strong> coins</span>
        </div>
      </div>

      {/* Actions */}
      <div className="notification-approval-card__actions">
        <button
          type="button"
          className="button primary sm"
          onClick={() => onAccept(approval.id)}
          disabled={actionLoading}
        >
          <i className="fas fa-check"></i> Accept
        </button>
        <button
          type="button"
          className="button ghost sm"
          onClick={() => onReject(approval.id)}
          disabled={actionLoading}
        >
          <i className="fas fa-times"></i> Reject
        </button>
      </div>
    </div>
  );
}

export default NotificationsPage;
