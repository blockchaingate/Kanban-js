#include "secp256k1_interface.h"
#include "cl/secp256k1_cpp.h"
#include "logging.h"

extern Logger logGPU;

unsigned char CryptoEC256k1::bufferMultiplicationContext[GPU::memoryMultiplicationContext];
unsigned char CryptoEC256k1::bufferTestSuite1BasicOperations[GPU::memoryMultiplicationContext];
unsigned char CryptoEC256k1::bufferGeneratorContext[GPU::memoryGeneratorContext];
unsigned char CryptoEC256k1::bufferSignature[GPU::memorySignature];


bool CryptoEC256k1::flagGeneratorContextComputed = true;
bool CryptoEC256k1::flagMultiplicationContextComputed = true;

bool CryptoEC256k1::testSuite1BasicOperations(unsigned char* outputMemoryPool) {
  test_suite_1_basic_operations(outputMemoryPool);
  return true;
}

bool CryptoEC256k1::testSuite1BasicOperationsDefaultBuffers() {
  return CryptoEC256k1::testSuite1BasicOperations(CryptoEC256k1::bufferTestSuite1BasicOperations);
}

bool CryptoEC256k1::computeMultiplicationContext(unsigned char* outputMemoryPool) {
  secp256k1_opencl_compute_multiplication_context(outputMemoryPool);
  return true;
}

bool CryptoEC256k1::computeMultiplicationContextDefaultBuffers() {
  return CryptoEC256k1::computeMultiplicationContext(CryptoEC256k1::bufferMultiplicationContext);
}

bool CryptoEC256k1::computeGeneratorContext(unsigned char* outputMemoryPool) {
  logGPU << "Got to here" << Logger::endL;
  secp256k1_opencl_compute_generator_context(outputMemoryPool);
  return true;
}

bool CryptoEC256k1::computeGeneratorContextDefaultBuffers() {
  return CryptoEC256k1::computeGeneratorContext(CryptoEC256k1::bufferGeneratorContext);
}

bool CryptoEC256k1GPU::initializeMultiplicationContext(GPU& theGPU) {
  static int numInWait = 0;
  if (theGPU.flagMultiplicationContextComputed) {
    return true;
  }
  //This function should run only once.
  //The only time we expect to run this code more than once is if
  //two GPU multiplication initializations are started simultaneously
  //in separate threads. Currently the C++ driver is single-threaded
  //(and expected to remain so - openCL is expected to take care of
  //parallelization). In other words, this
  //code is here as a reminder of what needs to be done if we
  //decide to go multi-threaded (not expected to happen).
  if (theGPU.flagMultiplicationContextComputationSTARTED) {
    numInWait ++;
    int currentIndex = numInWait;
    logGPU << "Kernel " << currentIndex << " is waiting for multiplication initialization";
    while (theGPU.flagMultiplicationContextComputationSTARTED) {
      //infinite loop until multiplication context computation is done
    }
    logGPU << "Kernel " << currentIndex << " done waiting. ";
    return theGPU.flagMultiplicationContextComputed;
  }
  theGPU.flagMultiplicationContextComputationSTARTED = true;
  bool result = CryptoEC256k1GPU::computeMultiplicationContext(theGPU.bufferMultiplicationContext, theGPU);
  theGPU.flagMultiplicationContextComputed = true;
  return result;
}

bool CryptoEC256k1GPU::initializeGeneratorContext(GPU& theGPU) {
  static int numInWait = 0;
  if (theGPU.flagGeneratorContextComputed) {
    return true;
  }
  //This function should run only once.
  //Comments similar to those in initializeMultiplicationContext
  //apply.
  if (theGPU.flagGeneratorContextComputationSTARTED) {
    numInWait ++;
    int currentIndex = numInWait;
    logGPU << "Kernel " << currentIndex << " is waiting for generator context initialization";
    while (theGPU.flagGeneratorContextComputationSTARTED) {
      //infinite loop until generator context computation is done
    }
    logGPU << "Kernel " << currentIndex << " done waiting. ";
    return theGPU.flagGeneratorContextComputed;
  }
  theGPU.flagGeneratorContextComputationSTARTED = true;
  bool result = CryptoEC256k1GPU::computeGeneratorContext(theGPU.bufferGeneratorContext, theGPU);
  theGPU.flagGeneratorContextComputed = true;
  return result;
}

