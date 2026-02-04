const Listing = require("../models/listing.js")
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN
const geocodingClient = mbxGeocoding({ accessToken: mapToken });




// Helper function to get current season based on date
function getCurrentSeason() {
    const now = new Date();
    const month = now.getMonth() + 1; // getMonth() returns 0-11, so add 1
    
    // Northern Hemisphere seasons
    if (month >= 3 && month <= 5) {
        return 'spring'; // March, April, May
    } else if (month >= 6 && month <= 8) {
        return 'summer'; // June, July, August
    } else if (month >= 9 && month <= 11) {
        return 'autumn'; // September, October, November
    } else {
        return 'winter'; // December, January, February
    }
}

// Helper function to get category priority based on season
function getCategoryPriority(category, season) {
    const seasonCategoryMap = {
        'spring': ['Mountain', 'Hill Station', 'BeachFront', 'Treehouse', 'Island', 'Desert', 'Others'],
        'summer': ['BeachFront', 'Island', 'Mountain', 'Hill Station', 'Treehouse', 'Desert', 'Others'],
        'autumn': ['Mountain', 'Hill Station', 'Treehouse', 'BeachFront', 'Island', 'Desert', 'Others'],
        'winter': ['Desert', 'BeachFront', 'Island', 'Mountain', 'Hill Station', 'Treehouse', 'Others']
    };
    
    const priorityList = seasonCategoryMap[season] || seasonCategoryMap['spring'];
    const index = priorityList.indexOf(category);
    return index !== -1 ? index : 999; // If category not found, put it last
}

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    
    // Get current date and determine season
    const currentSeason = getCurrentSeason();
    
    // Increment views for each listing and calculate display price
    for (let listing of allListings) {
        listing.views = (listing.views || 0) + 1;
        await listing.save();
        
        // Calculate display price: actual_price + (actual_price * 0.001 * views)
        listing.displayPrice = listing.price + (listing.price * 0.001 * listing.views);
    }
    
    // Sort listings by category priority based on current season
    allListings.sort((a, b) => {
        const priorityA = getCategoryPriority(a.category || 'Others', currentSeason);
        const priorityB = getCategoryPriority(b.category || 'Others', currentSeason);
        return priorityA - priorityB;
    });
    
    res.render("listings/index.ejs", { allListings });
}

module.exports.renderNewForm = (req, res) => {
    res.render('listings/new.ejs')
}

module.exports.addListing = async (req, res, next) => {
    console.log(req.body.listing);

    const { path, filename } = req.file;
    const newListing = new Listing(req.body.listing);

    const response = await geocodingClient.forwardGeocode({
        query: `${newListing.location},${newListing.country}`,
        limit: 1
    })
        .send()

    newListing.geoCoordinate = response.body.features[0].geometry;
    newListing.owner = req.user._id;
    newListing.image = { url: path, filename }
    const saved = await newListing.save();
    console.log(saved);
    req.flash('success', 'New listing added successfully !')
    res.redirect('/listings');
}

module.exports.showListing = async (req, res, next) => {
    const { id } = req.params;
    const details = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author" } }).populate("owner");
    if (!details) {
        req.flash('error', ' listing not found !')
        res.redirect("/listings");
        //  next(new ExpressError(404, 'Data not found'))
    }
    
    // Increment views for this listing
    details.views = (details.views || 0) + 1;
    await details.save();
    
    // Calculate display price: actual_price + (actual_price * 0.001 * views)
    details.displayPrice = details.price + (details.price * 0.001 * details.views);
    
    res.render("listings/show.ejs", { details });
}

module.exports.renderEditForm = async (req, res, next) => {
    const { id } = req.params;
    const details = await Listing.findById(id);
    if (!details) {
        req.flash('error', ' listing not found !')
    }
    let imageUrl = details.image.url;
    imageUrl = imageUrl.replace('/upload', '/upload/w_400,h_300'); //cloudinary will resize the image and then forward it

    res.render('listings/edit.ejs', { details, imageUrl })
}

module.exports.update = async (req, res, next) => {
    
    const details = { ...req.body.listing };
    const { id } = req.params;
    await Listing.findByIdAndUpdate(id, details);
    let listing = await Listing.findById(id);

    const response = await geocodingClient.forwardGeocode({
        query: `${listing.location},${listing.country}`,
        limit: 1
    })
        .send()
    listing.geoCoordinate = response.body.features[0].geometry;
    await listing.save();

    if (req.file) {
        const { path, filename } = req.file;
        listing.image = { url: path, filename }
        await listing.save();
    }


    req.flash('success', ' edited successfully !')
    res.redirect(`/listings/${id}`);
}

module.exports.delete = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    await Listing.findByIdAndDelete(id);
    req.flash('success', 'listing deleted successfully !')
    res.redirect("/listings")
}
