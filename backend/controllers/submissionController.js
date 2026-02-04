const db = require('../config/db');
const Submission = require('../models/Submission');
const Trainer = require('../models/Trainer');
const Monster = require('../models/Monster');
const User = require('../models/User');
const cloudinary = require('../utils/cloudinary');

/**
 * Get art gallery submissions with pagination and filtering
 */
const getArtGallery = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const contentType = req.query.contentType;
    const tag = req.query.tag;
    const trainerId = req.query.trainerId;
    const userId = req.query.userId;
    const monsterId = req.query.monsterId;
    const sortBy = req.query.sort || 'newest';
    const search = req.query.search;

    // Build the query
    let query = `
      SELECT
        s.id,
        s.title,
        s.description,
        s.content_type,
        s.submission_type,
        s.submission_date,
        s.user_id,
        s.trainer_id,
        u.id as user_table_id,
        u.username,
        u.display_name,
        u.discord_id as user_discord_id,
        t.name as trainer_name,
        t.main_ref,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main = 1 LIMIT 1) as image_url,
        (SELECT json_agg(tag) FROM submission_tags WHERE submission_id = s.id) as tags,
        (SELECT json_agg(json_build_object(
           'id', m.id,
           'name', m.name,
           'species', (
             CASE
               WHEN m.species3 IS NOT NULL AND m.species3 != '' AND m.species2 IS NOT NULL AND m.species2 != ''
                 THEN m.species1 || '/' || m.species2 || '/' || m.species3
               WHEN m.species2 IS NOT NULL AND m.species2 != ''
                 THEN m.species1 || '/' || m.species2
               ELSE m.species1
             END
           ),
           'type', (
             CASE
               WHEN m.type5 IS NOT NULL AND m.type5 != '' AND m.type4 IS NOT NULL AND m.type4 != '' AND m.type3 IS NOT NULL AND m.type3 != '' AND m.type2 IS NOT NULL AND m.type2 != ''
                 THEN m.type1 || '/' || m.type2 || '/' || m.type3 || '/' || m.type4 || '/' || m.type5
               WHEN m.type4 IS NOT NULL AND m.type4 != '' AND m.type3 IS NOT NULL AND m.type3 != '' AND m.type2 IS NOT NULL AND m.type2 != ''
                 THEN m.type1 || '/' || m.type2 || '/' || m.type3 || '/' || m.type4
               WHEN m.type3 IS NOT NULL AND m.type3 != '' AND m.type2 IS NOT NULL AND m.type2 != ''
                 THEN m.type1 || '/' || m.type2 || '/' || m.type3
               WHEN m.type2 IS NOT NULL AND m.type2 != ''
                 THEN m.type1 || '/' || m.type2
               ELSE m.type1
             END
           ),
             'level', m.level,
           'attribute', m.attribute,
           'img_link', m.img_link
         ))
         FROM submission_monsters sm
         JOIN monsters m ON sm.monster_id = m.id
         WHERE sm.submission_id = s.id) as monsters
      FROM submissions s
      LEFT JOIN users u ON (s.user_id::text = u.discord_id OR s.user_id = u.id)
      LEFT JOIN trainers t ON s.trainer_id = t.id
      WHERE s.submission_type = 'art'
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Add content type filter
    if (contentType && contentType !== 'all') {
      query += ` AND s.content_type = $${paramIndex}`;
      queryParams.push(contentType);
      paramIndex++;
    }

    // Add tag filter
    if (tag) {
      query += ` AND EXISTS (SELECT 1 FROM submission_tags WHERE submission_id = s.id AND tag = $${paramIndex})`;
      queryParams.push(tag);
      paramIndex++;
    }

    // Add trainer filter
    if (trainerId) {
      query += ` AND s.trainer_id = $${paramIndex}`;
      queryParams.push(trainerId);
      paramIndex++;
    }

    // Add user filter
    if (userId) {
      query += ` AND s.user_id = $${paramIndex}`;
      queryParams.push(userId);
      paramIndex++;
    }

    // Add monster filter
    if (monsterId) {
      query += ` AND EXISTS (SELECT 1 FROM submission_monsters WHERE submission_id = s.id AND monster_id = $${paramIndex})`;
      queryParams.push(monsterId);
      paramIndex++;
    }

    // Add search filter (title search)
    if (search) {
      query += ` AND LOWER(s.title) LIKE LOWER($${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Add sorting
    if (sortBy === 'oldest') {
      query += ` ORDER BY s.submission_date ASC`;
    } else {
      // Default to newest
      query += ` ORDER BY s.submission_date DESC`;
    }

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    // Count total submissions for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM submissions s
      WHERE s.submission_type = 'art'
    `;

    // Add the same filters to the count query
    paramIndex = 1;
    const countParams = [];

    // Add content type filter
    if (contentType && contentType !== 'all') {
      countQuery += ` AND s.content_type = $${paramIndex}`;
      countParams.push(contentType);
      paramIndex++;
    }

    // Add tag filter
    if (tag) {
      countQuery += ` AND EXISTS (SELECT 1 FROM submission_tags WHERE submission_id = s.id AND tag = $${paramIndex})`;
      countParams.push(tag);
      paramIndex++;
    }

    // Add trainer filter
    if (trainerId) {
      countQuery += ` AND s.trainer_id = $${paramIndex}`;
      countParams.push(trainerId);
      paramIndex++;
    }

    // Add user filter
    if (userId) {
      countQuery += ` AND s.user_id = $${paramIndex}`;
      countParams.push(userId);
      paramIndex++;
    }

    // Add monster filter
    if (monsterId) {
      countQuery += ` AND EXISTS (SELECT 1 FROM submission_monsters WHERE submission_id = s.id AND monster_id = $${paramIndex})`;
      countParams.push(monsterId);
      paramIndex++;
    }

    // Add search filter to count query (title search)
    if (search) {
      countQuery += ` AND LOWER(s.title) LIKE LOWER($${paramIndex})`;
      countParams.push(`%${search}%`);
      paramIndex++;
    }

    // Execute the queries
    const [submissions, countResult] = await Promise.all([
      db.asyncAll(query, queryParams),
      db.asyncAll(countQuery, countParams)
    ]);

    // Debug logging
    console.log('Art gallery query results:');
    submissions.slice(0, 3).forEach((sub, index) => {
      console.log(`Submission ${index + 1}:`, {
        id: sub.id,
        title: sub.title,
        user_id: sub.user_id,
        user_table_id: sub.user_table_id,
        username: sub.username,
        display_name: sub.display_name,
        user_discord_id: sub.user_discord_id,
        joinWorked: !!sub.user_table_id
      });
    });

    const total = parseInt(countResult[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      submissions,
      page,
      totalPages,
      totalSubmissions: total
    });
  } catch (error) {
    console.error('Error fetching art gallery:', error);
    res.status(500).json({ error: 'Failed to fetch art gallery' });
  }
};

/**
 * Get writing library submissions with pagination and filtering
 */
const getWritingLibrary = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const contentType = req.query.contentType;
    const tag = req.query.tag;
    const trainerId = req.query.trainerId;
    const userId = req.query.userId;
    const monsterId = req.query.monsterId;
    const sortBy = req.query.sort || 'newest';
    const booksOnly = req.query.booksOnly === 'true';
    const excludeChapters = req.query.excludeChapters === 'true';

    // Build the query
    let query = `
      SELECT
        s.id,
        s.title,
        s.description,
        s.content_type,
        s.submission_type,
        s.submission_date,
        s.user_id,
        s.trainer_id,
        s.is_book,
        s.parent_id,
        u.username,
        u.display_name,
        t.name as trainer_name,
        t.main_ref,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main = 1 LIMIT 1) as cover_image_url,
        (SELECT json_agg(tag) FROM submission_tags WHERE submission_id = s.id) as tags,
        (SELECT json_agg(json_build_object(
           'id', m.id,
           'name', m.name,
           'species', (
             CASE
               WHEN m.species3 IS NOT NULL AND m.species3 != '' AND m.species2 IS NOT NULL AND m.species2 != ''
                 THEN m.species1 || '/' || m.species2 || '/' || m.species3
               WHEN m.species2 IS NOT NULL AND m.species2 != ''
                 THEN m.species1 || '/' || m.species2
               ELSE m.species1
             END
           ),
           'type', (
             CASE
               WHEN m.type5 IS NOT NULL AND m.type5 != '' AND m.type4 IS NOT NULL AND m.type4 != '' AND m.type3 IS NOT NULL AND m.type3 != '' AND m.type2 IS NOT NULL AND m.type2 != ''
                 THEN m.type1 || '/' || m.type2 || '/' || m.type3 || '/' || m.type4 || '/' || m.type5
               WHEN m.type4 IS NOT NULL AND m.type4 != '' AND m.type3 IS NOT NULL AND m.type3 != '' AND m.type2 IS NOT NULL AND m.type2 != ''
                 THEN m.type1 || '/' || m.type2 || '/' || m.type3 || '/' || m.type4
               WHEN m.type3 IS NOT NULL AND m.type3 != '' AND m.type2 IS NOT NULL AND m.type2 != ''
                 THEN m.type1 || '/' || m.type2 || '/' || m.type3
               WHEN m.type2 IS NOT NULL AND m.type2 != ''
                 THEN m.type1 || '/' || m.type2
               ELSE m.type1
             END
           ),
             'level', m.level,
           'attribute', m.attribute,
           'img_link', m.img_link
         ))
         FROM submission_monsters sm
         JOIN monsters m ON sm.monster_id = m.id
         WHERE sm.submission_id = s.id) as monsters,
        (SELECT COUNT(*) FROM submissions WHERE parent_id = s.id) as chapter_count,
        (LENGTH(s.content) - LENGTH(REPLACE(s.content, ' ', '')) + 1) as word_count,
        LEFT(s.content, 400) as content_preview
      FROM submissions s
      LEFT JOIN users u ON (s.user_id::text = u.discord_id OR s.user_id = u.id)
      LEFT JOIN trainers t ON s.trainer_id = t.id
      WHERE s.submission_type = 'writing'
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Add content type filter
    if (contentType && contentType !== 'all') {
      query += ` AND s.content_type = $${paramIndex}`;
      queryParams.push(contentType);
      paramIndex++;
    }

    // Add tag filter
    if (tag) {
      query += ` AND EXISTS (SELECT 1 FROM submission_tags WHERE submission_id = s.id AND tag = $${paramIndex})`;
      queryParams.push(tag);
      paramIndex++;
    }

    // Add trainer filter
    if (trainerId) {
      query += ` AND s.trainer_id = $${paramIndex}`;
      queryParams.push(trainerId);
      paramIndex++;
    }

    // Add user filter
    if (userId) {
      query += ` AND s.user_id = $${paramIndex}`;
      queryParams.push(userId);
      paramIndex++;
    }

    // Add monster filter
    if (monsterId) {
      query += ` AND EXISTS (SELECT 1 FROM submission_monsters WHERE submission_id = s.id AND monster_id = $${paramIndex})`;
      queryParams.push(monsterId);
      paramIndex++;
    }

    // Add books only filter
    if (booksOnly) {
      query += ` AND s.is_book = 1`;
    }

    // Exclude chapters (items with a parent_id) from main listing
    if (excludeChapters) {
      query += ` AND s.parent_id IS NULL`;
    }

    // Hide empty books (0 chapters) from non-owners
    if (req.user) {
      const currentUserId = req.user.discord_id || req.user.id;
      query += ` AND (
        s.is_book = 0 OR s.is_book IS NULL
        OR (SELECT COUNT(*) FROM submissions WHERE parent_id = s.id) > 0
        OR s.user_id::text = $${paramIndex}::text
      )`;
      queryParams.push(currentUserId);
      paramIndex++;
    } else {
      query += ` AND (
        s.is_book = 0 OR s.is_book IS NULL
        OR (SELECT COUNT(*) FROM submissions WHERE parent_id = s.id) > 0
      )`;
    }

    // Add sorting
    if (sortBy === 'oldest') {
      query += ` ORDER BY s.submission_date ASC`;
    } else {
      // Default to newest
      query += ` ORDER BY s.submission_date DESC`;
    }

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    // Count total submissions for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM submissions s
      WHERE s.submission_type = 'writing'
    `;

    // Add the same filters to the count query
    paramIndex = 1;
    const countParams = [];

    // Add content type filter
    if (contentType && contentType !== 'all') {
      countQuery += ` AND s.content_type = $${paramIndex}`;
      countParams.push(contentType);
      paramIndex++;
    }

    // Add tag filter
    if (tag) {
      countQuery += ` AND EXISTS (SELECT 1 FROM submission_tags WHERE submission_id = s.id AND tag = $${paramIndex})`;
      countParams.push(tag);
      paramIndex++;
    }

    // Add trainer filter
    if (trainerId) {
      countQuery += ` AND s.trainer_id = $${paramIndex}`;
      countParams.push(trainerId);
      paramIndex++;
    }

    // Add user filter
    if (userId) {
      countQuery += ` AND s.user_id = $${paramIndex}`;
      countParams.push(userId);
      paramIndex++;
    }

    // Add monster filter
    if (monsterId) {
      countQuery += ` AND EXISTS (SELECT 1 FROM submission_monsters WHERE submission_id = s.id AND monster_id = $${paramIndex})`;
      countParams.push(monsterId);
      paramIndex++;
    }

    // Add books only filter to count
    if (booksOnly) {
      countQuery += ` AND s.is_book = 1`;
    }

    // Exclude chapters from count
    if (excludeChapters) {
      countQuery += ` AND s.parent_id IS NULL`;
    }

    // Hide empty books (0 chapters) from non-owners in count
    if (req.user) {
      const currentUserIdForCount = req.user.discord_id || req.user.id;
      countQuery += ` AND (
        s.is_book = 0 OR s.is_book IS NULL
        OR (SELECT COUNT(*) FROM submissions WHERE parent_id = s.id) > 0
        OR s.user_id::text = $${paramIndex}::text
      )`;
      countParams.push(currentUserIdForCount);
      paramIndex++;
    } else {
      countQuery += ` AND (
        s.is_book = 0 OR s.is_book IS NULL
        OR (SELECT COUNT(*) FROM submissions WHERE parent_id = s.id) > 0
      )`;
    }

    // Execute the queries
    const [submissions, countResult] = await Promise.all([
      db.asyncAll(query, queryParams),
      db.asyncAll(countQuery, countParams)
    ]);

    const total = parseInt(countResult[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      submissions,
      page,
      totalPages,
      totalSubmissions: total
    });
  } catch (error) {
    console.error('Error fetching writing library:', error);
    res.status(500).json({ error: 'Failed to fetch writing library' });
  }
};

/**
 * Get submission tags
 */
const getSubmissionTags = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT tag
      FROM submission_tags
      ORDER BY tag ASC
    `;

    const tags = await db.asyncAll(query);

    res.json({
      tags: tags.map(t => t.tag)
    });
  } catch (error) {
    console.error('Error fetching submission tags:', error);
    res.status(500).json({ error: 'Failed to fetch submission tags' });
  }
};

