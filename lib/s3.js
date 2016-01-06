var EventEmitter = require("events").EventEmitter;
var wrapper = require("./wrapper");
var Bucket = require("./bucket");
var File = require("./file");
var util = require("util");
var utils = require("./utils");
var _ = require("lodash");
var DELAY = 50;

/**
 * Mock AWS.S3
 */

var S3 = function () {
    this._buckets = {};
    this.DELAY = DELAY;
    this.UPLOAD_DELAY = DELAY;

    // For tests to be able to tell if they're testing
    // a mock S3 client or not
    this.IS_MOCK = true;
};
util.inherits(S3, EventEmitter);
exports.S3 = S3;

S3.prototype.createBucket = wrapper("createBucket", function (options) {
    var bucket = this._buckets[options.Bucket] = new Bucket(options);
    return bucket.toJSON();
});

S3.prototype.listBuckets = wrapper("listBuckets", function () {
    var buckets = this._buckets;
    //return function () {
        return {
            Buckets: Object.keys(this._buckets).map(function (b) {
                var bucket = buckets[b].toJSON();
                bucket.Name = bucket.Bucket;
                return bucket;
            }),
                IsTruncated: false

        //}
    };
});

S3.prototype.copyObject = wrapper("copyObject", function (options) {
    var buckets = this._buckets;
    var sourceBucket = options.CopySource.split('/')[0];
    var sourceKey = options.CopySource.split('/').slice(1).join('/');
    var sourceFile = buckets[sourceBucket]._files[sourceKey];
    var sourceFileJson = sourceFile.toJSON();
    var newFile = new File(sourceFile._data);
    newFile._data.Key = options.Key;
    buckets[options.Bucket]._files[options.Key] = newFile;
    return {
        CopyObjectResult: {
            ETag: sourceFileJson.ETag
        }
    };
});

S3.prototype.listObjects = wrapper("listObjects", function (params) {
    var res = this._buckets[params.Bucket].listObjects({Prefix: params.Prefix});
    return this._buckets[params.Bucket].listObjects({Prefix: params.Prefix});
});


S3.prototype.deleteObject = wrapper("deleteObject", function (options) {
    return this._buckets[options.Bucket].deleteObject(options);
});

S3.prototype.deleteObjects = wrapper("deleteObjects", function (options) {
    return this._buckets[options.Bucket].deleteObjects(options);
});

S3.prototype.getObject = wrapper("getObject", function (options, hasCallback) {
    return this._buckets[options.Bucket].getObject(options);
});

S3.prototype.putObject = wrapper("putObject", function (options) {
    return this._buckets[options.Bucket].putObject(options);
});

S3.prototype.createMultipartUpload = wrapper("createMultipartUpload", function (options) {
    return this._buckets[options.Bucket].createMultipartUpload(options);
});

S3.prototype.uploadPart = wrapper("uploadPart", function (options) {
    return this._buckets[options.Bucket].uploadPart(options);
});

S3.prototype.completeMultipartUpload = wrapper("completeMultipartUpload", function (options) {
    return this._buckets[options.Bucket].completeMultipartUpload(options);
});
