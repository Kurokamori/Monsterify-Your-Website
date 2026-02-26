import { useState, useEffect, useCallback } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useAuth } from '@contexts/AuthContext';
import chatService from '@services/chatService';
import chatSocketService from '@services/chatSocketService';
import type { ChatProfile, ChatRoom, TrainerOption } from './types';
import TrainerSelector from './components/TrainerSelector';
import ChatSidebar from './components/ChatSidebar';
import ChatWindow from './components/ChatWindow';
import ChatProfileModal from './components/ChatProfileModal';
import DMRequestModal from './components/DMRequestModal';
import NewChatModal from './components/NewChatModal';

const GroupChatsPage = () => {
  useDocumentTitle('Group Chats');
  const { currentUser } = useAuth();

  // State
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerOption | null>(null);
  const [profile, setProfile] = useState<ChatProfile | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDmModal, setShowDmModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
  const [pendingDmCount, setPendingDmCount] = useState(0);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null;
  const isAdminMode = selectedTrainer?.isAdmin === true;

  // Connect socket when trainer is selected (skip for admin mode)
  useEffect(() => {
    if (!selectedTrainer || isAdminMode) return;

    chatSocketService.connect();
    chatSocketService.startHeartbeat(selectedTrainer.id);

    return () => {
      chatSocketService.stopHeartbeat();
      // Don't disconnect — MainLayout keeps the socket alive for badge updates
    };
  }, [selectedTrainer, isAdminMode]);

  // Load profile and rooms when trainer is selected
  useEffect(() => {
    if (!selectedTrainer) return;

    const loadData = async () => {
      try {
        if (isAdminMode) {
          // Admin mode: load all rooms, skip profile
          const roomsData = await chatService.adminGetAllRooms();
          setRooms(roomsData);
          setProfile(null);
          setPendingDmCount(0);
        } else {
          const [profileData, roomsData, dmRequests] = await Promise.all([
            chatService.getProfile(selectedTrainer.id),
            chatService.getRooms(selectedTrainer.id),
            chatService.getDmRequests(selectedTrainer.id),
          ]);
          setProfile(profileData);
          setRooms(roomsData);
          setPendingDmCount(
            dmRequests.filter((r) => r.toTrainerId === selectedTrainer.id && r.status === 'pending').length,
          );
        }
      } catch (err) {
        console.error('Failed to load chat data:', err);
      }
    };

    loadData();
  }, [selectedTrainer, isAdminMode]);

  // Listen for room updates (sidebar refresh) - skip for admin mode
  useEffect(() => {
    if (!selectedTrainer || isAdminMode) return;

    const handleRoomUpdate = (data: {
      room_id: number;
      last_message_at: string;
      last_message_preview: string;
    }) => {
      setRooms((prev) =>
        prev
          .map((r) =>
            r.id === data.room_id
              ? {
                  ...r,
                  lastMessageAt: data.last_message_at,
                  lastMessagePreview: data.last_message_preview,
                  unreadCount: r.id === activeRoomId ? 0 : r.unreadCount + 1,
                }
              : r,
          )
          .sort((a, b) => {
            const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return bTime - aTime;
          }),
      );
    };

    chatSocketService.onRoomUpdate(handleRoomUpdate);
    return () => chatSocketService.offRoomUpdate(handleRoomUpdate);
  }, [selectedTrainer, activeRoomId, isAdminMode]);

  const handleSelectTrainer = useCallback((trainer: TrainerOption) => {
    setSelectedTrainer(trainer);
    setActiveRoomId(null);
  }, []);

  const handleSelectRoom = useCallback((roomId: number) => {
    setActiveRoomId(roomId);
    setMobileSidebarOpen(false);
    // Clear unread
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r)),
    );
    // Notify MainLayout to refresh the badge after markRead completes
    setTimeout(() => window.dispatchEvent(new Event('chat:unread-changed')), 600);
  }, []);

  const refreshRooms = useCallback(async () => {
    if (!selectedTrainer) return;
    try {
      const roomsData = isAdminMode
        ? await chatService.adminGetAllRooms()
        : await chatService.getRooms(selectedTrainer.id);
      setRooms(roomsData);
      // Also refresh pending DM count
      if (!isAdminMode) {
        const dmRequests = await chatService.getDmRequests(selectedTrainer.id);
        setPendingDmCount(
          dmRequests.filter((r) => r.toTrainerId === selectedTrainer.id && r.status === 'pending').length,
        );
      }
    } catch (err) {
      console.error('Failed to refresh rooms:', err);
    }
  }, [selectedTrainer, isAdminMode]);

  if (!currentUser) {
    return (
      <div className="group-chats">
        <div className="group-chats__login-prompt">
          Please log in to use Group Chats.
        </div>
      </div>
    );
  }

  // Trainer selection screen
  if (!selectedTrainer) {
    return (
      <div className="group-chats">
        <TrainerSelector onSelect={handleSelectTrainer} />
      </div>
    );
  }

  // Main chat UI
  return (
    <div className="group-chats">
      <div className={`group-chats__layout ${mobileSidebarOpen ? 'group-chats__layout--sidebar-open' : ''}`}>
        <ChatSidebar
          trainer={selectedTrainer}
          profile={profile}
          rooms={rooms}
          activeRoomId={activeRoomId}
          isAdminMode={isAdminMode}
          pendingDmCount={pendingDmCount}
          onSelectRoom={handleSelectRoom}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenNewChat={() => setShowNewChatModal(true)}
          onOpenDmRequests={() => setShowDmModal(true)}
          onChangeTrainer={() => {
            setSelectedTrainer(null);
            setActiveRoomId(null);
            setRooms([]);
            setProfile(null);
          }}
        />

        <div className="group-chats__main">
          {activeRoom ? (
            <ChatWindow
              room={activeRoom}
              trainerId={selectedTrainer.id}
              isAdminMode={isAdminMode}
              onRoomUpdated={(updated) => {
                setRooms((prev) =>
                  prev.map((r) => (r.id === updated.id ? { ...r, iconUrl: updated.iconUrl } : r)),
                );
              }}
            />
          ) : (
            <div className="group-chats__no-room">
              <div className="group-chats__no-room-content">
                <i className={`fas ${isAdminMode ? 'fa-shield-alt' : 'fa-comments'} group-chats__no-room-icon`}></i>
                <h3>{isAdminMode ? 'Select a chat to view' : 'Select a chat to start messaging'}</h3>
                <p>{isAdminMode ? 'Viewing all rooms as admin' : 'Or create a new group chat to get started'}</p>
              </div>
            </div>
          )}

          {/* Mobile back button */}
          {!mobileSidebarOpen && (
            <button
              className="group-chats__mobile-back"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <i className="fas fa-arrow-left"></i>
            </button>
          )}
        </div>
      </div>

      {/* Modals - not shown in admin mode */}
      {!isAdminMode && showProfileModal && (
        <ChatProfileModal
          trainerId={selectedTrainer.id}
          onClose={() => setShowProfileModal(false)}
          onUpdate={(updated) => setProfile(updated)}
        />
      )}
      {!isAdminMode && showDmModal && (
        <DMRequestModal
          trainerId={selectedTrainer.id}
          onClose={() => setShowDmModal(false)}
          onAccepted={refreshRooms}
        />
      )}
      {!isAdminMode && showNewChatModal && (
        <NewChatModal
          creatorTrainerId={selectedTrainer.id}
          onClose={() => setShowNewChatModal(false)}
          onCreated={refreshRooms}
        />
      )}
    </div>
  );
};

export default GroupChatsPage;
