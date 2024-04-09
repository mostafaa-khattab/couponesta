import slugify from "slugify";
import categoryModel from "../../../../DB/model/Category.model.js";
import locationModel from "../../../../DB/model/Location.model.js";
import fs from 'fs'
import { asyncHandler } from "../../../utils/errorHandling.js";
import ApiFeatures from "../../../utils/apiFeature.js";
import cron from 'node-cron'


export const getCategories = asyncHandler(async (req, res, next) => {

    const locale = req.params.locale || 'en' // Get locale from request parameters (e.g., 'en' or 'ar')

    // Find brand matching the selected location or the default location
    const apiFeature = new ApiFeatures(categoryModel.find({
        isDeleted: false,
    }).lean(), req.query)
        .paginate()
        .filter()
        .sort()
        .search()
        .select()


    const category = await apiFeature.mongooseQuery

    category?.forEach((elm, index) => {
        // Check if image exists and update its URL
        if (elm.image) {
            category[index].image = "https://mostafa-e-commerce.onrender.com/" + elm.image;
        }

        // Set name and description based on locale
        const name = elm.name ? elm.name[locale] : undefined;
        const description = elm.description ? elm.description[locale] : undefined;
        const slug = elm.slug ? elm.slug[locale] : undefined;

        // Update name and description
        category[index].name = name;
        category[index].description = description;
        category[index].slug = slug;
    });


    return res.status(200).json({ message: 'succuss', category })
})


export const createCategory = asyncHandler(async (req, res, next) => {

    // Extract English and Arabic names and descriptions from request body
    const { en_name, ar_name, en_description, ar_description } = req.body;

    // Convert names to lowercase
    const enName = en_name.toLowerCase();
    const arName = ar_name.toLowerCase();

    // Extract other fields from request body
    const image = req?.file?.dest;
    let location = req.body.location;

    // Check if the category with the English name already exists
    const checkCategoryEn = await categoryModel.findOne({ 'name.en': enName });
    if (checkCategoryEn) {
        return next(new Error(`Duplicate category name ${enName}`, { cause: 409 }));
    }

    // Check if the category with the Arabic name already exists
    const checkCategoryAr = await categoryModel.findOne({ 'name.ar': arName });
    if (checkCategoryAr) {
        return next(new Error(`Duplicate category name ${arName}`, { cause: 409 }));
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

    // Create category with both English and Arabic names and descriptions
    const category = await categoryModel.create({
        name: {
            en: enName,
            ar: arName
        },
        slug: {
            en: slugify(enName),
            ar: slugify(arName)
        },
        image,
        description: {
            en: en_description,
            ar: ar_description
        },
        location,
        createdBy: req.user._id
    });

    // Append BASE_URL to the image field
    if (category.image) {
        category.image = "https://mostafa-e-commerce.onrender.com/" + category.image;
    }

    return res.status(201).json({ message: 'success', category });

})


export const updateCategory = asyncHandler(async (req, res, next) => {
    const { categoryId } = req.params;

    let category = await categoryModel.findById(categoryId);

    if (!category) {
        return res.status(400).json({ error: 'Invalid category ID' });
    }

    let { en_name, ar_name, location, ar_description, en_description } = req.body;

    // Update names and slug if provided
    if (en_name || ar_name) {
        // Convert to lowercase and handle empty/null values
        let newEnName = en_name ? en_name.toLowerCase() : category.name.en;
        let newArName = ar_name ? ar_name.toLowerCase() : category.name.ar;

        // Check for duplicates
        const checkEnName = await categoryModel.findOne({ 'name.en': newEnName });
        const checkArName = await categoryModel.findOne({ 'name.ar': newArName });

        if (checkEnName && en_name) {
            return res.status(409).json({ error: `Duplicate English category name ${newEnName}` });
        }

        if (checkArName && ar_name) {
            return res.status(409).json({ error: `Duplicate Arabic category name ${newArName}` });
        }

        // Update category names
        category.name.en = newEnName;
        category.name.ar = newArName;

        // Update the slug based on the English name
        req.body.slug.en = slugify(newEnName);
        req.body.slug.ar = slugify(newArName);
    }


    if (ar_description || en_description) {
        let newEnDesc = ar_description ? ar_description.toLowerCase() : category.description.en;
        let newArDesc = en_description ? en_description.toLowerCase() : category.description.ar;

        category.description.en = newEnDesc
        category.description.ar = newArDesc

    }

    // Update image if provided
    if (req.file) {
        fs.unlinkSync(category.image, (err) => {
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
            if (category.location.includes(locationId)) {
                return res.status(409).json({ error: `Location ID already exists ${locationId}. Choose another location.` });
            }

            const checkLocation = await locationModel.findById(locationId);
            if (!checkLocation) {
                return res.status(404).json({ error: `Not found this location ID ${locationId}` });
            }
        }
        category.location.push(...newLocations);
        req.body.location = category.location;
    }

    // Update updatedBy field
    req.body.updatedBy = req.user._id;

    category = await category.save();

    // Save updated category
    category = await categoryModel.findByIdAndUpdate(categoryId, req.body, { new: true });

    // Append BASE_URL to the image field
    if (category.image) {
        category.image = "https://mostafa-e-commerce.onrender.com/" + category.image;
    }


    return res.status(200).json({ message: 'success', category });

});


export const deleteCategory = asyncHandler(async (req, res, next) => {
    const { categoryId } = req.params;

    const category = await categoryModel.findByIdAndDelete(categoryId)

    !category && next(new Error(`category not found`, { status: 404 }));

    if (category?.image) {
        try {
            fs.unlinkSync(category?.image);
            // console.log("Image deleted:", document.image);
        } catch (err) {
            // console.error("Error deleting image:", err);
        }
    }

    category && res.status(202).json({ message: " success", category })
})


export const getCategoriesDeleted = asyncHandler(async (req, res, next) => {

    const locale = req.params.locale || 'en' // Get locale from request parameters (e.g., 'en' or 'ar')

    let { isDeleted, categoryId } = req.body;

    if (isDeleted && categoryId) {
        // Save updated category
        let isDel = await categoryModel.findByIdAndUpdate(categoryId, { isDeleted }, { new: true });
    }

    // Find brand matching the selected location or the default location
    const apiFeature = new ApiFeatures(categoryModel.find({
        isDeleted: true,
    }).lean(), req.query)
        .paginate()
        .filter()
        .sort()
        .search()
        .select()


    let category = await apiFeature.mongooseQuery

    category?.forEach((elm, index) => {
        // Check if image exists and update its URL
        if (elm.image) {
            category[index].image = "https://mostafa-e-commerce.onrender.com/" + elm.image;
        }

        // Set name and description based on locale
        const name = elm.name ? elm.name[locale] : undefined;
        const description = elm.description ? elm.description[locale] : undefined;
        const slug = elm.slug ? elm.slug[locale] : undefined;

        // Update name and description
        category[index].name = name;
        category[index].description = description;
        category[index].slug = slug;
    });

    return res.status(200).json({ message: 'succuss', category })
})


// Schedule a job to delete categoryModel older than 60 days
cron.schedule('0 0 0 1 */2 *', async () => {
    try {

        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

        let categoryToDelete = await categoryModel.find({ isDeleted: true, updatedAt: { $lt: sixtyDaysAgo } });

        categoryToDelete?.forEach(async (document) => {
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

        let del = await categoryModel.deleteMany({ isDeleted: true, updatedAt: { $lt: sixtyDaysAgo } });// Schedule a job to delete categories older than 60 days

    } catch (error) {
        // new Error('Error deleting');
    }

});
