const mongoose = require("mongoose");
const Store = mongoose.model("Store");
const multer = require("multer");
const jimp = require("jimp");
const uuid = require("uuid");

//multer options
const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith("image/");
    //conditions
    if (isPhoto) next(null, true);
    else next({ message: "That file type isn't allowed" }, false);
  },
};

//homePage
exports.homePage = (req, res) => {
  res.render("index");
};

//addingstore
exports.addStore = (req, res) => {
  res.render("editStore", { title: "AddStore" });
};

//upload photo
exports.upload = multer(multerOptions).single("photo");

exports.resize = async (req, res, next) => {
  //check if a file is uploaded
  if (!req.file) {
    next();
    return;
  }
  const extension = req.file.mimetype.split("/")[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  //resizing
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  //keep going
  next();
};

//creating store
exports.createStore = async (req, res) => {
  const store = await new Store(req.body).save();
  req.flash(
    "success",
    `Successfully Created ${store.name}, Care to leave a review?`
  );
  res.redirect(`/store/${store.slug}`);
};

//finding stores
exports.getStore = async (req, res) => {
  // 1. Query the database for a list of all stores
  const stores = await Store.find();
  res.render("stores", { title: "Stores", stores });
};

//edittig store
exports.editStore = async (req, res) => {
  // 1. Find the store given the Id
  const store = await Store.findOne({ _id: req.params.id });
  // 2. Confirm that they are the owner
  // TODO
  // 3. Render out the edit the form so that user can update the store
  res.render("editStore", { title: `Edit ${store.name}`, store });
};

// updating store
exports.updateStore = async (req, res) => {
  // set the location data as point
  if (req.body.location) req.body.location.type = "Point";
  // find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return's new instead of old one
    runValidators: true,
  }).exec();
  req.flash(
    "success",
    `Successfully updated <strong>${store.name}</strong>. <a href ="/stores/${store.slug}">View Store -></a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
  // redirect and tell them it workedf
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug });
  if (!store) return next();
  res.render("store", { store, title: store.name });
};

// tag
exports.getStoreByTag = async (req, res) => {
  const tags = await Store.getTagsList();
  const tag = req.params.tag;
  res.render("tag", { tags, title: "Tags", tag });
};