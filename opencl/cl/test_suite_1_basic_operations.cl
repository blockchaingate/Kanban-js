#ifndef SECP256K1_CPP_H_header
#include "../opencl/cl/secp256k1_opencl.h"
//<- header file incompatible with secp256k1_cpp.h
//This header structure arose through
//hunting for the bug described in the include guard
//inside of secp256k1.cl.
//To do: make the header file structure more intuitive.
#endif



/** Generator for secp256k1, value 'g' defined in
 *  "Standards for Efficient Cryptography" (SEC2) 2.7.1.
 */
#ifndef DEFINED_ALREADY_secp256k1_ge_const_g
#define DEFINED_ALREADY_secp256k1_ge_const_g
___static__constant secp256k1_ge secp256k1_ge_const_g = SECP256K1_GE_CONST(
    0x79BE667EUL, 0xF9DCBBACUL, 0x55A06295UL, 0xCE870B07UL,
    0x029BFCDBUL, 0x2DCE28D9UL, 0x59F2815BUL, 0x16F81798UL,
    0x483ADA77UL, 0x26A3C465UL, 0x5DA4FBFCUL, 0x0E1108A8UL,
    0xFD17B448UL, 0xA6855419UL, 0x9C47D08FUL, 0xFB10D4B8UL
);
#endif


//WARNING: do not move this function, or you may trigger
//undocumented openCL behavior.
//See the notes near the include guard inside of secp256k1.cl for more details.
__kernel void test_suite_1_basic_operations(
  __global unsigned char* memoryPool
) {
  memoryPool_initialize(MACRO_MEMORY_POOL_SIZE_MultiplicationContext - 100, memoryPool);
  memoryPool_writeCurrentSizeAsOutput(0, memoryPool);
  __global secp256k1_ecmult_context* multiplicationContext = (__global secp256k1_ecmult_context*) checked_malloc(
    sizeof_secp256k1_ecmult_context(),
    memoryPool
  );
  multiplicationContext->pre_g = NULL; 
  memoryPool_writeCurrentSizeAsOutput(1, memoryPool);
  multiplicationContext->pre_g = (__global secp256k1_ge_storage (*)[]) checked_malloc(
    ECMULT_TABLE_SIZE(WINDOW_G) * sizeof_secp256k1_ge_storage(),
    memoryPool
  );
  unsigned int n = ECMULT_TABLE_SIZE(WINDOW_G);
  __global secp256k1_gej* prej = (__global secp256k1_gej*) checked_malloc(sizeof_secp256k1_gej() * n, memoryPool);
  __global secp256k1_ge* prea  = (__global secp256k1_ge*)  checked_malloc(sizeof_secp256k1_ge()  * n, memoryPool);
  __global secp256k1_fe* zr    = (__global secp256k1_fe*)  checked_malloc(sizeof_secp256k1_fe()  * n, memoryPool);
//  secp256k1_ecmult_context_build(multiplicationContext, memoryPool);

  secp256k1_gej generatorProjective;

  /* get the generator */
  //openCL note: secp256k1_ge_const_g is always in the __constant address space.
  secp256k1_gej_set_ge__constant(&generatorProjective, &secp256k1_ge_const_g);
  memoryPool_write_gej_asOutput(&generatorProjective, - 1, memoryPool);


  uint32_t a[10];
  uint32_t r[10];


  int debugWarning;
  uint64_t c, d;
  uint64_t u0, u1, u2, u3, u4, u5, u6, u7, u8;
  uint32_t t9, t0, t1, t2, t3, t4, t5, t6, t7;
  const uint32_t M = 0x3FFFFFFUL, R0 = 0x3D10UL, R1 = 0x400UL;

  int debugWarning4;
  secp256k1_fe outputTemp;
  for (int counter = 0; counter < 10; counter ++) {
    r[counter] = 0;
    a[counter] = generatorProjective.x.n[counter];
    outputTemp.n[counter] = 0;
  }
  memoryPool_write_fe_asOutput(& outputTemp, - 1 , memoryPool);

  /** [... a b c] is a shorthand for ... + a<<52 + b<<26 + c<<0 mod n.
   *  px is a shorthand for sum(a[i]*a[x-i], i=0..x).
   *  Note that [x 0 0 0 0 0 0 0 0 0 0] = [x*R1 x*R0].
   */

  d = (uint64_t)(a[0]*2) * a[9]
    + (uint64_t)(a[1]*2) * a[8]
    + (uint64_t)(a[2]*2) * a[7]
    + (uint64_t)(a[3]*2) * a[6]
    + (uint64_t)(a[4]*2) * a[5];
    /* [d 0 0 0 0 0 0 0 0 0] = [p9 0 0 0 0 0 0 0 0 0] */
  t9 = d & M;
  d >>= 26;
  /* [d t9 0 0 0 0 0 0 0 0 0] = [p9 0 0 0 0 0 0 0 0 0] */

  c  = ((uint64_t) a[0] ) * ((uint64_t) a[0]);


  //outputTemp.n[1] = c;
  //outputTemp.n[8] = (uint32_t) c ;
  //outputTemp.n[9] = (uint32_t) (c >> 32) ;



  /* [d t9 0 0 0 0 0 0 0 0 c] = [p9 0 0 0 0 0 0 0 0 p0] */
  d += (uint64_t)(a[1] * 2) * a[9]
    + (uint64_t)(a[2] * 2) * a[8]
    + (uint64_t)(a[3] * 2) * a[7]
    + (uint64_t)(a[4] * 2) * a[6]
    + (uint64_t)a[5] * a[5];


  /* [d t9 0 0 0 0 0 0 0 0 c] = [p10 p9 0 0 0 0 0 0 0 0 p0] */
  u0 = d & ((uint64_t) M);



  d >>= 26;

  outputTemp.n[8] = (uint32_t) ((uint64_t) c);
  outputTemp.n[9] = (uint32_t) (((uint64_t) c) >> 32);
  memoryPool_write_fe_asOutput(& outputTemp, - 1 , memoryPool);
  outputTemp.n[8] = (uint32_t) ((uint64_t) R0);
  outputTemp.n[9] = (uint32_t) (((uint64_t) R0) >> 32);
  memoryPool_write_fe_asOutput(& outputTemp, - 1 , memoryPool);
  outputTemp.n[8] = (uint32_t) ((uint64_t) u0);
  outputTemp.n[9] = (uint32_t) (((uint64_t) u0) >> 32);
  memoryPool_write_fe_asOutput(& outputTemp, - 1 , memoryPool);

  c += u0 * ((uint64_t) R0);

  outputTemp.n[8] = (uint32_t) ((uint64_t) c);
  outputTemp.n[9] = (uint32_t) (((uint64_t) c) >> 32);
  memoryPool_write_fe_asOutput(& outputTemp, - 1 , memoryPool);
  int debugWarningN;
  return;










  

}



#include "../opencl/cl/secp256k1.cl"
