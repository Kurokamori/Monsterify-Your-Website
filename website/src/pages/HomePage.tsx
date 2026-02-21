import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import api from '../services/api';
import submissionService from '../services/submissionService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// --- Types ---

interface Fakemon {
  number: number;
  name: string;
  image_path?: string;
  image_url?: string;
  sprite_url?: string;
  types?: string[];
  type1?: string;
  type2?: string;
  type3?: string;
  type4?: string;
  type5?: string;
}

interface Trainer {
  id: number;
  name: string;
  level?: number;
  avatar_url?: string;
  main_ref?: string;
  image_url?: string;
  ref_url?: string;
  monsters_count?: number;
  monster_count?: number;
}

interface GallerySubmission {
  id: number;
  title?: string;
  trainer_name?: string;
  display_name?: string;
  artist?: string;
  username?: string;
  image_url?: string;
  url?: string;
}

interface RecentTask {
  name: string;
  completed: boolean;
  due_date: string;
}

interface ArtTodo {
  title: string;
  priority: string;
  type: string;
}

// --- Fallback Data ---

const FALLBACK_FAKEMON: Fakemon[] = [
  { number: 1, name: 'Leafsprout', types: ['Grass'] },
  { number: 2, name: 'Emberclaw', types: ['Fire'] },
  { number: 3, name: 'Aquafin', types: ['Water'] },
  { number: 4, name: 'Stormwing', types: ['Electric', 'Flying'] },
  { number: 5, name: 'Crystalix', types: ['Rock', 'Psychic'] },
  { number: 6, name: 'Shadowmist', types: ['Ghost', 'Dark'] },
  { number: 7, name: 'Ironclad', types: ['Steel', 'Fighting'] },
  { number: 8, name: 'Pixiedust', types: ['Fairy', 'Flying'] },
  { number: 9, name: 'Frostbite', types: ['Ice'] },
  { number: 10, name: 'Venomfang', types: ['Poison', 'Bug'] },
  { number: 11, name: 'Earthshaker', types: ['Ground'] },
  { number: 12, name: 'Mindrift', types: ['Psychic'] },
  { number: 13, name: 'Nightcrawler', types: ['Dark'] },
  { number: 14, name: 'Dracoflame', types: ['Dragon', 'Fire'] },
  { number: 15, name: 'Galeforce', types: ['Flying', 'Normal'] },
  { number: 16, name: 'Battlescale', types: ['Fighting'] },
];

const FALLBACK_TRAINERS: Trainer[] = [
  { id: 1, name: 'Aria', level: 15, monsters_count: 8 },
  { id: 2, name: 'Zeph', level: 23, monsters_count: 12 },
  { id: 3, name: 'Nova', level: 18, monsters_count: 6 },
];

const FALLBACK_GALLERY: GallerySubmission[] = [
  { id: 1, title: 'Dragon Artwork', trainer_name: 'ArtistOne' },
  { id: 2, title: 'Forest Scene', trainer_name: 'NaturePainter' },
  { id: 3, title: 'Character Design', trainer_name: 'Designer123' },
  { id: 4, title: 'Monster Battle', trainer_name: 'ActionArt' },
  { id: 5, title: 'Peaceful Valley', trainer_name: 'LandscapeArt' },
];

// --- Helpers ---

function processFakemonTypes(fakemon: Record<string, unknown>[]): Fakemon[] {
  return fakemon.map(raw => {
    const mon: Fakemon = {
      number: raw.number as number,
      name: raw.name as string,
      image_url: (raw.image_url || raw.imageUrl) as string | undefined,
      image_path: (raw.image_path || raw.imagePath) as string | undefined,
      sprite_url: (raw.sprite_url || raw.spriteUrl) as string | undefined,
      type1: (raw.type1) as string | undefined,
      type2: (raw.type2) as string | undefined,
      type3: (raw.type3) as string | undefined,
      type4: (raw.type4) as string | undefined,
      type5: (raw.type5) as string | undefined,
      types: raw.types as string[] | undefined,
    };
    if (!mon.types) {
      const types = [mon.type1, mon.type2, mon.type3, mon.type4, mon.type5]
        .filter((t): t is string => Boolean(t));
      mon.types = types.length > 0 ? types : ['Normal'];
    }
    return mon;
  });
}

function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement>,
  fallback = '/images/default_mon.png',
) {
  const img = e.currentTarget;
  img.onerror = null;
  img.src = fallback;
}

// --- Subcomponents ---

