import { asyncHandler } from "../../../utils/errorHandling.js";
import couponModel from "../../../../DB/model/Coupon.model.js";
import locationModel from "../../../../DB/model/Location.model.js";
import categoryModel from "../../../../DB/model/Category.model.js";
import brandModel from "../../../../DB/model/Brand.model.js";
import QRCode from "qrcode"
import userModel from "../../../../DB/model/User.model.js";
import ApiFeatures from "../../../utils/apiFeature.js";
import notificationModel from "../../../../DB/model/Notification.model.js";
import cron from 'node-cron'


export const getAllCouponsToDashboard = asyncHandler(async (req, res, next) => {

    // Find coupon matching the selected location or the default location
    const apiFeature = new ApiFeatures(couponModel.find({
        isDeleted: false,
    }), req.query)
        .paginate()
        .filter()
        .sort()
        .search()
        .select()


    const coupon = await apiFeature.mongooseQuery

    return res.status(200).json({ message: 'succuss', coupon })
})


export const getCoupons = asyncHandler(async (req, res, next) => {

    const locale = req.params.locale || 'en' // Get locale from request parameters (e.g., 'en' or 'ar')

    // Find coupon matching the selected location or the default location
    const apiFeature = new ApiFeatures(couponModel.find({
        isDeleted: false,
    }).lean(), req.query)
        .paginate()
        .filter()
        .sort()
        .search()
        .select()


    const coupon = await apiFeature.mongooseQuery

    coupon?.forEach((elm, index) => {

        // Set status and description based on locale
        const status = elm.status ? elm.status[locale] : undefined;
        const description = elm.description ? elm.description[locale] : undefined;

        // Update status and description
        coupon[index].status = status;
        coupon[index].description = description;
    });


    return res.status(200).json({ message: 'succuss', coupon })
})


