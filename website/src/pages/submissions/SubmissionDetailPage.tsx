import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@contexts/useAuth';
import { useModalManager } from '@hooks/useModalManager';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import submissionService from '@services/submissionService';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ErrorModal } from '@components/common/ErrorModal';
import { MarkdownRenderer } from '@components/common/MarkdownRenderer';
import { CollaboratorManagement } from '@components/submissions';
import { ExternalLevelAllocator } from '@components/submissions/ExternalLevelAllocator';

interface Trainer {
  id: number;
  name: string;
  main_ref?: string;
  species1?: string;
  species2?: string;
  species3?: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
}

interface Monster {
  id: number;
  name: string;
  species?: string;
  level?: number;
  img_link?: string;
  image_url?: string;
  attribute: string;
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
}

interface Collaborator {
  id: number;
  user_id: string;
  display_name?: string;
  username?: string;
  role: 'editor' | 'viewer';
}

interface BookChapter {
  id: number;
  title: string;
  chapter_number?: number;
  word_count: number;
}

interface Submission {
  id: number;
  title: string;
  description?: string;
  content?: string;
  image_url?: string;
  additional_images?: { url: string }[];
  submission_type: string;
  submission_date: string;
  user_id: string;
  display_name?: string;
  username?: string;
  tags?: string[];
  trainers?: Trainer[];
  monsters?: Monster[];
  is_book?: boolean;
  parent_id?: number;
  is_external?: boolean;
  external_characters?: Array<{ name?: string; appearance?: string; complexity?: string }>;
  external_levels?: number;
  external_coins?: number;
}

interface RelatedSubmission {
  id: number;
  title: string;
  image_url?: string;
  cover_image_url?: string;
  is_book?: boolean;
  chapter_count?: number;
  display_name?: string;
  username?: string;
  description?: string;
  content?: string;
  first_chapter_content?: string;
}