/**
 * Get submission by ID
 */
const getSubmissionById = async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);

    // Get submission
    const query = `
      SELECT
        s.id,
        s.title,
        s.description,
        s.content_type,
        s.content,
        s.submission_date,
        s.user_id,
        s.trainer_id,
        s.is_book,
        s.parent_id,
        s.submission_type,
        u.username,
        u.display_name,
        t.name as trainer_name,
        t.main_ref
      FROM submissions s
      LEFT JOIN users u ON (s.user_id::text = u.discord_id OR s.user_id = u.id)
      LEFT JOIN trainers t ON s.trainer_id = t.id
      WHERE s.id = $1
    `;

    const submissions = await db.asyncAll(query, [submissionId]);

    if (!submissions.length) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submission = submissions[0];

    // Get submission images
    const imagesQuery = `
      SELECT id, image_url, is_main, order_index
      FROM submission_images
      WHERE submission_id = $1
      ORDER BY is_main DESC, order_index ASC
    `;

    const images = await db.asyncAll(imagesQuery, [submissionId]);

    // Get submission tags
    const tagsQuery = `
      SELECT tag
      FROM submission_tags
      WHERE submission_id = $1
      ORDER BY tag ASC
    `;

    const tags = await db.asyncAll(tagsQuery, [submissionId]);

    // Get associated monsters
    const monstersQuery = `
      SELECT
        m.id,
        m.name,
        m.species1,
        m.species2,
        m.species3,
        m.type1,
        m.type2,
        m.type3,
        m.type4,
        m.type5,
        m.level,
        m.attribute,
        m.trainer_id,
        m.img_link,
        t.name as trainer_name
      FROM submission_monsters sm
      JOIN monsters m ON sm.monster_id = m.id
      LEFT JOIN trainers t ON m.trainer_id = t.id
      WHERE sm.submission_id = $1
    `;

    const monsters = await db.asyncAll(monstersQuery, [submissionId]);

    const trainersQuery = `
      SELECT
        t.id,
        t.name,
        t.main_ref,
        t.species1,
        t.species2,
        t.species3,
        t.type1,
        t.type2,
        t.type3,
        t.type4,
        t.type5,
        t.type6
      FROM submission_trainers st
      JOIN trainers t ON st.trainer_id = t.id
      WHERE st.submission_id = $1
    `;

    const trainers = await db.asyncAll(trainersQuery, [submissionId]);

    // Get chapters if this is a book
    let chapters = [];
    if (submission.is_book) {
      const chaptersQuery = `
        SELECT
          id,
          title,
          description,
          submission_date
        FROM submissions
        WHERE parent_id = $1
        ORDER BY submission_date ASC
      `;

      chapters = await db.asyncAll(chaptersQuery, [submissionId]);
    }

    // Process monster data to combine species and types
    const processedMonsters = monsters.map(monster => {
      // Combine species fields
      const speciesArray = [monster.species1, monster.species2, monster.species3]
        .filter(species => species && species.trim() !== '');

      // Combine type fields
      const typeArray = [monster.type1, monster.type2, monster.type3, monster.type4, monster.type5]
        .filter(type => type && type.trim() !== '');

      return {
        id: monster.id,
        name: monster.name,
        species: speciesArray.join('/'),
        type: typeArray.join('/'),
        level: monster.level,
        attribute: monster.attribute,
        trainer_id: monster.trainer_id,
        trainer_name: monster.trainer_name,
        img_link: monster.img_link,
        // Include original fields for reference if needed
        species1: monster.species1,
        species2: monster.species2,
        species3: monster.species3,
        type1: monster.type1,
        type2: monster.type2,
        type3: monster.type3,
        type4: monster.type4,
        type5: monster.type5
      };
    });

    // Get the main image URL for easier access
    const mainImage = images.find(img => img.is_main) || images[0];
    const imageUrl = mainImage ? mainImage.image_url : null;

    res.json({
      success: true,
      submission: {
        ...submission,
        image_url: imageUrl,
        images,
        tags: tags.map(t => t.tag),
        monsters: processedMonsters,
        trainers,
        chapters
      }
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
};

/**
 * Calculate rewards for an art submission
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const calculateArtRewards = async (req, res) => {
  try {
    // Log the entire request body for debugging
    console.log('Art submission data received (raw):', JSON.stringify(req.body));

    // Create a copy of the request body to avoid modifying the original
    const requestData = { ...req.body };

    let {
      quality,
      backgroundType,
      backgrounds,
      uniquelyDifficult,
      trainers,
      monsters,
      npcs,
      isGift
    } = requestData;

    // Parse JSON strings if needed
    if (typeof trainers === 'string') {
      try {
        trainers = JSON.parse(trainers);
        console.log('Parsed trainers from string:', trainers);
      } catch (error) {
        console.error('Error parsing trainers JSON:', error);
        trainers = [];
      }
    }

    if (typeof monsters === 'string') {
      try {
        monsters = JSON.parse(monsters);
        console.log('Parsed monsters from string:', monsters);
      } catch (error) {
        console.error('Error parsing monsters JSON:', error);
        monsters = [];
      }
    }

    if (typeof npcs === 'string') {
      try {
        npcs = JSON.parse(npcs);
        console.log('Parsed npcs from string:', npcs);
      } catch (error) {
        console.error('Error parsing npcs JSON:', error);
        npcs = [];
      }
    }

    if (typeof backgrounds === 'string') {
      try {
        backgrounds = JSON.parse(backgrounds);
        console.log('Parsed backgrounds from string:', backgrounds);
      } catch (error) {
        console.error('Error parsing backgrounds JSON:', error);
        backgrounds = [{ type: 'none' }];
      }
    }

    // Log the content type of trainers and monsters
    console.log('Trainers type:', typeof trainers);
    console.log('Monsters type:', typeof monsters);
    console.log('Backgrounds type:', typeof backgrounds);

    if (typeof backgrounds === 'string') {
      try {
        backgrounds = JSON.parse(backgrounds);
      } catch (error) {
        console.error('Error parsing backgrounds JSON:', error);
        backgrounds = [];
      }
    }

    // Debug logging
    console.log('Art submission data received:');
    console.log(`- Quality: ${quality}`);
    console.log(`- Background Type: ${backgroundType}`);
    console.log(`- Backgrounds: ${JSON.stringify(backgrounds)}`);
    console.log(`- Uniquely Difficult: ${uniquelyDifficult}`);
    console.log(`- Trainers: ${JSON.stringify(trainers)}`);
    console.log(`- Monsters: ${JSON.stringify(monsters)}`);
    console.log(`- NPCs: ${JSON.stringify(npcs)}`);
    console.log(`- Is Gift: ${isGift}`);
    console.log(`- Use Static Rewards: ${req.body.useStaticRewards || false}`);

    // Validate required fields
    if (!quality) {
      return res.status(400).json({
        success: false,
        message: 'Quality is required'
      });
    }

    // Ensure trainers, monsters, and npcs are arrays
    const trainersArray = Array.isArray(trainers) ? trainers : [];
    const monstersArray = Array.isArray(monsters) ? monsters : [];
    const npcsArray = Array.isArray(npcs) ? npcs : [];

    console.log('Art rewards calculation - trainers:', JSON.stringify(trainersArray));
    console.log('Art rewards calculation - monsters:', JSON.stringify(monstersArray));
    console.log('Art rewards calculation - npcs:', JSON.stringify(npcsArray));
    console.log('Art rewards calculation - trainers length:', trainersArray.length);
    console.log('Art rewards calculation - monsters length:', monstersArray.length);
    console.log('Art rewards calculation - npcs length:', npcsArray.length);

    // Verify the structure of trainers, monsters, and npcs arrays
    if (trainersArray.length > 0) {
      console.log('First trainer sample:', JSON.stringify(trainersArray[0]));
    }

    if (monstersArray.length > 0) {
      console.log('First monster sample:', JSON.stringify(monstersArray[0]));
    }

    if (npcsArray.length > 0) {
      console.log('First NPC sample:', JSON.stringify(npcsArray[0]));
    }

    // Calculate rewards (use Discord ID for gift detection)
    const rewards = await Submission.calculateArtRewards({
      quality,
      backgroundType,
      backgrounds,
      uniquelyDifficult,
      trainers: trainersArray,
      monsters: monstersArray,
      npcs: npcsArray,
      isGift,
      useStaticRewards: req.body.useStaticRewards || false
    }, req.user.id);

    // Check for level caps
    const levelCapInfo = await Submission.checkLevelCaps(rewards.monsterRewards || []);
    console.log('Level cap check result:', {
      cappedMonstersCount: levelCapInfo.cappedMonsters.length,
      cappedMonsters: levelCapInfo.cappedMonsters,
      hasLevelCaps: levelCapInfo.cappedMonsters.length > 0
    });

    console.log('Final response data:', {
      totalGiftLevels: rewards.totalGiftLevels,
      hasLevelCaps: levelCapInfo.cappedMonsters.length > 0,
      cappedMonstersCount: levelCapInfo.cappedMonsters.length
    });

    res.json({
      success: true,
      rewards: {
        ...rewards,
        cappedMonsters: levelCapInfo.cappedMonsters,
        hasLevelCaps: levelCapInfo.cappedMonsters.length > 0
      }
    });
  } catch (error) {
    console.error('Error calculating art rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate art rewards',
      error: error.message
    });
  }
};

/**
 * Calculate rewards for a writing submission
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const calculateWritingRewards = async (req, res) => {
  try {
    const { wordCount, trainers, monsters, npcs, trainerId, isGift } = req.body;

    // Validate required fields
    if (!wordCount || wordCount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid word count is required'
      });
    }

    // Parse JSON strings if needed
    let trainersArray = Array.isArray(trainers) ? trainers : [];
    let monstersArray = Array.isArray(monsters) ? monsters : [];
    let npcsArray = Array.isArray(npcs) ? npcs : [];

    if (typeof trainers === 'string') {
      try {
        trainersArray = JSON.parse(trainers);
      } catch (error) {
        console.error('Error parsing trainers JSON:', error);
        trainersArray = [];
      }
    }

    if (typeof monsters === 'string') {
      try {
        monstersArray = JSON.parse(monsters);
      } catch (error) {
        console.error('Error parsing monsters JSON:', error);
        monstersArray = [];
      }
    }

    if (typeof npcs === 'string') {
      try {
        npcsArray = JSON.parse(npcs);
      } catch (error) {
        console.error('Error parsing npcs JSON:', error);
        npcsArray = [];
      }
    }

    // Legacy support: if no trainers/monsters arrays but trainerId provided
    if (trainersArray.length === 0 && monstersArray.length === 0 && trainerId) {
      trainersArray = [{
        trainerId: parseInt(trainerId),
        isOwned: true,
        isGift: isGift || false
      }];
    }

    // Validate that we have at least one participant
    if (trainersArray.length === 0 && monstersArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one trainer or monster is required'
      });
    }

    console.log('Writing submission - trainers:', trainersArray);
    console.log('Writing submission - monsters:', monstersArray);
    console.log('Writing submission - npcs:', npcsArray);

    // Calculate rewards (use Discord ID for gift detection)
    const rewards = await Submission.calculateWritingRewards({
      wordCount,
      trainers: trainersArray,
      monsters: monstersArray,
      npcs: npcsArray
    }, req.user.id);

    // Check for level caps
    const levelCapInfo = await Submission.checkLevelCaps(rewards.monsterRewards || []);

    res.json({
      success: true,
      rewards: {
        ...rewards,
        cappedMonsters: levelCapInfo.cappedMonsters,
        hasLevelCaps: levelCapInfo.cappedMonsters.length > 0
      }
    });
  } catch (error) {
    console.error('Error calculating writing rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate writing rewards',
      error: error.message
    });
  }
};

/**
 * Submit art
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitArt = async (req, res) => {
  try {
    let {
      title,
      description,
      contentType,
      quality,
      backgroundType,
      backgrounds,
      uniquelyDifficult,
      trainers,
      monsters,
      npcs,
      isGift,
      tags = []
    } = req.body;

    // Parse JSON strings if needed
    if (typeof trainers === 'string') {
      try {
        trainers = JSON.parse(trainers);
      } catch (error) {
        console.error('Error parsing trainers JSON:', error);
        trainers = [];
      }
    }

    if (typeof monsters === 'string') {
      try {
        monsters = JSON.parse(monsters);
      } catch (error) {
        console.error('Error parsing monsters JSON:', error);
        monsters = [];
      }
    }

    if (typeof npcs === 'string') {
      try {
        npcs = JSON.parse(npcs);
      } catch (error) {
        console.error('Error parsing npcs JSON:', error);
        npcs = [];
      }
    }

    if (typeof backgrounds === 'string') {
      try {
        backgrounds = JSON.parse(backgrounds);
      } catch (error) {
        console.error('Error parsing backgrounds JSON:', error);
        backgrounds = [];
      }
    }

    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch (error) {
        console.error('Error parsing tags JSON:', error);
        tags = [];
      }
    }

    // Validate required fields
    if (!title || !contentType || !quality) {
      return res.status(400).json({
        success: false,
        message: 'Title, content type, and quality are required'
      });
    }

    // Get Discord ID from authenticated user for submission user_id field
    let userId = req.user.discord_id || req.user.id;

    console.log('User info for submission:', {
      userId: req.user.id,
      discordId: req.user.discord_id,
      username: req.user.username,
      submissionUserId: userId
    });

    // Upload image to Cloudinary if provided
    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'submissions/art'
      });
      imageUrl = result.secure_url;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Image file or URL is required'
      });
    }

    // Ensure trainers, monsters, and npcs are arrays
    const trainersArray = Array.isArray(trainers) ? trainers : [];
    const monstersArray = Array.isArray(monsters) ? monsters : [];
    const npcsArray = Array.isArray(npcs) ? npcs : [];

    console.log('Art submission - trainers:', trainersArray);
    console.log('Art submission - monsters:', monstersArray);
    console.log('Art submission - npcs:', npcsArray);

    // Calculate rewards (use Discord ID for gift detection)
    const rewards = await Submission.calculateArtRewards({
      quality,
      backgroundType,
      backgrounds,
      uniquelyDifficult,
      trainers: trainersArray,
      monsters: monstersArray,
      npcs: npcsArray,
      isGift,
      useStaticRewards: req.body.useStaticRewards || false
    }, userId);

    // Create submission first
    console.log('Creating art submission...');
    const submissionData = {
      userId,
      trainerId: trainersArray && trainersArray.length > 0 ? trainersArray[0].trainerId : null,
      title,
      description,
      contentType,
      content: imageUrl,
      submissionType: 'art',
      status: 'approved' // Auto-approve for now
    };

    console.log('Art submission data:', submissionData);
    const submission = await Submission.create(submissionData);
    console.log('Created art submission with ID:', submission.id);

    // Add submission images
    if (imageUrl) {
      try {
        console.log('Inserting main image for submission ID:', submission.id);
        await db.asyncRun(
          'INSERT INTO submission_images (submission_id, image_url, is_main) VALUES ($1, $2, 1)',
          [submission.id, imageUrl]
        );
        console.log('Successfully inserted main image for submission ID:', submission.id);
      } catch (imageError) {
        console.error('Error inserting main image for submission ID:', submission.id, imageError);
        // Don't fail the submission if image insertion fails
      }
    }

    // Add additional images if provided
    if (req.body.additionalImages && Array.isArray(req.body.additionalImages)) {
      console.log('Adding additional images:', req.body.additionalImages.length);
      for (let i = 0; i < req.body.additionalImages.length; i++) {
        console.log('Adding additional image:', submission.id, req.body.additionalImages[i]);
        await db.asyncRun(
          'INSERT INTO submission_images (submission_id, image_url, is_main, order_index) VALUES ($1, $2, 0, $3)',
          [submission.id, req.body.additionalImages[i], i + 1]
        );
      }
    }

    // Add submission tags
    if (tags.length > 0) {
      for (const tag of tags) {
        await db.asyncRun(
          'INSERT INTO submission_tags (submission_id, tag) VALUES ($1, $2)',
          [submission.id, tag]
        );
      }
    }

    // Add submission monsters
    if (monsters && monsters.length > 0) {
      for (const monster of monsters) {
        try {
          // Get the actual monster from the database using the name and trainer ID
          // This ensures we're using the correct database ID, not the frontend-generated ID
          const monsterQuery = `
            SELECT id FROM monsters
            WHERE name = $1 AND trainer_id = $2
          `;
          const monsterData = await db.asyncGet(monsterQuery, [monster.name, monster.trainerId]);

          if (monsterData && monsterData.id) {
            console.log(`Found monster in database: ${monster.name} (ID: ${monsterData.id}) for trainer ${monster.trainerId}`);
            await db.asyncRun(
              'INSERT INTO submission_monsters (submission_id, monster_id) VALUES ($1, $2)',
              [submission.id, monsterData.id]
            );
          } else {
            console.error(`Could not find monster in database: ${monster.name} for trainer ${monster.trainerId}`);
          }
        } catch (err) {
          console.error(`Error adding monster ${monster.name} to submission:`, err);
        }
      }
    }

    // Add submission trainers
    if (trainersArray && trainersArray.length > 0) {
      for (const trainer of trainersArray) {
        try {
          const tId = trainer.trainerId || trainer.id;
          if (tId) {
            console.log(`Adding trainer to submission: trainer ID ${tId}`);
            await db.asyncRun(
              'INSERT INTO submission_trainers (submission_id, trainer_id) VALUES ($1, $2)',
              [submission.id, tId]
            );
          } else {
            console.error('Trainer missing trainerId/id:', trainer);
          }
        } catch (err) {
          console.error(`Error adding trainer ${trainer.trainerId || trainer.id} to submission:`, err);
        }
      }
    }

    // Check for level caps after submission creation
    const levelCapInfo = await Submission.checkLevelCaps(rewards.monsterRewards || []);
    console.log('Art submission level cap check:', {
      cappedMonstersCount: levelCapInfo.cappedMonsters.length,
      cappedMonsters: levelCapInfo.cappedMonsters,
      hasLevelCaps: levelCapInfo.cappedMonsters.length > 0
    });

    // If there are level caps, still apply normal rewards but return level cap info
    if (levelCapInfo.cappedMonsters.length > 0) {
      console.log('Level caps detected, but still applying normal rewards for non-capped monsters and trainers');
      
      // Apply rewards for non-capped monsters and all trainers
      // This ensures that trainers get their levels/coins and non-capped monsters get their levels
      const websiteUserId = req.user.id; // Database user ID for rewards
      const discordUserId = req.user.discord_id; // Discord ID for missions and boss damage
      const appliedRewards = await Submission.applyRewards(rewards, websiteUserId, submission.id, discordUserId);
      
      console.log('Applied rewards despite level caps:', appliedRewards);
      
      return res.json({
        success: true,
        hasLevelCaps: true,
        cappedMonsters: levelCapInfo.cappedMonsters,
        rewards: {
          ...appliedRewards,
          totalGiftLevels: rewards.totalGiftLevels
        },
        submission: {
          id: submission.id,
          title: submission.title,
          description: submission.description,
          contentType: submission.contentType,
          submissionType: submission.submissionType,
          status: submission.status,
          imageUrl
        },
        message: 'Level caps detected. Please reallocate excess levels before submitting.'
      });
    }

    // Check for gift levels after submission creation
    if (rewards.totalGiftLevels && rewards.totalGiftLevels > 0) {
      return res.json({
        success: true,
        hasGiftLevels: true,
        totalGiftLevels: rewards.totalGiftLevels,
        rewards,
        submission: {
          id: submission.id,
          title: submission.title,
          description: submission.description,
          contentType: submission.contentType,
          submissionType: submission.submissionType,
          status: submission.status,
          imageUrl
        },
        message: 'Gift levels detected. Please allocate gift rewards before submitting.'
      });
    }

    // Apply rewards - need to use database user ID for foreign key constraints
    const websiteUserId = req.user.id; // Database user ID for rewards
    const discordUserId = req.user.discord_id; // Discord ID for missions and boss damage
    const appliedRewards = await Submission.applyRewards(rewards, websiteUserId, submission.id, discordUserId);

    res.json({
      success: true,
      submission: {
        id: submission.id,
        title: submission.title,
        description: submission.description,
        contentType: submission.contentType,
        submissionType: submission.submissionType,
        status: submission.status,
        imageUrl
      },
      rewards: {
        ...appliedRewards,
        totalGiftLevels: rewards.totalGiftLevels
      }
    });
  } catch (error) {
    console.error('Error submitting art:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit art',
      error: error.message
    });
  }
};

/**
 * Submit writing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitWriting = async (req, res) => {
  try {
    let {
      title,
      description,
      contentType,
      content,
      wordCount,
      trainers,
      monsters,
      npcs,
      trainerId, // Legacy support
      isGift, // Legacy support
      tags = []
    } = req.body;

    // Parse JSON strings if needed
    if (typeof trainers === 'string') {
      try {
        trainers = JSON.parse(trainers);
      } catch (error) {
        console.error('Error parsing trainers JSON:', error);
        trainers = [];
      }
    }

    if (typeof monsters === 'string') {
      try {
        monsters = JSON.parse(monsters);
      } catch (error) {
        console.error('Error parsing monsters JSON:', error);
        monsters = [];
      }
    }

    if (typeof npcs === 'string') {
      try {
        npcs = JSON.parse(npcs);
      } catch (error) {
        console.error('Error parsing npcs JSON:', error);
        npcs = [];
      }
    }

    // Validate required fields
    if (!title || !contentType || !content || !wordCount || wordCount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Title, content type, content, and valid word count are required'
      });
    }

    // Ensure trainers, monsters, and npcs are arrays
    const trainersArray = Array.isArray(trainers) ? trainers : [];
    const monstersArray = Array.isArray(monsters) ? monsters : [];
    const npcsArray = Array.isArray(npcs) ? npcs : [];

    // Legacy support: if no trainers/monsters arrays but trainerId provided
    if (trainersArray.length === 0 && monstersArray.length === 0 && trainerId) {
      trainersArray.push({
        trainerId: parseInt(trainerId),
        isOwned: true,
        isGift: isGift || false
      });
    }

    // Validate that we have at least one participant (NPCs don't count as they only provide gift levels)
    if (trainersArray.length === 0 && monstersArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one trainer or monster is required'
      });
    }

    console.log('Writing submission - trainers:', trainersArray);
    console.log('Writing submission - monsters:', monstersArray);
    console.log('Writing submission - npcs:', npcsArray);

    // Get Discord ID from authenticated user for submission user_id field
    let userId = req.user.discord_id || req.user.id;

    console.log('User info for writing submission:', {
      userId: req.user.id,
      discordId: req.user.discord_id,
      username: req.user.username,
      submissionUserId: userId
    });

    // Upload cover image to Cloudinary if provided
    let coverImageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'submissions/writing/covers'
      });
      coverImageUrl = result.secure_url;
    } else if (req.body.coverImageUrl) {
      coverImageUrl = req.body.coverImageUrl;
    }

    // Calculate rewards (use Discord ID for gift detection)
    const rewards = await Submission.calculateWritingRewards({
      wordCount,
      trainers: trainersArray,
      monsters: monstersArray,
      npcs: npcsArray
    }, userId);

    // Check for level caps before submission
    const levelCapInfo = await Submission.checkLevelCaps(rewards.monsterRewards || []);
    console.log('Writing submission level cap check:', {
      cappedMonstersCount: levelCapInfo.cappedMonsters.length,
      cappedMonsters: levelCapInfo.cappedMonsters,
      hasLevelCaps: levelCapInfo.cappedMonsters.length > 0
    });

    // Create submission first
    console.log('Creating writing submission...');

    // Handle chapter number assignment
    let chapterNumber = req.body.chapterNumber ? parseInt(req.body.chapterNumber) : null;

    // If this is a chapter but no chapter number provided, auto-assign next chapter number
    if (req.body.parentId && !chapterNumber) {
      const maxChapterQuery = `
        SELECT COALESCE(MAX(chapter_number), 0) as max_chapter
        FROM submissions
        WHERE parent_id = $1
      `;
      const maxResult = await db.asyncAll(maxChapterQuery, [req.body.parentId]);
      chapterNumber = (maxResult[0]?.max_chapter || 0) + 1;
    }

    const submissionData = {
      userId,
      trainerId: trainersArray.length > 0 ? trainersArray[0].trainerId : null,
      title,
      description,
      contentType,
      content,
      submissionType: 'writing',
      status: 'approved', // Auto-approve for now
      isBook: req.body.isBook || 0,
      parentId: req.body.parentId || null,
      chapterNumber: chapterNumber
    };

    const submission = await Submission.create(submissionData);
    console.log('Created writing submission with ID:', submission.id);

    // Add cover image if provided
    if (coverImageUrl) {
      try {
        console.log('Inserting cover image for submission ID:', submission.id);
        await db.asyncRun(
          'INSERT INTO submission_images (submission_id, image_url, is_main) VALUES ($1, $2, 1)',
          [submission.id, coverImageUrl]
        );
        console.log('Successfully inserted cover image for submission ID:', submission.id);
      } catch (imageError) {
        console.error('Error inserting cover image for submission ID:', submission.id, imageError);
      }
    }

    // Add submission tags
    if (tags.length > 0) {
      for (const tag of tags) {
        await db.asyncRun(
          'INSERT INTO submission_tags (submission_id, tag) VALUES ($1, $2)',
          [submission.id, tag]
        );
      }
    }

    // Add submission monsters
    if (monstersArray && monstersArray.length > 0) {
      for (const monster of monstersArray) {
        try {
          const monsterQuery = `
            SELECT id FROM monsters
            WHERE name = $1 AND trainer_id = $2
          `;
          const monsterData = await db.asyncGet(monsterQuery, [monster.name, monster.trainerId]);

          if (monsterData && monsterData.id) {
            console.log(`Found monster in database: ${monster.name} (ID: ${monsterData.id}) for trainer ${monster.trainerId}`);
            await db.asyncRun(
              'INSERT INTO submission_monsters (submission_id, monster_id) VALUES ($1, $2)',
              [submission.id, monsterData.id]
            );
          } else {
            console.error(`Could not find monster in database: ${monster.name} for trainer ${monster.trainerId}`);
          }
        } catch (err) {
          console.error(`Error adding monster ${monster.name} to submission:`, err);
        }
      }
    }

    // Add submission trainers
    if (trainersArray && trainersArray.length > 0) {
      for (const trainer of trainersArray) {
        try {
          const tId = trainer.trainerId || trainer.id;
          if (tId) {
            console.log(`Adding trainer to submission: trainer ID ${tId}`);
            await db.asyncRun(
              'INSERT INTO submission_trainers (submission_id, trainer_id) VALUES ($1, $2)',
              [submission.id, tId]
            );
          } else {
            console.error('Trainer missing trainerId/id:', trainer);
          }
        } catch (err) {
          console.error(`Error adding trainer ${trainer.trainerId || trainer.id} to submission:`, err);
        }
      }
    }

    // Check for level caps after submission creation
    if (levelCapInfo.cappedMonsters.length > 0) {
      return res.json({
        success: true,
        hasLevelCaps: true,
        cappedMonsters: levelCapInfo.cappedMonsters,
        rewards,
        submission: {
          id: submission.id,
          title: submission.title,
          description: submission.description,
          contentType: submission.contentType,
          submissionType: submission.submissionType,
          status: submission.status,
          coverImageUrl
        },
        message: 'Level caps detected. Please reallocate excess levels before submitting.'
      });
    }

    // Check for gift levels after submission creation
    if (rewards.totalGiftLevels && rewards.totalGiftLevels > 0) {
      return res.json({
        success: true,
        hasGiftLevels: true,
        totalGiftLevels: rewards.totalGiftLevels,
        rewards,
        submission: {
          id: submission.id,
          title: submission.title,
          description: submission.description,
          contentType: submission.contentType,
          submissionType: submission.submissionType,
          status: submission.status,
          coverImageUrl
        },
        message: 'Gift levels detected. Please allocate gift rewards before submitting.'
      });
    }

    // Apply rewards - need to use database user ID for foreign key constraints
    const websiteUserId = req.user.id; // Database user ID for rewards
    const discordUserId = req.user.discord_id; // Discord ID for missions and boss damage
    const appliedRewards = await Submission.applyRewards(rewards, websiteUserId, submission.id, discordUserId);

    res.json({
      success: true,
      submission: {
        id: submission.id,
        title: submission.title,
        description: submission.description,
        contentType: submission.contentType,
        submissionType: submission.submissionType,
        status: submission.status,
        coverImageUrl
      },
      rewards: {
        ...appliedRewards,
        totalGiftLevels: rewards.totalGiftLevels
      }
    });
  } catch (error) {
    console.error('Error submitting writing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit writing',
      error: error.message
    });
  }
};

/**
 * Allocate gift levels to a trainer or monster
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const allocateGiftLevels = async (req, res) => {
  try {
    const { submissionId, recipientType, recipientId, levels } = req.body;

    // Validate required fields
    if (!submissionId || !recipientType || !recipientId || !levels || levels <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Submission ID, recipient type, recipient ID, and valid levels are required'
      });
    }

    // Validate recipient type
    if (recipientType !== 'trainer' && recipientType !== 'monster') {
      return res.status(400).json({
        success: false,
        message: 'Recipient type must be either "trainer" or "monster"'
      });
    }

    // Allocate gift levels
    const result = await Submission.allocateGiftLevels(submissionId, recipientType, recipientId, levels);

    res.json({
      success: true,
      allocation: result
    });
  } catch (error) {
    console.error('Error allocating gift levels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to allocate gift levels',
      error: error.message
    });
  }
};

/**
 * Allocate gift coins to a trainer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const allocateGiftCoins = async (req, res) => {
  try {
    const { submissionId, trainerId, coins } = req.body;

    // Validate required fields
    if (!submissionId || !trainerId || !coins || coins <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Submission ID, trainer ID, and valid coins are required'
      });
    }

    // Allocate gift coins
    const result = await Submission.allocateGiftCoins(submissionId, trainerId, coins);

    res.json({
      success: true,
      allocation: result
    });
  } catch (error) {
    console.error('Error allocating gift coins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to allocate gift coins',
      error: error.message
    });
  }
};

/**
 * Allocate capped levels to a trainer or monster
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const allocateCappedLevels = async (req, res) => {
  try {
    const { submissionId, recipientType, recipientId, levels } = req.body;

    // Validate required fields
    if (!submissionId || !recipientType || !recipientId || !levels || levels <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Submission ID, recipient type, recipient ID, and valid levels are required'
      });
    }

    // Validate recipient type
    if (recipientType !== 'trainer' && recipientType !== 'monster') {
      return res.status(400).json({
        success: false,
        message: 'Recipient type must be either "trainer" or "monster"'
      });
    }

    // Allocate capped levels
    const result = await Submission.allocateCappedLevels(submissionId, recipientType, recipientId, levels);

    res.json({
      success: true,
      allocation: result
    });
  } catch (error) {
    console.error('Error allocating capped levels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to allocate capped levels',
      error: error.message
    });
  }
};

/**
 * Allocate gift item to a trainer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const allocateGiftItem = async (req, res) => {
  try {
    const { itemId, trainerId } = req.body;

    // Validate required fields
    if (!itemId || !trainerId) {
      return res.status(400).json({
        success: false,
        message: 'Item ID and trainer ID are required'
      });
    }

    // Allocate gift item
    const result = await Submission.allocateGiftItem(itemId, trainerId);

    res.json({
      success: true,
      allocation: result
    });
  } catch (error) {
    console.error('Error allocating gift item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to allocate gift item',
      error: error.message
    });
  }
};

/**
 * Get gift items for a submission
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getGiftItems = async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);

    // Get gift items
    const query = `
      SELECT
        id,
        item_category,
        item_name,
        quantity,
        recipient_id,
        is_claimed,
        claimed_at
      FROM submission_gift_items
      WHERE submission_id = $1
    `;

    const giftItems = await db.asyncAll(query, [submissionId]);

    res.json({
      success: true,
      giftItems
    });
  } catch (error) {
    console.error('Error getting gift items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gift items',
      error: error.message
    });
  }
};

/**
 * Get gift and capped levels for a submission
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSubmissionRewards = async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);

    // Get submission
    const submission = await Submission.getById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Get allocated gift levels
    const giftLevelsQuery = `
      SELECT
        id,
        recipient_type,
        recipient_id,
        amount,
        is_claimed,
        claimed_at
      FROM submission_rewards
      WHERE submission_id = $1 AND reward_type = 'allocated_gift_level'
    `;

    const giftLevels = await db.asyncAll(giftLevelsQuery, [submissionId]);

    // Get allocated gift coins
    const giftCoinsQuery = `
      SELECT
        id,
        recipient_type,
        recipient_id,
        amount,
        is_claimed,
        claimed_at
      FROM submission_rewards
      WHERE submission_id = $1 AND reward_type = 'allocated_gift_coin'
    `;

    const giftCoins = await db.asyncAll(giftCoinsQuery, [submissionId]);

    // Get allocated capped levels
    const cappedLevelsQuery = `
      SELECT
        id,
        recipient_type,
        recipient_id,
        levels_amount
      FROM submission_capped_levels
      WHERE submission_id = $1
    `;

    const cappedLevels = await db.asyncAll(cappedLevelsQuery, [submissionId]);

    res.json({
      success: true,
      rewards: {
        giftLevels: {
          total: submission.gift_levels || 0,
          allocated: giftLevels
        },
        giftCoins: {
          total: submission.gift_coins || 0,
          allocated: giftCoins
        },
        cappedLevels: {
          total: submission.capped_levels || 0,
          allocated: cappedLevels
        }
      }
    });
  } catch (error) {
    console.error('Error getting submission rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get submission rewards',
      error: error.message
    });
  }
};

/**
 * Calculate reference submission rewards
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const calculateReferenceRewards = async (req, res) => {
  try {
    const { referenceType, references } = req.body;

    // Validate required fields
    if (!referenceType || !references || !Array.isArray(references) || references.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reference type and at least one reference are required'
      });
    }

    // Calculate rewards based on reference type
    let rewards = {
      levels: 0,
      coins: 0,
      giftLevels: 0,
      cappedLevels: 0
    };

    // Process each reference
    for (const reference of references) {
      if (referenceType === 'trainer') {
        // Trainer reference rewards
        if (!reference.trainerId) {
          continue;
        }

        // Base rewards for trainer reference
        rewards.levels += 6;
        rewards.coins += 200;

        // Custom levels if specified
        if (reference.customLevels && reference.customLevels > 0) {
          rewards.levels = reference.customLevels;
          rewards.coins = reference.customLevels * 50;
        }
      } else if (referenceType === 'monster') {
        // Monster reference rewards
        if (!reference.trainerId || !reference.monsterName) {
          continue;
        }

        // Base rewards for monster reference
        rewards.levels += 6;
        rewards.coins += 200;

        // Custom levels if specified
        if (reference.customLevels && reference.customLevels > 0) {
          rewards.levels = reference.customLevels;
          rewards.coins = reference.customLevels * 50;
        }
      }
    }

    // Gift levels should only be calculated for actual gifts, not all references
    // Remove automatic gift level calculation for reference rewards preview
    rewards.giftLevels = 0;

    // Add capped levels (5% of total levels)
    rewards.cappedLevels = Math.ceil(rewards.levels * 0.05);

    res.json({
      success: true,
      rewards
    });
  } catch (error) {
    console.error('Error calculating reference rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate reference rewards',
      error: error.message
    });
  }
};

/**
 * Submit reference
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitReference = async (req, res) => {
  try {
    const { referenceType } = req.body;

    // Validate required fields
    if (!referenceType) {
      return res.status(400).json({
        success: false,
        message: 'Reference type is required'
      });
    }

    // Get Discord ID from authenticated user for submission user_id field
    let userId = req.user.discord_id || req.user.id;
    
    console.log('Reference submission - User info:', {
      userId: req.user.id,
      discordId: req.user.discord_id,
      username: req.user.username,
      submissionUserId: userId
    });

    // Process references
    const references = [];
    let totalRewards = {
      levels: 0,
      coins: 0,
      giftLevels: 0,
      cappedLevels: 0
    };

    // Determine how many references were submitted
    const referenceCount = Object.keys(req.body)
      .filter(key => key.startsWith('trainerId_'))
      .length;

    // Process each reference
    for (let i = 0; i < referenceCount; i++) {
      const trainerId = req.body[`trainerId_${i}`];

      if (!trainerId) {
        continue;
      }

      // Check if trainer belongs to the user (for gift level calculation)
      let isGift = false;
      try {
        console.log(`Checking ownership for trainer ${trainerId}, user is ${userId}`);
        const trainer = await db.asyncGet(
          `SELECT player_user_id FROM trainers WHERE id = $1`,
          [parseInt(trainerId)]
        );
        console.log(`Trainer ${trainerId} query result:`, trainer);
        
        if (trainer) {
          if (trainer.player_user_id !== userId) {
            isGift = true;
            console.log(`✅ GIFT DETECTED: Reference for trainer ${trainerId} is a gift (trainer belongs to ${trainer.player_user_id}, user is ${userId})`);
          } else {
            console.log(`❌ NOT A GIFT: Reference for trainer ${trainerId} belongs to user (trainer belongs to ${trainer.player_user_id}, user is ${userId})`);
          }
        } else {
          console.log(`⚠️ WARNING: Trainer ${trainerId} not found in database`);
        }
      } catch (err) {
        console.error(`Error checking trainer ownership for trainer ${trainerId}:`, err);
      }

      // Create reference object
      const reference = {
        trainerId: parseInt(trainerId),
        referenceType,
        isGift
      };

      // Add monster name for monster references and mega image references
      if (referenceType === 'monster' || referenceType === 'mega image') {
        reference.monsterName = req.body[`monsterName_${i}`];

        if (!reference.monsterName) {
          console.error(`Missing monster name for ${referenceType} reference ${i}`);
          continue;
        }

        // Add instance count and appearance info (only for monster references)
        if (referenceType === 'monster') {
          reference.instanceCount = parseInt(req.body[`instanceCount_${i}`] || 1);
          reference.sameAppearanceForEachInstance = req.body[`sameAppearanceForEachInstance_${i}`] === 'true';

          // Process instance appearances if not using same appearance for all
          if (!reference.sameAppearanceForEachInstance) {
            reference.instanceAppearances = [];

            // Find all instance appearances for this reference
            const appearanceKeys = Object.keys(req.body)
              .filter(key => key.startsWith(`instanceAppearance_${i}_`) && key.endsWith('_type'));

            for (const key of appearanceKeys) {
              const instanceIndex = key.split('_')[2];
              const instanceNumber = parseInt(req.body[`instanceAppearance_${i}_${instanceIndex}_instanceNumber`]);
              const type = req.body[`instanceAppearance_${i}_${instanceIndex}_type`];

              reference.instanceAppearances.push({
                instanceNumber,
                type
              });
            }
          }
        }
      }

      // Add trainer mega fields for trainer mega references
      if (referenceType === 'trainer mega') {
        // Optional mega info fields
        reference.megaArtist = req.body[`megaArtist_${i}`] || "";
        reference.megaSpecies1 = req.body[`megaSpecies1_${i}`] || "";
        reference.megaSpecies2 = req.body[`megaSpecies2_${i}`] || "";
        reference.megaSpecies3 = req.body[`megaSpecies3_${i}`] || "";
        reference.megaType1 = req.body[`megaType1_${i}`] || "";
        reference.megaType2 = req.body[`megaType2_${i}`] || "";
        reference.megaType3 = req.body[`megaType3_${i}`] || "";
        reference.megaType4 = req.body[`megaType4_${i}`] || "";
        reference.megaType5 = req.body[`megaType5_${i}`] || "";
        reference.megaType6 = req.body[`megaType6_${i}`] || "";
        reference.megaAbility = req.body[`megaAbility_${i}`] || "";
      }

      // Add reference URL or file
      if (req.body[`referenceUrl_${i}`]) {
        reference.referenceUrl = req.body[`referenceUrl_${i}`];
      } else if (req.files && req.files.length > 0) {
        // Find the file for this reference index
        const referenceFile = req.files.find(file => file.fieldname === `referenceFile_${i}`);
        if (referenceFile) {
          // Upload file to Cloudinary
          const result = await cloudinary.uploader.upload(referenceFile.path, {
            folder: `submissions/references/${referenceType}`
          });
          reference.referenceUrl = result.secure_url;
        }
      }

      // Skip if no reference URL
      if (!reference.referenceUrl) {
        continue;
      }

      // Add custom levels if specified
      if (req.body[`customLevels_${i}`]) {
        reference.customLevels = parseInt(req.body[`customLevels_${i}`]);
      }

      // Calculate rewards for this reference
      let referenceRewards = {
        levels: 0,
        coins: 0
      };

      if (referenceType === 'trainer') {
        // Trainer reference rewards
        referenceRewards.levels = reference.customLevels || 6;
        referenceRewards.coins = reference.customLevels ? reference.customLevels * 50 : 200;

        // Update trainer's main_ref with the new reference image
        try {
          await db.asyncRun(
            `UPDATE trainers SET main_ref = $1 WHERE id = $2`,
            [reference.referenceUrl, reference.trainerId]
          );
          console.log(`Updated trainer ${reference.trainerId} main_ref to ${reference.referenceUrl}`);
        } catch (err) {
          console.error(`Error updating trainer reference image:`, err);
        }
      } else if (referenceType === 'monster') {
        // Monster reference rewards
        referenceRewards.levels = reference.customLevels || 6;
        referenceRewards.coins = reference.customLevels ? reference.customLevels * 50 : 200;

        // Update monster's img_link with the new reference image
        try {
          // Find the monster by name and trainer ID
          const monster = await db.asyncGet(
            `SELECT id FROM monsters WHERE trainer_id = $1 AND name = $2`,
            [reference.trainerId, reference.monsterName]
          );

          if (monster) {
            await db.asyncRun(
              `UPDATE monsters SET img_link = $1 WHERE id = $2`,
              [reference.referenceUrl, monster.id]
            );
            console.log(`Updated monster ${monster.id} img_link to ${reference.referenceUrl}`);
          }
        } catch (err) {
          console.error(`Error updating monster reference image:`, err);
        }
      } else if (referenceType === 'mega image') {
        // Mega image reference rewards
        referenceRewards.levels = reference.customLevels || 6;
        referenceRewards.coins = reference.customLevels ? reference.customLevels * 50 : 200;

        // Add mega image to monster_images table
        try {
          console.log(`Looking for monster: name="${reference.monsterName}", trainerId=${reference.trainerId}`);
          
          // Find the monster by name and trainer ID
          const monster = await db.asyncGet(
            `SELECT id FROM monsters WHERE trainer_id = $1 AND name = $2`,
            [reference.trainerId, reference.monsterName]
          );

          if (monster) {
            console.log(`Found monster ${monster.id}, adding mega image: ${reference.referenceUrl}`);
            
            // Import Monster model to use setMegaImage method
            const Monster = require('../models/Monster');
            const result = await Monster.setMegaImage(monster.id, reference.referenceUrl);
            
            console.log(`Successfully added mega image to monster ${monster.id}:`, result);
          } else {
            console.error(`Monster not found: name="${reference.monsterName}", trainerId=${reference.trainerId}`);
          }
        } catch (err) {
          console.error(`Error adding mega image to monster "${reference.monsterName}":`, err);
          console.error('Full error details:', err.stack);
        }
      } else if (referenceType === 'trainer mega') {
        // Trainer mega reference rewards
        referenceRewards.levels = reference.customLevels || 9;
        referenceRewards.coins = reference.customLevels ? reference.customLevels * 50 : 200;

        // Add trainer mega image and info
        try {
          console.log(`Adding trainer mega for trainerId=${reference.trainerId}`);
          
          // Build mega_info object
          const megaInfo = {
            mega_ref: reference.referenceUrl || "",
            mega_artist: reference.megaArtist || "",
            mega_species1: reference.megaSpecies1 || "",
            mega_species2: reference.megaSpecies2 || "",
            mega_species3: reference.megaSpecies3 || "",
            mega_type1: reference.megaType1 || "",
            mega_type2: reference.megaType2 || "",
            mega_type3: reference.megaType3 || "",
            mega_type4: reference.megaType4 || "",
            mega_type5: reference.megaType5 || "",
            mega_type6: reference.megaType6 || "",
            mega_ability: reference.megaAbility || ""
          };

          // Update trainer with mega info
          const updateQuery = `
            UPDATE trainers 
            SET mega_info = $1 
            WHERE id = $2
          `;
          
          await db.asyncRun(updateQuery, [JSON.stringify(megaInfo), reference.trainerId]);
          
          console.log(`Successfully updated trainer ${reference.trainerId} with mega info:`, megaInfo);
        } catch (err) {
          console.error(`Error adding trainer mega for trainerId=${reference.trainerId}:`, err);
          console.error('Full error details:', err.stack);
        }
      }

      // Add to total rewards (levels still go to the receiving trainer/monster)
      totalRewards.levels += referenceRewards.levels;
      totalRewards.coins += referenceRewards.coins;

      // If this is a gift, add the full level amount to gift levels (GiftRewards component will apply 50% reduction)
      if (reference.isGift) {
        totalRewards.giftLevels += referenceRewards.levels;
        console.log(`🎁 GIFT LEVELS CALCULATED: ${referenceRewards.levels} gift levels added (GiftRewards component will apply 50% reduction)`);
        console.log(`🎁 Total gift levels so far: ${totalRewards.giftLevels}`);
      } else {
        console.log(`📝 Regular reference (not gift): ${referenceRewards.levels} levels to recipient, no gift levels`);
      }

      // Add reference to list
      references.push({
        ...reference,
        rewards: referenceRewards
      });
    }

    // Skip if no valid references
    if (references.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid references provided'
      });
    }

    // Calculate capped levels (5% of total levels)
    totalRewards.cappedLevels = Math.ceil(totalRewards.levels * 0.05);
    
    // Gift levels are only set if there are actual gift references (calculated above)
    // Don't add default gift levels for non-gift references

    // Create submission
    const submissionData = {
      userId,
      title: `${referenceType.charAt(0).toUpperCase() + referenceType.slice(1)} Reference`,
      description: `Reference for ${references.length} ${referenceType}(s)`,
      contentType: referenceType,
      submissionType: 'reference',
      status: 'approved' // Auto-approve for now
    };

    // Insert submission
    const submissionResult = await db.asyncRun(
      `INSERT INTO submissions (
        user_id, title, description, content_type, submission_type, status, submission_date
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [
        submissionData.userId,
        submissionData.title,
        submissionData.description,
        submissionData.contentType,
        submissionData.submissionType,
        submissionData.status
      ]
    );

    const submissionId = submissionResult.lastID;

    // Add submission references
    for (const reference of references) {
      // Insert reference
      const referenceResult = await db.asyncRun(
        `INSERT INTO submission_references (
          submission_id, reference_type, trainer_id, monster_name, reference_url, instance_count
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          submissionId,
          referenceType,
          reference.trainerId,
          reference.monsterName || null,
          reference.referenceUrl,
          reference.instanceCount || 1
        ]
      );

      const referenceId = referenceResult.lastID;

      // Add instance appearances if applicable
      if (referenceType === 'monster' && !reference.sameAppearanceForEachInstance && reference.instanceAppearances) {
        for (const appearance of reference.instanceAppearances) {
          await db.asyncRun(
            `INSERT INTO reference_instance_appearances (
              reference_id, instance_number, appearance_type
            ) VALUES ($1, $2, $3)`,
            [
              referenceId,
              appearance.instanceNumber,
              appearance.type
            ]
          );
        }
      }
    }

    // Build structured rewards for level cap checking
    const monsterRewards = [];
    const trainerRewards = [];

    for (const reference of references) {
      if (reference.monsterName && reference.trainerId) {
        try {
          // Find the monster by name and trainer ID
          const monster = await db.asyncGet(
            `SELECT id FROM monsters WHERE trainer_id = $1 AND name = $2`,
            [reference.trainerId, reference.monsterName]
          );

          if (monster) {
            monsterRewards.push({
              monsterId: monster.id,
              name: reference.monsterName,
              trainerId: reference.trainerId,
              levels: reference.rewards.levels,
              coins: reference.rewards.coins,
              isGift: false, // Always false - we handle gift levels manually in references
              isTrainerOwned: true // Always true - we handle gift levels manually in references
            });
          }
        } catch (err) {
          console.error(`Error finding monster ${reference.monsterName}:`, err);
        }
      } else if (reference.trainerId) {
        trainerRewards.push({
          trainerId: reference.trainerId,
          levels: reference.rewards.levels,
          coins: reference.rewards.coins,
          isGift: false, // Always false - we handle gift levels manually in references
          isOwned: true // Always true - we handle gift levels manually in references
        });
      }
    }

    // Check for level caps if there are monster rewards
    let levelCapInfo = { cappedMonsters: [] };
    if (monsterRewards.length > 0) {
      levelCapInfo = await Submission.checkLevelCaps(monsterRewards);
      console.log('Reference submission level cap check:', {
        cappedMonstersCount: levelCapInfo.cappedMonsters.length,
        cappedMonsters: levelCapInfo.cappedMonsters,
        hasLevelCaps: levelCapInfo.cappedMonsters.length > 0
      });
    }

    // If there are level caps, return early with level cap info but submission is already created
    if (levelCapInfo.cappedMonsters.length > 0) {
      return res.json({
        success: true,
        hasLevelCaps: true,
        cappedMonsters: levelCapInfo.cappedMonsters,
        rewards: {
          monsterRewards,
          trainerRewards,
          levels: totalRewards.levels,
          coins: totalRewards.coins,
          giftLevels: totalRewards.giftLevels,
          cappedLevels: totalRewards.cappedLevels
        },
        submission: {
          id: submissionId,
          title: submissionData.title,
          description: submissionData.description,
          contentType: submissionData.contentType,
          submissionType: submissionData.submissionType,
          status: submissionData.status,
          references
        },
        message: 'Level caps detected. Please reallocate excess levels before submitting.'
      });
    }

    // Calculate garden points and boss damage based on number of references submitted
    const baseRewards = Math.ceil(referenceCount / 2);
    
    // Random multiplier with weighted distribution: 1 most likely, 3 least likely
    const getRandomMultiplier = () => {
      const rand = Math.random();
      if (rand < 0.5) return 1;        // 50% chance for 1x
      else if (rand < 0.75) return 0.5; // 25% chance for 0.5x
      else if (rand < 0.95) return 2;   // 20% chance for 2x
      else return 3;                    // 5% chance for 3x
    };
    
    const gardenMultiplier = getRandomMultiplier();
    const bossMultiplier = getRandomMultiplier();
    
    // Prepare structured rewards for application
    const structuredRewards = {
      trainerRewards,
      monsterRewards,
      gardenPoints: Math.ceil(baseRewards * gardenMultiplier),
      missionProgress: Math.floor(Math.random() * 3) + 1,
      bossDamage: Math.ceil(baseRewards * bossMultiplier)
    };

    // Check for gift levels after submission creation (similar to art/writing submissions)
    console.log(`🔍 Final gift level check: totalRewards.giftLevels = ${totalRewards.giftLevels}`);
    
    if (totalRewards.giftLevels && totalRewards.giftLevels > 0) {
      console.log('🎁 Gift levels detected, generating gift items and monsters, then applying normal rewards for non-gift references');
      
      // Generate gift items (1 item per 5 gift levels)
      const ItemRoller = require('../models/ItemRoller');
      const giftItems = [];
      const itemCount = Math.floor(totalRewards.giftLevels / 5);
      
      if (itemCount > 0) {
        const itemCategories = ['items', 'balls', 'berries', 'pastries', 'antique', 'helditems'];
        
        for (let i = 0; i < itemCount; i++) {
          try {
            const randomCategory = itemCategories[Math.floor(Math.random() * itemCategories.length)];
            const rolledItem = await ItemRoller.rollOne({ category: randomCategory });
            if (rolledItem) {
              giftItems.push({
                category: randomCategory,
                name: rolledItem.name,
                quantity: 1
              });
            }
          } catch (err) {
            console.error('Error rolling gift item:', err);
          }
        }
      }

      // Generate gift monsters (1 monster per 10 gift levels)
      const Monster = require('../models/Monster');
      const giftMonsters = [];
      const monsterCount = Math.floor(totalRewards.giftLevels / 10);
      
      if (monsterCount > 0) {
        for (let i = 0; i < monsterCount; i++) {
          try {
            const rolledMonster = await Monster.generateRandomMonster();
            if (rolledMonster) {
              giftMonsters.push(rolledMonster);
            }
          } catch (err) {
            console.error('Error rolling gift monster:', err);
          }
        }
      }
      
      console.log(`🎁 Generated ${giftItems.length} gift items and ${giftMonsters.length} gift monsters`);
      
      // Apply rewards for non-gift references immediately
      // This ensures that non-gift trainers/monsters get their levels/coins immediately
      let websiteUserId = userId;
      if (req.user.discord_id) {
        // If userId is discord_id, get the website user ID
        const user = await User.findByDiscordId(userId);
        if (user) {
          websiteUserId = user.id;
        }
      }

      // Use Discord ID for missions and boss damage
      const discordUserId = req.user.discord_id;
      const appliedRewards = await Submission.applyRewards(structuredRewards, websiteUserId, submissionId, discordUserId);
      
      console.log('Applied rewards despite gift levels:', appliedRewards);
      
      const giftResponse = {
        success: true,
        hasGiftLevels: true,
        totalGiftLevels: totalRewards.giftLevels,
        rewards: {
          ...appliedRewards,
          totalGiftLevels: totalRewards.giftLevels,
          giftItems,
          giftMonsters
        },
        submission: {
          id: submissionId,
          title: submissionData.title,
          description: submissionData.description,
          contentType: submissionData.contentType,
          submissionType: submissionData.submissionType,
          status: submissionData.status,
          references
        },
        message: 'Gift levels detected. Please allocate your gift level rewards.'
      };
      
      console.log('🚀 Returning gift level response:', {
        hasGiftLevels: giftResponse.hasGiftLevels,
        totalGiftLevels: giftResponse.totalGiftLevels,
        submissionId: giftResponse.submission.id,
        message: giftResponse.message
      });
      
      return res.json(giftResponse);
    }

    // Apply rewards for garden points, mission progress, etc. - need to get website user ID for foreign key constraints
    let websiteUserId = userId;
    if (req.user.discord_id) {
      // If userId is discord_id, get the website user ID
      const user = await User.findByDiscordId(userId);
      if (user) {
        websiteUserId = user.id;
      }
    }

    // Use Discord ID for missions and boss damage
    const discordUserId = req.user.discord_id;
    const appliedRewards = await Submission.applyRewards(structuredRewards, websiteUserId, submissionId, discordUserId);

    res.json({
      success: true,
      submission: {
        id: submissionId,
        title: submissionData.title,
        description: submissionData.description,
        contentType: submissionData.contentType,
        submissionType: submissionData.submissionType,
        status: submissionData.status,
        references
      },
      rewards: appliedRewards
    });
  } catch (error) {
    console.error('Error submitting reference:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit reference',
      error: error.message
    });
  }
};

/**
 * Get available prompts for a trainer
 * @param {Object} req - Express request object (expects query params: trainerId, category which maps to prompt type)
 * @param {Object} res - Express response object
 */
const getAvailablePrompts = async (req, res) => {
  try {
    const trainerId = req.query.trainerId;
    const category = req.query.category || 'general';


    if (!trainerId) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID is required'
      });
    }

    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }


    // Get available prompts - filter by TYPE, not category
    const query = `
      SELECT
        p.id,
        p.title,
        p.description,
        p.prompt_text,
        p.category,
        p.difficulty,
        p.rewards,
        p.type,
        p.is_active,
        CASE
          WHEN p.type = 'monthly' AND p.active_months IS NOT NULL
          THEN p.active_months LIKE '%' || EXTRACT(MONTH FROM CURRENT_DATE)::text || '%'
          WHEN p.type = 'event' AND p.start_date IS NOT NULL AND p.end_date IS NOT NULL
          THEN CURRENT_DATE BETWEEN p.start_date AND p.end_date
          ELSE p.is_active
        END as is_currently_available
      FROM prompts p
      WHERE
        p.type = $1 AND
        p.is_active = true AND
        CASE
          WHEN p.type = 'monthly' AND p.active_months IS NOT NULL
          THEN p.active_months LIKE '%' || EXTRACT(MONTH FROM CURRENT_DATE)::text || '%'
          WHEN p.type = 'event' AND p.start_date IS NOT NULL AND p.end_date IS NOT NULL
          THEN CURRENT_DATE BETWEEN p.start_date AND p.end_date
          ELSE p.is_active
        END = true AND
        (
          -- Allow unlimited submissions if max_submissions_per_trainer is NULL
          p.max_submissions_per_trainer IS NULL OR
          -- Or if the trainer hasn't reached their submission limit
          (
            SELECT COUNT(*) FROM prompt_submissions ps
            WHERE ps.prompt_id = p.id AND ps.trainer_id = $2
          ) < p.max_submissions_per_trainer
        )
      ORDER BY p.difficulty ASC, p.title ASC
    `;

    const prompts = await db.asyncAll(query, [category, trainerId]);


    res.json({
      success: true,
      prompts
    });
  } catch (error) {
    console.error('Error getting available prompts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available prompts',
      error: error.message
    });
  }
};

