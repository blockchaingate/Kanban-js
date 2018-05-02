//Header needed to convert secp256k1.cl to an openCL program.

#include "../opencl/cl/secp256k1_opencl_header_c_safe.h"
#ifndef MACRO_USE_openCL
#define MACRO_USE_openCL

#define uint32_t uint
#define uint64_t ulong

#define VERIFY_CHECK(arg)
#define NULL 0


#define ___static__constant __constant

#define MACRO_MaxNumberOfObjectsInMemoryPool 10

__constant memoryPool theMemoryPool;

__constant unsigned char errorMemoryPoolNotInitialized[30] = "Memory pool not initialized.\0";
__constant unsigned char errorTooManyObjectsAllocated[29] = "Too many objects allocated.\0";

void memcpy(unsigned char* destination, const unsigned char* source, int amount) {
  int i;
  for (i = 0; i < amount; i ++){
    destination[i] = source[i];
  }
}

static void *checked_malloc(const secp256k1_callback* cb, size_t size) {
  if (theMemoryPool.deallocated != 0) {
    memcpy(theMemoryPool.errorBuffer, (const unsigned char*) errorMemoryPoolNotInitialized, 30);
    return NULL;
  }
  if (theMemoryPool.numberOfObjectAllocated >= MACRO_MaxNumberOfObjectsInMemoryPool) {
    memcpy(theMemoryPool.errorBuffer, (const unsigned char*) errorTooManyObjectsAllocated, 29);
    return NULL;
  }
}

void memset (unsigned char* destination, unsigned char value, int amountToSet){
  int i;
  for (i = 0; i < amountToSet; i ++){
    destination[i] = value;
  }
}

void free(void *pointer){

}

#endif //MACRO_USE_openCL
