#ifndef SECP256K1_CPP_H_header
#include "../opencl/cl/secp256k1_opencl.h"
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
  __global unsigned char* inputMemoryPoolGeneratorContext
) {
   
  secp256k1_ge publicKey;
  secp256k1_gej publicKeyJacobianCoordinates;
  secp256k1_scalar secretKey, outputSignatureR, outputSignatureS, message, nonce;
  secp256k1_scalar_set_b32__global(&secretKey, inputSecretKey, NULL);
  secp256k1_scalar_set_b32__global(&message, inputMessage, NULL);
  secp256k1_scalar_set_b32__global(&nonce, outputInputNonce, NULL);

  __global secp256k1_ecmult_gen_context* generatorContext =
  memoryPool_read_generatorContextPointer(inputMemoryPoolGeneratorContext);


  secp256k1_ecmult_gen(generatorContext, &publicKeyJacobianCoordinates, &secretKey);

  secp256k1_ge_set_gej(&publicKey, &publicKeyJacobianCoordinates);
  secp256k1_ecdsa_sig_sign(generatorContext, &outputSignatureR, &outputSignatureS, &secretKey, &message, &nonce, NULL);
  size_t outputSizeBuffer;
  secp256k1_ecdsa_sig_serialize__global(outputSignature, &outputSizeBuffer, &outputSignatureR, &outputSignatureS);
  memoryPool_write_uint(outputSizeBuffer, outputSize);
}

#include "../opencl/cl/secp256k1.cl"
