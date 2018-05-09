//__constant static const char message1[33] = "DEBUG: initialized memory pool.\0";
__kernel void secp256k1_opencl_compute_multiplication_context(
  __global unsigned char* outputMemoryPoolContainingMultiplicationContext
) {
  unsigned int i;
  unsigned int totalSize = 1000000;
  //writeToMemoryPool(totalSize, outputMemoryPoolContainingMultiplicationContext);
  //writeToMemoryPool(12, &outputMemoryPoolContainingMultiplicationContext[4]);
  //writeToMemoryPool(0, &outputMemoryPoolContainingMultiplicationContext[8]);
  for (i = 0; i < totalSize; i ++){
    outputMemoryPoolContainingMultiplicationContext[i] = (unsigned char) 0;
    //writeToMemoryPool(i, &outputMemoryPoolContainingMultiplicationContext[i]);
  }

  
  //int i;
  //for (i = 0; i < 100000; i++)
  //  outputMemoryPoolContainingMultiplicationContext[i] = (unsigned char) 0;
  
  //initializeMemoryPool(0x895440UL, outputMemoryPoolContainingMultiplicationContext);
  //writeStringToMemoryPoolLog(message1, 31, outputMemoryPoolContainingMultiplicationContext);
  return;
  __global secp256k1_ecmult_context* multiplicationContext = (__global secp256k1_ecmult_context*) checked_malloc(sizeof(secp256k1_ecmult_context), outputMemoryPoolContainingMultiplicationContext);
  multiplicationContext->pre_g = NULL;
  writeStringToMemoryPoolLog("DEBUG: initialized multiplication context pointer.\0", 51, outputMemoryPoolContainingMultiplicationContext);
  secp256k1_ecmult_context_build(multiplicationContext, outputMemoryPoolContainingMultiplicationContext);
}
