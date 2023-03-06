const defaultProtocol = {
  id: 'default',
  locked: true,
  // Don't store this hanging protocol as it applies to the currently active
  // display set by default
  // cacheId: null,
  hasUpdatedPriorsInformation: false,
  name: 'Default',
  createdDate: '2021-02-23T19:22:08.894Z',
  modifiedDate: '2021-02-23T19:22:08.894Z',
  availableTo: {},
  editableBy: {},
  protocolMatchingRules: [],
  toolGroupIds: ['default'],
  // -1 would be used to indicate active only, whereas other values are
  // the number of required priors referenced - so 0 means active with
  // 0 or more priors.
  numberOfPriorsReferenced: 0,
  // Default viewport is used to define the viewport when
  // additional viewports are added using the layout tool
  defaultViewport: {
    viewportOptions: {
      viewportType: 'stack',
      toolGroupId: 'default',
      allowUnmatchedView: true,
    },
    displaySets: [
      {
        id: 'defaultDisplaySetId',
        displaySetIndex: -1,
      },
    ],
  },
  displaySetSelectors: {
    defaultDisplaySetId: {
      // Unused currently
      imageMatchingRules: [],
      // Matches displaysets, NOT series
      seriesMatchingRules: [
        // Try to match series with images by default, to prevent weird display
        // on SEG/SR containing studies
        {
          attribute: 'numImageFrames',
          constraint: {
            greaterThan: { value: 0 },
          },
        },
      ],
      // Can be used to select matching studies
      // studyMatchingRules: [],
    },
  },
  stages: [
    {
      name: 'default',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 1,
        },
      },
      viewports: [
        {
          viewportOptions: {
            toolGroupId: 'default',
            // initialImageOptions: {
            //   index: 180,
            //   preset: 'middle', // 'first', 'last', 'middle'
            // },
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
              reuseId: 'position-0,0',
            },
          ],
        },
      ],
      createdDate: '2021-02-23T18:32:42.850Z',
    },

    // This is an example of a layout with more than one element in it
    // It can be navigated to using Ctrl+End
    {
      name: '1x2',
      // Indicate that the number of viewports needed is 1 filled viewport,
      // but that 2 viewports are preferred.
      requiredViewports: 1,
      preferredViewports: 2,

      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 2,
        },
      },
      viewports: [
        {
          viewportOptions: {
            toolGroupId: 'default',
            // initialImageOptions: {
            //   index: 180,
            //   preset: 'middle', // 'first', 'last', 'middle'
            // },
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
              reuseId: 'position-0,0',
            },
          ],
        },
        {
          viewportOptions: {
            toolGroupId: 'default',
            // initialImageOptions: {
            //   index: 180,
            //   preset: 'middle', // 'first', 'last', 'middle'
            // },
          },
          displaySets: [
            {
              id: 'defaultDisplaySetId',
              // Shows the second index of this image set
              displaySetIndex: 1,
              reuseId: 'position-1,0',
            },
          ],
        },
      ],
      createdDate: '2021-02-23T18:32:42.850Z',
    },
  ],
};

function getHangingProtocolModule() {
  return [
    {
      id: defaultProtocol.id,
      protocol: defaultProtocol,
    },
  ];
}

export default getHangingProtocolModule;
