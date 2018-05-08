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

#include "cl/secp256k1.cl"

void* checked_malloc(size_t size) {
  void *ret = malloc(size);
  if (ret == NULL) {
    assert(false);
  }
  return ret;
}

