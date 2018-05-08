#include "../opencl/cl/secp256k1_opencl.h"

__kernel void secp256k1_opencl_compute_generator_context(
  __global unsigned char* outputMemoryPoolContainingGeneratorContext
) {
  secp256k1_ecmult_gen_context_build(
    (__global secp256k1_ecmult_gen_context*) outputMemoryPoolContainingGeneratorContext
  );
}

#include "../opencl/cl/secp256k1.cl"
