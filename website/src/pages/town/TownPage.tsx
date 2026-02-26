import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { Card } from '@components/common';
import '@styles/town/town.css';

interface TownLocation {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  image: string;
}

const PLACEHOLDER_IMAGE = 'https://i.imgur.com/RmKySNO.png';

const TOWN_LOCATIONS: TownLocation[] = [
  {
    id: 'market',
    name: 'Market',
    description: 'Browse the many shops of Heimdal City. Purchase items, berries, pastries, and more.',
    route: '/town/market',
    icon: 'fas fa-store',
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: 'apothecary',
    name: 'Apothecary',
    description: 'Use berries to modify your monsters\' species, types, and attributes.',
    route: '/town/apothecary',
    icon: 'fas fa-flask',
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: 'bakery',
    name: 'Bakery',
    description: 'Use pastries to set or add types and species to your monsters.',
    route: '/town/bakery',
    icon: 'fas fa-bread-slice',
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: 'witchs-hut',
    name: "Witch's Hut",
    description: 'Evolve your monsters using evolution items gathered on your adventures.',
    route: '/town/visit/witchs-hut',
    icon: 'fas fa-hat-wizard',
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: 'mega-mart',
    name: 'Mega Mart',
    description: 'Purchase a wide variety of items for your trainers and monsters.',
    route: '/town/mega-mart',
    icon: 'fas fa-shopping-cart',
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: 'antique-store',
    name: 'Antique Store',
    description: 'Appraise and auction rare antique items found during your travels.',
    route: '/town/visit/antique-store',
    icon: 'fas fa-gem',
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: 'nursery',
    name: 'Nursery',
    description: 'Breed and raise your monsters to discover new combinations.',
    route: '/town/activities/nursery',
    icon: 'fas fa-egg',
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: 'pirates-dock',
    name: "Pirate's Dock",
    description: 'Swab the deck or cast a line to earn rewards from far-off lands.',
    route: '/town/activities/pirates-dock',
    icon: 'fas fa-anchor',
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: 'garden',
    name: 'Garden',
    description: 'Nurture magical plants and harvest enchanted rewards from the mystical grounds.',
    route: '/town/activities/garden',
    icon: 'fas fa-seedling',
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: 'game-corner',
    name: 'Game Corner',
    description: 'Try your luck at the games and win exciting prizes.',
    route: '/town/activities/game-corner',
    icon: 'fas fa-dice',
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: 'farm',
    name: 'Farm',
    description: 'Tend to the farm and gather resources from the land.',
    route: '/town/activities/farm',
    icon: 'fas fa-tractor',
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: 'adoption',
    name: 'Adoption Center',
    description: 'Give a loving home to monsters in need of a trainer.',
    route: '/town/adoption',
    icon: 'fas fa-heart',
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: 'trade',
    name: 'Trade Center',
    description: 'Trade monsters and items with other trainers from around the world.',
    route: '/town/trade',
    icon: 'fas fa-exchange-alt',
    image: PLACEHOLDER_IMAGE,
  },
  {
    id: 'bazar',
    name: 'Bazzar',
    description: 'A bustling marketplace where trainers buy and sell unique goods.',
    route: '/town/bazar',
    icon: 'fas fa-scroll',
    image: PLACEHOLDER_IMAGE,
  },
];

export default function TownPage() {
  useDocumentTitle('Heimdal City');

  const navigate = useNavigate();

  return (
    <div className="town-page">
      <div className="town-page__header">
        <h1>Heimdal City</h1>
        <p className="town-page__subtitle">
          Welcome to Heimdal City! Explore the shops, activities, and services available to trainers.
        </p>
      </div>

      <div className="town-page__grid">
        {TOWN_LOCATIONS.map(location => (
          <Card
            key={location.id}
            className="town-location-card"
            image={location.image}
            imageAlt={location.name}
            imageHeight="160px"
            hoverable
            onClick={() => navigate(location.route)}
          >
            <h3 className="town-location-card__name">
              <i className={location.icon}></i>
              {location.name}
            </h3>
            <p className="town-location-card__description">{location.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
