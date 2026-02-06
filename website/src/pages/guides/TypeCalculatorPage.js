import React from 'react';
import TypeCalculator from '../../components/guides/TypeCalculator';
import TeamBuilder from '../../components/guides/TeamBuilder';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const TypeCalculatorPage = () => {
  useDocumentTitle('Type Calculator - Guides');

  return (
    <div className="type-calculator-page">
      <div className="page-header">
        <h1>Type Effectiveness Calculator</h1>
        <p>Calculate combined type effectiveness for trainers and creatures with multiple types</p>
      </div>

      <div className="calculator-section">
        <TypeCalculator />
      </div>

      <div className="team-builder-section">
        <TeamBuilder />
      </div>
    </div>
  );
};

export default TypeCalculatorPage;