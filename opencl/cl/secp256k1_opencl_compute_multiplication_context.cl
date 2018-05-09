#ifndef SECP256K1_CPP_H_header
#include "../opencl/cl/secp256k1_opencl.h"
//<- header file incompatible with secp256k1_cpp.h
//This weird header structure arose through
//hunting for the bug described in the include guard
//inside of secp256k1.cl.
//To do: make the header file structure more intuitive.
#endif


//WARNING: do not move this function, or you may trigger
//undocumented openCL behavior.
//See the notes near the include guard inside of secp256k1.cl for more details.
__constant static const char message1[50] = "initialized multiplication context pointer.\0";
__kernel void secp256k1_opencl_compute_multiplication_context(
  __global unsigned char* outputMemoryPoolContainingMultiplicationContext
) {
  initializeMemoryPool(5900000, outputMemoryPoolContainingMultiplicationContext);
  __global secp256k1_ecmult_context* multiplicationContext = (__global secp256k1_ecmult_context*) checked_malloc(sizeof(secp256k1_ecmult_context), outputMemoryPoolContainingMultiplicationContext);
  multiplicationContext->pre_g = NULL; 
  writeStringToMemoryPoolLog(message1, outputMemoryPoolContainingMultiplicationContext);
  secp256k1_ecmult_context_build(multiplicationContext, outputMemoryPoolContainingMultiplicationContext);
}



#include "../opencl/cl/secp256k1.cl"
