import {ExtractSchemaResultType, Vts} from 'vts';
import {SchemaDefaultReturn} from '../../../Core/Server/Routes/DefaultReturn.js';
import {SchemaProviderEntry} from '../../Provider/ProviderEntry.js';

/**
 * SchemaSslProvidersResponse
 */
export const SchemaSslProvidersResponse = SchemaDefaultReturn.extend({
    list: Vts.array(SchemaProviderEntry)
});

/**
 * SslProvidersResponse
 */
export type SslProvidersResponse = ExtractSchemaResultType<typeof SchemaSslProvidersResponse>;