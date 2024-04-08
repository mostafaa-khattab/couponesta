import jwt from 'jsonwebtoken'


export const generateToken = ({ payload = {}, signature = "coupons 246810", expiresIn = 60 * 60 } = {}) => {
    const token = jwt.sign(payload, signature, { expiresIn: parseInt(expiresIn) });
    return token
}

export const verifyToken = ({ token , signature = "coupons 246810" } = {}) => {
    const decoded = jwt.verify(token, signature);
    return decoded
}