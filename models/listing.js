const mongoose = require('mongoose');
const { Schema } = mongoose;
const Review = require("./review.js")

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    image: {
        url:String,
        filename:String

    },
    price: {
        type: Number,
        default: 0
    },
    location: {
        type: String
    },
    country: {
        type: String
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: "Review"
    },],
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    geoCoordinate:{
        type: {
            type: String, // Don't do `{ location: { type: String } }`
            enum: ['Point'], // 'location.type' must be 'Point'
            required: true
          },
          coordinates: {
            type: [Number],
            required: true
          }
    },
    category:{
        type:String,
        enum:['Mountain','Treehouse','Desert','Island','BeachFront','Hill Station','Others']
    },
    views: {
        type: Number,
        default: 0
    }

});

listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } })
    }
}); 

const Listing = mongoose.model('Listing', listingSchema);


module.exports = Listing;