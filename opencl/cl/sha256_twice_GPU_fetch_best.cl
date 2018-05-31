#ifndef SECP256K1_CPP_H_header
#include "secp256k1_opencl.h"
//<- header file incompatible with secp256k1_cpp.h
//This header structure arose through
//hunting for the bug described in the include guard
//inside of secp256k1.cl.
//To do: make the header file structure more intuitive.
#endif

#include "secp256k1_set_1_address_space__default.h"
#include "secp256k1_1_parametric_address_space_non_constant_miner.cl"


void sha256GPU_first_2_bytes_output_lastSHA(unsigned char* resulT, char* input) {
  unsigned char shaOnce[32];
  unsigned char shaTwice[32];
  unsigned char best[32];
  for (int k = 0; k < 32; k ++){
    resulT[k] = input[k];
  }  
  sha256GPU_inner(best, 32, input);
  for (int i = 0; i < 256; i ++) {
    input[0] ++;
    for (int j = 0; j < 256; j ++) {
      input[1] ++;
      sha256GPU_inner(shaOnce, 32, input);
      sha256GPU_inner(shaTwice, 32, (char *) shaOnce);
      bool isGood = false;
      for (int k = 0; k < 32; k ++) {
        if (best[k] < shaTwice[k]) {
          break;
        }
        if (best[k] > shaTwice[k]) {
          isGood = true;
          break;
        }
      }
      if (isGood) {
        for (int k = 0; k < 32; k ++){
          resulT[k] = input[k];
          best[k] = shaTwice[k];
        }
      }
    }
	} 
}
 
__kernel void sha256_twice_GPU_fetch_best(
  __global unsigned char* result, 
  __global const char* messages32bytesLength,
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
  uint32_t offset = resultOffset;

	unsigned char resultFinal[32];
	char message[32];
	unsigned int i;
	for (i = 0; i < 32; i++) {
		message[i] = messages32bytesLength[offset + i];
	}
	
  sha256GPU_first_2_bytes_output_lastSHA(resultFinal, message);
	for (i = 0; i < 32; i++) {
		result[i + resultOffset] = resultFinal[i]; 
	}  
}
