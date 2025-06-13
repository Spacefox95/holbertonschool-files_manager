import express from 'express';
import AppController from '../controllers/AppController';
import UsersControllers from '../controllers/UsersController';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersControllers.postUsers);

export default router;
