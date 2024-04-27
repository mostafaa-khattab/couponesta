import brandModel from "../../../../DB/model/Brand.model.js";
import fs from 'fs'
import { asyncHandler } from "../../../utils/errorHandling.js";
import categoryModel from "../../../../DB/model/Category.model.js";
import locationModel from "../../../../DB/model/Location.model.js";
import slugify from "slugify";
import userModel from "../../../../DB/model/User.model.js";
import ApiFeatures from "../../../utils/apiFeature.js";
import cron from 'node-cron'


export const getAllBrandsToDashboard = asyncHandler(async (req, res, next) => {

    // Find brand matching the selected location or the default location
    const apiFeature = new ApiFeatures(brandModel.find({
        isDeleted: false,
    }), req.query)
        .paginate()
        .filter()
        .sort()
        .search()
        .select()


    const brand = await apiFeature.mongooseQuery

    brand?.forEach((elm, index) => {
        // Check if image exists and update its URL
        if (elm.image) {
            brand[index].image = "https://mostafa-e-commerce.onrender.com/" + elm.image;
        }

    });


    return res.status(200).json({ message: 'succuss', brand })
})


export const getBrands = asyncHandler(async (req, res, next) => {

    const locale = req.params.locale || 'en' // Get locale from request parameters (e.g., 'en' or 'ar')

    // Find brand matching the selected location or the default location
    const apiFeature = new ApiFeatures(brandModel.find({
        isDeleted: false,
    }).lean(), req.query)
        .paginate()
        .filter()
        .sort()
        .search()
        .select()


    const brand = await apiFeature.mongooseQuery

    brand?.forEach((elm, index) => {
        // Check if image exists and update its URL
        if (elm.image) {
            brand[index].image = "https://mostafa-e-commerce.onrender.com/" + elm.image;
        }

        // Set name and description based on locale
        const name = elm.name ? elm.name[locale] : undefined;
        const description = elm.description ? elm.description[locale] : undefined;

        // Update name and description
        brand[index].name = name;
        brand[index].description = description;
    });


    return res.status(200).json({ message: 'succuss', brand })
})


