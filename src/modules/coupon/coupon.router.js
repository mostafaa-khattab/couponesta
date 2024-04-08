import { validation } from '../../middleware/validation.js';
import * as validators from './coupon.validation.js';
import * as couponController from './controller/coupon.js';
import { Router } from "express";
import { auth, roles } from '../../middleware/auth.js';
const router = Router()


router.get('/:locale?',
    // validation(validators.getAllCouponValidation),
    couponController.getCoupons)

router.post('/',
    auth([roles.Admin]),
    validation(validators.createCouponValidation),
    couponController.createCoupon)

router.put('/:couponId',
    auth([roles.Admin]),
    validation(validators.updateCouponValidation),
    couponController.updateCoupon)

// router.get('/:locale?/:couponId',
//     validation(validators.getOneCouponValidation),
//     couponController.getOneCoupon)

router.put('/trash/:locale?',
    auth([roles.Admin]),
    couponController.getCouponsDeleted)

router.delete('/:couponId',
    auth([roles.Admin]),
    validation(validators.deleteCouponValidation),
    couponController.deleteCoupon)

router.patch('/:couponId/favorite/add',
    auth([roles.User, roles.Admin]),
    validation(validators.favoriteValidation),
    couponController.addFavorite)

router.patch('/:couponId/favorite/remove',
    auth([roles.User, roles.Admin]),
    validation(validators.favoriteValidation),
    couponController.deleteFromFavorite)

export default router