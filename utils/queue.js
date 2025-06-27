import Queue from 'bull/lib/queue';

const fileQueue = new Queue('fileQueue');

export default fileQueue;
