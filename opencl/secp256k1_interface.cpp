#include "secp256k1_interface.h"
#include "cl/secp256k1_cpp.h"

void Secp256k1::computeMultiplicationContext(unsigned char* outputMemoryPool) {
  secp256k1_opencl_compute_multiplication_context(outputMemoryPool);
}

void Secp256k1::computeGeneratorContext(unsigned char* outputMemoryPool) {
  secp256k1_opencl_compute_generator_context(outputMemoryPool);
}
