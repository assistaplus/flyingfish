import {IDynDnsProvider} from './IDynDnsProvider';
import {Selfhost} from './Selfhost/Selfhost';

/**
 * DynDnsProviders
 */
export class DynDnsProviders {

    /**
     * getProvider
     * @param name
     */
    public static getProvider(name: string): IDynDnsProvider|null {
        switch (name) {
            case Selfhost.getName():
                return new Selfhost();
        }

        return null;
    }

}