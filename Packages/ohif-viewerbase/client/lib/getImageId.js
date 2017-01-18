import { Meteor } from "meteor/meteor";
import { getWADORSImageId } from './getWADORSImageId';

/**
 * Obtain an imageId for Cornerstone from an image instance
 *
 * @param instance
 * @returns {string} The imageId to be used by Cornerstone
 */
export function getImageId(instanceMetadata, frame) {
    if (!instanceMetadata) {
        return;
    }

    const instance = instanceMetadata.getData();

    if (!instance) {
        return;
    }

    if (instance.url) {
        return instance.url; 
    }

    if (instance.wadouri) {
        var imageId = 'dicomweb:' + Meteor.absoluteUrl(instance.wadouri);
        if (frame !== undefined) {
            imageId += '&frame=' + frame;
        }

        return imageId;
    } else {
        // TODO= Check multiframe image support with WADO-RS
        return getWADORSImageId(instance); // WADO-RS Retrieve Frame
    }
}
