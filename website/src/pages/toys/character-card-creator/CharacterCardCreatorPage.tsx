import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useAuth } from '@contexts/useAuth';
import trainerService from '@services/trainerService';
import monsterService from '@services/monsterService';
import type { Trainer } from '@components/trainers/types/Trainer';
import type { Monster } from '@services/monsterService';
import type { CardData, CardSubject } from './types';
import { getDefaultCardData, getDefaultCustomization, getTrainerDefaultFields, getMonsterDefaultFields } from './types';
import { populateTrainerFields, populateMonsterFields, extractMonsterStats } from './cardDataUtils';
import { CardPreview } from './CardPreview';
import { CardEditor } from './CardEditor';

type SourceOption = { id: number; name: string; image: string | null };

const CharacterCardCreatorPage = () => {
  useDocumentTitle('Character Card Creator');
  const { currentUser } = useAuth();

  const previewRef = useRef<HTMLDivElement>(null);

  // Source data lists
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loadingSource, setLoadingSource] = useState(false);

  // Card state
  const [card, setCard] = useState<CardData>(getDefaultCardData());

  // Source selection state
  const [sourceTrainer, setSourceTrainer] = useState<Trainer | null>(null);
  const [sourceMonster, setSourceMonster] = useState<Monster | null>(null);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Load user's trainers and monsters on mount
  useEffect(() => {
    if (!currentUser) return;
    setLoadingSource(true);
    Promise.all([
      trainerService.getUserTrainers().then((r: { trainers: Trainer[] }) => r.trainers || []).catch(() => [] as Trainer[]),
      monsterService.getMonstersByUserId().catch(() => []),
    ]).then(([t, m]) => {
      setTrainers(t);
      setMonsters(m);
    }).finally(() => setLoadingSource(false));
  }, [currentUser]);

  // Build source options list
  const trainerOptions: SourceOption[] = trainers.map(t => ({
    id: t.id,
    name: t.name || `Trainer #${t.id}`,
    image: t.main_ref || null,
  }));

  const monsterOptions: SourceOption[] = monsters.map(m => ({
    id: m.id,
    name: m.name || `Monster #${m.id}`,
    image: (m as Record<string, unknown>).img_link as string || null,
  }));

  // Subject change handler
  const handleSubjectChange = useCallback((subject: CardSubject) => {
    const base = getDefaultCustomization();
    if (subject === 'trainer') {
      setCard({
        ...getDefaultCardData(),
        subject,
        customization: { ...base, ...card.customization, layout: card.customization.layout },
      });
    } else if (subject === 'monster') {
      setCard({
        ...getDefaultCardData(),
        subject,
        fields: getMonsterDefaultFields(),
        customization: { ...base, ...card.customization, layout: card.customization.layout },
      });
    } else {
      setCard({
        ...getDefaultCardData(),
        subject,
        fields: getTrainerDefaultFields(),
        customization: { ...base, ...card.customization, layout: card.customization.layout },
      });
    }
    setSourceTrainer(null);
    setSourceMonster(null);
  }, [card.customization]);

  // Source selection handler
  const handleSourceSelect = useCallback((sourceId: number) => {
    if (card.subject === 'trainer') {
      const trainer = trainers.find(t => t.id === sourceId);
      if (!trainer) return;
      setSourceTrainer(trainer);
      setSourceMonster(null);
      setCard(prev => ({
        ...prev,
        sourceId,
        name: trainer.name || '',
        image: trainer.main_ref || null,
        imageFile: null,
        fields: populateTrainerFields(trainer),
        stats: null,
      }));
    } else if (card.subject === 'monster') {
      const monster = monsters.find(m => m.id === sourceId);
      if (!monster) return;
      setSourceMonster(monster);
      setSourceTrainer(null);
      setCard(prev => ({
        ...prev,
        sourceId,
        name: (monster as Record<string, unknown>).name as string || '',
        image: (monster as Record<string, unknown>).img_link as string || null,
        imageFile: null,
        fields: populateMonsterFields(monster),
        stats: extractMonsterStats(monster),
      }));
    }
  }, [card.subject, trainers, monsters]);

  // Image upload handler
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCard(prev => ({ ...prev, imageFile: file, image: null }));
  }, []);

  // Clear image
  const handleClearImage = useCallback(() => {
    setCard(prev => ({ ...prev, imageFile: null, image: null }));
  }, []);

  // Export as PNG
  const handleExportPng = useCallback(async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `${card.name || 'character-card'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [card.name]);

  // Copy card HTML
  const handleCopyHtml = useCallback(async () => {
    if (!previewRef.current) return;
    try {
      const html = previewRef.current.outerHTML;
      await navigator.clipboard.writeText(html);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = previewRef.current.outerHTML;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  }, []);

  const currentOptions = card.subject === 'trainer' ? trainerOptions : monsterOptions;

  return (
    <div className="ccc-page">
      <Link to="/toys" className="ccc-back-link">
        <i className="fas fa-arrow-left"></i> Back to Toys
      </Link>

      <div className="ccc-page__header">
        <h1 className="ccc-page__title">Character Card Creator</h1>
        <p className="ccc-page__subtitle">
          Build and export custom character cards for your trainers and monsters
        </p>
      </div>

      {/* Source Selection */}
      <div className="ccc-source">
        <h3 className="ccc-source__title">
          <i className="fas fa-user-circle"></i> Choose a Subject
        </h3>

        <div className="ccc-source__tabs">
          {(['trainer', 'monster', 'custom'] as CardSubject[]).map(s => (
            <button
              key={s}
              className={`ccc-source__tab ${card.subject === s ? 'ccc-source__tab--active' : ''}`}
              onClick={() => handleSubjectChange(s)}
            >
              <i className={`fas ${s === 'trainer' ? 'fa-user' : s === 'monster' ? 'fa-dragon' : 'fa-paint-brush'}`}></i>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {card.subject !== 'custom' && (
          <div className="ccc-source__selector">
            {loadingSource ? (
              <span className="ccc-source__loading">Loading your {card.subject}s...</span>
            ) : currentOptions.length === 0 ? (
              <span className="ccc-source__empty">
                No {card.subject}s found. {!currentUser && 'Log in to load your characters.'}
              </span>
            ) : (
              <select
                className="ccc-source__select"
                value={card.sourceId ?? ''}
                onChange={(e) => handleSourceSelect(Number(e.target.value))}
              >
                <option value="" disabled>Select a {card.subject}...</option>
                {currentOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Image Upload */}
        <div className="ccc-source__image-section">
          <label className="ccc-source__image-label">
            <i className="fas fa-image"></i>
            {card.image || card.imageFile ? 'Change Image' : 'Upload Image'}
          </label>
          <div className="ccc-source__image-controls">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="ccc-source__file-input"
            />
            {(card.image || card.imageFile) && (
              <button className="button secondary sm" onClick={handleClearImage}>
                <i className="fas fa-times"></i> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout: Preview + Editor */}
      <div className="ccc-workspace">
        <div className="ccc-workspace__preview">
          <div className="ccc-workspace__preview-header">
            <h3 className="ccc-workspace__section-title">
              <i className="fas fa-eye"></i> Preview
            </h3>
            <div className="ccc-workspace__export-actions">
              <button
                className="button primary sm"
                onClick={handleExportPng}
                disabled={exporting}
              >
                <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
                {exporting ? 'Exporting...' : 'Download PNG'}
              </button>
              <button className="button secondary sm" onClick={handleCopyHtml}>
                <i className="fas fa-copy"></i> Copy HTML
              </button>
            </div>
          </div>
          <div className="ccc-workspace__preview-canvas">
            <CardPreview ref={previewRef} card={card} />
          </div>
        </div>

        <div className="ccc-workspace__editor">
          <h3 className="ccc-workspace__section-title">
            <i className="fas fa-sliders-h"></i> Customize
          </h3>
          <CardEditor
            card={card}
            onChange={setCard}
            sourceTrainer={sourceTrainer}
            sourceMonster={sourceMonster}
          />
        </div>
      </div>
    </div>
  );
};

export default CharacterCardCreatorPage;
