import sha1 from 'sha1';
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
}

export default UsersControllers;
