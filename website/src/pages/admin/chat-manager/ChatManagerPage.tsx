import { useState, useEffect, useCallback } from 'react'
import { useDocumentTitle } from '@hooks/useDocumentTitle'
import { AdminRoute } from '@components/common/AdminRoute'
import { ConfirmModal } from '@components/common/ConfirmModal'
import { Modal } from '@components/common/Modal'
import { TrainerAutocomplete } from '@components/common/TrainerAutocomplete'
import chatService from '@services/chatService'
import type {
  ChatRoom,
  ChatRoomMemberInfo,
  ChatMessage,
} from '../../toys/group-chats/types'
import '@styles/admin/chat-manager.css'

// ============================================================================
// Helpers
// ============================================================================

function getAxiosError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as { response?: { data?: { error?: string; message?: string } } }).response
    if (resp?.data?.error) { return resp.data.error }
    if (resp?.data?.message) { return resp.data.message }
  }
  if (error instanceof Error) { return error.message }
  return fallback
}

function typeBadgeClass(type: string): string {
  switch (type) {
    case 'faction': return 'chat-manager__type-badge--faction'
    case 'group': return 'chat-manager__type-badge--group'
    case 'dm': return 'chat-manager__type-badge--dm'
    default: return ''
  }
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============================================================================
// Main Component
// ============================================================================

function ChatManagerContent() {
  useDocumentTitle('Chat Manager')

  // Room list state
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Selected room
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [members, setMembers] = useState<ChatRoomMemberInfo[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [detailTab, setDetailTab] = useState<'members' | 'messages'>('members')
  const [detailLoading, setDetailLoading] = useState(false)

  // Status
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Add member
  const [addTrainerId, setAddTrainerId] = useState<string | number | null>(null)
  const [addingMember, setAddingMember] = useState(false)

  // Admin message
  const [adminSenderName, setAdminSenderName] = useState('')
  const [adminMessageContent, setAdminMessageContent] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  // Delete room
  const [deleteTarget, setDeleteTarget] = useState<ChatRoom | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Create room modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createType, setCreateType] = useState<'group' | 'dm'>('group')
  const [createMembers, setCreateMembers] = useState<{ id: number; name: string }[]>([])
  const [createMemberPick, setCreateMemberPick] = useState<string | number | null>(null)
  const [creating, setCreating] = useState(false)

  // ---- Data loading ----

  const loadRooms = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await chatService.adminGetAllRooms()
      setRooms(data)
    } catch (err) {
      setError(getAxiosError(err, 'Failed to load rooms'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  const loadRoomDetail = useCallback(async (room: ChatRoom) => {
    setSelectedRoom(room)
    setDetailLoading(true)
    try {
      const [memberData, messageData] = await Promise.all([
        chatService.adminGetRoomMembers(room.id),
        chatService.adminGetMessages(room.id, 100),
      ])
      setMembers(memberData)
      setMessages(messageData)
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to load room details') })
    } finally {
      setDetailLoading(false)
    }
  }, [])

  // ---- Filtered rooms ----

  const filteredRooms = rooms.filter((r) => {
    if (typeFilter !== 'all' && r.type !== typeFilter) { return false }
    if (search) {
      const q = search.toLowerCase()
      const name = (r.name ?? '').toLowerCase()
      const faction = (r.factionName ?? '').toLowerCase()
      if (!name.includes(q) && !faction.includes(q)) { return false }
    }
    return true
  })

  // ---- Actions ----

  const handleAddMember = async () => {
    if (!selectedRoom || addTrainerId == null) { return }
    const tid = Number(addTrainerId)
    if (isNaN(tid) || tid <= 0) {
      setStatusMsg({ type: 'error', text: 'Please select a valid trainer' })
      return
    }
    setAddingMember(true)
    try {
      await chatService.adminAddMember(selectedRoom.id, tid)
      setStatusMsg({ type: 'success', text: `Trainer added to room` })
      setAddTrainerId(null)
      await loadRoomDetail(selectedRoom)
      await loadRooms()
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to add member') })
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (trainerId: number) => {
    if (!selectedRoom) { return }
    try {
      await chatService.adminRemoveMember(selectedRoom.id, trainerId)
      setStatusMsg({ type: 'success', text: `Trainer ${trainerId} removed` })
      await loadRoomDetail(selectedRoom)
      await loadRooms()
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to remove member') })
    }
  }

  const handleSendAdminMessage = async () => {
    if (!selectedRoom || !adminMessageContent.trim()) { return }
    setSendingMessage(true)
    try {
      await chatService.adminSendMessage(
        selectedRoom.id,
        adminMessageContent.trim(),
        adminSenderName.trim() || undefined,
      )
      setStatusMsg({ type: 'success', text: 'Admin message sent' })
      setAdminMessageContent('')
      // Reload messages
      const messageData = await chatService.adminGetMessages(selectedRoom.id, 100)
      setMessages(messageData)
      await loadRooms()
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to send message') })
    } finally {
      setSendingMessage(false)
    }
  }

  const handleDeleteRoom = async () => {
    if (!deleteTarget) { return }
    setDeleting(true)
    try {
      await chatService.adminDeleteRoom(deleteTarget.id)
      setStatusMsg({ type: 'success', text: `Room "${deleteTarget.name ?? 'DM'}" deleted` })
      if (selectedRoom?.id === deleteTarget.id) {
        setSelectedRoom(null)
        setMembers([])
        setMessages([])
      }
      setDeleteTarget(null)
      await loadRooms()
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to delete room') })
    } finally {
      setDeleting(false)
    }
  }

  const handleAddCreateMember = useCallback((trainer: { id: string | number; name: string } | null) => {
    if (!trainer) { return }
    setCreateMemberPick(null)
    const numId = Number(trainer.id)
    if (createMembers.some((m) => m.id === numId)) { return }
    setCreateMembers((prev) => [...prev, { id: numId, name: trainer.name }])
  }, [createMembers])

  const handleRemoveCreateMember = useCallback((id: number) => {
    setCreateMembers((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const handleCreateRoom = async () => {
    if (!createName.trim()) { return }
    setCreating(true)
    try {
      const memberIds = createMembers.map((m) => m.id)
      await chatService.adminCreateRoom({ name: createName.trim(), type: createType, memberIds })
      setStatusMsg({ type: 'success', text: `Room "${createName.trim()}" created` })
      setShowCreateModal(false)
      setCreateName('')
      setCreateMembers([])
      setCreateMemberPick(null)
      await loadRooms()
    } catch (err) {
      setStatusMsg({ type: 'error', text: getAxiosError(err, 'Failed to create room') })
    } finally {
      setCreating(false)
    }
  }

  // ---- Render ----

  return (
    <div className="chat-manager">
      <div className="chat-manager__header">
        <h1 className="chat-manager__title">Chat Manager</h1>
        <button className="chat-manager__create-btn" onClick={() => setShowCreateModal(true)}>
          <i className="fas fa-plus" /> Create Room
        </button>
      </div>

      {/* Status bar */}
      {statusMsg && (
        <div className={`chat-manager__status chat-manager__status--${statusMsg.type}`}>
          <span>{statusMsg.text}</span>
          <button className="chat-manager__status-dismiss" onClick={() => setStatusMsg(null)}>
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      <div className="chat-manager__layout">
        {/* ---- Left Panel: Room List ---- */}
        <div className="chat-manager__room-list">
          <div className="chat-manager__filters">
            <input
              className="chat-manager__search"
              type="text"
              placeholder="Search rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="chat-manager__type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="faction">Faction</option>
              <option value="group">Group</option>
              <option value="dm">DM</option>
            </select>
          </div>

          {loading && <div className="chat-manager__loading">Loading rooms...</div>}
          {error && <div className="chat-manager__error">{error}</div>}

          <div className="chat-manager__rooms">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className={`chat-manager__room-card ${selectedRoom?.id === room.id ? 'chat-manager__room-card--selected' : ''}`}
                onClick={() => loadRoomDetail(room)}
              >
                <div className="chat-manager__room-card-header">
                  <span className="chat-manager__room-name">
                    {room.type === 'faction' && <i className="fas fa-flag chat-manager__room-icon" />}
                    {room.type === 'group' && <i className="fas fa-users chat-manager__room-icon" />}
                    {room.type === 'dm' && <i className="fas fa-user chat-manager__room-icon" />}
                    {room.name ?? `DM #${room.id}`}
                  </span>
                  <span className={`chat-manager__type-badge ${typeBadgeClass(room.type)}`}>
                    {room.type}
                  </span>
                </div>
                <div className="chat-manager__room-card-meta">
                  <span className="chat-manager__member-count">
                    <i className="fas fa-users" /> {room.members?.length ?? 0}
                  </span>
                  {room.lastMessagePreview && (
                    <span className="chat-manager__last-msg">
                      {room.lastMessagePreview.slice(0, 60)}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {!loading && filteredRooms.length === 0 && (
              <div className="chat-manager__empty">No rooms found</div>
            )}
          </div>
        </div>

        {/* ---- Right Panel: Room Detail ---- */}
        <div className="chat-manager__detail">
          {!selectedRoom && (
            <div className="chat-manager__detail-empty">
              <i className="fas fa-comments" />
              <p>Select a room to view details</p>
            </div>
          )}

          {selectedRoom && (
            <>
              <div className="chat-manager__detail-header">
                <div className="chat-manager__detail-title">
                  <h2>{selectedRoom.name ?? `DM #${selectedRoom.id}`}</h2>
                  <span className={`chat-manager__type-badge ${typeBadgeClass(selectedRoom.type)}`}>
                    {selectedRoom.type}
                  </span>
                  {selectedRoom.factionName && (
                    <span className="chat-manager__faction-label">{selectedRoom.factionName}</span>
                  )}
                </div>
                <button
                  className="chat-manager__delete-btn"
                  onClick={() => setDeleteTarget(selectedRoom)}
                  title="Delete room"
                >
                  <i className="fas fa-trash" />
                </button>
              </div>

              {/* Tabs */}
              <div className="chat-manager__tabs">
                <button
                  className={`chat-manager__tab ${detailTab === 'members' ? 'chat-manager__tab--active' : ''}`}
                  onClick={() => setDetailTab('members')}
                >
                  <i className="fas fa-users" /> Members ({members.length})
                </button>
                <button
                  className={`chat-manager__tab ${detailTab === 'messages' ? 'chat-manager__tab--active' : ''}`}
                  onClick={() => setDetailTab('messages')}
                >
                  <i className="fas fa-comment-alt" /> Messages
                </button>
              </div>

              {detailLoading && <div className="chat-manager__loading">Loading...</div>}

              {/* Members Tab */}
              {!detailLoading && detailTab === 'members' && (
                <div className="chat-manager__members">
                  <div className="chat-manager__add-member">
                    <TrainerAutocomplete
                      value={addTrainerId}
                      onSelect={setAddTrainerId}
                      label=""
                      placeholder="Search trainer to add..."
                      noPadding
                    />
                    <button
                      className="chat-manager__add-member-btn"
                      onClick={handleAddMember}
                      disabled={addingMember || addTrainerId == null}
                    >
                      {addingMember ? 'Adding...' : 'Add Member'}
                    </button>
                  </div>

                  <div className="chat-manager__member-list">
                    {members.map((m) => (
                      <div key={m.trainerId} className="chat-manager__member-row">
                        <div className="chat-manager__member-avatar">
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} alt="" />
                          ) : (
                            <i className="fas fa-user" />
                          )}
                        </div>
                        <div className="chat-manager__member-info">
                          <span className="chat-manager__member-name">{m.nickname}</span>
                          <span className="chat-manager__member-id">ID: {m.trainerId}</span>
                        </div>
                        <span className={`chat-manager__role-badge chat-manager__role-badge--${m.role}`}>
                          {m.role}
                        </span>
                        <button
                          className="chat-manager__member-remove"
                          onClick={() => handleRemoveMember(m.trainerId)}
                          title="Remove member"
                        >
                          <i className="fas fa-times" />
                        </button>
                      </div>
                    ))}
                    {members.length === 0 && (
                      <div className="chat-manager__empty">No members</div>
                    )}
                  </div>
                </div>
              )}

              {/* Messages Tab */}
              {!detailLoading && detailTab === 'messages' && (
                <div className="chat-manager__messages">
                  <div className="chat-manager__message-list">
                    {messages.map((msg) => (
                      <div key={msg.id} className="chat-manager__message-row">
                        <div className="chat-manager__message-header">
                          <span className="chat-manager__message-sender">{msg.sender_nickname}</span>
                          <span className="chat-manager__message-time">{formatTimestamp(msg.timestamp)}</span>
                        </div>
                        {msg.content && (
                          <div className="chat-manager__message-content">{msg.content}</div>
                        )}
                        {msg.image_url && (
                          <div className="chat-manager__message-image">
                            <img src={msg.image_url} alt="chat attachment" />
                          </div>
                        )}
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div className="chat-manager__empty">No messages</div>
                    )}
                  </div>

                  <div className="chat-manager__admin-send">
                    <div className="chat-manager__admin-send-header">Send as Admin</div>
                    <div className="chat-manager__admin-send-fields">
                      <input
                        className="chat-manager__sender-input"
                        type="text"
                        placeholder="Sender name (default: Unknown)"
                        value={adminSenderName}
                        onChange={(e) => setAdminSenderName(e.target.value)}
                      />
                      <div className="chat-manager__admin-send-row">
                        <input
                          className="chat-manager__message-input"
                          type="text"
                          placeholder="Type a message..."
                          value={adminMessageContent}
                          onChange={(e) => setAdminMessageContent(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { handleSendAdminMessage() } }}
                        />
                        <button
                          className="chat-manager__send-btn"
                          onClick={handleSendAdminMessage}
                          disabled={sendingMessage || !adminMessageContent.trim()}
                        >
                          {sendingMessage ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-paper-plane" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Room"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.name ?? `DM #${deleteTarget.id}`}"? This cannot be undone.` : ''}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDeleteRoom}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Create Room Modal */}
      <Modal isOpen={showCreateModal} title="Create Chat Room" onClose={() => setShowCreateModal(false)}>
          <div className="chat-manager__create-form">
            <div className="chat-manager__form-group">
              <label className="chat-manager__form-label">Room Name</label>
              <input
                className="chat-manager__form-input"
                type="text"
                placeholder="Enter room name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>
            <div className="chat-manager__form-group">
              <label className="chat-manager__form-label">Type</label>
              <select
                className="chat-manager__form-select"
                value={createType}
                onChange={(e) => setCreateType(e.target.value as 'group' | 'dm')}
              >
                <option value="group">Group</option>
                <option value="dm">DM</option>
              </select>
            </div>
            <div className="chat-manager__form-group">
              <label className="chat-manager__form-label">Members</label>
              <TrainerAutocomplete
                value={createMemberPick}
                onSelectTrainer={handleAddCreateMember}
                label=""
                placeholder="Search trainer to add..."
                noPadding
              />
              {createMembers.length > 0 && (
                <div className="chat-manager__create-members">
                  {createMembers.map((m) => (
                    <span key={m.id} className="chat-manager__create-member-chip">
                      {m.name}
                      <button
                        className="chat-manager__create-member-remove"
                        onClick={() => handleRemoveCreateMember(m.id)}
                        type="button"
                      >
                        <i className="fas fa-times" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="chat-manager__form-actions">
              <button
                className="chat-manager__form-cancel"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="chat-manager__form-submit"
                onClick={handleCreateRoom}
                disabled={creating || !createName.trim()}
              >
                {creating ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </div>
      </Modal>
    </div>
  )
}

// ============================================================================
// Export with AdminRoute wrapper
// ============================================================================

export default function ChatManagerPage() {
  return (
    <AdminRoute>
      <ChatManagerContent />
    </AdminRoute>
  )
}