function getContentPreview(rawContent: string, wordLimit = 40): string {
  if (!rawContent) return '';
  const text = rawContent
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(`{3}[\s\S]*?`{3}|`[^`]+`)/g, '')
    .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/^[-*>]+\s?/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/\|/g, '')
    .trim();

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= wordLimit) return text;

  return words.slice(0, wordLimit).join(' ') + '...';
}

interface SubmissionDetailPageProps {
  type?: string;
}

const SubmissionDetailPage = ({ type }: SubmissionDetailPageProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [relatedSubmissions, setRelatedSubmissions] = useState<RelatedSubmission[]>([]);
  const [bookChapters, setBookChapters] = useState<BookChapter[]>([]);
  const [parentBook, setParentBook] = useState<Submission | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [collaboratorModalOpen, setCollaboratorModalOpen] = useState(false);
  const [userCanEdit, setUserCanEdit] = useState(false);

  useDocumentTitle(submission ? submission.title : (type === 'art' ? 'Gallery' : 'Library'));

  const { zIndex } = useModalManager(imageModalOpen, `image-modal-submission-${id}`);

  const submissionType = type || (window.location.pathname.includes('gallery') ? 'art' :
    window.location.pathname.includes('library') ? 'writing' : 'general');

  const fetchCollaborators = useCallback(async (bookId: number): Promise<Collaborator[]> => {
    try {
      const response = await submissionService.getBookCollaborators(bookId);
      if (response.success) {
        const collabs = (response.collaborators || []) as Collaborator[];
        setCollaborators(collabs);
        return collabs;
      }
    } catch (err) {
      console.error('Error fetching collaborators:', err);
    }
    return [];
  }, []);

  const checkUserCanEdit = useCallback((submissionData: Submission, collaboratorsList: Collaborator[], user: { discord_id?: string; id: number }) => {
    const userId = user.discord_id || String(user.id);
    if (submissionData.user_id === userId) return true;
    return collaboratorsList.some(c => c.user_id === userId && c.role === 'editor');
  }, []);

  useEffect(() => {
    const fetchSubmissionData = async () => {
      try {
        setLoading(true);
        setError(null);
        setBookChapters([]);
        setParentBook(null);
        setCollaborators([]);
        setUserCanEdit(false);

        const response = await submissionService.getSubmissionById(id!);

        if (response.success && response.submission) {
          const sub = response.submission as Submission;
          setSubmission(sub);

          if (sub.is_book) {
            try {
              const chaptersResponse = await submissionService.getBookChapters(Number(id));
              if (chaptersResponse.chapters) {
                setBookChapters(chaptersResponse.chapters as BookChapter[]);
              }
            } catch (chaptersErr) {
              console.error('Error fetching book chapters:', chaptersErr);
            }

            const collaboratorsList = await fetchCollaborators(Number(id));

            if (currentUser) {
              const canEdit = checkUserCanEdit(sub, collaboratorsList, currentUser);
              setUserCanEdit(canEdit);
            }
          }

          if (sub.parent_id) {
            try {
              const parentResponse = await submissionService.getSubmissionById(sub.parent_id);
              if (parentResponse.success && parentResponse.submission) {
                setParentBook(parentResponse.submission as Submission);
              }
            } catch (parentErr) {
              console.error('Error fetching parent book:', parentErr);
            }
          }

          if (sub.user_id) {
            const relatedResponse = await submissionService.getRelatedSubmissions(
              sub.id,
              sub.user_id,
              sub.submission_type
            );
            if (relatedResponse.success) {
              setRelatedSubmissions((relatedResponse.submissions || []) as RelatedSubmission[]);
            }
          }
        } else {
          setError((response as { message?: string }).message || 'Failed to load submission details.');
        }
      } catch (err) {
        console.error('Error fetching submission:', err);
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'An error occurred while loading the submission. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchSubmissionData();
  }, [id, currentUser, fetchCollaborators, checkUserCanEdit]);

  const handleBack = () => {
    if (submissionType === 'art') navigate('/submissions?tab=gallery');
    else if (submissionType === 'writing') navigate('/submissions?tab=library');
    else navigate('/submissions');
  };

  const handleImageClick = (image: string) => {
    setSelectedImage(image);
    setImageModalOpen(true);
  };

  const closeImageModal = () => setImageModalOpen(false);

  if (loading) {
    return (
      <div className="submission-detail-page">
        <div className="submission-detail-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="submission-detail-page">
        <div className="submission-detail-container">
          <ErrorModal
            isOpen={true}
            onClose={handleBack}
            message={error}
            title="Failed to Load Submission"
            closeText="Go Back"
          />
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="submission-detail-page">
        <div className="submission-detail-container">
          <div className="alert error">Submission not found</div>
          <button className="button secondary" onClick={handleBack}>Back</button>
        </div>
      </div>
    );
  }

  const isArt = submissionType === 'art' || submission.submission_type === 'art';
  const isWriting = submissionType === 'writing' || submission.submission_type === 'writing';
  const isOwner = currentUser && (submission.user_id === currentUser.discord_id || submission.user_id === String(currentUser.id));

  return (
    <div className="submission-detail-page">
      <div className="submission-detail-container">
        <div className="submission-detail-header">
          <button className="button secondary no-flex" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i> Back to {isArt ? 'Gallery' : isWriting ? 'Library' : 'Submissions'}
          </button>
          <div className="submission-header-content">
            <h1 className="submission-title">{submission.title}</h1>
            <div className="upload-title">
              Created By: { submission.display_name || submission.username || 'Unknown'}
            </div>
          </div>
          <div className="submission-meta">
            <div className="submission-date">
              {new Date(submission.submission_date).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="submission-detail-content">
          {/* Main Image */}
          {isArt && submission.image_url && (
            <div style={{ textAlign: 'center' }}>
              <img
                src={submission.image_url}
                alt={submission.title}
                className="submission-main-image"
                onClick={() => handleImageClick(submission.image_url!)}
              />
            </div>
          )}

          {/* Description */}
          {submission.description && (
            <div className="related-submissions">
              <h2>Description</h2>
              <p>{submission.description}</p>
            </div>
          )}

          {/* Parent Book Navigation */}
          {isWriting && parentBook && (
            <div className="parent-book-nav">
              <Link to={`/library/${parentBook.id}`} className="parent-book-link">
                <i className="fas fa-book"></i>
                Part of: <strong>{parentBook.title}</strong>
              </Link>
            </div>
          )}

          {/* Book Chapters */}
          {isWriting && !!submission.is_book && (
            <div className="book-chapters-section">
              <div className="section-header-with-action">
                <h2><i className="fas fa-list"></i> Chapters</h2>
                <div className="book-actions">
                  {currentUser && userCanEdit && (
                    <Link to={`/submissions/writing?bookId=${submission.id}`} className="button primary">
                      <i className="fas fa-plus"></i> Add Chapter
                    </Link>
                  )}
                  {currentUser && isOwner && (
                    <button className="button secondary" onClick={() => setCollaboratorModalOpen(true)}>
                      <i className="fas fa-users"></i> Collaborators
                    </button>
                  )}
                </div>
              </div>

              {collaborators.length > 0 && (
                <div className="book-collaborators-display">
                  <span className="collaborators-label">Collaborators: </span>
                  {collaborators.map((collab, index) => (
                    <span key={collab.id} className="collaborator-badge">
                      {collab.display_name || collab.username}
                      {collab.role === 'editor' && <i className="fas fa-pen" title="Editor"></i>}
                      {collab.role === 'viewer' && <i className="fas fa-eye" title="Viewer"></i>}
                      {index < collaborators.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}

              {bookChapters.length > 0 ? (
                <div className="container cols-2 gap-md">
                  {bookChapters.map((chapter, index) => (
                    <Link key={chapter.id} to={`/library/${chapter.id}`} className="detail-row">
                      <span className="chapter-num">Chapter {chapter.chapter_number || index + 1}</span>
                      <span className="chapter-title">{chapter.title}</span>
                      {chapter.word_count > 0 && (
                        <span className="chapter-words">{chapter.word_count.toLocaleString()} words</span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="no-chapters-message">No chapters yet. {userCanEdit ? 'Add your first chapter!' : ''}</p>
              )}
            </div>
          )}

          {/* Writing Content */}
          {isWriting && submission.content && (
            <div className="related-submissions">
              {(submission.description || parentBook || (!!submission.is_book && bookChapters.length > 0)) && (
                <h2>Content</h2>
              )}
              <div className="writing-text markdown-writing">
                <MarkdownRenderer content={submission.content} disableCodeBlocks />
              </div>
            </div>
          )}

          {/* Additional Images */}
          {isArt && submission.additional_images && submission.additional_images.length > 0 && (
            <div className="related-submissions">
              <h2>Additional Images</h2>
              <div className="container horizontal center">
                {submission.additional_images.map((image, index) => (
                  <div key={index} className="additional-image-container">
                    <img
                      src={image.url}
                      alt={`${submission.title} - Additional ${index + 1}`}
                      className="additional-image"
                      onClick={() => handleImageClick(image.url)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {submission.tags && submission.tags.length > 0 && (
            <div className="type-tags">
              {submission.tags.map(tag => (
                <span key={tag} className="submission-tag">{tag}</span>
              ))}
            </div>
          )}

          {/* External Submission Badge & Allocator */}
          {submission.is_external && (
            <div className="related-submissions">
              <h2><i className="fas fa-external-link-alt"></i> External Submission</h2>
              <p>This is an external submission with reduced reward rates.</p>

              {submission.external_characters && submission.external_characters.length > 0 && (
                <div className="external-characters-list">
                  <h4>Characters</h4>
                  <div className="selected-entities">
                    {submission.external_characters.map((char: { name?: string; appearance?: string; complexity?: string }, index: number) => (
                      <div key={index} className="selected-entity">
                        <span className="entity-name">{char.name || `Character ${index + 1}`}</span>
                        <span className="entity-details">{char.appearance} / {char.complexity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isOwner && (submission.external_levels ?? 0) > 0 && (
                <ExternalLevelAllocator
                  submissionId={submission.id}
                  totalLevels={submission.external_levels!}
                  totalCoins={submission.external_coins ?? (submission.external_levels! * 50)}
                />
              )}
            </div>
          )}

          {/* Featured Trainers */}
          {submission.trainers && submission.trainers.length > 0 && (
            <div className="related-submissions">
              <h2>Featured Trainers</h2>
              <div className="featured-entities-grid">
                {submission.trainers.map(trainer => (
                  <div
                    key={trainer.id}
                    className="featured-entity-card"
                    onClick={() => navigate(`/trainers/${trainer.id}`)}
                  >
                    <div className="featured-entity-image">
                      <img
                        src={trainer.main_ref || '/images/default_trainer.png'}
                        alt={trainer.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/default_trainer.png';
                        }}
                      />
                    </div>
                    <div className="featured-entity-info">
                      <div className="featured-entity-name">{trainer.name}</div>
                      <div className="featured-entity-species">
                        {[trainer.species1, trainer.species2, trainer.species3].filter(Boolean).join(' / ')}
                      </div>
                      <div className="featured-entity-types">
                        {[trainer.type1, trainer.type2, trainer.type3, trainer.type4, trainer.type5]
                          .filter(Boolean)
                          .map((t, i) => (
                            <span key={i} className={`badge type-${t!.toLowerCase()}`}>{t}</span>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Featured Monsters */}
          {submission.monsters && submission.monsters.length > 0 && (
            <div className="related-submissions">
              <h2>Featured Monsters</h2>
              <div className="featured-entities-grid">
                {submission.monsters.map(monster => (
                  <div
                    key={monster.id}
                    className="featured-entity-card"
                    onClick={() => navigate(`/monsters/${monster.id}`)}
                  >
                    <div className="featured-entity-image">
                      <img
                        src={monster.img_link || monster.image_url || '/images/default_mon.png'}
                        alt={monster.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/default_mon.png';
                        }}
                      />
                    </div>
                    <div className="featured-entity-info">
                      <div className="featured-entity-name">{monster.name}</div>
                      <div className="featured-entity-species">{monster.species}</div>
                      <div className="featured-entity-level">Lv. {monster.level}</div>
                      <div className="featured-entity-types">
                        {[monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
                          .filter(Boolean)
                          .map((t, i) => (
                            <span key={i} className={`badge type-${t!.toLowerCase()}`}>{t}</span>
                          ))}
                      </div>
                      <div className="featured-entity-attribute">
                        <span className={`badge attribute-${monster.attribute.toLowerCase()}`}>
                          {monster.attribute}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Submissions */}
          {relatedSubmissions.length > 0 && (
            <div className="related-submissions">
              <h2>More by this Creator</h2>
              <div className="container horizontal center gap-lg">
                {relatedSubmissions.map(related => (
                  <div
                    key={related.id}
                    className="related-submission-card"
                    onClick={() => navigate(`/${submissionType === 'art' ? 'gallery' : 'library'}/${related.id}`)}
                  >
                    {(related.image_url || related.cover_image_url) ? (
                      <>
                        <div className="image-container">
                          <img
                            src={related.image_url || related.cover_image_url}
                            alt={related.title}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = isArt ? '/images/default_art.png' : '/images/default_book.png';
                            }}
                          />
                          {!!related.is_book && (
                            <span className="library-item-book-badge">
                              <i className="fas fa-book"></i> {related.chapter_count || 0} Chapters
                            </span>
                          )}
                        </div>
                        <div className="featured-entity-name">{related.title}</div>
                      </>
                    ) : (
                      <div className="library-item-text-cover">
                        <div className="library-item-text-cover-icon">
                          <i className={`fas ${related.is_book ? 'fa-book' : 'fa-feather-alt'}`}></i>
                        </div>
                        <h4 className="submission__gallery-item-title">{related.title}</h4>
                        <p className="submission__gallery-item-artist">
                          By: {related.display_name || related.username || submission.display_name || submission.username || 'Unknown'}
                        </p>
                        <p className="library-item-text-cover-description">
                          {related.description || getContentPreview(related.content || related.first_chapter_content || '', 30)}
                        </p>
                        {!!related.is_book && (
                          <span className="library-item-book-badge" style={{ position: 'static', marginTop: '0.5rem' }}>
                            <i className="fas fa-book"></i> {related.chapter_count || 0} Chapters
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && selectedImage && (
        <div className="submission-image-modal-overlay" style={{ zIndex }} onClick={closeImageModal}>
          <div className="submission-image-modal-content" onClick={e => e.stopPropagation()}>
            <button className="submission-image-modal-close" onClick={closeImageModal}>
              <i className="fas fa-times"></i>
            </button>
            <img src={selectedImage} alt="Full size view" />
          </div>
        </div>
      )}

      {/* Collaborator Management Modal */}
      {!!submission.is_book && (
        <CollaboratorManagement
          bookId={submission.id}
          bookTitle={submission.title}
          isOpen={collaboratorModalOpen}
          onClose={() => setCollaboratorModalOpen(false)}
          onCollaboratorsChange={() => fetchCollaborators(Number(id))}
        />
      )}
    </div>
  );
};

export default SubmissionDetailPage;
