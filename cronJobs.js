const cron = require('node-cron');
const cloudinary = require('cloudinary').v2;
const Story = require('./models/story'); 

// Tarea programada para eliminar historias expiradas
cron.schedule('0 * * * *', async () => { // Esto se ejecutará cada hora
    console.log('Revisando historias expiradas...');
    try {
        // Buscar historias cuya fecha de expiración ya pasó
        const expiredStories = await Story.find({ expiresAt: { $lte: Date.now() } });

        for (const story of expiredStories) {
            // Eliminar imagen de Cloudinary
            await cloudinary.uploader.destroy(story.cloudinaryPublicId);

            // Eliminar historia de la base de datos
            await Story.findByIdAndDelete(story._id);
        }

        console.log(`${expiredStories.length} historias eliminadas`);
    } catch (err) {
        console.error("Error al eliminar historias expiradas:", err);
    }
});

module.exports = cron;
