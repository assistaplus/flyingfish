import {JwkHelper} from 'flyingfish_core';
import * as crypto from 'crypto';

/**
 * Directory Json
 */
type LetsEncryptDirectory = any & {
    keyChange: string;
    meta: {
        caaIdentities: string[];
        termsOfService: string;
        website: string;
    };
    newAccount: string;
    newNonce: string;
    newOrder: string;
    renewalInfo: string;
    revokeCert: string;
};

/**
 * post new account options
 */
type LetsEncryptPostNewAccountOptions = {
    onlyReturnExisting: boolean;
};

/**
 * New account
 */
type LetsEncryptNewAccount = {
    nonce: string;
    accountUrl: string;
};

/**
 * New order
 */
type LetsEncryptNewOrder = {
    nonce: string;
    order: any;
};

/**
 * Order authorization
 */
type LetsEncryptOrderAuthorization = {
    nonce: string;
    authorization: any;
};

/**
 * Parsed JWT
 */
type LetsEncryptParsedJwt = {
    protected: string;
    payload: string;
    signature: string;
};

type LetsEncryptDnsChallenge = {
    recordName: string;
    recordText: string;
    order: any;
};

/**
 * ACME Client
 */
export class Client {

    /**
     * Endpoint for letsencrypt
     * @protected
     */
    protected _endpoint: string = 'https://acme-v02.api.letsencrypt.org';

    /**
     * Directory Information.
     * @protected
     */
    protected _directory: LetsEncryptDirectory;

    /**
     * JWK
     * @protected
     */
    protected _jwk?: crypto.webcrypto.JsonWebKey;

    /**
     * account url
     * @protected
     */
    protected _accountUrl?: string;

    /**
     * Init the client.
     * @param {JsonWebKey} jwk
     * @returns {boolean}
     */
    public async init(jwk?: crypto.webcrypto.JsonWebKey): Promise<boolean> {
        this._directory = await (await fetch(`${this._endpoint}/directory`)).json() as LetsEncryptDirectory;
        let nonce = await this._getNewNonce(this._directory);

        if (nonce) {
            if (jwk) {
                this._jwk = jwk;
                const newAccount = await this.postNewAccount(nonce, this._jwk, this._directory, {onlyReturnExisting: true});

                nonce = newAccount.nonce;
                this._accountUrl = newAccount.accountUrl;
            } else {
                this._jwk = await this._generateJwk();

                const newAccount = await this.postNewAccount(nonce, this._jwk, this._directory);

                nonce = newAccount.nonce;
                this._accountUrl = newAccount.accountUrl;
            }

            return true;
        }

        return false;
    }

    private _throwIfErrored(resJson: any): void {
        if (resJson.status && typeof resJson.status === 'number' && resJson.status >= 400) {
            throw new Error(JSON.stringify(resJson));
        }
    }

    private async _generateJwk(): Promise<crypto.webcrypto.JsonWebKey> {
        return await JwkHelper.generateJwk();
    }

    /**
     * Return a new Nonce.
     * @param {LetsEncryptDirectory} directory
     * @private
     * @returns {string|null}
     */
    private async _getNewNonce(directory: LetsEncryptDirectory): Promise<string|null> {
        const res = await fetch(directory.newNonce, {
            method: 'HEAD'
        });

        return res.headers.get('Replay-Nonce');
    }

    private _parseJwt(jwt: string): LetsEncryptParsedJwt {
        const jwtParts = jwt.split('.');

        return {
            protected: jwtParts[0],
            payload: jwtParts[1],
            signature: jwtParts[2]
        };
    }

