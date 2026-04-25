import {
    ApplicationCommand,
    Channel,
    Client,
    DiscordAPIError,
    RESTJSONErrorCodes as DiscordApiErrors,
    Guild,
    GuildMember,
    Locale,
    NewsChannel,
    Role,
    StageChannel,
    TextChannel,
    User,
    VoiceChannel,
} from 'discord.js';

import { PermissionUtils, RegexUtils } from './index.js';
import { Lang } from '../services/index.js';

const FETCH_MEMBER_LIMIT = 20;
const IGNORED_ERRORS = [
    DiscordApiErrors.UnknownMessage,
    DiscordApiErrors.UnknownChannel,
    DiscordApiErrors.UnknownGuild,
    DiscordApiErrors.UnknownMember,
    DiscordApiErrors.UnknownUser,
    DiscordApiErrors.UnknownInteraction,
    DiscordApiErrors.MissingAccess,
];

export class ClientUtils {
    public static async getGuild(client: Client, discordId: string): Promise<Guild | undefined> {
        let guildId = RegexUtils.discordId(discordId);
        if (!guildId) {
            return;
        }

        try {
            return await client.guilds.fetch(guildId);
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async getChannel(
        client: Client,
        discordId: string
    ): Promise<Channel | undefined> {
        let channelId = RegexUtils.discordId(discordId);
        if (!channelId) {
            return;
        }

        try {
            return (await client.channels.fetch(channelId)) ?? undefined;
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async getUser(client: Client, discordId: string): Promise<User | undefined> {
        let userId = RegexUtils.discordId(discordId);
        if (!userId) {
            return;
        }

        try {
            return await client.users.fetch(userId);
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async findAppCommand(
        client: Client,
        name: string
    ): Promise<ApplicationCommand | undefined> {
        let commands = await client.application?.commands.fetch();
        return commands?.find(command => command.name === name);
    }

    public static async findMember(guild: Guild, input: string): Promise<GuildMember | undefined> {
        try {
            let discordId = RegexUtils.discordId(input);
            if (discordId) {
                return await guild.members.fetch(discordId);
            }

            let tag = RegexUtils.tag(input);
            if (tag) {
                return (
                    await guild.members.fetch({ query: tag.username, limit: FETCH_MEMBER_LIMIT })
                ).find(member => member.user.discriminator === tag.discriminator);
            }

            return (await guild.members.fetch({ query: input, limit: 1 })).first();
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async findRole(guild: Guild, input: string): Promise<Role | undefined> {
        try {
            let roleId = RegexUtils.discordId(input);
            if (roleId) {
                return (await guild.roles.fetch(roleId)) ?? undefined;
            }

            let search = input.trim().toLowerCase().replace(/^@/, '');
            let roles = await guild.roles.fetch();
            return (
                roles.find(role => role.name.toLowerCase() === search) ??
                roles.find(role => role.name.toLowerCase().includes(search))
            );
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async findTextChannel(
        guild: Guild,
        input: string
    ): Promise<NewsChannel | TextChannel | undefined> {
        try {
            let discordId = RegexUtils.discordId(input);
            if (discordId) {
                let channel = await guild.channels.fetch(discordId);
                if (channel instanceof NewsChannel || channel instanceof TextChannel) {
                    return channel;
                } else {
                    return;
                }
            }

            let search = input.trim().toLowerCase().replace(/^#/, '').replaceAll(' ', '-');
            let channels = [...(await guild.channels.fetch()).values()].filter(
                channel => channel instanceof NewsChannel || channel instanceof TextChannel
            );
            return (
                channels.find(channel => channel.name.toLowerCase() === search) ??
                channels.find(channel => channel.name.toLowerCase().includes(search))
            );
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async findVoiceChannel(
        guild: Guild,
        input: string
    ): Promise<VoiceChannel | StageChannel | undefined> {
        try {
            let discordId = RegexUtils.discordId(input);
            if (discordId) {
                let channel = await guild.channels.fetch(discordId);
                if (channel instanceof VoiceChannel || channel instanceof StageChannel) {
                    return channel;
                } else {
                    return;
                }
            }

            let search = input.trim().toLowerCase().replace(/^#/, '');
            let channels = [...(await guild.channels.fetch()).values()].filter(
                channel => channel instanceof VoiceChannel || channel instanceof StageChannel
            );
            return (
                channels.find(channel => channel.name.toLowerCase() === search) ??
                channels.find(channel => channel.name.toLowerCase().includes(search))
            );
        } catch (error) {
            if (
                error instanceof DiscordAPIError &&
                typeof error.code == 'number' &&
                IGNORED_ERRORS.includes(error.code)
            ) {
                return;
            } else {
                throw error;
            }
        }
    }

    public static async findNotifyChannel(
        guild: Guild,
        langCode: Locale
    ): Promise<TextChannel | NewsChannel> {
        // Prefer the system channel
        let systemChannel = guild.systemChannel;
        if (systemChannel && PermissionUtils.canSend(systemChannel, true)) {
            return systemChannel;
        }

        // Otherwise look for a bot channel
        return (await guild.channels.fetch()).find(
            channel =>
                (channel instanceof TextChannel || channel instanceof NewsChannel) &&
                PermissionUtils.canSend(channel, true) &&
                Lang.getRegex('channelRegexes.bot', langCode).test(channel.name)
        ) as TextChannel | NewsChannel;
    }
}
