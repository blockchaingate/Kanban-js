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

#include "cl/secp256k1.h"

class OpenCLFunctions {
public:
  static std::string getDeviceInfo(cl_device_id deviceId, cl_device_info informationRequested);
  static std::string getDriverVersion(cl_device_id deviceId);
  static bool getIsLittleEndian(cl_device_id deviceId);
  static long long getGlobalMemorySize(cl_device_id deviceId);
  static std::string getDeviceName(cl_device_id deviceId);
};

class SharedMemory {
public:
  enum {
    typeVoidPointer,
    typeVoidPointerExternalOwnership,
    typeUint
  };
  std::string name;
  cl_mem theMemory;
  cl_mem* memoryExternallyOwned;
  std::vector<unsigned char> buffer;
  int typE;
  unsigned int uintValue;
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

class GPUKernel {
  std::vector<std::shared_ptr<SharedMemory> > outputs; //<- kernel must be built before accessing: use getOutput to enforce.
  std::vector<std::shared_ptr<SharedMemory> > inputs; //<- kernel must be built before accessing: use getInput to enforce.
public:
  GPU* owner;


  std::vector<std::string> desiredOutputNames;
  std::vector<int> desiredOutputTypes;
  std::vector<std::string> desiredInputNames;
  std::vector<int> desiredInputTypes;
  std::vector<std::string> desiredExternalBufferNames;
  std::vector<std::string> desiredExternalBufferKernelOwners;

  std::vector<cl_mem*> buffersExternallyOwned;
  cl_program program;
  cl_kernel kernel;
  std::string name;
  unsigned numInitializedExternallyOwnedBuffers;
  bool flagIsBuilt;
  size_t local_item_size[3]; // Divide work items into groups of this size, initialized to 32
  size_t global_item_size[3]; // Divide work items into groups of this size, initialized to 32

  std::vector<std::string> computationIds; // <- used to pipeline messages.
  std::vector<std::shared_ptr<SharedMemory> >& getOutputCollection();
  std::vector<std::shared_ptr<SharedMemory> >& getInputCollection();
  std::shared_ptr<SharedMemory>& getOutput(int outputIndex);
  std::shared_ptr<SharedMemory>& getInput(int inputIndex);

  bool constructFromFileNameNoBuild(
    const std::string& fileNameNoExtension,
    const std::vector<std::string>& outputNames,
    const std::vector<int>& outputTypes,
    const std::vector<std::string>& inputNames,
    const std::vector<int>& inputTypes,
    const std::vector<std::string>& inputExternalBufferNames,
    const std::vector<std::string>& inputExternalBufferKernelOwners,
    GPU& ownerGPU
  );
  bool build();
  bool hasArgumentName(const std::string& desiredArgumentName);
  cl_mem* getClMemPointer(const std::string& bufferName);

  bool constructArguments(
    const std::vector<std::string>& argumentNames,
    const std::vector<int>& argumentTypes,
    bool isInput, bool isOutput
  );
  bool writeToBuffer(unsigned argumentNumber, const std::vector<char>& input);
  bool writeToBuffer(unsigned argumentNumber, const std::vector<unsigned char>& input);
  bool writeToBuffer(unsigned argumentNumber, const std::vector<unsigned int>& input);
  bool writeToBuffer(unsigned argumentNumber, const std::string& input);
  bool writeToBuffer(unsigned argumentNumber, const void* input, size_t size);
  bool writeArgument(unsigned argumentNumber, uint input);
  GPUKernel();
  ~GPUKernel();
  bool SetArguments();
  bool SetArguments(std::vector<std::shared_ptr<SharedMemory> >& theArgs, unsigned offset);
};

class GPU {
private:
  //Copying GPU object is banned (private copy-constructor): the GPU contains live pointers.
  GPU(const GPU& other);
public:
  static std::string kernelSHA256;
  static std::string kernelTestBuffer;
  static std::string kernelInitializeMultiplicationContext;
  static std::string kernelInitializeGeneratorContext;
  static std::string kernelGeneratePublicKey;
  static std::string kernelSign;
  static std::string kernelVerifySignature;
  static std::string kernelTestSuite1BasicOperations;

  //6MB for computing multiplication context.
  static const int memoryMultiplicationContext = MACRO_MEMORY_POOL_SIZE_MultiplicationContext;
  //2MB for computing generator context.
  static const int memoryGeneratorContext = MACRO_MEMORY_POOL_SIZE_GeneratorContext;
  //250KB for signature verification
  static const int memorySignature = MACRO_MEMORY_POOL_SIZE_Signature;

  //Warning: too-large compile-time non-static memory allocations such as
  //
  //unsigned char bufferMultiplicationContext[MACRO_MEMORY_POOL_SIZE_MultiplicationContext];
  //
  //may fail in an obscure way.
  //For example, compilation may pass but one can still get
  //a run-time segfault on (some) writes.
  //
  //Therefore we allocate the computation buffers below
  //at run-time, even though they are of the fixed sizes
  //indicated above.
  //
  unsigned char* bufferMultiplicationContext;
  unsigned char* bufferTestSuite1BasicOperations;
  unsigned char* bufferGeneratorContext;
  unsigned char* bufferSignature;

  bool flagMultiplicationContextComputed;
  bool flagGeneratorContextComputed;
  bool flagMultiplicationContextComputationSTARTED;
  bool flagGeneratorContextComputationSTARTED;


  std::unordered_map<std::string, std::shared_ptr<GPUKernel> > theKernels;
  cl_platform_id platformIds[2];
  cl_uint numberOfPlatforms;
  cl_device_id allDevices[2];
  cl_uint numberOfDevices;
  cl_device_type theDesiredDeviceType;
  cl_device_id currentDeviceId;
  cl_context context;
  cl_command_queue commandQueue;
  bool flagVerbose;
  bool flagInitializedPlatform;
  bool flagInitializedKernelsNoBuild;
  bool flagInitializedKernelsFull;
  std::shared_ptr<GPUKernel> getKernel(const std::string& kernelName);
  bool initializeAllNoBuild();
  bool initializeAllFull();
  bool initializePlatform();
  bool initializePlatformFull();
  bool initializeKernelsNoBuild();
  bool initializeKernelsFull();
  //Static allocation forbidden!
  //Rationale: we need to use file loggers in the
  //destructors. File loggers are statically
  //initialized, so we may run into the
  //static initialization order fiasco.
  GPU();
  bool createKernelNoBuild(
    const std::string& fileNameNoExtension,
    const std::vector<std::string>& outputs,
    const std::vector<int>& outputTypes,
    const std::vector<std::string>& inputs,
    const std::vector<int>& inputTypes,
    const std::vector<std::string>& inputExternalBufferNames,
    const std::vector<std::string>& inputExternalBufferKernelOwners
  );
  bool createKernelBuild();
  ~GPU();
};

#endif
