import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import chatService from '@services/chatService';
import chatSocketService from '@services/chatSocketService';
import type { ChatRoom, ChatMessage, ChatRoomMemberInfo, TypingUser } from '../types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

interface ChatWindowProps {
  room: ChatRoom;
  trainerId: number;
  isAdminMode?: boolean;
  onRoomUpdated?: (room: ChatRoom) => void;
}

const ChatWindow = ({ room, trainerId, isAdminMode, onRoomUpdated }: ChatWindowProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typers, setTypers] = useState<TypingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const shouldAutoScroll = useRef(true);

  // Build avatar lookup map from room members
  const memberAvatarMap = useMemo(() => {
    const map = new Map<number, ChatRoomMemberInfo>();
    for (const m of room.members) {
      map.set(m.trainerId, m);
    }
    return map;
  }, [room.members]);

  // Load initial messages
  useEffect(() => {
    setMessages([]);
    setLoading(true);
    setHasMore(true);
    setReplyTo(null);

    chatService.getMessages(room.id, 50).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
      scrollToBottom();
    }).catch((err) => {
      console.error('Failed to load messages:', err);
      setLoading(false);
    });

    // Join room via socket (skip for admin mode)
    if (!isAdminMode) {
      chatSocketService.joinRoom(room.id, trainerId);
    }

    return () => {
      if (!isAdminMode) {
        chatSocketService.leaveRoom(room.id);
      }
    };
  }, [room.id, trainerId, isAdminMode]);

  // Listen for new messages (skip for admin mode)
  useEffect(() => {
    if (isAdminMode) return;

    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.room_id !== room.id) return;
      setMessages((prev) => {
        // Deduplicate in case of reconnect race
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (shouldAutoScroll.current) {
        setTimeout(scrollToBottom, 50);
      }
      // Mark as read
      chatService.markRead(room.id, trainerId).catch(() => {});
    };

    const handleTypingUpdate = (data: { room_id: number; typers: TypingUser[] }) => {
      if (data.room_id !== room.id) return;
      setTypers(data.typers);
    };

    // Refetch recent messages on reconnect to catch anything missed
    const handleReconnect = () => {
      chatService.getMessages(room.id, 50).then((msgs) => {
        setMessages(msgs);
        if (shouldAutoScroll.current) {
          setTimeout(scrollToBottom, 50);
        }
      }).catch(() => {});
    };

    chatSocketService.onMessage(handleNewMessage);
    chatSocketService.onTypingUpdate(handleTypingUpdate);
    chatSocketService.onReconnect(handleReconnect);

    return () => {
      chatSocketService.offMessage(handleNewMessage);
      chatSocketService.offTypingUpdate(handleTypingUpdate);
      chatSocketService.offReconnect(handleReconnect);
    };
  }, [room.id, trainerId, isAdminMode]);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Check if user is near bottom
    const { scrollTop, scrollHeight, clientHeight } = container;
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100;

    // Load older messages when scrolled to top
    if (scrollTop === 0 && hasMore && !loadingOlder && messages.length > 0) {
      setLoadingOlder(true);
      const oldestMessage = messages[0] as ChatMessage;
      const oldestTimestamp = oldestMessage.timestamp;
      const prevScrollHeight = container.scrollHeight;

      chatService.getOlderMessages(room.id, oldestTimestamp, 50).then((older) => {
        if (older.length === 0) {
          setHasMore(false);
        } else {
          setMessages((prev) => [...older, ...prev]);
          // Maintain scroll position
          requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          });
        }
        setLoadingOlder(false);
      }).catch(() => setLoadingOlder(false));
    }
  }, [hasMore, loadingOlder, messages, room.id]);

  const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIcon(true);
    try {
      const updatedRoom = await chatService.updateRoomIcon(room.id, file);
      onRoomUpdated?.(updatedRoom);
    } catch (err) {
      console.error('Failed to update room icon:', err);
    } finally {
      setUploadingIcon(false);
      if (iconInputRef.current) iconInputRef.current.value = '';
    }
  };

  // Derive display name
  const otherMembers = room.members.filter((m) => m.trainerId !== trainerId);
  const roomName =
    (room.name ?? otherMembers.map((m) => m.nickname).join(', ')) || 'Chat';

  // Header avatar
  const isFaction = room.type === 'faction';
  const headerAvatarUrl = room.type === 'dm'
    ? otherMembers[0]?.avatarUrl
    : room.iconUrl;

  const memberCount = room.members.length;
  const isGroupOwner = room.type === 'group' &&
    room.members.some((m) => m.trainerId === trainerId && m.role === 'owner');

  return (
    <div className="chat-window">
      <div className="chat-window__header">
        <div
          className={`chat-window__header-avatar ${isFaction ? 'chat-window__header-avatar--faction' : room.type === 'group' && !headerAvatarUrl ? 'chat-window__header-avatar--group' : ''}`}
          onClick={isGroupOwner && !isAdminMode ? () => iconInputRef.current?.click() : undefined}
          title={isGroupOwner && !isAdminMode ? 'Change group icon' : undefined}
          style={isGroupOwner && !isAdminMode ? { cursor: 'pointer' } : undefined}
        >
          {uploadingIcon ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : isFaction ? (
            <i className="fas fa-flag"></i>
          ) : headerAvatarUrl ? (
            <img src={headerAvatarUrl} alt={roomName} />
          ) : room.type === 'dm' ? (
            <div className="chat-window__header-avatar--placeholder">
              {(otherMembers[0]?.nickname ?? '?').charAt(0).toUpperCase()}
            </div>
          ) : (
            <i className="fas fa-users"></i>
          )}
          {isGroupOwner && !isAdminMode && !isFaction && (
            <div className="chat-window__header-avatar-edit">
              <i className="fas fa-camera"></i>
            </div>
          )}
        </div>
        <input
          ref={iconInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleIconChange}
        />
        <div className="chat-window__header-info">
          <h3 className="chat-window__room-name">{roomName}</h3>
          <span className="chat-window__member-count">
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </span>
        </div>
        {isAdminMode && (
          <div className="chat-window__admin-banner">
            <i className="fas fa-shield-alt"></i>
            <span>Read-only admin view</span>
          </div>
        )}
      </div>

      <div
        className="chat-window__messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {loadingOlder && (
          <div className="chat-window__loading-older">Loading older messages...</div>
        )}
        {!hasMore && messages.length > 0 && (
          <div className="chat-window__beginning">Beginning of conversation</div>
        )}
        {loading ? (
          <div className="chat-window__loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="chat-window__empty">
            No messages yet.{!isAdminMode && ' Say something!'}
          </div>
        ) : (
          messages.map((msg, idx) => {
            const prev = messages[idx - 1];
            const showHeader =
              !prev ||
              prev.sender_trainer_id !== msg.sender_trainer_id ||
              new Date(msg.timestamp).getTime() - new Date(prev.timestamp).getTime() > 300000;

            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isSelf={!isAdminMode && msg.sender_trainer_id === trainerId}
                showHeader={showHeader}
                memberAvatarMap={memberAvatarMap}
                onReply={isAdminMode ? undefined : setReplyTo}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isAdminMode && (
        <>
          <TypingIndicator typers={typers} currentTrainerId={trainerId} />
          <MessageInput
            roomId={room.id}
            trainerId={trainerId}
            replyTo={replyTo}
            onClearReply={() => setReplyTo(null)}
          />
        </>
      )}
    </div>
  );
};

export default ChatWindow;
