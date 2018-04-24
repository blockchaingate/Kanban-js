#include "gpu.h"
#include "logging.h"
#include <fstream>
#include <iostream>
#include <assert.h>
#include <chrono>
#include <iomanip>

#define MAX_SOURCE_SIZE (0x100000)

Logger logGPU("../logfiles/logGPU.txt");


std::string OpenCLFunctions::getDeviceInfo(cl_device_id deviceId, cl_device_info informationRequested)
{
  size_t outputBufferSize = 0;
  const size_t infoSize = 10000;
  char buffer[infoSize];
  clGetDeviceInfo(deviceId, informationRequested, infoSize, buffer, &outputBufferSize);
  std::string result;
  if (outputBufferSize > 0)
    result = std::string(buffer, outputBufferSize - 1);
  return result;
}

std::string OpenCLFunctions::getDriverVersion(cl_device_id deviceId)
{
  return getDeviceInfo(deviceId, CL_DRIVER_VERSION);
}

bool OpenCLFunctions::getIsLittleEndian(cl_device_id deviceId)
{
  std::string returnValue = getDeviceInfo(deviceId, CL_DEVICE_ENDIAN_LITTLE);
  bool result = (returnValue[0] == CL_TRUE);
  return result;
}

long long OpenCLFunctions::getGlobalMemorySize(cl_device_id deviceId)
{
  const size_t infoSize = sizeof(cl_ulong);
  char buffer[infoSize];
  for (unsigned i = 0; i < infoSize; i ++)
    buffer[i] = 0;
  size_t outputBufferSize = 0;
  clGetDeviceInfo(deviceId, CL_DEVICE_GLOBAL_MEM_SIZE, infoSize, buffer, &outputBufferSize);
  long long result = 0;
  for (unsigned i = 8; i != 0; i --)
  {
    result *= 256;
    result += (int)( (unsigned char) buffer[i - 1]);
  }
  return result;
}

std::string OpenCLFunctions::getDeviceName(cl_device_id deviceId)
{
  return (std::string) getDeviceInfo(deviceId, CL_DEVICE_NAME);
}

SharedMemory::SharedMemory()
{
  this->name = "";
  this->flagIsHOSTWritable = true;
  this->theMemory = 0;
  this->typE = this->typeVoidPointer;
  this->uintValue = 0;
}

void SharedMemory::ReleaseMe()
{
  clReleaseMemObject(this->theMemory);
  this->theMemory = 0;
  this->name = "";
}

SharedMemory::~SharedMemory()
{
  this->ReleaseMe();
}

GPUKernel::GPUKernel()
{ this->local_item_size = 32;
  this->global_item_size = 32;
}

GPUKernel::~GPUKernel()
{
  this->kernel = 0;
  this->program = 0;
  for (unsigned i = 0; i < this->inputs.size(); i ++)
    this->inputs[i]->ReleaseMe();
  for (unsigned i = 0; i < this->outputs.size(); i ++)
    this->outputs[i]->ReleaseMe();
  cl_int ret;
  (void) ret;
  ret = clReleaseProgram(this->program);
  ret = clReleaseKernel(this->kernel);
}

GPU::GPU()
{
  this->flagVerbose = false;
}

