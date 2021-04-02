import { IgnoredChannel } from "../entities"
import { MongoClient } from "mongodb"
import { Repository } from "./Repository"
import { Logger } from "../Logger"

export class IgnoredChannelsRepository extends Repository<IgnoredChannel> {
    constructor(logger: Logger, client: MongoClient, dbName: string) {
        super(logger, client, dbName)
    }

    public async any(guildId: string, channelId: string): Promise<boolean> {
        return super.getFirst({ guildId: guildId, channelId: channelId })
            .then(channel => {
                return channel !== undefined && channel !== null
            })
    }

    public async delete(guildId: string, channelId: string): Promise<boolean> {
        return super.deleteOne({ guildId: guildId, channelId: channelId })
    }
}