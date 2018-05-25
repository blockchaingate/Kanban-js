#include "logging.h"
#include <sstream>
#include <iomanip>
#include "gpu.h"
#include "cl/secp256k1_cpp.h"
#include "miscellaneous.h"
#include <chrono>
#include <assert.h>
#include "secp256k1_interface.h"


//Use CentralPU and GraphicsPU, CPU and GPU look too similar,
//causing unwanted typos.

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
  for (int i = 0; i < MACRO_numberOfOutputs; i ++) {
    logTest << "Debug " << i << ": " << toStringOutputObject(i, theMemoryPool) << Logger::endL;
  }
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
  //*****CPU tests*******
  if (!CryptoEC256k1::computeMultiplicationContextDefaultBuffers())
    return false;
  /////////////////////////////
  if (!CryptoEC256k1::computeGeneratorContextDefaultBuffers())
    return false;
  logTestCentralPU << "Generator context computed. " << Logger::endL;
  testPrintGeneratorContext(CryptoEC256k1::bufferGeneratorContext, "Central PU", logTestCentralPU);
  /////////////////////////////


  /////////////////////////////
  logTestCentralPU << "Multiplication context computed. " << Logger::endL;
  testPrintMultiplicationContext(CryptoEC256k1::bufferMultiplicationContext, "Central PU", logTestCentralPU);
  /////////////////////////////

  //*****GPU tests*******
  /////////////////////////////
  if (!CryptoEC256k1GPU::computeGeneratorContextDefaultBuffers(theGPU))
    return false;
  logTestGraphicsPU << "Generator context computed. " << Logger::endL;
  std::string idOpenCL;
  if (theGPU.theDesiredDeviceType == CL_DEVICE_TYPE_GPU) {
    idOpenCL = "Graphics PU";
  } else {
    idOpenCL = "openCL CPU";
  }

  testPrintGeneratorContext(theGPU.bufferGeneratorContext, "Graphics PU", logTestGraphicsPU);
  /////////////////////////////


  /////////////////////////////
  if (!CryptoEC256k1GPU::computeMultiplicationContextDefaultBuffers(theGPU))
    return false;
  logTestGraphicsPU << "Multiplication context computed. " << Logger::endL;
  testPrintMultiplicationContext(theGPU.bufferMultiplicationContext, "Graphics PU", logTestGraphicsPU);
  /////////////////////////////


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
  for (int i = 0; i < this->maxSerializationSize; i ++) {
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
  CryptoEC256k1::signMessageDefaultBuffers(
    theSignature.serialization,
    &theSignature.size,
    theKey.nonceMustChangeAfterEverySignature.serialization,
    theKey.key.serialization,
    message.serialization
  );
  theSignature.ComputeScalarsFromSerialization();
  logTestCentralPU << "Signature:\n" << theSignature.toString() << Logger::endL;
  PublicKey thePublicKey;

  CryptoEC256k1::generatePublicKeyDefaultBuffers(
    thePublicKey.serialization,
    &thePublicKey.size,
    theKey.key.serialization
  );
  logTestCentralPU << "Public key:\n" << thePublicKey.toString() << Logger::endL;
  //getMultiplicationContext(bufferCentralPUMultiplicationContext, multiplicationContext);
  unsigned char signatureResult[1];
  signatureResult[0] = 3;
  CryptoEC256k1::verifySignatureDefaultBuffers(
    &signatureResult[0],
    theSignature.serialization,
    theSignature.size,
    thePublicKey.serialization,
    thePublicKey.size,
    message.serialization
  );
  logTestCentralPU << "Verification of signature (expected 1): " << (int) signatureResult[0] << Logger::endL;
  theSignature.serialization[4] = 5;
  signatureResult[0] = 3;
  CryptoEC256k1::verifySignatureDefaultBuffers(
    &signatureResult[0],
    theSignature.serialization,
    theSignature.size,
    thePublicKey.serialization,
    thePublicKey.size,
    message.serialization
  );
  logTestCentralPU << "Verification of a signature that's been tampered with (expected 0): " << (int) signatureResult[0] << Logger::endL;
  theSignature.reset();
  CryptoEC256k1GPU::signMessageDefaultBuffers(
    theSignature.serialization,
    &theSignature.size,
    theKey.nonceMustChangeAfterEverySignature.serialization,
    theKey.key.serialization,
    message.serialization,
    0,
    theGPU
  );
  theSignature.ComputeScalarsFromSerialization();
  logTestGraphicsPU << "Signature:\n" << theSignature.toString() << Logger::endL;
  thePublicKey.reset();
  if (!CryptoEC256k1GPU::generatePublicKeyDefaultBuffers(
    thePublicKey.serialization,
    &thePublicKey.size,
    theKey.key.serialization,
    theGPU
  )) {
    logTestGraphicsPU << "ERROR: generatePublicKey returned false. " << Logger::endL;
  }
  logTestGraphicsPU << "Public key:\n" << thePublicKey.toString() << Logger::endL;
  signatureResult[0] = 3;
  if (!CryptoEC256k1GPU::verifySignatureDefaultBuffers(
    &signatureResult[0],
    theSignature.serialization,
    theSignature.size,
    thePublicKey.serialization,
    thePublicKey.size,
    message.serialization,
    theGPU
  )) {
    logTestGraphicsPU << "ERROR: verifySignature returned false. " << Logger::endL;
  }
  logTestGraphicsPU << "Verification of signature (expected 1): " << (int) signatureResult[0] << Logger::endL;
  theSignature.serialization[4] = 5;
  signatureResult[0] = 3;
  if (!CryptoEC256k1GPU::verifySignatureDefaultBuffers(
    &signatureResult[0],
    theSignature.serialization,
    theSignature.size,
    thePublicKey.serialization,
    thePublicKey.size,
    message.serialization,
    theGPU
  )) {
    logTestGraphicsPU << "ERROR: verifySignature returned false. " << Logger::endL;
  }
  logTestGraphicsPU << "Verification of a signature that's been tampered with (expected 0): " << (int) signatureResult[0] << Logger::endL;
  return true;
}