void GPU::initialize()
{
  this->context = 0;
  cl_int ret = 0;
  ret = clGetPlatformIDs(2, this->platformIds, &this->numberOfPlatforms);
  if (ret != CL_SUCCESS)
  { logGPU << "Failed to get platforms.\n";
    throw (std::string) "Failed to get platforms";
    std::exit(- 1);
    assert(false);
  }
  if (this->flagVerbose)
  {
    logGPU << "Number of platforms: " << this->numberOfPlatforms << "\n";
  }
  cl_device_type desiredDeviceType = CL_DEVICE_TYPE_GPU;
  std::string deviceDescription = desiredDeviceType == CL_DEVICE_TYPE_CPU ? "CPU" : "GPU";
  for (unsigned i = 0; i < this->numberOfPlatforms; i ++)
  { ret = clGetDeviceIDs(this->platformIds[i], desiredDeviceType, 2, this->allDevices, &this->numberOfDevices);
    if (ret == CL_SUCCESS)
      break;
  }
  if (ret != CL_SUCCESS)
  { logGPU << "Failed to get device of type: " << deviceDescription << "\n";
    throw (std::string) "Failed to get device. ";
    std::exit(- 1);
    assert(false);
  }
  if (this->flagVerbose)
  {
    logGPU << "Number of devices of type: " << deviceDescription << ": " << this->numberOfDevices << "\n";
  }
  this->currentDeviceId = this->allDevices[0];
  if (this->flagVerbose)
  {
    logGPU << "Device name: " << OpenCLFunctions::getDeviceName(this->currentDeviceId) << "\n";
    logGPU << "Driver version: " << OpenCLFunctions::getDriverVersion(this->currentDeviceId) << "\n";
    logGPU << "Is little endian: " << OpenCLFunctions::getIsLittleEndian(this->currentDeviceId) << "\n";
    logGPU << "Memory: " << OpenCLFunctions::getGlobalMemorySize(this->currentDeviceId) << "\n";
  }
  // Create an OpenCL context
  this->context = clCreateContext(NULL, 1, &this->currentDeviceId, NULL, NULL, &ret);
  if (ret != CL_SUCCESS)
  {
    std::cerr << "Failed to create context.\n";
    std::cerr.flush();
    throw (std::string) "Failed to create context. ";
    std::exit(- 1);
    assert(false);
  }
  this->commandQueue = clCreateCommandQueue(this->context, this->currentDeviceId,
                                            CL_QUEUE_OUT_OF_ORDER_EXEC_MODE_ENABLE,
                                            &ret);
  if (ret != CL_SUCCESS)
  {
    logGPU << "Failed to create command queue.\n";
    throw (std::string) "Failed to create command queue. ";
    std::exit(-1);
    assert(false);
  }
}

void GPU::initializeKernels()
{ this->initialize();
  this->createKernel(
        this->kernelSHA256,
        {"offset", "length", "messageIndex", "message"},
        {SharedMemory::typeUint, SharedMemory::typeUint, SharedMemory::typeUint, SharedMemory::typeVoidPointer},
        {"result"},
        {SharedMemory::typeVoidPointer});
}

void GPU::createKernel(
     const std::string& fileNameNoExtension,
     const std::vector<std::string>& inputs,
     const std::vector<int>& inputTypes,
     const std::vector<std::string>& outputs,
     const std::vector<int>& outputTypes)
{
  std::shared_ptr<GPUKernel> incomingKernel = std::make_shared<GPUKernel>();
  incomingKernel->constructFromFileName(fileNameNoExtension, inputs, inputTypes, outputs, outputTypes, *this);
  this->theKernels[fileNameNoExtension] = incomingKernel;
}

GPU::~GPU()
{
  cl_int ret = 0;
  (void) ret;
  ret = clFlush(this->commandQueue);
  ret = clFinish(this->commandQueue);
  ret = clReleaseCommandQueue(this->commandQueue);
  this->commandQueue = NULL;
  ret = clReleaseContext(this->context);
  this->context = 0;
}

std::string GPU::kernelSHA256 = "sha256GPU";

