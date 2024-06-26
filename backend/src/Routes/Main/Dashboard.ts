import {Router} from 'express';
import {DefaultRoute} from 'flyingfish_core';
import {DashboardInfoResponse, DefaultReturn, StatusCodes} from 'flyingfish_schemas';
import {HimHIP} from './Dashboard/HimHIP.js';
import {Info} from './Dashboard/Info.js';
import {PublicIPBlacklistCheck} from './Dashboard/PublicIPBlacklistCheck.js';
import {StreamRequests} from './Dashboard/StreamRequests.js';

/**
 * Dashboard
 */
export class Dashboard extends DefaultRoute {

    /**
     * getExpressRouter
     */
    public getExpressRouter(): Router {
        this._get(
            '/json/dashboard/info',
            async(req, res) => {
                if (this.isUserLogin(req, res, false)) {
                    res.status(200).json(await Info.getInfo());
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

        this._get(
            '/json/dashboard/publicipblacklistcheck',
            async(req, res) => {
                if (this.isUserLogin(req, res, false)) {
                    res.status(200).json(await PublicIPBlacklistCheck.check());
                } else {
                    res.status(200).json({
                        statusCode: StatusCodes.UNAUTHORIZED
                    } as DefaultReturn);
                }
            }
        );

        this._get(
            '/json/dashboard/streamrequests',
            async(req, res) => {
                if (this.isUserLogin(req, res, false)) {
                    res.status(200).json(await StreamRequests.getList());
                } else {
                    res.status(200).json({
                        statusCode: StatusCodes.UNAUTHORIZED
                    } as DefaultReturn);
                }
            }
        );

        this._get(
            '/json/dashboard/refrechhimhip',
            async(req, res) => {
                if (this.isUserLogin(req, res, false)) {
                    res.status(200).json(await HimHIP.refrechHimHIP());
                } else {
                    res.status(200).json({
                        statusCode: StatusCodes.UNAUTHORIZED
                    } as DefaultReturn);
                }
            }
        );

        return super.getExpressRouter();
    }

}