import React, { useState } from 'react';
import {  doctorregister } from '../services/authService'; // Make sure this import matches your service
import { useNavigate } from 'react-router-dom';

const Docregis = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      password: '',
      nationality: ''
    },
    contactInfo: {
      email: '',
      phone: {
        primary: ''
      }
    },
    professionalInfo: {
      medicalLicenseNumber: '',
      licenseExpiryDate: ''
    },
    specializations: {
      primarySpecialization: '',
      secondarySpecializations: [],
      subspecialties: [],
      areasOfExpertise: [],
      mentalHealthFocus: []
    },
    education: [{
      degree: '',
      institution: '',
      graduationYear: '',
      country: '',
      gpa: ''
    }]
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const specializationOptions = [
    'Psychiatry', 'Psychology', 'Clinical Psychology', 'Counseling Psychology',
    'Addiction Medicine', 'Child Psychiatry', 'Geriatric Psychiatry',
    'Neuropsychology', 'Behavioral Therapy', 'Cognitive Behavioral Therapy',
    'Family Therapy', 'Group Therapy', 'Art Therapy', 'Music Therapy'
  ];

  const mentalHealthOptions = [
    'Depression', 'Anxiety', 'PTSD', 'Bipolar Disorder', 'ADHD',
    'Eating Disorders', 'Substance Abuse', 'Relationship Issues',
    'Grief Counseling', 'Stress Management', 'Sleep Disorders',
    'Personality Disorders', 'Autism Spectrum', 'OCD'
  ];

  const degreeOptions = ['MBBS', 'MD', 'DO', 'PhD', 'PsyD', 'MSc', 'MA', 'MS', 'Other'];

  const handleInputChange = (section, field, value, index = null) => {
    setFormData(prev => {
      if (section === 'education' && index !== null) {
        const newEducation = [...prev.education];
        newEducation[index] = { ...newEducation[index], [field]: value };
        return { ...prev, education: newEducation };
      }

      if (field.includes('.')) {
        const [subField, nestedField] = field.split('.');
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [subField]: {
              ...prev[section][subField],
              [nestedField]: value
            }
          }
        };
      }

      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };
    });

    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleArrayChange = (section, field, value, isChecked) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: isChecked 
          ? [...prev[section][field], value]
          : prev[section][field].filter(item => item !== value)
      }
    }));
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return 'Password must be at least 8 characters long';
    }
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!hasNumbers) {
      return 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character';
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {};

    // Personal Info Validation
    if (!formData.personalInfo.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.personalInfo.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.personalInfo.gender) {
      newErrors.gender = 'Gender is required';
    }

    // Password validation
    if (!formData.personalInfo.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordError = validatePassword(formData.personalInfo.password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }

    // Contact Info Validation
    if (!formData.contactInfo.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactInfo.email)) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (!formData.contactInfo.phone.primary) {
      newErrors.phone = 'Primary phone number is required';
    } else if (!/^[+]?[1-9]\d{1,14}$/.test(formData.contactInfo.phone.primary)) {
      newErrors.phone = 'Please provide a valid phone number';
    }

    // Professional Info Validation
    if (!formData.professionalInfo.medicalLicenseNumber.trim()) {
      newErrors.medicalLicense = 'Medical license number is required';
    }
    if (!formData.professionalInfo.licenseExpiryDate) {
      newErrors.licenseExpiry = 'License expiry date is required';
    } else if (new Date(formData.professionalInfo.licenseExpiryDate) <= new Date()) {
      newErrors.licenseExpiry = 'License expiry date must be in the future';
    }

    // Specialization Validation
    if (!formData.specializations.primarySpecialization) {
      newErrors.primarySpecialization = 'Primary specialization is required';
    }

    // Education Validation
    if (!formData.education[0].degree) {
      newErrors.degree = 'Degree is required';
    }
    if (!formData.education[0].institution.trim()) {
      newErrors.institution = 'Institution is required';
    }
    if (!formData.education[0].graduationYear) {
      newErrors.graduationYear = 'Graduation year is required';
    }
    if (!formData.education[0].country.trim()) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorElement = document.querySelector('.border-red-500');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Option 1: Using your authService (Recommended)
      const response = await doctorregister(formData);
      
      if (response.success) {
        alert('Registration successful! Please check your email for verification.');
        // Optionally navigate to a success page or login page
        navigate('/doclogin', { 
          state: { 
            message: 'Registration successful! Please login with your credentials.' 
          }
        });
      } else {
        throw new Error(response.message || 'Registration failed');
      }

    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle different types of errors
      if (error.response?.status === 400) {
        // Backend validation errors
        const backendErrors = error.response.data.errors || {};
        setErrors(backendErrors);
        alert(error.response.data.message || 'Validation failed. Please check the form.');
      } else if (error.response?.status === 409) {
        // Doctor already exists
        setErrors({ email: 'A doctor with this email already exists' });
        alert('A doctor with this email already exists. Please use a different email.');
      } else if (error.response?.status >= 500) {
        // Server error
        alert('Server error. Please try again later.');
      } else {
        // Network or other errors
        alert(error.message || 'Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Rest of your JSX remains the same...
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Doctor Registration
          </h1>
          <p className="text-blue-100">
            Join HealNest - Mental Healthcare Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Personal Information Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Personal Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.personalInfo.firstName}
                  onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.personalInfo.lastName}
                  onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.personalInfo.dateOfBirth}
                  onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  value={formData.personalInfo.gender}
                  onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.gender ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
              </div>

              {/* Password Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.personalInfo.password}
                    onChange={(e) => handleInputChange('personalInfo', 'password', e.target.value)}
                    className={`w-full px-3 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                <div className="mt-2 text-xs text-gray-600">
                  <p>Password must contain:</p>
                  <ul className="list-disc list-inside text-gray-500">
                    <li>At least 8 characters</li>
                    <li>At least one uppercase letter</li>
                    <li>At least one lowercase letter</li>
                    <li>At least one number</li>
                    <li>At least one special character (!@#$%^&*)</li>
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nationality
                </label>
                <input
                  type="text"
                  value={formData.personalInfo.nationality}
                  onChange={(e) => handleInputChange('personalInfo', 'nationality', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter nationality"
                />
              </div>
            </div>
          </div>

          {/* Rest of your form sections (Contact Info, Professional Info, etc.) remain the same */}
          {/* Contact Information Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Contact Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) => handleInputChange('contactInfo', 'email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.contactInfo.phone.primary}
                  onChange={(e) => handleInputChange('contactInfo', 'phone.primary', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Professional Information Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Professional Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical License Number *
                </label>
                <input
                  type="text"
                  value={formData.professionalInfo.medicalLicenseNumber}
                  onChange={(e) => handleInputChange('professionalInfo', 'medicalLicenseNumber', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.medicalLicense ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter medical license number"
                />
                {errors.medicalLicense && <p className="text-red-500 text-sm mt-1">{errors.medicalLicense}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Expiry Date *
                </label>
                <input
                  type="date"
                  value={formData.professionalInfo.licenseExpiryDate}
                  onChange={(e) => handleInputChange('professionalInfo', 'licenseExpiryDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.licenseExpiry ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.licenseExpiry && <p className="text-red-500 text-sm mt-1">{errors.licenseExpiry}</p>}
              </div>
            </div>
          </div>

          {/* Specializations Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Specializations & Focus Areas
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Specialization *
                </label>
                <select
                  value={formData.specializations.primarySpecialization}
                  onChange={(e) => handleInputChange('specializations', 'primarySpecialization', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.primarySpecialization ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Primary Specialization</option>
                  {specializationOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {errors.primarySpecialization && <p className="text-red-500 text-sm mt-1">{errors.primarySpecialization}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Mental Health Focus Areas (Select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {mentalHealthOptions.map(option => (
                    <label key={option} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={formData.specializations.mentalHealthFocus.includes(option)}
                        onChange={(e) => handleArrayChange('specializations', 'mentalHealthFocus', option, e.target.checked)}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Education Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Education Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Degree *
                </label>
                <select
                  value={formData.education[0].degree}
                  onChange={(e) => handleInputChange('education', 'degree', e.target.value, 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.degree ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Degree</option>
                  {degreeOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {errors.degree && <p className="text-red-500 text-sm mt-1">{errors.degree}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution *
                </label>
                <input
                  type="text"
                  value={formData.education[0].institution}
                  onChange={(e) => handleInputChange('education', 'institution', e.target.value, 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.institution ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter institution name"
                />
                {errors.institution && <p className="text-red-500 text-sm mt-1">{errors.institution}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Graduation Year *
                </label>
                <input
                  type="number"
                  value={formData.education[0].graduationYear}
                  onChange={(e) => handleInputChange('education', 'graduationYear', parseInt(e.target.value) || '', 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.graduationYear ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter graduation year"
                  min="1950"
                  max={new Date().getFullYear()}
                />
                {errors.graduationYear && <p className="text-red-500 text-sm mt-1">{errors.graduationYear}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  value={formData.education[0].country}
                  onChange={(e) => handleInputChange('education', 'country', e.target.value, 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.country ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter country"
                />
                {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GPA (Optional)
                </label>
                <input
                  type="number"
                  value={formData.education[0].gpa}
                  onChange={(e) => handleInputChange('education', 'gpa', parseFloat(e.target.value) || '', 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter GPA (0.0 - 4.0)"
                  min="0"
                  max="4"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 rounded-lg font-medium text-white transition-colors duration-200 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </div>
              ) : (
                'Register as Doctor'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Docregis;