void GPUKernel::constructFromFileName(
    const std::string& fileNameNoExtension,
    const std::vector<std::string>& inputNames,
    const std::vector<int>& inputTypes,
    const std::vector<std::string>& outputNames,
    const std::vector<int>& outputTypes,
    GPU& ownerGPU)
{
  this->owner = &ownerGPU;
  this->name = fileNameNoExtension;
  std::string fileName = "../opencl/cl/" + fileNameNoExtension + ".cl";
  std::ifstream theFile(fileName);
  if (!theFile.is_open())
  {
    logGPU << "Failed to open " << fileName << "\n";
    assert (false);
  }
  std::string source_str((std::istreambuf_iterator<char>(theFile)),
                          std::istreambuf_iterator<char>());
  if (this->owner->flagVerbose)
  {
    logGPU << "Program file name: " << fileName << "\n";
  }
  //std::cout << "File read: \n" << source_str << std::endl;
  size_t sourceSize = source_str.size();
  const char* sourceCString = source_str.c_str();
  cl_int ret;
  this->program = clCreateProgramWithSource(
    this->owner->context, 1,
    (const char **)& sourceCString,
    (const size_t *)& sourceSize, &ret);
  if (ret != CL_SUCCESS)
  {
    std::cerr << "Failed to create program from source. " << std::endl;
    std::cerr.flush();
    std::exit(-1);
    assert(false);
  }
  // Build the program
  //std::cout << "DEBUG: About to build program. " << std::endl;
  ret = clBuildProgram(this->program, 1, &this->owner->currentDeviceId, NULL, NULL, NULL);
  if (ret != CL_SUCCESS)
  {
    std::cerr << "Failed to build the program. Return code: " << ret << std::endl;
    char buffer[100000];
    size_t logSize;
    clGetProgramBuildInfo(this->program, this->owner->currentDeviceId, CL_PROGRAM_BUILD_LOG, 10000, &buffer, &logSize);
    std::string theLog(buffer, logSize);
    std::cerr << theLog;
    std::cerr.flush();
    std::exit(-1);
    assert(false);
  }
  //std::cout << "DEBUG: Program built, creating kernel. " << std::endl;
  // Create the OpenCL kernel
  this->kernel = clCreateKernel(this->program, this->name.c_str(), &ret);
  if (ret != CL_SUCCESS)
  {
    std::cerr << "Failed to allocate kernel. Return code: " << ret << std::endl;
    std::cerr << "Please note we \e[31mrequire the __kernel function name be the same\e[39m as the no-extension filename: \e[31m"
              << this->name << "\e[39m." << std::endl;
    std::cerr.flush();
    std::exit(-1);
    assert(false);
  }
  //std::cout << "DEBUG: Kernel created, setting buffers. " << std::endl;
  this->constructArguments(inputNames, inputTypes, true);
  this->constructArguments(outputNames, outputTypes, false);
  this->SetArguments();
}

void GPUKernel::constructArguments(
    const std::vector<std::string>& argumentNames,
    const std::vector<int> &argumentTypes,
    bool isInput)
{
  std::vector<std::shared_ptr<SharedMemory> >& theArgs = isInput ? this->inputs : this->outputs;
  cl_int ret = CL_SUCCESS;
  cl_mem_flags bufferFlag = isInput ? CL_MEM_READ_ONLY: CL_MEM_WRITE_ONLY;
  if (theArgs.size() != 0)
  {
    std::cerr << "Fatal error: arguments not empty. " << std::endl;
    std::cerr.flush();
    std::exit(-1);
    assert(false);
  }
  for (unsigned i = 0; i < argumentNames.size(); i ++)
  {
    theArgs.push_back(std::make_shared<SharedMemory>());
    std::shared_ptr<SharedMemory> current = theArgs[theArgs.size() - 1];
    current->name = argumentNames[i];
    current->flagIsHOSTWritable = true;
    current->typE = argumentTypes[i];
    size_t defaultBufferSize = 10000000;
    current->theMemory = clCreateBuffer(this->owner->context, bufferFlag, defaultBufferSize, NULL, &ret);
    if (ret != CL_SUCCESS)
    {
      std::cerr << "Failed to create buffer \e[31m" << current->name  << "\e[39m. Return code: " << ret << std::endl;
      std::cerr.flush();
      std::exit(-1);
      assert(false);
    }
  }

}

void GPUKernel::SetArguments()
{
  this->SetArguments(this->inputs, 0);
  this->SetArguments(this->outputs, this->inputs.size());
}

