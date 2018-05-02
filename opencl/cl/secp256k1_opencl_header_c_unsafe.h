//Header needed to convert secp256k1.cl to an openCL program.

#include "../opencl/cl/secp256k1_opencl_header_c_safe.h"
#ifndef MACRO_USE_openCL
#define MACRO_USE_openCL

#define uint32_t uint
#define uint64_t ulong

#define VERIFY_CHECK(arg)
#define NULL 0


#define ___static__constant __constant


__constant unsigned char errorMemoryPoolNotInitialized[30] = "Memory pool not initialized.\0";
__constant unsigned char errorTooManyObjectsAllocated[29] = "Too many objects allocated.\0";
__constant unsigned char errorPointerNotFound[35] = "Pointer not found in memory pool.\0";
__constant unsigned char errorOutOfMemory[16] = "Out of memory.\0";

__constant int maxObjectsInMemoryPool = MACRO_MaxNumberOfObjectsInMemoryPool;

void memcpy(unsigned char* destination, const unsigned char* source, int amount) {
  int i;
  for (i = 0; i < amount; i ++){
    destination[i] = source[i];
  }
}

int isGoodMemoryStart(int start, int length, memoryPool* theMemory) {
  int i;
  int leftPoint = start;
  int rightPoint = start + length;
  for (i = 0; i < maxObjectsInMemoryPool; i ++) {
    if (theMemory->objectStarts[i] < 0){
      continue;
    }
    int otherLeft = theMemory->objectStarts[i];
    int otherRight = theMemory->objectStarts[i] + theMemory->objectLengths[i];
    if (leftPoint <= otherLeft && otherLeft <= rightPoint){
      return 0;
    }
    if (leftPoint <= otherRight && otherRight <= rightPoint){
      return 0;
    }
    if (otherLeft <= leftPoint && leftPoint <= otherRight){
      return 0;
    }
    if (otherLeft <= rightPoint && rightPoint <= otherRight){
      return 0;
    }
  }
  if (leftPoint < 0)
    return 0;
  if (rightPoint > theMemory->totalMemory)
    return 0;
  return 1;
}

static void *checked_malloc(const secp256k1_callback* cb, size_t size, memoryPool* theMemory) {
  if (theMemory->deallocated != 0) {
    memcpy(theMemory->errorBuffer, (const unsigned char*) errorMemoryPoolNotInitialized, 30);
    return NULL;
  }
  if (theMemory->numberOfObjectAllocated >= MACRO_MaxNumberOfObjectsInMemoryPool) {
    memcpy(theMemory->errorBuffer, (const unsigned char*) errorTooManyObjectsAllocated, 29);
    return NULL;
  }
  int i;
  int goodStart = - 1;
  if (isGoodMemoryStart(0, size, theMemory)){
    goodStart = 0;
  } else {
    for (i = 0; i < maxObjectsInMemoryPool; i ++) {
      if (isGoodMemoryStart(theMemory->objectStarts[i] + 1, size, theMemory)) {
        goodStart = theMemory->objectStarts[i] + 1;
        break;
      }
    }
  }
  if (goodStart < 0){
    memcpy(theMemory->errorBuffer, (const unsigned char*) errorOutOfMemory, 16);
    return NULL;
  }
  int slot = 0;
  for (slot = 0; slot < maxObjectsInMemoryPool; slot ++){
    if (theMemory->objectStarts[slot] < 0){
      break;
    }
  }
  theMemory->objectStarts[slot] = goodStart;
  theMemory->objectLengths[slot] = size;
  return &theMemory->memory[goodStart];
}

void memset (unsigned char* destination, unsigned char value, int amountToSet){
  int i;
  for (i = 0; i < amountToSet; i ++){
    destination[i] = value;
  }
}

void freeWithContext(void *pointer, memoryPool* theMemory) {
  int i;
  int found = false;
  for (i = 0; i < maxObjectsInMemoryPool; i ++) {
    if (theMemory->objectStarts[i] < 0) {
      continue;
    }
    if (&theMemory->memory[theMemory->objectStarts[i]] == pointer) {
      theMemory->objectStarts[i] = - 1;
      theMemory->objectLengths[i] = - 1;
      theMemory->numberOfObjectAllocated --;
      found = true;
      break;
    }
  }
  if (!found){
    memcpy(theMemory->errorBuffer, (const unsigned char*) errorPointerNotFound, 35);
  }
}

#endif //MACRO_USE_openCL
