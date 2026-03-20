import { Request, Response } from 'express';
import { UserService } from '../../services/user.service';
import { db } from '../../database';

const userService = new UserService();

// =============================================================================
// Admin User CRUD
// =============================================================================

export async function getAdminUsers(req: Request, res: Response): Promise<void> {
  try {
    const {
      search,
      sortBy = 'id',
      sortOrder = 'asc',
      page = '1',
      limit = '20',
    } = req.query as Record<string, string | undefined>;

    const result = await userService.getAdminUserList({
      search: search ?? undefined,
      sortBy,
      sortOrder: sortOrder === 'desc' ? 'desc' : 'asc',
      page: Math.max(1, parseInt(page ?? '1', 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20)),
    });

    res.json({
      success: true,
      users: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error getting admin user list:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting users',
    });
  }
}

export async function getAllUsers(_req: Request, res: Response): Promise<void> {
  try {
    const users = await userService.getAll();

    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        discord_id: user.discord_id,
        is_admin: user.is_admin,
        created_at: user.created_at,
      })),
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting users',
    });
  }
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const user = await userService.findById(id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        discord_id: user.discord_id,
        is_admin: user.is_admin,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error(`Error getting user with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting user',
    });
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { username, display_name, discord_id, password, is_admin } = req.body as {
      username?: string;
      display_name?: string;
      discord_id?: string;
      password?: string;
      is_admin?: boolean;
    };

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
      return;
    }

    const user = await userService.createUser(username, password, {
      displayName: display_name,
      discordId: discord_id,
      isAdmin: is_admin,
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        discord_id: user.discord_id,
        is_admin: user.is_admin,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);

    if (error instanceof Error && (error.message === 'Username already exists' || error.message === 'Display name is already taken' || error.message === 'An account with this Discord ID already exists')) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating user',
    });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);
    const { username, display_name, discord_id, password, is_admin } = req.body as {
      username?: string;
      display_name?: string;
      discord_id?: string;
      password?: string;
      is_admin?: boolean;
    };

    if (!username) {
      res.status(400).json({ success: false, message: 'Username is required' });
      return;
    }

    const user = await userService.update(id, {
      username,
      displayName: display_name,
      discordId: discord_id,
      password,
      isAdmin: is_admin,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        discord_id: user.discord_id,
        is_admin: user.is_admin,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error(`Error updating user with ID ${req.params.id}:`, error);

    if (error instanceof Error && (error.message === 'Username already exists' || error.message === 'Display name is already taken' || error.message === 'An account with this Discord ID already exists')) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating user',
    });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id as string);

    const user = await userService.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (req.user && id === req.user.id) {
      res.status(400).json({ success: false, message: 'You cannot delete your own account' });
      return;
    }

    await userService.delete(id);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(`Error deleting user with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user',
    });
  }
}

// =============================================================================
// Public User Profiles
// =============================================================================

export async function getPublicUserProfile(req: Request, res: Response): Promise<void> {
  try {
    const idParam = req.params.id as string;
    const numericId = parseInt(idParam);

    // Try numeric user ID first, then fall back to discord ID lookup
    let profile = !isNaN(numericId) && String(numericId) === idParam
      ? await userService.getPublicProfile(numericId)
      : null;
    profile ??= await userService.getPublicProfileByDiscordId(idParam);

    if (!profile) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, profile });
  } catch (error) {
    console.error('Error getting public user profile:', error);
    res.status(500).json({ success: false, message: 'Server error while getting user profile' });
  }
}

async function resolveUser(idParam: string) {
  const numericId = parseInt(idParam);
  if (!isNaN(numericId) && String(numericId) === idParam) {
    return userService.findById(numericId);
  }
  // Treat as discord_id
  const row = await userService.findByDiscordId(idParam);
  if (!row) {
    return null;
  }
  return userService.findById(row.id);
}

