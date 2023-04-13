import {Router} from 'express';
import {DBHelper} from '../../inc/Db/DBHelper.js';
import {IpBlacklist as IpBlacklistDB} from '../../inc/Db/MariaDb/Entity/IpBlacklist.js';
import {IpLocation as IpLocationDB} from '../../inc/Db/MariaDb/Entity/IpLocation.js';
import {HimHIP, HimHIPData} from '../../inc/HimHIP/HimHIP.js';
import {DefaultReturn} from '../../inc/Routes/DefaultReturn.js';
import {DefaultRoute} from '../../inc/Routes/DefaultRoute.js';
import {StatusCodes} from '../../inc/Routes/StatusCodes.js';
import {Session} from '../../inc/Server/Session.js';
import {HowIsMyPublicIpService} from '../../inc/Service/HowIsMyPublicIpService.js';
import {IpService} from '../../inc/Service/IpService.js';

/**
 * DashboardInfoIpBlock
 */
export type DashboardInfoIpBlock = {
    ip: string;
    info: string;
    last_block: number;
    latitude: string;
    longitude: string;
};

/**
 * DashboardInfoResponse
 */
export type DashboardInfoResponse = DefaultReturn & {
    public_ip: string|null;
    public_ip_blacklisted: boolean;
    host: HimHIPData|null;
    ipblocks: DashboardInfoIpBlock[];
    ipblock_count: number;
};

/**
 * Dashboard
 */
export class Dashboard extends DefaultRoute {

    /**
     * constructor
     */
    public constructor() {
        super();
    }

    /**
     * getInfo
     */
    public async getInfo(): Promise<DashboardInfoResponse> {
        const ipBlacklistRepository = DBHelper.getRepository(IpBlacklistDB);
        const ipLocationRepository = DBHelper.getRepository(IpLocationDB);

        // ip blocks ---------------------------------------------------------------------------------------------------

        const ipblocks: DashboardInfoIpBlock[] = [];
        let ipblock_count = 0;

        const limit = 40;

        const result = await ipBlacklistRepository
        .createQueryBuilder('countipblocks')
        .select('SUM(countipblocks.count_block)', 'total_count_blocks')
        .addSelect('COUNT(*)', 'count')
        .getRawOne();

        if (result) {
            ipblock_count = parseInt(result.total_count_blocks, 10) ?? 0;
        }

        const entries = await ipBlacklistRepository.find({
            take: limit,
            order: {
                last_block: 'DESC'
            }
        });

        if (entries) {
            for await (const entry of entries) {
                const tlocation = await ipLocationRepository.findOne({
                    where: {
                        id: entry.ip_location_id
                    }
                });

                if (tlocation) {
                    ipblocks.push({
                        ip: entry.ip,
                        info: '',
                        last_block: entry.last_block,
                        latitude: tlocation.latitude,
                        longitude: tlocation.longitude
                    });
                }
            }
        }

        // -------------------------------------------------------------------------------------------------------------

        return {
            public_ip: await HowIsMyPublicIpService.getInstance().getCurrentIp(),
            public_ip_blacklisted: IpService.isBlacklisted,
            host: HimHIP.getData(),
            ipblocks: ipblocks,
            ipblock_count: ipblock_count,
            statusCode: StatusCodes.OK
        };
    }

    /**
     * getExpressRouter
     */
    public getExpressRouter(): Router {
        this._routes.get(
            '/json/dashboard/info',
            async(req, res) => {
                if (Session.isUserLogin(req.session)) {
                    res.status(200).json(await this.getInfo());
                } else {
                    res.status(200).json({
                        public_ip: null,
                        public_ip_blacklisted: false,
                        host: null,
                        ipblocks: [],
                        ipblock_count: 0,
                        statusCode: StatusCodes.UNAUTHORIZED
                    } as DashboardInfoResponse);
                }
            }
        );

        return super.getExpressRouter();
    }

}