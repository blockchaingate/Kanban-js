#ifndef SECP256K1_INTERFACE_H_header
#define SECP256K1_INTERFACE_H_header
#include "gpu.h"
#include "cl/secp256k1.h"

//class name starts with "Crypto" instead of secp256k1 to
//shorten the autocomple menu suggestions in (my) IDEs
class CryptoEC256k1GPU {
public:
  //Initialize multiplication context globally
  //Multiplication context does not change accross runs.
  static bool initializeMultiplicationContext(GPU& theGPU);
  static bool initializeGeneratorContext(GPU& theGPU);

  static bool computeMultiplicationContext(unsigned char* outputMemoryPool, GPU& theGPU);
  static bool computeMultiplicationContextDefaultBuffers(GPU& theGPU);
  static bool computeGeneratorContext(unsigned char* outputMemoryPool, GPU& theGPU);
  static bool computeGeneratorContextDefaultBuffers(GPU& theGPU);
  //Uses theGPU.bufferGeneratorContext.
  //Will initialize if not done already.
  static bool generatePublicKeyDefaultBuffers(
    unsigned char* outputPublicKey,
    unsigned int* outputPublicKeySize,
    unsigned char* inputSecretKey,
    GPU& theGPU
  );
  //Uses theGPU.bufferGeneratorContext.
  //Will initialize if not done already.
  static bool signMessageDefaultBuffers(
    unsigned char* outputSignatures,
    unsigned int* outputSize,
    unsigned char* outputInputNonce,
    unsigned char* inputMessage,
    unsigned char* inputNonce,
    unsigned int inputMessageIndex,
    GPU& theGPU
  );
  static bool verifySignatureDefaultBuffers(
    unsigned char* output,
    const unsigned char* inputSignature,
    unsigned int signatureSize,
    const unsigned char* publicKey,
    unsigned int publicKeySize,
    const unsigned char* message,
    GPU& theGPU
  );
  static bool testSuite1BasicOperations(
    unsigned char* outputMemoryPool, GPU& theGPU
  );
  static bool testSuite1BasicOperationsDefaultBuffers(
    GPU& theGPU
  );
};

//class name starts with "Crypto" instead of secp256k1 to
//shorten the autocomple menu suggestions in (my) IDEs
class CryptoEC256k1 {
public:
  static unsigned char bufferMultiplicationContext[GPU::memoryMultiplicationContext];
  static unsigned char bufferTestSuite1BasicOperations[GPU::memoryMultiplicationContext];
  static unsigned char bufferGeneratorContext[GPU::memoryGeneratorContext];
  static unsigned char bufferSignature[GPU::memorySignature];
  //The functions below are expected to never return false,
  //however we declare them boolean
  //in order to keep the interface similar to that of CryptoEC256k1GPU.
  static bool flagMultiplicationContextComputed;
  static bool flagGeneratorContextComputed;

  static bool testSuite1BasicOperations(unsigned char* outputMemoryPool);
  static bool testSuite1BasicOperationsDefaultBuffers();

  static bool computeMultiplicationContext(unsigned char* outputMemoryPool);
  static bool computeMultiplicationContextDefaultBuffers();
  static bool computeGeneratorContext(unsigned char* outputMemoryPool);
  static bool computeGeneratorContextDefaultBuffers();
  static bool signMessage(
    unsigned char* outputSignature,
    unsigned int* outputSize,
    unsigned char* outputInputNonce,
    unsigned char* inputSecretKey,
    unsigned char* inputMessage,
    unsigned char* inputMemoryPoolGeneratorContext_MUST_BE_INITIALIZED,
    unsigned int inputMessageIndex
  );
  static bool signMessageDefaultBuffers(
    unsigned char* outputSignature,
    unsigned int* outputSize,
    unsigned char* outputInputNonce,
    unsigned char* inputSecretKey,
    unsigned char* inputMessage
  );

  static bool verifySignature(
    unsigned char* output,
    unsigned char* outputMemoryPoolSignature,
    const unsigned char* inputSignature,
    const unsigned int signatureSize,
    const unsigned char* publicKey,
    const unsigned int publicKeySize,
    const unsigned char* message,
    const unsigned char* memoryPoolMultiplicationContext_MUST_BE_INITIALIZED
  );
  static bool verifySignatureDefaultBuffers(
    unsigned char* output,
    const unsigned char* inputSignature,
    unsigned int signatureSize,
    const unsigned char* publicKey,
    unsigned int publicKeySize,
    const unsigned char* message
  );
  static bool generatePublicKey(
    unsigned char* outputPublicKey,
    unsigned int* outputPublicKeySize,
    unsigned char* inputSecretKey,
    unsigned char* inputMemoryPoolGeneratorContext_MUST_BE_INITIALIZED
  );
  static bool generatePublicKeyDefaultBuffers(
    unsigned char* outputPublicKey,
    unsigned int* outputPublicKeySize,
    unsigned char* inputSecretKey
  );
};

class Signature {
public:
  static const int maxSerializationSize = MACRO_size_of_signature + 1;
  secp256k1_scalar r;
  secp256k1_scalar s;
  unsigned char serialization[maxSerializationSize];
  //Max signature size = 33 * 2 + 6 = MACRO_size_of_signature, may be smaller.
  //We reserve an extra byte in case we want to have null-terminated content.
  unsigned int size;
  void ComputeSerializationFromScalars();
  bool ComputeScalarsFromSerialization();
  std::string toString();
  void reset();
};

class GeneratorScalar {
public:
  static const int maxSerializationSize = 33;
  secp256k1_scalar scalar;
  unsigned char serialization[GeneratorScalar::maxSerializationSize];
  //Generator serialization = 32 bytes.
  //We reserve an extra byte in case we want to have null-terminated
  //content.
  void ComputeSerializationFromScalar();
  void ComputeScalarFromSerialization();
  //This is a testing-only function. Do not use otherwise:
  //copying secrets around is not a good idea.
  void TestAssignString(const std::string& input);
  std::string toString();
};

class PrivateKey {
public:
  GeneratorScalar key;
  GeneratorScalar nonceMustChangeAfterEverySignature;
};

class PublicKey {
public:
  static const int maxSerializationSize = 66;
  //1 (type) + 32 (x-coord) + 32 (y-coord) = 65 bytes.
  //We reserve an extra byte in case we want to have null-terminated content.
  unsigned int size;
  unsigned char serialization[PublicKey::maxSerializationSize];
  std::string toString();
  void reset();
};
#endif //SECP256K1_INTERFACE_H_header
