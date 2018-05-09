#ifndef SECP256K1_CPP_H_header
#include "../opencl/cl/secp256k1_opencl.h"
//<- header file incompatible with secp256k1_cpp.h
//This weird header structure arose through
//hunting for the bug described in the include guard
//inside of secp256k1.cl.
//To do: make the header file structure more intuitive.
#endif

__kernel void secp256k1_opencl_compute_generator_context(
  __global unsigned char* outputMemoryPoolContainingGeneratorContext
) {
  (void) outputMemoryPoolContainingGeneratorContext;
  //secp256k1_ecmult_gen_context_build(
  //  (__global secp256k1_ecmult_gen_context*) outputMemoryPoolContainingGeneratorContext
  //);
}

#include "../opencl/cl/secp256k1.cl"
