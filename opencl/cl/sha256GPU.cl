#ifndef SECP256K1_CPP_H_header
#include "secp256k1_opencl.h"
//<- header file incompatible with secp256k1_cpp.h
//This header structure arose through
//hunting for the bug described in the include guard
//inside of secp256k1.cl.
//To do: make the header file structure more intuitive.
#endif


__kernel void sha256GPU(
  __global unsigned char* result, 
  __global const unsigned char* offsets, 
  __global const unsigned char* messageLengths, 
  __global const char* plain_key,
  unsigned char messageIndexByteHighest,
  unsigned char messageIndexByteHigher ,
  unsigned char messageIndexByteLower  ,
  unsigned char messageIndexByteLowest
) {
  unsigned int messageIndex = memoryPool_read_uint_from_four_bytes(
    messageIndexByteHighest,
    messageIndexByteHigher ,
    messageIndexByteLower  ,
    messageIndexByteLowest
  );
  uint32_t resultOffset = messageIndex * 32;
  uint32_t offset = memoryPool_read_uint(& (offsets[4 * messageIndex]));
  uint32_t theLength = memoryPool_read_uint(&(messageLengths[4 * messageIndex]));

  sha256GPU_inner__global(&result[resultOffset], theLength, &plain_key[offset]);
}

#include "secp256k1.cl"
