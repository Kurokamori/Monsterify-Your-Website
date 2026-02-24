import { useState, useRef, useCallback } from 'react';
import chatService from '@services/chatService';
import chatSocketService from '@services/chatSocketService';
import type { ChatMessage } from '../types';
import ReplyPreview from './ReplyPreview';

interface ImagePreview {
  file: File;
  url: string;
}

interface MessageInputProps {
  roomId: number;
  trainerId: number;
  replyTo: ChatMessage | null;
  onClearReply: () => void;
}

const MessageInput = ({ roomId, trainerId, replyTo, onClearReply }: MessageInputProps) => {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      chatSocketService.startTyping(roomId, trainerId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      chatSocketService.stopTyping(roomId, trainerId);
    }, 3000);
  }, [roomId, trainerId]);

  const stopTyping = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      chatSocketService.stopTyping(roomId, trainerId);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [roomId, trainerId]);

  const clearImagePreview = useCallback(() => {
    setImagePreview((prev) => {
      if (prev) { URL.revokeObjectURL(prev.url); }
      return null;
    });
  }, []);

  const sendImage = useCallback(async (caption: string) => {
    if (!imagePreview) return;

    setUploading(true);
    try {
      const url = await chatService.uploadChatImage(imagePreview.file);
      chatSocketService.sendMessage({
        room_id: roomId,
        trainer_id: trainerId,
        image_url: url,
        content: caption || undefined,
        reply_to_id: replyTo?.id,
      });
      onClearReply();
      setText('');
      clearImagePreview();
      stopTyping();
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setUploading(false);
    }
  }, [imagePreview, roomId, trainerId, replyTo, onClearReply, clearImagePreview, stopTyping]);

  const send = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && !imagePreview) return;

    // If there's an image staged, upload and send it
    if (imagePreview) {
      sendImage(trimmed);
      return;
    }

    chatSocketService.sendMessage({
      room_id: roomId,
      trainer_id: trainerId,
      content: trimmed,
      reply_to_id: replyTo?.id,
    });

    setText('');
    onClearReply();
    stopTyping();
  }, [text, roomId, trainerId, replyTo, onClearReply, imagePreview, sendImage, stopTyping]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview({ file, url: previewUrl });

    // Reset the input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="message-input">
      {replyTo && (
        <ReplyPreview
          senderNickname={replyTo.sender_nickname}
          contentPreview={(replyTo.content ?? '[Image]').slice(0, 100)}
          onClear={onClearReply}
        />
      )}

      {imagePreview && (
        <div className="message-input__image-preview">
          <img src={imagePreview.url} alt="Upload preview" className="message-input__image-preview-img" />
          <div className="message-input__image-preview-info">
            <span className="message-input__image-preview-name">{imagePreview.file.name}</span>
            <span className="message-input__image-preview-size">
              {(imagePreview.file.size / 1024).toFixed(0)} KB
            </span>
          </div>
          <button
            className="message-input__image-preview-remove"
            onClick={clearImagePreview}
            title="Remove image"
            disabled={uploading}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className="message-input__row">
        <button
          className="message-input__attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Attach image"
        >
          <i className={uploading ? 'fas fa-spinner fa-spin' : 'fas fa-image'}></i>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <textarea
          className="message-input__textarea"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder={imagePreview ? 'Add a caption...' : 'Type a message...'}
          rows={1}
        />
        <button
          className="message-input__send-btn"
          onClick={send}
          disabled={(!text.trim() && !imagePreview) || uploading}
          title="Send message"
        >
          <i className={uploading ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'}></i>
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
