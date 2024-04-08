import adsModel from "../../../../DB/model/ads.model.js";
import fs from 'fs'
import { asyncHandler } from "../../../utils/errorHandling.js";
import locationModel from "../../../../DB/model/Location.model.js";
import ApiFeatures from "../../../utils/apiFeature.js";
import cron from 'node-cron'


// export const getAds = asyncHandler(async (req, res, next) => {

//     const defaultLocationId = '65f36abdc724e4188406c3b1';

//     // Get the selected location ID from the user input
//     const selectedLocationId = req.body.location || defaultLocationId;

//     if (req?.body?.location) {
//         let loc = await locationModel.findById(req.body.location)
//         if (!loc) {
//             return next(new Error(`location not found ${req.body.location}`, { cause: 404 }));
//         }
//     }

//     // Find ads matching the selected location or the default location
//     const ads = await adsModel.find({
//         isDeleted: false,
//         location: { $in: [selectedLocationId || defaultLocationId] }
//     });


//     ads?.forEach((elm, index) => {

//         ads[index].image = process.env.BASE_URL + elm.image
//     })

//     return res.status(200).json({ message: 'succuss', ads })
// })


// export const getOneAds = asyncHandler(async (req, res, next) => {

//     const defaultLocationId = '65f36abdc724e4188406c3b1';

//     // Get the selected location ID from the user input
//     const selectedLocationId = req.body.location || defaultLocationId;

//     if (req?.body?.location) {
//         let loc = await locationModel.findById(req.body.location)
//         if (!loc) {
//             return next(new Error(`Location not found ${req.body.location}`, { cause: 404 }));
//         }
//     }


//     // Find categories matching the selected location or the default location
//     const ads = await adsModel.findOne({
//         _id: req?.params?.adsId,
//         isDeleted: false,
//         location: { $in: [selectedLocationId || defaultLocationId] }

//     })

//     // If ads not found in both locations, return 404
//     if (!ads) {
//         return next(new Error(`ads not found with ID ${req.params.adsId}`, { status: 404 }));
//     }

//     // Append BASE_URL to the image field
//     if (ads.image) {
//         ads.image = process.env.BASE_URL + ads.image;
//     }

//     return res.status(200).json({ message: "success", ads });
// });

export const getAds = asyncHandler(async (req, res, next) => {

    // Find brand matching the selected location or the default location
    const apiFeature = new ApiFeatures(adsModel.find({
        isDeleted: false,
    }).lean(), req.query)
        .paginate()
        .filter()
        .sort()
        .search()
        .select()


    const ads = await apiFeature.mongooseQuery

    ads?.forEach((elm, index) => {
        // Check if image exists and update its URL
        if (elm.image) {
            ads[index].image = process.env.BASE_URL + elm.image;
        }

    });


    return res.status(200).json({ message: 'succuss', ads })
})


export const createAds = asyncHandler(async (req, res, next) => {

    const name = req.body.name.toLowerCase();
    const link = req.body.link
    const image = req?.file?.dest
    let location = req.body.location

    const checkAds = await adsModel.findOne({ name })
    if (checkAds) {
        return next(new Error(`Duplicate Ads name ${name}`, { cause: 409 }))
    }

    // Check each location ID in the array
    if (!Array.isArray(location)) {
        // Convert to array if it's not already
        location = [location];
    }

    for (const locationId of location) {

        // Check if the ID exists in the database
        const checkLocation = await locationModel.findById(locationId);
        if (!checkLocation) {
            return next(new Error(`Not found this location ID ${locationId}`, { status: 404 }));
        }

    }

    const ads = await adsModel.create({
        name,
        image,
        link,
        location,
        createdBy: req.user._id,
    })

    // Append BASE_URL to the image field
    if (ads.image) {
        ads.image = process.env.BASE_URL + ads.image;
    }

    return res.status(201).json({ message: 'succuss', ads })

})