export async function getUserProfileSubmissions(req: Request, res: Response): Promise<void> {
  try {
    const idParam = req.params.id as string;
    const user = await resolveUser(idParam);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const {
      page = '1',
      limit = '20',
      type,
      sort = 'newest',
      showMature,
      matureFilters,
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit || '20', 10)));
    const offset = (pageNum - 1) * limitNum;

    // Build mature content filter
    let matureClause = '';
    if (showMature !== 'true') {
      matureClause = `AND (s.is_mature::boolean IS NOT TRUE)`;
    } else if (matureFilters) {
      try {
        const filters = JSON.parse(matureFilters);
        const enabledTypes: string[] = [];
        if (filters.gore) { enabledTypes.push(`(s.content_rating->>'gore')::boolean = true`); }
        if (filters.nsfw_light) { enabledTypes.push(`(s.content_rating->>'nsfw_light')::boolean = true`); }
        if (filters.nsfw_heavy) { enabledTypes.push(`(s.content_rating->>'nsfw_heavy')::boolean = true`); }
        if (filters.triggering) { enabledTypes.push(`(s.content_rating->>'triggering')::boolean = true`); }
        if (filters.intense_violence) { enabledTypes.push(`(s.content_rating->>'intense_violence')::boolean = true`); }

        if (enabledTypes.length === 0) {
          matureClause = `AND (s.is_mature::boolean IS NOT TRUE)`;
        } else {
          matureClause = `AND (s.is_mature::boolean IS NOT TRUE OR s.content_rating IS NULL OR ${enabledTypes.join(' OR ')})`;
        }
      } catch {
        matureClause = `AND (s.is_mature::boolean IS NOT TRUE)`;
      }
    }

    // Build type filter
    let typeClause = '';
    if (type === 'art') {
      typeClause = `AND s.submission_type = 'art'`;
    } else if (type === 'writing') {
      typeClause = `AND s.submission_type = 'writing'`;
    }

    // Build user matching - match by discord_id or user id
    const userConditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (user.discord_id) {
      userConditions.push(`s.user_id::text = $${paramIdx}`);
      params.push(user.discord_id);
      paramIdx++;
    }
    userConditions.push(`s.user_id::text = $${paramIdx}`);
    params.push(String(user.id));
    paramIdx++;

    const userClause = `(${userConditions.join(' OR ')})`;

    const sortClause = sort === 'oldest' ? 'ASC' : 'DESC';

    // Count query
    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*)::int as count FROM submissions s WHERE ${userClause} AND s.parent_id IS NULL ${typeClause} ${matureClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    // Data query
    const dataParams = [...params, limitNum, offset];
    const result = await db.query(
      `SELECT
        s.id, s.title, s.description, s.submission_type, s.submission_date, s.is_book, s.is_mature, s.content_rating,
        u.display_name, u.username,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main::boolean = true LIMIT 1) as image_url,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main::boolean = true LIMIT 1) as cover_image_url,
        (SELECT COUNT(*) FROM submissions WHERE parent_id = s.id) as chapter_count
      FROM submissions s
      LEFT JOIN users u ON s.user_id::text = u.discord_id OR s.user_id::text = u.id::text
      WHERE ${userClause} AND s.parent_id IS NULL ${typeClause} ${matureClause}
      ORDER BY s.submission_date ${sortClause}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      dataParams
    );

    res.json({
      success: true,
      submissions: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error getting user profile submissions:', error);
    res.status(500).json({ success: false, message: 'Failed to get user submissions' });
  }
}

export async function getUserProfileTrainers(req: Request, res: Response): Promise<void> {
  try {
    const idParam = req.params.id as string;
    const user = await resolveUser(idParam);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const userConditions: string[] = [];
    const params: unknown[] = [];

    if (user.discord_id) {
      userConditions.push(`t.player_user_id = $1`);
      params.push(user.discord_id);
      userConditions.push(`t.player_user_id = $2`);
      params.push(String(user.id));
    } else {
      userConditions.push(`t.player_user_id = $1`);
      params.push(String(user.id));
    }

    const result = await db.query(
      `SELECT
        t.id, t.name, t.nickname, t.level, t.faction,
        t.species1, t.species2, t.species3,
        t.type1, t.type2, t.type3, t.type4, t.type5, t.type6,
        t.main_ref, t.icon,
        (SELECT COUNT(*)::int FROM monsters WHERE trainer_id = t.id) as monster_count,
        u.display_name as player_display_name, u.username as player_username
      FROM trainers t
      LEFT JOIN users u ON t.player_user_id = u.discord_id OR t.player_user_id = u.id::text
      WHERE ${userConditions.join(' OR ')}
      ORDER BY t.level DESC, t.name ASC`,
      params
    );

    res.json({ success: true, trainers: result.rows });
  } catch (error) {
    console.error('Error getting user profile trainers:', error);
    res.status(500).json({ success: false, message: 'Failed to get user trainers' });
  }
}

// =============================================================================
// Related Submissions (Public)
// =============================================================================

export async function getUserRelatedSubmissions(req: Request, res: Response): Promise<void> {
  try {
    const userId = parseInt(req.params.id as string);
    const { excludeId, contentType } = req.query as { excludeId?: string; contentType?: string };

    const conditions: string[] = ['s.user_id = $1', 's.parent_id IS NULL'];
    const params: unknown[] = [userId];
    let paramIndex = 2;

    if (excludeId) {
      conditions.push(`s.id != $${paramIndex}`);
      params.push(parseInt(excludeId));
      paramIndex++;
    }

    if (contentType && contentType !== 'all') {
      conditions.push(`s.submission_type = $${paramIndex}`);
      params.push(contentType);
      paramIndex++;
    }

    const query = `
      SELECT
        s.id,
        s.title,
        s.description,
        s.submission_type,
        s.submission_date,
        s.is_book,
        s.content,
        u.display_name,
        u.username,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main::boolean = true LIMIT 1) as image_url,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main::boolean = true LIMIT 1) as cover_image_url,
        (SELECT COUNT(*) FROM submissions WHERE parent_id = s.id) as chapter_count,
        (SELECT content FROM submissions WHERE parent_id = s.id ORDER BY chapter_number ASC, submission_date ASC LIMIT 1) as first_chapter_content
      FROM submissions s
      LEFT JOIN users u ON s.user_id::text = u.discord_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY s.submission_date DESC
      LIMIT $${paramIndex}
    `;
    params.push(6);

    const result = await db.query(query, params);

    res.json({
      success: true,
      submissions: result.rows,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting user related submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get related submissions',
      error: msg,
    });
  }
}
