#ifndef SECP256K1_CPP_H_header
#include "secp256k1_opencl.h"
//<- header file incompatible with secp256k1_cpp.h
//This header structure arose through
//hunting for the bug described in the include guard
//inside of secp256k1.cl.
//To do: make the header file structure more intuitive.
#endif


//WARNING: do not move this function, or you may trigger
//undocumented openCL behavior.
//See the notes near the include guard inside of secp256k1.cl for more details.
//__constant const char message1[45] = "initialized multiplication context pointer.\0";
//__constant const char message0[22] = "initialized mempool.\0";
//__constant const char messageStart[18] = "Entering kernel.\0";
__kernel void secp256k1_opencl_compute_multiplication_context(
  __global unsigned char* outputMemoryPoolContainingMultiplicationContext
) {
//  int debugWArning;
//  memoryPool_writeString(messageStart, 45, outputMemoryPoolContainingMultiplicationContext);
  memoryPool_initialize(MACRO_MEMORY_POOL_SIZE_MultiplicationContext - 100, outputMemoryPoolContainingMultiplicationContext);
//  memoryPool_writeString(message0, 22, outputMemoryPoolContainingMultiplicationContext);
  memoryPool_writeCurrentSizeAsOutput(0, outputMemoryPoolContainingMultiplicationContext);
//  return;
  __global secp256k1_ecmult_context* multiplicationContext = (__global secp256k1_ecmult_context*) checked_malloc(
    sizeof_secp256k1_ecmult_context(),
    outputMemoryPoolContainingMultiplicationContext
  );
  multiplicationContext->pre_g = NULL; 
//  memoryPool_writeString(message1, 18, outputMemoryPoolContainingMultiplicationContext);
  secp256k1_ecmult_context_build(multiplicationContext, outputMemoryPoolContainingMultiplicationContext);
}

#include "secp256k1.cl"