export const updateAds = asyncHandler(async (req, res, next) => {

    const { adsId } = req.params;
    let ads = await adsModel.findById(adsId)
    if (!ads) {
        return next(new Error(`In-valid ads ID`, { cause: 400 }))
    }

    // check if ads name is already existing or not
    if (req.body.name) {

        req.body.name = req.body.name.toLowerCase();

        if (req.body.name == ads.name) {
            return next(new Error(`Cannot update ads with the same old name`, { cause: 409 }))
        }

        if (await adsModel.findOne({ name: req.body.name })) {
            return next(new Error(`Duplicate ads name ${req.body.name}`, { cause: 409 }))
        }

        ads.name = req.body.name

    }


    if (ads?.image && req?.file) {
        // Delete the previous image
        fs.unlinkSync(ads.image, (err) => {
            if (err) {
                // console.error("Error deleting previous image:", err);
            }
        });

        // Now update ads.image with the new file destination
        req.body.image = req.file.dest;
    }


    // Check each location ID in the array
    if (req.body.location) {
        // Check if req.body.location is an array
        if (!Array.isArray(req.body.location)) {
            // Convert to array if it's not already
            req.body.location = [req.body.location];
        }

        for (const locationId of req.body.location) {
            // Check if the ID already exists in the array
            if (ads.location.includes(locationId)) {
                return next(new Error(`location ID already exists ${locationId}. Choose another location.`, { status: 409 }));
            }

            // Check if the ID exists in the database
            const checkLocation = await locationModel.findById(locationId);
            if (!checkLocation) {
                return next(new Error(`Not found this location ID ${locationId}`, { status: 404 }));
            }

        }

        ads.location.push(req.body.location);

        req.body.location = ads.location
    }

    req.body.updatedBy = req.user._id

    ads = await adsModel.findByIdAndUpdate(adsId, req.body, { new: true });

    // Append BASE_URL to the image field
    if (ads.image) {
        ads.image = process.env.BASE_URL + ads.image;
    }

    return res.status(201).json({ message: 'success', ads });

})

export const deleteAds = asyncHandler(async (req, res, next) => {
    const { adsId } = req.params;

    const ads = await adsModel.findByIdAndDelete(adsId)

    !ads && next(new Error(`ads not found`, { status: 404 }));

    if (ads?.image) {
        try {
            fs.unlinkSync(ads?.image);
            // console.log("Image deleted:", document.image);
        } catch (err) {
            // console.error("Error deleting image:", err);
        }
    }

    ads && res.status(202).json({ message: " success", ads })
})


export const getAdsDeleted = asyncHandler(async (req, res, next) => {

    let { isDeleted, adsId } = req.body;

    if (isDeleted && adsId) {
        // Save updated ads
        let isDel = await adsModel.findByIdAndUpdate(adsId, { isDeleted }, { new: true });
    }

    // Find brand matching the selected location or the default location
    const apiFeature = new ApiFeatures(adsModel.find({
        isDeleted: true,
    }).lean(), req.query)
        .paginate()
        .filter()
        .sort()
        .search()
        .select()

    const ads = await apiFeature.mongooseQuery

    ads?.forEach((elm, index) => {
        // Check if image exists and update its URL
        if (elm?.image) {
            ads[index].image = process.env.BASE_URL + elm.image;
        }

    });

    return res.status(200).json({ message: 'succuss', ads })
})


// Schedule a job to delete adsModel older than 60 days
cron.schedule('0 0 0 1 */2 *', async () => {
    try {

        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

        let adsToDelete = await adsModel.find({ isDeleted: true, updatedAt: { $lt: sixtyDaysAgo } });

        adsToDelete?.forEach(async (document) => {
            // Delete associated image from file system
            if (document?.image) {
                try {
                    fs.unlinkSync(document.image);
                    // console.log("Image deleted:", document.image);
                } catch (err) {
                    // console.error("Error deleting image:", err);
                }
            }
        });

        let del = await adsModel.deleteMany({ isDeleted: true, updatedAt: { $lt: sixtyDaysAgo } });// Schedule a job to delete categories older than 60 days

    } catch (error) {
        // new Error('Error deleting');
    }

});
