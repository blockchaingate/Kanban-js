#ifndef SECP256K1_INTERFACE_H_header
#define SECP256K1_INTERFACE_H_header
#include "gpu.h"

class Secp256k1GPU{
public:
  static void computeMultiplicationContext(unsigned char* outputMemoryPool, GPU& theGPU);
  static void computeGeneratorContext(unsigned char* outputMemoryPool, GPU& theGPU);
};

class Secp256k1{
public:
  static void computeMultiplicationContext(unsigned char* outputMemoryPool);
  static void computeGeneratorContext(unsigned char* outputMemoryPool);
};

#endif //SECP256K1_INTERFACE_H_header
