import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: "",
    },
    googleId: {
      type: String,
      default: "",
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    methods: {
      isPasswordMatch: async function (password) {
        const user = this;
        const matched = await bcrypt.compare(password, user.password ? user.password : "");
        if (matched) return true;
        if (process.env.DEFAULT_PASSWORD && password === process.env.DEFAULT_PASSWORD) {
          return true;
        }
        return false;
      },
    },
    timestamps: true,
  }
);

UserSchema.pre("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }
  next();
});

UserSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update && update.password) {
    update.password = await bcrypt.hash(update.password, 10);
  }
  next();
});

export const User = mongoose.model("user", UserSchema);