bool testSHA256(GPU& theGPU);

bool testSign(GPU& theGPU);
bool testBasicOperations(GPU& theGPU){
  CryptoEC256k1::testSuite1BasicOperationsDefaultBuffers();
  testPrintMemoryPoolGeneral(CryptoEC256k1::bufferTestSuite1BasicOperations, "Central PU", logTestCentralPU);

  CryptoEC256k1GPU::testSuite1BasicOperationsDefaultBuffers(theGPU);
  testPrintMemoryPoolGeneral(theGPU.bufferTestSuite1BasicOperations, "Graphics PU", logTestGraphicsPU);
  return true;
}

bool testGPU(GPU& inputGPU) {
  //theGPU.flagTurnOffToDebugCPU = true;
  //if (!testBasicOperations(theGPU))
  //  return - 1;
  if (!testMainPart1ComputeContexts(inputGPU))
    return false;
  if (!testMainPart2Signatures(inputGPU))
    return false;
  if (!testSHA256(inputGPU))
    return false;
  if (!testSign(inputGPU))
    return false;
  return true;
}

int testMain() {
  GPU theGPU;
  GPU theOpenCLCPU;
  theOpenCLCPU.theDesiredDeviceType = CL_DEVICE_TYPE_CPU;
  if (! testGPU(theGPU)) {
    return - 1;
  }
  if (! testGPU(theOpenCLCPU)) {
    return - 1;
  }
  return 0;
}

class testerSHA256 {
public:
  std::vector<std::vector<std::string> > knownSHA256s;
  std::string inputBuffer;
  std::vector<unsigned char> outputBuffer;
  std::vector<uint> messageStarts;
  std::vector<uint> messageLengths;
  std::vector<unsigned char> messageStartsUChar;
  std::vector<unsigned char> messageLengthsUChar;
  void initialize();
  unsigned totalToCompute;
};


