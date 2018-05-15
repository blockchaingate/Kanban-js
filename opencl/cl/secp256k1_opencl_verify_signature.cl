#include "../opencl/cl/secp256k1_opencl.h"

__kernel void secp256k1_opencl_verify_signature(
  __global unsigned char* output,
  __global unsigned char* memoryPoolMultiplicationContext,
  __global unsigned char* signatureR,
  __global unsigned char* signatureS,
  __global unsigned char* publicKey, 
  __global unsigned char* message
) {
  unsigned char result;
  
  result = (unsigned char) secp256k1_ecdsa_sig_verify(
    (__global const secp256k1_ecmult_context*) theContext, 
    (__global const secp256k1_scalar *) signatureR, 
    (__global const secp256k1_scalar *) signatureS, 
    (__global const secp256k1_ge *) publicKey, 
    (__global const secp256k1_scalar *) message
  );
  output[0] = result;
}

#include "../opencl/cl/secp256k1.cl"
