import { useState } from 'react';
import chatService from '@services/chatService';
import { TrainerAutocomplete } from '@components/common/TrainerAutocomplete';

interface TrainerInfo {
  id: string | number;
  name: string;
}

interface NewChatModalProps {
  creatorTrainerId: number;
  onClose: () => void;
  onCreated: () => void;
}

const NewChatModal = ({ creatorTrainerId, onClose, onCreated }: NewChatModalProps) => {
  const [name, setName] = useState('');
  const [members, setMembers] = useState<TrainerInfo[]>([]);
  const [creating, setCreating] = useState(false);

  const handleAddMember = (trainer: TrainerInfo | null) => {
    if (!trainer) return;
    const numId = Number(trainer.id);
    if (numId === creatorTrainerId) return;
    if (members.some((m) => Number(m.id) === numId)) return;
    setMembers((prev) => [...prev, trainer]);
  };

  const removeMember = (id: string | number) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    setCreating(true);
    try {
      await chatService.createGroupChat({
        name: name.trim(),
        creatorTrainerId,
        memberTrainerIds: [...members.map((m) => Number(m.id)), creatorTrainerId],
      });
      onCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create group chat:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal__header">
          <h3>New Group Chat</h3>
          <button className="chat-modal__close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="chat-modal__body">
          <label className="chat-modal__label">
            Group Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="My Cool Group"
              className="chat-modal__input"
            />
          </label>

          <TrainerAutocomplete
            label="Add Members"
            placeholder="Search for a trainer..."
            selectedTrainerId={null}
            onSelectTrainer={handleAddMember}
            noPadding
          />

          {members.length > 0 && (
            <div className="new-chat-modal__members">
              {members.map((m) => (
                <span key={m.id} className="new-chat-modal__member-tag">
                  {m.name}
                  <button onClick={() => removeMember(m.id)}>
                    <i className="fas fa-times"></i>
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="chat-modal__actions">
            <button className="chat-modal__btn chat-modal__btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="chat-modal__btn chat-modal__btn--primary"
              onClick={handleCreate}
              disabled={creating || !name.trim()}
            >
              {creating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
