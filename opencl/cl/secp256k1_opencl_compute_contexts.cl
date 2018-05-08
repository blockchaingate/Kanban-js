#include "../opencl/cl/secp256k1_opencl.h"

__kernel void secp256k1_opencl_compute_contexts(
  __global unsigned char* outputMemoryPoolContainingContexts
) {
  initializeMemoryPool(9000000, outputMemoryPoolContainingContexts);
  secp256k1_ecmult_context_build(
     (__global secp256k1_ecmult_context*) (outputMemoryPoolContainingContexts)
  );
//  secp256k1_ecmult_gen_context_build(
//    (__global secp256k1_ecmult_gen_context*) (outputMemoryPoolContainingContexts + 2000000)
//  );
}

#include "../opencl/cl/secp256k1.cl"
