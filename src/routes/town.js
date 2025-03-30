router.get('/town/witchs_hut', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.session.user) {
      return res.redirect('/login');
    }

    // Get the user's trainers
    const userTrainers = await Trainer.getByUserId(req.session.user.discord_id);

    // Render the page with the trainers data
    res.render('town/witchs_hut', {
      userTrainers: userTrainers
    });
  } catch (error) {
    console.error('Error loading witch\'s hut:', error);
    res.render('town/witchs_hut', {
      error: 'Failed to load trainers'
    });
  }
});