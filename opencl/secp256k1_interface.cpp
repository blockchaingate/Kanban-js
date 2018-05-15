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
  unsigned int* outputSize,
  unsigned char* outputInputNonce,
  unsigned char* inputSecretKey,
  unsigned char* inputMessage,
  GPU& theGPU
) {
  if (!theGPU.initializeAll())
    return false;
  std::shared_ptr<GPUKernel> kernelSign = theGPU.theKernels[GPU::kernelSign];
  kernelSign->writeToBuffer(2, outputInputNonce, 32);
  kernelSign->writeToBuffer(3, inputSecretKey, 32);
  kernelSign->writeToBuffer(4, inputMessage, 32);
  logGPU << "DEBUG: Got to signature start." << Logger::endL;
  cl_int ret = clEnqueueNDRangeKernel(
    theGPU.commandQueue,
    kernelSign->kernel,
    1,
    NULL,
    &kernelSign->global_item_size,
    &kernelSign->local_item_size,
    0,
    NULL,
    NULL
  );
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to enqueue kernel. Return code: " << ret << ". " << Logger::endL;
    return false;
  }
  cl_mem& resultSignatureSize = kernelSign->outputs[1]->theMemory;
  unsigned char outputSizeBuffer[4];

  logGPU << "DEBUG: enqueued output size. " << Logger::endL;
  ret = clEnqueueReadBuffer(
    theGPU.commandQueue,
    resultSignatureSize,
    CL_TRUE,
    0,
    4,
    (void*) outputSizeBuffer,
    0,
    NULL,
    NULL
  );
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to read size buffer. Return code: " << ret << Logger::endL;
    return false;
  }
  *outputSize = memoryPool_read_uint(outputSizeBuffer);
  cl_mem& resultSignature = kernelSign->outputs[0]->theMemory;
  ret = clEnqueueReadBuffer(
    theGPU.commandQueue,
    resultSignature,
    CL_TRUE,
    0,
    *outputSize,
    (void*) outputSignatures,
    0,
    NULL,
    NULL
  );
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to read signature buffer. Wanted to read: "
    << *outputSize << " bytes. Return code: " << ret << Logger::endL;
    return false;
  }
  return true;
}

bool CryptoEC256k1::signMessage(
  unsigned char* outputSignature,
  unsigned int* outputSize,
  unsigned char* outputInputNonce,
  unsigned char* inputSecretKey,
  unsigned char* inputMessage,
  unsigned char *inputMemoryPoolGeneratorContext
) {
  unsigned char outputSizeBuffer[4];
  secp256k1_opencl_sign(
    outputSignature,
    outputSizeBuffer,
    outputInputNonce,
    inputSecretKey,
    inputMessage,
    inputMemoryPoolGeneratorContext
  );
  *outputSize = memoryPool_read_uint(outputSizeBuffer);
  return true;
}

bool CryptoEC256k1::generatePublicKey(
  unsigned char* outputPublicKey,
  unsigned int *outputPublicKeySize,
  unsigned char *inputSecretKey,
  unsigned char *inputMemoryPoolGeneratorContext
) {
  unsigned char outputSizeBuffer[4];
  secp256k1_opencl_generate_public_key(
    outputPublicKey,
    outputSizeBuffer,
    inputSecretKey,
    inputMemoryPoolGeneratorContext
  );
  *outputPublicKeySize = memoryPool_read_uint(outputSizeBuffer);
  return true;
}
