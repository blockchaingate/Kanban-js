#include "gpu.h"
#include "logging.h"
#include <fstream>
#include <iostream>
#include <iomanip>
#include <assert.h>
#define MAX_SOURCE_SIZE (0x100000)

Logger logGPU("../logfiles/logGPU.txt", "[GPU] ");


std::string OpenCLFunctions::getDeviceInfo(cl_device_id deviceId, cl_device_info informationRequested) {
  size_t outputBufferSize = 0;
  const size_t infoSize = 10000;
  char buffer[infoSize];
  clGetDeviceInfo(deviceId, informationRequested, infoSize, buffer, &outputBufferSize);
  std::string result;
  if (outputBufferSize > 0)
    result = std::string(buffer, outputBufferSize - 1);
  return result;
}

std::string OpenCLFunctions::getDriverVersion(cl_device_id deviceId) {
  return getDeviceInfo(deviceId, CL_DRIVER_VERSION);
}

bool OpenCLFunctions::getIsLittleEndian(cl_device_id deviceId) {
  std::string returnValue = getDeviceInfo(deviceId, CL_DEVICE_ENDIAN_LITTLE);
  bool result = (returnValue[0] == CL_TRUE);
  return result;
}

long long OpenCLFunctions::getGlobalMemorySize(cl_device_id deviceId) {
  const size_t infoSize = sizeof(cl_ulong);
  char buffer[infoSize];
  for (unsigned i = 0; i < infoSize; i ++)
    buffer[i] = 0;
  size_t outputBufferSize = 0;
  clGetDeviceInfo(deviceId, CL_DEVICE_GLOBAL_MEM_SIZE, infoSize, buffer, &outputBufferSize);
  long long result = 0;
  for (unsigned i = 8; i != 0; i --) {
    result *= 256;
    result += (int) ((unsigned char) buffer[i - 1]);
  }
  return result;
}

std::string OpenCLFunctions::getDeviceName(cl_device_id deviceId) {
  return (std::string) getDeviceInfo(deviceId, CL_DEVICE_NAME);
}

SharedMemory::SharedMemory() {
  this->name = "";
  this->theMemory = 0;
  this->typE = this->typeVoidPointer;
  this->uintValue = 0;
  this->memoryExternallyOwned = 0;
}

void SharedMemory::ReleaseMe() {
  clReleaseMemObject(this->theMemory);
  this->theMemory = 0;
  this->memoryExternallyOwned = 0;
  this->name = "";
}

SharedMemory::~SharedMemory() {
  this->ReleaseMe();
}

GPUKernel::GPUKernel() {
  this->local_item_size = 32;
  this->global_item_size = 32;
  this->numInitializedExternallyOwnedBuffers = 0;
  this->program = NULL;
  this->kernel = NULL;
  this->flagIsBuilt = false;
}

GPUKernel::~GPUKernel() {
  //logGPU << "Kernel " << this->name << " destruction started. " << Logger::endL;
  for (unsigned i = 0; i < this->inputs.size(); i ++)
    this->inputs[i]->ReleaseMe();
  for (unsigned i = 0; i < this->outputs.size(); i ++)
    this->outputs[i]->ReleaseMe();
  cl_int ret;
  bool isGood = true;
  ret = clReleaseProgram(this->program);
  if (ret != CL_SUCCESS) {
    logGPU << "Error with code: " << ret << " while releasing kernel " << this->name << ". " << Logger::endL;
    isGood = false;
  }
  this->program = NULL;
  ret = clReleaseKernel(this->kernel);
  if (ret != CL_SUCCESS) {
    logGPU << "Error with code: " << ret << " while releasing kernel " << this->name << ". " << Logger::endL;
    isGood = false;
  }
  this->kernel = NULL;
  if (isGood)
    logGPU << "Kernel " << this->name << " destroyed successfully. " << Logger::endL;
  else
    logGPU << "Encountered errors while destroying kernel " << this->name << ". " << Logger::endL;

}

