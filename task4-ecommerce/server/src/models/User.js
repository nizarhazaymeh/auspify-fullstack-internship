import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, maxlength: 80 },
    phone: { type: String, trim: true, maxlength: 25 },
    street: { type: String, trim: true, maxlength: 120 },
    city: { type: String, trim: true, maxlength: 60 },
    postalCode: { type: String, trim: true, maxlength: 15 },
    country: { type: String, trim: true, maxlength: 60 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    address: { type: addressSchema, default: undefined },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.checkPassword = function checkPassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
