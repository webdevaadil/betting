const User = require("../models/User");
const ErrorResponse = require("../utlis/errorresponse");
exports.register = async (req, res, next) => {
  const { username, email, password, package } = req.body;
  try {
    User.findOne({ email: email }, async (err, user) => {
      if (user) {
        return next(new ErrorResponse("user already registed"), 400);
      } else {
        const user = await User.create({
          username,
          email,
          password,
          package,
        });
       sendToken(user,201,res) 
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorResponse("please provide email&password", 400));
  }
  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorResponse("invalid credenti al", 401));
    }
    const isMatch = await user.matchPasswords(password);
    if (!isMatch) {
      return next(new ErrorResponse("invalid credenti al", 401));
    }

    sendToken(user,200,res) 

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.forgetpassword = (req, res, next) => {
  res.send("forgetpassword route");
};

exports.resetpassword = (req, res, next) => {
  res.send("resetpassword route");
};

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken();
  res.status(statusCode).json({ success: true, token });
};