// Load the AWS SDK for Node.js
const AWS = require("aws-sdk");
const fs = require("fs");

const uploadAsyncFactory = ({region, bucket}) => {
  const s3 = new AWS.S3({
    region,
    params: { Bucket: bucket }
  });
  const uploadAsync = async (fileName, filePath, partSize) => {
    const stats = fs.statSync(filePath);
    return stats;
  }
  return uploadAsync;
}

module.exports = uploadAsyncFactory;
