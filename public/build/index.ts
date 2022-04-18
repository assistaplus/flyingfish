import {Login as LoginAPI} from './inc/Api/Login';
import {User as UserAPI} from './inc/Api/User';
import {Lang} from './inc/Lang';
import {NavbarLinkButton} from './inc/PageComponents/Navbar/NavbarLinkButton';
import {NavbarLinkFullsize} from './inc/PageComponents/Navbar/NavbarLinkFullsize';
import {SidebarMenuItem} from './inc/PageComponents/Sidebar/SidebarMenuItem';
import {BasePage} from './inc/Pages/BasePage';
import {Domains as DomainsPage} from './inc/Pages/Domains';
import {UtilAvatarGenerator} from './inc/Utils/UtilAvatarGenerator';
import {UtilColor} from './inc/Utils/UtilColor';

/**
 * Main function for ready document
 */
(async(): Promise<void> => {

    Lang.i('Lang_EN');
    jQuery('#ff_page_title').html(Lang.i().l('title'));

    let globalPage: BasePage|null = null;

    /**
     * loadPage
     * @param page
     */
    const loadPage = async(page: BasePage): Promise<void> => {
        page.setLoadPageFn(loadPage);

        const preloader = page.getWrapper().getPreloader();

        // is login ----------------------------------------------------------------------------------------------------

        if (!await LoginAPI.isLogin()) {
            window.location.replace('/login.html');
        }

        const currentuser = await UserAPI.getUserInfo();

        if (currentuser) {
            const up = page.getWrapper().getMainSidebar().getSidebar().getUserPanel();

            up.setImage(
                UtilAvatarGenerator.generateAvatar(
                    currentuser.user?.username!,
                    'white',
                    UtilColor.getColor(currentuser.user?.username!)
                )
            );

            up.setUsername(currentuser.user?.username!);
        }

        // right navbar --------------------------------------------------------------------------------------------

        const rightNavbar = page.getWrapper().getNavbar().getRightNavbar();
        // eslint-disable-next-line no-new
        new NavbarLinkFullsize(rightNavbar.getElement());
        // eslint-disable-next-line no-new
        new NavbarLinkButton(
            rightNavbar.getElement(),
            'fa-sign-out-alt', async() => {
                if (confirm('Logout?')) {
                    await LoginAPI.logout();
                    window.location.replace('/login.html');
                }
            }
        );

        // sidemenu ------------------------------------------------------------------------------------------------
        const sidemenuList = [
            {
                title: 'Domains',
                icon: 'fa-solid fa-tags',
                name: 'domains',
                onClick: (): void => {
                    loadPage(new DomainsPage());
                }
            },
            {
                title: 'Admin',
                icon: 'fa-cogs',
                name: 'admin',
                onClick: (): void => {
                    // loadPage(new Admin());
                }
            }
        ];

        const menu = page.getWrapper().getMainSidebar().getSidebar().getMenu();

        for (const item of sidemenuList) {
            const menuItem = new SidebarMenuItem(menu);

            menuItem.setName(item.name);
            menuItem.setTitle(item.title);
            menuItem.setIconClass(item.icon);

            if (page.getName() === item.name) {
                menuItem.setActiv(true);
            }

            menuItem.setClick(item.onClick);
        }

        // ---------------------------------------------------------------------------------------------------------

        jQuery('#ccc_copyright').html(Lang.i().l('copyrightname'));
        jQuery('#ccc_version').html(Lang.i().l('version'));

        // ---------------------------------------------------------------------------------------------------------

        if (globalPage) {
            globalPage.unloadContent();
        }

        page.loadContent();
        preloader.readyLoad();

        globalPage = page;
    };

    await loadPage(new DomainsPage());
})();