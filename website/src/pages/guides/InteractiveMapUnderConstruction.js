import React from 'react';
import { Link } from 'react-router-dom';

const InteractiveMapUnderConstruction = () => {
  return (
    <div className="under-construction-page">
      <div className="under-construction-container">
        <div className="under-construction-icon">
          <i className="fas fa-hard-hat"></i>
        </div>
        <h1>Interactive Map Under Construction</h1>
        <p className="under-construction-message">
          The interactive map is currently under construction and will return soon.
        </p>
        <p className="under-construction-submessage">
          I'm working hard to bring you an improved map experience. Thank you for your patience!
        </p>
        <Link to="/guides" className="button primary">
          <i className="fas fa-arrow-left"></i> Back to Guides
        </Link>
      </div>

      <style>{`
        .under-construction-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
          padding: 2rem;
        }

        .under-construction-container {
          text-align: center;
          max-width: 500px;
          padding: 3rem;
          background: var(--card-background);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .under-construction-icon {
          font-size: 4rem;
          color: var(--warning-color, #f59e0b);
          margin-bottom: 1.5rem;
        }

        .under-construction-container h1 {
          font-size: 1.75rem;
          margin-bottom: 1rem;
          color: var(--text-primary, #1f2937);
        }

        .under-construction-message {
          font-size: 1.1rem;
          color: var(--text-secondary, #6b7280);
          margin-bottom: 0.5rem;
        }

        .under-construction-submessage {
          font-size: 0.95rem;
          color: var(--text-tertiary, #9ca3af);
          margin-bottom: 2rem;
        }

        .under-construction-container .button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default InteractiveMapUnderConstruction;
