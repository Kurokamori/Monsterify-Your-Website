// Add detailed logging to the getActivitySession function
const getActivitySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id || req.user.discord_id;

    console.log(`[townController] Getting activity session: ${sessionId} for user: ${userId}`);

    if (!sessionId) {
      console.log('[townController] Missing sessionId parameter');
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }

    // First check if session exists in memory
    let session = activeSessions[sessionId];
    console.log('[townController] Session from memory:', session);

    // If not in memory, try to get from database
    if (!session) {
      console.log('[townController] Session not found in memory, checking database');
      try {
        const dbSession = await db.asyncGet(
          `SELECT * FROM location_activity_sessions WHERE session_id = $1`,
          [sessionId]
        );
        
        console.log('[townController] Session from database:', dbSession);

        if (dbSession) {
          // Parse rewards if they exist
          let rewards = [];
          if (dbSession.rewards) {
            try {
              rewards = typeof dbSession.rewards === 'string'
                ? JSON.parse(dbSession.rewards)
                : dbSession.rewards;
            } catch (parseError) {
              console.error('[townController] Error parsing rewards JSON:', parseError);
            }
          }

          // Convert database session to memory session format
          session = {
            session_id: dbSession.session_id,
            user_id: dbSession.player_id,
            location: dbSession.location,
            activity: dbSession.activity,
            prompt_id: dbSession.prompt_id,
            status: dbSession.completed ? 'completed' : 'active',
            created_at: dbSession.created_at || dbSession.start_time,
            completed_at: dbSession.completed_at || dbSession.end_time,
            rewards: rewards
          };

          // Store in memory for future use
          activeSessions[sessionId] = session;
        }
      } catch (dbError) {
        console.error('[townController] Error fetching session from database:', dbError);
      }
    }

    if (!session) {
      console.log('[townController] Session not found in memory or database');
      return res.status(404).json({ success: false, message: 'Session not found or has expired' });
    }

    // Check if the session belongs to the user
    if (session.user_id !== userId) {
      console.log(`[townController] Session belongs to ${session.user_id}, not ${userId}`);
      return res.status(403).json({ success: false, message: 'Not authorized to view this session' });
    }

    // Get the prompt from the database
    let prompt;
    try {
      const prompts = await getActivityPrompts(session.location, session.activity);
      prompt = prompts.find(p => p.id === session.prompt_id);
      console.log('[townController] Found prompt:', prompt);
    } catch (promptError) {
      console.error('[townController] Error getting prompt:', promptError);
    }

    if (!prompt) {
      prompt = {
        id: session.prompt_id,
        prompt_text: 'Complete the activity to earn rewards.'
      };
    }

    // Get the flavor from the database
    let flavor;
    try {
      flavor = await getLocationFlavor(session.location, session.activity);
      console.log('[townController] Found flavor:', flavor);
    } catch (flavorError) {
      console.error('[townController] Error getting flavor:', flavorError);
    }

    if (!flavor) {
      flavor = {
        image_url: '/images/locations/default.jpg',
        flavor_text: 'You begin your task, taking in the surroundings...'
      };
    }

    console.log('[townController] Sending session response:', { session, prompt, flavor });
    
    res.json({
      success: true,
      session,
      prompt,
      flavor
    });
  } catch (error) {
    console.error('[townController] Error getting session details:', error);
    res.status(500).json({ success: false, message: 'Failed to get session details' });
  }
};