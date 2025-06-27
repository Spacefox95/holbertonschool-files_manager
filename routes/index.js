import express from 'express';
import AppController from '../controllers/AppController';

import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';
import UsersControllers from '../controllers/UsersController';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);

router.get('/users/me', UsersControllers.getMe);

router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);

router.post('/users', UsersControllers.postUsers);

router.post('/files', FilesController.postUpload);

router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);

export default router;
