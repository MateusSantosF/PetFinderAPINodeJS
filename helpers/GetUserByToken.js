const JwtManager = require('./JwtManager')
const User = require('../models/User')

module.exports = async (req) => {
    const token = JwtManager.getTokenFromHeader(req);
    let user = JwtManager.getDecodedToken(token);
    try {
        user = await User.findById(user.id);
    } catch (error) {
        return;
    }

    if (!user) {
        return;
    }
    return user;
}