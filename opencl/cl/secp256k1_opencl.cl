// This file is inteded as a pre-processor tool
// for converting the program secp256k1.cl
// into an openCL program.


#define MACRO_USE_openCL

#define uint32_t uint
#define uint64_t ulong

#define VERIFY_CHECK(arg)
#define NULL 0


#define ___static__constant __constant

#include "../opencl/cl/secp256k1.h"

void free(void* input){
  
}

void* checked_malloc(const secp256k1_callback* cb, size_t size) {
  return NULL;
}


__kernel void secp256k1_opencl(
  __global unsigned char* output,
  __global unsigned char* theContext,
  __global unsigned char* signatureR,  
  __global unsigned char* signatureS, 
  __global unsigned char* publicKey, 
  __global unsigned char* message
) {
  unsigned char comments[1005];
  unsigned char result;
  result = (unsigned char) secp256k1_ecdsa_sig_verify__global__global(
    (__global const secp256k1_ecmult_context*) theContext, 
    (__global const secp256k1_scalar *) signatureR, 
    (__global const secp256k1_scalar *) signatureS, 
    (__global const secp256k1_ge *) publicKey, 
    (__global const secp256k1_scalar *) message,
    comments
  );
  int i;
  for (i = 0; i < 32 * 3 + 1; i++) {
    output[i] = comments[i];
  } 
  output[0] = result;
}

#include "../opencl/cl/secp256k1.cl"
