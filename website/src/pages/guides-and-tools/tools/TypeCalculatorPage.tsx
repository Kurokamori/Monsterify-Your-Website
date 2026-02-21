import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { TypeCalculator } from '../../../components/guides/TypeCalculator';
import { TeamBuilder } from '../../../components/guides/TeamBuilder';

const TypeCalculatorPage = () => {
  useDocumentTitle('Type Calculator - Guides');

  return (
    <div className="guide-page">
      <div className="guide-page__header">
        <h1>Type Effectiveness Calculator</h1>
        <p>Calculate combined type effectiveness for trainers and creatures with multiple types</p>
      </div>

      <TypeCalculator />
      <TeamBuilder />
    </div>
  );
};

export default TypeCalculatorPage;
