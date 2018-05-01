// This file is inteded serves as a header
// prepended at in front of 
// secp256k1.cl
// making it a valid openCL program.

#ifndef MACRO_USE_openCL
#define MACRO_USE_openCL

#define uint32_t uint
#define uint64_t ulong

#define VERIFY_CHECK(arg)
#define NULL 0
#endif //MACRO_USE_openCL

__kernel void sha256GPU(
  __global const unsigned char* signatureR, 
  __global const unsigned char* signatureS, 
  __global const unsigned char* publicKey, 
  __global const unsigned char* message,
  __global const unsigned char* output
) {

}

#include "./../opencl/cl/secp256k1.cl"

