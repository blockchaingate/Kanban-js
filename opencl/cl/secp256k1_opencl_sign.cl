#ifndef SECP256K1_CPP_H_header
#include "../opencl/cl/secp256k1_opencl.h"
//<- header file incompatible with secp256k1_cpp.h
//This weird header structure arose through
//hunting for the bug described in the include guard
//inside of secp256k1.cl.
//To do: make the header file structure more intuitive.
#endif

__kernel void secp256k1_opencl_sign(
  __global unsigned char* outputSignature,
  __global unsigned char* outputInputNonce,
  __global unsigned char* inputSecretKey,
  __global unsigned char* inputMessage,
  __global unsigned int recordId,
  __global unsigned char* inputMemoryPoolGeneratorContext
) {

/*
  secp256k1_ge publicKey;
  secp256k1_gej publicKeyJacobianCoordinates;
  
  int recId = 5;



  secp256k1_ecmult_gen(&generatorContextCentralPU, &publicKeyJacobianCoordinates, &secretKey);

  secp256k1_ge_set_gej(&publicKey, &publicKeyJacobianCoordinates);
  logTestCentralPU << "DEBUG: public key: " << toStringSecp256k1_ECPoint(publicKey) << Logger::endL;


  logTestCentralPU << "Got to here pt 5. " << Logger::endL;

  secp256k1_scalar secretKey;
  secp256k1_scalar_set_b32(&secretKey, inputSecretKey, NULL);
secp256k1_ecdsa_sig_sign(&generatorContextCentralPU, &signatureR, &signatureS, &secretKey, &message, &nonce, &recId);
  */
}

#include "../opencl/cl/secp256k1.cl"
