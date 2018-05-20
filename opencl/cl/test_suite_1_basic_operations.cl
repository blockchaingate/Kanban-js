#ifndef SECP256K1_CPP_H_header
#include "../opencl/cl/secp256k1_opencl.h"
//<- header file incompatible with secp256k1_cpp.h
//This header structure arose through
//hunting for the bug described in the include guard
//inside of secp256k1.cl.
//To do: make the header file structure more intuitive.
#endif


//WARNING: do not move this function, or you may trigger
//undocumented openCL behavior.
//See the notes near the include guard inside of secp256k1.cl for more details.
__kernel void test_suite_1_basic_operations(
  __global unsigned char* memoryPool
) {
  memoryPool_initialize(MACRO_MEMORY_POOL_SIZE_MultiplicationContext - 100, memoryPool);

  uint64_t c, d;
  uint64_t u0;
  const uint32_t M = 0x3FFFFFFUL;
  const uint32_t R0 = 0x3D10UL;
  const uint32_t R1 = 0x400UL;
  secp256k1_fe output;
  for (int i = 0; i < 10; i++) {
    output.n[i] = 0;
  }
  c =  0x0008d0cc18acaa40UL;
  u0 = 0x0000000002b9b051UL;
  output.n[8] = (uint32_t) ((uint64_t) c);
  output.n[9] = (uint32_t) (((uint64_t) c) >> 32);
  memoryPool_write_fe_asOutput(& output, - 1 , memoryPool);
  output.n[8] = (uint32_t) ((uint64_t) R0);
  output.n[9] = (uint32_t) (((uint64_t) R0) >> 32);
  memoryPool_write_fe_asOutput(& output, - 1 , memoryPool);
  output.n[8] = (uint32_t) ((uint64_t) u0);
  output.n[9] = (uint32_t) (((uint64_t) u0) >> 32);
  memoryPool_write_fe_asOutput(&output, - 1, memoryPool);

  c += u0 * ((uint64_t) R0);

  output.n[8] = (uint32_t) ((uint64_t) c);
  output.n[9] = (uint32_t) (((uint64_t) c) >> 32);
  memoryPool_write_fe_asOutput(&output, - 1 , memoryPool);
}



#include "../opencl/cl/secp256k1.cl"
