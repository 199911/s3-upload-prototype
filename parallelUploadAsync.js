// Load the AWS SDK for Node.js
const AWS = require("aws-sdk");
const fs = require("fs");

const uploadAsyncFactory = ({region, bucket}) => {
  const s3 = new AWS.S3({
    region,
    params: { Bucket: bucket }
  });
  const uploadAsync = async (fileName, filePath, partSize) => {
    const { size: fileSize } = fs.statSync(filePath);
    const partNum = Math.ceil(fileSize / partSize);

    // Split a file into several file streams
    const partStreams = [];
    for (let i = 0; i < partNum; ++i) {
      const fileStream = fs.createReadStream(
        filePath,
        { start: i * partSize, end: partSize }
      );
      const tag = `[Part ${i+1}]`;
      fileStream.on("error", err => {
        console.log(`${tag} Create Read Stream Error`);
        throw err;
      });
      partStreams.push(fileStream);
    }
    return partStreams;
  }
  return uploadAsync;
}

module.exports = uploadAsyncFactory;
