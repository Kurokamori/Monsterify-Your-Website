import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { extractErrorMessage } from '@utils/errorUtils';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ErrorMessage } from '@components/common/ErrorMessage';
import { MonsterEditForm } from '@components/monsters/edit/MonsterEditForm';
import type { SubmitResult } from '@components/monsters/edit/MonsterEditForm';
import monsterService from '@services/monsterService';
import type { Monster } from '@services/monsterService';

const EditMonsterPage = () => {
  const { id } = useParams<{ id: string }>();
  useDocumentTitle('Edit Monster');

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [monster, setMonster] = useState<Monster | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load monster data
  useEffect(() => {
    if (!id) {
      setLoadError('Invalid monster ID');
      setLoading(false);
      return;
    }

    const loadMonster = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const response = await monsterService.getMonsterById(id);
        if (!response.success || !response.data) {
          setLoadError('Monster not found');
        } else {
          setMonster(response.data);
        }
      } catch (err) {
        setLoadError(extractErrorMessage(err, 'Failed to load monster data. Please try again later.'));
      } finally {
        setLoading(false);
      }
    };

    loadMonster();
  }, [id]);

  // Authorization check
  const isAuthorized = useMemo(() => {
    if (!currentUser || !monster) return false;
    if (currentUser.is_admin) return true;

    const playerId = monster.player_user_id
      ? String(monster.player_user_id)
      : null;
    if (!playerId) return false;

    const userId = String(currentUser.id);
    const discordId = currentUser.discord_id
      ? String(currentUser.discord_id)
      : null;
    const username = currentUser.username ?? null;
    const email = currentUser.email ?? null;

    return (
      userId === playerId ||
      discordId === playerId ||
      username === playerId ||
      email === playerId
    );
  }, [currentUser, monster]);

  const handleSubmit = useCallback(
    async (data: Record<string, unknown>): Promise<SubmitResult> => {
      if (!id) return { success: false, message: 'Invalid monster ID' };

      try {
        const response = await monsterService.updateMonster(Number(id), data);
        const result = response as { success?: boolean; message?: string; data?: Monster };
        if (result.success !== false) {
          if (result.data) setMonster(result.data);
          return { success: true, message: 'Monster updated successfully!' };
        }
        return { success: false, message: result.message || 'Failed to update monster.' };
      } catch (err) {
        return { success: false, message: extractErrorMessage(err, 'Failed to update monster. Please try again.') };
      }
    },
    [id],
  );

  const handleSuccess = useCallback(() => {
    setTimeout(() => {
      navigate(`/monsters/${id}`);
    }, 2000);
  }, [navigate, id]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    monsterService
      .getMonsterById(Number(id))
      .then(response => {
        if (!response.success || !response.data) setLoadError('Monster not found');
        else setMonster(response.data);
      })
      .catch((err) => {
        setLoadError(extractErrorMessage(err, 'Failed to load monster data.'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading monster data..." />;
  }

  if (loadError) {
    return (
      <div className="main-container">
        <ErrorMessage message={loadError} onRetry={handleRetry} />
        <div style={{ marginTop: 'var(--spacing-small)' }}>
          <button className="button secondary" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="main-container">
        <div className="state-container">
          <i className="fa-solid fa-lock"></i>
          <h2>Not Authorized</h2>
          <p>You are not authorized to edit this monster.</p>
          <Link to={`/monsters/${id}`} className="button secondary">
            View Monster
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <div className="page-header">
        <Link to={`/monsters/${id}`} className="button secondary sm">
          <i className="fa-solid fa-arrow-left"></i> Back to Monster
        </Link>
      </div>

      <MonsterEditForm
        key={monster!.id}
        monster={monster!}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/monsters/${id}`)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default EditMonsterPage;
