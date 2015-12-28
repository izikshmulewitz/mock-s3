var File = require("./file");
var MPU = require("./mpu");
var utils = require("./utils");
var createError = utils.createError;

function Bucket (ops) {
  this._data = utils.copy(ops);
  this._files = {};
}
module.exports = Bucket;

Bucket.prototype.getFile = function (ops) {
  return this._files[ops.Key];
};

Bucket.prototype.toJSON = function () {
  return utils.copy(this._data);
};

Bucket.prototype.createMultipartUpload = function (ops) {
  var mpu = this._files[ops.Key] = new MPU(ops);
  return mpu.toJSON();
};

Bucket.prototype.uploadPart = function (ops) {
  var file = this.getFile(ops);
  return file.uploadPart(ops);
};

Bucket.prototype.completeMultipartUpload = function (ops) {
  var file = this.getFile(ops);
  return file.complete(ops);
};

Bucket.prototype.getObject = function (ops) {
  return this.getFile(ops).toJSON(true);
};

Bucket.prototype.putObject = function (ops) {
  var file = this._files[ops.Key] = new File(ops);
  return file.toJSON();
};

Bucket.prototype.listObjects = function (ops) {
  var jsonFiles = {};
  var theFiles = this._files;
  Object.keys(theFiles).forEach(function (key) {
    if (key.startsWith(ops.Prefix)) {
      var jsonized = theFiles[key].toJSON();
      jsonFiles[jsonized.Key] = jsonized;
      // add all folders as keys only.
      var splitedPath = key.split('/');
      for (var i = 0 ; i < splitedPath.length - 1; i++) {
        var subArray = splitedPath.slice(0, i+1);
        var folderKey = subArray.join('/') + '/';
        jsonFiles[folderKey] = {Key : folderKey}
      }
    }
  });
  var finalValuesArray = Object.keys(jsonFiles).map(function (key) {
    return jsonFiles[key];
  });
  return {Contents: finalValuesArray, IsTruncated: false};
};

Bucket.prototype.deleteObjects = function (ops) {
  var deleted = [];
  var errors = [];
  var bucket = this;
  ops.Delete.Objects.forEach(function (obj) {
    if (!bucket.getFile(obj)) {
      errors.push({ Key: obj.Key, Message: obj.Key + " not found in bucket." });
    } else {
      bucket.deleteObject(obj);
      deleted.push({ Key: obj.Key });
    }
  });

  if (errors.length) {
    return createError(new Error("There were errors in deleting some objects."), {
      Deleted: deleted,
      Errors: errors
    });
  }
  return { Deleted: deleted };
};

Bucket.prototype.deleteObject = function (ops) {
  delete this._files[ops.Key];
  return {};
};