export const createCoupon = asyncHandler(async (req, res, next) => {
    req.body.code = req.body.code.toLowerCase();
    if ((new Date(req.body.expire)) < (new Date())) return res.status(400).json({ message: "In-valid Date" })

    // Extract English and Arabic names and descriptions from request body
    let { brand, category, location, en_description, ar_description, en_status, ar_status } = req.body;

    req.body.qrCode = await QRCode.toDataURL(req.body.code);

    const checkCoupon = await couponModel.findOne({ code: req.body.code, isDeleted: false });
    if (checkCoupon) {
        return next(new Error(`Duplicate coupon code ${req.body.code}`, { cause: 409 }));
    }

    // Check each category ID in the array
    if (!Array.isArray(category)) {
        // Convert to array if it's not already
        category = [category];
    }

    for (const categoryId of category) {
        // Check if the ID exists in the database
        const checkCategory = await categoryModel.findById(categoryId);
        if (!checkCategory) {
            return next(new Error(`Not found this category ID ${categoryId}`, { status: 404 }));
        }
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


    // Check each brand ID in the array
    if (!Array.isArray(brand)) {
        // Convert to array if it's not already
        brand = [brand];
    }

    for (const brandId of brand) {
        // Check if the ID exists in the database
        const checkBrand = await brandModel.findById(brandId);
        if (!checkBrand) {
            return next(new Error(`Not found this brand ID ${brandId}`, { status: 404 }));
        }
    }


    const coupon = await couponModel.create({
        ...req.body,
        description: {
            en: en_description,
            ar: ar_description
        },
        status: {
            en: en_status,
            ar: ar_status
        },
        createdBy: req.user._id,
    });

    const usersFollowingBrand = await userModel.find({ follow: { $in: brand } });

    let notification = []

    // Send notifications to users who follow the brand
    for (const user of usersFollowingBrand) {

        notification = await notificationModel.create({
            header: {
                en: req.body.code,
                ar: req.body.code
            },
            body: {
                en: coupon.description.en,
                ar: coupon.description.ar
            },
            user: [user._id],
            createdBy: req.user._id
        });

        // console.log(notification);
    }

    return res.status(201).json({ message: 'success', coupon, notification });
});


export const updateCoupon = asyncHandler(async (req, res, next) => {

    const { couponId } = req.params;
    let coupon = await couponModel.findOne({ _id: couponId })
    if (!coupon) {
        return next(new Error(`In-valid coupon ID`, { cause: 400 }))
    }

    if ((new Date(req.body.expire)) < (new Date())) return res.status(400).json({ message: "In-valid Date" })

    let { location, category, brand, ar_description, en_description } = req.body;

    // check code exist or not
    if (req.body.code) {

        req.body.code = req.body.code.toLowerCase();
        req.body.qrCode = await QRCode.toDataURL(req.body.code)

        if (req.body.code == coupon.code) {
            return next(new Error(`Cannot update coupon with the same old code`, { cause: 409 }))
        }

        if (await couponModel.findOne({ code: req.body.code })) {
            return next(new Error(`Duplicate coupon code ${req.body.code}`, { cause: 409 }))
        }
    }

    if (ar_description || en_description) {
        let newEnDesc = en_description ? en_description.toLowerCase() : coupon.description.en;
        let newArDesc = ar_description ? ar_description.toLowerCase() : coupon.description.ar;

        coupon.description.en = newEnDesc
        coupon.description.ar = newArDesc
    }

    // Update location if provided
    if (location) {
        const newLocations = Array.isArray(location) ? location : [location];

        for (const locationId of newLocations) {
            const checkLocation = await locationModel.findById(locationId);
            if (!checkLocation) {
                return res.status(404).json({ error: `Not found this location ID ${locationId}` });
            }
        }

        // Use $addToSet to add locations without duplication
        await couponModel.findByIdAndUpdate(couponId, { $addToSet: { location: { $each: newLocations } } });

        // Fetch the updated coupon
        coupon = await couponModel.findById(couponId);
        req.body.location = coupon.location;
    }


    // Update categories if provided
    if (category) {
        const newCategories = Array.isArray(category) ? category : [category];

        for (const categoryId of newCategories) {
            if (brand.category.includes(categoryId)) {
                return res.status(409).json({ error: `Category ID already exists ${categoryId}. Choose another category.` });
            }

            const checkCategory = await categoryModel.findById(categoryId);
            if (!checkCategory) {
                return res.status(404).json({ error: `Not found this category ID ${categoryId}` });
            }
        }

        // Use $addToSet to add categories without duplication
        await coupon.findByIdAndUpdate(couponId, { $addToSet: { category: { $each: newCategories } } });

        // Fetch the updated coupon
        coupon = await coupon.findById(couponId);
        req.body.category = coupon.category;
    }

    // Update brands if provided
    if (brand) {
        const newBrands = Array.isArray(brand) ? brand : [brand];

        for (const brandId of newBrands) {
            if (coupon.brand.includes(brandId)) {
                return res.status(409).json({ error: `Brand ID already exists ${brandId}. Choose another brand.` });
            }

            const checkBrand = await brandModel.findById(brandId);
            if (!checkBrand) {
                return res.status(404).json({ error: `Not found this brand ID ${brandId}` });
            }
        }

        // Use $addToSet to add brands without duplication
        await couponModel.findByIdAndUpdate(couponId, { $addToSet: { brand: { $each: newBrands } } });

        // Fetch the updated coupon
        coupon = await couponModel.findById(couponId);
        req.body.brand = coupon.brand;
    }


    req.body.updatedBy = req.user._id

    coupon = await coupon.save();

    coupon = await couponModel.findByIdAndUpdate(couponId, req.body, { new: true })

    return res.status(201).json({ message: 'succuss', coupon })

})

export const updateCouponLike = asyncHandler(async (req, res, next) => {

    const { couponId } = req.params;
    let coupon = await couponModel.findOne({ _id: couponId, isDeleted: false })
    if (!coupon) {
        return next(new Error(`In-valid coupon ID`, { cause: 400 }))
    }

    let { usedCount, likeCount, dislikeCount } = req.body;

    req.body.updatedBy = req.user._id

    coupon = await coupon.save();

    coupon = await couponModel.findByIdAndUpdate(couponId,
        {
            usedCount,
            likeCount,
            dislikeCount
        },
        { new: true })

    return res.status(201).json({
        message: 'succuss', coupon: {
            usedCount,
            likeCount,
            dislikeCount,
            updatedBy: req.user._id
        }
    })
})

export const deleteCoupon = asyncHandler(async (req, res, next) => {
    const { couponId } = req.params;

    const coupon = await couponModel.findByIdAndDelete(couponId)

    !coupon && next(new Error(`coupon not found`, { status: 404 }));
    coupon && res.status(202).json({ message: " success", coupon })
})

export const getCouponsDeleted = asyncHandler(async (req, res, next) => {

    const locale = req.params.locale || 'en' // Get locale from request parameters (e.g., 'en' or 'ar')

    let { isDeleted, couponId } = req.body;

    if (isDeleted && couponId) {
        // Save updated coupon
        let isDel = await couponModel.findByIdAndUpdate(couponId, { isDeleted }, { new: true });
    }

    // Find brand matching the selected location or the default location
    const apiFeature = new ApiFeatures(couponModel.find({
        isDeleted: true,
    }).lean(), req.query)
        .paginate()
        .filter()
        .sort()
        .search()
        .select()


    const coupon = await apiFeature.mongooseQuery

    coupon?.forEach((elm, index) => {

        // Set status and description based on locale
        const status = elm.status ? elm.status[locale] : undefined;
        const description = elm.description ? elm.description[locale] : undefined;

        // Update status and description
        coupon[index].status = status;
        coupon[index].description = description;
    });

    return res.status(200).json({ message: 'succuss', coupon })
})

// Schedule a job to delete couponModel older than 60 days
cron.schedule('0 0 0 1 */2 *', async () => {
    try {

        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

        let del = await couponModel.deleteMany({ isDeleted: true, updatedAt: { $lt: sixtyDaysAgo } });// Schedule a job to delete categories older than 60 days

    } catch (error) {
        // new Error('Error deleting');
    }

});


export const addFavorite = asyncHandler(async (req, res, next) => {

    const { couponId } = req.params;

    if (!await couponModel.findOne({ _id: couponId, isDeleted: false })) {
        return next(new Error(`In-valid coupon ID`, { cause: 400 }))
    }

    await userModel.updateOne({ _id: req.user._id }, { $addToSet: { favorite: couponId } })

    return res.status(201).json({ message: 'succuss' })
})

export const deleteFromFavorite = asyncHandler(async (req, res, next) => {

    const { couponId } = req.params;
    if (!await couponModel.findOne({ _id: couponId, isDeleted: false })) {
        return next(new Error(`In-valid coupon ID`, { cause: 400 }))
    }

    await userModel.updateOne({ _id: req.user._id }, { $pull: { favorite: couponId } })

    return res.status(201).json({ message: 'succuss' })
})
