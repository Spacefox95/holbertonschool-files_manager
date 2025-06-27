import { ObjectId } from 'mongodb';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import mime from 'mime-types';

import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const userObjectId = new ObjectId(userId);

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body || {};

    if (!name) return res.status(400).json({ error: 'Missing name' });

    if (!type || !['folder', 'file', 'image'].includes(type)) return res.status(400).json({ error: 'Missing type' });

    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

    let parentObjectId = 0;
    if (parentId !== 0 && parentId !== '0') {
      try {
        parentObjectId = new ObjectId(parentId);
      } catch (err) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      const parentFile = await dbClient.db
        .collection('files')
        .findOne({ _id: parentObjectId });
      if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
      if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const fileDocument = {
      userId: userObjectId,
      name,
      type,
      isPublic,
      parentId: parentObjectId || 0,
    };

    if (type === 'folder') {
      const insertResult = await dbClient.db
        .collection('files')
        .insertOne(fileDocument);
      return res.status(201).json({
        id: insertResult.insertedId,
        ...fileDocument,
      });
    }

    if (!fs.existsSync(FOLDER_PATH)) fs.mkdirSync(FOLDER_PATH, { recursive: true });

    const filename = uuidv4();
    const localPath = path.join(FOLDER_PATH, filename);

    const decodedData = Buffer.from(data, 'base64');
    fs.writeFileSync(localPath, decodedData);

    fileDocument.localPath = localPath;

    const insertResult = await dbClient.db
      .collection('files')
      .insertOne(fileDocument);

    return res.status(201).json({
      id: insertResult.insertedId,
      ...fileDocument,
      localPath: undefined,
    });
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let fileId;
    try {
      fileId = new ObjectId(req.params.id);
    } catch (err) {
      return res.status(404).json({ error: 'Not found' });
    }

    const file = await dbClient.db
      .collection('files')
      .findOne({ _id: fileId, userId: new ObjectId(userId) });

    if (!file) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let parentIdQuery;

    if (req.query.parentId === undefined) {
      parentIdQuery = '0';
    } else {
      parentIdQuery = req.query.parentId;
    }

    let filterParentId;
    if (parentIdQuery === '0') {
      filterParentId = '0';
    } else {
      filterParentId = new ObjectId(parentIdQuery);
    }

    let page;

    if (!req.query.page) {
      page = 0;
    } else {
      page = parseInt(req.query.page, 10);

      if (Number.isNaN(page) || page < 0) {
        page = 0;
      }
    }

    const files = await dbClient.db
      .collection('files')
      .find({
        userId: new ObjectId(userId),
        parentId: filterParentId,
      })
      .skip(page * 20)
      .limit(20)
      .toArray();

    const result = [];

    for (const file of files) {
      let resPid;

      if (file.parentId === '0') {
        resPid = '0';
      } else {
        resPid = file.parentId.toString();
      }

      result.push({
        id: file._id.toString(),
        userId: file.userId.toString(),
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: resPid,
      });
    }

    return res.status(200).json(result);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let fileId;
    try {
      fileId = new ObjectId(req.params.id);
    } catch (err) {
      return res.status(404).json({ error: 'Not found' });
    }

    const file = await dbClient.db
      .collection('files')
      .findOne({ _id: fileId, userId: new ObjectId(userId) });

    if (!file) return res.status(404).json({ error: 'Not found' });

    await dbClient.db
      .collection('files')
      .updateOne({ _id: fileId }, { $set: { isPublic: true } });

    return res.status(200).json({
      id: file._id.toString(),
      userId: file.userId.toString(),
      name: file.name,
      type: file.type,
      isPublic: true,
      parentId: file.parentId === 0 ? '0' : file.parentId.toString(),
    });
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let fileId;
    try {
      fileId = new ObjectId(req.params.id);
    } catch (err) {
      return res.status(404).json({ error: 'Not found' });
    }

    const file = await dbClient.db
      .collection('files')
      .findOne({ _id: fileId, userId: new ObjectId(userId) });

    if (!file) return res.status(404).json({ error: 'Not found' });

    await dbClient.db
      .collection('files')
      .updateOne({ _id: fileId }, { $set: { isPublic: false } });

    return res.status(200).json({
      id: file._id.toString(),
      userId: file.userId.toString(),
      name: file.name,
      type: file.type,
      isPublic: false,
      parentId: file.parentId === 0 ? '0' : file.parentId.toString(),
    });
  }

  static async getFile(req, res) {
    const fileId = req.params.id;
    let fileObjectId;
    try {
      fileObjectId = new ObjectId(fileId);
    } catch (err) {
      return res.status(404).json({ error: 'Not found' });
    }

    const file = await dbClient.db.collection('files').findOne({
      _id: fileObjectId,
    });

    if (!file) return res.status(404).json({ error: 'Not found' });

    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const isOwner = userId && file.userId.toString() === userId;
    if (!file.isPublic && !isOwner) return res.status(400).json({ error: 'Not found' });
    if (file.type === 'folder') return res.status(400).json({ error: "A folder doesn't have content" });
    if (!file.localPath || fs.existsSync(file.localPath)) return res.status(400).json({ error: 'Not found' });

    const mimeType = mime.lookup(file.name) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    fs.createReadStream(file.localPath).pipe(res);
    return null;
  }
}

export default FilesController;