bool CryptoEC256k1GPU::testSuite1BasicOperationsDefaultBuffers(GPU& theGPU) {
  return CryptoEC256k1GPU::testSuite1BasicOperations(theGPU.bufferTestSuite1BasicOperations, theGPU);
}

bool CryptoEC256k1GPU::testSuite1BasicOperations(unsigned char* outputMemoryPool, GPU& theGPU) {
  if (!theGPU.initializeAll())
    return false;
  std::shared_ptr<GPUKernel> kernelTest = theGPU.theKernels[GPU::kernelTestSuite1BasicOperations];

  cl_int ret = clEnqueueNDRangeKernel(
    theGPU.commandQueue, kernelTest->kernel, 1, NULL,
    &kernelTest->global_item_size, &kernelTest->local_item_size, 0, NULL, NULL
  );
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to enqueue kernel. Return code: " << ret << ". " << Logger::endL;
    return false;
  }
  cl_mem& result = kernelTest->outputs[0]->theMemory;
  ret = clEnqueueReadBuffer(
    theGPU.commandQueue,
    result,
    CL_TRUE,
    0,
    theGPU.memoryMultiplicationContext - 100,
    (void*) outputMemoryPool,
    0,
    NULL,
    NULL
  );
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to read buffer. Return code: " << ret << Logger::endL;
    return false;
  }
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
  ret = clEnqueueReadBuffer(
    theGPU.commandQueue,
    result,
    CL_TRUE,
    0,
    theGPU.memoryMultiplicationContext - 100,
    (void*) outputMemoryPool,
    0,
    NULL,
    NULL
  );
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to read buffer. Return code: " << ret << Logger::endL;
    return false;
  }
  return true;
}

bool CryptoEC256k1GPU::computeMultiplicationContextDefaultBuffers(GPU& theGPU) {
  return CryptoEC256k1GPU::computeMultiplicationContext(theGPU.bufferMultiplicationContext, theGPU);
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
  ret = clEnqueueReadBuffer(
    theGPU.commandQueue,
    result,
    CL_TRUE,
    0,
    theGPU.memoryGeneratorContext - 100,
    (void*) outputMemoryPool,
    0,
    NULL,
    NULL
  );
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to read buffer. Return code: " << ret << Logger::endL;
    return false;
  }
  return true;
}

bool CryptoEC256k1GPU::computeGeneratorContextDefaultBuffers(GPU& theGPU) {
  return CryptoEC256k1GPU::computeGeneratorContext(theGPU.bufferGeneratorContext, theGPU);
}

