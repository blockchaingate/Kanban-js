#ifndef SECP256K1_CPP_H_header
#include "secp256k1_opencl.h"
//<- header file incompatible with secp256k1_cpp.h
//This header structure arose through
//hunting for the bug described in the include guard
//inside of secp256k1.cl.
//To do: make the header file structure more intuitive.
#endif

__kernel void secp256k1_opencl_generate_public_key(
  __global unsigned char* outputPublicKey,
  __global unsigned char* outputPublicKeySize,
  __global unsigned char* inputSecretKey,
  __global unsigned char* inputMemoryPoolGeneratorContext, 
  unsigned int inputMessageIndex
) {   
  secp256k1_scalar secretKey;
  unsigned int offset = 32 * inputMessageIndex;
  unsigned int offsetOutput = MACRO_size_of_signature * inputMessageIndex;
  secp256k1_scalar_set_b32__global(&secretKey, &inputSecretKey[offset], NULL);

  __global secp256k1_ecmult_gen_context* generatorContext =
  memoryPool_read_generatorContextPointer_NON_PORTABLE(inputMemoryPoolGeneratorContext);

  secp256k1_ge publicKey;
  secp256k1_gej publicKeyJacobianCoordinates;
  secp256k1_ecmult_gen(generatorContext, &publicKeyJacobianCoordinates, &secretKey);
  secp256k1_ge_set_gej(&publicKey, &publicKeyJacobianCoordinates);
  size_t keySize;
  
  if (secp256k1_eckey_pubkey_serialize(&publicKey, &outputPublicKey[offsetOutput], &keySize, 0) == 1) {
    memoryPool_write_uint(keySize, &outputPublicKeySize[inputMessageIndex * 4]);
  } else {
    memoryPool_write_uint(0, &outputPublicKeySize[inputMessageIndex * 4]);
  }
}

#include "secp256k1.cl"
