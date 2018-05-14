#include "logging.h"
#include <sstream>
#include <iomanip>
#include "gpu.h"
#include "cl/secp256k1_cpp.h"
#include "miscellaneous.h"
#include <chrono>
#include <assert.h>
#include "secp256k1_interface.h"

Logger logTestCentralPU("../test/kanban_gpu/debug/logTestCentralPU.txt", "[test CPU] ");
Logger logTestGraphicsPU("../test/kanban_gpu/debug/logTestGraphicsPU.txt", "[test GPU] ");
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

unsigned char bufferCentralPUMultiplicationContext[CryptoEC256k1GPU::memoryMultiplicationContext];
unsigned char bufferGraphicsPUMultiplicationContext[CryptoEC256k1GPU::memoryMultiplicationContext];

unsigned char bufferCentralPUGeneratorContext[CryptoEC256k1GPU::memoryGeneratorContext];
unsigned char bufferGraphicsPUGeneratorContext[CryptoEC256k1GPU::memoryGeneratorContext];


void getGeneratorContext(
  const unsigned char* theMemoryPool,
  secp256k1_ecmult_gen_context& outputGeneratorContext
){
  secp256k1_ecmult_gen_context_init(&outputGeneratorContext);
  uint32_t outputPositionGeneratorContextStruct = memoryPool_read_uint(&theMemoryPool[8]);
  uint32_t outputPositionGeneratorContextContent = memoryPool_read_uint(&theMemoryPool[12]);
  outputGeneratorContext = *((secp256k1_ecmult_gen_context*) &theMemoryPool[outputPositionGeneratorContextStruct]);
  outputGeneratorContext.prec = NULL;
  //int sizeOfGeneratorContextLump = (16 * 64 * sizeof(secp256k1_ge_storage));
  //logTest << "Size of generator context lump: " << sizeOfGeneratorContextLump << Logger::endL;
  //for (int i = 0; i < sizeOfGeneratorContextLump; i++)
  //  logTest << std::hex << (int) theMemoryPool[outputPositionGeneratorContextContent + i];
  outputGeneratorContext.prec = (secp256k1_ge_storage*) &theMemoryPool[outputPositionGeneratorContextContent];
}

void testPrintMemoryPoolGeneral(const unsigned char* theMemoryPool, const std::string& computationID, Logger& logTest) {
  logTest << computationID << Logger::endL;
  std::string memoryPoolPrintout;
  //int useFulmemoryPoolSize = 16 * 64 * 64 + 10192 + 100;
  logTest << "Claimed max size: " << memoryPool_readMaxPoolSize(theMemoryPool) << Logger::endL;
  logTest << "Used: " << memoryPool_readPoolSize(theMemoryPool) << Logger::endL;
  logTest << "Memory pool reserved bytes: " << std::dec << memoryPool_readNumberReservedBytesExcludingLog() << Logger::endL;
  logTest << "Memory pool reserved bytes + log size: " << std::dec << memoryPool_readNumberReservedBytesIncludingLog() << Logger::endL;
  logTest << "Memory pool pointer: 0x" << std::hex << ((long) theMemoryPool) << Logger::endL;
  int initialBytesToPrint = memoryPool_readNumberReservedBytesIncludingLog() + 1000;
  logTest << "First " << std::dec << initialBytesToPrint << " hex-formatted characters of the memory pool: " << Logger::endL;
  memoryPoolPrintout.assign((const char*) theMemoryPool, initialBytesToPrint);
  logTest << Miscellaneous::toStringHex(memoryPoolPrintout) << Logger::endL;
  logTest << "Computation log:\n"
  << toStringErrorLog(theMemoryPool) << Logger::endL << Logger::endL;
}

void testPrintMultiplicationContext(const unsigned char* theMemoryPool, const std::string& computationID, Logger& logTest) {
  testPrintMemoryPoolGeneral(theMemoryPool, computationID, logTest);
  uint32_t outputPosition= memoryPool_read_uint(&theMemoryPool[8]);
  logTest << "Position multiplication context: " << outputPosition << Logger::endL;
  secp256k1_ecmult_context multiplicationContext;
  multiplicationContext.pre_g = (secp256k1_ge_storage(*)[]) (theMemoryPool + outputPosition);
  logTest << "Multiplication context:\n"
  << toStringSecp256k1_MultiplicationContext(multiplicationContext, false) << Logger::endL;
}

