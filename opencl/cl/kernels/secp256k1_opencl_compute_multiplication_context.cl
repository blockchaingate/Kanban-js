__kernel void secp256k1_opencl_compute_multiplication_context(
  __global unsigned char* outputMemoryPoolContainingMultiplicationContext
) {
  return;
  initializeMemoryPool(9000000, outputMemoryPoolContainingMultiplicationContext);
  writeStringToMemoryPoolLog("DEBUG: initialized memory pool.\0", outputMemoryPoolContainingMultiplicationContext);
  __global secp256k1_ecmult_context* multiplicationContext = (__global secp256k1_ecmult_context*) checked_malloc(sizeof(secp256k1_ecmult_context), outputMemoryPoolContainingMultiplicationContext);
  multiplicationContext->pre_g = NULL;
  writeStringToMemoryPoolLog("DEBUG: initialized multiplication context pointer.\0", outputMemoryPoolContainingMultiplicationContext);
  secp256k1_ecmult_context_build(multiplicationContext, outputMemoryPoolContainingMultiplicationContext);
}