bool CryptoEC256k1GPU::signMessageDefaultBuffers(
  unsigned char* outputSignatures,
  unsigned int* outputSize,
  unsigned char* outputInputNonce,
  unsigned char* inputSecretKey,
  unsigned char* inputMessage,
  unsigned int inputMessageIndex,
  GPU& theGPU
) {
  if (!theGPU.initializeAll()) {
    return false;
  }
  if (!CryptoEC256k1GPU::initializeGeneratorContext(theGPU)) {
    return false;
  }
  std::shared_ptr<GPUKernel> kernelSign = theGPU.theKernels[GPU::kernelSign];
  kernelSign->writeToBuffer(2, outputInputNonce, 32);
  kernelSign->writeToBuffer(3, inputSecretKey, 32);
  kernelSign->writeToBuffer(4, inputMessage, 32);
  kernelSign->writeArgument(6, inputMessageIndex);
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

bool CryptoEC256k1GPU::generatePublicKeyDefaultBuffers(
  unsigned char *outputPublicKey,
  unsigned int *outputPublicKeySize,
  unsigned char *inputSecretKey,
  GPU &theGPU
) {
  if (!theGPU.initializeAll()) {
    return false;
  }
  if (!CryptoEC256k1GPU::initializeGeneratorContext(theGPU)) {
    return false;
  }
  std::shared_ptr<GPUKernel> kernelGeneratePublicKey = theGPU.theKernels[GPU::kernelGeneratePublicKey];
  kernelGeneratePublicKey->writeToBuffer(2, inputSecretKey, 32);
  logGPU << "DEBUG: Got to generate public key start." << Logger::endL;
  cl_int ret = clEnqueueNDRangeKernel(
    theGPU.commandQueue,
    kernelGeneratePublicKey->kernel,
    1,
    NULL,
    &kernelGeneratePublicKey->global_item_size,
    &kernelGeneratePublicKey->local_item_size,
    0,
    NULL,
    NULL
  );
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to enqueue kernel. Return code: " << ret << ". " << Logger::endL;
    return false;
  }
  cl_mem& resultPublicKeySize = kernelGeneratePublicKey->outputs[1]->theMemory;
  unsigned char outputSizeBuffer[4];

  logGPU << "DEBUG: enqueued output size. " << Logger::endL;
  ret = clEnqueueReadBuffer(
    theGPU.commandQueue,
    resultPublicKeySize,
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
  *outputPublicKeySize = memoryPool_read_uint(outputSizeBuffer);
  cl_mem& resultSignature = kernelGeneratePublicKey->outputs[0]->theMemory;
  ret = clEnqueueReadBuffer(
    theGPU.commandQueue,
    resultSignature,
    CL_TRUE,
    0,
    *outputPublicKeySize,
    (void*) outputPublicKey,
    0,
    NULL,
    NULL
  );
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to read signature buffer. Wanted to read: "
    << *outputPublicKeySize << " bytes. Return code: " << ret << Logger::endL;
    return false;
  }
  return true;
}

bool CryptoEC256k1GPU::verifySignatureDefaultBuffers(
  unsigned char *output,
  const unsigned char *inputSignature,
  unsigned int signatureSize,
  const unsigned char *publicKey,
  unsigned int publicKeySize,
  const unsigned char *message,
  GPU &theGPU
) {
  //openCL function arguments:
  //__global unsigned char *output,
  //__global unsigned char *outputMemoryPoolSignature,
  //__global const unsigned char *inputSignature,
  //unsigned int signatureSize,
  //__global const unsigned char *publicKey,
  //unsigned int publicKeySize,
  //__global const unsigned char *message,
  //__global const unsigned char *memoryPoolMultiplicationContext
  if (!theGPU.initializeAll()) {
    return false;
  }
  if (!CryptoEC256k1GPU::initializeMultiplicationContext(theGPU)) {
    return false;
  }
  std::shared_ptr<GPUKernel> kernelVerifySignature = theGPU.theKernels[GPU::kernelVerifySignature];
  kernelVerifySignature->writeToBuffer(2, inputSignature, signatureSize);
  kernelVerifySignature->writeArgument(3, signatureSize);
  kernelVerifySignature->writeToBuffer(4, publicKey, publicKeySize);
  kernelVerifySignature->writeArgument(5, publicKeySize);
  kernelVerifySignature->writeToBuffer(6, message, 32);

  logGPU << "DEBUG: Got to generate public key start." << Logger::endL;
  cl_int ret = clEnqueueNDRangeKernel(
    theGPU.commandQueue,
    kernelVerifySignature->kernel,
    1,
    NULL,
    &kernelVerifySignature->global_item_size,
    &kernelVerifySignature->local_item_size,
    0,
    NULL,
    NULL
  );
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to enqueue verify signature kernel. Return code: " << ret << ". " << Logger::endL;
    return false;
  }
  cl_mem& resultSignature = kernelVerifySignature->outputs[0]->theMemory;
  logGPU << "DEBUG: enqueued output size. " << Logger::endL;
  ret = clEnqueueReadBuffer(
    theGPU.commandQueue,
    resultSignature,
    CL_TRUE,
    0,
    1,
    (void*) output,
    0,
    NULL,
    NULL
  );
  if (ret != CL_SUCCESS) {
    logGPU << "Failed to read size buffer. Return code: " << ret << Logger::endL;
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
  unsigned char* inputMemoryPoolGeneratorContext_MUST_BE_INITIALIZED,
  unsigned int inputMessageIndex
) {
  unsigned char outputSizeBuffer[4];
  secp256k1_opencl_sign(
    outputSignature,
    outputSizeBuffer,
    outputInputNonce,
    inputSecretKey,
    inputMessage,
    inputMemoryPoolGeneratorContext_MUST_BE_INITIALIZED,
    inputMessageIndex
  );
  *outputSize = memoryPool_read_uint(outputSizeBuffer);
  return true;
}