GPU::GPU() {
  this->flagVerbose = false;
  this->flagInitializedPlatform = false;
  this->flagInitializedKernelsFull = false;
  this->flagInitializedKernelsNoBuild = false;
  this->flagTurnOffToDebugCPU = false;
  this->commandQueue = NULL;
  this->context = NULL;
  this->flagMultiplicationContextComputed = false;
  this->flagGeneratorContextComputed = false;
  this->flagMultiplicationContextComputationSTARTED = false;
  this->flagGeneratorContextComputationSTARTED = false;

  this->bufferMultiplicationContext = new unsigned char [GPU::memoryMultiplicationContext];
  this->bufferTestSuite1BasicOperations = new unsigned char [GPU::memoryMultiplicationContext];
  this->bufferGeneratorContext = new unsigned char [GPU::memoryGeneratorContext];
  this->bufferSignature = new unsigned char [GPU::memorySignature];
}

bool GPU::initializeAllFull() {
  if (! this->initializePlatform()) {
    return false;
  }
  if (! this->initializeKernelsFull())
    return false;
  return true;
}

bool GPU::initializeAllNoBuild() {
  if (!this->initializePlatform()) {
    return false;
  }
  if (!this->initializeKernelsNoBuild()) {
    return false;
  }
  return true;
}

bool GPU::initializePlatform() {
  if (this->flagInitializedPlatform)
    return true;
  //int debugWarningDisableCacheDuringDevelopmentOnly;
  setenv("CUDA_CACHE_DISABLE", "1", 1);
  this->context = 0;
  cl_int ret = 0;
  ret = clGetPlatformIDs(2, this->platformIds, &this->numberOfPlatforms);
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to get platforms." << Logger::endL;
    return false;
  }
  if (this->flagVerbose) {
    logGPU << "Number of platforms: " << this->numberOfPlatforms << "\n";
  }
  cl_device_type desiredDeviceType = CL_DEVICE_TYPE_GPU;
  std::string deviceDescription = desiredDeviceType == CL_DEVICE_TYPE_CPU ? "CPU" : "GPU";
  for (unsigned i = 0; i < this->numberOfPlatforms; i ++) {
    ret = clGetDeviceIDs(this->platformIds[i], desiredDeviceType, 2, this->allDevices, &this->numberOfDevices);
    if (ret == CL_SUCCESS)
      break;
  }
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to get device of type: " << deviceDescription << Logger::endL;
    return false;
  }
  if (this->flagVerbose) {
    logGPU << "Number of devices of type: " << deviceDescription << ": " << this->numberOfDevices << "\n";
  }
  this->currentDeviceId = this->allDevices[0];
  if (this->flagVerbose) {
    logGPU << "Device name: " << OpenCLFunctions::getDeviceName(this->currentDeviceId) << "\n";
    logGPU << "Driver version: " << OpenCLFunctions::getDriverVersion(this->currentDeviceId) << "\n";
    logGPU << "Is little endian: " << OpenCLFunctions::getIsLittleEndian(this->currentDeviceId) << "\n";
    logGPU << "Memory: " << OpenCLFunctions::getGlobalMemorySize(this->currentDeviceId) << "\n";
  }
  // Create an OpenCL context
  logGPU << "About to create GPU context ..." << Logger::endL;
  this->context = clCreateContext(NULL, 1, &this->currentDeviceId, NULL, NULL, &ret);
  logGPU << "Context created." << Logger::endL;
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to create context." << Logger::endL;
    return false;
  }
  logGPU << "About to create GPU queue ..." << Logger::endL;
  this->commandQueue = clCreateCommandQueue(
    this->context,
    this->currentDeviceId,
    CL_QUEUE_OUT_OF_ORDER_EXEC_MODE_ENABLE,
    &ret
  );
  logGPU << "GPU queue created." << Logger::endL;
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to create command queue." << Logger::endL;
    return false;
  }
  this->flagInitializedPlatform = true;
  return true;
}