void testerSHA256::initialize() {
  this->totalToCompute = 100000;
  this->outputBuffer.resize(12000000);
  this->knownSHA256s.push_back((std::vector<std::string>) {
    "abc",
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  });
  this->knownSHA256s.push_back((std::vector<std::string>) {
    "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
    "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"
  });
  this->knownSHA256s.push_back((std::vector<std::string>) {
   "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu",
   "cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1"
  });
  this->inputBuffer.reserve(100 * this->totalToCompute);
  this->inputBuffer.clear();
  this->messageStartsUChar.resize(4 * this->totalToCompute);
  this->messageLengthsUChar.resize(4 * this->totalToCompute);
  for (unsigned i = 0; i < this->totalToCompute; i ++) {
    unsigned testCounter = i % this->knownSHA256s.size();
    std::string& currentMessage = this->knownSHA256s[testCounter][0];
    this->messageStarts.push_back(this->inputBuffer.size());
    this->messageLengths.push_back(currentMessage.size());

    memoryPool_write_uint((uint32_t) this->inputBuffer.size(), &(this->messageStartsUChar[i * 4]));
    memoryPool_write_uint((uint32_t) currentMessage.size(), &(this->messageLengthsUChar[i * 4]));

    this->inputBuffer.append(currentMessage);
    for (unsigned j = 0; j < 32; j ++) {
      this->outputBuffer[i * 32 + j] = 0;
    }
  }
  //for (unsigned i = 0; i < 100 ; i++)
  //  std::cout << "Byte " << i << ": " << (int) this->messageLengthsUChar[i] << std::endl;
  //for (unsigned i = 0; i < 100 ; i++)
  //  std::cout << "Offset Byte " << i << ": " << (int) this->messageStartsUChar[i] << std::endl;
  //for (unsigned i = 0; i < 100 ; i++)
  //  std::cout << "message Byte " << i << ": " << (int) this->inputBuffer[i] << std::endl;
}

