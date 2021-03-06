import {
	Message,
	Client,
	MessageEmbed
} from 'discord.js'
import {
	BotCommand,
	Permission
} from '../../enums'
import { MongoConnector } from '../../db/MongoConnector'
import { IgnoredChannel } from '../../entities'
import { BaseHandler } from './BaseHandler'
import { Logger } from '../../Logger'
import { Constants, Messages } from '../../descriptor'
import { ChannelIdValidator } from '../../services/ChannelIdValidator'
import { Config } from '../../Config'
import { TypeGuarder } from '../../services'

export class IgnoreChannel extends BaseHandler {
	private client: Client
	private mongoConnector: MongoConnector
	private channelIdValidator: ChannelIdValidator

	constructor(logger: Logger, client: Client, mongoConnector: MongoConnector, config: Config) {
		super(logger, config, BotCommand.ignore)
		this.mongoConnector = mongoConnector
		this.client = client
		this.channelIdValidator = new ChannelIdValidator(this.logger, this.client)
	}

	protected process(message: Message): void {
		const args = this.splitArguments(this.trimCommand(message))
		const ignore = args[0] === Constants.enable
		const guildId = message.guild?.id as string
		for (let i = 1; i < args.length; i++) {
			this.handleChannelId(ignore, message, args[i], guildId)
		}
	}

	private handleChannelId(ignore: boolean, message: Message, channelId: string, guildId: string) {
		try {
			this.handleIgnore(message, channelId, guildId, ignore)
				.catch(reason => this.logger.logError(this.constructor.name, this.handleIgnore.name, reason))
		}
		catch (e) {
			const msg = e instanceof Error ? e.message : Messages.errorProcessingChannelId + channelId
			this.logger.logError(this.constructor.name, this.handleChannelId.name, msg, channelId)
			message.channel.send(msg)
				.catch(reason => this.logger.logError(this.constructor.name, this.handleChannelId.name, reason))
		}
	}

	private async handleIgnore(message: Message, channelId: string, guildId: string, ignore: boolean): Promise<void> {
		this.channelIdValidator.validate(message.channel, channelId, guildId, true)

		return ignore
			? this.addIgnore(guildId, channelId, TypeGuarder.isCategory(message.guild?.channels.resolve(channelId)))
			: this.deleteIgnore(guildId, channelId)
	}

	private async deleteIgnore(guildId: string, channelId: string): Promise<void> {
		const exists = await this.mongoConnector.ignoredChannels.exists(guildId, channelId)
		if(!exists) return
		this.mongoConnector.ignoredChannels.delete(guildId, channelId)
			.catch(reason => this.logger.logError(this.constructor.name, this.deleteIgnore.name, reason))
	}

	private async addIgnore(guildId: string, channelId: string, isCategory: boolean): Promise<void> {
		const ignoredChannel: IgnoredChannel = {
			guildId,
			channelId,
			isCategory
		}
		const alreadyExist = await this.mongoConnector.ignoredChannels.exists(guildId, channelId)
		if(alreadyExist) return
		this.mongoConnector.ignoredChannels.insert(ignoredChannel)
			.catch(reason => this.logger.logError(this.constructor.name, this.addIgnore.name, reason))
	}

	protected hasPermissions(message: Message): boolean {
		return super.hasPermissions(message) ||
            (message.member !== null && message.member.hasPermission(Permission.manageChannels, { checkAdmin: true, checkOwner: true}))
	}

	public fillEmbed(embed: MessageEmbed): void {
		embed
			.addField(`${this.cmd} [0/1] {channelId}`, `
        Start/stop ignoring voice channel / category with voice channels when checking for linked text channel.
        Used when there's no need for linked text channel for the specific Voice Channel / Voice Channels inside specific Category.
        \`1\` means start ignoring, \`0\` - stop ignoring and handle the Voice Channel as usual.
        Supports arguments chaining - you're allowed to use more than 1 Voice Channel ID / Category ID.

        If the channelId is invalid, the bot will post a warning in the chat.

        Examples: 
        \`${this.cmd} 1 717824008636334130\` - request to start ignoring the Voice Channel with the ID \`717824008636334130\`
        \`${this.cmd} 0 717824008636334130\` - request to remove the Voice Channel with the ID \`717824008636334130\` from Ignore List and handle it as usual 
        
        Requires user to have admin/owner rights or permissions to manage channels and roles.
        `)
	}
}