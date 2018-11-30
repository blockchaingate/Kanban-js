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
  __global unsigned char *outputMemoryPoolSignatureBuffer,
  __global const unsigned char* inputSignature,
  __global const unsigned char* signatureSizes,
  __global const unsigned char* publicKey,
  __global const unsigned char* publicKeySizes,
  __global const unsigned char* message,
  __global const unsigned char* memoryPoolMultiplicationContext,
  unsigned char messageIndexByteHighest,
  unsigned char messageIndexByteHigher ,
  unsigned char messageIndexByteLower  ,
  unsigned char messageIndexByteLowest
) {
  unsigned char result;
  unsigned int publicKeySize, signatureSize;
  unsigned int messageIndex = memoryPool_read_uint_from_four_bytes(
    messageIndexByteHighest,
    messageIndexByteHigher,
    messageIndexByteLower,
    messageIndexByteLowest
  );
  publicKeySize = memoryPool_read_uint(&publicKeySizes[messageIndex * 4]);
  signatureSize = memoryPool_read_uint(&signatureSizes[messageIndex * 4]);
  unsigned int indexMemPoolSignature;
  indexMemPoolSignature = (messageIndex % MACRO_max_num_SIGNATURES_IN_PARALLEL);
  indexMemPoolSignature *= MACRO_MEMORY_POOL_SIZE_Signature;
  if (indexMemPoolSignature >= MACRO_size_signature_buffer) {
    assertFalse("This should not happen. ", outputMemoryPoolSignatureBuffer);
    output[messageIndex] = - 2;
    return;
  } 
  __global unsigned char* outputMemoryPoolSignature = &outputMemoryPoolSignatureBuffer[indexMemPoolSignature];

  memoryPool_initializeNoZeroingNoLog(MACRO_MEMORY_POOL_SIZE_Signature - 10, outputMemoryPoolSignature);
  memoryPool_write_uint_asOutput(messageIndex, 0, outputMemoryPoolSignature);
  memoryPool_write_uint_asOutput(publicKeySize, 1, outputMemoryPoolSignature);
  memoryPool_write_uint_asOutput(signatureSize, 2, outputMemoryPoolSignature);
 
  __global secp256k1_ecmult_context* multiplicationContextPointer =
  memoryPool_read_multiplicationContextPointer_NON_PORTABLE(memoryPoolMultiplicationContext);

  secp256k1_scalar scalarR, scalarS, scalarMessage;
  secp256k1_ge pointPublicKey;
  unsigned int offsetPublicKey = messageIndex * MACRO_size_of_signature;
  unsigned int offsetSignature = messageIndex * MACRO_size_of_signature;
  unsigned int offsetMessage = messageIndex * 32;
  if (secp256k1_eckey_pubkey_parse(&pointPublicKey, &publicKey[offsetPublicKey], publicKeySize) != 1) {
    output[messageIndex] = - 4;
    return;
  }
  if (secp256k1_ecdsa_sig_parse__global(&scalarR, &scalarS, &inputSignature[offsetSignature], signatureSize) != 1) {
    output[messageIndex] = - 5;
    return;
  }
  secp256k1_scalar_set_b32__global(&scalarMessage, &message[offsetMessage], NULL);

  result = (unsigned char) secp256k1_ecdsa_sig_verify(
    multiplicationContextPointer,
    &scalarR,
    &scalarS,
    &pointPublicKey,
    &scalarMessage,
    outputMemoryPoolSignature
  );
  output[messageIndex] = result;
}

#include "secp256k1_implementation.h"