    private _jsonToBase64Url(json: object|string): string {
        return btoa(JSON.stringify(json))
        .replace(/\+/gu, '-')
        .replace(/\//gu, '_')
        .replace(/[=]+$/gu, '');
    }

    private _arrayBufferToBase64Url(buf: ArrayBuffer): string {
        return btoa(Array.prototype.map.call(
            new Uint8Array(buf),
            (ch) => String.fromCharCode(ch)
        ).join(''))
        .replace(/\+/gu, '-')
        .replace(/\//gu, '_')
        .replace(/[=]+$/gu, '');
    }

    /**
     * Return jwt as string from json
     * @param {crypto.webcrypto.JsonWebKey} jwk
     * @param {object} header
     * @param {object|string} payload
     * @private
     * @returns {string}
     */
    private async _jwtFromJson(jwk: crypto.webcrypto.JsonWebKey, header: object, payload: object|string): Promise<string> {
        const privateKey = await crypto.subtle.importKey(
            'jwk', jwk, {
                name: 'ECDSA',
                namedCurve: 'P-256'
            },
            false,
            ['sign']
        );

        const base64Header = this._jsonToBase64Url(header);
        const base64Payload = payload === '' ? '' : this._jsonToBase64Url(payload);
        const base64Signature = this._arrayBufferToBase64Url(await crypto.subtle.sign(
            {
                name: 'ECDSA',
                hash: {
                    name: 'SHA-256'
                }
            },
            privateKey,
            new TextEncoder().encode(`${base64Header}.${base64Payload}`)
        ));

        return `${base64Header}.${base64Payload}.${base64Signature}`;
    }

    /**
     * Post a new account.
     * @param {string} nonce
     * @param {crypto.webcrypto.JsonWebKey} jwk
     * @param {LetsEncryptDirectory} directory
     * @param {LetsEncryptPostNewAccountOptions} options
     * @returns {LetsEncryptNewAccount}
     */
    public async postNewAccount(
        nonce: string,
        jwk: crypto.webcrypto.JsonWebKey,
        directory: LetsEncryptDirectory,
        options: LetsEncryptPostNewAccountOptions = {
            onlyReturnExisting: false
        }
    ): Promise<LetsEncryptNewAccount> {
        const pubJwk = {
            crv: jwk.crv,
            kty: jwk.kty,
            x: jwk.x,
            y: jwk.y
        };

        const header = {
            nonce: nonce,
            url: directory.newAccount,
            alg: 'ES256',
            jwk: pubJwk
        };

        const payload = {
            termsOfServiceAgreed: true,
            onlyReturnExisting: options.onlyReturnExisting
        };

        const jwt = await this._jwtFromJson(jwk, header, payload);

        const res = await fetch(directory.newAccount, {
            mode: 'cors',
            method: 'POST',
            headers: {'Content-Type': 'application/jose+json'},
            body: JSON.stringify(this._parseJwt(jwt))
        });

        this._throwIfErrored(await res.json());

        return {
            nonce: res.headers.get('Replay-Nonce')!,
            accountUrl: res.headers.get('location')!
        };
    }

    public async postNewOrder(
        nonce: string,
        jwk: crypto.webcrypto.JsonWebKey,
        directory: LetsEncryptDirectory,
        accountUrl: string,
        domainName: string
    ): Promise<LetsEncryptNewOrder> {
        const header = {
            alg: 'ES256',
            kid: accountUrl,
            nonce: nonce,
            url: directory.newOrder
        };

        const payload = {
            identifiers: [{
                type: 'dns',
                value: domainName
            }]
        };

        const jwt = await this._jwtFromJson(jwk, header, payload);

        const res = await fetch(directory.newOrder, {
            method: 'POST',
            headers: {'Content-Type': 'application/jose+json'},
            body: JSON.stringify(this._parseJwt(jwt))
        });

        const order = await res.json();

        this._throwIfErrored(order);

        return {
            nonce: res.headers.get('Replay-Nonce')!,
            order: order
        };
    }

    public async getOrderAuthorization(
        nonce: string,
        jwk: crypto.webcrypto.JsonWebKey,
        accountUrl: string,
        order: any
    ): Promise<LetsEncryptOrderAuthorization> {
        const header = {
            alg: 'ES256',
            kid: accountUrl,
            nonce: nonce,
            url: order.authorizations[0]
        };

        const payload = '';

        const jwt = await this._jwtFromJson(jwk, header, payload);

        const res = await fetch(order.authorizations[0], {
            method: 'POST',
            headers: {'Content-Type': 'application/jose+json'},
            body: JSON.stringify(this._parseJwt(jwt))
        });

        const authorization = await res.json();

        this._throwIfErrored(authorization);

        return {
            nonce: res.headers.get('Replay-Nonce')!,
            authorization: authorization
        };
    }

    private async _thumbprint(jwk: crypto.webcrypto.JsonWebKey): Promise<string> {
        const pubJwk = {
            crv: jwk.crv,
            kty: jwk.kty,
            x: jwk.x,
            y: jwk.y
        };

        const hash = await crypto.subtle.digest(
            {name: 'SHA-256'},
            new TextEncoder().encode(JSON.stringify(pubJwk))
        );

        return this._arrayBufferToBase64Url(hash);
    }

    private async _calculateRecordText(
        token: string,
        jwk: crypto.webcrypto.JsonWebKey
    ): Promise<string> {
        const keyAuthorization = `${token}.${await this._thumbprint(jwk)}`;

        const hash = await crypto.subtle.digest(
            {name: 'SHA-256'},
            new TextEncoder().encode(keyAuthorization)
        );

        return this._arrayBufferToBase64Url(hash);
    }

    public async requestDnsChallenge(domainName: string): Promise<LetsEncryptDnsChallenge|null> {
        let nonce = await this._getNewNonce(this._directory);

        if (nonce) {
            if (this._jwk && this._accountUrl) {
                const order = await this.postNewOrder(nonce, this._jwk, this._directory, this._accountUrl, domainName);

                nonce = order.nonce;

                const orderAuth = await this.getOrderAuthorization(nonce, this._jwk, this._accountUrl, order.order);

                const challenge = orderAuth.authorization.challenges.filter((c: any) => c.type === 'dns-01')[0];

                return {
                    recordName: '_acme-challenge',
                    recordText: await this._calculateRecordText(challenge.token, this._jwk),
                    order: order.order
                };
            }
        }

        return null;
    }

}