void GPUKernel::SetArguments(std::vector<std::shared_ptr<SharedMemory> >& theArgs, unsigned offset)
{
  cl_int ret = CL_SUCCESS;
  //std::cout << "DEBUG: kernel: setting " << theArgs.size() << " arguments. "<< std::endl;
  for (unsigned i = 0; i < theArgs.size(); i ++)
  {
    std::shared_ptr<SharedMemory> current = theArgs[i];
    if (current->typE == SharedMemory::typeVoidPointer)
      ret = clSetKernelArg(this->kernel, i + offset, sizeof(cl_mem), (void *)& current->theMemory);
    if (current->typE == SharedMemory::typeUint)
      ret = clSetKernelArg(this->kernel, i + offset, sizeof(uint), &current->uintValue);

    if (ret != CL_SUCCESS)
    {
      std::cerr << "Failed to set argument " << current->name << ". Return code: " << ret << ".\n";
      std::cerr.flush();
      std::exit(-1);
      assert(false);
    }
  }
}

void GPUKernel::writeToBuffer(unsigned argumentNumber, const std::string& input)
{
  return this->writeToBuffer(argumentNumber, input.c_str(), input.size());
}

void GPUKernel::writeToBuffer(unsigned argumentNumber, const void *input, size_t size)
{
  //std::cout << "DEBUG: writing " << input;
  //std::cout << " in buffeR: " << &bufferToWriteInto << std::endl;
  cl_mem& bufferToWriteInto =
      argumentNumber < this->inputs.size() ?
        this->inputs[argumentNumber]->theMemory :
        this->outputs[argumentNumber - this->inputs.size()]->theMemory;
  if (clEnqueueWriteBuffer(
        this->owner->commandQueue,
        bufferToWriteInto,
        CL_TRUE,
        0,
        size,
        input,
        0,
        NULL,
        NULL) != CL_SUCCESS)
  { std::cerr << "Enqueueing write buffer failed with input: " << input << std::endl;
    std::cerr.flush();
    std::exit(-1);
    assert(false);
  }
}

void GPUKernel::writeArgument(unsigned argumentNumber, uint input)
{
  //std::cout << "DEBUG: writing " << input;
  //std::cout << "Setting: argument number: " << argumentNumber << ", input: " << input << std::endl;
  std::shared_ptr<SharedMemory>& currentArgument =
      argumentNumber < this->inputs.size() ?
        this->inputs[argumentNumber] :
        this->outputs[argumentNumber - this->inputs.size()];
  currentArgument->uintValue = input;
  cl_int ret = clSetKernelArg(this->kernel, argumentNumber, sizeof(uint), &currentArgument->uintValue);
  if (ret != CL_SUCCESS)
  {
    std::cerr << "Set kernel arg failed. " << std::endl;
    std::cerr.flush();
    std::exit(-1);
    assert(false);
  }
}

std::vector<std::vector<std::string> > testSHA256::knownSHA256s;
std::string testSHA256::inputBuffer;
unsigned char testSHA256::outputBuffer[10000000];
std::vector<uint> testSHA256::messageStarts;
std::vector<uint> testSHA256::messageLengths;
unsigned testSHA256::totalToCompute = 100000;

void testSHA256::initialize()
{
  testSHA256::knownSHA256s.push_back((std::vector<std::string>)
  {
    "abc",
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  });
  testSHA256::knownSHA256s.push_back((std::vector<std::string>)
  {
    "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
    "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"
  });
  testSHA256::knownSHA256s.push_back((std::vector<std::string>)
  {
   "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu",
   "cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1"
  });
  testSHA256::inputBuffer.reserve(100 * testSHA256::totalToCompute);
  for (unsigned i = 0; i < testSHA256::totalToCompute; i ++)
  { unsigned testCounter = i % testSHA256::knownSHA256s.size();
    std::string& currentMessage = testSHA256::knownSHA256s[testCounter][0];
    testSHA256::messageStarts.push_back(testSHA256::inputBuffer.size());
    testSHA256::messageLengths.push_back(currentMessage.size());
    testSHA256::inputBuffer.append(currentMessage);
    for (unsigned j = 0; j < 32; j ++)
      testSHA256::outputBuffer[i * 32 + j] = 0;
  }
}

