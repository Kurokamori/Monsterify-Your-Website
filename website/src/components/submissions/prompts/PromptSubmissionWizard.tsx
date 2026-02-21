import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import trainerService from '../../../services/trainerService';
import monsterService from '../../../services/monsterService';
import { PromptSelectionPage } from './PromptSelectionPage';
import { PromptArtSubmissionPage } from './PromptArtSubmissionPage';
import { PromptWritingSubmissionPage } from './PromptWritingSubmissionPage';
import { PromptRewardsClaiming } from './PromptRewardsClaiming';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ErrorModal } from '../../common/ErrorModal';
import type {
  Trainer,
  Monster,
  Prompt,
  SubmissionResult,
} from './types';

interface PromptSubmissionWizardProps {
  category?: string;
  onComplete?: (result: SubmissionResult) => void;
}

export function PromptSubmissionWizard({
  category = 'general',
  onComplete
}: PromptSubmissionWizardProps) {
  const { currentUser } = useAuth();

  // Page state (1 = selection, 2 = submission, 3 = rewards)
  const [currentPage, setCurrentPage] = useState(1);

  // Shared wizard state
  const [trainerId, setTrainerId] = useState<string | number | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [promptId, setPromptId] = useState<string | number | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [submissionType, setSubmissionType] = useState<'art' | 'writing' | null>(null);

  // Submission result state (after page 2 submission)
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  // User data state
  const [userTrainers, setUserTrainers] = useState<Trainer[]>([]);
  const [userMonsters, setUserMonsters] = useState<Monster[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch user's trainers and monsters on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userId = currentUser?.discord_id || currentUser?.id;

        // Fetch trainers
        const trainersResponse = await trainerService.getUserTrainers(userId);
        const trainersData = trainersResponse.trainers || [];
        setUserTrainers(trainersData);

        // Set default trainer if only one
        if (trainersData.length === 1) {
          setTrainerId(trainersData[0].id);
          setSelectedTrainer(trainersData[0]);
        }

        // Fetch monsters for all trainers
        if (trainersData.length > 0) {
          const allMonsters: Monster[] = [];

          for (const trainer of trainersData) {
            try {
              const monstersResponse = await monsterService.getTrainerMonsters(trainer.id);
              if (monstersResponse.monsters) {
                allMonsters.push(...monstersResponse.monsters);
              }
            } catch (monsterErr) {
              console.error(`Error fetching monsters for trainer ${trainer.id}:`, monsterErr);
            }
          }

          setUserMonsters(allMonsters);
        }

        setLoading(false);
      } catch (err) {
        setError(extractErrorMessage(err, 'Failed to load user data. Please try again.'));
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Handle page 1 completion (selection done)
  const handleSelectionComplete = (result: {
    trainerId: string | number;
    trainer: Trainer;
    promptId: string | number;
    prompt: Prompt;
    submissionType: 'art' | 'writing';
  }) => {
    setTrainerId(result.trainerId);
    setSelectedTrainer(result.trainer);
    setPromptId(result.promptId);
    setSelectedPrompt(result.prompt);
    setSubmissionType(result.submissionType);
    setCurrentPage(2);
    window.scrollTo(0, 0);
  };

  // Handle page 2 completion (submission done)
  const handleSubmissionComplete = (result: SubmissionResult) => {
    setSubmissionResult(result);
    setCurrentPage(3);
    window.scrollTo(0, 0);
  };

  // Handle going back from page 2 to page 1
  const handleBackToSelection = () => {
    setCurrentPage(1);
    window.scrollTo(0, 0);
  };

  // Handle rewards claiming completion
  const handleRewardsComplete = () => {
    if (onComplete && submissionResult) {
      onComplete(submissionResult);
    }
  };

  // Handle starting a new submission
  const handleSubmitAnother = () => {
    setPromptId(null);
    setSelectedPrompt(null);
    setSubmissionType(null);
    setSubmissionResult(null);
    setCurrentPage(1);
    window.scrollTo(0, 0);
  };

  // Get step titles for progress indicator
  const getStepTitles = () => [
    'Select Prompt',
    submissionType === 'art' ? 'Art Submission' : submissionType === 'writing' ? 'Writing Submission' : 'Submission',
    'Claim Rewards'
  ];

  if (loading) {
    return (
      <div className="prompt-wizard">
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prompt-wizard">
        <ErrorModal
          isOpen={!!error}
          onClose={() => setError('')}
          message={error}
          title="Error Loading Data"
        />
      </div>
    );
  }

  return (
    <div className="prompt-wizard">
      {/* Progress Indicator */}
      <div className="prompt-wizard-progress">
        {getStepTitles().map((title, index) => (
          <div
            key={index}
            className={`prompt-wizard-step ${
              currentPage === index + 1 ? 'active' :
              currentPage > index + 1 ? 'completed' : ''
            }`}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-title">{title}</div>
          </div>
        ))}
      </div>

      {/* Page Content */}
      <div className="prompt-wizard-content">
        {currentPage === 1 && (
          <PromptSelectionPage
            category={category}
            userTrainers={userTrainers}
            initialTrainerId={trainerId}
            initialPromptId={promptId}
            initialSubmissionType={submissionType}
            onComplete={handleSelectionComplete}
          />
        )}

        {currentPage === 2 && submissionType === 'art' && trainerId && selectedTrainer && promptId && selectedPrompt && (
          <PromptArtSubmissionPage
            trainerId={trainerId}
            trainer={selectedTrainer}
            promptId={promptId}
            prompt={selectedPrompt}
            userTrainers={userTrainers}
            userMonsters={userMonsters}
            onSubmit={handleSubmissionComplete}
            onBack={handleBackToSelection}
          />
        )}

        {currentPage === 2 && submissionType === 'writing' && trainerId && selectedTrainer && promptId && selectedPrompt && (
          <PromptWritingSubmissionPage
            trainerId={trainerId}
            trainer={selectedTrainer}
            promptId={promptId}
            prompt={selectedPrompt}
            userTrainers={userTrainers}
            userMonsters={userMonsters}
            onSubmit={handleSubmissionComplete}
            onBack={handleBackToSelection}
          />
        )}

        {currentPage === 3 && submissionResult && trainerId && selectedTrainer && selectedPrompt && (
          <PromptRewardsClaiming
            submissionResult={submissionResult}
            trainerId={trainerId}
            trainer={selectedTrainer}
            prompt={selectedPrompt}
            userTrainers={userTrainers}
            userMonsters={userMonsters}
            onComplete={handleRewardsComplete}
            onSubmitAnother={handleSubmitAnother}
          />
        )}
      </div>
    </div>
  );
}
