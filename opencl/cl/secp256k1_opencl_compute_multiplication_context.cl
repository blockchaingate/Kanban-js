#include "../opencl/cl/secp256k1_opencl.h"

__kernel void secp256k1_opencl_compute_multiplication_context(
  __global unsigned char* outputMemoryPoolContainingMultiplicationContext
) {
  initializeMemoryPool(9000000, outputMemoryPoolContainingMultiplicationContext);
  __global secp256k1_ecmult_context* multiplicationContext = checked_malloc(sizeof(secp256k1_ecmult_context), outputMemoryPoolContainingMultiplicationContext);
  secp256k1_ecmult_context_build(multiplicationContext, outputMemoryPoolContainingMultiplicationContext);
}

#include "../opencl/cl/secp256k1.cl"
