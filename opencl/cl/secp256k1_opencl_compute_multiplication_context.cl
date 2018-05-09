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
__kernel void secp256k1_opencl_compute_multiplication_context(
  __global char* outputMemoryPoolContainingMultiplicationContext
) {
  unsigned int i;
  unsigned int totalSize = 1000;
  //writeToMemoryPool(totalSize, outputMemoryPoolContainingMultiplicationContext);
  //writeToMemoryPool(12, &outputMemoryPoolContainingMultiplicationContext[4]);
  //writeToMemoryPool(0, &outputMemoryPoolContainingMultiplicationContext[8]);
  for (i = 0; i < totalSize; i ++){
    outputMemoryPoolContainingMultiplicationContext[i] = 0;
    //writeToMemoryPool(i, &outputMemoryPoolContainingMultiplicationContext[i]);
  }

  
  //int i;
  //for (i = 0; i < 100000; i++)
  //  outputMemoryPoolContainingMultiplicationContext[i] = (unsigned char) 0;
  
  //initializeMemoryPool(0x895440UL, outputMemoryPoolContainingMultiplicationContext);
  //writeStringToMemoryPoolLog(message1, 31, outputMemoryPoolContainingMultiplicationContext);
  return;
  //__global secp256k1_ecmult_context* multiplicationContext = (__global secp256k1_ecmult_context*) checked_malloc(sizeof(secp256k1_ecmult_context), outputMemoryPoolContainingMultiplicationContext);
  //multiplicationContext->pre_g = NULL;
  //writeStringToMemoryPoolLog("DEBUG: initialized multiplication context pointer.\0", 51, outputMemoryPoolContainingMultiplicationContext);
  //secp256k1_ecmult_context_build(multiplicationContext, outputMemoryPoolContainingMultiplicationContext);
}



#include "../opencl/cl/secp256k1.cl"
