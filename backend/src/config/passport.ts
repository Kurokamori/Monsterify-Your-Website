import passport from 'passport';
import { Strategy as DiscordStrategy, Profile } from 'passport-discord';
import { UserService, DiscordProfile } from '@services/user.service';

const userService = new UserService();

type DoneCallback = (error: Error | null, user?: Express.User | false) => void;

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID as string,
    clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    callbackURL: process.env.DISCORD_CALLBACK_URL as string,
    scope: ['identify']
}, async (_accessToken: string, _refreshToken: string, profile: Profile, done: DoneCallback) => {
    try {
        // Convert passport-discord Profile to our DiscordProfile type
        const discordProfile: DiscordProfile = {
            id: profile.id,
            username: profile.username,
            global_name: profile.global_name ?? undefined,
        };
        const user = await userService.findOrCreateFromDiscord(discordProfile);
        return done(null, user);
    } catch (error) {
        return done(error as Error, false);
    }
}));

passport.serializeUser((user: Express.User, done: (err: unknown, id?: number) => void) => {
    done(null, (user as { id: number }).id);
});

passport.deserializeUser(async (id: number, done: (err: unknown, user?: Express.User | null) => void) => {
    try {
        const user = await userService.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
