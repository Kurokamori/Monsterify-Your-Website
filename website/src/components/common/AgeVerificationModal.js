import React from 'react';
import Modal from './Modal';

const AgeVerificationModal = ({ isOpen, onConfirm, onCancel }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Age Verification Required"
      size="medium"
      closeOnOverlayClick={false}
    >
      <div className="age-verification-content">
        <div className="age-verification-warning">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <p className="age-verification-intro">
          You are about to enable mature content viewing. This content may include:
        </p>
        <ul className="age-verification-list">
          <li>Gore and graphic violence</li>
          <li>Light NSFW content (suggestive themes)</li>
          <li>Heavy NSFW content (explicit material)</li>
          <li>Potentially triggering content</li>
          <li>Intense violence depictions</li>
        </ul>
        <div className="age-verification-confirmation">
          <strong>By continuing, you confirm that you are at least 18 years of age and understand that you may see mature and NSFW content.</strong>
        </div>
      </div>
      <div className="age-verification-actions">
        <button className="button secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="button primary" onClick={onConfirm}>
          I confirm I am 18+
        </button>
      </div>
    </Modal>
  );
};

export default AgeVerificationModal;
