#include "logging.h"
#include <sstream>
#include <iomanip>
#include "gpu.h"
#include "cl/secp256k1_cpp.h"
#include "miscellaneous.h"

Logger logTest("../logfiles/logTest.txt", "[test] ");
extern Logger logServer;

void printComments(unsigned char* comments) {
  std::string resultString((char*) comments, 999);
  char returnGPU = resultString[0];
  std::string extraMessage1 = resultString.substr(1, 32);
  std::string extraMessage2 = resultString.substr(33, 32);
  std::string extraMessage3 = resultString.substr(65, 32);
  logServer << "Return of verification: " << (int) returnGPU << Logger::endL;
  logServer << "extraMessage xr: " << Miscellaneous::toStringHex(extraMessage1) << Logger::endL;
  logServer << "extraMessage pr.x: " << Miscellaneous::toStringHex(extraMessage2) << Logger::endL;
  logServer << "extraMessage pr.z: " << Miscellaneous::toStringHex(extraMessage3) << Logger::endL;
}

unsigned char bufferCentralPUMultiplicationContext[6000000]; //6MB for computing multiplication context
unsigned char bufferGraphicsPUMultiplicationContext[6000000];

unsigned char bufferCentralPUGeneratorContext[2000000]; //2MB for computing generators
unsigned char bufferGraphicsPUGeneratorContext[2000000];


void getGeneratorContext(
  const unsigned char* theMemoryPool,
  secp256k1_ecmult_gen_context& outputGeneratorContext
){
  secp256k1_ecmult_gen_context_init(&outputGeneratorContext);
  uint32_t outputPositionGeneratorContextStruct = readFromMemoryPool(&theMemoryPool[8]);
  uint32_t outputPositionGeneratorContextContent = readFromMemoryPool(&theMemoryPool[12]);

  logTest << "GOT to here pt 1 " << Logger::endL;
  outputGeneratorContext = *((secp256k1_ecmult_gen_context*) &theMemoryPool[outputPositionGeneratorContextStruct]);
  logTest << "GOT to here pt 2 " << Logger::endL;
  outputGeneratorContext.prec = NULL;
  logTest << "GOT to here pt 3 " << Logger::endL;
  //int sizeOfGeneratorContextLump = (16 * 64 * sizeof(secp256k1_ge_storage));
  //logTest << "Size of generator context lump: " << sizeOfGeneratorContextLump << Logger::endL;
  //for (int i = 0; i < sizeOfGeneratorContextLump; i++)
  //  logTest << std::hex << (int) theMemoryPool[outputPositionGeneratorContextContent + i];
  outputGeneratorContext.prec = (secp256k1_ge_storage*) &theMemoryPool[outputPositionGeneratorContextContent];
  logTest << "GOT to here pt 4. Prec pointer:  " << std::hex << ((long) outputGeneratorContext.prec)
  << "\nMemory pool pointer: " << std::hex << ((long) theMemoryPool) << Logger::endL;
}

void testPrintMemoryPoolGeneral(const unsigned char* theMemoryPool, const std::string& computationID) {
  logTest << computationID << Logger::endL;
  std::string memoryPoolPrintout;
  //int useFulmemoryPoolSize = 16 * 64 * 64 + 10192 + 100;
  logTest << "Memory pool reserved bytes: " << std::dec << getNumberOfReservedBytesIncludingMessageLog() << Logger::endL;
  int initialBytesToPrint = getNumberOfReservedBytesIncludingMessageLog() + 1000;
  logTest << "First " << initialBytesToPrint << " hex-formatted characters of the memory pool: " << Logger::endL;
  memoryPoolPrintout.assign((const char*) theMemoryPool, initialBytesToPrint);
  logTest << Miscellaneous::toStringHex(memoryPoolPrintout) << Logger::endL;
  logTest << "Computation log:\n"
  << toStringErrorLog(theMemoryPool) << Logger::endL;
}

