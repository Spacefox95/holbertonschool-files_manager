import Queue from 'bull/lib/queue';
import { ObjectId } from 'mongodb';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';

import dbClient from './utils/db';

const fileQueue = new Queue('fileQueue');
fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const file = await dbClient.db.collection('files').findOne({
    _id: new ObjectId(fileId),
    userId: new ObjectId(userId),
  });
  if (!file) throw new Error('File not found');
  if (!file.localPath || file.type !== 'image') throw new Error('Invalid image file');

  const sizes = [500, 250, 100];
  const thumbnailPromises = sizes.map(async (size) => {
    const thumbnail = await imageThumbnail(file.localPath, { width: size });
    fs.writeFileSync(`${file.localPath}_${size}`, thumbnail);
  });

  await Promise.all(thumbnailPromises);
});
