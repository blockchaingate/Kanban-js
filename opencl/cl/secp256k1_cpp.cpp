// This file is inteded as a pre-processor tool
// for converting the program secp256k1_implementation.h
// into a C/CPP program.
// The file extension of the present file is cpp to avoid IDE configuration issues (qtCreator does handle well .c and .cl extensions).

#include <string.h>
#include <stdint.h>
#include <stdlib.h>
#include <assert.h>
#include "../logging.h"
extern Logger logGPU;
#include "secp256k1_cpp.h"
#include <iomanip>
#include <sstream>

#define __kernel

#include "secp256k1_opencl_compute_multiplication_context.cl"
#include "secp256k1_opencl_compute_generator_context.cl"
#include "secp256k1_opencl_sign.cl"
#include "secp256k1_opencl_generate_public_key.cl"
#include "secp256k1_opencl_verify_signature.cl"
#include "test_suite_1_basic_operations.cl"
#include "sha256GPU.cl"

///////////////////////
#include "secp256k1_set_1_address_space__global.h"
#include "secp256k1_1_parametric_address_space_non_constant_miner.cl"
///////////////////////
#include "secp256k1_set_1_address_space__default.h"
#include "secp256k1_1_parametric_address_space_non_constant_miner.cl"
///////////////////////

void assertFalse(__constant const char* errorMessage, __global unsigned char* memoryPool) {
  (void) memoryPool;
  std::string errorMessageString(errorMessage);
  std::cout << errorMessageString << std::endl;
  assert(false);
}
