import { useMemo, useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import type { SpeciesImageMap } from '../../../services/speciesService';
import type { TrainerWithMonsters } from './types';
import { downloadReferenceSheet } from './referenceDownload';

interface ReferenceDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainers: TrainerWithMonsters[];
  speciesImages: SpeciesImageMap;
}

export const ReferenceDownloadModal = ({
  isOpen,
  onClose,
  trainers,
  speciesImages,
}: ReferenceDownloadModalProps) => {
  const [selectedIds, setSelectedIds] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(trainers.map((t) => [t.id, true])),
  );
  const [includeImages, setIncludeImages] = useState(true);

  const selectedTrainers = useMemo(
    () => trainers.filter((t) => selectedIds[t.id]),
    [trainers, selectedIds],
  );

  const selectedCount = selectedTrainers.length;
  const selectedMonsterCount = selectedTrainers.reduce(
    (sum, t) => sum + t.monsters.length,
    0,
  );
  const allSelected = selectedCount === trainers.length && trainers.length > 0;

  const toggleTrainer = (trainerId: number) => {
    setSelectedIds((prev) => ({ ...prev, [trainerId]: !prev[trainerId] }));
  };

  const toggleAll = () => {
    const next = !allSelected;
    setSelectedIds(Object.fromEntries(trainers.map((t) => [t.id, next])));
  };

  const handleDownload = () => {
    if (selectedCount === 0) return;
    downloadReferenceSheet({
      trainers: selectedTrainers,
      speciesImages,
      includeImages,
    });
    onClose();
  };

  const footer = (
    <>
      <button className="button secondary no-flex" onClick={onClose}>
        Cancel
      </button>
      <button
        className="button primary no-flex"
        onClick={handleDownload}
        disabled={selectedCount === 0}
      >
        <i className="fas fa-download"></i>
        Download ({selectedMonsterCount})
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Download Reference List"
      size="medium"
      footer={footer}
    >
      <div className="ref-dl-modal">
        <p className="ref-dl-modal__description">
          Select which trainers to include. A printable HTML table of the monsters
          that still need references will be downloaded.
        </p>

        <div className="ref-dl-modal__toolbar">
          <button className="button secondary sm" onClick={toggleAll}>
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <span className="ref-dl-modal__selected-label">
            {selectedCount} of {trainers.length} selected
          </span>
        </div>

        <ul className="ref-dl-modal__list">
          {trainers.map((trainer) => (
            <li key={trainer.id} className="ref-dl-modal__item">
              <label className="ref-dl-modal__label">
                <input
                  type="checkbox"
                  checked={Boolean(selectedIds[trainer.id])}
                  onChange={() => toggleTrainer(trainer.id)}
                />
                <span className="ref-dl-modal__name">{trainer.name}</span>
                <span className="ref-dl-modal__count">{trainer.monsters.length}</span>
              </label>
            </li>
          ))}
        </ul>

        <label className="ref-dl-modal__option">
          <input
            type="checkbox"
            checked={includeImages}
            onChange={() => setIncludeImages((prev) => !prev)}
          />
          <span>
            Include reference images
            <span className="ref-dl-modal__option-hint">
              Adds a column of species reference images to the table.
            </span>
          </span>
        </label>
      </div>
    </Modal>
  );
};