void testPrintMultiplicationContext(const unsigned char* theMemoryPool, const std::string& computationID) {
  testPrintMemoryPoolGeneral(theMemoryPool, computationID);
  uint32_t outputPositionCentralPU = readFromMemoryPool(&theMemoryPool[8]);
  logTest << "outputPosition: " << outputPositionCentralPU << Logger::endL;
  secp256k1_ecmult_context multiplicationContextCentralPU;
  multiplicationContextCentralPU.pre_g = (secp256k1_ge_storage(*)[]) (theMemoryPool + outputPositionCentralPU);
  logTest << "multiplicationContext:\n"
  << toStringSecp256k1_MultiplicationContext(multiplicationContextCentralPU, false) << Logger::endL;
}

void testPrintGeneratorContext(const unsigned char* theMemoryPool, const std::string& computationID) {
  testPrintMemoryPoolGeneral(theMemoryPool, computationID);
  uint32_t outputPositionGeneratorContextStruct = readFromMemoryPool(&theMemoryPool[8]);
  uint32_t outputPositionGeneratorContextContent = readFromMemoryPool(&theMemoryPool[12]);
  uint32_t sizePrec = readFromMemoryPool(&theMemoryPool[16]);
  logTest << "Context struct position: " << outputPositionGeneratorContextStruct << Logger::endL;
  logTest << "Context content position: " << outputPositionGeneratorContextContent << Logger::endL;
  logTest << "sizePrec: " << sizePrec << Logger::endL;

  secp256k1_ecmult_gen_context theGeneratorContext;
  getGeneratorContext(theMemoryPool, theGeneratorContext);
  logTest << "generatorContext:\n" << toStringSecp256k1_GeneratorContext(theGeneratorContext, false) << Logger::endL;
}

extern void secp256k1_opencl_compute_multiplication_context(
  __global unsigned char* outputMemoryPoolContainingMultiplicationContext
);
extern void secp256k1_opencl_compute_generator_context(
  __global unsigned char* outputMemoryPoolContainingGeneratorContext
);

