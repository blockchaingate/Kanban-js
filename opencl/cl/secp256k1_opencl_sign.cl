#include "../opencl/cl/secp256k1_opencl.h"

__kernel void secp256k1_opencl_sign(
  __global unsigned char* memoryPoolGeneratorContext,
  __global unsigned char* outputSignatures,
  __global unsigned char* inputSecretKey, 
  __global unsigned char* inputMessage,
  __global unsigned char* nonce,
  unsigned int recId  
) {

}

#include "../opencl/cl/secp256k1.cl"
