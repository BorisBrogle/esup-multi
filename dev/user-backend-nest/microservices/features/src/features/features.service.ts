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

import { Injectable, Logger } from '@nestjs/common';
import { catchError, map, Observable, zip } from 'rxjs';
import { FeaturesPositionHelper } from './features-position.helper';
import { DirectusFeature, Feature } from './features.dto';
import { DirectusApi } from '../config/configuration.interface';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RpcException } from '@nestjs/microservices';

interface DirectusResponse<T> {
  data: T;
}

@Injectable()
export class FeaturesService {
  private readonly logger = new Logger(FeaturesService.name);
  private directusApiConfig: DirectusApi;
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.directusApiConfig = this.configService.get<DirectusApi>('directusApi');
  }

  public getFeatures(userRoles: string[]): Observable<Feature[]> {
    const dataFeatures = JSON.stringify({
      query: `query {
          features(status: "published"){
              id
              description
              icon
              iconSvgDark
              iconSvgLight
              link
              menu
              position
              routerLink
              ssoService
              status
              type
              translations{
                  languagesCode
                  searchKeywords
                  shortTitle
                  title
              }
              authorization {
                  roles
                  authorization
              }
              settingsByRole{
                  position
                  role
              }
          }
      }`,
      variables: {},
    });

    const dataWidgets = JSON.stringify({
      query: `query {
          widgets(status: "published"){
              id
              status
              description
              widget
              iconSvgDark
              iconSvgLight
              icon
              link
              position
              ssoService
              statisticName
              routerLink
              color
              type
              translations{
                  languagesCode
                  content
                  title
              }
              authorization {
                  roles
                  authorization
              }
              settingsByRole{
                  position
                  role
              }
          }
      }`,
      variables: {},
    });

    const configFeatures = {
      method: 'post',
      maxBodyLength: Infinity,
      url: process.env.FEATURES_SERVICE_GRAPHQL_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      data: dataFeatures,
    };

    const configWidgets = {
      method: 'post',
      maxBodyLength: Infinity,
      url: process.env.FEATURES_SERVICE_GRAPHQL_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      data: dataWidgets,
    };

    const featuresPositionHelper = new FeaturesPositionHelper(userRoles);
    const sortFeatures = (a: Feature, b: Feature) => {
      const positionA = featuresPositionHelper.getFeaturePosition(a);
      const positionB = featuresPositionHelper.getFeaturePosition(b);
      return positionA - positionB;
    };

    const directusFeaturesToFeatures = (feature: DirectusFeature): Feature => {
      return {
        ...feature,
        settingsByRole: feature.settingsByRole.map((sbr) => sbr.settingsByRole),
      };
    };

    return zip(
      this.httpService.request(configFeatures),
      this.httpService.request(configWidgets),
    ).pipe(
      catchError((err: any) => {
        const errorMessage = 'Unable to get cms connector features';
        this.logger.error(err.response.data);
        throw new RpcException(err);
      }),
      map((res) =>
        Array.prototype.concat(
          res[0].data.data['features'].map((f) => ({
            ...f,
            id: `feature:${f.id}`,
          })),
          res[1].data.data['widgets'].map((w) => ({
            ...w,
            id: `widget:${w.id}`,
          })),
        ),
      ),
      map((features: DirectusFeature[]): Feature[] =>
        features.map(directusFeaturesToFeatures),
      ),
      map((features: Feature[]) => features.sort(sortFeatures)),
    );
  }
}
