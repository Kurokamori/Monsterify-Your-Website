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
