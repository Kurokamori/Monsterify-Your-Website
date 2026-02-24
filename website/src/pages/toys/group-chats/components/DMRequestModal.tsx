import { useState, useEffect, useCallback } from 'react';
import chatService from '@services/chatService';
import { TrainerAutocomplete } from '@components/common/TrainerAutocomplete';
import type { DmRequest } from '../types';

interface DMRequestModalProps {
  trainerId: number;
  onClose: () => void;
  onAccepted: () => void;
}

const DMRequestModal = ({ trainerId, onClose, onAccepted }: DMRequestModalProps) => {
  const [requests, setRequests] = useState<DmRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTargetId, setSelectedTargetId] = useState<string | number | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<'received' | 'sent' | 'new'>('received');

  const loadRequests = useCallback(async () => {
    try {
      const data = await chatService.getDmRequests(trainerId);
      setRequests(data);
    } catch (err) {
      console.error('Failed to load DM requests:', err);
    } finally {
      setLoading(false);
    }
  }, [trainerId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const received = requests.filter((r) => r.toTrainerId === trainerId && r.status === 'pending');
  const sent = requests.filter((r) => r.fromTrainerId === trainerId);

  const handleRespond = async (requestId: number, action: 'accept' | 'decline') => {
    try {
      await chatService.respondDmRequest(requestId, trainerId, action);
      if (action === 'accept') onAccepted();
      await loadRequests();
    } catch (err) {
      console.error('Failed to respond to DM request:', err);
    }
  };

  const handleSend = async () => {
    if (!selectedTargetId) return;
    const tid = Number(selectedTargetId);
    if (!tid) return;

    setSending(true);
    try {
      await chatService.sendDmRequest({
        fromTrainerId: trainerId,
        toTrainerId: tid,
        message: message.trim() || undefined,
      });
      setSelectedTargetId(null);
      setMessage('');
      await loadRequests();
      setTab('sent');
    } catch (err) {
      console.error('Failed to send DM request:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal__header">
          <h3>DM Requests</h3>
          <button className="chat-modal__close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="chat-modal__tabs">
          <button
            className={`chat-modal__tab ${tab === 'received' ? 'chat-modal__tab--active' : ''}`}
            onClick={() => setTab('received')}
          >
            Received {received.length > 0 && `(${received.length})`}
          </button>
          <button
            className={`chat-modal__tab ${tab === 'sent' ? 'chat-modal__tab--active' : ''}`}
            onClick={() => setTab('sent')}
          >
            Sent
          </button>
          <button
            className={`chat-modal__tab ${tab === 'new' ? 'chat-modal__tab--active' : ''}`}
            onClick={() => setTab('new')}
          >
            New Request
          </button>
        </div>

        <div className="chat-modal__body">
          {loading ? (
            <div className="chat-modal__loading">Loading...</div>
          ) : tab === 'received' ? (
            received.length === 0 ? (
              <div className="chat-modal__empty">No pending requests</div>
            ) : (
              <div className="dm-request-list">
                {received.map((req) => (
                  <div key={req.id} className="dm-request-item">
                    <div className="dm-request-item__info">
                      <strong>{req.fromNickname}</strong>
                      {req.message && <p className="dm-request-item__message">{req.message}</p>}
                    </div>
                    <div className="dm-request-item__actions">
                      <button
                        className="chat-modal__btn chat-modal__btn--primary"
                        onClick={() => handleRespond(req.id, 'accept')}
                      >
                        Accept
                      </button>
                      <button
                        className="chat-modal__btn chat-modal__btn--secondary"
                        onClick={() => handleRespond(req.id, 'decline')}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : tab === 'sent' ? (
            sent.length === 0 ? (
              <div className="chat-modal__empty">No sent requests</div>
            ) : (
              <div className="dm-request-list">
                {sent.map((req) => (
                  <div key={req.id} className="dm-request-item">
                    <div className="dm-request-item__info">
                      <span>To: <strong>{req.toNickname}</strong></span>
                      <span className={`dm-request-item__status dm-request-item__status--${req.status}`}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="dm-request-form">
              <TrainerAutocomplete
                label="Send DM to"
                placeholder="Search for a trainer..."
                selectedTrainerId={selectedTargetId}
                onSelect={setSelectedTargetId}
                noPadding
              />
              <label className="chat-modal__label">
                Message (optional)
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Say hello..."
                  rows={2}
                  className="chat-modal__textarea"
                />
              </label>
              <button
                className="chat-modal__btn chat-modal__btn--primary"
                onClick={handleSend}
                disabled={sending || !selectedTargetId}
              >
                {sending ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DMRequestModal;