bool GPU::initializeKernelsNoBuild() {
  if (this->flagInitializedKernelsNoBuild)
    return true;
  if (!this->initializePlatform())
    return false;

  if (!this->createKernelNoBuild(
    this->kernelSHA256,
    {"result"},
    {SharedMemory::typeVoidPointer},
    {"offsets", "lengths", "messageIndex", "message"},
    {SharedMemory::typeVoidPointer, SharedMemory::typeVoidPointer, SharedMemory::typeUint, SharedMemory::typeVoidPointer},
    {},
    {}
  )) {
    return false;
  }
  if (!this->createKernelNoBuild(
    this->kernelInitializeMultiplicationContext,
    {"outputMultiplicationContext"},
    {
      SharedMemory::typeVoidPointer,
    },
    {},
    {},
    {},
    {}
  )) {
    return false;
  }
  if (!this->createKernelNoBuild(
    this->kernelInitializeGeneratorContext,
    {"outputGeneratorContext"},
    {
      SharedMemory::typeVoidPointer,
    },
    {},
    {},
    {},
    {}
  )) {
    return false;
  }
  //openCL function arguments:
  //__global unsigned char *output,
  //__global unsigned char *outputMemoryPoolSignature,
  //__global const unsigned char *inputSignature,
  //unsigned int signatureSize,
  //__global const unsigned char *publicKey,
  //unsigned int publicKeySize,
  //__global const unsigned char *message,
  //__global const unsigned char *memoryPoolMultiplicationContext

  if (!this->createKernelNoBuild(
    this->kernelVerifySignature,
    {
      "output",
      "outputMemoryPoolSignature",
    },
    {
      SharedMemory::typeVoidPointer,
      SharedMemory::typeVoidPointer
    },
    {
      "inputSignature",
      "signatureSize",
      "publicKey",
      "publicKeySize",
      "message",
      "memoryPoolMultiplicationContext"
    },
    {
      SharedMemory::typeVoidPointer,
      SharedMemory::typeUint,
      SharedMemory::typeVoidPointer,
      SharedMemory::typeUint,
      SharedMemory::typeVoidPointer,
      SharedMemory::typeVoidPointerExternalOwnership
    },
    {
      "outputMultiplicationContext"
    },
    {
      this->kernelInitializeMultiplicationContext
    }
  )) {
    return false;
  }
  if (!this->createKernelNoBuild(
    this->kernelGeneratePublicKey,
    {
      "outputPublicKey",
      "outputPublicKeySize"
    },
    {
      SharedMemory::typeVoidPointer,
      SharedMemory::typeVoidPointer,
    },
    {
      "inputSecretKey",
      "inputMemoryPoolGeneratorContext"
    },
    {
      SharedMemory::typeVoidPointer,
      SharedMemory::typeVoidPointerExternalOwnership
    },
    {
      "outputGeneratorContext"
    },
    {
      this->kernelInitializeGeneratorContext
    }
  )) {
    return false;
  }
  if (!this->createKernelNoBuild(
    this->kernelSign,
    {
      "outputSignature",
      "outputSize",
      "outputInputNonce"
    },
    {
      SharedMemory::typeVoidPointer,
      SharedMemory::typeVoidPointer,
      SharedMemory::typeVoidPointer
    },
    {
      "inputSecretKey",
      "inputMessage",
      "inputMemoryPoolGeneratorContext",
      "inputMessageIndex"
    },
    {
      SharedMemory::typeVoidPointer,
      SharedMemory::typeVoidPointer,
      SharedMemory::typeVoidPointerExternalOwnership,
      SharedMemory::typeUint,
    },
    {
      "outputGeneratorContext"
    },
    {
      this->kernelInitializeGeneratorContext
    }
  )) {
    return false;
  }
  if (!this->createKernelNoBuild(
    this->kernelTestBuffer,
    {"buffer"},
    {SharedMemory::typeVoidPointer},
    {},
    {},
    {},
    {}
  )) {
    return false;
  }
  if (!this->createKernelNoBuild(
    this->kernelTestSuite1BasicOperations,
    {"outputMemoryPool"},
    {
      SharedMemory::typeVoidPointer,
    },
    {},
    {},
    {},
    {}
  )) {
    return false;
  }
  this->flagInitializedKernelsNoBuild = true;
  return true;
}

bool GPU::initializeKernelsFull() {
  if (this->flagInitializedKernelsFull) {
    return true;
  }
  if (!this->initializePlatform()) {
    return false;
  }
  if (!this->initializeKernelsNoBuild()) {
    return false;
  }
  for (
    std::unordered_map<std::string, std::shared_ptr<GPUKernel> >::iterator kernelIterator = this->theKernels.begin();
    kernelIterator != this->theKernels.end();
    ++kernelIterator
  ) {
    if (!kernelIterator->second.get()->build()) {
      return false;
    }
  }
  return true;
}

