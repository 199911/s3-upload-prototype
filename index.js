require('dotenv').config();

const { BUCKET_REGION, BUCKET_NAME, FILE_PATH } = process.env;

const uploadAsync = require('./uploadAsync.js')({
  region: BUCKET_REGION,
  bucket: BUCKET_NAME,
});

const main = async () => {
  try {
    const res = await uploadAsync('video.mp4', FILE_PATH, 8 * 1024 * 1024, 2);
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}
main();
