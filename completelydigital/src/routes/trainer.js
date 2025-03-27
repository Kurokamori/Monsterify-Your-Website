router.get('/:id/additional-references', async (req, res) => {
    try {
        const trainer = await Trainer.findById(req.params.id);
        if (!trainer) {
            return res.status(404).render('error', { message: 'Trainer not found' });
        }

        res.render('trainers/additional-references', {
            trainer,
            title: `${trainer.name} - Additional References`,
            category: 'trainers' // Add this line
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).render('error', { message: 'Server error' });
    }
});