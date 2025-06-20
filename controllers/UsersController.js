import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class UsersControllers {
  static async postUsers(req, res) {
    const { email, password } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    try {
      const existUser = await dbClient.db
        .collection('users')
        .findOne({ email });
      if (existUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const result = await dbClient.db
        .collection('users')
        .insertOne({ email, password: sha1(password) });

      return res.status(201).json({ email, id: result.insertedId });
    } catch (err) {
      console.error('Error creating user', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient.db
      .collection('users')
      .findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    return res.status(200).json({ email: user.email, id: user._id });
  }
}

export default UsersControllers;
