
const Listing = require("../models/listing.js");


module.exports.showByCategory = async(req,res) => {
    const {cateoption} = req.params;
    const allListings  =await Listing.find({});
    
    // Increment views for each listing in the category and calculate display price
    for (let listing of allListings) {
        if (listing.category === cateoption) {
            listing.views = (listing.views || 0) + 1;
            await listing.save();
            
            // Calculate display price: actual_price + (actual_price * 0.001 * views)
            listing.displayPrice = listing.price + (listing.price * 0.001 * listing.views);
        }
    }
    
    res.render("category/category.ejs",{cateoption,allListings});
}