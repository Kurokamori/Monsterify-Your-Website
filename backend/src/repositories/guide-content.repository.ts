import { BaseRepository } from './base.repository';
import { db } from '../database';
import type {
  DirectoryStructure,
  DirectoryNode,
  DirectoryFile,
} from '../utils/markdownUtils';

// =============================================================================
// Row / Domain Types
// =============================================================================

export type GuideContentRow = {
  id: number;
  category: string;
  path: string;
  title: string;
  content: string;
  metadata: Record<string, string>;
  is_overview: boolean;
  sort_order: number;
  parent_path: string;
  created_at: Date;
  updated_at: Date;
};

export type GuideContent = {
  id: number;
  category: string;
  path: string;
  title: string;
  content: string;
  metadata: Record<string, string>;
  isOverview: boolean;
  sortOrder: number;
  parentPath: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GuideContentCreateInput = {
  category: string;
  path: string;
  title: string;
  content: string;
  metadata?: Record<string, string>;
  isOverview?: boolean;
  sortOrder?: number;
  parentPath: string;
};

export type GuideContentUpdateInput = {
  title?: string;
  content?: string;
  metadata?: Record<string, string>;
  sortOrder?: number;
};

// =============================================================================
// Normalizer
// =============================================================================

const normalize = (row: GuideContentRow): GuideContent => ({
  id: row.id,
  category: row.category,
  path: row.path,
  title: row.title,
  content: row.content,
  metadata: row.metadata,
  isOverview: row.is_overview,
  sortOrder: row.sort_order,
  parentPath: row.parent_path,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// =============================================================================
// Repository
// =============================================================================

export class GuideContentRepository extends BaseRepository<
  GuideContent,
  GuideContentCreateInput,
  GuideContentUpdateInput
> {
  constructor() {
    super('guide_contents');
  }

  // ===========================================================================
  // Core CRUD
  // ===========================================================================

  override async findById(id: number): Promise<GuideContent | null> {
    const row = await db.maybeOne<GuideContentRow>(
      'SELECT * FROM guide_contents WHERE id = $1',
      [id],
    );
    return row ? normalize(row) : null;
  }

  async findByPath(category: string, path: string): Promise<GuideContent | null> {
    const row = await db.maybeOne<GuideContentRow>(
      'SELECT * FROM guide_contents WHERE category = $1 AND path = $2',
      [category, path],
    );
    return row ? normalize(row) : null;
  }

  async findOverview(category: string, parentPath: string): Promise<GuideContent | null> {
    const row = await db.maybeOne<GuideContentRow>(
      'SELECT * FROM guide_contents WHERE category = $1 AND parent_path = $2 AND is_overview = true',
      [category, parentPath],
    );
    return row ? normalize(row) : null;
  }

  async findByCategory(category: string): Promise<GuideContent[]> {
    const rows = await db.many<GuideContentRow>(
      'SELECT * FROM guide_contents WHERE category = $1 ORDER BY parent_path, sort_order DESC, title',
      [category],
    );
    return rows.map(normalize);
  }

  override async create(input: GuideContentCreateInput): Promise<GuideContent> {
    const row = await db.one<GuideContentRow>(
      `INSERT INTO guide_contents (category, path, title, content, metadata, is_overview, sort_order, parent_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.category,
        input.path,
        input.title,
        input.content,
        JSON.stringify(input.metadata ?? {}),
        input.isOverview ?? false,
        input.sortOrder ?? 0,
        input.parentPath,
      ],
    );
    return normalize(row);
  }

  override async update(id: number, input: GuideContentUpdateInput): Promise<GuideContent> {
    const updates: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [];

    if (input.title !== undefined) {
      values.push(input.title);
      updates.push(`title = $${values.length}`);
    }
    if (input.content !== undefined) {
      values.push(input.content);
      updates.push(`content = $${values.length}`);
    }
    if (input.metadata !== undefined) {
      values.push(JSON.stringify(input.metadata));
      updates.push(`metadata = $${values.length}`);
    }
    if (input.sortOrder !== undefined) {
      values.push(input.sortOrder);
      updates.push(`sort_order = $${values.length}`);
    }

    values.push(id);
    const row = await db.one<GuideContentRow>(
      `UPDATE guide_contents SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values,
    );
    return normalize(row);
  }

  override async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM guide_contents WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async deleteByCategoryAndPath(category: string, path: string): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM guide_contents WHERE category = $1 AND path = $2',
      [category, path],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async deleteByParentPathPrefix(category: string, prefix: string): Promise<number> {
    // Delete the overview for this directory + all children
    const result = await db.query(
      `DELETE FROM guide_contents
       WHERE category = $1 AND (parent_path = $2 OR parent_path LIKE $3)`,
      [category, prefix, `${prefix}/%`],
    );
    return result.rowCount ?? 0;
  }

  async existsByParentPath(category: string, parentPath: string): Promise<boolean> {
    const row = await db.maybeOne<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM guide_contents WHERE category = $1 AND parent_path = $2) AS exists',
      [category, parentPath],
    );
    return row?.exists ?? false;
  }

  // ===========================================================================
  // Sort Order
  // ===========================================================================

  /**
   * Get all sortable items at a given directory level:
   * - Non-overview files with this parent_path
   * - One entry per immediate child directory (overview if exists, otherwise a synthetic entry)
   * Used by the admin sort order editor.
   */
  async getItemsAtLevel(category: string, parentPath: string): Promise<GuideContent[]> {
    const allInCategory = await this.findByCategory(category);

    const results: GuideContent[] = [];

    // Files at this level (non-overview)
    for (const entry of allInCategory) {
      if (entry.parentPath === parentPath && !entry.isOverview) {
        results.push(entry);
      }
    }

    // Discover immediate child directories from all entries' parentPath values
    const childDirPaths = new Set<string>();
    for (const entry of allInCategory) {
      if (!entry.parentPath || entry.parentPath === parentPath) {continue;}

      // Extract the immediate child dir portion
      let immediateChild: string | null = null;
      if (parentPath === '') {
        // Root level: first path segment
        const firstSlash = entry.parentPath.indexOf('/');
        immediateChild = firstSlash === -1 ? entry.parentPath : entry.parentPath.slice(0, firstSlash);
      } else if (entry.parentPath.startsWith(parentPath + '/')) {
        // Nested: next segment after parentPath/
        const rest = entry.parentPath.slice(parentPath.length + 1);
        const nextSlash = rest.indexOf('/');
        immediateChild = nextSlash === -1 ? rest : rest.slice(0, nextSlash);
        if (immediateChild) {
          immediateChild = parentPath + '/' + immediateChild;
        }
      }

      if (immediateChild) {
        childDirPaths.add(immediateChild);
      }
    }

    // For each child dir, use its overview entry if it exists;
    // otherwise auto-create a minimal overview row so we have a real ID for sort ordering
    for (const dirPath of childDirPaths) {
      const overview = allInCategory.find(
        e => e.parentPath === dirPath && e.isOverview,
      );
      if (overview) {
        results.push(overview);
      } else {
        const dirName = dirPath.split('/').pop() ?? dirPath;
        const created = await this.create({
          category,
          path: `${dirPath}/overview.md`,
          title: dirName,
          content: `# ${dirName}`,
          isOverview: true,
          parentPath: dirPath,
        });
        results.push(created);
      }
    }

    // Sort by current sort_order then title
    results.sort((a, b) => {
      if (a.sortOrder > 0 && b.sortOrder > 0) {return a.sortOrder - b.sortOrder;}
      if (a.sortOrder > 0) {return -1;}
      if (b.sortOrder > 0) {return 1;}
      return a.title.localeCompare(b.title);
    });

    return results;
  }

  async updateSortOrder(id: number, sortOrder: number): Promise<void> {
    await db.query(
      'UPDATE guide_contents SET sort_order = $1, updated_at = NOW() WHERE id = $2',
      [sortOrder, id],
    );
  }

  async bulkUpdateSortOrders(updates: { id: number; sortOrder: number }[]): Promise<void> {
    for (const { id, sortOrder } of updates) {
      await db.query(
        'UPDATE guide_contents SET sort_order = $1, updated_at = NOW() WHERE id = $2',
        [sortOrder, id],
      );
    }
  }

  // ===========================================================================
  // Search
  // ===========================================================================

  async search(
    query: string,
    categories: string[],
    maxResults = 50,
  ): Promise<GuideContent[]> {
    const rows = await db.many<GuideContentRow>(
      `SELECT * FROM guide_contents
       WHERE category = ANY($1)
         AND (content ILIKE $2 OR title ILIKE $2)
       ORDER BY category, parent_path, sort_order DESC, title
       LIMIT $3`,
      [categories, `%${query}%`, maxResults],
    );
    return rows.map(normalize);
  }

  // ===========================================================================
  // Directory Structure Builder
  // ===========================================================================

  async buildDirectoryStructure(category: string): Promise<DirectoryStructure | null> {
    const entries = await this.findByCategory(category);
    if (entries.length === 0) {return null;}

    return buildTreeFromEntries(entries);
  }
}

// =============================================================================
// Tree Builder (pure function)
// =============================================================================

// Intermediate type for unified sorting of dirs and files
type SortableItem =
  | { kind: 'directory'; dirPath: string; sortOrder: number; name: string }
  | { kind: 'file'; entry: GuideContent };

function buildTreeFromEntries(entries: GuideContent[]): DirectoryStructure {
  // Collect all unique directory paths and their overview titles + sort orders
  const dirOverviewTitles = new Map<string, string>();
  const dirSortOrders = new Map<string, number>();
  for (const entry of entries) {
    if (entry.isOverview) {
      dirOverviewTitles.set(entry.parentPath, entry.title);
      if (entry.sortOrder > 0) {
        dirSortOrders.set(entry.parentPath, entry.sortOrder);
      }
    }
  }

  // Collect all unique parent paths (including intermediate dirs)
  const allDirPaths = new Set<string>();
  for (const entry of entries) {
    if (entry.parentPath) {
      const parts = entry.parentPath.split('/');
      for (let i = 1; i <= parts.length; i++) {
        allDirPaths.add(parts.slice(0, i).join('/'));
      }
    }
  }

  function buildLevel(parentPath: string): DirectoryStructure {
    const result: DirectoryStructure = {
      directories: [],
      files: [],
      items: [],
    };

    // Find immediate child directories
    const childDirs: string[] = [];
    for (const dirPath of allDirPaths) {
      const parts = dirPath.split('/');
      if (parentPath === '') {
        if (parts.length === 1) {childDirs.push(dirPath);}
      } else {
        if (dirPath.startsWith(parentPath + '/') && parts.length === parentPath.split('/').length + 1) {
          childDirs.push(dirPath);
        }
      }
    }

    // Find immediate child files (non-overview entries at this parent level)
    const childFiles = entries.filter(
      e => e.parentPath === parentPath && !e.isOverview,
    );

    // Build unified sortable items list
    const sortableItems: SortableItem[] = [];

    for (const dirPath of childDirs) {
      const dirName = dirPath.split('/').pop() ?? dirPath;
      sortableItems.push({
        kind: 'directory',
        dirPath,
        sortOrder: dirSortOrders.get(dirPath) ?? 0,
        name: dirOverviewTitles.get(dirPath) ?? dirName,
      });
    }

    for (const entry of childFiles) {
      sortableItems.push({ kind: 'file', entry });
    }

    // Unified sort: items with sort_order > 0 first (ascending), then alphabetical
    sortableItems.sort((a, b) => {
      const aOrder = a.kind === 'directory' ? a.sortOrder : a.entry.sortOrder;
      const bOrder = b.kind === 'directory' ? b.sortOrder : b.entry.sortOrder;

      if (aOrder > 0 && bOrder > 0) {return aOrder - bOrder;}
      if (aOrder > 0) {return -1;}
      if (bOrder > 0) {return 1;}

      const aName = a.kind === 'directory' ? a.name : a.entry.title;
      const bName = b.kind === 'directory' ? b.name : b.entry.title;
      return aName.localeCompare(bName);
    });

    // Build the result from the sorted unified list
    for (const item of sortableItems) {
      if (item.kind === 'directory') {
        const dirName = item.dirPath.split('/').pop() ?? item.dirPath;
        const displayName = dirOverviewTitles.get(item.dirPath) ?? dirName;
        const url = parentPath ? `${parentPath}/${dirName}` : dirName;

        const dirNode: DirectoryNode = {
          name: displayName,
          path: dirName,
          url: url.replace(/\\/g, '/'),
          children: buildLevel(item.dirPath),
        };
        result.directories.push(dirNode);
        result.items.push({ type: 'directory', ...dirNode });
      } else {
        const fileName = item.entry.path.split('/').pop() ?? item.entry.path;
        const url = item.entry.path.replace(/\.md$/, '').replace(/\\/g, '/');

        const fileEntry: DirectoryFile = {
          name: item.entry.title,
          path: fileName,
          url,
        };
        result.files.push(fileEntry);
        result.items.push({ type: 'file', ...fileEntry });
      }
    }

    return result;
  }

  return buildLevel('');
}
