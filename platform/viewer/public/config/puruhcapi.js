window.config = {
  routerBasename: '/',
  customizationService: {
    dicomUploadComponent:
      '@ohif/extension-cornerstone.customizationModule.cornerstoneDicomUploadComponent',
  },
  enableGoogleCloudAdapter: false,
  // below flag is for performance reasons, but it might not work for all servers
  omitQuotationForMultipartRequest: true,
  showWarningMessageForCrossOrigin: true,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  strictZSpacingForVolumeViewport: true,
  // This is an array, but we'll only use the first entry for now
  // oidc: [
  //   {
  //     // ~ REQUIRED
  //     // Authorization Server URL
  //     authority: 'https://accounts.google.com',
  //     client_id:
  //       '766256023666-242tkcu7jgjrod1ao7dlk083n2erklr0.apps.googleusercontent.com',
  //     redirect_uri: '/callback',
  //     response_type: 'id_token token',
  //     scope:
  //       'email profile openid https://www.googleapis.com/auth/cloudplatformprojects.readonly https://www.googleapis.com/auth/cloud-healthcare', // email profile openid
  //     // ~ OPTIONAL
  //     post_logout_redirect_uri: '/logout-redirect.html',
  //     revoke_uri: 'https://accounts.google.com/o/oauth2/revoke?token=',
  //     automaticSilentRenew: true,
  //     revokeAccessTokenOnSignout: true,
  //   },
  // ],
  extensions: [],
  modes: [],
  showStudyList: false,
  // filterQueryParam: false,
  defaultDataSourceName: 'dicomweb',
  dataSources: [
    {
      friendlyName: 'dcmjs DICOMWeb Server',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        name: 'GCP',
        wadoUriRoot:
          'https://healthcare.googleapis.com/v1/projects/ohif-cloud-healthcare/locations/us-east4/datasets/ohif-qa-dataset/dicomStores/ohif-qa-2/dicomWeb',
        qidoRoot:
          'https://healthcare.googleapis.com/v1/projects/ohif-cloud-healthcare/locations/us-east4/datasets/ohif-qa-dataset/dicomStores/ohif-qa-2/dicomWeb',
        wadoRoot:
          'https://healthcare.googleapis.com/v1/projects/ohif-cloud-healthcare/locations/us-east4/datasets/ohif-qa-dataset/dicomStores/ohif-qa-2/dicomWeb',
        qidoSupportsIncludeField: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: false,
        dicomUploadEnabled: false,
      },
    },
    {
      friendlyName: 'dicom json',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomjson',
      sourceName: 'dicomjson',
      configuration: {
        name: 'json',
      },
    },
    {
      friendlyName: 'dicom local',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomlocal',
      sourceName: 'dicomlocal',
      configuration: {},
    },
  ],
};
