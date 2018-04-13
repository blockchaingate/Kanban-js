"use strict";
const colors = require('colors');
const nooocl = require('nooocl'); 
var CLHost = nooocl.CLHost;
var CLPlatform = nooocl.CLPlatform;
var CLDevice = nooocl.CLDevice;
var CLContext = nooocl.CLContext;
var CLBuffer = nooocl.CLBuffer;
var CLCommandQueue = nooocl.CLCommandQueue;
var CLUserEvent = nooocl.CLUserEvent;
var NDRange = nooocl.NDRange;
var CLProgram = nooocl.CLProgram;
var CLKernel = nooocl.CLKernel;
var CLImage2D = nooocl.CLImage2D;
var CLImage3D = nooocl.CLImage3D;
var CLSampler = nooocl.CLSampler;

var host = new CLHost(1.1);
var allPlatforms = host.getPlatforms();
var currentPlatform = allPlatforms[0];
 
var gpus = currentPlatform.gpuDevices()[0];
//var testVecAdd = require("./opencl/test_vector_addition");
var testSha256 = require("./opencl/test_sha256");

function testGPU(){
  var info = {
    name: currentPlatform.name,
    vendor: currentPlatform.vendor,
    clVersion: currentPlatform.clVersion,
    profile: currentPlatform.profile,
    extensions: currentPlatform.extensions
  };

}


module.exports = {
  testGPU
}