bool GPU::createKernelNoBuild(
  const std::string& fileNameNoExtension,
  const std::vector<std::string>& outputs,
  const std::vector<int>& outputTypes,
  const std::vector<std::string>& inputs,
  const std::vector<int>& inputTypes,
  const std::vector<std::string>& inputExternalBufferNames,
  const std::vector<std::string>& inputExternalBufferKernelOwners
) {
  std::shared_ptr<GPUKernel> incomingKernel = std::make_shared<GPUKernel>();
  if (inputs.size() != inputTypes.size() || outputs.size() != outputTypes.size()) {
    logGPU << "Error: while initializing: " << fileNameNoExtension << ", got "
    << " non-matching number of kernel arguments and kernel argument types, namely "
    << inputs.size() << " inputs, " << inputTypes.size() << " input types, "
    << outputs.size() << " outputs, " << outputTypes.size() << " output types. " << Logger::endL;
    assert(false);
  }
  if (!incomingKernel->constructFromFileNameNoBuild(
    fileNameNoExtension,
    outputs,
    outputTypes,
    inputs,
    inputTypes,
    inputExternalBufferNames,
    inputExternalBufferKernelOwners,
    *this
  )) {
    return false;
  }
  this->theKernels[fileNameNoExtension] = incomingKernel;
  return true;
}

GPU::~GPU() {
  cl_int ret = CL_SUCCESS;
  if (this->commandQueue != NULL){
    ret = clFlush(this->commandQueue);
    if (ret != CL_SUCCESS) {
      logGPU << "GPU destruction failure with error code: " << ret << ". " << Logger::endL;
    }
  }
  if (this->commandQueue != NULL) {
    ret = clFinish(this->commandQueue);
    if (ret != CL_SUCCESS) {
      logGPU << "GPU destruction failure with error code: " << ret << ". " << Logger::endL;
    }
  }
  if (this->commandQueue != NULL) {
    ret = clReleaseCommandQueue(this->commandQueue);
    if (ret != CL_SUCCESS) {
      logGPU << "GPU destruction failure with error code: " << ret << ". " << Logger::endL;
    }
  }
  this->commandQueue = NULL;
  if (this->context != NULL) {
    ret = clReleaseContext(this->context);
    if (ret!= CL_SUCCESS) {
      logGPU << "GPU destruction failure with error code: " << ret << ". " << Logger::endL;
    }
  }
  //logGPU << "GPU destruction: released context. " << Logger::endL;
  this->context = NULL;
  delete [] this->bufferMultiplicationContext;
  this->bufferMultiplicationContext = 0;
  delete [] this->bufferTestSuite1BasicOperations;
  this->bufferTestSuite1BasicOperations = 0;
  delete [] this->bufferGeneratorContext;
  this->bufferGeneratorContext = 0;
  delete [] this->bufferSignature;
  this->bufferSignature = 0;
  logGPU << "GPU destruction complete. " << Logger::endL;
}

std::string GPU::kernelSHA256 = "sha256GPU";
std::string GPU::kernelTestBuffer = "testBuffer";
std::string GPU::kernelInitializeMultiplicationContext = "secp256k1_opencl_compute_multiplication_context";
std::string GPU::kernelInitializeGeneratorContext = "secp256k1_opencl_compute_generator_context";
std::string GPU::kernelVerifySignature = "secp256k1_opencl_verify_signature";
std::string GPU::kernelTestSuite1BasicOperations = "test_suite_1_basic_operations";
std::string GPU::kernelSign = "secp256k1_opencl_sign";
std::string GPU::kernelGeneratePublicKey = "secp256k1_opencl_generate_public_key";

const int maxProgramBuildBufferSize = 10000000;
char programBuildBuffer[maxProgramBuildBufferSize];

bool GPUKernel::hasArgumentName(const std::string& desiredArgumentName) {
  for (int k = 0; k < 2; k ++) {
    std::vector<std::string>& argumentNames = k == 0 ? this->desiredOutputNames : this->desiredInputNames;
    for (unsigned j = 0; j < argumentNames.size(); j ++) {
      if (argumentNames[j] == desiredArgumentName) {
        return true;
      }
    }
  }
  return false;
}

