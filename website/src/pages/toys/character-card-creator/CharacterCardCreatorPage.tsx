import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { useAuth } from '@contexts/useAuth';
import trainerService from '@services/trainerService';
import monsterService from '@services/monsterService';
import type { Trainer } from '@components/trainers/types/Trainer';
import type { Monster } from '@services/monsterService';
import { TrainerAutocomplete } from '@components/common/TrainerAutocomplete';
import { MonsterAutocomplete } from '@components/common/MonsterAutocomplete';
import type { CardData, CardSubject } from './types';
import { getDefaultCardData, getDefaultCustomization, getTrainerDefaultFields, getMonsterDefaultFields, getAspectDimensions } from './types';
import { populateTrainerFields, populateMonsterFields, extractMonsterStats } from './cardDataUtils';
import { CardPreview } from './CardPreview';
import { CardEditor } from './CardEditor';

const CharacterCardCreatorPage = () => {
  useDocumentTitle('Character Card Creator');
  const { currentUser } = useAuth();

  const previewRef = useRef<HTMLDivElement>(null);

  // Source data lists
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [trainerMonsters, setTrainerMonsters] = useState<Monster[]>([]);
  const [loadingMonsters, setLoadingMonsters] = useState(false);

  // Card state
  const [card, setCard] = useState<CardData>(getDefaultCardData());

  // Source selection state
  const [sourceTrainer, setSourceTrainer] = useState<Trainer | null>(null);
  const [sourceMonster, setSourceMonster] = useState<Monster | null>(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | number | null>(null);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Preview scaling: scale the fixed-size card to fit its container
  const canvasRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  const cardDimensions = useMemo(() => getAspectDimensions(card.customization.aspectRatio), [card.customization.aspectRatio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateScale = () => {
      const available = canvas.clientWidth - 16; // account for padding
      const scale = Math.min(1, available / cardDimensions.width);
      setPreviewScale(scale);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [cardDimensions.width]);

  // Load user's trainers on mount
  useEffect(() => {
    if (!currentUser) return;
    trainerService.getUserTrainers()
      .then((r: { trainers: Trainer[] }) => setTrainers(r.trainers || []))
      .catch(() => setTrainers([]));
  }, [currentUser]);

  // Load monsters when a trainer is selected (for monster subject)
  const loadTrainerMonsters = useCallback(async (trainerId: string | number) => {
    setLoadingMonsters(true);
    try {
      const data = await monsterService.getMonstersByTrainerId(trainerId);
      const monsters = Array.isArray(data) ? data : data.monsters || data.data || [];
      setTrainerMonsters(monsters);
    } catch {
      setTrainerMonsters([]);
    } finally {
      setLoadingMonsters(false);
    }
  }, []);

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
    setSelectedTrainerId(null);
    setTrainerMonsters([]);
  }, [card.customization]);

  // Trainer selection handler
  const handleTrainerSelect = useCallback((trainerId: string | number | null) => {
    if (!trainerId) {
      setSourceTrainer(null);
      setSelectedTrainerId(null);
      if (card.subject === 'trainer') {
        setCard(prev => ({ ...prev, sourceId: null, name: '', image: null, imageFile: null, fields: getTrainerDefaultFields(), stats: null }));
      }
      if (card.subject === 'monster') {
        setTrainerMonsters([]);
        setSourceMonster(null);
        setCard(prev => ({ ...prev, sourceId: null, name: '', image: null, imageFile: null, fields: getMonsterDefaultFields(), stats: null }));
      }
      return;
    }
    setSelectedTrainerId(trainerId);
    const trainer = trainers.find(t => t.id === trainerId);

    if (card.subject === 'trainer' && trainer) {
      setSourceTrainer(trainer);
      setSourceMonster(null);
      setCard(prev => ({
        ...prev,
        sourceId: Number(trainerId),
        name: trainer.name || '',
        image: trainer.main_ref || null,
        imageFile: null,
        fields: populateTrainerFields(trainer),
        stats: null,
      }));
    } else if (card.subject === 'monster') {
      // For monster subject, selecting a trainer loads their monsters
      setSourceTrainer(trainer || null);
      setSourceMonster(null);
      setCard(prev => ({ ...prev, sourceId: null, name: '', image: null, imageFile: null, fields: getMonsterDefaultFields(), stats: null }));
      loadTrainerMonsters(trainerId);
    }
  }, [card.subject, trainers, loadTrainerMonsters]);

  // Monster selection handler
  const handleMonsterSelect = useCallback((monsterId: string | number | null) => {
    if (!monsterId) {
      setSourceMonster(null);
      setCard(prev => ({ ...prev, sourceId: null, name: '', image: null, imageFile: null, fields: getMonsterDefaultFields(), stats: null }));
      return;
    }
    const monster = trainerMonsters.find(m => m.id === monsterId);
    if (!monster) return;
    setSourceMonster(monster);
    setCard(prev => ({
      ...prev,
      sourceId: Number(monsterId),
      name: (monster as Record<string, unknown>).name as string || '',
      image: (monster as Record<string, unknown>).img_link as string || null,
      imageFile: null,
      fields: populateMonsterFields(monster),
      stats: extractMonsterStats(monster),
    }));
  }, [trainerMonsters]);

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

        {card.subject === 'trainer' && (
          <div className="ccc-source__selector">
            <TrainerAutocomplete
              trainers={trainers}
              selectedTrainerId={selectedTrainerId}
              onSelect={handleTrainerSelect}
              label="Trainer"
              placeholder="Type to search your trainers..."
              noPadding
            />
          </div>
        )}

        {card.subject === 'monster' && (
          <div className="ccc-source__selector">
            <TrainerAutocomplete
              trainers={trainers}
              selectedTrainerId={selectedTrainerId}
              onSelect={handleTrainerSelect}
              label="Trainer"
              placeholder="Select a trainer first..."
              noPadding
            />
            {selectedTrainerId && (
              <div className="ccc-source__monster-select">
                {loadingMonsters ? (
                  <span className="ccc-source__loading">Loading monsters...</span>
                ) : (
                  <MonsterAutocomplete
                    monsters={trainerMonsters as { id: string | number; name: string }[]}
                    selectedMonsterId={card.sourceId}
                    onSelect={handleMonsterSelect}
                    label="Monster"
                    placeholder="Type to search monsters..."
                    noPadding
                  />
                )}
              </div>
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
          <div className="ccc-workspace__preview-canvas" ref={canvasRef}>
            <div
              style={{
                transform: previewScale < 1 ? `scale(${previewScale})` : undefined,
                transformOrigin: 'top center',
                width: previewScale < 1 ? cardDimensions.width : undefined,
                height: previewScale < 1 ? cardDimensions.height * previewScale : undefined,
              }}
            >
              <CardPreview ref={previewRef} card={card} />
            </div>
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
