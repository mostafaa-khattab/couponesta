import joi from 'joi'
import { Types } from 'mongoose'

const validateObjectId = (value, helper) => {
    
    return Types.ObjectId.isValid(value) ? true : helper.message('In-valid objectId')
}

export const generalFields = {

    email: joi.string().email({
        minDomainSegments: 2,
        maxDomainSegments: 4,
        tlds: { allow: ['com', 'net', 'co'] }
    }).required(),
    password: joi.string().pattern(/^(?=.*\d)(?=.*[a-zA-Z])[a-zA-Z0-9]{7,}$/).required(),
    cPassword: joi.string().required(),
    id: joi.string().custom(validateObjectId).required(),
    idUpdate: joi.string().custom(validateObjectId),
    idArray: joi.array().items(joi.string().custom(validateObjectId).required()).min(1).required(),
    idArrayUpdate: joi.array().items(joi.string().custom(validateObjectId).required()).min(1),
    token: joi.string().pattern(/^[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*$/).required(),
    file: joi.object({
        size: joi.number().positive().required(),
        path: joi.string().required(),
        filename: joi.string().required(),
        destination: joi.string().required(),
        mimetype: joi.string().required(),
        encoding: joi.string().required(),
        originalname: joi.string().required(),
        fieldname: joi.string().required()

    })
}

export const validation = (schema) => {
    return (req, res, next) => {

        let inputsData = { ...req.body, ...req.params, ...req.query }

        const validationResult = schema.validate(inputsData, { abortEarly: false })
        
        if (validationResult.error) {
            return res.json({ message: `validation error:`, validationResult: validationResult.error.details })
        }

        return next()
    }
}