import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const doctorSchema = new mongoose.Schema({
  personalInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function(value) {
          return value < new Date();
        },
        message: 'Date of birth must be in the past'
      }
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: [true, 'Gender is required']
    },
    password: {
      type: String,
      required: [true, "Please enter a password"],
      minlength: 6,
    },
    nationality: {
      type: String,
      trim: true
    }
  },

  contactInfo: {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // ✅ This creates an index automatically
      lowercase: true,
      validate: {
        validator: function(email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: 'Please provide a valid email address'
      }
    },
    phone: {
      primary: {
        type: String,
        required: [true, 'Primary phone number is required'],
        validate: {
          validator: function(phone) {
            return /^[+]?[1-9]\d{1,14}$/.test(phone);
          },
          message: 'Please provide a valid phone number'
        }
      },
    },
  },

  professionalInfo: {
    medicalLicenseNumber: {
      type: String,
      required: [true, 'Medical license number is required'],
      unique: true, // ✅ This creates an index automatically
      trim: true
    },
    licenseExpiryDate: {
      type: Date,
      required: [true, 'License expiry date is required'],
      validate: {
        validator: function(value) {
          return value > new Date();
        },
        message: 'License expiry date must be in the future'
      }
    },
  },

  specializations: {
    primarySpecialization: {
      type: String,
      required: [true, 'Primary specialization is required'],
      enum: [
        'Psychiatry', 'Psychology', 'Clinical Psychology', 'Counseling Psychology',
        'Addiction Medicine', 'Child Psychiatry', 'Geriatric Psychiatry',
        'Neuropsychology', 'Behavioral Therapy', 'Cognitive Behavioral Therapy',
        'Family Therapy', 'Group Therapy', 'Art Therapy', 'Music Therapy'
      ]
    },
    secondarySpecializations: [{
      type: String,
      enum: [
        'Psychiatry', 'Psychology', 'Clinical Psychology', 'Counseling Psychology',
        'Addiction Medicine', 'Child Psychiatry', 'Geriatric Psychiatry',
        'Neuropsychology', 'Behavioral Therapy', 'Cognitive Behavioral Therapy',
        'Family Therapy', 'Group Therapy', 'Art Therapy', 'Music Therapy'
      ]
    }],
    subspecialties: [String],
    areasOfExpertise: [String],
    mentalHealthFocus: [{
      type: String,
      enum: [
        'Depression', 'Anxiety', 'PTSD', 'Bipolar Disorder', 'ADHD',
        'Eating Disorders', 'Substance Abuse', 'Relationship Issues',
        'Grief Counseling', 'Stress Management', 'Sleep Disorders',
        'Personality Disorders', 'Autism Spectrum', 'OCD'
      ]
    }]
  },

  education: [{
    degree: {
      type: String,
      required: true,
      enum: ['MBBS', 'MD', 'DO', 'PhD', 'PsyD', 'MSc', 'MA', 'MS', 'Other']
    },
    institution: { type: String, required: true, trim: true },
    graduationYear: {
      type: Number,
      required: true,
      min: 1950,
      max: new Date().getFullYear()
    },
    country: { type: String, required: true, trim: true },
    gpa: { type: Number, min: 0, max: 4.0 }
  }],

  platformSettings: {
    isActive: { type: Boolean, default: true },
    accountStatus: {
      type: String,
      enum: ['pending', 'verified', 'suspended', 'inactive'],
      default: 'pending'
    },
    joinDate: { type: Date, default: Date.now },
    lastLogin: Date,
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    profileCompletionPercentage: { type: Number, default: 0, min: 0, max: 100 }
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ FIXED: Remove duplicate index definitions and keep only the ones you need
// Don't create these indexes since unique: true already creates them:
// doctorSchema.index({ 'contactInfo.email': 1 }); // ❌ REMOVE - duplicate
// doctorSchema.index({ 'professionalInfo.medicalLicenseNumber': 1 }); // ❌ REMOVE - duplicate

// ✅ Keep only the indexes that aren't created automatically:
doctorSchema.index({ 'specializations.primarySpecialization': 1 });
doctorSchema.index({ 'platformSettings.accountStatus': 1 });
// Remove this if you don't have a ratings field:
// doctorSchema.index({ 'ratings.averageRating': -1 }); // ❌ REMOVE if no ratings field

// Virtual for full name
doctorSchema.virtual('fullName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Hash password before saving
doctorSchema.pre('save', async function(next) {
  if (!this.isModified('personalInfo.password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.personalInfo.password = await bcrypt.hash(this.personalInfo.password, salt);
  next();
});

// Compare password method
doctorSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.personalInfo.password);
};

// Generate JWT token method
doctorSchema.methods.generateJWT = function() {
  return jwt.sign(
    { id: this._id, email: this.contactInfo.email },
    process.env.JWT_SECRET || 'defaultsecret',
    { expiresIn: '7d' }
  );
};

// Remove the empty pre-save hook
// doctorSchema.pre('save', function(next) {
//   next();
// });

const Doctormodel = mongoose.model("Doctormodel", doctorSchema);

export default Doctormodel;