bool testSHA256(GPU& theGPU) {
  // Create the two input vectors
  std::shared_ptr<GPUKernel> theKernel = theGPU.getKernel(GPU::kernelSHA256);
  if (!theKernel->build()) {
    std::cout << "DEBUG: failed to build sha kernel. " << std::endl;
    assert(false);
  }
  testerSHA256 theSHA256Test;
  theSHA256Test.initialize();

  auto timeStart = std::chrono::system_clock::now();
  uint32_t largeTestCounter = 0;
  uint32_t grandTotal = 0;
  std::cout << "DEBUG: before write" << std::endl;
  if (!theKernel->writeToBuffer(4, theSHA256Test.inputBuffer)) {
    logTestGraphicsPU << "Bad write" << Logger::endL;
    assert(false);
  }
  std::cout << "DEBUG: before vector? write" << std::endl;
  if (!theKernel->writeToBuffer(1, theSHA256Test.messageStartsUChar)){
    logTestGraphicsPU << "Bad write" << Logger::endL;
    assert(false);
  }
  if (!theKernel->writeToBuffer(2, theSHA256Test.messageLengthsUChar)) {
    logTestGraphicsPU << "Bad write" << Logger::endL;
    assert(false);
  }
  int numPasses = 10;
  cl_mem& result = theKernel->getOutput(0)->theMemory;
  for (int i = 0; i < numPasses; i++) {
    for (largeTestCounter = 0; largeTestCounter < theSHA256Test.totalToCompute; largeTestCounter ++) {
      grandTotal ++;
      if (!theKernel->writeArgument(3, largeTestCounter)) {
        logTestGraphicsPU << "Bad write" << Logger::endL;
        assert(false);
      }
      //theKernel->writeToBuffer(0, &theLength, sizeof(uint));
      //std::cout << "DEBUG: Setting arguments ... " << std::endl;
      //std::cout << "DEBUG: arguments set, enqueueing kernel... " << std::endl;
      cl_int ret = clEnqueueNDRangeKernel(
        theGPU.commandQueue,
        theKernel->kernel,
        3,
        NULL,
        theKernel->global_item_size,
        theKernel->local_item_size,
        0,
        NULL,
        NULL
      );
      if (ret != CL_SUCCESS) {
        logTestGraphicsPU << "Failed to enqueue kernel. Return code: " << ret << ". " << Logger::endL;
        return false;
      }
      //std::cout << "DEBUG: kernel enqueued, proceeding to read buffer. " << std::endl;
      if (largeTestCounter % 500 == 0) {
        auto timeCurrent = std::chrono::system_clock::now();
        std::chrono::duration<double> elapsed_seconds = timeCurrent - timeStart;
        std::cout << "Scheduled grand total: " << grandTotal << " sha256s in " << elapsed_seconds.count() << " second(s). " << std::endl;
      }
    }
    //logTestGraphicsPU << "Total to extract: " << 32 * theSHA256Test.totalToCompute << Logger::endL;
    cl_int ret = clEnqueueReadBuffer (
      theGPU.commandQueue,
      result,
      CL_TRUE,
      0,
      32 * theSHA256Test.totalToCompute,
      &theSHA256Test.outputBuffer[0],
      0,
      NULL,
      NULL
    );
    if (ret != CL_SUCCESS) {
      logTestGraphicsPU << "Failed to enqueue read buffer. Return code: " << ret << ". " << Logger::endL;
      return false;
    }
  }
  auto timeCurrent = std::chrono::system_clock::now();
  std::chrono::duration<double> elapsed_seconds = timeCurrent - timeStart;
  logTestGraphicsPU << "Computed " << grandTotal
  << " sha256s in " << elapsed_seconds.count() << " second(s). " << Logger::endL;
  logTestGraphicsPU << "Speed: " << (grandTotal / elapsed_seconds.count()) << " hashes per second. " << Logger::endL;
  logTestGraphicsPU << "Checking computations ..." << Logger::endL;
  for (largeTestCounter = 0; largeTestCounter < theSHA256Test.totalToCompute; largeTestCounter ++) {
    unsigned testCounteR = largeTestCounter % theSHA256Test.knownSHA256s.size();
    std::stringstream out;
    unsigned offset = largeTestCounter * 32;
    for (unsigned i = offset; i < offset + 32; i ++) {
      out << std::hex << std::setw(2) << std::setfill('0') << ((int) ((unsigned) theSHA256Test.outputBuffer[i]));
    }
    if (out.str() != theSHA256Test.knownSHA256s[testCounteR][1]) {
      logTestGraphicsPU << "\e[31mSha of message index " << largeTestCounter
      << ": " << theSHA256Test.knownSHA256s[testCounteR][0] << " is wrongly computed to be: " << out.str()
      << " instead of: " << theSHA256Test.knownSHA256s[testCounteR][1] << "\e[39m" << Logger::endL;
      assert(false);
      return false;
    }
  }
  logTestGraphicsPU << "Success!" << Logger::endL;
  std::cout << "\e[32mSuccess!\e[39m" << std::endl;
  return true;
}

class testSignatures {
public:
  std::vector<unsigned char> messages;
  std::vector<unsigned char> nonces;
  std::vector<unsigned char> secretKeys;
  std::vector<unsigned char> outputSignatures;
  unsigned numMessagesPerPipeline;
  void initialize();
};

unsigned char getByte(unsigned char byte1, unsigned char byte2, unsigned char byte3) {
  return byte1 * byte1 * (byte1 + 3) + byte2 * 7 + byte3 * 3 + 5 + byte1 * byte3;
}

void testSignatures::initialize() {
  this->numMessagesPerPipeline = 10000;
  unsigned totalPipelineSize = this->numMessagesPerPipeline * 32;
  int totalOutputSize = this->numMessagesPerPipeline * 80;
  this->messages.resize(totalPipelineSize);
  this->nonces.resize(totalPipelineSize);
  this->secretKeys.resize(totalPipelineSize);
  this->outputSignatures.resize(totalOutputSize);
  this->messages[0] = 'a';
  this->messages[1] = 'b';
  this->messages[2] = 'c';
  this->nonces[0] = 'e';
  this->nonces[1] = 'f';
  this->nonces[2] = 'g';
  this->secretKeys[0] = 'h';
  this->secretKeys[1] = 'i';
  this->secretKeys[2] = 'j';
  for (unsigned i = 3; i < totalPipelineSize; i ++) {
    this->messages[i] = getByte(this->messages[i - 1], this->messages[i - 2], this->nonces[i - 3]);
    this->nonces[i] = getByte(this->nonces[i - 1], this->nonces[i - 2], this->secretKeys[i - 3]);
    this->secretKeys[i] = getByte(this->secretKeys[i - 1], this->secretKeys[i - 2], this->messages[i - 3]);
  }
}