void testPrintGeneratorContext(const unsigned char* theMemoryPool, const std::string& computationID, Logger& logTest) {
  testPrintMemoryPoolGeneral(theMemoryPool, computationID, logTest);
  uint32_t outputPositionGeneratorContextStruct = memoryPool_read_uint_fromOutput(0, theMemoryPool);
  uint32_t outputPositionGeneratorContextContent = memoryPool_read_uint_fromOutput(1, theMemoryPool);
  logTest << "Context struct position: " << outputPositionGeneratorContextStruct << Logger::endL;
  logTest << "Context content position: " << outputPositionGeneratorContextContent << Logger::endL;
  for (int i = 2; i < MACRO_numberOfOutputs; i++ ) {
    logTest << "Debug " << (i + 1) << ": " << toStringOutputObject(i, theMemoryPool) << Logger::endL;
  }
  secp256k1_ecmult_gen_context theGeneratorContext;
  getGeneratorContext(theMemoryPool, theGeneratorContext);
  logTest << "Generator context:\n" << toStringSecp256k1_GeneratorContext(theGeneratorContext, false) << Logger::endL;
}

extern void secp256k1_opencl_compute_multiplication_context(
  __global unsigned char* outputMemoryPoolContainingMultiplicationContext
);

extern void secp256k1_opencl_compute_generator_context(
  __global unsigned char* outputMemoryPoolContainingGeneratorContext
);

