import express from 'express';
import AppController from '../controllers/AppController';

import AuthController from '../controllers/AuthController';
import UsersControllers from '../controllers/UsersController';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UsersControllers.getMe);

router.post('/users', UsersControllers.postUsers);

export default router;
