import { useState, useEffect, useRef } from 'react';
import chatService from '@services/chatService';
import type { ChatProfile } from '../types';

interface ChatProfileModalProps {
  trainerId: number;
  onClose: () => void;
  onUpdate: (profile: ChatProfile) => void;
}

const ChatProfileModal = ({ trainerId, onClose, onUpdate }: ChatProfileModalProps) => {
  const [profile, setProfile] = useState<ChatProfile | null>(null);
  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatService.getProfile(trainerId).then((p) => {
      setProfile(p);
      setNickname(p.nickname);
      setStatus(p.status ?? '');
      setBio(p.bio ?? '');
      setAvatarUrl(p.avatarUrl);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [trainerId]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await chatService.uploadChatImage(file);
      setAvatarUrl(url);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await chatService.updateProfile(trainerId, {
        nickname: nickname.trim() || undefined,
        status: status.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      });
      onUpdate(updated);
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal__header">
          <h3>Chat Profile</h3>
          <button className="chat-modal__close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {loading ? (
          <div className="chat-modal__loading">Loading...</div>
        ) : (
          <div className="chat-modal__body">
            <div className="chat-modal__avatar-section">
              <button
                className="chat-profile__avatar-upload"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Change avatar"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={profile?.nickname} className="chat-modal__avatar" />
                ) : (
                  <div className="chat-modal__avatar chat-modal__avatar--placeholder">
                    {nickname.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="chat-profile__avatar-overlay">
                  <i className={`fas ${uploading ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                hidden
              />
            </div>

            <label className="chat-modal__label">
              Nickname
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={50}
                className="chat-modal__input"
              />
            </label>

            <label className="chat-modal__label">
              Status
              <input
                type="text"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                maxLength={100}
                placeholder="What are you up to?"
                className="chat-modal__input"
              />
            </label>

            <label className="chat-modal__label">
              Bio
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                rows={3}
                className="chat-modal__textarea"
              />
            </label>

            <div className="chat-modal__actions">
              <button className="chat-modal__btn chat-modal__btn--secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                className="chat-modal__btn chat-modal__btn--primary"
                onClick={handleSave}
                disabled={saving || uploading || !nickname.trim()}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatProfileModal;
