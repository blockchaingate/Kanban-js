#ifndef SECP256K1_CPP_H_header
#include "../opencl/cl/secp256k1_opencl.h"
//<- header file incompatible with secp256k1_cpp.h
//This weird header structure arose through
//hunting for the bug described in the include guard
//inside of secp256k1.cl.
//To do: make the header file structure more intuitive.
#endif

__constant static const char messageGeneratorContext1[50] = "initialized mempool.\0";

__kernel void secp256k1_opencl_compute_generator_context(
  __global unsigned char* outputMemoryPoolContainingGeneratorContext
) {
  initializeMemoryPool(1000000, outputMemoryPoolContainingGeneratorContext);
  writeStringToMemoryPoolLog(messageGeneratorContext1, outputMemoryPoolContainingGeneratorContext);
  
  writeCurrentMemoryPoolSizeAsOutput(0, outputMemoryPoolContainingGeneratorContext);

  __global secp256k1_ecmult_gen_context* generatorContext = (__global secp256k1_ecmult_gen_context*) checked_malloc(
    sizeof(secp256k1_ecmult_gen_context), outputMemoryPoolContainingGeneratorContext
  );
  generatorContext->prec = NULL;

  secp256k1_ecmult_gen_context_build(generatorContext, outputMemoryPoolContainingGeneratorContext);
}

#include "../opencl/cl/secp256k1.cl"