function HeroSection({ fakemon }: { fakemon: Fakemon[] }) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div className="hero-section">
      <div className="hero-content">
        <div className="hero-text">
          <div className="hero-title">
            {!logoFailed ? (
              <img
                src="/images/logo.png"
                alt="Dusk & Dawn"
                className="hero-logo"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className="hero-title-fallback">
                <span className="title-main">Dusk & Dawn</span>
              </div>
            )}
            <span className="title-sub">Monster Art Roleplay</span>
          </div>
          <p className="hero-description">
            Create, collect, and showcase your creatures in an immersive art-driven RPG experience.
            Design unique monsters, complete artistic challenges, and build your trainer&apos;s legacy.
          </p>
        </div>
        <div className="hero-visual">
          <div className="hero-visual__background">
            {fakemon.slice(0, 4).map((mon, index) => (
              <div key={mon.number} className={`floating-monster monster-${index + 1}`}>
                <img
                  src={mon.image_path || mon.image_url || '/images/default_mon.png'}
                  alt={mon.name}
                  onError={e => handleImageError(e)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepsSection() {
  return (
    <div className="hp-section">
      <div className="steps-header">
        <h2>Start Your Journey</h2>
        <p>Join our community of artists and monster enthusiasts to start your adventure!</p>
      </div>
      <div className="container grid-3 gap-large">
        <div className="step-card">
          <div className="step-number">1</div>
          <div className="step-icon">
            <i className="fab fa-discord"></i>
          </div>
          <h3>Join Discord</h3>
          <p>Connect with our vibrant community</p>
          <a
            href="https://discord.gg/YrF74RWA6v"
            className="button primary no-flex"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join Server
          </a>
        </div>
        <div className="step-card">
          <div className="step-number">2</div>
          <div className="step-icon">
            <i className="fas fa-user-plus"></i>
          </div>
          <h3>Register Account</h3>
          <p>Create your profile and get started</p>
          <Link to="/register" className="button primary no-flex">Sign Up</Link>
        </div>
        <div className="step-card">
          <div className="step-number">3</div>
          <div className="step-icon">
            <i className="fas fa-paint-brush"></i>
          </div>
          <h3>Create Trainer</h3>
          <p>Design your character and start your adventure</p>
          <Link to="/profile/trainers/add" className="button primary no-flex">Create Trainer</Link>
        </div>
      </div>
    </div>
  );
}

function FeaturesSection() {
  return (
    <div className="hp-section hp-section--subtle">
      <h2 className="hp-section__title">Game Features</h2>
      <div className="container grid-4 gap-medium">
        <div className="feature-card">
          <div className="feature-icon"><i className="fas fa-palette"></i></div>
          <h3>Art-Driven Gameplay</h3>
          <p>Progress through creating and submitting artwork of your creatures and trainers</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><i className="fas fa-dragon"></i></div>
          <h3>Creature Collection</h3>
          <p>Discover, adopt, and breed unique monsters from multiple universes</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><i className="fas fa-scroll"></i></div>
          <h3>Creative Writing</h3>
          <p>Craft stories and lore to develop your characters and world</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon"><i className="fas fa-users"></i></div>
          <h3>Community Events</h3>
          <p>Participate in collaborative adventures and seasonal challenges</p>
        </div>
      </div>
    </div>
  );
}

function LookAroundSection({ gallery }: { gallery: GallerySubmission[] }) {
  const displayGallery = gallery.length > 0 ? gallery : FALLBACK_GALLERY;

  return (
    <div className="hp-section hp-section--subtle">
      <h2 className="hp-section__title">Look Around</h2>
      <div className="container grid-3 gap-medium">
        <Link to="/submissions?tab=gallery" className="feature-card">
          <div className="look-around-icon"><i className="fas fa-images"></i></div>
          <h3>Gallery</h3>
          <p>Browse amazing artwork from the community</p>
        </Link>
        <Link to="/submissions?tab=library" className="feature-card">
          <div className="look-around-icon"><i className="fas fa-book"></i></div>
          <h3>Library</h3>
          <p>Read stories and lore from trainers</p>
        </Link>
        <Link to="/trainers" className="feature-card">
          <div className="look-around-icon"><i className="fas fa-users"></i></div>
          <h3>Trainers</h3>
          <p>Meet other trainers and their teams</p>
        </Link>
      </div>

      <div className="gallery-carousel">
        <h3>Recent Gallery Submissions</h3>
        <div className="gallery-grid">
          {displayGallery.map((submission) => (
            <Link to={`/submissions/${submission.id}`} key={submission.id} className="feature-card">
              <img
                src={submission.image_url || submission.url || '/images/default_art.png'}
                alt={submission.title || 'Gallery Submission'}
                onError={e => handleImageError(e, '/images/default_art.png')}
              />
              <div className="gallery-item-info">
                <span className="gallery-item-title">{submission.title || 'Untitled'}</span>
                <span className="gallery-item-artist">
                  {submission.trainer_name || submission.display_name || submission.artist || submission.username || 'Anonymous'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function WelcomeBackSection({ displayName }: { displayName: string }) {
  return (
    <div className="welcome-back">
      <h2>Welcome back, {displayName}!</h2>
      <p>Ready to continue your artistic adventure?</p>
    </div>
  );
}

function QuickActionsCard() {
  return (
    <div className="dashboard-card">
      <h3>Quick Actions</h3>
      <div className="quick-actions-grid">
        <Link to="/submissions/art" className="quick-action-button">
          <i className="fas fa-palette"></i>
          <span>Submit Art</span>
        </Link>
        <Link to="/submissions/writing" className="quick-action-button">
          <i className="fas fa-feather-alt"></i>
          <span>Submit Writing</span>
        </Link>
        <Link to="/town/activities/farm" className="quick-action-button">
          <i className="fas fa-seedling"></i>
          <span>Visit Farm</span>
        </Link>
        <Link to="/town/adoption" className="quick-action-button">
          <i className="fas fa-heart"></i>
          <span>Adoption Center</span>
        </Link>
      </div>
    </div>
  );
}

function TrainersCard({ trainers }: { trainers: Trainer[] }) {
  const displayTrainers = trainers.length > 0 ? trainers : FALLBACK_TRAINERS;

  return (
    <div className="dashboard-card">
      <div className="dashboard-card__header">
        <h3>Your Trainers</h3>
        <Link to="/my_trainers" className="button primary small no-flex">View All</Link>
      </div>
      <div className="trainers-list">
        {displayTrainers.slice(0, 5).map((trainer) => (
          <Link to={`/trainers/${trainer.id}`} key={trainer.id} className="compact-trainer-card">
            <div className="compact-trainer-avatar">
              <img
                src={trainer.avatar_url || trainer.main_ref || trainer.image_url || trainer.ref_url || '/images/default_trainer.png'}
                alt={trainer.name}
                onError={e => handleImageError(e, '/images/default_trainer.png')}
              />
            </div>
            <div className="compact-trainer-info">
              <div className="compact-trainer-name">{trainer.name}</div>
              <div className="compact-trainer-meta">
                <span className="compact-trainer-level">Lv. {trainer.level || 1}</span>
                <div className="compact-stat">
                  <i className="fas fa-dragon"></i>
                  <span>{trainer.monsters_count || trainer.monster_count || 0}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RecentTasksCard({ tasks }: { tasks: RecentTask[] }) {
  if (tasks.length === 0) return null;

  return (
    <div className="dashboard-card">
      <div className="dashboard-card__header">
        <h3>Recent Tasks</h3>
        <Link to="/tasks" className="button primary small no-flex">View All</Link>
      </div>
      <div className="task-list">
        {tasks.map((task, index) => (
          <div key={index} className="task-item">
            <div className="task-status">
              <i className={`fas ${task.completed ? 'fa-check-circle completed' : 'fa-circle pending'}`}></i>
            </div>
            <div className="task-content">
              <span className="task-name">{task.name}</span>
              <span className="task-date">{new Date(task.due_date).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtTodosCard({ todos }: { todos: ArtTodo[] }) {
  if (todos.length === 0) return null;

  return (
    <div className="dashboard-card">
      <div className="dashboard-card__header">
        <h3>Art Todo List</h3>
        <Link to="/profile/art-todo" className="button primary small no-flex">View All</Link>
      </div>
      <div className="task-list">
        {todos.map((todo, index) => (
          <div key={index} className="task-item">
            <div className="todo-priority">
              <span className={`priority-badge ${todo.priority}`}>{todo.priority}</span>
            </div>
            <div className="todo-content">
              <span className="task-name">{todo.title}</span>
              <span className="task-date">{todo.type}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiscoverSection({ fakemon }: { fakemon: Fakemon[] }) {
  return (
    <div className="discover-section hp-section hp-section--subtle">
      <div className="home-section-header">
        <h2>Discover Creatures</h2>
        <Link to="/fakedex" className="button primary no-flex">
          <span>Explore Fakedex</span>
          <i className="fas fa-arrow-right"></i>
        </Link>
      </div>
      <div className="creatures-gallery">
        {fakemon.map((mon) => (
          <Link to={`/fakedex/${mon.number}`} className="feature-card" key={mon.number}>
            <div className="creature-image">
              <img
                src={mon.image_path || mon.image_url || mon.sprite_url || '/images/default_mon.png'}
                alt={mon.name}
                onError={e => handleImageError(e)}
              />
            </div>
            <div className="creature-info">
              <span className="creature-number">#{String(mon.number).padStart(3, '0')}</span>
              <span className="creature-name">{mon.name}</span>
              <div className="type-tags">
                {(mon.types || ['Normal']).map((type) => (
                  <span className={`badge sm type-${type.toLowerCase()}`} key={type}>
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// --- Main Component ---

const HomePage = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [artTodos, setArtTodos] = useState<ArtTodo[]>([]);
  const [randomFakemon, setRandomFakemon] = useState<Fakemon[]>([]);
  const [userTrainers, setUserTrainers] = useState<Trainer[]>([]);
  const [gallerySubmissions, setGallerySubmissions] = useState<GallerySubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuthenticatedData = useCallback(async (discordId: string) => {
    const [tasksRes, artRes, fakemonRes, trainersRes, galleryRes] = await Promise.allSettled([
      api.get(`/tasks/recent?limit=3`),
      api.get(`/art-todo/personal?limit=3`),
      api.get('/fakedex/random?limit=12'),
      api.get(`/trainers/user/${discordId}?limit=10`),
      submissionService.getArtGallery({ limit: 5 }),
    ]);

    if (tasksRes.status === 'fulfilled') {
      setRecentTasks(tasksRes.value.data?.tasks || []);
    }
    if (artRes.status === 'fulfilled') {
      setArtTodos(artRes.value.data?.items || []);
    }
    if (fakemonRes.status === 'fulfilled') {
      const data = fakemonRes.value.data;
      const raw = data?.fakemon || data?.data || data || [];
      setRandomFakemon(processFakemonTypes(Array.isArray(raw) ? raw : []));
    }
    if (trainersRes.status === 'fulfilled') {
      const data = trainersRes.value.data;
      const raw = data?.trainers || data?.data || data || [];
      const trainers = Array.isArray(raw) ? raw : [];
      // Shuffle trainer order
      setUserTrainers([...trainers].sort(() => Math.random() - 0.5));
    }
    if (galleryRes.status === 'fulfilled') {
      const data = galleryRes.value;
      const submissions = data?.submissions || data?.data || data || [];
      setGallerySubmissions(Array.isArray(submissions) ? submissions : []);
    }
  }, []);

  const fetchPublicData = useCallback(async () => {
    const [fakemonRes, galleryRes] = await Promise.allSettled([
      api.get('/fakedex/random?limit=16'),
      submissionService.getArtGallery({ limit: 5 }),
    ]);

    if (fakemonRes.status === 'fulfilled') {
      const data = fakemonRes.value.data;
      const raw = data?.fakemon || data?.data || data || [];
      setRandomFakemon(processFakemonTypes(Array.isArray(raw) ? raw : []));
    }
    if (galleryRes.status === 'fulfilled') {
      const data = galleryRes.value;
      const submissions = data?.submissions || data?.data || data || [];
      setGallerySubmissions(Array.isArray(submissions) ? submissions : []);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (isAuthenticated && currentUser?.discord_id) {
          await fetchAuthenticatedData(currentUser.discord_id);
        } else {
          await fetchPublicData();
        }
      } catch (err) {
        console.error('Error fetching home page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, currentUser, fetchAuthenticatedData, fetchPublicData]);

  const displayFakemon = randomFakemon.length > 0 ? randomFakemon : FALLBACK_FAKEMON;
  const displayName = currentUser?.display_name || currentUser?.username || 'Trainer';

  if (loading) {
    return (
      <div className="homepage-loading">
        <LoadingSpinner message="Loading your adventure..." />
      </div>
    );
  }

  return (
    <div className="homepage">
      <HeroSection fakemon={displayFakemon} />

      <div className="homepage-content">
        {!isAuthenticated ? (
          <div className="new-user-content">
            <StepsSection />
            <FeaturesSection />
            <LookAroundSection gallery={gallerySubmissions} />
          </div>
        ) : (
          <div className="returning-user-content">
            <WelcomeBackSection displayName={displayName} />

            <div className="dashboard-grid">
              <div className="dashboard-row">
                <QuickActionsCard />
                <TrainersCard trainers={userTrainers} />
              </div>

              {(recentTasks.length > 0 || artTodos.length > 0) && (
                <div className="dashboard-row">
                  <RecentTasksCard tasks={recentTasks} />
                  <ArtTodosCard todos={artTodos} />
                </div>
              )}
            </div>

            <LookAroundSection gallery={gallerySubmissions} />
          </div>
        )}

        <DiscoverSection fakemon={displayFakemon} />
      </div>
    </div>
  );
};

export default HomePage;
