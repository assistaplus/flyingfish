import {NetFetch} from '../Net/NetFetch';

/**
 * ListenTypes
 */
export enum ListenTypes {
    stream,
    http
}

/**
 * ListenCategory
 */
export enum ListenCategory {
    default_stream_nonessl,
    default_stream_ssl,
    default_http,
    default_https,
    stream,
    http,
    https
}

/**
 * ListenData
 */
export type ListenData = {
    id: number;
    type: number;
    port: number;
    enable_ipv6: boolean;
    name: string;
    description: string;
};

/**
 * ListenResponse
 */
export type ListenResponse = {
    status: string;
    msg?: string;
    list: ListenData[];
};

/**
 * Listen
 */
export class Listen {

    /**
     * getListens
     */
    public static async getListens(): Promise<ListenResponse| null> {
        const result = await NetFetch.getData('/json/listen/list');

        if (result) {
            if (result.status === 'ok') {
                return result as ListenResponse;
            }
        }

        return null;
    }

}