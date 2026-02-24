import { useState } from 'react';
import type { ChatProfile, ChatRoom, TrainerOption } from '../types';
import ChatRoomCard from './ChatRoomCard';

interface ChatSidebarProps {
  trainer: TrainerOption;
  profile: ChatProfile | null;
  rooms: ChatRoom[];
  activeRoomId: number | null;
  isAdminMode?: boolean;
  pendingDmCount?: number;
  onSelectRoom: (roomId: number) => void;
  onOpenProfile: () => void;
  onOpenNewChat: () => void;
  onOpenDmRequests: () => void;
  onChangeTrainer: () => void;
}

const ChatSidebar = ({
  trainer,
  profile,
  rooms,
  activeRoomId,
  isAdminMode,
  pendingDmCount = 0,
  onSelectRoom,
  onOpenProfile,
  onOpenNewChat,
  onOpenDmRequests,
  onChangeTrainer,
}: ChatSidebarProps) => {
  const [search, setSearch] = useState('');

  const filteredRooms = search
    ? rooms.filter((r) => {
        const name =
          r.name ?? r.members.map((m) => m.nickname).join(', ');
        return name.toLowerCase().includes(search.toLowerCase());
      })
    : rooms;

  const factionRooms = filteredRooms.filter((r) => r.type === 'faction');
  const otherRooms = filteredRooms.filter((r) => r.type !== 'faction');

  return (
    <div className="chat-sidebar">
      <div className="chat-sidebar__header">
        {isAdminMode ? (
          <div className="chat-sidebar__admin-label">
            <i className="fas fa-shield-alt"></i>
            <span>Admin View</span>
            <span className="chat-sidebar__room-count">{rooms.length} rooms</span>
          </div>
        ) : (
          <div className="chat-sidebar__profile" onClick={onOpenProfile}>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.nickname} className="chat-sidebar__avatar" />
            ) : (
              <div className="chat-sidebar__avatar chat-sidebar__avatar--placeholder">
                {(profile?.nickname ?? trainer.name).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="chat-sidebar__profile-info">
              <span className="chat-sidebar__nickname">{profile?.nickname ?? trainer.name}</span>
              {profile?.status && (
                <span className="chat-sidebar__status">{profile.status}</span>
              )}
            </div>
          </div>
        )}
        <div className="chat-sidebar__actions">
          {!isAdminMode && (
            <>
              <button onClick={onOpenNewChat} title="New chat" className="chat-sidebar__action-btn">
                <i className="fas fa-plus"></i>
              </button>
              <button onClick={onOpenDmRequests} title="DM requests" className="chat-sidebar__action-btn">
                <i className="fas fa-envelope"></i>
                {pendingDmCount > 0 && (
                  <span className="chat-sidebar__badge">{pendingDmCount}</span>
                )}
              </button>
            </>
          )}
          <button onClick={onChangeTrainer} title="Switch trainer" className="chat-sidebar__action-btn">
            <i className="fas fa-exchange-alt"></i>
          </button>
        </div>
      </div>

      <div className="chat-sidebar__search">
        <i className="fas fa-search chat-sidebar__search-icon"></i>
        <input
          type="text"
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="chat-sidebar__search-input"
        />
      </div>

      <div className="chat-sidebar__rooms">
        {filteredRooms.length === 0 ? (
          <div className="chat-sidebar__empty">
            {search ? 'No chats match your search' : 'No chats yet. Start a new one!'}
          </div>
        ) : (
          <>
            {factionRooms.length > 0 && (
              <>
                <div className="chat-sidebar__section-label">
                  <i className="fas fa-flag"></i>
                  <span>Faction Chat</span>
                </div>
                {factionRooms.map((room) => (
                  <ChatRoomCard
                    key={room.id}
                    room={room}
                    isActive={room.id === activeRoomId}
                    currentTrainerId={trainer.id}
                    onClick={() => onSelectRoom(room.id)}
                  />
                ))}
              </>
            )}
            {otherRooms.length > 0 && (
              <>
                {factionRooms.length > 0 && (
                  <div className="chat-sidebar__section-label">
                    <i className="fas fa-comments"></i>
                    <span>Chats</span>
                  </div>
                )}
                {otherRooms.map((room) => (
                  <ChatRoomCard
                    key={room.id}
                    room={room}
                    isActive={room.id === activeRoomId}
                    currentTrainerId={trainer.id}
                    onClick={() => onSelectRoom(room.id)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
