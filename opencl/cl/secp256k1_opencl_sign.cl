#ifndef SECP256K1_CPP_H_header
#include "secp256k1_opencl.h"
//<- header file incompatible with secp256k1_cpp.h
//This header structure arose through
//hunting for the bug described in the include guard
//inside of secp256k1.cl.
//To do: make the header file structure more intuitive.
#endif

__kernel void secp256k1_opencl_sign(
  __global unsigned char* outputSignature,
  __global unsigned char* outputSize,
  __global unsigned char* outputInputNonce,
  __global unsigned char* inputSecretKey,
  __global unsigned char* inputMessage,
  __global unsigned char* inputMemoryPoolGeneratorContext,
  unsigned int messageIndexChar
) {
  secp256k1_scalar secretKey, outputSignatureR, outputSignatureS, message, nonce;
  unsigned int inputMessageIndex = memoryPool_read_uint__default((unsigned char*) &messageIndexChar);
  unsigned int offset = inputMessageIndex * 32;
  secp256k1_scalar_set_b32__global(&secretKey, &inputSecretKey[offset], NULL);
  secp256k1_scalar_set_b32__global(&message, &inputMessage[offset], NULL);
  secp256k1_scalar_set_b32__global(&nonce, &outputInputNonce[offset], NULL);

  __global secp256k1_ecmult_gen_context* generatorContext =
  memoryPool_read_generatorContextPointer_NON_PORTABLE(inputMemoryPoolGeneratorContext);

  secp256k1_ecdsa_sig_sign(generatorContext, &outputSignatureR, &outputSignatureS, &secretKey, &message, &nonce, NULL);
  size_t outputSizeBuffer;
  unsigned int offsetSignature = (33 * 2 + 6) * inputMessageIndex;
  secp256k1_ecdsa_sig_serialize__global(&outputSignature[offsetSignature], &outputSizeBuffer, &outputSignatureR, &outputSignatureS);
  memoryPool_write_uint(outputSizeBuffer, &outputSize[inputMessageIndex * 4]);
}

#include "secp256k1.cl"
