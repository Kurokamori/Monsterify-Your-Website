import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { Pagination } from '@components/common/Pagination';
import { MatureContentFilter, type MatureFilters } from '@components/submissions/MatureContentFilter';
import userProfileService from '@services/userProfileService';
import type { PublicUserProfile, ProfileSubmission, ProfileTrainer } from '@services/userProfileService';
import '../../styles/pages/user-profile.css';

const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submissions state
  const [activeTab, setActiveTab] = useState('gallery');
  const [artSubmissions, setArtSubmissions] = useState<ProfileSubmission[]>([]);
  const [writingSubmissions, setWritingSubmissions] = useState<ProfileSubmission[]>([]);
  const [trainers, setTrainers] = useState<ProfileTrainer[]>([]);
  const [artPage, setArtPage] = useState(1);
  const [writingPage, setWritingPage] = useState(1);
  const [artTotalPages, setArtTotalPages] = useState(1);
  const [writingTotalPages, setWritingTotalPages] = useState(1);
  const [trainersLoading, setTrainersLoading] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Mature content filter state
  const [showMature, setShowMature] = useState(false);
  const [matureFilters, setMatureFilters] = useState<MatureFilters>({
    gore: false,
    nsfw_light: false,
    nsfw_heavy: false,
    triggering: false,
    intense_violence: false,
  });

  const contentSettings = currentUser?.content_settings;

  useEffect(() => {
    if (contentSettings) {
      setMatureFilters({
        gore: contentSettings.gore ?? false,
        nsfw_light: contentSettings.nsfw_light ?? false,
        nsfw_heavy: contentSettings.nsfw_heavy ?? false,
        triggering: contentSettings.triggering ?? false,
        intense_violence: contentSettings.intense_violence ?? false,
      });
    }
  }, [contentSettings]);

  useDocumentTitle(profile ? `${profile.display_name || profile.username}'s Profile` : 'User Profile');

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await userProfileService.getPublicProfile(id);
        if (response.success) {
          setProfile(response.profile);
        } else {
          setError('User not found');
        }
      } catch {
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  // Fetch art submissions
  const fetchArtSubmissions = useCallback(async (page: number) => {
    if (!id) return;
    setSubmissionsLoading(true);
    try {
      const response = await userProfileService.getProfileSubmissions(id, {
        page,
        limit: 20,
        type: 'art',
        showMature,
        matureFilters: showMature ? JSON.stringify(matureFilters) : undefined,
      });
      if (response.success) {
        setArtSubmissions(response.submissions);
        setArtTotalPages(response.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching art submissions:', err);
    } finally {
      setSubmissionsLoading(false);
    }
  }, [id, showMature, matureFilters]);

  // Fetch writing submissions
  const fetchWritingSubmissions = useCallback(async (page: number) => {
    if (!id) return;
    setSubmissionsLoading(true);
    try {
      const response = await userProfileService.getProfileSubmissions(id, {
        page,
        limit: 20,
        type: 'writing',
        showMature,
        matureFilters: showMature ? JSON.stringify(matureFilters) : undefined,
      });
      if (response.success) {
        setWritingSubmissions(response.submissions);
        setWritingTotalPages(response.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching writing submissions:', err);
    } finally {
      setSubmissionsLoading(false);
    }
  }, [id, showMature, matureFilters]);

  // Fetch trainers
  const fetchTrainers = useCallback(async () => {
    if (!id) return;
    setTrainersLoading(true);
    try {
      const response = await userProfileService.getProfileTrainers(id);
      if (response.success) {
        setTrainers(response.trainers);
      }
    } catch (err) {
      console.error('Error fetching trainers:', err);
    } finally {
      setTrainersLoading(false);
    }
  }, [id]);

  // Fetch data when tab changes
  useEffect(() => {
    if (!profile) return;
    if (activeTab === 'gallery') {
      fetchArtSubmissions(artPage);
    } else if (activeTab === 'library') {
      fetchWritingSubmissions(writingPage);
    } else if (activeTab === 'trainers') {
      fetchTrainers();
    }
  }, [activeTab, profile, artPage, writingPage, fetchArtSubmissions, fetchWritingSubmissions, fetchTrainers]);

  const handleMatureFilterChange = (type: keyof MatureFilters, value: boolean) => {
    setMatureFilters(prev => ({ ...prev, [type]: value }));
  };

  const isOwnProfile = currentUser && profile && currentUser.id === profile.id;
  const profileImageUrl = profile?.profile_trainer_image || profile?.profile_image_url || '/images/default_trainer.png';

  if (loading) return <div className="user-profile-page"><LoadingSpinner /></div>;
  if (error || !profile) return <div className="user-profile-page"><div className="alert error">{error || 'User not found'}</div></div>;

  return (
    <div className="user-profile-page">
      {/* Profile Header */}
      <div className="user-profile-header">
        <div className="user-profile-avatar-container">
          <img
            src={profileImageUrl}
            alt={profile.display_name || profile.username}
            className="user-profile-avatar"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/default_trainer.png';
            }}
          />
        </div>
        <div className="user-profile-info">
          <h1 className="user-profile-display-name">{profile.display_name || profile.username}</h1>
          {profile.display_name && profile.display_name !== profile.username && (
            <span className="user-profile-username">@{profile.username}</span>
          )}
          {profile.bio && <p className="user-profile-bio">{profile.bio}</p>}
          <div className="user-profile-stats">
            <div className="user-profile-stat">
              <i className="fas fa-id-card"></i>
              <span>{profile.trainer_count} Trainer{profile.trainer_count !== 1 ? 's' : ''}</span>
            </div>
            <div className="user-profile-stat">
              <i className="fas fa-dragon"></i>
              <span>{profile.monster_count} Monster{profile.monster_count !== 1 ? 's' : ''}</span>
            </div>
            {profile.created_at && (
              <div className="user-profile-stat">
                <i className="fas fa-calendar"></i>
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          {isOwnProfile && (
            <Link to="/profile" className="button secondary user-profile-edit-btn">
              <i className="fas fa-edit"></i> Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="user-profile-tabs">
        <button
          className={`user-profile-tab ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          Gallery
        </button>
        <button
          className={`user-profile-tab ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          Library
        </button>
        <button
          className={`user-profile-tab ${activeTab === 'trainers' ? 'active' : ''}`}
          onClick={() => setActiveTab('trainers')}
        >
          Trainers ({profile.trainer_count})
        </button>
      </div>

      {/* Mature Content Filter for gallery/library tabs */}
      {(activeTab === 'gallery' || activeTab === 'library') && (
        <MatureContentFilter
          showMature={showMature}
          onShowMatureChange={setShowMature}
          activeFilters={matureFilters}
          onFilterChange={handleMatureFilterChange}
          userSettings={contentSettings}
        />
      )}

      {/* Gallery Tab */}
      {activeTab === 'gallery' && (
        <div className="user-profile-submissions">
          {submissionsLoading ? (
            <LoadingSpinner />
          ) : artSubmissions.length === 0 ? (
            <p className="empty-state">No artwork yet.</p>
          ) : (
            <>
              <div className="submission__gallery-grid gallery-size-medium">
                {artSubmissions.map(sub => (
                  <Link
                    key={sub.id}
                    to={`/gallery/${sub.id}`}
                    className="gallery-item card card--clickable"
                  >
                    <div className="card__image">
                      <img
                        src={sub.image_url || '/images/default_art.png'}
                        alt={sub.title}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/images/default_art.png';
                        }}
                      />
                    </div>
                    <div className="card__body">
                      <h3 className="submission__gallery-item-title">{sub.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
              {artTotalPages > 1 && (
                <Pagination
                  currentPage={artPage}
                  totalPages={artTotalPages}
                  onPageChange={setArtPage}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Library Tab */}
      {activeTab === 'library' && (
        <div className="user-profile-submissions">
          {submissionsLoading ? (
            <LoadingSpinner />
          ) : writingSubmissions.length === 0 ? (
            <p className="empty-state">No writing yet.</p>
          ) : (
            <>
              <div className="submission__gallery-grid library-grid">
                {writingSubmissions.map(sub => (
                  <Link
                    key={sub.id}
                    to={`/library/${sub.id}`}
                    className={`gallery-item library-item card card--clickable ${sub.is_book ? 'is-book' : ''}`}
                  >
                    {sub.cover_image_url || sub.image_url ? (
                      <>
                        <div className="card__image library-item-cover-container">
                          <img
                            src={sub.cover_image_url || sub.image_url}
                            alt={sub.title}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = '/images/default_book.png';
                            }}
                          />
                          {sub.is_book && (
                            <div className="library-item-book-badge">
                              <i className="fas fa-book"></i> {sub.chapter_count || 0} Chapters
                            </div>
                          )}
                        </div>
                        <div className="card__body">
                          <h3 className="submission__gallery-item-title">{sub.title}</h3>
                          {sub.description && (
                            <p className="library-item-description">
                              {sub.description}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="library-item-text-cover">
                        <div className="library-item-text-cover-icon">
                          <i className={`fas ${sub.is_book ? 'fa-book' : 'fa-feather-alt'}`}></i>
                        </div>
                        <h4 className="submission__gallery-item-title">{sub.title}</h4>
                        {sub.description && (
                          <p className="library-item-text-cover-description">
                            {sub.description}
                          </p>
                        )}
                        {sub.is_book && (
                          <div className="library-item-book-badge">
                            <i className="fas fa-book"></i> {sub.chapter_count || 0} Chapters
                          </div>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
              {writingTotalPages > 1 && (
                <Pagination
                  currentPage={writingPage}
                  totalPages={writingTotalPages}
                  onPageChange={setWritingPage}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Trainers Tab */}
      {activeTab === 'trainers' && (
        <div className="user-profile-trainers">
          {trainersLoading ? (
            <LoadingSpinner />
          ) : trainers.length === 0 ? (
            <p className="empty-state">No trainers yet.</p>
          ) : (
            <div className="user-profile-trainer-grid">
              {trainers.map(trainer => (
                <Link key={trainer.id} to={`/trainers/${trainer.id}`} className="user-profile-trainer-card">
                  <div className="user-profile-trainer-image">
                    <img
                      src={trainer.main_ref || '/images/default_trainer.png'}
                      alt={trainer.name}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/default_trainer.png'; }}
                    />
                  </div>
                  <div className="user-profile-trainer-info">
                    <div className="user-profile-trainer-name">{trainer.name}</div>
                    {trainer.nickname && <div className="user-profile-trainer-nickname">({trainer.nickname})</div>}
                    <div className="user-profile-trainer-meta">
                      <span className="badge info">Lv. {trainer.level}</span>
                      {trainer.faction && <span className="badge tertiary">{trainer.faction}</span>}
                    </div>
                    <div>
                      {[trainer.type1, trainer.type2, trainer.type3, trainer.type4, trainer.type5, trainer.type6]
                        .filter(Boolean)
                        .slice(0, 4)
                        .map((t, i) => (
                          <span key={i} className={`badge type-${t!.toLowerCase()}`}>{t}</span>
                        ))}
                    </div>
                    <div className="user-profile-trainer-monsters">
                      <i className="fas fa-dragon"></i> {trainer.monster_count}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
