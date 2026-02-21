import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';

interface ToyDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
}

const toys: ToyDefinition[] = [
  {
    id: 'who-should-i-draw',
    name: 'Who Should I Draw?',
    description: 'Randomly roll trainers and monsters for drawing inspiration. Filter by user, type, and more.',
    icon: 'fas fa-dice',
    path: '/toys/who-should-i-draw',
  },
  {
    id: 'character-card-creator',
    name: 'Character Card Creator',
    description: 'Build and export custom character cards with configurable layouts, colors, and fields.',
    icon: 'fas fa-id-card',
    path: '/toys/character-card-creator',
  },
];

const ToysPage = () => {
  useDocumentTitle('Toys');

  return (
    <div className="toys-page">
      <div className="toys-page__header">
        <h1 className="toys-page__title">Toys</h1>
        <p className="toys-page__subtitle">
          Fun little gimmick tools and utilities to play with
        </p>
      </div>

      <div className="toys-grid">
        {toys.map((toy) => (
          <Link key={toy.id} to={toy.path} className="toy-card">
            <div className="toy-card__icon">
              <i className={toy.icon}></i>
            </div>
            <span className="toy-card__name">{toy.name}</span>
            <span className="toy-card__description">{toy.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ToysPage;
