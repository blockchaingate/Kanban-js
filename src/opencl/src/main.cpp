#include <stdio.h>
#include <stdlib.h>
#include <fstream>
#include <sstream>
#include <iostream>
#include <unordered_map>
#include <assert.h>
#include <memory>
#include <vector>

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
  std::cout << "REsult: " << result << "Return value: " << returnValue << " CL_False: " << CL_FALSE << " cl_true: " << CL_TRUE;
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
  std::cout << "global memory size: " << result << "\noutput buffer size: " << outputBufferSize;
  return result;
}

class GPU;
class GPUKernel{
public:
  GPU* owner;
  cl_uint length;
  cl_mem plain_key;
  cl_mem result;
  cl_program program;
  cl_kernel kernel;
  std::string name;
  void constructFromFileName(const std::string& fileNameNoExtension, GPU& ownerGPU);
  void writeToBuffer(const std::vector<char>& input, cl_mem& bufferToWriteInto);
  void writeToBuffer(const std::string& input, cl_mem& bufferToWriteInto);
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
};

class GPU {
public:
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
    this->createKernel("sha256");
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


void GPUKernel::constructFromFileName(const std::string& fileNameNoExtension, GPU& ownerGPU)
{
  this->name = fileNameNoExtension;
  std::string fileName = "../cl/" + fileNameNoExtension + ".cl";
  std::ifstream theFile(fileName);
  if (!theFile.is_open()) {
    std::cout << "Failed to open " << fileName;
    assert (false);
  }
  std::string source_str((std::istreambuf_iterator<char>(theFile)),
                          std::istreambuf_iterator<char>());
  std::cout << "Read file: " << source_str << std::endl;
  size_t sourceSize = source_str.size();
  const char* sourceCString = source_str.c_str();
  std::cout << "Got to here pt 1" << std::endl;
  cl_int ret;
  this->owner = &ownerGPU;
  std::cout << "Got to here" << std::endl;
  this->program = clCreateProgramWithSource(
    this->owner->context, 1,
    (const char **)& sourceCString,
    (const size_t *)& sourceSize, &ret);
  if (ret != CL_SUCCESS)
  {
    std::cout << "ret is not CL_success";
    assert(false);
  }
  std::cout << "Got to here" << std::endl;
  // Build the program
  ret = clBuildProgram(this->program, 1, &this->owner->deviceId, NULL, NULL, NULL);
  // Create the OpenCL kernel
  this->kernel = clCreateKernel(this->program, this->name.c_str(), &ret);

  // Create memory buffers on the device for each vector
  this->plain_key = clCreateBuffer(this->owner->context, CL_MEM_READ_ONLY, 100000, NULL, &ret);
  this->result = clCreateBuffer(this->owner->context, CL_MEM_WRITE_ONLY, 32 * sizeof(cl_uint), NULL, &ret);

  // Set the arguments of the kernel
  ret = clSetKernelArg(kernel, 0, sizeof(cl_uint*), (void *)& this->length);
  ret = clSetKernelArg(kernel, 1, sizeof(cl_mem), (void *)& this->plain_key);
  ret = clSetKernelArg(kernel, 2, sizeof(cl_mem), (void *)& this->result);
}


void GPUKernel::writeToBuffer(const std::string& input, cl_mem& bufferToWriteInto)
{ if (clEnqueueWriteBuffer(
        this->owner->commandQueue,
        bufferToWriteInto,
        CL_TRUE,
        0,
        input.size(),
        input.c_str(),
        0,
        NULL,
        NULL) != CL_SUCCESS)
  { std::cout << "Enqueueing write buffer failed with input: " << input;
    assert(false);
  }
  this->length = input.size();
}

int main(void)
{
  // Create the two input vectors
  GPU theGPU;
  theGPU.initializeKernels();
  // Create a command queue
  std::shared_ptr<GPUKernel> theKernel = theGPU.theKernels["sha256"];
  theKernel->writeToBuffer("abc", theKernel->plain_key);

  size_t local_item_size = 1; // Divide work items into groups of 64
  size_t global_item_size = 1; // Divide work items into groups of 64

  cl_uint ret;
  (void) ret;
  ret = clEnqueueNDRangeKernel(theGPU.commandQueue, theKernel->kernel, 1, NULL,
          &global_item_size, &local_item_size, 0, NULL, NULL);
  char bufferOutput[32];

  ret = clEnqueueReadBuffer(theGPU.commandQueue, theKernel->result, CL_TRUE, 0,
          32, bufferOutput, 0, NULL, NULL);
  for (int i = 0; i < 32; i++)
    std::cout << std::hex << bufferOutput[i];
  return 0;
}
