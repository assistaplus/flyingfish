import {Job, scheduleJob} from 'node-schedule';
import {DynDnsClient as DynDnsClientDB} from '../Db/MariaDb/Entity/DynDnsClient';
import {MariaDbHelper} from '../Db/MariaDb/MariaDbHelper';
import {Logger} from '../Logger/Logger';
import {DynDnsProviders} from '../Provider/DynDnsProviders';

/**
 * DynDnsService
 */
export class DynDnsService {

    /**
     * instance
     * @private
     */
    private static _instance: DynDnsService|null = null;

    /**
     * getInstance
     */
    public static getInstance(): DynDnsService {
        if (DynDnsService._instance === null) {
            DynDnsService._instance = new DynDnsService();
        }

        return DynDnsService._instance;
    }

    /**
     * scheduler job
     * @protected
     */
    protected _scheduler: Job|null = null;

    /**
     * updateDns
     * @protected
     */
    public async updateDns(): Promise<void> {
        Logger.getLogger().silly('DynDnsService::updateDns: exec schedule job');
        const dyndnclientRepository = MariaDbHelper.getRepository(DynDnsClientDB);

        const clients = await dyndnclientRepository.find();

        for (const client of clients) {
            const provider = DynDnsProviders.getProvider(client.provider);

            if (await provider?.update(client.username, client.password, '')) {
                Logger.getLogger().info(`DynDnsService::updateDns: Domain ip update by provider(${provider?.getName()})`);
            } else {
                Logger.getLogger().warn(`DynDnsService::updateDns: Domain ip update faild by provider(${provider?.getName()})`);
            }
        }
    }

    /**
     * start
     */
    public async start(): Promise<void> {
        this.updateDns();

        this._scheduler = scheduleJob('1 */1 * * *', async() => {
            this.updateDns();
        });
    }

}