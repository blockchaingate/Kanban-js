// This file is inteded as a pre-processor tool
// for converting the program secp256k1.cl
// into an openCL program.

#include "../opencl/cl/secp256k1_opencl_header_c_unsafe.h"
#include "../opencl/cl/secp256k1.h"

__kernel void secp256k1_opencl(
  __global unsigned char* output,
  __global memoryPool* theMemory,
  __global unsigned char* theMemoryBuffer,
  __global unsigned char* signatureR,  
  __global unsigned char* signatureS, 
  __global unsigned char* publicKey, 
  __global unsigned char* message
) {
  theMemory->memory = (unsigned char *) theMemoryBuffer;
  secp256k1_ecmult_context theContext;
  secp256k1_ecmult_context_build(&theContext, NULL, (memoryPool*) theMemory);
  *output = secp256k1_ecdsa_sig_verify(
    &theContext, 
    (const secp256k1_scalar *) signatureR, 
    (const secp256k1_scalar *) signatureS, 
    (const secp256k1_ge*) publicKey, 
    (const secp256k1_scalar *) message
  );
}

#include "../opencl/cl/secp256k1.cl"
