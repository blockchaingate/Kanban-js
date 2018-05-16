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

unsigned char bufferCentralPUSignature[CryptoEC256k1GPU::memorySignature];
unsigned char bufferGraphicsPUGSignature[CryptoEC256k1GPU::memorySignature];

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
  uint32_t outputPosition = memoryPool_read_uint_fromOutput(0, theMemoryPool);
  logTest << "Position multiplication context: " << outputPosition << Logger::endL;
  secp256k1_ecmult_context multiplicationContext;
  secp256k1_ecmult_context_init(&multiplicationContext);
  memoryPool_read_multiplicationContext_PORTABLE(&multiplicationContext, theMemoryPool);
  logTest << "Multiplication context:\n"
  << toStringSecp256k1_MultiplicationContext(multiplicationContext, false) << Logger::endL;
}

void testPrintGeneratorContext(const unsigned char* theMemoryPool, const std::string& computationID, Logger& logTest) {
  testPrintMemoryPoolGeneral(theMemoryPool, computationID, logTest);
  uint32_t outputPositionGeneratorContextStruct = memoryPool_read_uint_fromOutput(0, theMemoryPool);
  uint32_t outputPositionGeneratorContextContent = memoryPool_read_uint_fromOutput(1, theMemoryPool);
  logTest << "Context struct position: " << outputPositionGeneratorContextStruct << Logger::endL;
  logTest << "Context content position: " << outputPositionGeneratorContextContent << Logger::endL;
  for (int i = 2; i < MACRO_numberOfOutputs; i ++) {
    logTest << "Debug " << (i + 1) << ": " << toStringOutputObject(i, theMemoryPool) << Logger::endL;
  }
  secp256k1_ecmult_gen_context theGeneratorContext;
  memoryPool_read_generatorContext_PORTABLE(&theGeneratorContext, theMemoryPool);
  logTest << "Generator context:\n" << toStringSecp256k1_GeneratorContext(theGeneratorContext, false) << Logger::endL;
}

extern void secp256k1_opencl_compute_multiplication_context(
  __global unsigned char* outputMemoryPoolContainingMultiplicationContext
);

extern void secp256k1_opencl_compute_generator_context(
  __global unsigned char* outputMemoryPoolContainingGeneratorContext
);

bool testMainPart1ComputeContexts(GPU& theGPU) {
  if (!CryptoEC256k1::computeMultiplicationContext(bufferCentralPUMultiplicationContext))
    return false;
  testPrintMultiplicationContext(bufferCentralPUMultiplicationContext, "Central PU", logTestCentralPU);
  if (!CryptoEC256k1::computeGeneratorContext(bufferCentralPUGeneratorContext))
    return false;
  testPrintGeneratorContext(bufferCentralPUGeneratorContext, "Central PU", logTestCentralPU);
  if (theGPU.flagTurnOffToDebugCPU)
    return true;
  if (!CryptoEC256k1GPU::computeMultiplicationContext(bufferGraphicsPUMultiplicationContext, theGPU))
    return false;
  testPrintMultiplicationContext(bufferGraphicsPUMultiplicationContext, "Graphics PU", logTestGraphicsPU);
  if (!CryptoEC256k1GPU::computeGeneratorContext(bufferGraphicsPUGeneratorContext, theGPU))
    return false;
  testPrintGeneratorContext(bufferGraphicsPUGeneratorContext, "Graphics PU", logTestGraphicsPU);
  return true;
}

void PublicKey::reset() {
  for (int i = 0; i < this->maxSerializationSize; i ++) {
    this->serialization[i] = 0;
  }
  this->size = 0;
}

std::string PublicKey::toString() {
  std::string buffer;
  buffer.assign((const char*) this->serialization, this->size);
  return Miscellaneous::toStringHex(buffer);
}

void GeneratorScalar::ComputeScalarFromSerialization() {
  secp256k1_scalar_set_b32(&this->scalar, this->serialization, NULL);
}

void GeneratorScalar::TestAssignString(const std::string& input) {
  int lastCopiedIndex;
  int numCharacters = std::min((int) input.size(), 32);
  for (lastCopiedIndex = 0; lastCopiedIndex < numCharacters; lastCopiedIndex ++) {
    this->serialization[lastCopiedIndex] = input[lastCopiedIndex];
  }
  for (; lastCopiedIndex < 32; lastCopiedIndex ++) {
    this->serialization[lastCopiedIndex] = 0;
  }
  this->ComputeScalarFromSerialization();
}

std::string Signature::toString() {
  std::stringstream out;
  out << "(r,s): " << toStringSecp256k1_Scalar(this->r) << ", " << toStringSecp256k1_Scalar(this->s);
  return out.str();
}

bool Signature::ComputeScalarsFromSerialization() {
  if (secp256k1_ecdsa_sig_parse(&this->r, & this->s, this->serialization, this->size) == 0) {
    return false;
  }
  return true;
}

void Signature::reset() {
  for (int i = 0; i < 8; i ++) {
    this->r.d[i] = 0;
  }
  for (int i = 0; i < 8; i ++) {
    this->s.d[i] = 0;
  }
  for (int i = 0; i < this->maxSerializationSize; i++) {
    this->serialization[i] = 0;
  }
}

