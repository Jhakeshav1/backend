// models/Campus.js
const CampusSchema = new mongoose.Schema({
  name: String, // "IIT Kharagpur"
  domainAllowList: [String], // ["iitkgp.ac.in"]
  location: {
    address: String,
    latitude: Number,
    longitude: Number
  },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('Campus', CampusSchema);
