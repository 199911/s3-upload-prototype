// Load the AWS SDK for Node.js
const AWS = require("aws-sdk");
const fs = require("fs");

const uploadAsyncFactory = ({region, bucket}) => {
  const s3 = new AWS.S3({
    region,
    params: { Bucket: bucket }
  });
  const uploadAsync = async (fileName, filePath, partSize, queueSize) => {
    const promise = new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath);
      fileStream.on("error", err => {
        console.log("Create Read Stream Error", err);
        reject(err);
      });

      const uploadParams = { Key: fileName, Body: fileStream };
      const options = {
        partSize,
        queueSize,
      };

      s3.upload(uploadParams, options, (err, data) => {
        if (err) {
          console.log("S3 Upload Error: ", err);
          return reject(err);
        }

        if (!data) {
          console.log("S3 Upload Error: Unknown Issue");
          return reject({
            error: "Unknown S3 issue, data not found"
          });
        }

        console.log("S3 Upload Success: ", data.Location);
        console.log(data);
        resolve({
          name: data.Key
        });
      });
    });
    return promise;
  }
  return uploadAsync;
}

module.exports = uploadAsyncFactory;
