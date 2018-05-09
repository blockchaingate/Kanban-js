__kernel void secp256k1_opencl_compute_generator_context(
  __global unsigned char* outputMemoryPoolContainingGeneratorContext
) {
  (void) outputMemoryPoolContainingGeneratorContext;
  //secp256k1_ecmult_gen_context_build(
  //  (__global secp256k1_ecmult_gen_context*) outputMemoryPoolContainingGeneratorContext
  //);
}
