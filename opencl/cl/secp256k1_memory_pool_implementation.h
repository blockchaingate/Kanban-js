// See the comments in secp256k1.h for license information

#include "secp256k1.h"

#ifndef FILE_secp256k1_memory_pool_GUARD
#define FILE_secp256k1_memory_pool_GUARD
////////////////////////////////////////////////
//<- This file is guarded due to an open cl compiler issue
//(as of May 9 2018 using stock ubuntu openCL libraries) which requires that
//the __kernel entry point of an openCL program be located immediately inside the
//first included file.
//In particular kernel entry points are not allowed
//to reside other files included with #include directives.
//At the time of writing, this unexpected behavior manifests itself only on openCL GPU builds and not on
//openCL CPU builds. Furthermore the manifestation is different on (my) NVIDIA and intel graphics cards:
//the former fails to run with an "out of resources " error, and the latter runs
//producing random bytes.
////////////////////////////////////////////////




//////////////////////////////////////////////////
/////////////////sizeof behavior//////////////////
//On certain hardware + driver combinations (for example: NVIDIA Quadro K2000, openCL 1.1, Ubuntu)
//sizeof returns 0 on structs such as, for example, secp256k1_fe.
//
//I have not been able to establish whether this is the expected behavior or whether it's a bug.
//
//In what follows, to guard against accidental use of sizeof,
//we redefine sizeof to something that will generate a compiler error.
//At the end of this file, we redefine sizeof to restore the status quo.

#define MACRO_SIZEOF_FUNCTION(X)          \
unsigned int sizeof_ ## X() { \
  X usedForSizeOf;                        \
  return sizeof(usedForSizeOf);           \
}

MACRO_SIZEOF_FUNCTION(secp256k1_fe)
MACRO_SIZEOF_FUNCTION(secp256k1_gej)
MACRO_SIZEOF_FUNCTION(secp256k1_ge)
MACRO_SIZEOF_FUNCTION(secp256k1_ecmult_context)
MACRO_SIZEOF_FUNCTION(secp256k1_ecmult_gen_context)
MACRO_SIZEOF_FUNCTION(int)
MACRO_SIZEOF_FUNCTION(secp256k1_ge_storage)

unsigned int sizeof_char64() {
  char usedForSizeOf[64];
  return sizeof(usedForSizeOf);
}

unsigned int sizeof_uint() {
  char usedForSizeOf[64];
  return sizeof(usedForSizeOf);
}

#ifdef sizeof
#undef sizeof
#endif
#define sizeof sizeof_returns_zero_on_some_hardware_driver_combinations_use_sizeof_yourTypeName_instead
/////////////end of sizeof behavior block////////


//As far as I have investigated so far, 
//except for initializations and except for the 
//signature verification, the crypto code does not
//allocate memory.
//
//The memory pool is a structure that holds all
//"dynamically" allocated memory during initializations.
//All memory in the memory pool is allocated once by our C++ driver
//and passed as a pointer to each openCL execution.
//In turn, the crypto library "allocates" memory from that pool
//via checked_malloc(...). This (is supposed to) happen only once,
//during initializations/precomputations.
//
//The memory pool is immutable: it cannot grow / be resized.
//Pointers to elements in the pool can safely be referenced as the pool does not move.
//
//Please pay attention when storing pointers into the memory pool:
//GPU pointers may be 32 bit (as is the case on my system),
//while CPU pointers are typically 64 bit (as is the case on my system).
//This means that pointers allocated inside the memory pool by openCL should
//only be referenced by openCL on the appropriate platform, 
//and not another openCL platform or by the C++ driver.
//
//Useful output recorded in the memory pool is referenced
//by setting the third, fourth, ... reserved byte quadruples
//(bytes of indices 7-11, 12-15, ...) to the the unsigned int position of
//the first byte where the output is located. Naturally,
//no data in the output should be interpretted as a pointer.
//
//
//Memory pool format:
//The first 8 + 4 * MACRO_numberOfOutputs bytes are reserved.
//First 4 bytes: total memory pool size.
//Next 4 bytes: total memory consumed from the memory pool, including all bytes reserved in the present paragraph.
//Next 4 * MACRO_numberOfOutputs bytes: reserved for the unsigned int position of the first byte(s) of the output(s).
//
//In addition, the following MACRO_MessageLogSize bytes may be reserved for debugging purposes
//(printf is not guaranteed to work out-of-the-box in older openCL versions).
//