bool CryptoEC256k1::signMessageDefaultBuffers(
  unsigned char* outputSignature,
  unsigned int* outputSize,
  unsigned char* outputInputNonce,
  unsigned char* inputSecretKey,
  unsigned char* inputMessage
) {
  if (!CryptoEC256k1::flagGeneratorContextComputed) {
    CryptoEC256k1::computeGeneratorContext(CryptoEC256k1::bufferGeneratorContext);
    CryptoEC256k1::flagGeneratorContextComputed = true;
  }

  return CryptoEC256k1::signMessage(
    outputSignature,
    outputSize,
    outputInputNonce,
    inputSecretKey,
    inputMessage,
    CryptoEC256k1::bufferGeneratorContext,
    0
  );
}

bool CryptoEC256k1::generatePublicKey(
  unsigned char* outputPublicKey,
  unsigned int *outputPublicKeySize,
  unsigned char *inputSecretKey,
  unsigned char *inputMemoryPoolGeneratorContext_MUST_BE_INITIALIZED
) {
  unsigned char outputSizeBuffer[4];
  secp256k1_opencl_generate_public_key(
    outputPublicKey,
    outputSizeBuffer,
    inputSecretKey,
    inputMemoryPoolGeneratorContext_MUST_BE_INITIALIZED
  );
  *outputPublicKeySize = memoryPool_read_uint(outputSizeBuffer);
  return true;
}

bool CryptoEC256k1::generatePublicKeyDefaultBuffers(
  unsigned char* outputPublicKey,
  unsigned int *outputPublicKeySize,
  unsigned char *inputSecretKey
) {
  if (!CryptoEC256k1::flagGeneratorContextComputed) {
    CryptoEC256k1::computeGeneratorContext(CryptoEC256k1::bufferGeneratorContext);
    CryptoEC256k1::flagGeneratorContextComputed = true;
  }

  return CryptoEC256k1::generatePublicKey(
    outputPublicKey,
    outputPublicKeySize,
    inputSecretKey,
    CryptoEC256k1::bufferGeneratorContext
  );
}

bool CryptoEC256k1::verifySignature(
  unsigned char *output,
  unsigned char *outputMemoryPoolSignature,
  const unsigned char *inputSignature,
  unsigned int signatureSize,
  const unsigned char *publicKey,
  unsigned int publicKeySize,
  const unsigned char *message,
  const unsigned char *memoryPoolMultiplicationContext_MUST_BE_INITIALIZED
) {
  secp256k1_opencl_verify_signature(
    output,
    outputMemoryPoolSignature,
    inputSignature,
    signatureSize,
    publicKey,
    publicKeySize,
    message,
    memoryPoolMultiplicationContext_MUST_BE_INITIALIZED
  );
  return true;
}

bool CryptoEC256k1::verifySignatureDefaultBuffers(
  unsigned char *output,
  const unsigned char *inputSignature,
  unsigned int signatureSize,
  const unsigned char *publicKey,
  unsigned int publicKeySize,
  const unsigned char *message
) {
  if (!CryptoEC256k1::flagMultiplicationContextComputed) {
    CryptoEC256k1::computeMultiplicationContextDefaultBuffers();
    CryptoEC256k1::flagMultiplicationContextComputed = true;
  }
  return CryptoEC256k1::verifySignature(
    output,
    CryptoEC256k1::bufferSignature,
    inputSignature,
    signatureSize,
    publicKey,
    publicKeySize,
    message,
    CryptoEC256k1::bufferMultiplicationContext
  );
}