/**
 * Submit prompt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitPrompt = async (req, res) => {
  try {
    const { promptId, trainerId } = req.body;

    // Validate required fields
    if (!promptId || !trainerId) {
      return res.status(400).json({
        success: false,
        message: 'Prompt ID and trainer ID are required'
      });
    }

    // Get Discord ID from authenticated user for submission user_id field and ownership checks
    let userId = req.user.discord_id || req.user.id;

    // Get prompt
    const promptQuery = `
      SELECT * FROM prompts WHERE id = $1
    `;
    const prompts = await db.asyncAll(promptQuery, [promptId]);
    if (!prompts.length) {
      return res.status(404).json({
        success: false,
        message: 'Prompt not found'
      });
    }
    const prompt = prompts[0];

    // Get trainer
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Check if user owns the trainer
    if (trainer.player_user_id !== userId && !req.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this trainer'
      });
    }

    // Upload submission file to Cloudinary if provided
    let submissionUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'submissions/prompts'
      });
      submissionUrl = result.secure_url;
    } else if (req.body.submissionUrl) {
      submissionUrl = req.body.submissionUrl;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Submission file or URL is required'
      });
    }

    // Create prompt submission directly in prompt_submissions table
    const submissionResult = await db.asyncRun(
      `INSERT INTO prompt_submissions (
        prompt_id, 
        trainer_id, 
        submission_content, 
        submission_notes, 
        status, 
        submitted_at,
        approved_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id`,
      [
        promptId,
        trainerId,
        submissionUrl,
        `Prompt submission for: ${prompt.title}`,
        'approved' // Auto-approve for now
      ]
    );

    const submissionId = submissionResult.rows[0].id;

    // Parse prompt rewards and apply them properly
    const rewardConfig = prompt.rewards ? (typeof prompt.rewards === 'string' ? JSON.parse(prompt.rewards) : prompt.rewards) : {};
    const appliedRewards = await applyPromptRewards(trainerId, rewardConfig, submissionId);

    // Update the submission with applied rewards for record-keeping
    await db.asyncRun(
      'UPDATE prompt_submissions SET rewards_granted = $1 WHERE id = $2',
      [JSON.stringify(appliedRewards), submissionId]
    );

    res.json({
      success: true,
      submission: {
        id: submissionId,
        prompt_id: promptId,
        trainer_id: trainerId,
        submission_content: submissionUrl,
        status: 'approved'
      },
      rewards: appliedRewards,
      message: 'Prompt submitted successfully and rewards have been applied!'
    });
  } catch (error) {
    console.error('Error submitting prompt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit prompt',
      error: error.message
    });
  }
};

/**
 * Calculate prompt rewards
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const calculatePromptRewards = async (req, res) => {
  try {
    const { promptId } = req.body;

    // Validate required fields
    if (!promptId) {
      return res.status(400).json({
        success: false,
        message: 'Prompt ID is required'
      });
    }

    // Get prompt
    const promptQuery = `
      SELECT * FROM prompts WHERE id = $1
    `;
    const prompts = await db.asyncAll(promptQuery, [promptId]);
    if (!prompts.length) {
      return res.status(404).json({
        success: false,
        message: 'Prompt not found'
      });
    }
    const prompt = prompts[0];

    // Parse and return the reward configuration for preview
    const rewards = typeof prompt.rewards === 'string' ? JSON.parse(prompt.rewards) : prompt.rewards;

    res.json({
      success: true,
      rewards
    });
  } catch (error) {
    console.error('Error calculating prompt rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate prompt rewards',
      error: error.message
    });
  }
};

/**
 * Generate random items for gift rewards
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateGiftItems = async (req, res) => {
  try {
    const { count } = req.body;

    if (!count || count < 1 || count > 20) {
      return res.status(400).json({
        success: false,
        message: 'Count must be between 1 and 20'
      });
    }

    const ItemRoller = require('../models/ItemRoller');
    const items = [];

    // Generate random items from different categories
    const categories = ['berries', 'pastries', 'evolution', 'balls', 'antiques', 'helditems'];

    for (let i = 0; i < count; i++) {
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];

      try {
        const rolledItem = await ItemRoller.rollOne({ category: randomCategory });
        if (rolledItem) {
          items.push({
            name: rolledItem.name,
            category: rolledItem.category,
            rarity: rolledItem.rarity || 'common',
            quantity: 1
          });
        }
      } catch (err) {
        console.error('Error rolling item:', err);
        // Fallback item
        items.push({
          name: `Random ${randomCategory.slice(0, -1)}`,
          category: randomCategory,
          rarity: 'common',
          quantity: 1
        });
      }
    }

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('Error generating gift items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate gift items',
      error: error.message
    });
  }
};

/**
 * Generate random monsters for gift rewards
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
/**
 * Get user settings for monster roller
 * @param {Object} user - User object
 * @returns {Object} User settings
 */
