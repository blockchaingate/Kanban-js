#include "secp256k1_interface.h"
#include "cl/secp256k1_cpp.h"
#include "logging.h"

extern Logger logGPU;

bool CryptoEC256k1::computeMultiplicationContext(unsigned char* outputMemoryPool) {
  secp256k1_opencl_compute_multiplication_context(outputMemoryPool);
  return true;
}

bool CryptoEC256k1::computeGeneratorContext(unsigned char* outputMemoryPool) {
  secp256k1_opencl_compute_generator_context(outputMemoryPool);
  return true;
}

bool CryptoEC256k1GPU::computeMultiplicationContext(unsigned char* outputMemoryPool, GPU& theGPU) {
  if (!theGPU.initializeAll())
    return false;
  std::shared_ptr<GPUKernel> kernelMultiplicationContext = theGPU.theKernels[GPU::kernelInitializeMultiplicationContext];

  cl_int ret = clEnqueueNDRangeKernel(
    theGPU.commandQueue, kernelMultiplicationContext->kernel, 1, NULL,
    &kernelMultiplicationContext->global_item_size, &kernelMultiplicationContext->local_item_size, 0, NULL, NULL
  );
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to enqueue kernel. Return code: " << ret << ". " << Logger::endL;
    return false;
  }
  cl_mem& result = kernelMultiplicationContext->outputs[0]->theMemory;
  ret = clEnqueueReadBuffer(theGPU.commandQueue, result, CL_TRUE, 0, CryptoEC256k1GPU::memoryMultiplicationContext - 100, (void*) outputMemoryPool, 0, NULL, NULL);
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to read buffer. Return code: " << ret << Logger::endL;
    return false;
  }
  return true;
}

bool CryptoEC256k1GPU::computeGeneratorContext(unsigned char* outputMemoryPool, GPU& theGPU) {
  logGPU << "DEBUG: Got to generator context start." << Logger::endL;
  if (!theGPU.initializeAll())
    return false;
  std::shared_ptr<GPUKernel> kernelGeneratorContext = theGPU.theKernels[GPU::kernelInitializeGeneratorContext];
  logGPU << "DEBUG: Got to before compute generator context" << Logger::endL;
  cl_int ret = clEnqueueNDRangeKernel(
    theGPU.commandQueue, kernelGeneratorContext->kernel, 1, NULL,
    &kernelGeneratorContext->global_item_size, &kernelGeneratorContext->local_item_size, 0, NULL, NULL
  );
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to enqueue kernel. Return code: " << ret << ". " << Logger::endL;
    return false;
  }
  cl_mem& result = kernelGeneratorContext->outputs[0]->theMemory;
  logGPU << "DEBUG: enqueued generator context. " << Logger::endL;
  ret = clEnqueueReadBuffer(theGPU.commandQueue, result, CL_TRUE, 0,  CryptoEC256k1GPU::memoryGeneratorContext - 100, (void*) outputMemoryPool, 0, NULL, NULL);
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to read buffer. Return code: " << ret << Logger::endL;
    return false;
  }
  return true;
}

bool CryptoEC256k1GPU::signMessage(
  unsigned char* outputSignatures,
  unsigned char* outputInputNonce,
  unsigned char* inputSecretKey,
  unsigned char* inputMessage,
  unsigned int recordId,
  unsigned char *inputMemoryPoolGeneratorContext,
  GPU& theGPU
) {

}

bool CryptoEC256k1::signMessage(
  unsigned char* outputSignature,
  unsigned char* outputInputNonce,
  unsigned char* inputSecretKey,
  unsigned char* inputMessage,
  unsigned int recordId,
  unsigned char *inputMemoryPoolGeneratorContext
) {
  secp256k1_opencl_sign(
    outputSignature,
    outputInputNonce,
    inputSecretKey,
    inputMessage,
    recordId,
    inputMemoryPoolGeneratorContext
  );
}