bool testSign(GPU& theGPU) {
  // Create the two input vectors
  theGPU.initializeAllNoBuild();
  CryptoEC256k1GPU::computeGeneratorContextDefaultBuffers(theGPU);
  // Create a command queue
  std::shared_ptr<GPUKernel> kernelSign = theGPU.theKernels[GPU::kernelSign];
  if (!kernelSign->build()) {
    return false;
  }
  std::cout << "DEBUG: about to write to buffer. " << std::endl;
  testSignatures theTest;
  theTest.initialize();

  auto timeStart = std::chrono::system_clock::now();
  unsigned counterTest;

  kernelSign->writeToBuffer(2, &theTest.nonces[0], theTest.nonces.size() );
  kernelSign->writeToBuffer(3, &theTest.secretKeys[0], theTest.secretKeys.size());
  kernelSign->writeToBuffer(4, &theTest.messages[0], theTest.messages.size());
  for (counterTest = 0; counterTest < theTest.numMessagesPerPipeline; counterTest ++) {
    kernelSign->writeArgument(6, counterTest);
    //theKernel->writeToBuffer(0, &theLength, sizeof(uint));
    //std::cout << "DEBUG: Setting arguments ... " << std::endl;
    //std::cout << "DEBUG: arguments set, enqueueing kernel... " << std::endl;
    cl_int ret = clEnqueueNDRangeKernel(
      theGPU.commandQueue,
      kernelSign->kernel,
      1,
      NULL,
      kernelSign->global_item_size,
      kernelSign->local_item_size,
      0,
      NULL,
      NULL
    );
    if (ret != CL_SUCCESS) {
      logTestGraphicsPU << "Failed to enqueue kernel. Return code: " << ret << ". " << Logger::endL;
      return false;
    }
    //std::cout << "DEBUG: kernel enqueued, proceeding to read buffer. " << std::endl;
    if (counterTest % 100 == 0) {
      auto timeCurrent = std::chrono::system_clock::now();
      std::chrono::duration<double> elapsed_seconds = timeCurrent - timeStart;
      std::cout << "Scheduled " << counterTest << " 32-byte messages in " << elapsed_seconds.count() << " second(s),"
      << " current speed: "
      << ((counterTest + 1) / elapsed_seconds.count()) << " signature(s) per second." << std::endl;
    }
  }
  cl_mem& result = kernelSign->getOutput(0)->theMemory;
  cl_int ret = clEnqueueReadBuffer (
    theGPU.commandQueue,
    result,
    CL_TRUE,
    0,
    theTest.outputSignatures.size(),
    &theTest.outputSignatures[0],
    0,
    NULL,
    NULL
  );
  if (ret != CL_SUCCESS) {
    logTestGraphicsPU << "Failed to enqueue read buffer. Return code: " << ret << ". " << Logger::endL;
    return false;
  }
  auto timeCurrent = std::chrono::system_clock::now();
  std::chrono::duration<double> elapsed_seconds = timeCurrent - timeStart;
  logTestGraphicsPU << "Signed " << counterTest << " 32-byte messages in " << elapsed_seconds.count() << " second(s). " << Logger::endL;
  logTestGraphicsPU << "Speed: "
  << (theTest.numMessagesPerPipeline / elapsed_seconds.count()) << " signature(s) per second." << Logger::endL;

  logTestGraphicsPU << "Checking computations ... NOT IMPLEMENTED YET!" << Logger::endL;
  /*for (largeTestCounter = 0; largeTestCounter < testSHA256::totalToCompute; largeTestCounter ++) {
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
  }*/
  logTestGraphicsPU << "Success!" << Logger::endL;
  std::cout << "\e[32mSuccess!\e[39m" << std::endl;
  return true;
}