const getUserSettings = (user) => {
  // Default settings if user has no settings
  const defaultSettings = {
    pokemon_enabled: true,
    digimon_enabled: true,
    yokai_enabled: true,
    nexomon_enabled: true,
    pals_enabled: true,
    fakemon_enabled: true,
    finalfantasy_enabled: true,
    monsterhunter_enabled: true
  };

  // If user has monster_roller_settings, parse them
  if (user && user.monster_roller_settings) {
    try {
      // Check if settings is already an object
      let settings;
      if (typeof user.monster_roller_settings === 'object') {
        settings = user.monster_roller_settings;
      } else {
        settings = JSON.parse(user.monster_roller_settings);
      }
      
      // Convert database format {pokemon: true} to expected format {pokemon_enabled: true}
      const convertedSettings = {};
      
      // Map database format to expected format
      if (settings.pokemon !== undefined) convertedSettings.pokemon_enabled = settings.pokemon;
      if (settings.digimon !== undefined) convertedSettings.digimon_enabled = settings.digimon;
      if (settings.yokai !== undefined) convertedSettings.yokai_enabled = settings.yokai;
      if (settings.pals !== undefined) convertedSettings.pals_enabled = settings.pals;
      if (settings.nexomon !== undefined) convertedSettings.nexomon_enabled = settings.nexomon;
      if (settings.fakemon !== undefined) convertedSettings.fakemon_enabled = settings.fakemon;
      
      // Also support if they're already in the expected format
      if (settings.pokemon_enabled !== undefined) convertedSettings.pokemon_enabled = settings.pokemon_enabled;
      if (settings.digimon_enabled !== undefined) convertedSettings.digimon_enabled = settings.digimon_enabled;
      if (settings.yokai_enabled !== undefined) convertedSettings.yokai_enabled = settings.yokai_enabled;
      if (settings.pals_enabled !== undefined) convertedSettings.pals_enabled = settings.pals_enabled;
      if (settings.nexomon_enabled !== undefined) convertedSettings.nexomon_enabled = settings.nexomon_enabled;
      if (settings.fakemon_enabled !== undefined) convertedSettings.fakemon_enabled = settings.fakemon_enabled;
      
      return { ...defaultSettings, ...convertedSettings };
    } catch (error) {
      console.error('Error parsing user monster roller settings:', error);
    }
  }

  return defaultSettings;
};

