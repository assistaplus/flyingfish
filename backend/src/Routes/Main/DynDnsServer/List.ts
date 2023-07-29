import {DynDnsServerUserService} from 'flyingfish_core';
import {DynDnsServerData, DynDnsServerListResponse, StatusCodes} from 'flyingfish_schemas';

/**
 * List
 */
export class List {

    public static async getList(): Promise<DynDnsServerListResponse> {
        const users = await DynDnsServerUserService.findAll();

        const list: DynDnsServerData[] = [];

        if (users) {
            for (const user of users) {
                const domains: number[] = [];

                list.push({
                    user: {
                        id: user.id,
                        username: user.username,
                        password: user.password,
                        last_update: user.last_update
                    },
                    domain_ids: domains
                });
            }
        }

        return {
            statusCode: StatusCodes.OK,
            list: list
        };
    }

}