cl_mem* GPUKernel::getClMemPointer(const std::string& bufferName) {
  if (this->outputs.size() != this->desiredOutputNames.size()) {
    logGPU << "Kernel " << this->name << " does not have its output cl_mem buffers initialized "
    << " in function getClMemPointer." << Logger::endL;
    assert(false);
  }
  for (unsigned j = 0; j < this->outputs.size(); j ++) {
    if (this->desiredOutputNames[j] == bufferName) {
      return &this->outputs[j]->theMemory;
    }
  }
  if (this->inputs.size() != this->desiredInputNames.size()) {
    logGPU << "Kernel " << this->name << " does not have its input cl_mem buffers initialized "
    << " in function getClMemPointer." << Logger::endL;
    assert(false);
  }
  for (unsigned j = 0; j < this->inputs.size(); j ++) {
    if (this->desiredInputNames[j] == bufferName) {
      return &this->inputs[j]->theMemory;
    }
  }
  logGPU << "Kernel " << this->name << " is asked to deliver cl_mem buffer named: "
  << bufferName << " but no such buffer name has been declared. " << Logger::endL;
  assert(false);
  return 0;
}


bool GPUKernel::constructFromFileNameNoBuild(
  const std::string& fileNameNoExtension,
  const std::vector<std::string>& outputNames,
  const std::vector<int>& outputTypes,
  const std::vector<std::string>& inputNames,
  const std::vector<int>& inputTypes,
  const std::vector<std::string>& inputExternalBufferNames,
  const std::vector<std::string>& inputExternalBufferKernelOwners,
  GPU& ownerGPU
) {
  this->owner = &ownerGPU;
  this->name = fileNameNoExtension;
  std::string fileName = "../opencl/cl/" + fileNameNoExtension + ".cl";

  this->desiredOutputNames = outputNames;
  this->desiredOutputTypes = outputTypes;
  this->desiredInputNames = inputNames;
  this->desiredInputTypes = inputTypes;
  this->desiredExternalBufferNames = inputExternalBufferNames;
  this->desiredExternalBufferKernelOwners = inputExternalBufferKernelOwners;
  if (inputExternalBufferNames.size() != inputExternalBufferKernelOwners.size()) {
    logGPU << "External kernels and buffer names arrays must have the same size. " << Logger::endL;
    assert(false);
  }
  for (unsigned i = 0; i < this->desiredExternalBufferNames.size(); i ++) {
    const std::string& currentBuffer = this->desiredExternalBufferNames[i];
    const std::string& otherKernelName = this->desiredExternalBufferKernelOwners[i];
    if (this->owner->theKernels.find(otherKernelName) == this->owner->theKernels.end()) {
      logGPU << "Kernel " << this->name << " depends on kernel " << otherKernelName
      << " which has not been initialized yet/does not exist. " << Logger::endL;
      assert(false);
    }
    GPUKernel& otherKernel = *this->owner->theKernels[otherKernelName].get();
    if (!otherKernel.hasArgumentName(currentBuffer)) {
      logGPU << "Kernel " << this->name << " depends on buffer "
      << currentBuffer << " from kernel " << otherKernelName
      << " but that kernel appears to not contain a buffer with that name. " << Logger::endL;
      assert(false);
    }
  }

  std::ifstream theFile(fileName);
  if (!theFile.is_open()) {
    logGPU << "Failed to open " << fileName << "\n";
    return false;
  }
  std::string source_str((std::istreambuf_iterator<char>(theFile)), std::istreambuf_iterator<char>());
  if (this->owner->flagVerbose) {
    logGPU << "Program file name: " << fileName << "\n";
  }
  logGPU << "Source file read: " << fileName << Logger::endL;
  size_t sourceSize = source_str.size();
  const char* sourceCString = source_str.c_str();
  cl_int ret;
  this->program = clCreateProgramWithSource(
    this->owner->context, 1,
    (const char **)& sourceCString,
    (const size_t *)& sourceSize, &ret
  );
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to create program from source. " << Logger::endL;
    return false;
  }
  //std::string programOptions = "-cl-opt-disable";

  //std::string programOptions = "-cl-std=CL2.0";
  return true;
}

