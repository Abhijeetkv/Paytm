import { Router } from "express";
import zod from "zod";
import { User } from "../model/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import config from "../config.js";
import { authMiddleware } from "../middleware.js";

const { JWT_SECRET } = config;

const router = Router();

/* ==============================
   Signup Route
============================== */
const signupBody = zod.object({
  username: zod.string().email(),
  firstName: zod.string(),
  lastName: zod.string(),
  password: zod.string().min(6)
});

router.post("/signup", async (req, res) => {
    const { success } = signupBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    const existingUser = await User.findOne({
        username: req.body.username
    })

    if (existingUser) {
        return res.status(411).json({
            message: "Email already taken/Incorrect inputs"
        })
    }

    const user = await User.create({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    })
    const userId = user._id;

		/// ----- Create new account ------

    await Account.create({
        userId,
        balance: 1 + Math.random() * 10000
    })

		/// -----  ------

    const token = jwt.sign({
        userId
    }, JWT_SECRET);

    res.json({
        message: "User created successfully",
        token: token
    })
})

/* ==============================
   Signin Route
============================== */
const signinBody = zod.object({
  username: zod.string().email(),
  password: zod.string()
});

router.post("/signin", async (req, res) => {
  const { success } = signinBody.safeParse(req.body);
  if (!success) {
    return res.status(411).json({ message: "Incorrect inputs" });
  }

  const user = await User.findOne({ username: req.body.username });

  if (!user) {
    return res.status(411).json({ message: "User not found" });
  }

  const isPasswordValid = await bcrypt.compare(
    req.body.password,
    user.password
  );

  if (!isPasswordValid) {
    return res.status(411).json({ message: "Invalid password" });
  }

  const token = jwt.sign({ userId: user._id }, JWT_SECRET);

  res.json({ token });
});

/* ==============================
   Update User Info (Protected)
============================== */
const updateBody = zod.object({
  password: zod.string().optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional()
});

router.put("/", authMiddleware, async (req, res) => {
  const { success } = updateBody.safeParse(req.body);
  if (!success) {
    return res.status(411).json({
      message: "Error while updating information"
    });
  }

  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 10);
  }

  await User.updateOne({ _id: req.userId }, req.body);

  res.json({ message: "Updated successfully" });
});

/* ==============================
   Bulk Search Users
============================== */
router.get("/bulk", async (req, res) => {
  const filter = req.query.filter || "";

  const users = await User.find({
    $or: [
      { firstName: { $regex: filter, $options: "i" } },
      { lastName: { $regex: filter, $options: "i" } }
    ]
  });

  res.json({
    user: users.map((user) => ({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id
    }))
  });
});

export default router;
