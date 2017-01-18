import { ImageSet } from './classes/ImageSet';
import { isImage } from './isImage';

const isMultiFrame = instance => {
    return instance.getRawValue('NumberOfFrames') > 1;
};

const makeDisplaySet = (series, instances) => {
    const instance = instances[0];

    const imageSet = new ImageSet(instances);
    const seriesData = series.getData();

    // set appropriate attributes to image set...
    imageSet.setAttributes({
        displaySetInstanceUid: imageSet.uid, // create a local alias for the imageSet UID
        seriesInstanceUid: seriesData.seriesInstanceUid,
        seriesNumber: seriesData.seriesNumber,
        seriesDescription: seriesData.seriesDescription,
        numImageFrames: instances.length,
        frameRate: instance.getRawValue('x00181063'),
        modality: seriesData.modality,
        isMultiFrame: isMultiFrame(instance)
    });

    // Sort the images in this series
    imageSet.sortBy((a, b) => {
        // Sort by instance Number
        const aInstanceNumber = a.getRawValue('x00200013');
        const bInstanceNumber = b.getRawValue('x00200013');
        if (a.instanceNumber && b.instanceNumber &&
            a.instanceNumber !== b.instanceNumber) {
            return a.instanceNumber - b.instanceNumber;
        }
    });

    // Include the first image instance number (after sorted)
    imageSet.setAttribute('instanceNumber', imageSet.getImage(0).getRawValue('x00200013'));

    return imageSet;
};

const isSingleImageModality = modality => {
    return (modality === 'CR' ||
            modality === 'MG' ||
            modality === 'DX');
};

/**
 * Creates a set of series to be placed in the Study Metadata
 * The series that appear in the Study Metadata must represent
 * imaging modalities.
 *
 * Furthermore, for drag/drop functionality,
 * it is easiest if the stack objects also contain information about
 * which study they are linked to.
 *
 * @param study The study instance metadata to be used
 * @returns {Array} An array of series to be placed in the Study Metadata
 */
const createStacks = study => {
    // Define an empty array of display sets
    const displaySets = [];

    if (!study || !study.getSeriesCount()) {
        return displaySets;
    }

    // Loop through the series (SeriesMetadata)
    study.forEachSeries(series => {
        // If the series has no instances, skip it
        if (!series.getInstanceCount()) {
            return;
        }

        // Search through the instances (InstanceMedatada object) of this series
        // Split Multi-frame instances and Single-image modalities
        // into their own specific display sets. Place the rest of each
        // series into another display set.
        const stackableInstances = [];
        series.forEachInstance(instance => {
            // All imaging modalities must have a valid value for sopClassUid (x00080016) or rows (x00280010)
            if (!isImage(instance.getRawValue('x00080016')) && !instance.getRawValue('x00280010')) {
                return;
            }

            let displaySet;
            if (isMultiFrame(instance)) {
                displaySet = makeDisplaySet(series, [ instance ]);
                displaySet.setAttributes({
                    isClip: true,
                    studyInstanceUid: study.studyInstanceUid, // Include the study instance Uid for drag/drop purposes
                    numImageFrames: instance.numberOfFrames, // Override the default value of instances.length
                    instanceNumber: instance.instanceNumber, // Include the instance number
                    acquisitionDatetime: instance.acquisitionDatetime // Include the acquisition datetime
                });
                displaySets.push(displaySet);
            } else if (isSingleImageModality(instance.modality)) {
                displaySet = makeDisplaySet(series, [ instance ]);
                displaySet.setAttributes({
                    studyInstanceUid: study.studyInstanceUid, // Include the study instance Uid
                    instanceNumber: instance.instanceNumber, // Include the instance number
                    acquisitionDatetime: instance.acquisitionDatetime // Include the acquisition datetime
                });
                displaySets.push(displaySet);
            } else {
                stackableInstances.push(instance);
            }
        });

        if (stackableInstances.length) {
            const displaySet = makeDisplaySet(series, stackableInstances);
            displaySet.setAttribute('studyInstanceUid', study.getStudyInstanceUID());
            displaySets.push(displaySet);
        }
    });

    return displaySets;
};

/**
 * Expose "createStacks"...
 */

export { createStacks };
