import User from "../models/user.model.js";
import { generateToken } from "../lib/util.js";

function generateCartId() {
  // Generate a random number, convert to hex, then take 7 characters
  return Math.floor(Math.random() * 0x10000000) // 0x10000000 = 268,435,456 (7 hex digits max value)
    .toString(16) // Convert to hexadecimal
    .padStart(7, "0") // Ensure it's exactly 7 characters long
    .toUpperCase(); // Optional: make it uppercase for consistency
}

export const signup = async (req, res) => {
  const { fullName, email, phoneNumber, password } = req.body;

  try {
    if (!fullName || !email || !password || !phoneNumber) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password mst be at least 6 characters." });
    }
    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "Email already exists." });

    const newUser = new User({
      email,
      fullName,
      password,
      phoneNumber,
    });
    const token = generateToken(newUser._id, res);

    if (newUser) {
      await newUser.save();
      res.status(201).json({
        token,
        user: {
          _id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          phone: newUser.phoneNumber,
          profilePic: newUser.profilePic,
          shippingAddress: newUser.shippingAddress,
          isGoogle: newUser.isGoogle,
        },
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!(password == user.password)) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id, res);

    res.status(200).json({
      token,
      user: {
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phoneNumber,
        profilePic: user.profilePic,
        shippingAddress: user.shippingAddress,
        isGoogle: user.isGoogle,
      },
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const googleLogin = async (req, res) => {
  const { name, email } = req.body;
  try {
    const normalUser = await User.findOne({ email });

    if (normalUser && !normalUser.isGoogle) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    } else if (normalUser && normalUser.isGoogle) {
      const token = generateToken(normalUser._id, res);
      return res.status(200).json({
        token,
        user: {
          _id: normalUser._id,
          fullName: normalUser.fullName,
          email: normalUser.email,
          isGoogle: normalUser.isGoogle,
        },
      });
    }

    const newUser = new User({ fullName: name, email, isGoogle: true });
    const token = generateToken(newUser._id, res);
    await newUser.save();
    res.status(201).json({
      token,
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        isGoogle: true,
      },
    });
  } catch (error) {
    console.log("Error in googleLogin controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 0,
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const changePassword = async (req, res) => {
  const { id, newPassword, currentPassword } = req.body;
  try {
    const user = await User.findOne({ _id: id, password: currentPassword });

    if (!user) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    user.password = newPassword;

    console.log(user);

    const updatedData = await user.save();

    return res.status(200).json({ message: "Password changed", updatedData });
  } catch (error) {
    console.log("Error while changing password: ", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateUserData = async (req, res) => {
  const { id, userData } = req.body;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    // Update user fields
    Object.keys(userData).forEach((key) => {
      user[key] = userData[key];
    });

    const result = await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      user: result,
    });
  } catch (error) {
    console.error("Error while updating user data:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
