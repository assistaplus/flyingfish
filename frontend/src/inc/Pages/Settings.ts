import {Card} from '../Bambooo/Content/Card/Card';
import {ContentCol, ContentColSize} from '../Bambooo/Content/ContentCol';
import {ContentRow} from '../Bambooo/Content/ContentRow';
import {BasePage} from './BasePage';

/**
 * Settings
 */
export class Settings extends BasePage {

    /**
     * name
     * @protected
     */
    protected _name: string = 'settings';

    /**
     * constructor
     */
    public constructor() {
        super();

        this.setTitle('Settings');
    }

    /**
     * loadContent
     */
    public async loadContent(): Promise<void> {
        const content = this._wrapper.getContentWrapper().getContent();

        /**
         * onLoadList
         */
        this._onLoadTable = async(): Promise<void> => {
            content.empty();

            const row = new ContentRow(content);
            const cardNginx = new Card(new ContentCol(row, ContentColSize.col12));
            cardNginx.setTitle('Nginx Server Global Settings');

            
        };

        // load table
        await this._onLoadTable();
    }

}