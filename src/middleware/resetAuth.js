const jwt = require("jsonwebtoken");
const User = require("../models/user");

const resetAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.RESET_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      "resetTokens.token": token,
    });

    if (!user) {
      throw new Error();
    }
    req.resetToken = token;
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: "Please authenticate." });
  }
};

module.exports = resetAuth;
