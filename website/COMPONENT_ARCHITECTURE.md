# Component Architecture & Modular Components Guide

This document catalogs all reusable components in the codebase, identifies patterns that should be extracted, and provides recommendations for a more modular architecture.

---

## Table of Contents

1. [Existing Common Components](#1-existing-common-components)
2. [Existing Layout Components](#2-existing-layout-components)
3. [Existing Domain-Specific Components](#3-existing-domain-specific-components)
4. [Recommended New Components](#4-recommended-new-components)
5. [Shared Constants & Utilities](#5-shared-constants--utilities)
6. [Implementation Priority](#6-implementation-priority)

---

## 1. Existing Common Components

Location: `website/src/components/common/`

### Form Components

| Component | File | Purpose | Props |
|-----------|------|---------|-------|
| **FormInput** | `FormInput.js` | Text input with label, error, help text | `label`, `name`, `type`, `value`, `onChange`, `placeholder`, `required`, `disabled`, `error`, `helpText`, `icon` |
| **FormSelect** | `FormSelect.js` | Dropdown select with options | `label`, `name`, `value`, `onChange`, `options[]`, `placeholder`, `required`, `disabled`, `error`, `helpText` |
| **FormCheckbox** | `FormCheckbox.js` | Checkbox with label | `label`, `name`, `checked`, `onChange`, `disabled`, `error`, `helpText` |
| **FormTextarea** | `FormTextarea.js` | Multi-line text input | `label`, `name`, `value`, `onChange`, `placeholder`, `required`, `disabled`, `error`, `helpText`, `rows` |
| **AutocompleteInput** | `AutocompleteInput.js` | Searchable dropdown with keyboard nav | `id`, `name`, `value`, `onChange`, `options[]`, `placeholder`, `label`, `helpText`, `required`, `disabled`, `showDescriptionBelow`, `onSelect` |

### Specialized Selectors

| Component | File | Purpose | Props |
|-----------|------|---------|-------|
| **MonsterAutocomplete** | `MonsterAutocomplete.js` | Monster search/select | `monsters[]`, `selectedMonsterId`, `onSelect`, `label`, `placeholder`, `required`, `disabled`, `showTypes`, `returnName`, `allowFreeText` |
| **TrainerAutocomplete** | `TrainerAutocomplete.js` | Trainer search/select | `trainers[]`, `selectedTrainerId`, `onSelect`, `label`, `placeholder`, `required`, `disabled`, `showOwnership` |
| **TrainerSelector** | `TrainerSelector.js` | Trainer dropdown (fetches from API) | `selectedTrainerId`, `onChange`, `trainers[]` (optional) |
| **SearchBar** | `SearchBar.js` | Debounced search input | `placeholder`, `value`, `onChange`, `debounceTime` |

### File Upload

| Component | File | Purpose | Props |
|-----------|------|---------|-------|
| **FileUpload** | `FileUpload.js` | Cloudinary upload with progress | `onUploadSuccess`, `onUploadError`, `uploadPreset`, `folder`, `acceptedFileTypes`, `maxFileSize`, `buttonText`, `initialImageUrl`, `disabled` |
| **BackendFileUpload** | `BackendFileUpload.js` | Backend API upload with progress | `onUploadSuccess`, `onUploadError`, `uploadEndpoint`, `acceptedFileTypes`, `maxFileSize`, `buttonText`, `initialImageUrl`, `disabled` |

### UI Feedback

| Component | File | Purpose | Props |
|-----------|------|---------|-------|
| **LoadingSpinner** | `LoadingSpinner.js` | Animated loading indicator | `message`, `size` |
| **ErrorMessage** | `ErrorMessage.js` | Error display with retry | `message`, `onRetry`, `backButton` |
| **SuccessMessage** | `SuccessMessage.js` | Success notification | `title`, `message`, `onClose` |

### Navigation & Display

| Component | File | Purpose | Props |
|-----------|------|---------|-------|
| **Modal** | `Modal.js` | Dialog overlay with portal | `isOpen`, `onClose`, `title`, `children`, `footer`, `size`, `closeOnOverlayClick` |
| **Pagination** | `Pagination.js` | Page navigation with ellipsis | `currentPage`, `totalPages`, `onPageChange` |
| **MarkdownRenderer** | `MarkdownRenderer.js` | Markdown to HTML with XSS protection | `content`, `className`, `inline`, `disableCodeBlocks` |

### Route Protection

| Component | File | Purpose | Props |
|-----------|------|---------|-------|
| **ProtectedRoute** | `ProtectedRoute.js` | Auth-only route wrapper | `children` |
| **AdminRoute** | `AdminRoute.js` | Admin-only route wrapper | `children` |

### Authentication

| Component | File | Purpose | Props |
|-----------|------|---------|-------|
| **AuthButtons** | `AuthButtons.js` | Login/logout button group | `onLogout` |
| **LogoutButton** | `LogoutButton.js` | Logout action button | `className`, `onClick` |

### Domain-Specific (in common)

| Component | File | Purpose | Notes |
|-----------|------|---------|-------|
| **EnhancedMonsterDetails** | `EnhancedMonsterDetails.js` | Monster info with item effects | Contains hardcoded berry/pastry mappings - should be externalized |

---

## 2. Existing Layout Components

### Primary Layouts

Location: `website/src/components/layouts/`

| Component | File | Purpose | Features |
|-----------|------|---------|----------|
| **MainLayout** | `MainLayout.js` | Public page wrapper | Top nav, mobile menu, footer, shop dropdown |
| **AdminLayout** | `AdminLayout.js` | Admin panel wrapper | Sidebar nav, collapsible at 1024px, organized sections |

### Secondary Layout Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **PageHeader** | `components/layout/PageHeader.js` | Standardized page header with title, subtitle, actions |
| **GuideSidebar** | `components/guides/GuideSidebar.js` | Hierarchical navigation for guides |
| **GuideCategoryTabs** | `components/guides/GuideCategoryTabs.js` | Tab navigation for guide categories |
| **ShopDropdown** | `components/shop/ShopDropdown.js` | Dynamic shop navigation |
| **MobileShopLinks** | `components/shop/MobileShopLinks.js` | Mobile shop navigation |

---

## 3. Existing Domain-Specific Components

### Monster Components

Location: `website/src/components/monsters/`

| Component | Purpose |
|-----------|---------|
| **MonsterCard** | Display monster in card format |
| **MonsterRoller** | Random monster selection interface |
| **MonsterSelector** | Multi-select monster picker |
| **StarterMonsterCard** | Starter selection display |
| **TypeBadge** | Type badge with color |
| **AttributeBadge** | Attribute badge with color |
| **EvolutionCards** | Evolution chain display |
| **EvolutionEditor** | Evolution management |

### Item Components

Location: `website/src/components/items/`

| Component | Purpose |
|-----------|---------|
| **ItemCard** | Display item in card format |
| **ItemDetailModal** | Item details overlay |

### Prompt Components

Location: `website/src/components/prompts/`

| Component | Purpose |
|-----------|---------|
| **PromptCard** | Display prompt/quest in card format |
| **PromptList** | Paginated prompt listing |
| **PromptSubmissionModal** | Prompt submission interface |

### Faction Components

Location: `website/src/components/factions/`

| Component | Purpose |
|-----------|---------|
| **FactionStandingDisplay** | Show faction reputation |
| **FactionStore** | Faction shop interface |
| **FactionSubmissionModal** | Multi-step faction submission |
| **KnownPeople** | Display known NPCs |
| **MonsterTeamCard** | Team member display |
| **PersonDetailModal** | NPC details overlay |
| **PersonFullView** | Full NPC page |
| **TributeSubmissionModal** | Tribute submission interface |

### Submission Components

Location: `website/src/components/submissions/`

| Component | Purpose |
|-----------|---------|
| **ArtGallery** | Paginated art display |
| **ArtSubmissionCalculator** | Reward calculation |
| **ArtSubmissionForm** | Art upload form |
| **WritingLibrary** | Writing submission display |
| **WritingSubmissionForm** | Writing upload form |
| **RewardDisplay** | Show earned rewards |
| **GiftRewards** | Gift allocation interface |

### Town Components

Location: `website/src/components/town/`

| Component | Purpose |
|-----------|---------|
| **AdoptionCenter** | Monster adoption interface |
| **AntiqueAppraisal** | Antique value display |
| **AntiqueAuction** | Auction interface |
| **Apothecary** | Potion shop |
| **Bakery** | Bakery shop |
| **BreedMonsters** | Breeding interface |
| **Garden** | Garden management |
| **GardenHarvest** | Harvest rewards |
| **Shop** | General shop |
| **TownMap** | Town navigation |
| **WitchsHut** | Witch shop |

### Adventure Components

Location: `website/src/components/adventures/`

| Component | Purpose |
|-----------|---------|
| **AdventureCreationForm** | Create new adventure |
| **AdventureDetail** | Adventure info display |
| **AdventureList** | List available adventures |
| **AdventureRewards** | Show adventure rewards |
| **AdventureTeamSelector** | Team selection for adventures |
| **CurrentBossView** | Boss battle display |

---

## 4. Recommended New Components

### High Priority - Extract from Repeated Patterns

#### BaseCard
**Purpose:** Unified card component for monsters, items, prompts, etc.

```jsx
// Proposed API
<BaseCard
  image={{ src, alt, fallback, onClick }}
  header={{ title, badges: [], subtitle }}
  body={<children />}
  footer={{ actions: [], metadata }}
  variant="monster|item|prompt|trainer"
  selected={boolean}
  disabled={boolean}
  onClick={handler}
/>
```

**Should Handle:**
- Image display with fallback
- Header with title and badge groups
- Body content slot
- Footer with action buttons
- Hover/selected/disabled states
- Click handlers

**Files to Consolidate:** `MonsterCard.js`, `ItemCard.js`, `PromptCard.js`, `MonsterTeamCard.js`

---

#### ListContainer / DataGrid
**Purpose:** Wrapper for paginated, filterable lists

```jsx
// Proposed API
<ListContainer
  items={[]}
  renderItem={(item) => <Card item={item} />}
  loading={boolean}
  error={string}
  emptyMessage="No items found"
  pagination={{ page, totalPages, onPageChange }}
  filters={<FilterSection />}
  sortOptions={[]}
  layout="grid|list"
  gridSize="sm|md|lg"
/>
```

**Should Handle:**
- Loading state display
- Error state with retry
- Empty state message
- Pagination integration
- Filter section slot
- Sort dropdown
- Grid/list layout toggle

**Files with Pattern:** `TrainerList.js`, `AdminPromptList.js`, `PromptList.js`, `ArtGallery.js`, `AdventureList.js`

---

#### StateContainer
**Purpose:** Wrap content with loading/error/success states

```jsx
// Proposed API
<StateContainer
  loading={boolean}
  error={string}
  success={string}
  onRetry={handler}
  loadingMessage="Loading..."
>
  {children}
</StateContainer>
```

**Should Handle:**
- Show LoadingSpinner when loading
- Show ErrorMessage when error
- Show SuccessMessage when success
- Render children otherwise
- Auto-dismiss success after timeout

**Current Pattern Repeated In:** 20+ components

---

#### ActionButtonGroup
**Purpose:** Consistent button group for forms/modals

```jsx
// Proposed API
<ActionButtonGroup
  layout="horizontal|vertical"
  align="left|center|right"
  actions={[
    { label: 'Cancel', onClick, variant: 'secondary' },
    { label: 'Submit', onClick, variant: 'primary', loading, disabled }
  ]}
/>
```

**Should Handle:**
- Button layout and spacing
- Loading state on primary
- Disabled states
- Keyboard navigation

---

#### BadgeGroup / ColorBadge
**Purpose:** Unified badge display with centralized colors

```jsx
// Proposed API
<BadgeGroup>
  <ColorBadge type="pokemon-type" value="fire" />
  <ColorBadge type="difficulty" value="expert" />
  <ColorBadge type="rarity" value="legendary" />
  <ColorBadge type="attribute" value="virus" />
</BadgeGroup>
```

**Should Handle:**
- Color lookup from centralized constants
- Consistent sizing and spacing
- Tooltip on hover (optional)
- Multiple badge layouts

**Files with Duplicated Logic:** `TypeBadge.jsx`, `AttributeBadge.jsx`, `MonsterCard.js`, `PromptCard.js`

---

#### RewardsList / RewardItem
**Purpose:** Unified reward display

```jsx
// Proposed API
<RewardsList rewards={rewardObject}>
  <RewardItem type="levels" value={5} />
  <RewardItem type="coins" value={100} />
  <RewardItem type="item" name="Rare Candy" quantity={3} />
  <RewardItem type="monster" monster={monsterObject} />
</RewardsList>
```

**Should Handle:**
- Icon display per reward type
- Quantity formatting
- Item/monster linking
- Compact vs expanded modes

**Files with Pattern:** `GiftRewards.js`, `AdventureRewards.js`, `PromptSubmissionModal.js`, `GardenHarvest.js`, `RewardsDisplay.js`

---

### Medium Priority - Layout & Structure

#### FormSection
**Purpose:** Grouped form fields with title

```jsx
<FormSection title="Basic Information" description="Optional help text">
  <FormInput ... />
  <FormSelect ... />
</FormSection>
```

---

#### TwoColumnLayout
**Purpose:** Common detail page layout

```jsx
<TwoColumnLayout
  sidebar={<ProfileImage />}
  main={<MainContent />}
  sidebarWidth="40%"
  stickyHeader={boolean}
/>
```

---

#### TabContainer
**Purpose:** Formal tabbed interface

```jsx
<TabContainer
  tabs={[
    { id: 'info', label: 'Information', content: <InfoTab /> },
    { id: 'stats', label: 'Statistics', content: <StatsTab /> }
  ]}
  defaultTab="info"
  onChange={handler}
/>
```

---

#### BreadcrumbNav
**Purpose:** Hierarchical navigation

```jsx
<BreadcrumbNav
  items={[
    { label: 'Admin', href: '/admin' },
    { label: 'Monsters', href: '/admin/monsters' },
    { label: 'Edit Monster' }
  ]}
/>
```

---

#### ConfirmModal
**Purpose:** Simple yes/no confirmation

```jsx
<ConfirmModal
  isOpen={boolean}
  title="Delete Monster?"
  message="This action cannot be undone."
  confirmLabel="Delete"
  confirmVariant="danger"
  onConfirm={handler}
  onCancel={handler}
/>
```

---

#### InfoModal
**Purpose:** Read-only information display

```jsx
<InfoModal
  isOpen={boolean}
  title="Item Details"
  onClose={handler}
>
  <ItemDetails item={item} />
</InfoModal>
```

---

#### MultiStepModal
**Purpose:** Wizard-style modal

```jsx
<MultiStepModal
  isOpen={boolean}
  steps={[
    { id: 'select', label: 'Select', component: <Step1 /> },
    { id: 'confirm', label: 'Confirm', component: <Step2 /> }
  ]}
  currentStep={stepId}
  onStepChange={handler}
  onComplete={handler}
  onClose={handler}
/>
```

---

### Lower Priority - Enhancements

#### ImageWithFallback
**Purpose:** Image with error handling

```jsx
<ImageWithFallback
  src={url}
  fallback="/images/default.png"
  alt="Description"
  onClick={handler}
  expandable={boolean}
/>
```

---

#### StatDisplay
**Purpose:** Label + value pairs

```jsx
<StatDisplay
  items={[
    { label: 'Level', value: 35, icon: '⭐' },
    { label: 'HP', value: 120, color: 'green' }
  ]}
  layout="horizontal|vertical|grid"
  columns={2}
/>
```

---

#### InfoTooltip
**Purpose:** Hover information

```jsx
<InfoTooltip content="Detailed explanation here">
  <span>Hover me</span>
</InfoTooltip>
```

---

## 5. Shared Constants & Utilities

### Create: `constants/colorMappings.js`

```javascript
export const TYPE_COLORS = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
  // Custom types
  cosmic: '#9B59B6',
  digital: '#3498DB',
  // ... etc
};

export const ATTRIBUTE_COLORS = {
  virus: '#FF6961',
  vaccine: '#4CAF50',
  data: '#2196F3',
  free: '#9E9E9E',
};

export const DIFFICULTY_COLORS = {
  easy: '#4CAF50',
  medium: '#FF9800',
  hard: '#f44336',
  expert: '#9C27B0',
};

export const RARITY_COLORS = {
  common: '#9E9E9E',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  'ultra-rare': '#9C27B0',
  legendary: '#FFD700',
};

// Helper functions
export const getTypeColor = (type) => TYPE_COLORS[type?.toLowerCase()] || '#999';
export const getAttributeColor = (attr) => ATTRIBUTE_COLORS[attr?.toLowerCase()] || '#757575';
export const getDifficultyColor = (diff) => DIFFICULTY_COLORS[diff?.toLowerCase()] || '#999';
export const getRarityColor = (rarity) => RARITY_COLORS[rarity?.toLowerCase()] || '#999';
```

### Create: `constants/rewardIcons.js`

```javascript
export const REWARD_ICONS = {
  levels: '⭐',
  coins: '💰',
  item: '📦',
  monster: '🐾',
  berry: '🍓',
  experience: '✨',
  reputation: '🏆',
};

export const REWARD_LABELS = {
  levels: 'Level(s)',
  coins: 'Coins',
  item: 'Item',
  monster: 'Monster',
  berry: 'Berry',
  experience: 'XP',
  reputation: 'Reputation',
};
```

### Create: `hooks/useAsyncState.js`

```javascript
// Unified loading/error/success state management
export function useAsyncState(initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const execute = async (asyncFn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(null);
  };

  return { data, loading, error, success, setSuccess, execute, reset, setData };
}
```

### Create: `hooks/usePagination.js`

```javascript
export function usePagination(fetchFn, { pageSize = 20, initialFilters = {} } = {}) {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPage();
  }, [page, filters]);

  const loadPage = async () => {
    setLoading(true);
    try {
      const result = await fetchFn({ page, pageSize, ...filters });
      setItems(result.items);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    items, page, totalPages, loading, error, filters,
    setPage, setFilters, refresh: loadPage
  };
}
```

---

## 6. Implementation Priority

### Phase 1: Quick Wins (Low Effort, High Impact)

1. **Create `constants/colorMappings.js`**
   - Centralizes duplicated color logic
   - Update `TypeBadge.jsx`, `AttributeBadge.jsx`, `MonsterCard.js`, `PromptCard.js`

2. **Create `StateContainer` component**
   - Wraps existing LoadingSpinner, ErrorMessage, SuccessMessage
   - Reduces boilerplate in 20+ files

3. **Create `ActionButtonGroup` component**
   - Standardizes modal/form footers
   - Used in many modals and forms

### Phase 2: Core Components (Medium Effort, High Impact)

4. **Create `BaseCard` component**
   - Unifies card patterns
   - Refactor `MonsterCard`, `ItemCard`, `PromptCard` to use it

5. **Create `ListContainer` component**
   - Standardizes paginated lists
   - Refactor `TrainerList`, `PromptList`, `ArtGallery`

6. **Create `BadgeGroup` / `ColorBadge` components**
   - Uses centralized colors
   - Replace inline badge rendering

### Phase 3: Modal Variants (Medium Effort, Medium Impact)

7. **Create `ConfirmModal` component**
   - Simple confirmation dialogs

8. **Create `InfoModal` component**
   - Read-only detail views

9. **Create `MultiStepModal` component**
   - Wizard-style modals

### Phase 4: Layout Components (Higher Effort, Medium Impact)

10. **Create `TwoColumnLayout` component**
    - Detail page layouts

11. **Create `TabContainer` component**
    - Formal tabbed interfaces

12. **Create `BreadcrumbNav` component**
    - Hierarchical navigation

### Phase 5: Utility Components (Lower Priority)

13. **Create `RewardsList` / `RewardItem` components**
14. **Create `StatDisplay` component**
15. **Create `ImageWithFallback` component**
16. **Create custom hooks (`useAsyncState`, `usePagination`)**

---

## Component Consolidation Notes

### Files with Code Duplication to Address

| Pattern | Files | Action |
|---------|-------|--------|
| Type color mapping | `MonsterCard.js`, `PromptCard.js`, `TypeBadge.jsx`, `LeaderboardStats.js` | Extract to `colorMappings.js` |
| Loading/error state | 20+ files | Use `StateContainer` |
| Card structure | `MonsterCard.js`, `ItemCard.js`, `PromptCard.js` | Refactor to `BaseCard` |
| Pagination + filters | `TrainerList.js`, `PromptList.js`, `ArtGallery.js` | Use `ListContainer` |
| File upload logic | `FileUpload.js`, `BackendFileUpload.js` | Extract common logic |
| Reward display | `GiftRewards.js`, `RewardsDisplay.js`, `PromptSubmissionModal.js` | Use `RewardsList` |

### Components That Could Be Merged

| Current | Merge Into | Reason |
|---------|------------|--------|
| `Pagination.js` + `Pagination.jsx` | Single `Pagination.js` | Duplicate implementations |
| `TrainerSelector` + `TrainerAutocomplete` | Single `TrainerAutocomplete` | Overlapping functionality |
| `FileUpload` + `BackendFileUpload` | `FileUpload` with `endpoint` prop | Similar structure |

---

## CSS Architecture Notes

### Related Style Files

| Component Area | CSS File |
|----------------|----------|
| Containers/Grid | `styles/common/containers.css` |
| Buttons | `styles/common/buttons.css` |
| Badges | `styles/common/badges.css` |
| Forms | `styles/common/FormComponents.css` |
| Modals | `styles/common/ModalComponents.css` |
| Cards | `styles/monster/cards.css` |
| Images | `styles/common/images.css` |

### CSS Variables to Consider

Many components would benefit from CSS custom properties for:
- Card border radius
- Card shadow levels
- Badge sizing
- Spacing scale
- Color themes

---

*Document generated from codebase audit. Last updated: February 2026*
