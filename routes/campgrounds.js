var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
var geocoder = require("geocoder");

function escapeRegex(text) {
     return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
 
router.get("/", function(req, res) {
    // Campground.find({}, function(err, allCampgrounds){
    //     if(err){
    //         console.log(err);
    //     } else {
    //         res.render("campgrounds/index", {campgrounds: allCampgrounds});
    //     }
    // });
    if(req.query.search && req.xhr) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all campgrounds from DB
        Campground.find({name: regex}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
                res.status(200).json(allCampgrounds);
            }
        });
    } else {
        // Get all campgrounds from DB
        Campground.find({}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
                if(req.xhr) {
                    res.json(allCampgrounds);
                } else {
                    res.render("campgrounds/index",{campgrounds: allCampgrounds, page: 'campgrounds'});
                }
            }
        });
    }
});
//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  var cost = req.body.cost;
  geocoder.geocode(req.body.location, function (err, data) {
    var lat = data.results[0].geometry.location.lat;
    var lng = data.results[0].geometry.location.lng;
    var location = data.results[0].formatted_address;
    var newCampground = {name: name, image: image, description: desc, cost: cost, author:author, location: location, lat: lat, lng: lng};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
  });
});
// new page for campgrounds
router.get("/new", middleware.isLoggedIn ,function(req, res) {
    res.render("campgrounds/new");
});
//show more info about a campground
router.get("/:id", function(req, res){
    Campground.findById(req.params.id).populate("comments").exec(
        function(err, foundCampground){
            if(err){
                console.log(err);
            } else {
                res.render("campgrounds/show", {campground: foundCampground});
            }
    });
});

// edit campground route
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground) {
        if(err){
            req.flash("error", "You dont have permission for this action!")
        } else {
            res.render("campgrounds/edit", {campground:foundCampground});
        }
    });
});

router.put("/:id", function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    var lat = data.results[0].geometry.location.lat;
    var lng = data.results[0].geometry.location.lng;
    var location = data.results[0].formatted_address;
    var newData = {name: req.body.name, image: req.body.image, description: req.body.description, price: req.body.price, location: location, lat: lat, lng: lng};
    Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});
// router.put("/:id", function(req, res){
//     Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
//         if(err){
//             res.redirect("/campgrounds");
//         } else {
//             req.flash("success","Successfully Updated!");
//             res.redirect("/campgrounds/" + req.param);
//         }
//     });
// });

// destroy

router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds");
        }
    });
});


module.exports = router;