import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import api from '../../services/api';

interface Submission {
  id: number;
  title: string;
  description: string | null;
  submissionType: 'art' | 'writing';
  imageUrl: string | null;
  url: string;
}

interface Person {
  id: number | string;
  name?: string;
  alias: string;
  role?: string;
  images?: string[];
  blurb?: string;
  meeting_prompt?: string;
  standing_requirement: number;
  standing_reward: number;
}

interface PersonDetailModalProps {
  person: Person;
  trainerId: number | string;
  onClose: () => void;
  onPersonMet: (data: unknown) => void;
}

export const PersonDetailModal = ({
  person,
  trainerId,
  onClose,
  onPersonMet
}: PersonDetailModalProps) => {
  const [availableSubmissions, setAvailableSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailableSubmissions = async () => {
      try {
        const response = await api.get(`/factions/trainers/${trainerId}/submissions/available-for-meeting`);
        setAvailableSubmissions(response.data.data || []);
      } catch (err) {
        console.error('Error fetching available submissions:', err);
        setError('Failed to load available submissions');
      }
    };

    fetchAvailableSubmissions();
  }, [trainerId]);

  const handleMeetPerson = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedSubmission) {
      setError('Please select a submission to meet this person');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post(`/factions/people/${person.id}/meet`, {
        trainerId: trainerId,
        submissionId: selectedSubmission.id
      });

      if (response.data.success) {
        onPersonMet(response.data);
      }
    } catch (err: unknown) {
      console.error('Error meeting person:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to meet person');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const submission = availableSubmissions.find(s => s.id === parseInt(e.target.value));
    setSelectedSubmission(submission || null);
  };

  const personImage = person.images && person.images.length > 0
    ? person.images[0]
    : '/images/placeholder-person.png';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="person-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Meet {person.alias}</h2>
          <button className="button ghost" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="person-detail-modal__preview">
            <div className="person-detail-modal__preview-image">
              <img
                src={personImage}
                alt={person.name || person.alias}
              />
            </div>
            <div className="person-detail-modal__preview-info">
              <h3>{person.name || person.alias}</h3>
              <p className="person-role">{person.role}</p>
              <div className="standing-requirement">
                <i className="fas fa-chart-line"></i>
                <span>Standing Required: {Math.abs(person.standing_requirement)}</span>
              </div>
            </div>
          </div>

          {person.blurb && (
            <div className="submission-preview">
              <h4>About</h4>
              <p>{person.blurb}</p>
            </div>
          )}

          <div className="meeting-prompt">
            <h4>Meeting Prompt</h4>
            <p>{person.meeting_prompt || "Submit artwork that represents your dedication to this faction and showcases your skills."}</p>
          </div>

          <form onSubmit={handleMeetPerson}>
            <div className="form-group">
              <label className="form-label" htmlFor="submission-select">Select Artwork to Submit:</label>
              {availableSubmissions.length === 0 ? (
                <div className="submission-selector__no-submissions">
                  <p>No available submissions found.</p>
                  <p>You need artwork that hasn't been used for faction submissions, tributes, or meetings.</p>
                </div>
              ) : (
                <select
                  id="submission-select"
                  className="select"
                  value={selectedSubmission?.id || ''}
                  onChange={handleSubmissionSelect}
                  required
                >
                  <option value="">Select a submission</option>
                  {availableSubmissions.map(submission => (
                    <option key={submission.id} value={submission.id}>
                      {submission.title} ({submission.submissionType})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedSubmission && (
              <div className="submission-preview">
                <h5>Selected Submission:</h5>
                <h6>{selectedSubmission.title}</h6>
                <p>{selectedSubmission.description}</p>
                <a href={selectedSubmission.url} target="_blank" rel="noopener noreferrer">
                  <i className="fas fa-external-link-alt"></i>
                  View Submission
                </a>
              </div>
            )}

            {error && (
              <div className="alert error">
                <i className="fas fa-exclamation-triangle"></i>
                {error}
              </div>
            )}

            <div className="meeting-reward">
              <div className="meeting-reward__info">
                <i className="fas fa-gift"></i>
                <span>Meeting this person will grant you {person.standing_reward} standing</span>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="button secondary">
                Cancel
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={loading || !selectedSubmission}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Meeting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-handshake"></i>
                    Meet {person.alias}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="modal-info">
          <h4>About Meeting People</h4>
          <ul>
            <li>Submit high-quality artwork to make a good first impression</li>
            <li>Meeting people grants faction standing</li>
            <li>Once met, you can view their full biography and team</li>
            <li>Each submission can only be used once across all faction activities</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
