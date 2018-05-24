#ifndef SECP256K1_CPP_H_header
#include "secp256k1_opencl.h"
//<- header file incompatible with secp256k1_cpp.h
//This header structure arose through
//hunting for the bug described in the include guard
//inside of secp256k1.cl.
//To do: make the header file structure more intuitive.
#endif

__kernel void secp256k1_opencl_verify_signature(
  __global unsigned char *output,
  __global unsigned char *outputMemoryPoolSignature,
  __global const unsigned char *inputSignature,
  unsigned int signatureSize,
  __global const unsigned char *publicKey,
  unsigned int publicKeySize,
  __global const unsigned char *message,
  __global const unsigned char *memoryPoolMultiplicationContext
) {
  unsigned char result;
  __global secp256k1_ecmult_context* multiplicationContextPointer =
  memoryPool_read_multiplicationContextPointer_NON_PORTABLE(memoryPoolMultiplicationContext);

  secp256k1_scalar scalarR, scalarS, scalarMessage;
  secp256k1_ge pointPublicKey;
  if (secp256k1_eckey_pubkey_parse(&pointPublicKey, publicKey, publicKeySize) != 1) {
    output[0] = 0;
    return;
  }
  if (secp256k1_ecdsa_sig_parse__global(&scalarR, &scalarS, inputSignature, signatureSize) != 1) {
    output[0] = 0;
    return;
  }
  secp256k1_scalar_set_b32__global(&scalarMessage, message, NULL);

  memoryPool_initializeNoZeroingNoLog(MACRO_MEMORY_POOL_SIZE_Signature - 10, outputMemoryPoolSignature);
  result = (unsigned char) secp256k1_ecdsa_sig_verify(
    multiplicationContextPointer,
    &scalarR,
    &scalarS,
    &pointPublicKey,
    &scalarMessage,
    outputMemoryPoolSignature
  );
  output[0] = result;
}

#include "secp256k1.cl"
