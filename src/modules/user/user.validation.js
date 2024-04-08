import joi from 'joi'
import { generalFields } from '../../middleware/validation.js'


export const createUserValidation = joi.object({
    fullName: joi.string().min(2).max(50).required(),
    email: joi.string().email({
        minDomainSegments: 2,
        maxDomainSegments: 4,
        tlds: { allow: ['com', 'net', 'co'] }
    }),
    password: joi.string().pattern(/^(?=.*\d)(?=.*[a-zA-Z])[a-zA-Z0-9]{7,}$/),
    role: joi.string().valid('User', 'Admin', 'Employee').default('User'),
    phoneNumber: joi.string(),
    countryCode: joi.string()

}).required()

export const AdminUpdateUserValidation = joi.object({

    userId: generalFields.id,
    fullName: joi.string().min(2).max(50),
    email: joi.string().email({
        minDomainSegments: 2,
        maxDomainSegments: 4,
        tlds: { allow: ['com', 'net', 'co'] }
    }),
    password: joi.string().pattern(/^(?=.*\d)(?=.*[a-zA-Z])[a-zA-Z0-9]{7,}$/),
    role: joi.string().valid('User', 'Admin', 'Employee').default('User'),
    phoneNumber: joi.string(),
    countryCode: joi.string()

}).required()

export const updateUserValidation = joi.object({

    userId: generalFields.id,
    fullName: joi.string().min(2).max(50),
    email: joi.string().email({
        minDomainSegments: 2,
        maxDomainSegments: 4,
        tlds: { allow: ['com', 'net', 'co'] }
    }),
    password: joi.string().pattern(/^(?=.*\d)(?=.*[a-zA-Z])[a-zA-Z0-9]{7,}$/),
    phoneNumber: joi.string(),
    countryCode: joi.string(),
    isDeleted: joi.boolean(),

}).required()

export const softDeleteUserValidation = joi.object({

    userId: generalFields.id,
}).required()

export const deleteUserValidation = joi.object({

    userId: generalFields.id,
}).required()