bool GPUKernel::build() {
  if (this->flagIsBuilt){
    return true;
  }
  logGPU << "Building program: " << this->name << "..." << Logger::endL;
  cl_int ret;
  ret = clBuildProgram(
    this->program,
    1,
    &this->owner->currentDeviceId,
    NULL,
    //programOptions.c_str(),
    NULL,
    NULL
  );
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to build program: " << this->name << ". Return code: " << ret << Logger::endL;
    size_t logSize;
    ret = clGetProgramBuildInfo(
      this->program, this->owner->currentDeviceId,
      CL_PROGRAM_BUILD_LOG, maxProgramBuildBufferSize,
      &programBuildBuffer, &logSize
    );
    if (ret != CL_SUCCESS) {
      logGPU << "Failed to fetch the build info for program: " << this->name << ". Return code: " << ret << Logger::endL;
      return false;
    }
    if (logSize > 0)
      logSize --;
    std::string theLog(programBuildBuffer, logSize);
    logGPU << theLog;
    return false;
  }
  logGPU << "Program built." << Logger::endL;
  logGPU << "Creating openCL kernel..." << Logger::endL;
  this->kernel = clCreateKernel(this->program, this->name.c_str(), &ret);
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to allocate kernel: " << this->name << ". Return code: " << ret << Logger::endL;
    logGPU << "Please note we \e[31mrequire the __kernel function name be the same\e[39m as the no-extension filename: \e[31m"
           << this->name << "\e[39m." << Logger::endL;
    return false;
  }
  logGPU << "Kernel: " << this->name << " created, allocating buffers..." << Logger::endL;
  this->buffersExternallyOwned.clear();
  for (unsigned i = 0; i < this->desiredExternalBufferNames.size(); i ++) {
    const std::string& otherKernelName = this->desiredExternalBufferKernelOwners[i];
    GPUKernel& other = *this->owner->theKernels[otherKernelName].get();
    this->buffersExternallyOwned.push_back(other.getClMemPointer(this->desiredExternalBufferNames[i]));
  }
  this->constructArguments(this->desiredOutputNames, this->desiredOutputTypes, true, true);
  this->constructArguments(this->desiredInputNames, this->desiredInputTypes, true, false);
  this->SetArguments();
  logGPU << "Kernel: " << this->name << " created successfully. " << Logger::endL;
  this->flagIsBuilt = true;
  return true;
}


bool GPUKernel::constructArguments(
  const std::vector<std::string>& argumentNames,
  const std::vector<int> &argumentTypes,
  bool isInput, bool isOutput
) {
  std::vector<std::shared_ptr<SharedMemory> >& theArgs = isOutput ? this->outputs : this->inputs;
  cl_int ret = CL_SUCCESS;
  cl_mem_flags bufferFlag = CL_MEM_READ_WRITE;
  if (isInput && isOutput) {
    bufferFlag = CL_MEM_READ_WRITE;
  }
  if (isInput && !isOutput) {
    bufferFlag = CL_MEM_READ_ONLY;
  }
  if (!isInput && isOutput ) {
    bufferFlag = CL_MEM_WRITE_ONLY;
  }
  if (!isInput && !isOutput) {
    logGPU << "GPU kernel arguments are neither input nor output" << Logger::endL;
    return false;
  }
  if (theArgs.size() != 0) {
    logGPU << "Fatal error: arguments not empty. " << Logger::endL;
    return false;
  }
  for (unsigned i = 0; i < argumentNames.size(); i ++) {
    theArgs.push_back(std::make_shared<SharedMemory>());
    std::shared_ptr<SharedMemory> current = theArgs[theArgs.size() - 1];
    current->name = argumentNames[i];
    current->typE = argumentTypes[i];
    size_t defaultBufferSize = 10000000;
    current->theMemory = clCreateBuffer(this->owner->context, bufferFlag, defaultBufferSize, NULL, &ret);
    current->buffer.reserve(defaultBufferSize);
    if (ret != CL_SUCCESS || current->theMemory == NULL) {
      logGPU << "Failed to create buffer \e[31m" << current->name << "\e[39m. Return code: " << ret << Logger::endL;
      return false;
    }
  }
  return true;
}

