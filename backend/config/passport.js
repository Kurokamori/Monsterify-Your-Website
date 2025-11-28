const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const User = require('../models/User');

// Debug Discord configuration
console.log('Discord OAuth Configuration:');
console.log('Client ID:', process.env.DISCORD_CLIENT_ID ? 'Set' : 'NOT SET');
console.log('Client Secret:', process.env.DISCORD_CLIENT_SECRET ? 'Set (length: ' + process.env.DISCORD_CLIENT_SECRET.length + ')' : 'NOT SET');
console.log('Callback URL:', process.env.DISCORD_CALLBACK_URL || "/api/auth/discord/callback");

// Discord OAuth Strategy
passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL || "/api/auth/discord/callback",
    scope: ['identify']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('Discord OAuth Success - Profile received:', {
            id: profile.id,
            username: profile.username,
            globalName: profile.global_name,
            discriminator: profile.discriminator,
            avatar: profile.avatar,
            email: profile.email
        });
        
        // Find or create user from Discord profile
        const user = await User.findOrCreateFromDiscord(profile);
        console.log('User created/found:', user ? { id: user.id, username: user.username, discord_id: user.discord_id } : 'NO USER RETURNED');
        return done(null, user);
    } catch (error) {
        console.error('Discord OAuth error in passport strategy:', error);
        return done(error, null);
    }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;