// This file is inteded as a pre-processor tool
// for converting the program secp256k1.cl
// into a C/CPP program.
// The file extension of the present file is cpp to avoid IDE configuration issues (qtCreator does handle well .c and .cl extensions).

#include <string.h>
#include <stdint.h>
#include <stdlib.h>
#include <assert.h>
#include "logging.h"
extern Logger logGPU;
#include "cl/secp256k1_cpp.h"
#include <iomanip>
#include <sstream>


#define __kernel

#include "cl/kernels/secp256k1_opencl_compute_multiplication_context.cl"
#include "cl/kernels/secp256k1_opencl_compute_generator_context.cl"
void assertFalse(__constant const char* errorMessage, unsigned char* memoryPool) {
  (void) memoryPool;
  std::string errorMessageString(errorMessage);
  std::cout << errorMessageString << std::endl;
  assert(false);
}

#include "cl/secp256k1.cl"


