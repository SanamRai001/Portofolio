import mongoose from 'mongoose'

import { hashPassword, isBcryptHash } from '../utils/password.js'

const { Schema } = mongoose

const userSchema = new Schema({
  id: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    required: true,
  },
  is_active: {
    type: Boolean,
  },
}, { timestamps: true })

userSchema.pre('save', async function hashChangedPassword() {
  if (!this.isModified('password') || isBcryptHash(this.password)) {
    return
  }

  this.password = await hashPassword(this.password)
})

userSchema.set('toJSON', {
  transform: (_doc, value) => {
    delete value.password
    return value
  },
})

const User = mongoose.model('User', userSchema)

export default User
