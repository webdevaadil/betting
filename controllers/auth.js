const User = require("../models/User");
const crypto = require("crypto");
const ErrorResponse = require("../utlis/errorresponse");
const sendEmail = require("../utlis/sendEmail");
exports.register = async (req, res, next) => {
  const { username, email, password, package } = req.body;
  try {
    User.findOne({ email }, async (err, user) => {
      if (user) {
        return next(new ErrorResponse("user already registed"), 400);
      } else {
        const user = await User.create({
          username,
          email,
          password,
          package,
        });
        sendToken(user, 201, res);
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

    sendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.forgetpassword = async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorResponse("Email could not br sent", 404));
  }
  const resetToken = user.getresetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `http://localhost:3000/passwordreset/${resetToken}`;
  const message = `you have requested a  password reset
    please go to this link to reset your password
    ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "password reset request",
      message,
    });
    res.status(200).json({
      success: true,
      data: `email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    return next(new ErrorResponse("Email could not be send", 500));
  }
};
exports.resetPassword = async (req, res, next) => {
  // Compare token in URL params to hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    console.log(user);

    if (!user) {
      return next(new ErrorResponse("Invalid Tok    en", 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(201).json({
      success: true,
      data: "Password Updated Success",
      token: user.getSignedToken(),
    });
  } catch (err) {
    next(err);
  }
};

exports.dashboard = async (req, res, next) => {
  const products = await User.findById(req.user._id);
  // const productCount = await Product.countDocuments()
  if (!products) {
      return next(new Errorhandler("product not found", 404))
  }
  res.status(200).json({
      sucess: true,
      products,
      // productCount,
  })
};

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken();
  res.status(statusCode).json({ success: true, token });
};
