import type { ChatRoom } from '../types';

interface ChatRoomCardProps {
  room: ChatRoom;
  isActive: boolean;
  currentTrainerId: number;
  onClick: () => void;
}

const ChatRoomCard = ({ room, isActive, currentTrainerId, onClick }: ChatRoomCardProps) => {
  const displayName =
    (room.name ??
    room.members
      .filter((m) => m.trainerId !== currentTrainerId)
      .map((m) => m.nickname)
      .join(', ')) ||
    'Empty Chat';

  const timeStr = room.lastMessageAt
    ? formatRelativeTime(new Date(room.lastMessageAt))
    : '';

  // For DMs, show the other member's avatar; for groups/factions, show room icon
  const otherMember = room.type === 'dm'
    ? room.members.find((m) => m.trainerId !== currentTrainerId)
    : null;
  const avatarUrl = room.type === 'dm' ? otherMember?.avatarUrl : room.iconUrl;
  const isFaction = room.type === 'faction';

  return (
    <button
      className={`chat-room-card ${isActive ? 'chat-room-card--active' : ''} ${isFaction ? 'chat-room-card--faction' : ''}`}
      onClick={onClick}
    >
      <div className={`chat-room-card__avatar ${isFaction ? 'chat-room-card__avatar--faction' : room.type === 'group' && !avatarUrl ? 'chat-room-card__avatar--group' : ''}`}>
        {isFaction ? (
          <i className="fas fa-flag"></i>
        ) : avatarUrl ? (
          <img src={avatarUrl} alt={displayName} />
        ) : room.type === 'dm' ? (
          <div className="chat-room-card__avatar--placeholder">
            {(otherMember?.nickname ?? '?').charAt(0).toUpperCase()}
          </div>
        ) : (
          <i className="fas fa-users"></i>
        )}
      </div>
      <div className="chat-room-card__info">
        <div className="chat-room-card__top">
          <span className="chat-room-card__name">{displayName}</span>
          {timeStr && <span className="chat-room-card__time">{timeStr}</span>}
        </div>
        {room.lastMessagePreview && (
          <span className="chat-room-card__preview">{room.lastMessagePreview}</span>
        )}
      </div>
      {room.unreadCount > 0 && (
        <span className="chat-room-card__unread">{room.unreadCount}</span>
      )}
    </button>
  );
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default ChatRoomCard;
