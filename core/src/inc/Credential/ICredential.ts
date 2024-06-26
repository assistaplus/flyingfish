import {CredentialSchemaTypes} from 'flyingfish_schemas';

/**
 * Interface of credential
 */
export interface ICredential {

    /**
     * Return the supported types
     * @returns {CredentialSchemaTypes[]}
     */
    getSupports(): CredentialSchemaTypes[];

}