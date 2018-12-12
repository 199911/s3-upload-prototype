const Promise = require("bluebird");
// Load the AWS SDK for Node.js
const AWS = require("aws-sdk");
// Work arround on bluebird promisify issue with AWS
// http://goo.gl/MqrFmX\u000a
AWS.config.setPromisesDependency(Promise);
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
      const start = i * partSize;
      const end = Math.min((i + 1) * partSize - 1, fileSize - 1);
      const fileStream = fs.createReadStream(
        filePath,
        // Start and end is inclusive
        { start, end }
      );
      const tag = `[Part ${i+1}]`;
      fileStream.on("error", err => {
        console.log(`${tag} Create Read Stream Error`);
        throw err;
      });
      partStreams.push(fileStream);
    }

    // Write file chunks to disk
    // const promises = partStreams.map((stream, index) => {
    //   const writeStream = fs.createWriteStream(`part-${index}`, { encoding: 'binary' });
    //   stream.pipe(writeStream);
    //   return new Promise((resolve, reject) => {
    //     stream.on('end', () => resolve());
    //     stream.on('error', reject);
    //   })
    // })
    // await Promise.all(promises);

    // Create multipart upload
    const multipart = await s3.createMultipartUpload({Key: fileName}).promise();
    console.log("Got upload ID", multipart.UploadId);

    // Upload parts
    const promises = partStreams.map(async (stream, index) => {
      // PartNumber is 1 base, [1, 10000]
      const partNumber = index + 1;
      // As stream start and end is inclusive, end - start is off by one
      const streamLength = stream.end - stream.start + 1;
      const params = {
        Key: fileName,
        PartNumber: `${partNumber}`,
        UploadId: multipart.UploadId,
        Body: stream,
        // When using stream, if ContentLength not specified,
        // will receive RequestTimeout
        // https://github.com/aws/aws-sdk-js/issues/281
        ContentLength: streamLength,
      };
      console.log(`Uploading part #${partNumber}, ${streamLength} bytes`);
      const data = await s3.uploadPart(params).promise();
      console.log(`Part #${partNumber}: `, JSON.stringify(data, null, 2));
      return {
        ...data,
        PartNumber: partNumber,
      };
    })
    const parts = await Promise.all(promises);

    console.log(parts);


    // Complete multipart upload
    const data = await s3.completeMultipartUpload({
      Key: fileName,
      MultipartUpload: {
        // Parts is in format of [{ETag,PartNumber}, ..]
        Parts: parts,
      },
      UploadId: multipart.UploadId,
    }).promise();
    console.log('Final upload data:', JSON.stringify(data, null, 2));

    return data;
  }
  return uploadAsync;
}

module.exports = uploadAsyncFactory;
