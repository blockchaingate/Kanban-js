#ifndef SECP256K1_CPP_H_header
#include "secp256k1_opencl.h"
//<- header file incompatible with secp256k1_cpp.h
//This header structure arose through
//hunting for the bug described in the include guard 
//inside of secp256k1.cl.
//To do: make the header file structure more intuitive.
#endif 

//__constant static const char messageGeneratorContext1[50] = "initialized mempool.\0";
//__constant const char messageB[22] = "initialized mempool.\0";
//__constant const char messageC[18] = "Entering kernel.\0";
__kernel void secp256k1_opencl_compute_generator_context(
  __global unsigned char* outputMemoryPoolContainingGeneratorContext
) {
//  printf("%s\n", "\nHere I am");
//  int debugWarning;
//  memoryPool_writeString(messageC, 18, outputMemoryPoolContainingGeneratorContext);
//  printf("%s\n", "\nHere I am pt2");
  memoryPool_initialize(MACRO_MEMORY_POOL_SIZE_GeneratorContext - 100, outputMemoryPoolContainingGeneratorContext);
//  printf("%s\n", "\nHere I am pt3");
//  memoryPool_writeString(messageB, 22, outputMemoryPoolContainingGeneratorContext);
//  printf("%s\n", "\nHere I am pt4");
//  return;
  memoryPool_writeCurrentSizeAsOutput(0, outputMemoryPoolContainingGeneratorContext);

  __global secp256k1_ecmult_gen_context* generatorContext = (__global secp256k1_ecmult_gen_context*) checked_malloc(
    sizeof_secp256k1_ecmult_gen_context(), outputMemoryPoolContainingGeneratorContext
  ); 
  generatorContext->prec = NULL;
   
  secp256k1_ecmult_gen_context_build(generatorContext, outputMemoryPoolContainingGeneratorContext);
}

#include "secp256k1_implementation.h"