unsigned int memoryPool_readNumberReservedBytesExcludingLog() {
  return 8 + 4 * MACRO_numberOfOutputs;
}

unsigned int memoryPool_readNumberReservedBytesIncludingLog() {
  return memoryPool_readNumberReservedBytesExcludingLog() + MACRO_MessageLogSize;
}

void memoryPool_initializeNoZeroingNoLog(unsigned int totalSize, __global unsigned char* memoryPool) {
  unsigned int reservedBytes;
  memoryPool_write_uint(totalSize, memoryPool);
  reservedBytes  = memoryPool_readNumberReservedBytesExcludingLog();
  memoryPool_write_uint(reservedBytes, &memoryPool[4]);
  unsigned int i;
  for (i = 0; i < MACRO_numberOfOutputs; i ++) {
    memoryPool_write_uint(0, &memoryPool[8 + 4 * i]);
  }
}

void memoryPool_initialize(unsigned int totalSize, __global unsigned char* memoryPool) {
  unsigned int i, reservedBytes;
  memoryPool_initializeNoZeroingNoLog(totalSize, memoryPool);
  reservedBytes  = memoryPool_readNumberReservedBytesExcludingLog();
  for (i = reservedBytes; i < totalSize; i ++) {
    memoryPool[i] = (unsigned char) 0;
  }
  //printf("%s\n", "\nDEBUG: Zeroed mempool");

  //Use this snippet if you want initialize the RAM
  //with some pattern other than zeroes (say, you doubt the memory is accessed properly).
  //for (i = 12; i + 4 < totalSize; i += 4){
  //  memoryPool_write_uint(i, &memoryPool[i]);
  //}

  //Allocate buffer for error messages:
  checked_malloc(MACRO_MessageLogSize, memoryPool);
  //printf("%s\n", "\nDEBUG: Malloced");
}

void memoryPool_writeString(__constant const char* message, int messageSize, __global unsigned char* memoryPool) {
  unsigned int i, length, reservedBytes;
  length = MACRO_MessageLogSize - 2;
  if (length > (unsigned) messageSize)
    length = messageSize;
  reservedBytes = memoryPool_readNumberReservedBytesExcludingLog();
  for (i = 0; i < length; i ++) {
    memoryPool[i + reservedBytes] = (unsigned char) message[i];
    memoryPool[i + reservedBytes + 1] = (unsigned char) 0; // <- ensure our string is null-terminated, independent of whether message is.
    if (message[i] == 0)
      break;
  }
}

int memoryPool_adjustArgumentIndex(int argumentIndex, __global unsigned char* memoryPool) {
  if (argumentIndex >= 0) {
    return argumentIndex;
  }
  for (int i = 0; i < MACRO_numberOfOutputs; i ++) {
    if (memoryPool_read_uint_fromOutput(i, memoryPool) == 0) {
      return i;
    }
  }
  return 0;
}

void memoryPool_write_uint_asOutput(unsigned int numberToWrite, int argumentIndex, __global unsigned char* memoryPool) {
  argumentIndex = memoryPool_adjustArgumentIndex(argumentIndex, memoryPool);
  memoryPool_write_uint(numberToWrite, &memoryPool[8 + 4 * argumentIndex]);
}

void memoryPool_write_uint(unsigned int numberToWrite, __global unsigned char* memoryPoolPointer) {
  memoryPoolPointer[0] = (unsigned char) (numberToWrite >> 24);
  memoryPoolPointer[1] = (unsigned char) (numberToWrite >> 16);
  memoryPoolPointer[2] = (unsigned char) (numberToWrite >> 8 );
  memoryPoolPointer[3] = (unsigned char) (numberToWrite      );
}

