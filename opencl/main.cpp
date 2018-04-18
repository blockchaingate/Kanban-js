#include <stdio.h>
#include <stdlib.h>
#include <fstream>
#include <sstream>
#include <iostream>
#include <unordered_map>
#include <assert.h>
#include <memory>
#include <iomanip>
#include <vector>
#include <chrono>
#include <ctime>

#define CL_USE_DEPRECATED_OPENCL_1_2_APIS
//<- use opencl 1.1 instead of older versions.
#ifdef __APPLE__
#include <OpenCL/opencl.h>
#else
#include <CL/cl.h>
#endif



#define MAX_SOURCE_SIZE (0x100000)

std::string getDeviceInfo(cl_device_id deviceId, cl_device_info informationRequested)
{ size_t outputBufferSize = 0;
  const size_t infoSize = 10000;
  char buffer[infoSize];
  clGetDeviceInfo(deviceId, informationRequested, infoSize, buffer, &outputBufferSize);
  return std::string(buffer, outputBufferSize);
}

std::string getDriverVersion(cl_device_id deviceId)
{ return getDeviceInfo(deviceId, CL_DRIVER_VERSION);
}

bool getIsLittleEndian(cl_device_id deviceId)
{ std::string returnValue = getDeviceInfo(deviceId, CL_DEVICE_ENDIAN_LITTLE);
  bool result = (returnValue[0] == CL_TRUE);
//  std::cout << "Result: " << result << "Return value: " << returnValue << " CL_False: " << CL_FALSE << " cl_true: " << CL_TRUE << std::endl;
  return result;
}

long long getGlobalMemorySize(cl_device_id deviceId)
{ const size_t infoSize = sizeof(cl_ulong);
  char buffer[infoSize];
  for (unsigned i = 0; i< infoSize; i++)
    buffer[i] = 0;
  size_t outputBufferSize = 0;
  clGetDeviceInfo(deviceId, CL_DEVICE_GLOBAL_MEM_SIZE, infoSize, buffer, &outputBufferSize);
  long long result = 0;
  for (unsigned i = 8; i != 0; i--)
  { result *= 256;
    result += (int)( (unsigned char) buffer[i-1]);
  }
  std::cout << "global memory size: " << result << "\noutput buffer size: " << outputBufferSize << std::endl;
  return result;
}

std::string getDeviceName(cl_device_id deviceId)
{ return getDeviceInfo(deviceId, CL_DEVICE_NAME);
}

class SharedMemory
{
public:
  enum{
    typeVoidPointer,
    typeUint
  };
  std::string name;
  cl_mem theMemory;
  bool flagIsHOSTWritable;
  int typE;
  uint uintValue;

  SharedMemory()
  { this->name = "";
    this->flagIsHOSTWritable = true;
    this->theMemory = 0;
    this->typE = this->typeVoidPointer;
    this->uintValue = 0;
  }
  void ReleaseMe()
  { clReleaseMemObject(this->theMemory);
    this->theMemory = 0;
    this->name = "";
  }
  ~SharedMemory()
  { this->ReleaseMe();
  }
};

class GPU;

///
/// In the class to follow, we make the following assumptions on the code given in the
/// .cl file that corresponds to the kernel.
/// 1. Every kernel function has its input arguments listed before its output arguments.
/// For example, a kernel function can be declared along the lines of:
/// __kernel void myFunction(__global uint* input1, __global char* input2, __global char* output1, global char* output2, global char* output3)
/// 2. The input arguments correspond to the elements of this->inputs, respecting the order of the this->inputs vector.
/// 3. Likewise the output arguments correspond to the elements of this->outputs.

class GPUKernel{
public:
  GPU* owner;
  std::vector<std::shared_ptr<SharedMemory> > inputs;
  std::vector<std::shared_ptr<SharedMemory> > outputs;
  cl_program program;
  cl_kernel kernel;
  std::string name;
  void constructFromFileName(
      const std::string& fileNameNoExtension,
      const std::vector<std::string>& inputNames,
      const std::vector<int>& inputTypes,
      const std::vector<std::string>& outputNames,
      const std::vector<int>& outputTypes,
      GPU& ownerGPU);
  void constructArguments(
      const std::vector<std::string>& argumentNames,
      const std::vector<int>& argumentTypes,
      bool isInput);
  void writeToBuffer(unsigned argumentNumber, const std::vector<char>& input);
  void writeToBuffer(unsigned argumentNumber, const std::string& input);
  void writeToBuffer(unsigned argumentNumber, const void* input, size_t size);
  //void writeArgument(unsigned argumentNumber, uint input);

