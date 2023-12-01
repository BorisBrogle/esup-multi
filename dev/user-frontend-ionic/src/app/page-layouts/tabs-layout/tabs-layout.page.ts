/*
 * Copyright ou © ou Copr. Université de Lorraine, (2022)
 *
 * Direction du Numérique de l'Université de Lorraine - SIED
 *  (dn-mobile-dev@univ-lorraine.fr)
 * JNESIS (contact@jnesis.com)
 *
 * Ce logiciel est un programme informatique servant à rendre accessible
 * sur mobile divers services universitaires aux étudiants et aux personnels
 * de l'université.
 *
 * Ce logiciel est régi par la licence CeCILL 2.1, soumise au droit français
 * et respectant les principes de diffusion des logiciels libres. Vous pouvez
 * utiliser, modifier et/ou redistribuer ce programme sous les conditions
 * de la licence CeCILL telle que diffusée par le CEA, le CNRS et INRIA
 * sur le site "http://cecill.info".
 *
 * En contrepartie de l'accessibilité au code source et des droits de copie,
 * de modification et de redistribution accordés par cette licence, il n'est
 * offert aux utilisateurs qu'une garantie limitée. Pour les mêmes raisons,
 * seule une responsabilité restreinte pèse sur l'auteur du programme, le
 * titulaire des droits patrimoniaux et les concédants successifs.
 *
 * À cet égard, l'attention de l'utilisateur est attirée sur les risques
 * associés au chargement, à l'utilisation, à la modification et/ou au
 * développement et à la reproduction du logiciel par l'utilisateur étant
 * donné sa spécificité de logiciel libre, qui peut le rendre complexe à
 * manipuler et qui le réserve donc à des développeurs et des professionnels
 * avertis possédant des connaissances informatiques approfondies. Les
 * utilisateurs sont donc invités à charger et à tester l'adéquation du
 * logiciel à leurs besoins dans des conditions permettant d'assurer la
 * sécurité de leurs systèmes et/ou de leurs données et, plus généralement,
 * à l'utiliser et à l'exploiter dans les mêmes conditions de sécurité.
 *
 * Le fait que vous puissiez accéder à cet en-tête signifie que vous avez
 * pris connaissance de la licence CeCILL 2.1, et que vous en avez accepté les
 * termes.
 */

import { AfterViewInit, Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import {
  FeaturesService, GuidedTourService, MenuItem, MenuItemLinkType, MenuItemRouterLink,
  MenuOpenerService, MenuService, NetworkService, NotificationsService, StatisticsService
} from '@ul/shared';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

interface MenuItemWithOptionalRouterLink extends MenuItem {
  routerLink: string;
}

@Component({
  selector: 'app-tabs-layout',
  templateUrl: 'tabs-layout.page.html',
  styleUrls: ['tabs-layout.page.scss']
})
export class TabsLayoutPage implements AfterViewInit {

  public isLoading = false;
  public topMenuItems$: Observable<MenuItem[]>;
  public tabsMenuItems$: Observable<MenuItemWithOptionalRouterLink[]>;
  public isOnline$: Observable<boolean>;
  public menuItemHasBadge: boolean[];

  constructor(
    private navController: NavController,
    private menuService: MenuService,
    private featuresService: FeaturesService,
    private statisticsService: StatisticsService,
    private guidedTourService: GuidedTourService,
    public menuOpenerService: MenuOpenerService,
    private networkService: NetworkService,
    private notificationsService: NotificationsService
  ) {
    this.isOnline$ = this.networkService.isOnline$;
    this.tabsMenuItems$ = this.menuService.tabsMenuItems$.pipe(
      map(menuItems => menuItems.map(menuItem => {
        if (menuItem.link.type !== MenuItemLinkType.router) {
          return {
            ...menuItem,
            routerLink: null
          };
        }

        return {
          ...menuItem,
          routerLink: (menuItem.link as MenuItemRouterLink).routerLink
        };
      }))
    );
    this.topMenuItems$ = this.menuService.topMenuItems$;

    this.topMenuItems$.pipe(
      tap(menuItems => {
        this.menuItemHasBadge = menuItems.map(() => false);

        const indexNotifMenuItem = menuItems.findIndex(menuItem =>
          menuItem.link.type === MenuItemLinkType.router && (menuItem.link as MenuItemRouterLink).routerLink === '/notifications');
        if (indexNotifMenuItem !== -1) {
          this.notificationsService.loadNotifications(0, 10).pipe(
            take(1),
            tap((notifications) => {
              this.menuItemHasBadge[indexNotifMenuItem] = notifications.find(notification => notification.state === 'UNREAD') !== undefined;
            })
          ).subscribe();
        }
      })
    ).subscribe();
  }

  ngAfterViewInit() {
    this.loadFeatures();
  }

  public async openExternalOrSsoLinkOnly(menuItem: MenuItem) {
    if (menuItem.link.type === MenuItemLinkType.router) {
      this.statisticsService.onFunctionalityOpened(menuItem.statisticName);
      this.navController.setDirection('forward', false);
      return;
    }

    return this.menuOpenerService.open(menuItem);
  }

  public generateMenuItemIdFromRouterLink(menuItem: MenuItemWithOptionalRouterLink){
    if(!menuItem.routerLink) {
      return;
    }
    return menuItem.routerLink.substring(1).replace('/', '-');
  }

  public getMenuId(menuItem: MenuItem){
    return this.guidedTourService.generateMenuItemIdFromTitle(menuItem);
  }

  public hasBadge(index: number): boolean {
    return this.menuItemHasBadge[index] ?? false;
  }

  private async loadFeatures(): Promise<void> {
    // skip if network is not available
    if (!(await this.networkService.getConnectionStatus()).connected) {
      return;
    }

    this.isLoading = true;
    this.featuresService.loadAndStoreFeatures().subscribe(() => this.isLoading = false);
  }
}
