/**
 * Selects a presentation ID to use for this viewport.
 * This is done to allow the same display set to be displayed more than once
 * on screen, with different attributes such as window level and initial position.
 * Then, when redisplaying that, the nearest/most common attribute is re-used.
 *
 * The attribute chosen includes the display sets, the viewport type and orientation,
 * and a display instance counter to prevent re-using the same presentation info
 * for more than one viewports.
 *
 * @param viewport requiring a presentation Id
 * @param viewports is the list of viewports.  Newly assigned viewports
 *    have the presentation Id cleared, while those remaining or those already
 *    assigned presentation ID's have the presentation ID remaining.
 * @returns Presentation ID id, or undefined if nothing displayed
 */
const getPresentationId = (viewport, viewports): string => {
  if (!viewport) return;
  const { viewportOptions, displaySetInstanceUIDs } = viewport;
  if (!viewportOptions || !displaySetInstanceUIDs?.length) {
    console.log('No viewport type or display sets in', viewport);
    return;
  }

  const viewportType = viewportOptions.viewportType || 'stack';
  const idArr = [viewportType, 0, ...displaySetInstanceUIDs];
  if (viewportOptions.orientation) {
    idArr.splice(2, 0, viewportOptions.orientation);
  }
  // Allow setting a custom presentation prefix - this allows defining new
  // presentation groups to be set automatically when one knows that the
  // same display set will be displayed in different ways.
  if (viewportOptions.presentationPrefix) {
    idArr.push(viewportOptions.presentationPrefix);
  }
  if (!viewports) {
    console.log('viewports not defined', idArr.join(','));
    return idArr.join('&');
  }
  // Display instance is which instance this image is displayed as.
  // This creates a separate index for each copy of a given display set,
  // For example, if ds UID 123 is displayed 4 times, then it will use
  // displayInstance 0...3 in the presentationId to show it uniquely, and
  // allow saving/restoring the presentation information uniquely.
  // Assume that any single instance is not displayed more than 128 times at once...
  for (let displayInstance = 0; displayInstance < 128; displayInstance++) {
    idArr[1] = displayInstance;
    const testId = idArr.join('&');
    if (!viewports.find(it => it.viewportOptions?.presentationId === testId)) {
      break;
    }
  }
  const id = idArr.join('&');
  return id;
};

export default getPresentationId;