  ~GPUKernel(){
    this->kernel = 0;
    this->program = 0;
    for (unsigned i = 0; i < this->inputs.size(); i++)
      this->inputs[i]->ReleaseMe();
    for (unsigned i = 0; i < this->outputs.size(); i++)
      this->outputs[i]->ReleaseMe();
    cl_int ret;
    (void) ret;
    ret = clReleaseProgram(this->program);
    ret = clReleaseKernel(this->kernel);
  }
  void SetArguments();
  void SetArguments(std::vector<std::shared_ptr<SharedMemory> >& theArgs, unsigned offset);
};

class GPU {
public:
  static std::string kernelSHA256;

  std::unordered_map<std::string, std::shared_ptr<GPUKernel> > theKernels;
  cl_platform_id platformId;
  cl_device_id deviceId;
  cl_context context;
  cl_command_queue commandQueue;

  void initialize()
  { this->platformId = NULL;
    this->deviceId = NULL;
    this->context = 0;
    cl_uint ret_num_devices;
    cl_uint ret_num_platforms;
    cl_int ret = 0;
    ret = clGetPlatformIDs(1, &this->platformId, &ret_num_platforms);
    ret = clGetDeviceIDs(this->platformId, CL_DEVICE_TYPE_DEFAULT, 1, &this->deviceId, &ret_num_devices);
    std::cout << "Device name: " << getDeviceName(this->deviceId) << std::endl;
    std::cout << "Driver version: " << getDriverVersion(this->deviceId) << std::endl;
    std::cout << "Is little endian: " << getIsLittleEndian(this->deviceId) << std::endl;
    std::cout << "Memory: " << getGlobalMemorySize(this->deviceId) << std::endl;
    // Create an OpenCL context
    this->context = clCreateContext(NULL, 1, &this->deviceId, NULL, NULL, &ret);
    if (ret != CL_SUCCESS)
    {
      std::cout << "Failed to create context. " << std::endl;
      assert(false);
    }
    this->commandQueue = clCreateCommandQueue(this->context, this->deviceId,
                                              CL_QUEUE_OUT_OF_ORDER_EXEC_MODE_ENABLE,
                                              &ret);
    if (ret != CL_SUCCESS)
    {
      std::cout << "Failed to create command queue. " << std::endl;
      assert(false);
    }
  }
  void initializeKernels()
  { this->initialize();
    this->createKernel(
          this->kernelSHA256,
          {"length", "message"},
          {SharedMemory::typeUint, SharedMemory::typeVoidPointer},
          {"result"},
          {SharedMemory::typeVoidPointer});
  }
  void createKernel(
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
  ~GPU(){
    cl_int ret = 0;
    (void) ret;
    ret = clFlush(this->commandQueue);
    ret = clFinish(this->commandQueue);
    ret = clReleaseCommandQueue(this->commandQueue);
    this->commandQueue = NULL;
    ret = clReleaseContext(this->context);
    this->context = 0;
  }
};

std::string GPU::kernelSHA256 = "sha256GPU";

void GPUKernel::constructFromFileName(
    const std::string& fileNameNoExtension,
    const std::vector<std::string>& inputNames,
    const std::vector<int>& inputTypes,
    const std::vector<std::string>& outputNames,
    const std::vector<int>& outputTypes,
    GPU& ownerGPU)
{
  this->name = fileNameNoExtension;
  std::string fileName = "../opencl/cl/" + fileNameNoExtension + ".cl";
  std::ifstream theFile(fileName);
  if (!theFile.is_open()) {
    std::cout << "Failed to open " << fileName << std::endl;
    assert (false);
  }
  std::string source_str((std::istreambuf_iterator<char>(theFile)),
                          std::istreambuf_iterator<char>());
  std::cout << "Program file name: " << fileName << std::endl;
  //std::cout << "File read: \n" << source_str << std::endl;
  size_t sourceSize = source_str.size();
  const char* sourceCString = source_str.c_str();
  cl_int ret;
  this->owner = &ownerGPU;
  this->program = clCreateProgramWithSource(
    this->owner->context, 1,
    (const char **)& sourceCString,
    (const size_t *)& sourceSize, &ret);
  if (ret != CL_SUCCESS)
  {
    std::cout << "Failed to create program from source. " << std::endl;
    assert(false);
  }
  // Build the program
  //std::cout << "DEBUG: About to build program. " << std::endl;
  ret = clBuildProgram(this->program, 1, &this->owner->deviceId, NULL, NULL, NULL);
  if (ret != CL_SUCCESS)
  {
    std::cout << "Failed to build the program. Return code: " << ret << std::endl;
    char buffer[100000];
    size_t logSize;
    clGetProgramBuildInfo(this->program, this->owner->deviceId, CL_PROGRAM_BUILD_LOG, 10000, &buffer, &logSize);
    std::string theLog(buffer, logSize);
    std::cout << theLog;
    assert(false);
  }
  std::cout << "DEBUG: Program built, creating kernel. " << std::endl;
  // Create the OpenCL kernel
  this->kernel = clCreateKernel(this->program, this->name.c_str(), &ret);
  if (ret != CL_SUCCESS)
  {
    std::cout << "Failed to allocate kernel. Return code: " << ret << std::endl;
    std::cout << "Please note we \e[31mrequire the __kernel function name be the same\e[39m as the no-extension filename: \e[31m"
              << this->name << "\e[39m." << std::endl;
    assert(false);
  }
  std::cout << "DEBUG: Kernel created, setting buffers. " << std::endl;
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
    std::cout << "Fatal error: arguments not empty. " << std::endl;
    assert(false);
  }
  for (unsigned i = 0; i < argumentNames.size(); i ++)
  { theArgs.push_back(std::make_shared<SharedMemory>());
    std::shared_ptr<SharedMemory> current = theArgs[theArgs.size() - 1];
    current->name = argumentNames[i];
    current->flagIsHOSTWritable = true;
    current->typE = argumentTypes[i];
    size_t defaultBufferSize = 120;
    current->theMemory = clCreateBuffer(this->owner->context, bufferFlag, defaultBufferSize, NULL, &ret);
    if (ret != CL_SUCCESS)
    {
      std::cout << "Failed to create buffer \e[31m" << current->name  << "\e[39m. Return code: " << ret << std::endl;
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
  std::cout << "DEBUG: kernel: setting " << theArgs.size() << " arguments. "<< std::endl;
  for (unsigned i = 0; i < theArgs.size(); i ++)
  {
    std::shared_ptr<SharedMemory> current = theArgs[i];
    if (current->typE == SharedMemory::typeVoidPointer)
      ret = clSetKernelArg(this->kernel, i + offset, sizeof(cl_mem), (void *)& current->theMemory);
    if (current->typE == SharedMemory::typeUint)
      ret = clSetKernelArg(this->kernel, i + offset, sizeof(uint), &current->uintValue);

    if (ret != CL_SUCCESS)
    {
      std::cout << "Failed to set argument " << current->name << ". Return code: " << ret << ".\n";
      assert(false);
    }
  }
}

void GPUKernel::writeToBuffer(unsigned argumentNumber, const std::string& input)
{ return this->writeToBuffer(argumentNumber, input.c_str(), input.size());
}

void GPUKernel::writeToBuffer(unsigned argumentNumber, const void *input, size_t size)
{ //std::cout << "DEBUG: writing " << input;
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
  { std::cout << "Enqueueing write buffer failed with input: " << input << std::endl;
    assert(false);
  }
}

/*void GPUKernel::writeArgument(unsigned argumentNumber, uint input)
{ //std::cout << "DEBUG: writing " << input;
  std::cout << "Setting: argument number: " << argumentNumber << ", input: " << input << std::endl;
  std::shared_ptr<SharedMemory>& currentArgument =
      argumentNumber < this->inputs.size() ?
        this->inputs[argumentNumber] :
        this->outputs[argumentNumber - this->inputs.size()];
  currentArgument->uintValue = input;
  cl_int ret = clSetKernelArg(this->kernel, argumentNumber, sizeof(uint), &currentArgument->uintValue);
  if (ret != CL_SUCCESS)
  {
    std::cout << "Set kernel arg failed. " << std::endl;
    assert(false);
  }
}*/

class testSHA256
{
public:
  static std::vector<std::vector<std::string> > knownSHA256s;
  static void initialize();
};

std::vector<std::vector<std::string> > testSHA256::knownSHA256s;

void testSHA256::initialize()
{ testSHA256::knownSHA256s.push_back((std::vector<std::string>)
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
}

int main(void)
{
  // Create the two input vectors
  GPU theGPU;
  theGPU.initializeKernels();
  // Create a command queue
  std::shared_ptr<GPUKernel> theKernel = theGPU.theKernels[GPU::kernelSHA256];
  std::cout << "DEBUG: about to write to buffer. " << std::endl;
  testSHA256::initialize();
  auto timeStart = std::chrono::system_clock::now();
  unsigned largeTestCounter;
  unsigned totalToCompute = 100000;
  for (largeTestCounter = 0; largeTestCounter < totalToCompute; largeTestCounter ++)
  { unsigned testCounter = largeTestCounter % testSHA256::knownSHA256s.size();
    std::string& message = testSHA256::knownSHA256s[testCounter][0];
    uint theLength = message.size();
    theKernel->writeToBuffer(0, &theLength, sizeof(uint));
    theKernel->writeToBuffer(1, message);
    size_t local_item_size = 32; // Divide work items into groups of 64
    size_t global_item_size = 32; // Divide work items into groups of 64
    //std::cout << "DEBUG: Setting arguments ... " << std::endl;
    //std::cout << "DEBUG: arguments set, enqueueing kernel... " << std::endl;
    cl_int ret = clEnqueueNDRangeKernel(theGPU.commandQueue, theKernel->kernel, 1, NULL,
            &global_item_size, &local_item_size, 0, NULL, NULL);
    if (ret != CL_SUCCESS)
    { std::cout << "Failed to enqueue kernel. Return code: " << ret << ". " << std::endl;
      assert(false);
    }
    //std::cout << "DEBUG: kernel enqueued, proceeding to read buffer. " << std::endl;
    unsigned char bufferOutput[32];
    cl_mem& result = theKernel->outputs[0]->theMemory;
    ret = clEnqueueReadBuffer(
          theGPU.commandQueue, result, CL_TRUE, 0,
          32, bufferOutput, 0, NULL, NULL);
    if (ret != CL_SUCCESS)
    { std::cout << "Failed to enqueue read buffer. Return code: " << ret << ". " << std::endl;
      assert(false);
    }
    //std::cout << "Got to here" << std::endl;
    std::stringstream out;
    for (int i = 0; i < 32; i ++)
      out << std::hex << std::setw(2) << std::setfill('0') << ((int) (bufferOutput[i]));
    if (out.str() != testSHA256::knownSHA256s[testCounter][1])
    { std::cout << "\e[31mSha of " << testSHA256::knownSHA256s[testCounter][0] << " is wrongly computed to be: " << out.str()
                << " instead of: " << testSHA256::knownSHA256s[testCounter][1] << "\e[39m" << std::endl;
      assert(false);
    }
    if (largeTestCounter % 500 == 0)
    {
      auto timeCurrent = std::chrono::system_clock::now();
      std::chrono::duration<double> elapsed_seconds = timeCurrent - timeStart;
      std::cout << "Computed " << largeTestCounter << " sha256s in " << elapsed_seconds.count() << " second(s). " << std::endl;
    }
  }
  auto timeCurrent = std::chrono::system_clock::now();
  std::chrono::duration<double> elapsed_seconds = timeCurrent-timeStart;
  std::cout << "Computed " << largeTestCounter << " sha256s in " << elapsed_seconds.count() << " second(s). " << std::endl;
  std::cout << "Speed: " << (totalToCompute / elapsed_seconds.count()) << " hashes per second. " << std::endl;

  return 0;
}