export const createBrand = asyncHandler(async (req, res, next) => {

    // Extract English and Arabic names and descriptions from request body
    const { en_name, ar_name, en_description, ar_description } = req.body;

    // Convert names to lowercase
    const enName = en_name.toLowerCase();
    const arName = ar_name.toLowerCase();

    // Extract other fields from request body
    const image = req?.file?.dest;
    let category = req.body.category;
    let location = req.body.location;
    const link = req.body.link

    // Check if the brand with the English name already exists
    const checkBrandEn = await brandModel.findOne({ 'name.en': enName });
    if (checkBrandEn) {
        return next(new Error(`Duplicate brand name ${enName}`, { cause: 409 }));
    }

    // Check if the brand with the Arabic name already exists
    const checkBrandAr = await brandModel.findOne({ 'name.ar': arName });
    if (checkBrandAr) {
        return next(new Error(`Duplicate brand name ${arName}`, { cause: 409 }));
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


    // Create brand with both English and Arabic names and descriptions
    const brand = await brandModel.create({
        name: {
            en: enName,
            ar: arName
        },
        slug: slugify(enName),
        image,
        description: {
            en: en_description,
            ar: ar_description
        },
        category,
        location,
        link,
        createdBy: req.user._id,
    });

    // Append BASE_URL to the image field
    if (brand.image) {
        brand.image = "https://mostafa-e-commerce.onrender.com/" + brand.image;
    }

    return res.status(201).json({ message: 'success', brand });
});



export const updateBrand = asyncHandler(async (req, res, next) => {

    const { brandId } = req.params;
    let brand = await brandModel.findById(brandId)
    if (!brand) {
        return next(new Error(`In-valid brand ID`, { cause: 400 }))
    }

    let { en_name, ar_name, location, category, ar_description, en_description } = req.body;

    // Update names and slug if provided
    if (en_name || ar_name) {
        // Convert to lowercase and handle empty/null values
        let newEnName = en_name ? en_name.toLowerCase() : brand.name.en;
        let newArName = ar_name ? ar_name.toLowerCase() : brand.name.ar;

        // Check for duplicates
        const checkEnName = await brandModel.findOne({ 'name.en': newEnName });
        const checkArName = await brandModel.findOne({ 'name.ar': newArName });

        if (checkEnName && en_name) {
            return res.status(409).json({ error: `Duplicate English brand name ${newEnName}` });
        }

        if (checkArName && ar_name) {
            return res.status(409).json({ error: `Duplicate Arabic brand name ${newArName}` });
        }

        // Update brand names
        brand.name.en = newEnName;
        brand.name.ar = newArName;

        // Update the slug based on the English name
        req.body.slug = slugify(newEnName);
    }


    if (ar_description || en_description) {
        let newEnDesc = ar_description ? ar_description.toLowerCase() : brand.description.en;
        let newArDesc = en_description ? en_description.toLowerCase() : brand.description.ar;

        brand.description.en = newEnDesc
        brand.description.ar = newArDesc

    }

    // Update image if provided
    if (req.file) {
        fs.unlinkSync(brand.image, (err) => {
            if (err) {
                // console.error("Error deleting previous image:", err);
            }
        });

        req.body.image = req.file.dest;
    }

    // Update location if provided
    if (location) {
        const newLocations = Array.isArray(location) ? location : [location];
        for (const locationId of newLocations) {
            if (brand.location.includes(locationId)) {
                return res.status(409).json({ error: `Location ID already exists ${locationId}. Choose another location.` });
            }

            const checkLocation = await locationModel.findById(locationId);
            if (!checkLocation) {
                return res.status(404).json({ error: `Not found this location ID ${locationId}` });
            }
        }
        brand.location.push(...newLocations);
        req.body.location = brand.location;
    }


    // Check each category ID in the array
    if (category) {
        const newCategories = Array.isArray(category) ? category : [category];
        for (const categoryId of newCategories) {
            if (brand.category.includes(categoryId)) {
                return res.status(409).json({ error: `category ID already exists ${categoryId}. Choose another category.` });
            }

            const checkCategory = await categoryModel.findById(categoryId);
            if (!checkCategory) {
                return res.status(404).json({ error: `Not found this category ID ${categoryId}` });
            }
        }
        brand.category.push(...newCategories);
        req.body.category = brand.category;
    }

    req.body.updatedBy = req.user._id

    brand = await brand.save();

    brand = await brandModel.findByIdAndUpdate(brandId, req.body, { new: true });

    // Append BASE_URL to the image field
    if (brand.image) {
        brand.image = "https://mostafa-e-commerce.onrender.com/" + brand.image;
    }

    return res.status(201).json({ message: 'success', brand });

})

export const deleteBrand = asyncHandler(async (req, res, next) => {
    const { brandId } = req.params;

    const brand = await brandModel.findByIdAndDelete(brandId)

    !brand && next(new Error(`brand not found`, { status: 404 }));

    if (brand?.image) {
        try {
            fs.unlinkSync(brand?.image);
            // console.log("Image deleted:", document.image);
        } catch (err) {
            // console.error("Error deleting image:", err);
        }
    }

    brand && res.status(202).json({ message: " success", brand })
})


export const getBrandsDeleted = asyncHandler(async (req, res, next) => {

    const locale = req.params.locale || 'en' // Get locale from request parameters (e.g., 'en' or 'ar')

    let { isDeleted, brandId } = req.body;

    if (isDeleted && brandId) {
        // Save updated brand
        let isDel = await brandModel.findByIdAndUpdate(brandId, { isDeleted }, { new: true });
    }

    // Find brand matching the selected location or the default location
    const apiFeature = new ApiFeatures(brandModel.find({
        isDeleted: true,
    }).lean(), req.query)
        .paginate()
        .filter()
        .sort()
        .search()
        .select()


    const brand = await apiFeature.mongooseQuery

    brand?.forEach((elm, index) => {
        // Check if image exists and update its URL
        if (elm.image) {
            brand[index].image = "https://mostafa-e-commerce.onrender.com/" + elm.image;
        }

        // Set name and description based on locale
        const name = elm.name ? elm.name[locale] : undefined;
        const description = elm.description ? elm.description[locale] : undefined;

        // Update name and description
        brand[index].name = name;
        brand[index].description = description;
    });

    return res.status(200).json({ message: 'succuss', brand })
})


// Schedule a job to delete brandModel older than 60 days
cron.schedule('0 0 0 1 */2 *', async () => {
    try {

        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

        let brandToDelete = await brandModel.find({ isDeleted: true, updatedAt: { $lt: sixtyDaysAgo } });

        brandToDelete?.forEach(async (document) => {
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

        let del = await brandModel.deleteMany({ isDeleted: true, updatedAt: { $lt: sixtyDaysAgo } });// Schedule a job to delete categories older than 60 days

    } catch (error) {
        // new Error('Error deleting');
    }

});


export const addFollow = asyncHandler(async (req, res, next) => {

    const { brandId } = req.params;

    if (!await brandModel.findOne({ _id: brandId, isDeleted: false })) {
        return next(new Error(`In-valid brand ID`, { cause: 400 }))
    }

    await userModel.updateOne({ _id: req.user._id }, { $addToSet: { follow: brandId } })

    return res.status(201).json({ message: 'succuss' })
})

export const deleteFromFollow = asyncHandler(async (req, res, next) => {

    const { brandId } = req.params;
    if (!await brandModel.findOne({ _id: brandId, isDeleted: false })) {
        return next(new Error(`In-valid brand ID`, { cause: 400 }))
    }

    await userModel.updateOne({ _id: req.user._id }, { $pull: { follow: brandId } })

    return res.status(201).json({ message: 'succuss' })
})
