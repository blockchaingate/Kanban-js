#ifndef SECP256K1_INTERFACE_H_header
#define SECP256K1_INTERFACE_H_header
#include "gpu.h"

//class name starts with "Crypto" instead of secp256k1 to
//shorten the autocomple menu suggestions in (my) IDEs
class CryptoEC256k1GPU {
public:
  //6MB RAM for computing multiplication context.
  static const int memoryMultiplicationContext = 6000000;
  //2MB RAM for computing generator context.
  static const int memoryGeneratorContext = 2000000;

  static bool computeMultiplicationContext(unsigned char* outputMemoryPool, GPU& theGPU);
  static bool computeGeneratorContext(unsigned char* outputMemoryPool, GPU& theGPU);
};

//class name starts with "Crypto" instead of secp256k1 to
//shorten the autocomple menu suggestions in (my) IDEs
class CryptoEC256k1{
public:
  //The functions below are expected to never return false,
  //however we declare them boolean
  //in order to keep the interface similar to that of CryptoEC256k1GPU.
  static bool computeMultiplicationContext(unsigned char* outputMemoryPool);
  static bool computeGeneratorContext(unsigned char* outputMemoryPool);
};

#endif //SECP256K1_INTERFACE_H_header