int testMain() {
  GPU theGPU;
  //if (!CryptoEC256k1::computeMultiplicationContext(bufferCentralPUMultiplicationContext))
  //  return - 1;
  //testPrintMultiplicationContext(bufferCentralPUMultiplicationContext, "Central PU", logTestCentralPU);
  if (!CryptoEC256k1::computeGeneratorContext(bufferCentralPUGeneratorContext))
    return - 1;
  testPrintGeneratorContext(bufferCentralPUGeneratorContext, "Central PU", logTestCentralPU);
  //secp256k1_ecmult_gen_context generatorContextCentralPU;
  //secp256k1_ecmult_gen_context_init(&generatorContextCentralPU);
  //getGeneratorContext(bufferCentralPUGeneratorContext, generatorContextCentralPU);

  //if (!CryptoEC256k1GPU::computeMultiplicationContext(bufferGraphicsPUMultiplicationContext, theGPU))
  //  return - 1;
  //testPrintMultiplicationContext(bufferGraphicsPUMultiplicationContext, "Graphics PU", logTestGraphicsPU);
  if (!CryptoEC256k1GPU::computeGeneratorContext(bufferGraphicsPUGeneratorContext, theGPU))
    return - 1;
  testPrintGeneratorContext(bufferGraphicsPUGeneratorContext, "Graphics PU", logTestGraphicsPU);
  //secp256k1_ecmult_gen_context generatorContextGraphicsPU;
  //secp256k1_ecmult_gen_context_init(&generatorContextGraphicsPU);
  //getGeneratorContext(bufferGraphicsPUGeneratorContext, generatorContextGraphicsPU);


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

class testSHA256
{
public:
  static std::vector<std::vector<std::string> > knownSHA256s;
  static std::string inputBuffer;
  static unsigned char outputBuffer[10000000];
  static std::vector<uint> messageStarts;
  static std::vector<uint> messageLengths;
  static void initialize();
  static unsigned totalToCompute;
};

std::vector<std::vector<std::string> > testSHA256::knownSHA256s;
std::string testSHA256::inputBuffer;
unsigned char testSHA256::outputBuffer[10000000];
std::vector<uint> testSHA256::messageStarts;
std::vector<uint> testSHA256::messageLengths;
unsigned testSHA256::totalToCompute = 100000;

void testSHA256::initialize() {
  testSHA256::knownSHA256s.push_back((std::vector<std::string>) {
    "abc",
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  });
  testSHA256::knownSHA256s.push_back((std::vector<std::string>) {
    "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
    "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"
  });
  testSHA256::knownSHA256s.push_back((std::vector<std::string>) {
   "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu",
   "cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1"
  });
  testSHA256::inputBuffer.reserve(100 * testSHA256::totalToCompute);
  for (unsigned i = 0; i < testSHA256::totalToCompute; i ++) {
    unsigned testCounter = i % testSHA256::knownSHA256s.size();
    std::string& currentMessage = testSHA256::knownSHA256s[testCounter][0];
    testSHA256::messageStarts.push_back(testSHA256::inputBuffer.size());
    testSHA256::messageLengths.push_back(currentMessage.size());
    testSHA256::inputBuffer.append(currentMessage);
    for (unsigned j = 0; j < 32; j ++)
      testSHA256::outputBuffer[i * 32 + j] = 0;
  }
}

int testSHA256(GPU& theGPU) {
  // Create the two input vectors
  theGPU.initializeAll();
  // Create a command queue
  std::shared_ptr<GPUKernel> theKernel = theGPU.theKernels[GPU::kernelSHA256];
  std::cout << "DEBUG: about to write to buffer. " << std::endl;
  testSHA256::initialize();

  auto timeStart = std::chrono::system_clock::now();
  uint largeTestCounter;
  theKernel->writeToBuffer(4, testSHA256::inputBuffer);

  for (largeTestCounter = 0; largeTestCounter < testSHA256::totalToCompute; largeTestCounter ++) {
    theKernel->writeArgument(1, testSHA256::messageStarts[largeTestCounter]);
    theKernel->writeArgument(2, testSHA256::messageLengths[largeTestCounter]);
    theKernel->writeArgument(3, largeTestCounter);
    //theKernel->writeToBuffer(0, &theLength, sizeof(uint));
    //std::cout << "DEBUG: Setting arguments ... " << std::endl;
    //std::cout << "DEBUG: arguments set, enqueueing kernel... " << std::endl;
    cl_int ret = clEnqueueNDRangeKernel(
      theGPU.commandQueue, theKernel->kernel, 1, NULL,
      &theKernel->global_item_size, &theKernel->local_item_size, 0, NULL, NULL
    );
    if (ret != CL_SUCCESS) {
      logTestGraphicsPU << "Failed to enqueue kernel. Return code: " << ret << ". " << Logger::endL;
      return false;
    }
    //std::cout << "DEBUG: kernel enqueued, proceeding to read buffer. " << std::endl;
    if (largeTestCounter % 500 == 0) {
      auto timeCurrent = std::chrono::system_clock::now();
      std::chrono::duration<double> elapsed_seconds = timeCurrent - timeStart;
      std::cout << "Computed " << largeTestCounter << " sha256s in " << elapsed_seconds.count() << " second(s). " << std::endl;
    }
  }
  cl_mem& result = theKernel->outputs[0]->theMemory;
  cl_int ret = clEnqueueReadBuffer (
    theGPU.commandQueue, result, CL_TRUE, 0,
    32 * testSHA256::totalToCompute, testSHA256::outputBuffer, 0, NULL, NULL
  );
  if (ret != CL_SUCCESS) {
    logTestGraphicsPU << "Failed to enqueue read buffer. Return code: " << ret << ". " << Logger::endL;
    return false;
  }
  auto timeCurrent = std::chrono::system_clock::now();
  std::chrono::duration<double> elapsed_seconds = timeCurrent - timeStart;
  logTestGraphicsPU << "Computed " << largeTestCounter << " sha256s in " << elapsed_seconds.count() << " second(s). " << Logger::endL;
  logTestGraphicsPU << "Speed: " << (testSHA256::totalToCompute / elapsed_seconds.count()) << " hashes per second. " << Logger::endL;
  logTestGraphicsPU << "Checking computations ..." << Logger::endL;
  for (largeTestCounter = 0; largeTestCounter < testSHA256::totalToCompute; largeTestCounter ++) {
    unsigned testCounteR = largeTestCounter % testSHA256::knownSHA256s.size();
    std::stringstream out;
    unsigned offset = largeTestCounter * 32;
    for (unsigned i = offset; i < offset + 32; i ++)
      out << std::hex << std::setw(2) << std::setfill('0') << ((int) ((unsigned) testSHA256::outputBuffer[i]));
    if (out.str() != testSHA256::knownSHA256s[testCounteR][1]) {
      logTestGraphicsPU << "\e[31mSha of message index " << largeTestCounter
             << ": " << testSHA256::knownSHA256s[testCounteR][0] << " is wrongly computed to be: " << out.str()
             << " instead of: " << testSHA256::knownSHA256s[testCounteR][1] << "\e[39m" << Logger::endL;
      assert(false);
      return - 1;
    }
  }
  logTestGraphicsPU << "Success!" << Logger::endL;
  std::cout << "\e[32mSuccess!\e[39m" << std::endl;
  return 0;
}
