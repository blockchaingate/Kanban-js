"use strict";
// Dependency:
var fs = require("fs");
var path = require("path");
var cwd = __dirname;
var nooocl = require("nooocl");
var CLHost = nooocl.CLHost;
var CLContext = nooocl.CLContext;
var CLBuffer = nooocl.CLBuffer;
var CLCommandQueue = nooocl.CLCommandQueue;
var NDRange = nooocl.NDRange;
var CLError = nooocl.CLError;
var fastcall = require("fastcall");
var ref = fastcall.ref;
var uint = ref.types.uint;
var Bluebird = require("bluebird");
var async = Bluebird.coroutine;

var testSha256 = async(function*() {
  // Initialize OpenCL then we get host, device, context, and a queue
  var host = CLHost.createV11();
  var defs = host.cl.defs;

  var platforms = host.getPlatforms();
  var device;
  function searchForDevice(hardware) {
    platforms.forEach(function (p) {
      var devices = hardware === "gpu" ? p.gpuDevices() : p.cpuDevices();
      devices = devices.filter(function (d) {
          // Is double precision supported?
          // See: https://www.khronos.org/registry/cl/sdk/1.1/docs/man/xhtml/clGetDeviceInfo.html
          return d.doubleFpConfig &
              (defs.CL_FP_FMA | defs.CL_FP_ROUND_TO_NEAREST | defs.CL_FP_ROUND_TO_ZERO | defs.CL_FP_ROUND_TO_INF | defs.CL_FP_INF_NAN | defs.CL_FP_DENORM);
      });
      if (devices.length) {
          device = devices[0];
      }
      if (device) {
          return false;
      }
    });
  }
  searchForDevice("gpu");
  if (!device) {
    console.warn("No GPU device has been found, searching for a CPU fallback.");
    searchForDevice("cpu");
  }
  if (!device) {
    throw new Error("No capable OpenCL 1.1 device has been found.");
  } else {
    console.log("Running on device: " + device.name + " - " + device.platform.name);
  }

  console.log("Got to before context. ");
  var context = new CLContext(device);
  console.log("Got to after context. ");
  var queue = new CLCommandQueue(context, device);
  console.log("Got to after command queue. ");
  // Initialize data on the host side:
  
  var message = "abc";
  var inputMessageStats = new Buffer(uint.size * 3);
  var inputSha256 = new Buffer(message.length);
  var outputSha256reversed = new Buffer(32);
  console.log("Got to before buffers");
  var clInputMessageStats = new CLBuffer(context, defs.CL_MEM_READ_ONLY, uint.size * 3);
  var clInputSha256 = new CLBuffer(context, defs.CL_MEM_READ_ONLY, message.length);
  var clOutputSha256 = new CLBuffer(context, defs.CL_MEM_WRITE_ONLY, 32);
  console.log("After buffers ...");
    // Initialize vectors on host
  inputSha256.write(message);
  uint.set(inputMessageStats, 0, 0);
  uint.set(inputMessageStats, uint.size, 0);
  uint.set(inputMessageStats, uint.size * 2, message.length);
  // Copy memory buffers
  // Notice: the is no synchronous operations in NOOOCL,
  // so there is no blocking_write parameter there.
  // All writes and reads are asynchronous.
  //console.log(inputMessageStats.toString());
  queue.enqueueWriteBuffer(clInputMessageStats, 0, 3 * uint.size, inputMessageStats);
  queue.enqueueWriteBuffer(clInputSha256, 0, message.length, inputSha256);
  queue.enqueueWriteBuffer(clOutputSha256, 0, 32, outputSha256reversed);

  // It's time to build the program.
  var kernelSourceCode = fs.readFileSync(path.join(cwd, "sha256.cl"), { encoding: "utf8" });
  var program = context.createProgram(kernelSourceCode);
  console.log("Building sha256.cl...");
  // Building is always asynchronous in NOOOCL!
  yield program.build("-cl-fast-relaxed-math");
  var buildStatus = program.getBuildStatus(device);
  var buildLog = program.getBuildLog(device);
  console.log("Build log: " + buildLog);
  if (buildStatus < 0) {
    throw new CLError(buildStatus, "Build failed.");
  }
  console.log("Build completed."); 
  // Kernel stuff:
  var kernel = program.createKernel("sha256GPU"); // <- name of kernel must be the same as name of function in the .cl file.
  kernel.setArg(0, clInputMessageStats);
  kernel.setArg(1, clInputSha256);
  kernel.setArg(2, clOutputSha256);
  // Notice: in NOOOCL you have specify type of value arguments,
  // because there is no C compatible type system exists in JavaScript.
  // Ranges:
  // Number of work items in each local work group
  var localSize = new NDRange(64);
  // Number of total work items - localSize must be divisor
  var globalSize = new NDRange(Math.ceil(message.length / 64) * 64);
  console.log("Launching the kernel.");
  // Enqueue the kernel asynchronously
  queue.enqueueNDRangeKernel(kernel, globalSize, localSize);

  // Then copy back the result from the device to the host asynchronously,
  // when the queue ends.
  // We should query a waitable queue which returns an event for each enqueue operations,
  // and the event's promise can be used for continuation of the control flow on the host side.
  console.log("Waiting for result.");
  yield queue.waitable().enqueueReadBuffer(clOutputSha256, 0, 32, outputSha256reversed).promise;
  var outputSha256final = new Buffer(32);
  for (var i = 0; i < 8; i ++){
    for (var j = 0; j < 4; j++){
      outputSha256final[i*4+j] = outputSha256reversed[i*4 + 3 - j];
    }
  }
  console.log("Final sha256: " + outputSha256final.toString('hex'));
});

nooocl.scope(testSha256);
console.log("(Everything after this point is asynchronous.)");