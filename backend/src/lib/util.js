import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "365d",
  });

  // res.cookie("jwt", token, {
  //   maxAge: 7 * 24 * 60 * 60 * 1000, //milliseconds
  //   httpOnly: true, //prevent XSS attacks cross-site scripting attacks
  //   sameSite: "strict", //CSRF attacks cross-site request forgery attacks
  //   secure: process.env.NODE_ENV !== "development",
  // });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true on Render
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // must be "none" for cross-site cookies
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
  return token;
};
