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

function initialize(){
  if (global.kanban.host !== undefined && global.kanban.host !== null){
    return;
  }
  global.kanban.host = CLHost.createV11();
  global.kanban.defs = global.kanban.host.cl.defs;
  global.kanban.platforms = global.kanban.host.getPlatforms();
  function searchForDevice(hardware) {
    global.kanban.platforms.forEach(function (p) {
      var devices = hardware === "gpu" ? p.gpuDevices() : p.cpuDevices();
      devices = devices.filter(function (d) {
        // Is double precision supported?
        // See: https://www.khronos.org/registry/cl/sdk/1.1/docs/man/xhtml/clGetDeviceInfo.html
        var defs = global.kanban.defs;
        return d.doubleFpConfig &
            (defs.CL_FP_FMA | defs.CL_FP_ROUND_TO_NEAREST | defs.CL_FP_ROUND_TO_ZERO | defs.CL_FP_ROUND_TO_INF | defs.CL_FP_INF_NAN | defs.CL_FP_DENORM);
      });
      if (devices.length) {
        global.kanban.device = devices[0];
      }
      if (global.kanban.device) {
        return false;
      }
    });
  }
  searchForDevice("gpu");
  if (!global.kanban.device) {
    console.warn("No GPU device has been found, searching for a CPU fallback.");
    searchForDevice("cpu");
  }
  if (!global.kanban.device) {
    throw new Error("No capable OpenCL 1.1 device has been found.");
  } else {
    console.log(`Running on device: ${global.kanban.device.name} - ${global.kanban.device.platform.name}`);
  }
  global.kanban.context = new CLContext(global.kanban.device);
  global.kanban.queue = new CLCommandQueue(global.kanban.context, global.kanban.device);
  // Initialize data on the host side:
  global.kanban.inputMessageStats = new Buffer(uint.size * 3);
  // It's time to build the program.
  global.kanban.kernelSourceCode = fs.readFileSync(path.join(__dirname, "sha256.cl"), { encoding: "utf8" });
  //console.log("Creating program ...");
  //console.log(`Source code: ${kernelSourceCode}`);
  global.kanban.program = global.kanban.context.createProgram(global.kanban.kernelSourceCode);
  //console.log("Building sha256.cl...");
  // Building is always asynchronous in NOOOCL!
  global.kanban.program.build("-cl-fast-relaxed-math");
  //console.log("Program built.");
  global.kanban.buildStatus = global.kanban.program.getBuildStatus(global.kanban.device);
  //console.log("Build status computed.");
  global.kanban.buildLog = global.kanban.program.getBuildLog(global.kanban.device);
  //console.log("Build log: " + buildLog);
  if (global.kanban.buildStatus < 0) {
    throw new CLError(global.kanban.buildStatus, "Build failed.");
  }
  //console.log("Build completed."); 
  // Kernel stuff:
}

function gpuSHA256 (message) {
  initialize();
  var kernel = global.kanban.program.createKernel("sha256GPU"); // <- name of kernel must be the same as name of function in the .cl file.

  if (typeof message !== "string"){
    throw (`Only string inputs allowed in sha256 function, instead I got: ${message}`);
  }
  var inputSha256 = new Buffer(message.length);
  var outputSha256 = new Buffer(32);
  var clInputMessageStats = new CLBuffer(global.kanban.context, global.kanban.defs.CL_MEM_READ_ONLY, uint.size * 3);
  var clInputSha256 = new CLBuffer(global.kanban.context, global.kanban.defs.CL_MEM_READ_ONLY, message.length);
  var clOutputSha256 = new CLBuffer(global.kanban.context, global.kanban.defs.CL_MEM_WRITE_ONLY, 32);
  inputSha256.write(message);
  uint.set(global.kanban.inputMessageStats, 0, 0);
  uint.set(global.kanban.inputMessageStats, uint.size, 0);
  uint.set(global.kanban.inputMessageStats, uint.size * 2, message.length);
  global.kanban.queue.enqueueWriteBuffer(clInputMessageStats, 0, 3 * uint.size, global.kanban.inputMessageStats);
  global.kanban.queue.enqueueWriteBuffer(clInputSha256, 0, message.length, inputSha256);
  global.kanban.queue.enqueueWriteBuffer(clOutputSha256, 0, 32, outputSha256);

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
  // console.log("Queueing the kernel.");
  // Enqueue the kernel asynchronously
  global.kanban.queue.enqueueNDRangeKernel(kernel, globalSize, localSize);

  // Then copy back the result from the device to the host asynchronously,
  // when the queue ends.
  // We should query a waitable queue which returns an event for each enqueue operations,
  // and the event's promise can be used for continuation of the control flow on the host side.
  //console.log("Waiting for result.");
  global.kanban.queue.waitable().enqueueReadBuffer(clOutputSha256, 0, 32, outputSha256).promise;
  return outputSha256;
}

module.exports = {
  gpuSHA256
}