bool testMainPart2Signatures(GPU& theGPU) {
  Signature theSignature;
  PrivateKey theKey;
  GeneratorScalar message;
  theKey.key.TestAssignString("This is a secret. ");
  message.TestAssignString("This is a message. ");
  theKey.nonceMustChangeAfterEverySignature.TestAssignString("This is a nonce. ");
  theSignature.reset();
  CryptoEC256k1::signMessage(
    theSignature.serialization,
    &theSignature.size,
    theKey.nonceMustChangeAfterEverySignature.serialization,
    theKey.key.serialization,
    message.serialization,
    bufferCentralPUGeneratorContext
  );
  theSignature.ComputeScalarsFromSerialization();
  logTestCentralPU << "Signature:\n" << theSignature.toString() << Logger::endL;
  if (!theGPU.flagTurnOffToDebugCPU) {
    theKey.nonceMustChangeAfterEverySignature.TestAssignString("This is a nonce. ");
    theSignature.reset();
    CryptoEC256k1GPU::signMessage(
      theSignature.serialization,
      &theSignature.size,
      theKey.nonceMustChangeAfterEverySignature.serialization,
      theKey.key.serialization,
      message.serialization,
      theGPU
    );
    theSignature.ComputeScalarsFromSerialization();
    logTestGraphicsPU << "Signature:\n" << theSignature.toString() << Logger::endL;
  }
  PublicKey thePublicKey;

  CryptoEC256k1::generatePublicKey(
    thePublicKey.serialization,
    &thePublicKey.size,
    theKey.key.serialization,
    bufferCentralPUGeneratorContext
  );
  logTestCentralPU << "Public key:\n" << thePublicKey.toString() << Logger::endL;
  if (!theGPU.flagTurnOffToDebugCPU) {
    thePublicKey.reset();
    if (!CryptoEC256k1GPU::generatePublicKey(
      thePublicKey.serialization,
      &thePublicKey.size,
      theKey.key.serialization,
      theGPU
    ))
      logTestGraphicsPU << "ERROR: generatePublicKey returned false. " << Logger::endL;
    logTestGraphicsPU << "Public key:\n" << thePublicKey.toString() << Logger::endL;
  }
  //getMultiplicationContext(bufferCentralPUMultiplicationContext, multiplicationContext);
  unsigned char signatureResult[1];
  signatureResult[0] = 3;
  CryptoEC256k1::verifySignature(
    &signatureResult[0],
    bufferCentralPUSignature,
    theSignature.serialization,
    theSignature.size,
    thePublicKey.serialization,
    thePublicKey.size,
    message.serialization,
    bufferCentralPUMultiplicationContext
  );
  logTestCentralPU << "Signature verification (expected 1): " << (int) signatureResult[0] << Logger::endL;

  signatureResult[0] = 3;
  if (!CryptoEC256k1GPU::verifySignature(
    &signatureResult[0],
    theSignature.serialization,
    theSignature.size,
    thePublicKey.serialization,
    thePublicKey.size,
    message.serialization,
    theGPU
  ))
    logTestGraphicsPU << "ERROR: verifySignature returned false. " << Logger::endL;
  logTestGraphicsPU << "Signature verification (expected 1): " << (int) signatureResult[0] << Logger::endL;

  theSignature.serialization[4] = 5;
  signatureResult[0] = 3;
  CryptoEC256k1::verifySignature(
    &signatureResult[0],
    bufferCentralPUSignature,
    theSignature.serialization,
    theSignature.size,
    thePublicKey.serialization,
    thePublicKey.size,
    message.serialization,
    bufferCentralPUMultiplicationContext
  );
  logTestCentralPU << "Bad signature verification (expected 0): " << (int) signatureResult[0] << Logger::endL;

  signatureResult[0] = 3;
  if (!CryptoEC256k1GPU::verifySignature(
    &signatureResult[0],
    theSignature.serialization,
    theSignature.size,
    thePublicKey.serialization,
    thePublicKey.size,
    message.serialization,
    theGPU
  ))
    logTestGraphicsPU << "ERROR: verifySignature returned false. " << Logger::endL;
  logTestGraphicsPU << "Bad signature verification (expected 0): " << (int) signatureResult[0] << Logger::endL;

  /*
  int signatureResult = secp256k1_ecdsa_sig_verify(
    &multiplicationContext,
    &signatureR,
    &signatureS,
    &publicKey,
    &message,
    bufferCentralPUMultiplicationContext
  );
  logTestCentralPU << "DEBUG: signature verification: " << signatureResult << Logger::endL;

  logTestCentralPU << "Got to here pt 6. " << Logger::endL;
  logTestCentralPU << "secret: " << toStringSecp256k1_Scalar(secretKey) << Logger::endL;
  logTestCentralPU << "message: " << toStringSecp256k1_Scalar(message) << Logger::endL;
  logTestCentralPU << "nonce: " << toStringSecp256k1_Scalar(nonce) << Logger::endL;
  logTestCentralPU << "outputR: " << toStringSecp256k1_Scalar(signatureR) << Logger::endL;
  logTestCentralPU << "outputS: " << toStringSecp256k1_Scalar(signatureS) << Logger::endL;*/
  return true;
}
bool testSHA256(GPU& theGPU);

int testMain() {
  GPU theGPU;
  //theGPU.flagTurnOffToDebugCPU = true;
  if (!testMainPart1ComputeContexts(theGPU))
    return - 1;
  if (!testMainPart2Signatures(theGPU))
    return - 1;
  if (!testSHA256(theGPU))
    return - 1;

  return 0;
}

class testSHA256 {
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

bool testSHA256(GPU& theGPU) {
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
      return false;
    }
  }
  logTestGraphicsPU << "Success!" << Logger::endL;
  std::cout << "\e[32mSuccess!\e[39m" << std::endl;
  return true;
}