void memoryPool_writeCurrentSizeAsOutput(unsigned int argumentIndex, __global unsigned char* memoryPool) {
  unsigned int currentSize;
  if (argumentIndex >= MACRO_numberOfOutputs) {
    assertFalse("Argument index too large", memoryPool);
  }
  currentSize = memoryPool_readPoolSize(memoryPool);
  memoryPool_write_uint_asOutput(currentSize, argumentIndex, memoryPool);
}

unsigned int memoryPool_read_uint_from_four_bytes(
  unsigned char byteHighest,
  unsigned char byteHigher ,
  unsigned char byteLower    ,
  unsigned char byteLowest
) {
  return
  (unsigned int) ( ((unsigned int) byteHighest) << 24) +
  (unsigned int) ( ((unsigned int) byteHigher ) << 16) +
  (unsigned int) ( ((unsigned int) byteLower    ) <<  8) +
  (unsigned int) (  (unsigned int) byteLowest       ) ;
}

unsigned int memoryPool_readPoolSize(__global const unsigned char* memoryPool) {
  return memoryPool_read_uint(&memoryPool[4]);
}

unsigned int memoryPool_readMaxPoolSize(__global const unsigned char* memoryPool) {
  return memoryPool_read_uint(memoryPool);
}

unsigned int memoryPool_read_uint(__global const unsigned char* memoryPoolPointer) {
  return
  ((unsigned int) (memoryPoolPointer[0] << 24)) +
  ((unsigned int) (memoryPoolPointer[1] << 16)) +
  ((unsigned int) (memoryPoolPointer[2] <<  8)) +
  ((unsigned int) memoryPoolPointer[3]       ) ;
}

unsigned int memoryPool_read_uint__default(const unsigned char* memoryPoolPointer) {
  return
  ((unsigned int) (memoryPoolPointer[0] << 24)) +
  ((unsigned int) (memoryPoolPointer[1] << 16)) +
  ((unsigned int) (memoryPoolPointer[2] <<  8)) +
  ((unsigned int) memoryPoolPointer[3]       ) ;
}

unsigned int memoryPool_read_uint_fromOutput(int argumentIndex, __global const unsigned char *memoryPool) {
  return memoryPool_read_uint(&memoryPool[8 + 4 * argumentIndex]);
}

//Memory pool format: in the notes before the definition of memoryPool_initialize.
__global void* checked_malloc(unsigned int size, __global unsigned char* memoryPool) {
  unsigned int oldSize, newSize;
  unsigned int maxSize;
  oldSize = memoryPool_read_uint(memoryPool + 4);
  if (oldSize < 8) {
    assertFalse("Old size too small\0", memoryPool);
  }
  maxSize = memoryPool_read_uint(memoryPool);
  if (maxSize < 200000) {
    assertFalse("Memory pool too small.\0", memoryPool);
  }
  if (maxSize > 30000000) {
    assertFalse("Memory pool too large.\0", memoryPool);
  }
  if (oldSize > maxSize){
    assertFalse("Old size exceeds maximum.\0", memoryPool);
  }
  newSize = oldSize + size;
  if (newSize > maxSize) {
    assertFalse("New size exceeds maximum.\0", memoryPool);
  }
  memoryPool_write_uint(newSize, memoryPool + 4);
  return memoryPool + oldSize;
}

void memoryPool_freeMemory(void* any) {
  (void) any;
}

void memoryPool_freeMemory__global(__global void* any) {
  (void) any;
}

void memoryPool_read_secp256k1_ge(secp256k1_ge* output, __global const unsigned char* memoryPoolPointer) {
  secp256k1_ge_copy__from__global(output, (__global secp256k1_ge*) memoryPoolPointer);
}

void memoryPool_read_secp256k1_gej(secp256k1_gej* output, __global const unsigned char* memoryPoolPointer) {
  secp256k1_gej_copy__from__global(output, (__global secp256k1_gej*) memoryPoolPointer);
}

void memoryPool_read_secp256k1_fe(secp256k1_fe* output, __global const unsigned char* memoryPoolPointer) {
  secp256k1_fe_copy__from__global(output, (__global secp256k1_fe*) memoryPoolPointer);
}