int testGPU(void)
{
  // Create the two input vectors
  GPU theGPU;
  theGPU.initializeKernels();
  // Create a command queue
  std::shared_ptr<GPUKernel> theKernel = theGPU.theKernels[GPU::kernelSHA256];
  std::cout << "DEBUG: about to write to buffer. " << std::endl;
  testSHA256::initialize();

  auto timeStart = std::chrono::system_clock::now();
  uint largeTestCounter;
  theKernel->writeToBuffer(3, testSHA256::inputBuffer);

  for (largeTestCounter = 0; largeTestCounter < testSHA256::totalToCompute; largeTestCounter ++)
  {
    theKernel->writeArgument(0, testSHA256::messageStarts[largeTestCounter]);
    theKernel->writeArgument(1, testSHA256::messageLengths[largeTestCounter]);
    theKernel->writeArgument(2, largeTestCounter);
    //theKernel->writeToBuffer(0, &theLength, sizeof(uint));
    //std::cout << "DEBUG: Setting arguments ... " << std::endl;
    //std::cout << "DEBUG: arguments set, enqueueing kernel... " << std::endl;
    cl_int ret = clEnqueueNDRangeKernel(theGPU.commandQueue, theKernel->kernel, 1, NULL,
            &theKernel->global_item_size, &theKernel->local_item_size, 0, NULL, NULL);
    if (ret != CL_SUCCESS)
    {
      std::cerr << "Failed to enqueue kernel. Return code: " << ret << ". " << std::endl;
      std::exit(- 1);
      assert(false);
    }
    //std::cout << "DEBUG: kernel enqueued, proceeding to read buffer. " << std::endl;
    if (largeTestCounter % 500 == 0)
    {
      auto timeCurrent = std::chrono::system_clock::now();
      std::chrono::duration<double> elapsed_seconds = timeCurrent - timeStart;
      std::cout << "Computed " << largeTestCounter << " sha256s in " << elapsed_seconds.count() << " second(s). " << std::endl;
    }
  }
  cl_mem& result = theKernel->outputs[0]->theMemory;
  cl_int ret = clEnqueueReadBuffer(
        theGPU.commandQueue, result, CL_TRUE, 0,
        32 * testSHA256::totalToCompute, testSHA256::outputBuffer, 0, NULL, NULL);
  if (ret != CL_SUCCESS)
  {
    std::cerr << "Failed to enqueue read buffer. Return code: " << ret << ". " << std::endl;
    std::exit(- 1);
    assert(false);
  }
  auto timeCurrent = std::chrono::system_clock::now();
  std::chrono::duration<double> elapsed_seconds = timeCurrent - timeStart;
  std::cout << "Computed " << largeTestCounter << " sha256s in " << elapsed_seconds.count() << " second(s). " << std::endl;
  std::cout << "Speed: " << (testSHA256::totalToCompute / elapsed_seconds.count()) << " hashes per second. " << std::endl;


  std::cout << "Checking computations ..." << std::endl;
  for (largeTestCounter = 0; largeTestCounter < testSHA256::totalToCompute; largeTestCounter ++)
  {
    unsigned testCounteR = largeTestCounter % testSHA256::knownSHA256s.size();
    std::stringstream out;
    unsigned offset = largeTestCounter * 32;
    for (unsigned i = offset; i < offset + 32; i ++)
      out << std::hex << std::setw(2) << std::setfill('0') << ((int) ((unsigned) testSHA256::outputBuffer[i]));
    if (out.str() != testSHA256::knownSHA256s[testCounteR][1])
    {
      std::cerr << "\e[31mSha of message index " << largeTestCounter
                << ": " << testSHA256::knownSHA256s[testCounteR][0] << " is wrongly computed to be: " << out.str()
                << " instead of: " << testSHA256::knownSHA256s[testCounteR][1] << "\e[39m" << std::endl;
      std::exit(-1);
      assert(false);
    }
  }
  std::cout << "\e[32mSuccess!\e[39m" << std::endl;
  return 0;
}