const generateGiftMonsters = async (req, res) => {
  try {
    const { count } = req.body;

    if (!count || count < 1 || count > 10) {
      return res.status(400).json({
        success: false,
        message: 'Count must be between 1 and 10'
      });
    }

    const MonsterRoller = require('../models/MonsterRoller');
    const monsters = [];

    // Get user settings for monster rolling
    const userSettings = getUserSettings(req.user);

    // Default parameters for gift monsters (same as starter monsters)
    const defaultParams = {
      tables: ['pokemon', 'digimon', 'yokai', 'nexomon', 'pals'],
      // Only roll base stage or doesn't evolve
      includeStages: ['Base Stage', 'Doesn\'t Evolve'],
      // No legendaries or mythicals
      legendary: false,
      mythical: false,
      // For Digimon, only roll Baby I, Baby II, and Child
      // For Yokai, only roll E, D, and C ranks (early stages)
      includeRanks: ['Baby I', 'Baby II', 'Child', 'E', 'D', 'C'],
      // Fixed quantity settings for gift rewards
      species_min: 1,
      species_max: 2, // Max 2 species
      types_min: 1,
      types_max: 3,  // Max 3 types
      // Force specific attributes for gift monsters
      includeAttributes: ['Virus', 'Vaccine', 'Data', 'Free', 'Variable']
    };

    for (let i = 0; i < count; i++) {
      try {
        const monsterRoller = new MonsterRoller({
          seed: `gift-reward-${Date.now()}-${i}`,
          enabledTables: defaultParams.tables,
          userSettings
        });

        const monster = await monsterRoller.rollMonster(defaultParams);
        if (monster) {
          // Ensure the monster has one of the specified attributes
          const validAttributes = ['Virus', 'Vaccine', 'Data', 'Free', 'Variable'];
          const randomAttribute = validAttributes[Math.floor(Math.random() * validAttributes.length)];
          
          monsters.push({
            name: monster.name || monster.species1 || 'Unknown',
            species1: monster.species1,
            species2: monster.species2,
            type1: monster.type1,
            type2: monster.type2,
            type3: monster.type3,
            attribute: randomAttribute,
            rarity: monster.rarity,
            image_url: monster.image_url
          });
        }
      } catch (err) {
        console.error('Error rolling monster:', err);
        // Fallback monster with valid attribute
        const validAttributes = ['Virus', 'Vaccine', 'Data', 'Free', 'Variable'];
        const randomAttribute = validAttributes[Math.floor(Math.random() * validAttributes.length)];
        
        monsters.push({
          name: 'Mystery Monster',
          species1: 'Unknown',
          type1: 'Normal',
          attribute: randomAttribute,
          rarity: 'common'
        });
      }
    }

    res.json({
      success: true,
      monsters
    });
  } catch (error) {
    console.error('Error generating gift monsters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate gift monsters',
      error: error.message
    });
  }
};

