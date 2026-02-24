import type { ChatMessage, ChatRoomMemberInfo } from '../types';
import ReplyPreview from './ReplyPreview';

interface MessageBubbleProps {
  message: ChatMessage;
  isSelf: boolean;
  showHeader: boolean;
  memberAvatarMap?: Map<number, ChatRoomMemberInfo>;
  onReply?: (message: ChatMessage) => void;
}

const MessageBubble = ({ message, isSelf, showHeader, memberAvatarMap, onReply }: MessageBubbleProps) => {
  if (message.deleted) {
    return (
      <div className={`message-bubble message-bubble--deleted ${isSelf ? 'message-bubble--self' : ''}`}>
        <span className="message-bubble__deleted-text">This message was deleted</span>
      </div>
    );
  }

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Use live member avatar (from DB) instead of stale message avatar
  const memberInfo = memberAvatarMap?.get(message.sender_trainer_id);
  const avatarUrl = memberInfo?.avatarUrl ?? message.sender_avatar_url;

  return (
    <div className={`message-bubble ${isSelf ? 'message-bubble--self' : ''}`}>
      {showHeader && !isSelf && (
        <div className="message-bubble__header">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={message.sender_nickname}
              className="message-bubble__avatar"
            />
          ) : (
            <div className="message-bubble__avatar message-bubble__avatar--placeholder">
              {message.sender_nickname.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="message-bubble__nickname">{message.sender_nickname}</span>
        </div>
      )}

      <div className="message-bubble__body">
        {message.reply_to && (
          <ReplyPreview
            senderNickname={message.reply_to.sender_nickname}
            contentPreview={message.reply_to.content_preview}
          />
        )}

        {message.content && (
          <p className="message-bubble__text">{message.content}</p>
        )}

        {message.image_url && (
          <img
            src={message.image_url}
            alt="Shared image"
            className="message-bubble__image"
            loading="lazy"
          />
        )}

        <div className="message-bubble__footer">
          <span className="message-bubble__time">{time}</span>
          {message.edited_at && (
            <span className="message-bubble__edited">(edited)</span>
          )}
          {onReply && (
            <button
              className="message-bubble__reply-btn"
              onClick={() => onReply(message)}
              title="Reply"
            >
              <i className="fas fa-reply"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
