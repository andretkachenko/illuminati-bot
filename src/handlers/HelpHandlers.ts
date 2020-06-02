import { Message, Client } from "discord.js";
import { Config } from "../config";
import { BotCommand } from "../enums/BotCommand";

export class HelpHandlers {
    private client: Client
    private config: Config

    constructor(client: Client, config: Config) {
        this.client = client
        this.config = config
    }

    public handleHelpCall(message: Message) {
        // => Prevent message from the bot
        if (this.client.user != undefined && message.author.id !== this.client.user.id) {
            // => Test command
            if (message.content === this.config.prefix + BotCommand.Help) {
                message.channel.send(`
                List of available commands:
                \`\`\`
                ${this.config.prefix}health - check if bot is up and running
                ${this.config.prefix}addintro - add info that should be shown in the linked text channel. write ${this.config.prefix}help addintro to see details
                ${this.config.prefix}changeintro - replace info that should be shown in the linked text channel with the new parameters. write ${this.config.prefix}help changeintro to see details                
                ${this.config.prefix}about - get info about bot
                
                Bot lacks a feature? You can suggest it via https://github.com/andretkachenko/illuminati-bot/issues\`\`\`
                `)
                return
            }
            if (message.content === this.config.prefix + BotCommand.Help + " " + BotCommand.AddIntro) {
                this.giveAddIntroHelp(message)
                return
            }
            if (message.content === this.config.prefix + BotCommand.Help + " " + BotCommand.ChangeIntro) {
                this.giveChangeIntroHelp(message)
                return
            }

            if (message.content === this.config.prefix + BotCommand.About) {
                this.giveAbout(message)
                return
            }
        }
    }

    private giveAddIntroHelp(message: Message) {
        message.channel.send(`
                \`\`\`
                ${this.config.prefix}addintro - add info that should be shown in the linked text channel.

                Available fields:
                GuildId(optional) - ID of the server(guild), for which intro should be added. Required if send to bot via DM.
                ChannelId(required) - ID of the voice channel for which this intro should be set
                Description(optional) - any message (greetings, description, etc)
                ImageUrl(optional) - link to the image/gif that should be sent after the mesage
                AdditionalUrl(optional) - link to the message that should be sent after the mesage
                             
                Usage example:
                ${this.config.prefix}addintro { "GuildId": "98765432187654321", "ChannelId": "12345678912345678", "Description": "Welcome to the default channel of our server", "ImageUrl": "https://discord.com/assets/7edaed9d86e1b5dd9d4c98484372222b.svg", "AdditionalUrl": "https://discord.com/assets/d9b6a36b9077400c46cc64404100b59b.svg" }
                
                Any issues? You can report them via https://github.com/andretkachenko/illuminati-bot/issues\`\`\`
                `)
    }

    private giveChangeIntroHelp(message: Message) {
        message.channel.send(`
                \`\`\`
                ${this.config.prefix}changeintro - replace info that should be shown in the linked text channel with the new parameters.
                
                Available fields:
                GuildId(optional) - ID of the server(guild), for which intro should be added. Required if send to bot via DM.
                ChannelId(required) - ID of the voice channel for which this intro should be set
                Description(optional) - any message (greetings, description, etc)
                ImageUrl(optional) - link to the image/gif that should be sent after the mesage
                AdditionalUrl(optional) - link to the message that should be sent after the mesage
                                
                Usage example:
                ${this.config.prefix}changeintro { "GuildId": "98765432187654321", "ChannelId": "12345678912345678", "Description": "Welcome to the default channel of our server", "ImageUrl": "https://discord.com/assets/7edaed9d86e1b5dd9d4c98484372222b.svg", "AdditionalUrl": "https://discord.com/assets/d9b6a36b9077400c46cc64404100b59b.svg" }
                
                Any issues? You can report them via https://github.com/andretkachenko/illuminati-bot/issues\`\`\`
                `)
    }

    private giveAbout(message: Message) {
        message.channel.send(`
                \`\`\`
                Discord bot to link text channel to each voice channel. 
                Want to use it on your server? Follow this link: https://github.com/andretkachenko/illuminati-bot#want-to-use-at-your-server
                Any issues or missing feature? You can post it via https://github.com/andretkachenko/illuminati-bot/issues\`\`\`
                `)
    }
}