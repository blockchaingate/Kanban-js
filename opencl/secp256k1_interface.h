#ifndef SECP256K1_INTERFACE_H_header
#define SECP256K1_INTERFACE_H_header
#include "gpu.h"
#include "cl/secp256k1.h"

//class name starts with "Crypto" instead of secp256k1 to
//shorten the autocomple menu suggestions in (my) IDEs
class CryptoEC256k1GPU {
public:
  //6MB for computing multiplication context.
  static const int memoryMultiplicationContext = MACRO_MEMORY_POOL_SIZE_MultiplicationContext;
  //2MB for computing generator context.
  static const int memoryGeneratorContext = MACRO_MEMORY_POOL_SIZE_GeneratorContext;
  //500KB for signature verification
  static const int memorySignature = MACRO_MEMORY_POOL_SIZE_Signature;
  static bool computeMultiplicationContext(unsigned char* outputMemoryPool, GPU& theGPU);
  static bool computeGeneratorContext(unsigned char* outputMemoryPool, GPU& theGPU);
  static bool generatePublicKey(
    unsigned char* outputPublicKey,
    unsigned int* outputPublicKeySize,
    unsigned char* inputSecretKey,
    GPU& theGPU
  );
  static bool signMessage(
    unsigned char* outputSignatures,
    unsigned int* outputSize,
    unsigned char* outputInputNonce,
    unsigned char* inputMessage,
    unsigned char* inputNonce,
    GPU& theGPU
  );
  static bool verifySignature(
    unsigned char* output,
    const unsigned char* inputSignature,
    const unsigned char* publicKey,
    const unsigned char* message
  );
};

//class name starts with "Crypto" instead of secp256k1 to
//shorten the autocomple menu suggestions in (my) IDEs
class CryptoEC256k1 {
public:
  //The functions below are expected to never return false,
  //however we declare them boolean
  //in order to keep the interface similar to that of CryptoEC256k1GPU.
  static bool computeMultiplicationContext(unsigned char* outputMemoryPool);
  static bool computeGeneratorContext(unsigned char* outputMemoryPool);
  static bool signMessage(
    unsigned char* outputSignature,
    unsigned int* outputSize,
    unsigned char* outputInputNonce,
    unsigned char* inputSecretKey,
    unsigned char* inputMessage,
    unsigned char* inputMemoryPoolGeneratorContext
  );
  static bool verifySignature(
    unsigned char* output,
    unsigned char *outputMemoryPoolSignature,
    const unsigned char* inputSignature,
    unsigned int signatureSize,
    const unsigned char* publicKey,
    unsigned int publicKeySize,
    const unsigned char* message,
    const unsigned char* memoryPoolMultiplicationContext
  );
  static bool generatePublicKey(
    unsigned char* outputPublicKey,
    unsigned int* outputPublicKeySize,
    unsigned char* inputSecretKey,
    unsigned char* inputMemoryPoolGeneratorContext
  );


};

#endif //SECP256K1_INTERFACE_H_header
