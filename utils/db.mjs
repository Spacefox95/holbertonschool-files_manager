import mongo from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const uri = `mongodb://${host}:${port}`;
    this._client = new mongo.MongoClient(uri);

    this._client
      .connect()
      .then(() => {
        this.db = this._client.db(database);
      })
      .catch((err) => console.error(err));
  }

  isAlive() {
    return this._client && this._client.isConnected();
  }

  nbUsers() {
    if (!this.isAlive()) return Promise.resolve(0);
    return this.db.collection('users').countDocuments();
  }

  nbFiles() {
    if (!this.isAlive()) return Promise.resolve(0);
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
