// This file is inteded as a pre-processor tool
// for converting the program secp256k1.cl
// into an openCL program.


#define MACRO_USE_openCL

#define uint32_t uint
#define uint64_t ulong

#define VERIFY_CHECK(arg)
#define NULL 0


#define ___static__constant __constant

#include "../opencl/cl/secp256k1.h"

void assertFalse(unsigned char* memoryPool){
  //to do: do something with the memory pool to signal back to the CPU that things have gone wrong.
}