void memoryPool_write_fe_asOutput(
  const secp256k1_fe* input, int argumentIndex, __global unsigned char* memoryPool
) {
  argumentIndex = memoryPool_adjustArgumentIndex(argumentIndex, memoryPool);
  __global secp256k1_fe* serializerPointer;
  __global unsigned char* typePointer;
  memoryPool_writeCurrentSizeAsOutput(argumentIndex, memoryPool);
  typePointer = (__global unsigned char*) checked_malloc(sizeof_uint(), memoryPool);
  memoryPool_write_uint(memoryPoolType_fe, typePointer);
  serializerPointer = (__global secp256k1_fe*) checked_malloc(sizeof_secp256k1_fe(), memoryPool);
  secp256k1_fe_copy__to__global(serializerPointer, input);
}

void memoryPool_write_gej_asOutput(
  const secp256k1_gej* input, int argumentIndex, __global unsigned char* memoryPool
) {
  argumentIndex = memoryPool_adjustArgumentIndex(argumentIndex, memoryPool);
  __global secp256k1_gej* serializerPointer;
  __global unsigned char* typePointer;
  memoryPool_writeCurrentSizeAsOutput(argumentIndex, memoryPool);
  typePointer = (__global unsigned char*) checked_malloc(sizeof_uint(), memoryPool);
  memoryPool_write_uint(memoryPoolType_gej, typePointer);
  serializerPointer = (__global secp256k1_gej*) checked_malloc(sizeof_secp256k1_gej(), memoryPool);
  secp256k1_gej_copy__to__global(serializerPointer, input);
}

__global secp256k1_ecmult_gen_context* memoryPool_read_generatorContextPointer_NON_PORTABLE(
  __global const unsigned char* memoryPool
) {
  uint32_t position = memoryPool_read_uint_fromOutput(0, memoryPool);
  return ((__global secp256k1_ecmult_gen_context*) &memoryPool[position]);
}

void memoryPool_read_generatorContext_PORTABLE(
  __global secp256k1_ecmult_gen_context* outputGeneratorContext,
  __global const unsigned char* memoryPool
) {
  outputGeneratorContext->prec = NULL;
  //secp256k1_ecmult_gen_context_init(outputGeneratorContext);
  uint32_t outputPositionGeneratorContextStruct = memoryPool_read_uint_fromOutput(0, memoryPool);
  uint32_t outputPositionGeneratorContextContent = memoryPool_read_uint_fromOutput(1, memoryPool);
  __global secp256k1_ecmult_gen_context* pointerToContextAsStoredInPoolMayHaveDifferentPointerSize =
  ((__global secp256k1_ecmult_gen_context*) &memoryPool[outputPositionGeneratorContextStruct]);
  outputGeneratorContext->blind = pointerToContextAsStoredInPoolMayHaveDifferentPointerSize->blind;
  outputGeneratorContext->initial = pointerToContextAsStoredInPoolMayHaveDifferentPointerSize->initial;
  outputGeneratorContext->prec = (__global secp256k1_ge_storage*) &memoryPool[outputPositionGeneratorContextContent];
}

__global secp256k1_ecmult_context* memoryPool_read_multiplicationContextPointer_NON_PORTABLE(
  __global const unsigned char* memoryPool
) {
  uint32_t position = memoryPool_read_uint_fromOutput(0, memoryPool);
  return (__global secp256k1_ecmult_context*) &memoryPool[position];
}

void memoryPool_read_multiplicationContext_PORTABLE(
  __global secp256k1_ecmult_context* outputMultiplicationContext,
  __global const unsigned char* memoryPool
) {
  outputMultiplicationContext->pre_g = NULL;
  uint32_t position = memoryPool_read_uint_fromOutput(1, memoryPool);
  //int sizeOfGeneratorContextLump = (16 * 64 * sizeof(secp256k1_ge_storage));
  //logTest << "Size of generator context lump: " << sizeOfGeneratorContextLump << Logger::endL;
  //for (int i = 0; i < sizeOfGeneratorContextLump; i++)
  //  logTest << std::hex << (int) theMemoryPool[outputPositionGeneratorContextContent + i];
  outputMultiplicationContext->pre_g = (__global secp256k1_ge_storage(*)[]) &memoryPool[position];
}


#endif //FILE_secp256k1_memory_pool_GUARD