/**
 * Finalize gift rewards allocation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const finalizeGiftRewards = async (req, res) => {
  try {
    const { levelAllocations, itemAssignments, monsterAssignments } = req.body;
    const userId = req.user.discord_id;

    // Validate input
    if (!Array.isArray(levelAllocations) || !Array.isArray(itemAssignments) || !Array.isArray(monsterAssignments)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data'
      });
    }

    const Trainer = require('../models/Trainer');
    const Monster = require('../models/Monster');

    // Process level allocations
    for (const allocation of levelAllocations) {
      if (allocation.type === 'trainer') {
        await Trainer.addLevels(allocation.entityId, allocation.levels);
      } else if (allocation.type === 'monster') {
        await Monster.addLevels(allocation.entityId, allocation.levels);
      }
    }

    // Process item assignments
    for (const itemAssignment of itemAssignments) {
      // Map item category to inventory field
      const categoryToInventory = {
        'berries': 'berries',
        'pastries': 'pastries',
        'evolution': 'evolution',
        'balls': 'balls',
        'antiques': 'antiques',
        'helditems': 'helditems',
        'eggs': 'eggs',
        'seals': 'seals',
        'keyitems': 'keyitems'
      };

      const category = itemAssignment.item.category ? itemAssignment.item.category.toString().toLowerCase() : '';
      const inventoryField = categoryToInventory[category] || 'items';

      await Trainer.updateInventoryItem(
        itemAssignment.trainerId,
        inventoryField,
        itemAssignment.item.name,
        itemAssignment.item.quantity || 1
      );
    }

    // Process monster assignments
    for (const monsterAssignment of monsterAssignments) {
      const MonsterInitializer = require('../utils/MonsterInitializer');

      // Create the monster
      const monsterData = {
        ...monsterAssignment.monster,
        name: monsterAssignment.name,
        trainer_id: monsterAssignment.trainerId,
        level: 1,
        where_met: 'Gift Reward',
        date_met: new Date().toISOString().split('T')[0]
      };

      const createdMonsterId = await Monster.create(monsterData);

      // Initialize the monster with stats, abilities, and moves
      if (createdMonsterId) {
        await MonsterInitializer.initializeMonster(createdMonsterId);
      }
    }

    res.json({
      success: true,
      message: 'Gift rewards processed successfully',
      data: {
        levelsAllocated: levelAllocations.reduce((sum, alloc) => sum + alloc.levels, 0),
        itemsAwarded: itemAssignments.length,
        monstersAwarded: monsterAssignments.length
      }
    });
  } catch (error) {
    console.error('Error finalizing gift rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process gift rewards',
      error: error.message
    });
  }
};

/**
 * Reroll items for a submission
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const rerollSubmissionItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.body;
    const SpecialBerryService = require('../services/specialBerryService');

    // Get the submission
    const submission = await db.asyncGet(
      'SELECT * FROM prompt_submissions WHERE id = $1',
      [id]
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Get the original prompt to retrieve the reward configuration
    const prompt = await db.asyncGet('SELECT * FROM prompts WHERE id = $1', [submission.prompt_id]);
    
    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Original prompt not found'
      });
    }

    // Parse the prompt rewards configuration
    const rewardConfig = prompt.rewards ? (typeof prompt.rewards === 'string' ? JSON.parse(prompt.rewards) : prompt.rewards) : {};

    if (!rewardConfig || Object.keys(rewardConfig).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This prompt does not have any reward configuration set up for rerolling.'
      });
    }

    // Check if submission has random items that can be rerolled
    const hasRandomItems = rewardConfig.items && rewardConfig.items.some(item => 
      item.is_random_from_category || item.is_random_from_set
    );

    if (!hasRandomItems) {
      return res.status(400).json({
        success: false,
        message: 'This prompt does not have random items that can be rerolled'
      });
    }

    // Check if trainer has Forget-Me-Not berries
    const hasForgetMeNot = await SpecialBerryService.hasSpecialBerry(trainerId, 'Forget-Me-Not');
    if (!hasForgetMeNot) {
      return res.status(400).json({
        success: false,
        message: 'Trainer does not have any Forget-Me-Not berries'
      });
    }

    // Consume the berry
    const berryConsumed = await SpecialBerryService.consumeSpecialBerry(trainerId, 'Forget-Me-Not');
    if (!berryConsumed) {
      return res.status(400).json({
        success: false,
        message: 'Failed to consume Forget-Me-Not berry'
      });
    }

    // Reroll only the random items
    const newItems = [];
    for (const item of rewardConfig.items) {
      if (item.is_random_from_category || item.is_random_from_set) {
        const rerolledItem = await applyItemReward(trainerId, item);
        if (rerolledItem) {
          newItems.push(rerolledItem);
        }
      }
    }

    // Update the submission with new items
    const currentRewards = typeof submission.rewards_granted === 'string' 
      ? JSON.parse(submission.rewards_granted) 
      : submission.rewards_granted || {};

    currentRewards.items = newItems;
    currentRewards.hasRandomItems = true;

    await db.asyncRun(
      'UPDATE prompt_submissions SET rewards_granted = $1 WHERE id = $2',
      [JSON.stringify(currentRewards), id]
    );

    console.log(`Rerolled items for submission ${id} using Forget-Me-Not berry`);

    res.json({
      success: true,
      message: 'Items rerolled successfully',
      newItems
    });

  } catch (error) {
    console.error('Error rerolling submission items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Reroll monsters for a submission
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const rerollSubmissionMonsters = async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.body;
    const SpecialBerryService = require('../services/specialBerryService');

    // Get the submission
    const submission = await db.asyncGet(
      'SELECT * FROM prompt_submissions WHERE id = $1',
      [id]
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Get the original prompt to retrieve the reward configuration
    const prompt = await db.asyncGet('SELECT * FROM prompts WHERE id = $1', [submission.prompt_id]);
    
    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Original prompt not found'
      });
    }

    // Parse the prompt rewards configuration
    const rewardConfig = prompt.rewards ? (typeof prompt.rewards === 'string' ? JSON.parse(prompt.rewards) : prompt.rewards) : {};

    console.log('Reroll monsters - prompt reward config:', JSON.stringify(rewardConfig, null, 2));

    if (!rewardConfig || Object.keys(rewardConfig).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This prompt does not have any reward configuration set up for rerolling.'
      });
    }

    console.log('Reroll monsters - reward config structure:', JSON.stringify(rewardConfig, null, 2));
    console.log('Reroll monsters - has monsters array:', !!(rewardConfig.monsters && rewardConfig.monsters.length > 0));
    console.log('Reroll monsters - has monster_roll:', !!(rewardConfig.monster_roll && rewardConfig.monster_roll.enabled));

    // Check if submission has monster rolls that can be rerolled
    const hasMonsterRolls = (rewardConfig.monsters && rewardConfig.monsters.length > 0) ||
                           (rewardConfig.monster_roll && rewardConfig.monster_roll.enabled);

    if (!hasMonsterRolls) {
      return res.status(400).json({
        success: false,
        message: 'This submission does not have monster rolls that can be rerolled'
      });
    }

    // Check if trainer has Forget-Me-Not berries
    const hasForgetMeNot = await SpecialBerryService.hasSpecialBerry(trainerId, 'Forget-Me-Not');
    if (!hasForgetMeNot) {
      return res.status(400).json({
        success: false,
        message: 'Trainer does not have any Forget-Me-Not berries'
      });
    }

    // Consume the berry
    const berryConsumed = await SpecialBerryService.consumeSpecialBerry(trainerId, 'Forget-Me-Not');
    if (!berryConsumed) {
      return res.status(400).json({
        success: false,
        message: 'Failed to consume Forget-Me-Not berry'
      });
    }

    // Get current monsters from rewards to delete them
    const currentRewards = typeof submission.rewards_granted === 'string' 
      ? JSON.parse(submission.rewards_granted) 
      : submission.rewards_granted || {};

    // Delete the old monsters
    if (currentRewards.monsters && currentRewards.monsters.length > 0) {
      for (const monster of currentRewards.monsters) {
        if (monster.id) {
          await db.asyncRun('DELETE FROM monsters WHERE id = $1', [monster.id]);
          console.log(`Deleted old monster ${monster.id} for reroll`);
        }
      }
    }

    // Reroll all monsters with original parameters
    const newMonsters = [];
    
    // Handle new format (monsters array)
    if (rewardConfig.monsters && Array.isArray(rewardConfig.monsters)) {
      for (const monsterRoll of rewardConfig.monsters) {
        const rerolledMonster = await applyMonsterRoll(trainerId, monsterRoll);
        if (rerolledMonster) {
          newMonsters.push(rerolledMonster);
        }
      }
    }
    
    // Handle legacy format (monster_roll object)
    if (rewardConfig.monster_roll && rewardConfig.monster_roll.enabled) {
      const rerolledMonster = await applyMonsterRoll(trainerId, rewardConfig.monster_roll.parameters || {});
      if (rerolledMonster) {
        newMonsters.push(rerolledMonster);
      }
    }

    // Update the submission with new monsters
    currentRewards.monsters = newMonsters;

    await db.asyncRun(
      'UPDATE prompt_submissions SET rewards_granted = $1 WHERE id = $2',
      [JSON.stringify(currentRewards), id]
    );

    console.log(`Rerolled ${newMonsters.length} monsters for submission ${id} using Forget-Me-Not berry`);

    res.json({
      success: true,
      message: 'Monsters rerolled successfully',
      newMonsters
    });

  } catch (error) {
    console.error('Error rerolling submission monsters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Claim a monster from submission rewards
 * @param {Object} req - Express request object  
 * @param {Object} res - Express response object
 */
