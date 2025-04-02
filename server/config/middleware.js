const jwt = require("jsonwebtoken");
// Authentication middleware
const authenticateUser = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json("Access denied. No token provided.");

    try {
        const decoded = jwt.verify(token, "secret"); // Use your secret key
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json("Invalid token.");
    }
};
module.exports = authenticateUser;