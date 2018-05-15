#ifndef gpuh_header
#define gpuh_header

#include <sstream>
#include <vector>
#include <memory>
#include <unordered_map>
#include <fstream>
#include <iostream>

#define CL_USE_DEPRECATED_OPENCL_1_2_APIS
//<- use opencl 1.1 instead of older versions.
#ifdef __APPLE__
#include <OpenCL/opencl.h>
#else
#include <CL/cl.h>
#endif

class OpenCLFunctions{
public:
  static std::string getDeviceInfo(cl_device_id deviceId, cl_device_info informationRequested);
  static std::string getDriverVersion(cl_device_id deviceId);
  static bool getIsLittleEndian(cl_device_id deviceId);
  static long long getGlobalMemorySize(cl_device_id deviceId);
  static std::string getDeviceName(cl_device_id deviceId);
};

class SharedMemory
{
public:
  enum
  {
    typeVoidPointer,
    typeVoidPointerExternalOwnership,
    typeUint
  };
  std::string name;
  cl_mem theMemory;
  cl_mem* memoryExernalOwnership;
  int typE;
  uint uintValue;
  SharedMemory();
  void ReleaseMe();
  ~SharedMemory();
};

class GPU;

///
/// In the class to follow, we make the following assumptions on the code given in the
/// .cl file that corresponds to the kernel.
/// 1. Every kernel function has its output arguments listed before its input arguments.
/// For example, a kernel function can be declared along the lines of:
/// __kernel void myFunction( __global char* output1, global char* output2, global char* output3, __global uint* input1, __global char* input2)
/// 2. The output arguments correspond to the elements of this->outputs.
/// 3. Likewise the input arguments correspond to the elements of this->inputs, respecting the order of the this->inputs vector.

class GPUKernel{
public:
  GPU* owner;
  std::vector<std::shared_ptr<SharedMemory> > outputs;
  std::vector<std::shared_ptr<SharedMemory> > inputs;
  cl_program program;
  cl_kernel kernel;
  std::string name;
  size_t local_item_size; // Divide work items into groups of 64
  size_t global_item_size; // Divide work items into groups of 64
  bool constructFromFileName(
    const std::string& fileNameNoExtension,
    const std::vector<std::string>& outputNames,
    const std::vector<int>& outputTypes,
    const std::vector<std::string>& inputNames,
    const std::vector<int>& inputTypes,
    GPU& ownerGPU
  );
  bool constructArguments(
    const std::vector<std::string>& argumentNames,
    const std::vector<int>& argumentTypes,
    bool isInput, bool isOutput
  );
  void writeToBuffer(unsigned argumentNumber, const std::vector<char>& input);
  bool writeToBuffer(unsigned argumentNumber, const std::string& input);
  bool writeToBuffer(unsigned argumentNumber, const void* input, size_t size);
  bool writeArgument(unsigned argumentNumber, uint input);
  GPUKernel();
  ~GPUKernel();
  bool SetArguments();
  bool SetArguments(std::vector<std::shared_ptr<SharedMemory> >& theArgs, unsigned offset);
  bool SetSharedArguments();
  bool SetSharedArguments(std::vector<std::shared_ptr<SharedMemory> >& theArgs, unsigned offset);
};

class GPU {
public:
  static std::string kernelSHA256;
  static std::string kernelTestBuffer;
  static std::string kernelInitializeMultiplicationContext;
  static std::string kernelInitializeGeneratorContext;
  static std::string kernelSign;
  static std::string kernelVerifySignature;
  std::unordered_map<std::string, std::shared_ptr<GPUKernel> > theKernels;
  cl_platform_id platformIds[2];
  cl_uint numberOfPlatforms;
  cl_device_id allDevices[2];
  cl_uint numberOfDevices;
  cl_device_id currentDeviceId;
  cl_context context;
  cl_command_queue commandQueue;
  bool flagVerbose;
  bool flagInitializedPlatform;
  bool flagInitializedKernels;
  bool initializeAll();
  bool initializePlatform();
  bool initializeKernels();
  GPU();
  bool createKernel(
    const std::string& fileNameNoExtension,
    const std::vector<std::string>& outputs,
    const std::vector<int>& outputTypes,
    const std::vector<std::string>& inputs,
    const std::vector<int>& inputTypes
  );
  ~GPU();
};

#endif
