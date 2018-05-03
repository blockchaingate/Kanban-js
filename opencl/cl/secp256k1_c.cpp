// This file is inteded as a pre-processor tool
// for converting the program secp256k1.cl
// into a C/CPP program.
// The file extension of the present file is cpp to avoid IDE configuration issues (qtCreator does handle well .c and .cl extensions). 

#include <string.h>
#include <stdint.h>
#include <stdlib.h>
#include "cl/secp256k1.cl"

void* checked_malloc(const secp256k1_callback* cb, size_t size) {
  void *ret = malloc(size);
  if (ret == NULL) {
    secp256k1_callback_call(cb, "Out of memory");
  }
  return ret;
}

void secp256k1_callback_call(const secp256k1_callback * const cb, const char * const text) {
  cb->fn(text, (void*)cb->data);
}


