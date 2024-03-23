// Users collection schema
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// schema for the BIO_DATA subdocument
const BioDataSchema = new Schema({
  fullName: String,
  email: String,
  userName: String,
  phoneNumber: String,
  address: String,
  DOB: Date,
  permanentAddress: String,
  password:String
});

//  schema for the PARCEL subdocument
const ParcelSchema = new Schema({
  parcelLocation: String,
  sender: String,
  receiver: String,
  trackingNumber: String,
  coordinates: {
    lat: Number,
    lon: Number,
  },
});

// schema for the User document
const UserSchema = new Schema({
  ID: { type: String, unique: true },
  bioData: BioDataSchema,
  parcels: [ParcelSchema],
});

// model for the User collection
const User = mongoose.model("User", UserSchema);

module.exports = User;