int mainTest() {  
  secp256k1_opencl_compute_multiplication_context(bufferCentralPUMultiplicationContext);
  testPrintMultiplicationContext(bufferCentralPUMultiplicationContext, "Central PU");
  secp256k1_opencl_compute_generator_context(bufferCentralPUGeneratorContext);
  testPrintGeneratorContext(bufferCentralPUGeneratorContext, "Central PU");
  secp256k1_ecmult_gen_context theGeneratorContext;
  secp256k1_ecmult_gen_context_init(&theGeneratorContext);
  getGeneratorContext(bufferCentralPUGeneratorContext, theGeneratorContext);


/*  secp256k1_scalar signatureS, signatureR;
  secp256k1_scalar secretKey = SECP256K1_SCALAR_CONST(
    0, 0, 0, 0, 0, 13, 17, 19
  );
  secp256k1_scalar message = SECP256K1_SCALAR_CONST(
    2, 3, 5, 7, 11, 13, 17, 19
  );
  secp256k1_scalar nonce = SECP256K1_SCALAR_CONST(
    3, 5, 7, 11, 13, 17, 19, 23
  );
  secp256k1_ge publicKey;
  secp256k1_gej publicKeyJacobianCoordinates;

  secp256k1_ecmult_gen(&generatorContext, &publicKeyJacobianCoordinates, &secretKey);

  secp256k1_ge_set_gej(&publicKey, &publicKeyJacobianCoordinates);
  logTest << "DEBUG: public key: " << toStringSecp256k1_ECPoint(publicKey) << Logger::endL;

  int recId = 5;

  logTest << "Got to here pt 5. " << Logger::endL;
  secp256k1_ecdsa_sig_sign(&generatorContext, &signatureR, &signatureS, &secretKey, &message, &nonce, &recId);
  logTest << "SigR: " << toStringSecp256k1_Scalar(signatureR) << Logger::endL;
  logTest << "SigS: " << toStringSecp256k1_Scalar(signatureS) << Logger::endL;
  unsigned char resultChar[1200];
  for (int i = 0 ; i < 900; i ++) {
    resultChar[i] = 0;
  }

  int signatureResult = secp256k1_ecdsa_sig_verify(&multiplicationContext, &signatureR, &signatureS, &publicKey, &message, resultChar);
  logTest << "DEBUG: signature verification: " << signatureResult << Logger::endL;

  logTest << "Got to here pt 6. " << Logger::endL;
  logTest << "secret: " << toStringSecp256k1_Scalar(secretKey) << Logger::endL;
  logTest << "message: " << toStringSecp256k1_Scalar(message) << Logger::endL;
  logTest << "nonce: " << toStringSecp256k1_Scalar(nonce) << Logger::endL;
  logTest << "outputR: " << toStringSecp256k1_Scalar(signatureR) << Logger::endL;
  logTest << "outputS: " << toStringSecp256k1_Scalar(signatureS) << Logger::endL;


*/





  GPU theGPU;

  if (!theGPU.initializeKernels())
    return false;
  std::shared_ptr<GPUKernel> kernelMultiplicationContext = theGPU.theKernels[GPU::kernelInitializeMultiplicationContext];

  cl_int ret = clEnqueueNDRangeKernel(
    theGPU.commandQueue, kernelMultiplicationContext->kernel, 1, NULL,
    &kernelMultiplicationContext->global_item_size, &kernelMultiplicationContext->local_item_size, 0, NULL, NULL
  );
  if (ret != CL_SUCCESS) {
    logServer << "Failed to enqueue kernel. Return code: " << ret << ". " << Logger::endL;
    return 0;
  }
  cl_mem& result = kernelMultiplicationContext->outputs[0]->theMemory;
  for (int i = 0; i < 4000000; i ++) {
    bufferGraphicsPUMultiplicationContext[i] = 0;
  }
  logServer << "DEBUG: got to here. " << Logger::endL;
  ret = clEnqueueReadBuffer(theGPU.commandQueue, result, CL_TRUE, 0, 4000000, (void*) &bufferGraphicsPUMultiplicationContext, 0, NULL, NULL);
  if (ret != CL_SUCCESS) {
    logServer << "Failed to read buffer. Return code: " << ret << Logger::endL;
    return - 1;
  }
  testPrintMultiplicationContext(bufferGraphicsPUMultiplicationContext, "Graphics PU");
  /*
  secp256k1_ecmult_gen_context generatorContext;
  secp256k1_ecmult_gen_context_init(&generatorContext);


  printComments(resultChar);
  GPU theGPU;
  if (!theGPU.initializeKernels())
    return false;


  std::shared_ptr<GPUKernel> theKernel = theGPU.theKernels[GPU::kernelVerifySignature];

  theKernel->writeToBuffer(1, &signatureR, sizeof(multiplicationContext));
  theKernel->writeToBuffer(2, &signatureR, sizeof(signatureR));
  theKernel->writeToBuffer(3, &signatureS, sizeof(signatureS));
  theKernel->writeToBuffer(4, &publicKey, sizeof(publicKey));
  theKernel->writeToBuffer(5, &message, sizeof(message));

  cl_int ret = clEnqueueNDRangeKernel(
    theGPU.commandQueue, theKernel->kernel, 1, NULL,
    &theKernel->global_item_size, &theKernel->local_item_size, 0, NULL, NULL
  );
  if (ret != CL_SUCCESS) {
    logServer << "Failed to enqueue kernel. Return code: " << ret << ". ";
    return 0;
  }
  cl_mem& result = theKernel->outputs[0]->theMemory;
  secp256k1_ecmult_gen_context_clear(&generatorContext);
  for (int i = 0 ; i< 900; i ++) {
    resultChar[i] = 0;
  }
  ret = clEnqueueReadBuffer(theGPU.commandQueue, result, CL_TRUE, 0, 1000, &resultChar, 0, NULL, NULL);
  if (ret != CL_SUCCESS) {
    logServer << "Failed to read buffer. Return code: " << ret << Logger::endL;
    return - 1;
  }
  printComments(resultChar);*/
  return 0;
}
