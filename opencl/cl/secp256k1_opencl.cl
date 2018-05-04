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


__kernel void secp256k1_opencl(
  __global unsigned char* output,
  __global secp256k1_ecmult_context* theContext,
  __global unsigned char* signatureR,  
  __global unsigned char* signatureS, 
  __global unsigned char* publicKey, 
  __global unsigned char* message
) {
  *output = secp256k1_ecdsa_sig_verify__global__global(
    theContext, 
    (__global const secp256k1_scalar *) signatureR, 
    (__global const secp256k1_scalar *) signatureS, 
    (__global const secp256k1_ge *) publicKey, 
    (__global const secp256k1_scalar *) message
  );
}

#include "../opencl/cl/secp256k1.cl"
