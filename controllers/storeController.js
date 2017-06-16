const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto) {
            next(null, true);
        } else {
            next({ message: 'That file type isn\'t allowed!' }, false);
        }
    }
};

exports.homePage = (req, res) => {
    console.log(req.name);
    res.render('index');
};

exports.addStore = (req, res) => {
    res.render('editStore', { title: 'Add Store'});
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
    // check if there is no new file to resize
    if (!req.file) {
        next();
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    // resize the image
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    // and continue!
    next();
};

exports.createStore = async (req, res) => {
    req.body.author = req.user._id; // Set the author to the current user
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
    const page = req.params.page || 1;
    const limit = 6;
    const skip = (page * limit) - limit;
    // Query the database for a list of all stores
    const storesPromise = Store.find().skip(skip).limit(limit).sort({ created: 'desc' });
    const countPromise = Store.count();

    const [stores, count] = await Promise.all([storesPromise, countPromise]);
    const pages = Math.ceil(count / limit);

    if (!stores.length && skip) {
        req.flash('info', `Hey! You asked for page ${page}. But that doesn't exists. So I put on page ${pages}.`);
        res.redirect(`/stores/page/${pages}`);
        return;
    }

    res.render('stores', { title: 'Stores', stores, page, pages, count });
};

exports.getStoreBySlug = async (req, res, next) => {
    const store  = await Store.findOne({ slug: req.params.slug }).populate('author reviews');
    if (!store) return next();
    req.store = store;
    next();
};

exports.getStore = async (req, res) => {
    res.render('store', { title: req.store.name, store: req.store });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
      throw Error('You must own a store in order to edit it!');
  }
};

exports.editStore = async (req, res) => {
    const store = await Store.findOne({ _id: req.params.id});
    // Confirm they are the owner of the store
    confirmOwner(store, req.user);
    // Render out the edit form so the user can update the store
    res.render('editStore', { title: `Edit ${store.name}`, store});
};

exports.updateStore = async (req, res) => {
    // set the location data to be a point
    req.body.location.type = 'Point';
    const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true, // return the new store instead of the old one
        runValidators: true // force the validators to run on the update as well
    }).exec();
    req.flash('success', `Successfully updated ${store.name}. <a href="/stores/${store.slug}">View Store</a>`);
    res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoresByTag = async (req, res) => {
    const tag = req.params.tag;
    const tagsPromise = Store.getTagsList();
    const tagQuery = tag || { $exists: true };
    const storesPromise = Store.find({ tags: tagQuery });
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

    res.render('tags', { tags, title: 'Tags', activeTag: tag, stores });
};

exports.searchStores = async (req, res) => {
    const query = req.query.q;
    const stores = await Store
    .find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } }).limit(5);
    res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const query = {
    location: {
        $near: {
            $geometry: {
                type: 'Point',
                coordinates
            },
            $maxDistance: 10000 // 10km
        }
    }
  };
  const stores = await Store.find(query).select('slug name description location photo').limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

exports.heartStore = async (req, res) => {
    const hearts = req.user.hearts.map(obj => obj.toString());
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { [operator]: { hearts: req.params.id }},
        { new: true}
    );
    res.json(user);
};

exports.getHearts = async (req, res) => {
  const stores = await Store.find({ _id: { $in: req.user.hearts }});
  res.render('stores', { title: 'Hearted stores', stores });
};

exports.getTopStores = async (req, res) => {
    const stores = await Store.getTopStores();
    res.render('topStores', { stores, title: 'Top stores!' });
};