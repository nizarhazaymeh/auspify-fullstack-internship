import mongoose from 'mongoose';

export const COURSES = [
  'Computer Science',
  'Software Engineering',
  'Information Technology',
  'Data Science',
  'Cyber Security',
  'Computer Engineering',
];
export const GENDERS = ['Male', 'Female'];

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    firstName: { type: String, required: [true, 'First name is required'], trim: true, maxlength: 50 },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true, maxlength: 50 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Email is invalid'],
    },
    phone: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: GENDERS },
    course: { type: String, required: [true, 'Course is required'], enum: COURSES },
    year: { type: Number, required: [true, 'Year is required'], min: 1, max: 5 },
    gpa: { type: Number, min: 0, max: 4, default: null },
    address: { type: String, trim: true, maxlength: 200, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

studentSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

export default mongoose.model('Student', studentSchema);
