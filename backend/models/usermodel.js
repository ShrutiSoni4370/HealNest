import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please enter your first name"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Please enter your last name"],
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Please choose a username"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Please enter your phone number"],
    },
    countryCode: {
      type: String,
      required: [true, "Please enter your country code"],
    },
    password: {
      type: String,
      required: [true, "Please enter a password"],
      minlength: 6,
    },
    gender: {
      type: String,
      required: [true, "Please enter your gender"],
      enum: ["Male", "Female", "Other"],
    },
    dob: {
      type: Date,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ObjectId connection to Reports
userSchema.virtual('reports', {
  ref: 'Report', 
  localField: '_id',
  foreignField: 'userId'
});

userSchema.virtual('reports', {
  ref: 'MoodReport', 
  localField: '_id',
  foreignField: 'userId'
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const User = mongoose.model("User", userSchema);

export default User;
