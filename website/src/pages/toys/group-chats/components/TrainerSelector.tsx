import { useState, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import trainerService from '@services/trainerService';
import chatService from '@services/chatService';
import type { TrainerOption } from '../types';

interface TrainerSelectorProps {
  onSelect: (trainer: TrainerOption) => void;
}

const TrainerSelector = ({ onSelect }: TrainerSelectorProps) => {
  const { currentUser } = useAuth();
  const [trainers, setTrainers] = useState<TrainerOption[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const loadTrainers = async () => {
      try {
        const res = await trainerService.getUserTrainers(currentUser.discord_id);
        const trainerList = res?.trainers ?? [];
        const mapped: TrainerOption[] = trainerList.map((t) => ({
          id: t.id,
          name: t.name || 'Unnamed',
          image: t.main_ref || undefined,
          userId: currentUser.id,
        }));

        // Prepend admin option for admin users
        if (currentUser.is_admin) {
          mapped.unshift({
            id: -1,
            name: 'Admin',
            image: undefined,
            userId: currentUser.id,
            isAdmin: true,
          });
        }

        setTrainers(mapped);

        // Fetch unread counts for all non-admin trainers
        const realIds = mapped.filter((t) => !t.isAdmin).map((t) => t.id);
        if (realIds.length > 0) {
          try {
            const counts = await chatService.getUnreadCounts(realIds);
            setUnreadCounts(counts);
          } catch {
            // Silently fail — badges just won't show
          }
        }
      } catch (err) {
        console.error('Failed to load trainers:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTrainers();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="trainer-selector">
        <div className="trainer-selector__loading">Loading trainers...</div>
      </div>
    );
  }

  if (trainers.length === 0) {
    return (
      <div className="trainer-selector">
        <div className="trainer-selector__empty">
          You need at least one trainer to use Group Chats.
        </div>
      </div>
    );
  }

  return (
    <div className="trainer-selector">
      <h2 className="trainer-selector__title">Who are you chatting as?</h2>
      <p className="trainer-selector__subtitle">Select a trainer to enter the chat</p>
      <div className="trainer-selector__grid">
        {trainers.map((trainer) => (
          <button
            key={trainer.id}
            className={`trainer-selector__card ${trainer.isAdmin ? 'trainer-selector__card--admin' : ''}`}
            onClick={() => onSelect(trainer)}
          >
            {trainer.isAdmin ? (
              <div className="trainer-selector__avatar trainer-selector__avatar--admin">
                <i className="fas fa-shield-alt"></i>
              </div>
            ) : trainer.image ? (
              <img
                src={trainer.image}
                alt={trainer.name}
                className="trainer-selector__avatar"
              />
            ) : (
              <div className="trainer-selector__avatar trainer-selector__avatar--placeholder">
                <i className="fas fa-user"></i>
              </div>
            )}
            <span className="trainer-selector__name">{trainer.name}</span>
            {!trainer.isAdmin && unreadCounts[trainer.id] > 0 && (
              <span className="trainer-selector__unread-badge">
                {unreadCounts[trainer.id]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrainerSelector;