const claimSubmissionMonster = async (req, res) => {
  try {
    const { id } = req.params; // submission ID
    const { trainerId, monsterIndex, monsterName } = req.body;

    console.log(`Claiming monster ${monsterIndex} from submission ${id} for trainer ${trainerId} with name "${monsterName}"`);

    // Get the submission
    const submission = await db.asyncGet(
      'SELECT * FROM prompt_submissions WHERE id = $1',
      [id]
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Parse the rewards to find the monster
    const rewards = typeof submission.rewards_granted === 'string' 
      ? JSON.parse(submission.rewards_granted) 
      : submission.rewards_granted || {};

    if (!rewards.monsters || !rewards.monsters[monsterIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Monster not found in submission rewards'
      });
    }

    const monster = rewards.monsters[monsterIndex];

    // Check if already claimed
    if (monster.claimed) {
      return res.status(400).json({
        success: false,
        message: 'Monster has already been claimed'
      });
    }

    // Validate trainer exists and user owns it
    const trainer = await Trainer.getById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Create monster data structure like the garden system does
    const monsterData = {
      trainer_id: trainerId,
      name: monsterName || monster.species1 || 'Unnamed',
      species1: monster.species1,
      species2: monster.species2 || null,
      species3: monster.species3 || null,
      type1: monster.type1,
      type2: monster.type2 || null,
      type3: monster.type3 || null,
      type4: monster.type4 || null,
      type5: monster.type5 || null,
      attribute: monster.attribute,
      level: monster.level || 1,
      img_link: monster.img_link || null,
      where_met: 'Prompt Submission'
    };

    // Initialize the monster with proper stats and moves using the complete data
    const MonsterInitializer = require('../utils/MonsterInitializer');
    const Monster = require('../models/Monster');
    
    const initializedMonster = await MonsterInitializer.initializeMonster(monsterData);
    console.log('Submission monster initialized:', initializedMonster);

    // Create the monster in the database
    const createdMonster = await Monster.create(initializedMonster);
    console.log(`Created submission monster in database with ID: ${createdMonster.id}`);

    if (!createdMonster) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create monster'
      });
    }

    console.log(`Successfully claimed monster ${createdMonster.id} for trainer ${trainerId} with name "${monsterName}"`);

    // Update the submission rewards to mark this monster as claimed
    rewards.monsters[monsterIndex] = {
      ...rewards.monsters[monsterIndex],
      claimed: true,
      claimed_by: trainerId,
      claimed_at: new Date().toISOString(),
      final_name: monsterName,
      monster_id: createdMonster.id
    };

    await db.asyncRun(
      'UPDATE prompt_submissions SET rewards_granted = $1 WHERE id = $2',
      [JSON.stringify(rewards), id]
    );

    res.json({
      success: true,
      message: 'Monster claimed successfully',
      monster: {
        ...createdMonster,
        claimed: true
      }
    });

  } catch (error) {
    console.error('Error claiming submission monster:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};


/**
 * Get user's books for chapter assignment
 */
const getUserBooks = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT
        s.id,
        s.title,
        s.description,
        s.submission_date,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main = 1 LIMIT 1) as cover_image_url,
        (SELECT COUNT(*) FROM submissions WHERE parent_id = s.id) as chapter_count
      FROM submissions s
      WHERE s.submission_type = 'writing'
        AND s.is_book = 1
        AND s.user_id = $1
      ORDER BY s.submission_date DESC
    `;

    const books = await db.asyncAll(query, [userId]);

    res.json({
      success: true,
      books
    });
  } catch (error) {
    console.error('Error fetching user books:', error);
    res.status(500).json({ error: 'Failed to fetch user books' });
  }
};

/**
 * Get chapters for a book
 */
const getBookChapters = async (req, res) => {
  try {
    const bookId = parseInt(req.params.bookId);

    // First verify the book exists
    const bookQuery = `
      SELECT id, title, is_book FROM submissions WHERE id = $1
    `;
    const bookResult = await db.asyncAll(bookQuery, [bookId]);

    if (!bookResult.length) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (!bookResult[0].is_book) {
      return res.status(400).json({ error: 'This submission is not a book' });
    }

    // Get chapters ordered by chapter_number or submission_date
    const query = `
      SELECT
        s.id,
        s.title,
        s.description,
        s.submission_date,
        s.chapter_number,
        (SELECT SUM(LENGTH(content) - LENGTH(REPLACE(content, ' ', '')) + 1)
         FROM submissions WHERE id = s.id) as word_count,
        (SELECT image_url FROM submission_images WHERE submission_id = s.id AND is_main = 1 LIMIT 1) as cover_image_url
      FROM submissions s
      WHERE s.parent_id = $1
      ORDER BY
        CASE WHEN s.chapter_number IS NOT NULL THEN s.chapter_number ELSE 999999 END ASC,
        s.submission_date ASC
    `;

    const chapters = await db.asyncAll(query, [bookId]);

    res.json({
      success: true,
      bookId,
      bookTitle: bookResult[0].title,
      chapters
    });
  } catch (error) {
    console.error('Error fetching book chapters:', error);
    res.status(500).json({ error: 'Failed to fetch book chapters' });
  }
};

/**
 * Update chapter order in a book
 */
const updateChapterOrder = async (req, res) => {
  try {
    const bookId = parseInt(req.params.bookId);
    const { chapterOrder } = req.body;
    const userId = req.user.id;

    // Verify the user owns this book
    const bookQuery = `
      SELECT id, user_id FROM submissions WHERE id = $1 AND is_book = 1
    `;
    const bookResult = await db.asyncAll(bookQuery, [bookId]);

    if (!bookResult.length) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (bookResult[0].user_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to modify this book' });
    }

    // Update chapter numbers
    for (let i = 0; i < chapterOrder.length; i++) {
      const chapterId = chapterOrder[i];
      await db.asyncRun(
        `UPDATE submissions SET chapter_number = $1 WHERE id = $2 AND parent_id = $3`,
        [i + 1, chapterId, bookId]
      );
    }

    res.json({
      success: true,
      message: 'Chapter order updated successfully'
    });
  } catch (error) {
    console.error('Error updating chapter order:', error);
    res.status(500).json({ error: 'Failed to update chapter order' });
  }
};

/**
 * Create a new book (without content, just metadata)
 */
const createBook = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    const userId = req.user.id;

    // Create the book submission
    const submission = await Submission.create({
      userId,
      trainerId: null,
      title,
      description: description || '',
      contentType: 'book',
      content: null,
      submissionType: 'writing',
      isBook: 1,
      parentId: null,
      status: 'approved'
    });

    // Handle cover image upload
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'submissions/covers'
      });

      await db.asyncRun(
        `INSERT INTO submission_images (submission_id, image_url, is_main, order_index) VALUES ($1, $2, 1, 0)`,
        [submission.id, result.secure_url]
      );
    } else if (req.body.coverImageUrl) {
      await db.asyncRun(
        `INSERT INTO submission_images (submission_id, image_url, is_main, order_index) VALUES ($1, $2, 1, 0)`,
        [submission.id, req.body.coverImageUrl]
      );
    }

    // Handle tags
    if (tags) {
      const tagArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
      for (const tag of tagArray) {
        await db.asyncRun(
          `INSERT INTO submission_tags (submission_id, tag) VALUES ($1, $2)`,
          [submission.id, tag]
        );
      }
    }

    res.json({
      success: true,
      book: submission
    });
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Failed to create book' });
  }
};

module.exports = {
  getArtGallery,
  getWritingLibrary,
  getSubmissionTags,
  getSubmissionById,
  calculateArtRewards,
  calculateWritingRewards,
  calculateReferenceRewards,
  submitArt,
  submitWriting,
  submitReference,
  allocateGiftLevels,
  allocateGiftCoins,
  allocateCappedLevels,
  allocateGiftItem,
  getGiftItems,
  getSubmissionRewards,
  getAvailablePrompts,
  submitPrompt,
  calculatePromptRewards,
  generateGiftItems,
  generateGiftMonsters,
  finalizeGiftRewards,
  rerollSubmissionItems,
  rerollSubmissionMonsters,
  claimSubmissionMonster,
  getUserBooks,
  getBookChapters,
  updateChapterOrder,
  createBook
};

/**
 * Apply prompt rewards to trainer using proper model methods
 * @param {number} trainerId - Trainer ID
 * @param {Object} rewardConfig - Reward configuration from prompt
 * @param {number} submissionId - Submission ID for logging
 * @returns {Object} Applied rewards summary
 */
async function applyPromptRewards(trainerId, rewardConfig, submissionId) {
  const appliedRewards = {
    levels: 0,
    coins: 0,
    items: [],
    monsters: [],
    trainer_id: trainerId,
    hasRandomItems: false
  };

  try {
    // Apply basic rewards using proper Trainer methods
    if (rewardConfig.levels && rewardConfig.levels > 0) {
      await Trainer.addLevels(trainerId, rewardConfig.levels);
      appliedRewards.levels = rewardConfig.levels;
      console.log(`Applied ${rewardConfig.levels} levels to trainer ${trainerId} from prompt submission ${submissionId}`);
    }

    if (rewardConfig.coins && rewardConfig.coins > 0) {
      await Trainer.addCoins(trainerId, rewardConfig.coins);
      appliedRewards.coins = rewardConfig.coins;
      console.log(`Applied ${rewardConfig.coins} coins to trainer ${trainerId} from prompt submission ${submissionId}`);
    }

    // Apply items (including random items)
    if (rewardConfig.items && Array.isArray(rewardConfig.items)) {
      // Check if there are any random items
      const hasRandomItems = rewardConfig.items.some(item => 
        item.is_random_from_category || item.is_random_from_set
      );
      appliedRewards.hasRandomItems = hasRandomItems;

      for (const item of rewardConfig.items) {
        const appliedItem = await applyItemReward(trainerId, item);
        if (appliedItem) {
          appliedRewards.items.push(appliedItem);
        }
      }
    }

    // Apply monster rolls if configured (new format)
    if (rewardConfig.monsters && Array.isArray(rewardConfig.monsters)) {
      for (const monsterRoll of rewardConfig.monsters) {
        const rolledMonster = await applyMonsterRoll(trainerId, monsterRoll);
        if (rolledMonster) {
          appliedRewards.monsters.push(rolledMonster);
        }
      }
    }

    // Apply monster roll if configured (legacy format)
    if (rewardConfig.monster_roll && rewardConfig.monster_roll.enabled) {
      const rolledMonster = await applyMonsterRoll(trainerId, rewardConfig.monster_roll.parameters || {});
      if (rolledMonster) {
        appliedRewards.monsters.push(rolledMonster);
      }
    }

    return appliedRewards;
  } catch (error) {
    console.error('Error applying prompt rewards:', error);
    throw error;
  }
}

/**
 * Apply item reward (handles random items from categories/sets)
 * @param {number} trainerId - Trainer ID
 * @param {Object} item - Item configuration
 * @returns {Object|null} Applied item details or null
 */
async function applyItemReward(trainerId, item) {
  try {
    let itemToAdd = null;
    
    // Handle different item configuration types
    if (item.is_random_from_category && item.category) {
      // Random item from category - get items from the items table by category
      const categoryItems = await db.asyncAll(
        'SELECT id, name, category FROM items WHERE category = $1', 
        [item.category]
      );
      if (categoryItems.length > 0) {
        const randomItem = categoryItems[Math.floor(Math.random() * categoryItems.length)];
        itemToAdd = {
          item_name: randomItem.name,
          inventory_category: randomItem.category,
          quantity: item.quantity || 1,
          chance: item.chance || 100
        };
      }
    } else if (item.is_random_from_set && item.random_set_items?.length > 0) {
      // Random item from custom set
      const validSetItems = item.random_set_items.filter(id => id);
      if (validSetItems.length > 0) {
        const randomItemId = validSetItems[Math.floor(Math.random() * validSetItems.length)];
        const randomItem = await db.asyncGet(
          'SELECT id, name, category FROM items WHERE id = $1',
          [randomItemId]
        );
        if (randomItem) {
          itemToAdd = {
            item_name: randomItem.name,
            inventory_category: randomItem.category,
            quantity: item.quantity || 1,
            chance: item.chance || 100
          };
        }
      }
    } else {
      // Specific item - need to look up the item details
      let itemName = item.item_name;
      let inventoryCategory = item.category;
      
      if (item.item_id && !itemName) {
        const itemRecord = await db.asyncGet('SELECT name, category FROM items WHERE id = $1', [item.item_id]);
        if (itemRecord) {
          itemName = itemRecord.name;
          inventoryCategory = itemRecord.category;
        }
      }
      
      if (itemName) {
        itemToAdd = {
          item_name: itemName,
          inventory_category: inventoryCategory,
          quantity: item.quantity || 1,
          chance: item.chance || 100
        };
      }
    }
    
    if (!itemToAdd) {
      console.warn('No item to add for configuration:', item);
      return null;
    }

    const quantity = itemToAdd.quantity || 1;
    const chance = itemToAdd.chance || 100;

    // Check if item should be given based on chance
    if (Math.random() * 100 > chance) {
      console.log(`Item ${itemToAdd.item_name} not given due to chance (${chance}%)`);
      return null;
    }

    // Use the proper Trainer model method to add the item
    await Trainer.updateInventoryItem(trainerId, itemToAdd.inventory_category, itemToAdd.item_name, quantity);

    console.log(`Added ${quantity}x ${itemToAdd.item_name} (${itemToAdd.inventory_category}) to trainer ${trainerId}`);
    
    return {
      item_name: itemToAdd.item_name,
      category: itemToAdd.inventory_category,
      quantity: quantity
    };
  } catch (error) {
    console.error('Error applying item reward:', error);
    return null;
  }
}

/**
 * Apply monster roll reward
 * @param {number} trainerId - Trainer ID  
 * @param {Object} rollParams - Monster roll parameters
 * @returns {Object|null} Rolled monster or null
 */
async function applyMonsterRoll(trainerId, rollParams = {}) {
  try {
    const MonsterRoller = require('../models/MonsterRoller');
    const monsterRoller = new MonsterRoller();
    
    // Set parameters for monster rolling
    const rollParameters = {
      trainerId: trainerId,
      tables: rollParams.tables || ['pokemon', 'digimon', 'yokai'],
      legendary: rollParams.legendary || false,
      mythical: rollParams.mythical || false,
      onlyLegendary: rollParams.onlyLegendary || false,
      onlyMythical: rollParams.onlyMythical || false,
      includeTypes: rollParams.includeTypes || [],
      excludeTypes: rollParams.excludeTypes || [],
      includeAttributes: rollParams.includeAttributes || [],
      excludeAttributes: rollParams.excludeAttributes || [],
      includeSpecies: rollParams.includeSpecies || [],
      excludeSpecies: rollParams.excludeSpecies || [],
      includeStages: rollParams.includeStages || [],
      species_max: rollParams.species_max || 2,
      types_max: rollParams.types_max || 3,
      max_stage: rollParams.max_stage || 2,
      baby_allowed: rollParams.baby_allowed !== false,
      ...rollParams
    };
    
    // Log the monster roll type for debugging
    if (rollParameters.onlyLegendary) {
      console.log('Monster roll: Only Legendary mode (Pokemon & Nexomon legendaries)');
    } else if (rollParameters.onlyMythical) {
      console.log('Monster roll: Only Mythical mode (Pokemon & Nexomon mythicals + Yokai S-rank)');
    }

    // Roll the monster - MonsterRoller.rollMonster already creates and saves the monster to the database
    const rolledMonster = await monsterRoller.rollMonster(rollParameters);

    console.log(`Rolled monster ${rolledMonster.id} (${rolledMonster.name || rolledMonster.species_name}) for trainer ${trainerId} from prompt reward`);
    return rolledMonster;
  } catch (error) {
    console.error('Error rolling monster:', error);
    return null;
  }
}
