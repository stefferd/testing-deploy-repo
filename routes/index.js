const express = require('express');
const router = express.Router();
const storeController = require('./../controllers/storeController');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const reviewController = require('./../controllers/reviewController');
const { catchErrors } = require('../handlers/errorHandlers');

router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/page/:page', catchErrors(storeController.getStores));
router.get('/add', authController.isLoggedIn, storeController.addStore);
router.post('/add',
    authController.isLoggedIn,
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.createStore)
);
router.post('/add/:id',
    authController.isLoggedIn,
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.updateStore)
);
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.get('/store/:slug',
    catchErrors(storeController.getStoreBySlug),
    catchErrors(storeController.getStore)
);

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/login', userController.loginForm);
router.post('/login', authController.login);
router.get('/register', userController.registerForm);
// 1. validate the user
// 2. register the user
// 3. login the user
router.post('/register',
    userController.validateRegister,
    userController.register,
    authController.login
);
router.get('/logout', authController.logout);
router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token',
    authController.confirmedPasswords,
    catchErrors(authController.update)
);
router.get('/map', storeController.mapPage);
router.get('/hearts', authController.isLoggedIn, catchErrors(storeController.getHearts));
router.post('/review/:id', authController.isLoggedIn, catchErrors(reviewController.addReview));

router.get('/top', catchErrors(storeController.getTopStores));
/*
    API endpoints
 */

router.get('/api/v1/search', catchErrors(storeController.searchStores));
router.get('/api/v1/stores/near', catchErrors(storeController.mapStores));
router.post('/api/v1/stores/:id/heart', catchErrors(storeController.heartStore));

module.exports = router;