bool GPUKernel::SetArguments() {
  if (!this->SetArguments(this->outputs, 0))
    return false;
  if (!this->SetArguments(this->inputs, this->outputs.size()))
    return false;
  return true;
}

bool GPUKernel::SetArguments(std::vector<std::shared_ptr<SharedMemory> >& theArgs, unsigned offset) {
  cl_int ret = CL_SUCCESS;
  //std::cout << "DEBUG: kernel: setting " << theArgs.size() << " arguments. "<< std::endl;
  for (unsigned i = 0; i < theArgs.size(); i ++) {
    std::shared_ptr<SharedMemory> current = theArgs[i];
    if (current->typE == SharedMemory::typeVoidPointerExternalOwnership) {
      if (this->numInitializedExternallyOwnedBuffers >= this->buffersExternallyOwned.size()) {
        logGPU << "Argument " << current->name << " is set to have externally owned buffer but the index of next external buffer,"
        << this->numInitializedExternallyOwnedBuffers << ", is out of bounds: total: "
        << this->buffersExternallyOwned.size() << " external buffers. ";
        return false;
      }
      current->memoryExternallyOwned = this->buffersExternallyOwned[this->numInitializedExternallyOwnedBuffers];
      this->numInitializedExternallyOwnedBuffers ++;
      ret = clSetKernelArg(this->kernel, i + offset, sizeof(cl_mem), (void *) current->memoryExternallyOwned);
    }
    if (current->typE == SharedMemory::typeVoidPointer)
      ret = clSetKernelArg(this->kernel, i + offset, sizeof(cl_mem), (void *)& current->theMemory);
    if (current->typE == SharedMemory::typeUint)
      ret = clSetKernelArg(this->kernel, i + offset, sizeof(uint), &current->uintValue);

    if (ret != CL_SUCCESS) {
      logGPU << "Failed to set argument " << current->name << ". Return code: " << ret << "." << Logger::endL;
      return false;
    }
  }
  return true;
}

bool GPUKernel::writeToBuffer(unsigned argumentNumber, const std::vector<unsigned int>& input) {
  std::vector<unsigned char> converted;
  converted.resize(input.size() * 4);
  for (unsigned i = 0; i < input.size(); i ++) {
    memoryPool_write_uint(input[i], &converted[i * 4]);
  }
  return this->writeToBuffer(argumentNumber, converted);
}

bool GPUKernel::writeToBuffer(unsigned argumentNumber, const std::vector<unsigned char>& input) {
  return this->writeToBuffer(argumentNumber, &input[0], input.size());
}

bool GPUKernel::writeToBuffer(unsigned argumentNumber, const std::string& input) {
  return this->writeToBuffer(argumentNumber, input.c_str(), input.size());
}

bool GPUKernel::writeToBuffer(unsigned argumentNumber, const void *input, size_t size) {
  //std::cout << "DEBUG: writing " << input;
  //std::cout << " in buffeR: " << &bufferToWriteInto << std::endl;
  cl_mem& bufferToWriteInto =
    argumentNumber < this->outputs.size() ?
    this->outputs[argumentNumber]->theMemory :
    this->inputs[argumentNumber - this->outputs.size()]->theMemory;
  cl_int ret = clEnqueueWriteBuffer(
    this->owner->commandQueue,
    bufferToWriteInto,
    CL_TRUE,
    0,
    size,
    input,
    0,
    NULL,
    NULL
  );
  if (ret != CL_SUCCESS) {
    logGPU << "Enqueueing write buffer failed with input: " << input << Logger::endL;
    return false;
  }
  return true;
}

bool GPUKernel::writeArgument(unsigned argumentNumber, uint input) {
  //std::cout << "DEBUG: writing " << input;
  //std::cout << "Setting: argument number: " << argumentNumber << ", input: " << input << std::endl;
  std::shared_ptr<SharedMemory>& currentArgument =
    argumentNumber < this->outputs.size() ?
    this->outputs[argumentNumber] :
    this->inputs[argumentNumber - this->outputs.size()];
  currentArgument->uintValue = input;
  cl_int ret = clSetKernelArg(this->kernel, argumentNumber, sizeof(uint), &currentArgument->uintValue);
  if (ret != CL_SUCCESS) {
    logGPU << "Set kernel arg failed. " << Logger::endL;
    return false;
  }
  return true;
}
