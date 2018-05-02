// This file is inteded as a pre-processor tool
// for converting the program secp256k1.cl
// into an openCL program.

#include "../opencl/cl/secp256k1_opencl_header.h"

__kernel void secp256k1_opencl(
  __global unsigned char* signatureR, 
  __global unsigned char* signatureS, 
  __global unsigned char* publicKey, 
  __global unsigned char* message,
  __global unsigned char* output
) {

}

#include "../opencl/cl/secp256k1.cl"
