import { Client, Message, PartialMessage } from "discord.js"
import { Logger } from "./handlers/Logger"
import { ChannelOperator } from "./handlers/ChannelOperator"
import { ClientEvent } from "./enums/ClientEvent"
import { ProcessEvent } from "./enums/ProcessEvent"
import { Config } from "./config"
import { InfoHandlers } from "./handlers/InfoHandlers"
import { MongoConnector } from "./db/MongoConnector"
import { ServerHandlers } from "./handlers/ServerHandlers"
import { TextHandlers } from "./handlers/TextHandlers"
import { IgnoreHandler } from "./handlers/IgnoreHandler"
import { SettingsHandlers } from "./handlers/SettingsHandlers"

export class EventRegistry {
    private client: Client
    private config: Config

    private logger: Logger
    private channelOperator: ChannelOperator
    private infoHandlers: InfoHandlers
    private textHandlers: TextHandlers
    private serverHandlers: ServerHandlers
    private ignoreHandler: IgnoreHandler
    private settingsHandlers: SettingsHandlers

    constructor(client: Client, config: Config) {
        this.client = client
        this.config = config

        let mongoConnector = new MongoConnector(config)

        this.logger = new Logger()
        this.channelOperator = new ChannelOperator(mongoConnector, config, this.logger, client)
        this.infoHandlers = new InfoHandlers(config)
        this.textHandlers = new TextHandlers(config)
        this.serverHandlers = new ServerHandlers(mongoConnector)
        this.ignoreHandler = new IgnoreHandler(client, mongoConnector, config)
        this.settingsHandlers = new SettingsHandlers(config, mongoConnector)
    }

    public registerEvents() {
        // => Log bot started and listening
        this.registerReadyHandler()

        // => Main worker handlers
        this.registerMessageHandler()
        this.registerMessageUpdateHandler()
        this.registerVoiceUpdateHandler()
        this.registerKickHandler()

        // => Bot error and warn handlers
        this.client.on(ClientEvent.Error, this.logger.logError)
        this.client.on(ClientEvent.Warn, this.logger.logWarn)

        // => Process handlers
        this.registerProcessHandlers()
    }

    // ---------------- //
    //  Event Handlers  //
    // ---------------- //

    private registerReadyHandler() {
        !
            this.client.once(ClientEvent.Ready, () => {
                this.logger.introduce(this.client, this.config);
            });
    }

    private registerMessageHandler() {
        this.client.on(ClientEvent.Message, (message: Message) => {
            this.configCommandHandlers(message)
        })
    }

    private registerMessageUpdateHandler() {
        this.client.on(ClientEvent.MessageUpdate, (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
            if((newMessage as Message).type) this.configCommandHandlers(newMessage as Message)
        })
    }

    private registerVoiceUpdateHandler() {
        this.client.on(ClientEvent.VoiceStateUpdate, (oldVoiceState, newVoiceState) => {
            if (newVoiceState.channelID !== oldVoiceState.channelID) {
                if (newVoiceState.channelID) this.channelOperator.handleChannelJoin(newVoiceState)
                if (oldVoiceState.channelID) this.channelOperator.handleChannelLeave(oldVoiceState)
            }
        });
    }

    private registerKickHandler() {
        this.client.on(ClientEvent.GuildDelete, guild => {
            this.serverHandlers.handleBotKickedFromServer(guild)
        })
    }

    private registerProcessHandlers() {
        process.on(ProcessEvent.Exit, () => {
            const msg = `[nexus-bot] Process exit.`
            this.logger.logEvent(msg)
            console.log(msg)
            this.client.destroy()
        })

        process.on(ProcessEvent.UncaughtException, (err: Error) => {
            const errorMsg = (err ? err.stack || err : '').toString().replace(new RegExp(`${__dirname}\/`, 'g'), './')
            this.logger.logError(errorMsg)
            console.log(errorMsg)
        })

        process.on(ProcessEvent.UnhandledRejection, (reason: {} | null | undefined) => {
            const msg = `Uncaught Promise rejection: ${reason}`
            this.logger.logError(msg)
            console.log(msg)
        })
    }

    private configCommandHandlers(message: Message) {
        if(message.author.bot) return
        this.infoHandlers.handleHelpCall(message)
        
        if(!this.hasAdminPermission(message)) return
        this.textHandlers.handleWriteCall(message)
        this.ignoreHandler.handleAddIgnore(message)
        this.ignoreHandler.handleDeleteIgnore(message)
        this.settingsHandlers.handlePreserveUpdate(message)
    }

    private hasAdminPermission(message: Message): boolean {
        return message.member !== null && message.member.hasPermission("ADMINISTRATOR")
    }
}