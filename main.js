import redisClient from './utils/redis';

(async () => {
  console.log(redisClient.isAlive());
  console.log(await redisClient.get('myKey'));
  await redisClient.set('myKey', 12, 5);
  console.log(await redisClient.get('myKey'));
  console.log(await redisClient.get('myCheckerKey'));
  await redisClient.set('setCheckerKey', 89, 3);
  console.log(await redisClient.get('setCheckerKey'));

  setTimeout(async () => {
    console.log(await redisClient.get('myKey'));
  }, 1000 * 10);
})();
