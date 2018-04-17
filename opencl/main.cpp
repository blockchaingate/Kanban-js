#include <stdio.h>
#include <stdlib.h>
#include <fstream>
#include <sstream>
#include <iostream>
#include <unordered_map>
#include <assert.h>
#include <memory>
#include <vector>
#include <iomanip>

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
  std::cout << "Result: " << result << "Return value: " << returnValue << " CL_False: " << CL_FALSE << " cl_true: " << CL_TRUE << std::endl;
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

class GPU;
class GPUKernel{
public:
  GPU* owner;
  cl_mem length;
  cl_mem plain_key;
  cl_mem result;
  cl_program program;
  cl_kernel kernel;
  std::string name;
  void constructFromFileName(const std::string& fileNameNoExtension, GPU& ownerGPU);
  void writeToBuffer(const std::vector<char>& input, cl_mem& bufferToWriteInto);
  void writeToBuffer(const std::string& input, cl_mem& bufferToWriteInto);
  void writeToBuffer(const void* input, size_t size, cl_mem& bufferToWriteInto);
  ~GPUKernel(){
    cl_int ret;
    (void) ret;
    ret = clReleaseMemObject(this->plain_key);
    ret = clReleaseMemObject(this->result);
    ret = clReleaseProgram(this->program);
    ret = clReleaseKernel(this->kernel);
    this->kernel = 0;
    this->program = 0;
    this->plain_key = 0;
    this->result = 0;
  }
  void SetArguments();
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
    std::cout << "Driver version: " << getDriverVersion(this->deviceId) << std::endl;
    std::cout << "Is little endian: " << getIsLittleEndian(this->deviceId) << std::endl;
    std::cout << "Memory: " << getGlobalMemorySize(this->deviceId) << std::endl;
    // Create an OpenCL context
    this->context = clCreateContext( NULL, 1, &this->deviceId, NULL, NULL, &ret);
    this->commandQueue = clCreateCommandQueue(this->context, this->deviceId, 0, &ret);

  }
  void initializeKernels()
  { this->initialize();
    this->createKernel(this->kernelSHA256);
  }
  void createKernel(const std::string& fileNameNoExtension){
    std::shared_ptr<GPUKernel> incomingKernel = std::make_shared<GPUKernel>();
    incomingKernel->constructFromFileName(fileNameNoExtension, *this);
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


void GPUKernel::constructFromFileName(const std::string& fileNameNoExtension, GPU& ownerGPU)
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
  std::cout << "File read: \n" << source_str << std::endl;
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
  std::cout << "DEBUG: About to build program. " << std::endl;
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

  // Create memory buffers on the device for each vector
  this->length = clCreateBuffer(this->owner->context, CL_MEM_READ_ONLY, sizeof (uint), NULL, &ret);
  if (ret != CL_SUCCESS)
  { std::cout << "Failed to create buffer length. Return code: " << ret << std::endl;
    assert(false);
  }

  this->plain_key = clCreateBuffer(this->owner->context, CL_MEM_READ_ONLY, 100000, NULL, &ret);
  std::cout << "DEBUG: buffer plain_key created: " << &this->plain_key << std::endl;
  if (ret != CL_SUCCESS)
  { std::cout << "Failed to create buffer plain_key. Return code: " << ret << std::endl;
    assert(false);
  }
  this->result = clCreateBuffer(this->owner->context, CL_MEM_WRITE_ONLY, 32, NULL, &ret);
  if (ret != CL_SUCCESS)
  { std::cout << "Failed to create buffer result. Return code: " << ret << std::endl;
    assert(false);
  }

  // Set the arguments of the kernel
}

void GPUKernel::SetArguments()
{
  cl_int ret;
  std::cout << "DEBUG: about to set length kernel arg: length is: " << this->length << ", its address is: " << &this->length << std::endl;
  ret = clSetKernelArg(this->kernel, 0, sizeof(uint*), & this->length);
  if (ret != CL_SUCCESS)
  {
    std::cout << "Failed to set length argument. Return code: " << ret << ".\n";
    assert(false);
  }
  std::cout << "DEBUG: length set successfully. " << std::endl;
  ret = clSetKernelArg(this->kernel, 1, sizeof(cl_mem), (void *)& this->plain_key);
  if (ret != CL_SUCCESS)
  {
    std::cout << "Failed to set plain key argument. Return code: " << ret << ".\n";
    assert(false);
  }
  std::cout << "DEBUG: Plain key set successfully. " << std::endl;
  ret = clSetKernelArg(this->kernel, 2, sizeof(cl_mem), (void *)& this->result);
  if (ret != CL_SUCCESS)
  {
    std::cout << "Failed to set result argument. Return code: " << ret << ".\n";
    assert(false);
  }
  std::cout << "DEBUG: Result key set successfully. " << std::endl;
}

void GPUKernel::writeToBuffer(const std::string& input, cl_mem& bufferToWriteInto)
{ return this->writeToBuffer(input.c_str(), input.size(), bufferToWriteInto);
}

void GPUKernel::writeToBuffer(const void *input, size_t size, cl_mem& bufferToWriteInto)
{ std::cout << "DEBUG: writing " << input;
  std::cout << " in buffeR: " << &bufferToWriteInto << std::endl;
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
  { std::cout << "Enqueueing write buffer failed with input: " << input;
    assert(false);
  }
}

int main(void)
{
  // Create the two input vectors
  GPU theGPU;
  theGPU.initializeKernels();
  // Create a command queue
  std::shared_ptr<GPUKernel> theKernel = theGPU.theKernels[GPU::kernelSHA256];
  std::cout << "DEBUG: about to write to buffer. " << std::endl;
  std::string message = "abc";
  theKernel->writeToBuffer(message, theKernel->plain_key);
  uint theLength = message.size();
  theKernel->writeToBuffer(&theLength, sizeof(uint), theKernel->length);
  std::cout << "DEBUG: Wrote to buffer. " << std::endl;

  size_t local_item_size = 1; // Divide work items into groups of 64
  size_t global_item_size = 1; // Divide work items into groups of 64

  cl_uint ret;
  (void) ret;
  std::cout << "DEBUG: Setting arguments ... " << std::endl;
  theKernel->SetArguments();
  std::cout << "DEBUG: arguments set, enqueueing kernel... " << std::endl;
  ret = clEnqueueNDRangeKernel(theGPU.commandQueue, theKernel->kernel, 1, NULL,
          &global_item_size, &local_item_size, 0, NULL, NULL);
  std::cout << "DEBUG: kernel enqueued, proceeding to read buffer. " << std::endl;
  unsigned char bufferOutput[32];

  ret = clEnqueueReadBuffer(theGPU.commandQueue, theKernel->result, CL_TRUE, 0,
          32, bufferOutput, 0, NULL, NULL);
  std::cout << "Got to here" << std::endl;
  for (int i = 0; i < 32; i++)
    std::cout << std::hex << std::setw(2) << std::setfill('0') << ((int) (bufferOutput[i]));
  return 0;
}
