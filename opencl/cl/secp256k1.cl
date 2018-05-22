// See the comments in secp256k1.h for license information

#include "../opencl/cl/secp256k1.h"

#ifndef FILE_secp256k1_CL_INCLUDED_MUST_GUARD_DUE_TO_OPENCL_NON_DOCUMENTED_BEHAVIOR
#define FILE_secp256k1_CL_INCLUDED_MUST_GUARD_DUE_TO_OPENCL_NON_DOCUMENTED_BEHAVIOR
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
}

void memoryPool_initialize(unsigned int totalSize, __global unsigned char* memoryPool) {
  unsigned int i, reservedBytes;
  memoryPool_initializeNoZeroingNoLog(totalSize, memoryPool);
  reservedBytes  = memoryPool_readNumberReservedBytesExcludingLog();
  for (i = 0; i < MACRO_numberOfOutputs; i ++) {
    memoryPool_write_uint(0, &memoryPool[8 + 4 * i]);
  }
  for (i = reservedBytes; i < totalSize; i ++) {
    memoryPool[i] = (unsigned char) 0;
  }
  //Use this snippet if you want initialize the RAM
  //with some pattern other than zeroes (say, you doubt the memory is accessed properly).
  //for (i = 12; i + 4 < totalSize; i += 4){
  //  memoryPool_write_uint(i, &memoryPool[i]);
  //}

  //Allocate buffer for error messages:
  checked_malloc(MACRO_MessageLogSize, memoryPool);
}

void memoryPool_writeString(__constant const char* message, __global unsigned char* memoryPool) {
  unsigned int i, length, reservedBytes;
  length = MACRO_MessageLogSize - 2;
  reservedBytes = memoryPool_readNumberReservedBytesExcludingLog();
  for (i = 0; i < length; i ++) {
    memoryPool[i + reservedBytes] = (unsigned char) message[i];
    memoryPool[i + reservedBytes + 1] = (unsigned char) 0; // <- ensure our string is null-terminated, independent of whether message is.
    if (message[i] == 0)
      break;
  }
}

void memoryPool_write_uint_asOutput(unsigned int numberToWrite, int argumentIndex, __global unsigned char* memoryPool) {
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

//******From field_10x26_impl.h******

#ifdef VERIFY
static void secp256k1_fe_verify(const secp256k1_fe *a) {
  const uint32_t *d = a->n;
  int m = a->normalized ? 1 : 2 * a->magnitude, r = 1;
  r &= (d[0] <= 0x3FFFFFFUL * m);
  r &= (d[1] <= 0x3FFFFFFUL * m);
  r &= (d[2] <= 0x3FFFFFFUL * m);
  r &= (d[3] <= 0x3FFFFFFUL * m);
  r &= (d[4] <= 0x3FFFFFFUL * m);
  r &= (d[5] <= 0x3FFFFFFUL * m);
  r &= (d[6] <= 0x3FFFFFFUL * m);
  r &= (d[7] <= 0x3FFFFFFUL * m);
  r &= (d[8] <= 0x3FFFFFFUL * m);
  r &= (d[9] <= 0x03FFFFFUL * m);
  r &= (a->magnitude >= 0);
  r &= (a->magnitude <= 32);
  if (a->normalized) {
      r &= (a->magnitude <= 1);
      if (r && (d[9] == 0x03FFFFFUL)) {
          uint32_t mid = d[8] & d[7] & d[6] & d[5] & d[4] & d[3] & d[2];
          if (mid == 0x3FFFFFFUL) {
              r &= ((d[1] + 0x40UL + ((d[0] + 0x3D1UL) >> 26)) <= 0x3FFFFFFUL);
          }
      }
  }
  VERIFY_CHECK(r == 1);
}
#else
void secp256k1_fe_verify(const secp256k1_fe *a) {
  (void)a;
}
#endif

void secp256k1_fe_normalize(secp256k1_fe *r) {
  uint32_t t0 = r->n[0], t1 = r->n[1], t2 = r->n[2], t3 = r->n[3], t4 = r->n[4],
           t5 = r->n[5], t6 = r->n[6], t7 = r->n[7], t8 = r->n[8], t9 = r->n[9];

  /* Reduce t9 at the start so there will be at most a single carry from the first pass */
  uint32_t m;
  uint32_t x = t9 >> 22; t9 &= 0x03FFFFFUL;

  /* The first pass ensures the magnitude is 1, ... */
  t0 += x * 0x3D1UL; t1 += (x << 6);
  t1 += (t0 >> 26); t0 &= 0x3FFFFFFUL;
  t2 += (t1 >> 26); t1 &= 0x3FFFFFFUL;
  t3 += (t2 >> 26); t2 &= 0x3FFFFFFUL; m = t2;
  t4 += (t3 >> 26); t3 &= 0x3FFFFFFUL; m &= t3;
  t5 += (t4 >> 26); t4 &= 0x3FFFFFFUL; m &= t4;
  t6 += (t5 >> 26); t5 &= 0x3FFFFFFUL; m &= t5;
  t7 += (t6 >> 26); t6 &= 0x3FFFFFFUL; m &= t6;
  t8 += (t7 >> 26); t7 &= 0x3FFFFFFUL; m &= t7;
  t9 += (t8 >> 26); t8 &= 0x3FFFFFFUL; m &= t8;

  /* ... except for a possible carry at bit 22 of t9 (i.e. bit 256 of the field element) */
#ifdef VERIFY
  VERIFY_CHECK(t9 >> 23 == 0);
#endif
  /* At most a single final reduction is needed; check if the value is >= the field characteristic */
  x = (t9 >> 22) | ((t9 == 0x03FFFFFUL) & (m == 0x3FFFFFFUL)
      & ((t1 + 0x40UL + ((t0 + 0x3D1UL) >> 26)) > 0x3FFFFFFUL));

  /* Apply the final reduction (for constant-time behaviour, we do it always) */
  t0 += x * 0x3D1UL; t1 += (x << 6);
  t1 += (t0 >> 26); t0 &= 0x3FFFFFFUL;
  t2 += (t1 >> 26); t1 &= 0x3FFFFFFUL;
  t3 += (t2 >> 26); t2 &= 0x3FFFFFFUL;
  t4 += (t3 >> 26); t3 &= 0x3FFFFFFUL;
  t5 += (t4 >> 26); t4 &= 0x3FFFFFFUL;
  t6 += (t5 >> 26); t5 &= 0x3FFFFFFUL;
  t7 += (t6 >> 26); t6 &= 0x3FFFFFFUL;
  t8 += (t7 >> 26); t7 &= 0x3FFFFFFUL;
  t9 += (t8 >> 26); t8 &= 0x3FFFFFFUL;

  /* If t9 didn't carry to bit 22 already, then it should have after any final reduction */
#ifdef VERIFY
  VERIFY_CHECK(t9 >> 22 == x);
#endif
  /* Mask off the possible multiple of 2^256 from the final reduction */
  t9 &= 0x03FFFFFUL;

  r->n[0] = t0; r->n[1] = t1; r->n[2] = t2; r->n[3] = t3; r->n[4] = t4;
  r->n[5] = t5; r->n[6] = t6; r->n[7] = t7; r->n[8] = t8; r->n[9] = t9;

#ifdef VERIFY
  r->magnitude = 1;
  r->normalized = 1;
  secp256k1_fe_verify(r);
#endif
}

void secp256k1_fe_normalize_weak(secp256k1_fe *r) {
  uint32_t t0 = r->n[0], t1 = r->n[1], t2 = r->n[2], t3 = r->n[3], t4 = r->n[4],
           t5 = r->n[5], t6 = r->n[6], t7 = r->n[7], t8 = r->n[8], t9 = r->n[9];

  /* Reduce t9 at the start so there will be at most a single carry from the first pass */
  uint32_t x = t9 >> 22; t9 &= 0x03FFFFFUL;

  /* The first pass ensures the magnitude is 1, ... */
  t0 += x * 0x3D1UL; t1 += (x << 6);
  t1 += (t0 >> 26); t0 &= 0x3FFFFFFUL;
  t2 += (t1 >> 26); t1 &= 0x3FFFFFFUL;
  t3 += (t2 >> 26); t2 &= 0x3FFFFFFUL;
  t4 += (t3 >> 26); t3 &= 0x3FFFFFFUL;
  t5 += (t4 >> 26); t4 &= 0x3FFFFFFUL;
  t6 += (t5 >> 26); t5 &= 0x3FFFFFFUL;
  t7 += (t6 >> 26); t6 &= 0x3FFFFFFUL;
  t8 += (t7 >> 26); t7 &= 0x3FFFFFFUL;
  t9 += (t8 >> 26); t8 &= 0x3FFFFFFUL;

  /* ... except for a possible carry at bit 22 of t9 (i.e. bit 256 of the field element) */
#ifdef VERIFY
  VERIFY_CHECK(t9 >> 23 == 0);
#endif
  r->n[0] = t0; r->n[1] = t1; r->n[2] = t2; r->n[3] = t3; r->n[4] = t4;
  r->n[5] = t5; r->n[6] = t6; r->n[7] = t7; r->n[8] = t8; r->n[9] = t9;

#ifdef VERIFY
  r->magnitude = 1;
  secp256k1_fe_verify(r);
#endif
}

void secp256k1_fe_normalize_var(secp256k1_fe *r) {
    uint32_t t0 = r->n[0], t1 = r->n[1], t2 = r->n[2], t3 = r->n[3], t4 = r->n[4],
             t5 = r->n[5], t6 = r->n[6], t7 = r->n[7], t8 = r->n[8], t9 = r->n[9];

    /* Reduce t9 at the start so there will be at most a single carry from the first pass */
    uint32_t m;
    uint32_t x = t9 >> 22; t9 &= 0x03FFFFFUL;

    /* The first pass ensures the magnitude is 1, ... */
    t0 += x * 0x3D1UL; t1 += (x << 6);
    t1 += (t0 >> 26); t0 &= 0x3FFFFFFUL;
    t2 += (t1 >> 26); t1 &= 0x3FFFFFFUL;
    t3 += (t2 >> 26); t2 &= 0x3FFFFFFUL; m = t2;
    t4 += (t3 >> 26); t3 &= 0x3FFFFFFUL; m &= t3;
    t5 += (t4 >> 26); t4 &= 0x3FFFFFFUL; m &= t4;
    t6 += (t5 >> 26); t5 &= 0x3FFFFFFUL; m &= t5;
    t7 += (t6 >> 26); t6 &= 0x3FFFFFFUL; m &= t6;
    t8 += (t7 >> 26); t7 &= 0x3FFFFFFUL; m &= t7;
    t9 += (t8 >> 26); t8 &= 0x3FFFFFFUL; m &= t8;

    /* ... except for a possible carry at bit 22 of t9 (i.e. bit 256 of the field element) */
#ifdef VERIFY
    VERIFY_CHECK(t9 >> 23 == 0);
#endif
    /* At most a single final reduction is needed; check if the value is >= the field characteristic */
    x = (t9 >> 22) | ((t9 == 0x03FFFFFUL) & (m == 0x3FFFFFFUL)
        & ((t1 + 0x40UL + ((t0 + 0x3D1UL) >> 26)) > 0x3FFFFFFUL));

    if (x) {
        t0 += 0x3D1UL; t1 += (x << 6);
        t1 += (t0 >> 26); t0 &= 0x3FFFFFFUL;
        t2 += (t1 >> 26); t1 &= 0x3FFFFFFUL;
        t3 += (t2 >> 26); t2 &= 0x3FFFFFFUL;
        t4 += (t3 >> 26); t3 &= 0x3FFFFFFUL;
        t5 += (t4 >> 26); t4 &= 0x3FFFFFFUL;
        t6 += (t5 >> 26); t5 &= 0x3FFFFFFUL;
        t7 += (t6 >> 26); t6 &= 0x3FFFFFFUL;
        t8 += (t7 >> 26); t7 &= 0x3FFFFFFUL;
        t9 += (t8 >> 26); t8 &= 0x3FFFFFFUL;

        /* If t9 didn't carry to bit 22 already, then it should have after any final reduction */
#ifdef VERIFY
        VERIFY_CHECK(t9 >> 22 == x);
#endif
        /* Mask off the possible multiple of 2^256 from the final reduction */
        t9 &= 0x03FFFFFUL;
    }

    r->n[0] = t0; r->n[1] = t1; r->n[2] = t2; r->n[3] = t3; r->n[4] = t4;
    r->n[5] = t5; r->n[6] = t6; r->n[7] = t7; r->n[8] = t8; r->n[9] = t9;

#ifdef VERIFY
    r->magnitude = 1;
    r->normalized = 1;
    secp256k1_fe_verify(r);
#endif
}

int secp256k1_fe_normalizes_to_zero(secp256k1_fe *r) {
    uint32_t t0 = r->n[0], t1 = r->n[1], t2 = r->n[2], t3 = r->n[3], t4 = r->n[4],
             t5 = r->n[5], t6 = r->n[6], t7 = r->n[7], t8 = r->n[8], t9 = r->n[9];

    /* z0 tracks a possible raw value of 0, z1 tracks a possible raw value of P */
    uint32_t z0, z1;

    /* Reduce t9 at the start so there will be at most a single carry from the first pass */
    uint32_t x = t9 >> 22; t9 &= 0x03FFFFFUL;

    /* The first pass ensures the magnitude is 1, ... */
    t0 += x * 0x3D1UL; t1 += (x << 6);
    t1 += (t0 >> 26); t0 &= 0x3FFFFFFUL; z0  = t0; z1  = t0 ^ 0x3D0UL;
    t2 += (t1 >> 26); t1 &= 0x3FFFFFFUL; z0 |= t1; z1 &= t1 ^ 0x40UL;
    t3 += (t2 >> 26); t2 &= 0x3FFFFFFUL; z0 |= t2; z1 &= t2;
    t4 += (t3 >> 26); t3 &= 0x3FFFFFFUL; z0 |= t3; z1 &= t3;
    t5 += (t4 >> 26); t4 &= 0x3FFFFFFUL; z0 |= t4; z1 &= t4;
    t6 += (t5 >> 26); t5 &= 0x3FFFFFFUL; z0 |= t5; z1 &= t5;
    t7 += (t6 >> 26); t6 &= 0x3FFFFFFUL; z0 |= t6; z1 &= t6;
    t8 += (t7 >> 26); t7 &= 0x3FFFFFFUL; z0 |= t7; z1 &= t7;
    t9 += (t8 >> 26); t8 &= 0x3FFFFFFUL; z0 |= t8; z1 &= t8;
                                         z0 |= t9; z1 &= t9 ^ 0x3C00000UL;

    /* ... except for a possible carry at bit 22 of t9 (i.e. bit 256 of the field element) */
#ifdef VERIFY
    VERIFY_CHECK(t9 >> 23 == 0);
#endif
    return (z0 == 0) | (z1 == 0x3FFFFFFUL);
}

int secp256k1_fe_normalizes_to_zero_var(secp256k1_fe *r) {
    uint32_t t0, t1, t2, t3, t4, t5, t6, t7, t8, t9;
    uint32_t z0, z1;
    uint32_t x;

    t0 = r->n[0];
    t9 = r->n[9];

    /* Reduce t9 at the start so there will be at most a single carry from the first pass */
    x = t9 >> 22;

    /* The first pass ensures the magnitude is 1, ... */
    t0 += x * 0x3D1UL;

    /* z0 tracks a possible raw value of 0, z1 tracks a possible raw value of P */
    z0 = t0 & 0x3FFFFFFUL;
    z1 = z0 ^ 0x3D0UL;

    /* Fast return path should catch the majority of cases */
    if ((z0 != 0UL) & (z1 != 0x3FFFFFFUL)) {
        return 0;
    }

    t1 = r->n[1];
    t2 = r->n[2];
    t3 = r->n[3];
    t4 = r->n[4];
    t5 = r->n[5];
    t6 = r->n[6];
    t7 = r->n[7];
    t8 = r->n[8];

    t9 &= 0x03FFFFFUL;
    t1 += (x << 6);

    t1 += (t0 >> 26);
    t2 += (t1 >> 26); t1 &= 0x3FFFFFFUL; z0 |= t1; z1 &= t1 ^ 0x40UL;
    t3 += (t2 >> 26); t2 &= 0x3FFFFFFUL; z0 |= t2; z1 &= t2;
    t4 += (t3 >> 26); t3 &= 0x3FFFFFFUL; z0 |= t3; z1 &= t3;
    t5 += (t4 >> 26); t4 &= 0x3FFFFFFUL; z0 |= t4; z1 &= t4;
    t6 += (t5 >> 26); t5 &= 0x3FFFFFFUL; z0 |= t5; z1 &= t5;
    t7 += (t6 >> 26); t6 &= 0x3FFFFFFUL; z0 |= t6; z1 &= t6;
    t8 += (t7 >> 26); t7 &= 0x3FFFFFFUL; z0 |= t7; z1 &= t7;
    t9 += (t8 >> 26); t8 &= 0x3FFFFFFUL; z0 |= t8; z1 &= t8;
                                         z0 |= t9; z1 &= t9 ^ 0x3C00000UL;

    /* ... except for a possible carry at bit 22 of t9 (i.e. bit 256 of the field element) */
#ifdef VERIFY
    VERIFY_CHECK(t9 >> 23 == 0);
#endif
    return (z0 == 0) | (z1 == 0x3FFFFFFUL);
}

void secp256k1_fe_set_int__global(__global secp256k1_fe *r, int a) {
    r->n[0] = a;
    r->n[1] = r->n[2] = r->n[3] = r->n[4] = r->n[5] = r->n[6] = r->n[7] = r->n[8] = r->n[9] = 0;
#ifdef VERIFY
    r->magnitude = 1;
    r->normalized = 1;
    secp256k1_fe_verify(r);
#endif
}

void secp256k1_fe_set_int(secp256k1_fe *r, int a) {
    r->n[0] = a;
    r->n[1] = r->n[2] = r->n[3] = r->n[4] = r->n[5] = r->n[6] = r->n[7] = r->n[8] = r->n[9] = 0;
#ifdef VERIFY
    r->magnitude = 1;
    r->normalized = 1;
    secp256k1_fe_verify(r);
#endif
}

int secp256k1_fe_is_zero(const secp256k1_fe *a) {
    const uint32_t *t = a->n;
#ifdef VERIFY
    VERIFY_CHECK(a->normalized);
    secp256k1_fe_verify(a);
#endif
    return (t[0] | t[1] | t[2] | t[3] | t[4] | t[5] | t[6] | t[7] | t[8] | t[9]) == 0;
}

int secp256k1_fe_is_odd(const secp256k1_fe *a) {
#ifdef VERIFY
    VERIFY_CHECK(a->normalized);
    secp256k1_fe_verify(a);
#endif
    return a->n[0] & 1;
}

static void secp256k1_fe_clear(secp256k1_fe *a) {
    int i;
#ifdef VERIFY
    a->magnitude = 0;
    a->normalized = 1;
#endif
    for (i=0; i<10; i++) {
        a->n[i] = 0;
    }
}

/** Convert a field element to a 32-byte big endian value. Requires the input to be normalized */
void secp256k1_fe_get_b32(unsigned char *r, const secp256k1_fe *a) {
  int i;
#ifdef VERIFY
  VERIFY_CHECK(a->normalized);
  secp256k1_fe_verify(a);
#endif
  for (i = 0; i < 32; i ++) {
    int j;
    int c = 0;
    for (j = 0; j < 4; j ++) {
        int limb = (8 * i + 2 * j) / 26;
        int shift = (8 * i + 2 * j) % 26;
        c |= ((a->n[limb] >> shift) & 0x3) << (2 * j);
    }
    r[31 - i] = c;
  }
}

void secp256k1_fe_get_b32__to__global(__global unsigned char *r, const secp256k1_fe *a) {
  int i;
#ifdef VERIFY
  VERIFY_CHECK(a->normalized);
  secp256k1_fe_verify(a);
#endif
  for (i = 0; i < 32; i ++) {
    int j;
    int c = 0;
    for (j = 0; j < 4; j ++) {
      int limb = (8 * i + 2 * j) / 26;
      int shift = (8 * i + 2 * j) % 26;
      c |= ((a->n[limb] >> shift) & 0x3) << (2 * j);
    }
    r[31 - i] = c;
  }
}

void secp256k1_fe_negate(secp256k1_fe *r, const secp256k1_fe *a, int m) {
#ifdef VERIFY
    VERIFY_CHECK(a->magnitude <= m);
    secp256k1_fe_verify(a);
#endif
    r->n[0] = 0x3FFFC2FUL * 2 * (m + 1) - a->n[0];
    r->n[1] = 0x3FFFFBFUL * 2 * (m + 1) - a->n[1];
    r->n[2] = 0x3FFFFFFUL * 2 * (m + 1) - a->n[2];
    r->n[3] = 0x3FFFFFFUL * 2 * (m + 1) - a->n[3];
    r->n[4] = 0x3FFFFFFUL * 2 * (m + 1) - a->n[4];
    r->n[5] = 0x3FFFFFFUL * 2 * (m + 1) - a->n[5];
    r->n[6] = 0x3FFFFFFUL * 2 * (m + 1) - a->n[6];
    r->n[7] = 0x3FFFFFFUL * 2 * (m + 1) - a->n[7];
    r->n[8] = 0x3FFFFFFUL * 2 * (m + 1) - a->n[8];
    r->n[9] = 0x03FFFFFUL * 2 * (m + 1) - a->n[9];
#ifdef VERIFY
    r->magnitude = m + 1;
    r->normalized = 0;
    secp256k1_fe_verify(r);
#endif
}

void secp256k1_fe_mul_int(secp256k1_fe *r, int a) {
    r->n[0] *= a;
    r->n[1] *= a;
    r->n[2] *= a;
    r->n[3] *= a;
    r->n[4] *= a;
    r->n[5] *= a;
    r->n[6] *= a;
    r->n[7] *= a;
    r->n[8] *= a;
    r->n[9] *= a;
#ifdef VERIFY
    r->magnitude *= a;
    r->normalized = 0;
    secp256k1_fe_verify(r);
#endif
}



#define VERIFY_BITS(x, n) do { } while(0)


//#define VERIFY_BITS(x, n) if (((x) >> (n)) != 0) assertFalse("Bad bits", NULL);

static void secp256k1_fe_sqr_inner(uint32_t *r, const uint32_t *a) {
    uint64_t c, d;
    uint64_t u0, u1, u2, u3, u4, u5, u6, u7, u8;
    uint32_t t9, t0, t1, t2, t3, t4, t5, t6, t7;
    const uint32_t M = 0x3FFFFFFUL, R0 = 0x3D10UL, R1 = 0x400UL;

    VERIFY_BITS(a[0], 30);
    VERIFY_BITS(a[1], 30);
    VERIFY_BITS(a[2], 30);
    VERIFY_BITS(a[3], 30);
    VERIFY_BITS(a[4], 30);
    VERIFY_BITS(a[5], 30);
    VERIFY_BITS(a[6], 30);
    VERIFY_BITS(a[7], 30);
    VERIFY_BITS(a[8], 30);
    VERIFY_BITS(a[9], 26);

    /** [... a b c] is a shorthand for ... + a<<52 + b<<26 + c<<0 mod n.
     *  px is a shorthand for sum(a[i]*a[x-i], i=0..x).
     *  Note that [x 0 0 0 0 0 0 0 0 0 0] = [x*R1 x*R0].
     */

    d  = (uint64_t)(a[0]*2) * a[9]
       + (uint64_t)(a[1]*2) * a[8]
       + (uint64_t)(a[2]*2) * a[7]
       + (uint64_t)(a[3]*2) * a[6]
       + (uint64_t)(a[4]*2) * a[5];
    /* VERIFY_BITS(d, 64); */
    /* [d 0 0 0 0 0 0 0 0 0] = [p9 0 0 0 0 0 0 0 0 0] */
    t9 = d & M; d >>= 26;
    VERIFY_BITS(t9, 26);
    VERIFY_BITS(d, 38);
    /* [d t9 0 0 0 0 0 0 0 0 0] = [p9 0 0 0 0 0 0 0 0 0] */

    c  = (uint64_t)a[0] * a[0];
    VERIFY_BITS(c, 60);
    /* [d t9 0 0 0 0 0 0 0 0 c] = [p9 0 0 0 0 0 0 0 0 p0] */
    d += (uint64_t)(a[1]*2) * a[9]
       + (uint64_t)(a[2]*2) * a[8]
       + (uint64_t)(a[3]*2) * a[7]
       + (uint64_t)(a[4]*2) * a[6]
       + (uint64_t)a[5] * a[5];
    VERIFY_BITS(d, 63);
    /* [d t9 0 0 0 0 0 0 0 0 c] = [p10 p9 0 0 0 0 0 0 0 0 p0] */
    u0 = d & M; d >>= 26; c += u0 * R0;
    VERIFY_BITS(u0, 26);
    VERIFY_BITS(d, 37);
    VERIFY_BITS(c, 61);
    /* [d u0 t9 0 0 0 0 0 0 0 0 c-u0*R0] = [p10 p9 0 0 0 0 0 0 0 0 p0] */
    t0 = c & M; c >>= 26; c += u0 * R1;
    VERIFY_BITS(t0, 26);
    VERIFY_BITS(c, 37);
    /* [d u0 t9 0 0 0 0 0 0 0 c-u0*R1 t0-u0*R0] = [p10 p9 0 0 0 0 0 0 0 0 p0] */
    /* [d 0 t9 0 0 0 0 0 0 0 c t0] = [p10 p9 0 0 0 0 0 0 0 0 p0] */

    c += (uint64_t)(a[0]*2) * a[1];
    VERIFY_BITS(c, 62);
    /* [d 0 t9 0 0 0 0 0 0 0 c t0] = [p10 p9 0 0 0 0 0 0 0 p1 p0] */
    d += (uint64_t)(a[2]*2) * a[9]
       + (uint64_t)(a[3]*2) * a[8]
       + (uint64_t)(a[4]*2) * a[7]
       + (uint64_t)(a[5]*2) * a[6];
    VERIFY_BITS(d, 63);
    /* [d 0 t9 0 0 0 0 0 0 0 c t0] = [p11 p10 p9 0 0 0 0 0 0 0 p1 p0] */
    u1 = d & M; d >>= 26; c += u1 * R0;
    VERIFY_BITS(u1, 26);
    VERIFY_BITS(d, 37);
    VERIFY_BITS(c, 63);
    /* [d u1 0 t9 0 0 0 0 0 0 0 c-u1*R0 t0] = [p11 p10 p9 0 0 0 0 0 0 0 p1 p0] */
    t1 = c & M; c >>= 26; c += u1 * R1;
    VERIFY_BITS(t1, 26);
    VERIFY_BITS(c, 38);
    /* [d u1 0 t9 0 0 0 0 0 0 c-u1*R1 t1-u1*R0 t0] = [p11 p10 p9 0 0 0 0 0 0 0 p1 p0] */
    /* [d 0 0 t9 0 0 0 0 0 0 c t1 t0] = [p11 p10 p9 0 0 0 0 0 0 0 p1 p0] */

    c += (uint64_t)(a[0]*2) * a[2]
       + (uint64_t)a[1] * a[1];
    VERIFY_BITS(c, 62);
    /* [d 0 0 t9 0 0 0 0 0 0 c t1 t0] = [p11 p10 p9 0 0 0 0 0 0 p2 p1 p0] */
    d += (uint64_t)(a[3]*2) * a[9]
       + (uint64_t)(a[4]*2) * a[8]
       + (uint64_t)(a[5]*2) * a[7]
       + (uint64_t)a[6] * a[6];
    VERIFY_BITS(d, 63);
    /* [d 0 0 t9 0 0 0 0 0 0 c t1 t0] = [p12 p11 p10 p9 0 0 0 0 0 0 p2 p1 p0] */
    u2 = d & M; d >>= 26; c += u2 * R0;
    VERIFY_BITS(u2, 26);
    VERIFY_BITS(d, 37);
    VERIFY_BITS(c, 63);
    /* [d u2 0 0 t9 0 0 0 0 0 0 c-u2*R0 t1 t0] = [p12 p11 p10 p9 0 0 0 0 0 0 p2 p1 p0] */
    t2 = c & M; c >>= 26; c += u2 * R1;
    VERIFY_BITS(t2, 26);
    VERIFY_BITS(c, 38);
    /* [d u2 0 0 t9 0 0 0 0 0 c-u2*R1 t2-u2*R0 t1 t0] = [p12 p11 p10 p9 0 0 0 0 0 0 p2 p1 p0] */
    /* [d 0 0 0 t9 0 0 0 0 0 c t2 t1 t0] = [p12 p11 p10 p9 0 0 0 0 0 0 p2 p1 p0] */

    c += (uint64_t)(a[0]*2) * a[3]
       + (uint64_t)(a[1]*2) * a[2];
    VERIFY_BITS(c, 63);
    /* [d 0 0 0 t9 0 0 0 0 0 c t2 t1 t0] = [p12 p11 p10 p9 0 0 0 0 0 p3 p2 p1 p0] */
    d += (uint64_t)(a[4]*2) * a[9]
       + (uint64_t)(a[5]*2) * a[8]
       + (uint64_t)(a[6]*2) * a[7];
    VERIFY_BITS(d, 63);
    /* [d 0 0 0 t9 0 0 0 0 0 c t2 t1 t0] = [p13 p12 p11 p10 p9 0 0 0 0 0 p3 p2 p1 p0] */
    u3 = d & M; d >>= 26; c += u3 * R0;
    VERIFY_BITS(u3, 26);
    VERIFY_BITS(d, 37);
    /* VERIFY_BITS(c, 64); */
    /* [d u3 0 0 0 t9 0 0 0 0 0 c-u3*R0 t2 t1 t0] = [p13 p12 p11 p10 p9 0 0 0 0 0 p3 p2 p1 p0] */
    t3 = c & M; c >>= 26; c += u3 * R1;
    VERIFY_BITS(t3, 26);
    VERIFY_BITS(c, 39);
    /* [d u3 0 0 0 t9 0 0 0 0 c-u3*R1 t3-u3*R0 t2 t1 t0] = [p13 p12 p11 p10 p9 0 0 0 0 0 p3 p2 p1 p0] */
    /* [d 0 0 0 0 t9 0 0 0 0 c t3 t2 t1 t0] = [p13 p12 p11 p10 p9 0 0 0 0 0 p3 p2 p1 p0] */

    c += (uint64_t)(a[0]*2) * a[4]
       + (uint64_t)(a[1]*2) * a[3]
       + (uint64_t)a[2] * a[2];
    VERIFY_BITS(c, 63);
    /* [d 0 0 0 0 t9 0 0 0 0 c t3 t2 t1 t0] = [p13 p12 p11 p10 p9 0 0 0 0 p4 p3 p2 p1 p0] */
    d += (uint64_t)(a[5]*2) * a[9]
       + (uint64_t)(a[6]*2) * a[8]
       + (uint64_t)a[7] * a[7];
    VERIFY_BITS(d, 62);
    /* [d 0 0 0 0 t9 0 0 0 0 c t3 t2 t1 t0] = [p14 p13 p12 p11 p10 p9 0 0 0 0 p4 p3 p2 p1 p0] */
    u4 = d & M; d >>= 26; c += u4 * R0;
    VERIFY_BITS(u4, 26);
    VERIFY_BITS(d, 36);
    /* VERIFY_BITS(c, 64); */
    /* [d u4 0 0 0 0 t9 0 0 0 0 c-u4*R0 t3 t2 t1 t0] = [p14 p13 p12 p11 p10 p9 0 0 0 0 p4 p3 p2 p1 p0] */
    t4 = c & M; c >>= 26; c += u4 * R1;
    VERIFY_BITS(t4, 26);
    VERIFY_BITS(c, 39);
    /* [d u4 0 0 0 0 t9 0 0 0 c-u4*R1 t4-u4*R0 t3 t2 t1 t0] = [p14 p13 p12 p11 p10 p9 0 0 0 0 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 t9 0 0 0 c t4 t3 t2 t1 t0] = [p14 p13 p12 p11 p10 p9 0 0 0 0 p4 p3 p2 p1 p0] */

    c += (uint64_t)(a[0]*2) * a[5]
       + (uint64_t)(a[1]*2) * a[4]
       + (uint64_t)(a[2]*2) * a[3];
    VERIFY_BITS(c, 63);
    /* [d 0 0 0 0 0 t9 0 0 0 c t4 t3 t2 t1 t0] = [p14 p13 p12 p11 p10 p9 0 0 0 p5 p4 p3 p2 p1 p0] */
    d += (uint64_t)(a[6]*2) * a[9]
       + (uint64_t)(a[7]*2) * a[8];
    VERIFY_BITS(d, 62);
    /* [d 0 0 0 0 0 t9 0 0 0 c t4 t3 t2 t1 t0] = [p15 p14 p13 p12 p11 p10 p9 0 0 0 p5 p4 p3 p2 p1 p0] */
    u5 = d & M; d >>= 26; c += u5 * R0;
    VERIFY_BITS(u5, 26);
    VERIFY_BITS(d, 36);
    /* VERIFY_BITS(c, 64); */
    /* [d u5 0 0 0 0 0 t9 0 0 0 c-u5*R0 t4 t3 t2 t1 t0] = [p15 p14 p13 p12 p11 p10 p9 0 0 0 p5 p4 p3 p2 p1 p0] */
    t5 = c & M; c >>= 26; c += u5 * R1;
    VERIFY_BITS(t5, 26);
    VERIFY_BITS(c, 39);
    /* [d u5 0 0 0 0 0 t9 0 0 c-u5*R1 t5-u5*R0 t4 t3 t2 t1 t0] = [p15 p14 p13 p12 p11 p10 p9 0 0 0 p5 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 0 t9 0 0 c t5 t4 t3 t2 t1 t0] = [p15 p14 p13 p12 p11 p10 p9 0 0 0 p5 p4 p3 p2 p1 p0] */

    c += (uint64_t)(a[0]*2) * a[6]
       + (uint64_t)(a[1]*2) * a[5]
       + (uint64_t)(a[2]*2) * a[4]
       + (uint64_t)a[3] * a[3];
    VERIFY_BITS(c, 63);
    /* [d 0 0 0 0 0 0 t9 0 0 c t5 t4 t3 t2 t1 t0] = [p15 p14 p13 p12 p11 p10 p9 0 0 p6 p5 p4 p3 p2 p1 p0] */
    d += (uint64_t)(a[7]*2) * a[9]
       + (uint64_t)a[8] * a[8];
    VERIFY_BITS(d, 61);
    /* [d 0 0 0 0 0 0 t9 0 0 c t5 t4 t3 t2 t1 t0] = [p16 p15 p14 p13 p12 p11 p10 p9 0 0 p6 p5 p4 p3 p2 p1 p0] */
    u6 = d & M; d >>= 26; c += u6 * R0;
    VERIFY_BITS(u6, 26);
    VERIFY_BITS(d, 35);
    /* VERIFY_BITS(c, 64); */
    /* [d u6 0 0 0 0 0 0 t9 0 0 c-u6*R0 t5 t4 t3 t2 t1 t0] = [p16 p15 p14 p13 p12 p11 p10 p9 0 0 p6 p5 p4 p3 p2 p1 p0] */
    t6 = c & M; c >>= 26; c += u6 * R1;
    VERIFY_BITS(t6, 26);
    VERIFY_BITS(c, 39);
    /* [d u6 0 0 0 0 0 0 t9 0 c-u6*R1 t6-u6*R0 t5 t4 t3 t2 t1 t0] = [p16 p15 p14 p13 p12 p11 p10 p9 0 0 p6 p5 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 0 0 t9 0 c t6 t5 t4 t3 t2 t1 t0] = [p16 p15 p14 p13 p12 p11 p10 p9 0 0 p6 p5 p4 p3 p2 p1 p0] */

    c += (uint64_t)(a[0]*2) * a[7]
       + (uint64_t)(a[1]*2) * a[6]
       + (uint64_t)(a[2]*2) * a[5]
       + (uint64_t)(a[3]*2) * a[4];
    /* VERIFY_BITS(c, 64); */
#ifdef VERIFY
    VERIFY_CHECK(c <= 0x8000007C00000007ULL);
#endif
    /* [d 0 0 0 0 0 0 0 t9 0 c t6 t5 t4 t3 t2 t1 t0] = [p16 p15 p14 p13 p12 p11 p10 p9 0 p7 p6 p5 p4 p3 p2 p1 p0] */
    d += (uint64_t)(a[8]*2) * a[9];
    VERIFY_BITS(d, 58);
    /* [d 0 0 0 0 0 0 0 t9 0 c t6 t5 t4 t3 t2 t1 t0] = [p17 p16 p15 p14 p13 p12 p11 p10 p9 0 p7 p6 p5 p4 p3 p2 p1 p0] */
    u7 = d & M; d >>= 26; c += u7 * R0;
    VERIFY_BITS(u7, 26);
    VERIFY_BITS(d, 32);
    /* VERIFY_BITS(c, 64); */
#ifdef VERIFY
    VERIFY_CHECK(c <= 0x800001703FFFC2F7ULL);
#endif
    /* [d u7 0 0 0 0 0 0 0 t9 0 c-u7*R0 t6 t5 t4 t3 t2 t1 t0] = [p17 p16 p15 p14 p13 p12 p11 p10 p9 0 p7 p6 p5 p4 p3 p2 p1 p0] */
    t7 = c & M; c >>= 26; c += u7 * R1;
    VERIFY_BITS(t7, 26);
    VERIFY_BITS(c, 38);
    /* [d u7 0 0 0 0 0 0 0 t9 c-u7*R1 t7-u7*R0 t6 t5 t4 t3 t2 t1 t0] = [p17 p16 p15 p14 p13 p12 p11 p10 p9 0 p7 p6 p5 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 0 0 0 t9 c t7 t6 t5 t4 t3 t2 t1 t0] = [p17 p16 p15 p14 p13 p12 p11 p10 p9 0 p7 p6 p5 p4 p3 p2 p1 p0] */

    c += (uint64_t)(a[0]*2) * a[8]
       + (uint64_t)(a[1]*2) * a[7]
       + (uint64_t)(a[2]*2) * a[6]
       + (uint64_t)(a[3]*2) * a[5]
       + (uint64_t)a[4] * a[4];
    /* VERIFY_BITS(c, 64); */
#ifdef VERIFY
    VERIFY_CHECK(c <= 0x9000007B80000008ULL);
#endif
    /* [d 0 0 0 0 0 0 0 0 t9 c t7 t6 t5 t4 t3 t2 t1 t0] = [p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    d += (uint64_t)a[9] * a[9];
    VERIFY_BITS(d, 57);
    /* [d 0 0 0 0 0 0 0 0 t9 c t7 t6 t5 t4 t3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    u8 = d & M; d >>= 26; c += u8 * R0;
    VERIFY_BITS(u8, 26);
    VERIFY_BITS(d, 31);
    /* VERIFY_BITS(c, 64); */
#ifdef VERIFY
    VERIFY_CHECK(c <= 0x9000016FBFFFC2F8ULL);
#endif
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 t7 t6 t5 t4 t3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */

    r[3] = t3;
    VERIFY_BITS(r[3], 26);
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 t7 t6 t5 t4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[4] = t4;
    VERIFY_BITS(r[4], 26);
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 t7 t6 t5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[5] = t5;
    VERIFY_BITS(r[5], 26);
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 t7 t6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[6] = t6;
    VERIFY_BITS(r[6], 26);
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 t7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[7] = t7;
    VERIFY_BITS(r[7], 26);
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */

    r[8] = c & M; c >>= 26; c += u8 * R1;
    VERIFY_BITS(r[8], 26);
    VERIFY_BITS(c, 39);
    /* [d u8 0 0 0 0 0 0 0 0 t9+c-u8*R1 r8-u8*R0 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 0 0 0 0 t9+c r8 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    c   += d * R0 + t9;
    VERIFY_BITS(c, 45);
    /* [d 0 0 0 0 0 0 0 0 0 c-d*R0 r8 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[9] = c & (M >> 4); c >>= 22; c += d * (R1 << 4);
    VERIFY_BITS(r[9], 22);
    VERIFY_BITS(c, 46);
    /* [d 0 0 0 0 0 0 0 0 r9+((c-d*R1<<4)<<22)-d*R0 r8 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 0 0 -d*R1 r9+(c<<22)-d*R0 r8 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    /* [r9+(c<<22) r8 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */

    d    = c * (R0 >> 4) + t0;
    VERIFY_BITS(d, 56);
    /* [r9+(c<<22) r8 r7 r6 r5 r4 r3 t2 t1 d-c*R0>>4] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[0] = d & M; d >>= 26;
    VERIFY_BITS(r[0], 26);
    VERIFY_BITS(d, 30);
    /* [r9+(c<<22) r8 r7 r6 r5 r4 r3 t2 t1+d r0-c*R0>>4] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    d   += c * (R1 >> 4) + t1;
    VERIFY_BITS(d, 53);
#ifdef VERIFY
    VERIFY_CHECK(d <= 0x10000003FFFFBFULL);
#endif
    /* [r9+(c<<22) r8 r7 r6 r5 r4 r3 t2 d-c*R1>>4 r0-c*R0>>4] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    /* [r9 r8 r7 r6 r5 r4 r3 t2 d r0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[1] = d & M; d >>= 26;
    VERIFY_BITS(r[1], 26);
    VERIFY_BITS(d, 27);
#ifdef VERIFY
    VERIFY_CHECK(d <= 0x4000000ULL);
#endif
    /* [r9 r8 r7 r6 r5 r4 r3 t2+d r1 r0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    d   += t2;
    VERIFY_BITS(d, 27);
    /* [r9 r8 r7 r6 r5 r4 r3 d r1 r0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[2] = d;
    VERIFY_BITS(r[2], 27);
    /* [r9 r8 r7 r6 r5 r4 r3 r2 r1 r0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
}

#undef VERIFY_BITS
#define VERIFY_BITS(x, n) if (((x) >> (n)) != 0) memoryPool_write_uint_asOutput(10, 11, memoryPool);
#define VERIFY_CHECK(X) if (!(X)) memoryPool_write_uint_asOutput(12, 11, memoryPool);
#define VERIFY

static void secp256k1_fe_sqr_inner__with_debug(uint32_t *r, const uint32_t *a, __global unsigned char* memoryPool) {
  //int debugWarning;
  uint64_t c, d;
  uint64_t u0, u1, u2, u3, u4, u5, u6, u7, u8;
  uint32_t t9, t0, t1, t2, t3, t4, t5, t6, t7;
  const uint32_t M = 0x3FFFFFFUL, R0 = 0x3D10UL, R1 = 0x400UL;

  VERIFY_BITS(a[0], 30);
  VERIFY_BITS(a[1], 30);
  VERIFY_BITS(a[2], 30);
  VERIFY_BITS(a[3], 30);
  VERIFY_BITS(a[4], 30);
  VERIFY_BITS(a[5], 30);
  VERIFY_BITS(a[6], 30);
  VERIFY_BITS(a[7], 30);
  VERIFY_BITS(a[8], 30);
  VERIFY_BITS(a[9], 26);

  //
  //int debugWarning4;
  //secp256k1_fe outputTemp;
  //for (int counter = 0; counter < 10; counter ++) {
  //  r[counter] = 0;
  //  outputTemp.n[counter] = 0;
  //}
  //memoryPool_write_fe_asOutput(& outputTemp, - 1 , memoryPool);
  //

  /** [... a b c] is a shorthand for ... + a<<52 + b<<26 + c<<0 mod n.
   *  px is a shorthand for sum(a[i]*a[x-i], i=0..x).
   *  Note that [x 0 0 0 0 0 0 0 0 0 0] = [x*R1 x*R0].
   */

  d = (uint64_t)(a[0]*2) * a[9]
    + (uint64_t)(a[1]*2) * a[8]
    + (uint64_t)(a[2]*2) * a[7]
    + (uint64_t)(a[3]*2) * a[6]
    + (uint64_t)(a[4]*2) * a[5];
    /* VERIFY_BITS(d, 64); */
    /* [d 0 0 0 0 0 0 0 0 0] = [p9 0 0 0 0 0 0 0 0 0] */
  t9 = d & M;
  d >>= 26;
  VERIFY_BITS(t9, 26);
  VERIFY_BITS(d, 38);
  /* [d t9 0 0 0 0 0 0 0 0 0] = [p9 0 0 0 0 0 0 0 0 0] */

  c  = ((uint64_t) a[0] ) * ((uint64_t) a[0]);


  //outputTemp.n[1] = c;
  //outputTemp.n[8] = (uint32_t) c ;
  //outputTemp.n[9] = (uint32_t) (c >> 32) ;



  VERIFY_BITS(c, 60);
  /* [d t9 0 0 0 0 0 0 0 0 c] = [p9 0 0 0 0 0 0 0 0 p0] */
  d += (uint64_t)(a[1] * 2) * a[9]
    + (uint64_t)(a[2] * 2) * a[8]
    + (uint64_t)(a[3] * 2) * a[7]
    + (uint64_t)(a[4] * 2) * a[6]
    + (uint64_t)a[5] * a[5];


  VERIFY_BITS(d, 63);
  /* [d t9 0 0 0 0 0 0 0 0 c] = [p10 p9 0 0 0 0 0 0 0 0 p0] */
  u0 = d & ((uint64_t) M);



  d >>= 26;

  //outputTemp.n[8] = (uint32_t) ((uint64_t) c);
  //outputTemp.n[9] = (uint32_t) (((uint64_t) c) >> 32);
  //memoryPool_write_fe_asOutput(& outputTemp, - 1 , memoryPool);
  //outputTemp.n[8] = (uint32_t) ((uint64_t) R0);
  //outputTemp.n[9] = (uint32_t) (((uint64_t) R0) >> 32);
  //memoryPool_write_fe_asOutput(& outputTemp, - 1 , memoryPool);
  //outputTemp.n[8] = (uint32_t) ((uint64_t) u0);
  //outputTemp.n[9] = (uint32_t) (((uint64_t) u0) >> 32);
  //memoryPool_write_fe_asOutput(& outputTemp, - 1 , memoryPool);

  c += u0 * ((uint64_t) R0);

  //outputTemp.n[8] = (uint32_t) ((uint64_t) c);
  //outputTemp.n[9] = (uint32_t) (((uint64_t) c) >> 32);
  //memoryPool_write_fe_asOutput(& outputTemp, - 1 , memoryPool);
  //int debugWarningN;
  //return;




  VERIFY_BITS(u0, 26);
  VERIFY_BITS(d, 37);
  VERIFY_BITS(c, 61);
  /* [d u0 t9 0 0 0 0 0 0 0 0 c-u0*R0] = [p10 p9 0 0 0 0 0 0 0 0 p0] */
  t0 = c & M;
  c >>= 26;




  c += u0 * R1;



  VERIFY_BITS(t0, 26);
  VERIFY_BITS(c, 37);
    /* [d u0 t9 0 0 0 0 0 0 0 c-u0*R1 t0-u0*R0] = [p10 p9 0 0 0 0 0 0 0 0 p0] */
    /* [d 0 t9 0 0 0 0 0 0 0 c t0] = [p10 p9 0 0 0 0 0 0 0 0 p0] */

  c += (uint64_t) (a[0] * 2) * ((uint64_t) a[1]);
    VERIFY_BITS(c, 62);
    /* [d 0 t9 0 0 0 0 0 0 0 c t0] = [p10 p9 0 0 0 0 0 0 0 p1 p0] */
    d += (uint64_t) (a[2] * 2) * a[9]
      + (uint64_t) (a[3] * 2) * a[8]
      + (uint64_t) (a[4] * 2) * a[7]
      + (uint64_t) (a[5] * 2) * a[6];

//  outputTemp.n[1] = c;


  VERIFY_BITS(d, 63);
  /* [d 0 t9 0 0 0 0 0 0 0 c t0] = [p11 p10 p9 0 0 0 0 0 0 0 p1 p0] */
  u1 = d & M; d >>= 26; c += u1 * R0;
  VERIFY_BITS(u1, 26);
  VERIFY_BITS(d, 37);
  VERIFY_BITS(c, 63);
  /* [d u1 0 t9 0 0 0 0 0 0 0 c-u1*R0 t0] = [p11 p10 p9 0 0 0 0 0 0 0 p1 p0] */
  t1 = c & M; c >>= 26; c += u1 * R1;

  //outputTemp.n[1] = t1;

    VERIFY_BITS(t1, 26);
    VERIFY_BITS(c, 38);
    /* [d u1 0 t9 0 0 0 0 0 0 c-u1*R1 t1-u1*R0 t0] = [p11 p10 p9 0 0 0 0 0 0 0 p1 p0] */
    /* [d 0 0 t9 0 0 0 0 0 0 c t1 t0] = [p11 p10 p9 0 0 0 0 0 0 0 p1 p0] */

    c += (uint64_t)(a[0]*2) * a[2]
       + (uint64_t)a[1] * a[1];
    VERIFY_BITS(c, 62);
    /* [d 0 0 t9 0 0 0 0 0 0 c t1 t0] = [p11 p10 p9 0 0 0 0 0 0 p2 p1 p0] */
    d += (uint64_t)(a[3] * 2) * a[9]
      + (uint64_t)(a[4] * 2) * a[8]
      + (uint64_t)(a[5] * 2) * a[7]
      + (uint64_t)a[6] * a[6];
    VERIFY_BITS(d, 63);
    /* [d 0 0 t9 0 0 0 0 0 0 c t1 t0] = [p12 p11 p10 p9 0 0 0 0 0 0 p2 p1 p0] */
    u2 = d & M; d >>= 26; c += u2 * R0;
    VERIFY_BITS(u2, 26);
    VERIFY_BITS(d, 37);
    VERIFY_BITS(c, 63);
    /* [d u2 0 0 t9 0 0 0 0 0 0 c-u2*R0 t1 t0] = [p12 p11 p10 p9 0 0 0 0 0 0 p2 p1 p0] */
    t2 = c & M; c >>= 26; c += u2 * R1;


    VERIFY_BITS(t2, 26);
    VERIFY_BITS(c, 38);
    /* [d u2 0 0 t9 0 0 0 0 0 c-u2*R1 t2-u2*R0 t1 t0] = [p12 p11 p10 p9 0 0 0 0 0 0 p2 p1 p0] */
    /* [d 0 0 0 t9 0 0 0 0 0 c t2 t1 t0] = [p12 p11 p10 p9 0 0 0 0 0 0 p2 p1 p0] */

    c += (uint64_t)(a[0]*2) * a[3]
       + (uint64_t)(a[1]*2) * a[2];
    VERIFY_BITS(c, 63);
    /* [d 0 0 0 t9 0 0 0 0 0 c t2 t1 t0] = [p12 p11 p10 p9 0 0 0 0 0 p3 p2 p1 p0] */
    d += (uint64_t)(a[4]*2) * a[9]
       + (uint64_t)(a[5]*2) * a[8]
       + (uint64_t)(a[6]*2) * a[7];
    VERIFY_BITS(d, 63);
    /* [d 0 0 0 t9 0 0 0 0 0 c t2 t1 t0] = [p13 p12 p11 p10 p9 0 0 0 0 0 p3 p2 p1 p0] */
    u3 = d & M; d >>= 26; c += u3 * R0;
    VERIFY_BITS(u3, 26);
    VERIFY_BITS(d, 37);
    /* VERIFY_BITS(c, 64); */
    /* [d u3 0 0 0 t9 0 0 0 0 0 c-u3*R0 t2 t1 t0] = [p13 p12 p11 p10 p9 0 0 0 0 0 p3 p2 p1 p0] */
    t3 = c & M; c >>= 26; c += u3 * R1;


    VERIFY_BITS(t3, 26);
    VERIFY_BITS(c, 39);
    /* [d u3 0 0 0 t9 0 0 0 0 c-u3*R1 t3-u3*R0 t2 t1 t0] = [p13 p12 p11 p10 p9 0 0 0 0 0 p3 p2 p1 p0] */
    /* [d 0 0 0 0 t9 0 0 0 0 c t3 t2 t1 t0] = [p13 p12 p11 p10 p9 0 0 0 0 0 p3 p2 p1 p0] */

    c += (uint64_t)(a[0]*2) * a[4]
       + (uint64_t)(a[1]*2) * a[3]
       + (uint64_t)a[2] * a[2];
    VERIFY_BITS(c, 63);
    /* [d 0 0 0 0 t9 0 0 0 0 c t3 t2 t1 t0] = [p13 p12 p11 p10 p9 0 0 0 0 p4 p3 p2 p1 p0] */
    d += (uint64_t)(a[5]*2) * a[9]
       + (uint64_t)(a[6]*2) * a[8]
       + (uint64_t)a[7] * a[7];
    VERIFY_BITS(d, 62);
    /* [d 0 0 0 0 t9 0 0 0 0 c t3 t2 t1 t0] = [p14 p13 p12 p11 p10 p9 0 0 0 0 p4 p3 p2 p1 p0] */
    u4 = d & M; d >>= 26; c += u4 * R0;
    VERIFY_BITS(u4, 26);
    VERIFY_BITS(d, 36);
    /* VERIFY_BITS(c, 64); */
    /* [d u4 0 0 0 0 t9 0 0 0 0 c-u4*R0 t3 t2 t1 t0] = [p14 p13 p12 p11 p10 p9 0 0 0 0 p4 p3 p2 p1 p0] */
    t4 = c & M; c >>= 26; c += u4 * R1;



    VERIFY_BITS(t4, 26);
    VERIFY_BITS(c, 39);
    /* [d u4 0 0 0 0 t9 0 0 0 c-u4*R1 t4-u4*R0 t3 t2 t1 t0] = [p14 p13 p12 p11 p10 p9 0 0 0 0 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 t9 0 0 0 c t4 t3 t2 t1 t0] = [p14 p13 p12 p11 p10 p9 0 0 0 0 p4 p3 p2 p1 p0] */

    c += (uint64_t)(a[0]*2) * a[5]
       + (uint64_t)(a[1]*2) * a[4]
       + (uint64_t)(a[2]*2) * a[3];
    VERIFY_BITS(c, 63);
    /* [d 0 0 0 0 0 t9 0 0 0 c t4 t3 t2 t1 t0] = [p14 p13 p12 p11 p10 p9 0 0 0 p5 p4 p3 p2 p1 p0] */
    d += (uint64_t)(a[6]*2) * a[9]
       + (uint64_t)(a[7]*2) * a[8];
    VERIFY_BITS(d, 62);
    /* [d 0 0 0 0 0 t9 0 0 0 c t4 t3 t2 t1 t0] = [p15 p14 p13 p12 p11 p10 p9 0 0 0 p5 p4 p3 p2 p1 p0] */
    u5 = d & M; d >>= 26; c += u5 * R0;
    VERIFY_BITS(u5, 26);
    VERIFY_BITS(d, 36);
    /* VERIFY_BITS(c, 64); */
    /* [d u5 0 0 0 0 0 t9 0 0 0 c-u5*R0 t4 t3 t2 t1 t0] = [p15 p14 p13 p12 p11 p10 p9 0 0 0 p5 p4 p3 p2 p1 p0] */

  t5 = c & M; c >>= 26; c += u5 * R1;


  VERIFY_BITS(t5, 26);
    VERIFY_BITS(c, 39);
    /* [d u5 0 0 0 0 0 t9 0 0 c-u5*R1 t5-u5*R0 t4 t3 t2 t1 t0] = [p15 p14 p13 p12 p11 p10 p9 0 0 0 p5 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 0 t9 0 0 c t5 t4 t3 t2 t1 t0] = [p15 p14 p13 p12 p11 p10 p9 0 0 0 p5 p4 p3 p2 p1 p0] */

    c += (uint64_t)(a[0]*2) * a[6]
       + (uint64_t)(a[1]*2) * a[5]
       + (uint64_t)(a[2]*2) * a[4]
       + (uint64_t)a[3] * a[3];
    VERIFY_BITS(c, 63);
    /* [d 0 0 0 0 0 0 t9 0 0 c t5 t4 t3 t2 t1 t0] = [p15 p14 p13 p12 p11 p10 p9 0 0 p6 p5 p4 p3 p2 p1 p0] */
    d += (uint64_t)(a[7]*2) * a[9]
       + (uint64_t)a[8] * a[8];
    VERIFY_BITS(d, 61);
    /* [d 0 0 0 0 0 0 t9 0 0 c t5 t4 t3 t2 t1 t0] = [p16 p15 p14 p13 p12 p11 p10 p9 0 0 p6 p5 p4 p3 p2 p1 p0] */
    u6 = d & M; d >>= 26; c += u6 * R0;
    VERIFY_BITS(u6, 26);
    VERIFY_BITS(d, 35);
    /* VERIFY_BITS(c, 64); */
    /* [d u6 0 0 0 0 0 0 t9 0 0 c-u6*R0 t5 t4 t3 t2 t1 t0] = [p16 p15 p14 p13 p12 p11 p10 p9 0 0 p6 p5 p4 p3 p2 p1 p0] */
    t6 = c & M; c >>= 26; c += u6 * R1;



    VERIFY_BITS(t6, 26);
    VERIFY_BITS(c, 39);
    /* [d u6 0 0 0 0 0 0 t9 0 c-u6*R1 t6-u6*R0 t5 t4 t3 t2 t1 t0] = [p16 p15 p14 p13 p12 p11 p10 p9 0 0 p6 p5 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 0 0 t9 0 c t6 t5 t4 t3 t2 t1 t0] = [p16 p15 p14 p13 p12 p11 p10 p9 0 0 p6 p5 p4 p3 p2 p1 p0] */

    c += (uint64_t)(a[0]*2) * a[7]
       + (uint64_t)(a[1]*2) * a[6]
       + (uint64_t)(a[2]*2) * a[5]
       + (uint64_t)(a[3]*2) * a[4];
    /* VERIFY_BITS(c, 64); */
#ifdef VERIFY
    VERIFY_CHECK(c <= 0x8000007C00000007UL);
#endif
    /* [d 0 0 0 0 0 0 0 t9 0 c t6 t5 t4 t3 t2 t1 t0] = [p16 p15 p14 p13 p12 p11 p10 p9 0 p7 p6 p5 p4 p3 p2 p1 p0] */
    d += (uint64_t)(a[8]*2) * a[9];
    VERIFY_BITS(d, 58);
    /* [d 0 0 0 0 0 0 0 t9 0 c t6 t5 t4 t3 t2 t1 t0] = [p17 p16 p15 p14 p13 p12 p11 p10 p9 0 p7 p6 p5 p4 p3 p2 p1 p0] */
    u7 = d & M; d >>= 26; c += u7 * R0;
    VERIFY_BITS(u7, 26);
    VERIFY_BITS(d, 32);
    /* VERIFY_BITS(c, 64); */
#ifdef VERIFY
    VERIFY_CHECK(c <= 0x800001703FFFC2F7UL);
#endif
    /* [d u7 0 0 0 0 0 0 0 t9 0 c-u7*R0 t6 t5 t4 t3 t2 t1 t0] = [p17 p16 p15 p14 p13 p12 p11 p10 p9 0 p7 p6 p5 p4 p3 p2 p1 p0] */
    t7 = c & M; c >>= 26; c += u7 * R1;




    VERIFY_BITS(t7, 26);
    VERIFY_BITS(c, 38);
    /* [d u7 0 0 0 0 0 0 0 t9 c-u7*R1 t7-u7*R0 t6 t5 t4 t3 t2 t1 t0] = [p17 p16 p15 p14 p13 p12 p11 p10 p9 0 p7 p6 p5 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 0 0 0 t9 c t7 t6 t5 t4 t3 t2 t1 t0] = [p17 p16 p15 p14 p13 p12 p11 p10 p9 0 p7 p6 p5 p4 p3 p2 p1 p0] */

    c += (uint64_t)(a[0]*2) * a[8]
       + (uint64_t)(a[1]*2) * a[7]
       + (uint64_t)(a[2]*2) * a[6]
       + (uint64_t)(a[3]*2) * a[5]
       + (uint64_t)a[4] * a[4];
    /* VERIFY_BITS(c, 64); */
#ifdef VERIFY
    VERIFY_CHECK(c <= 0x9000007B80000008UL);
#endif
    /* [d 0 0 0 0 0 0 0 0 t9 c t7 t6 t5 t4 t3 t2 t1 t0] = [p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    d += (uint64_t)a[9] * a[9];
    VERIFY_BITS(d, 57);
    /* [d 0 0 0 0 0 0 0 0 t9 c t7 t6 t5 t4 t3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    u8 = d & M; d >>= 26; c += u8 * R0;
    VERIFY_BITS(u8, 26);
    VERIFY_BITS(d, 31);
    /* VERIFY_BITS(c, 64); */
#ifdef VERIFY
    VERIFY_CHECK(c <= 0x9000016FBFFFC2F8UL);
#endif
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 t7 t6 t5 t4 t3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */

    r[3] = t3;
    VERIFY_BITS(r[3], 26);
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 t7 t6 t5 t4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[4] = t4;
    VERIFY_BITS(r[4], 26);
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 t7 t6 t5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[5] = t5;
    VERIFY_BITS(r[5], 26);
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 t7 t6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[6] = t6;
    VERIFY_BITS(r[6], 26);
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 t7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[7] = t7;
    VERIFY_BITS(r[7], 26);
    /* [d u8 0 0 0 0 0 0 0 0 t9 c-u8*R0 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */

    r[8] = c & M; c >>= 26; c += u8 * R1;
    VERIFY_BITS(r[8], 26);
    VERIFY_BITS(c, 39);
    /* [d u8 0 0 0 0 0 0 0 0 t9+c-u8*R1 r8-u8*R0 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 0 0 0 0 t9+c r8 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */

    //int debugWarning3;
    //for (int counter = 0; counter < 10; counter ++) {
    //  outputTemp.n[counter] = r[counter];
    //}
    //memoryPool_write_fe_asOutput(& outputTemp, -1 , memoryPool);

    c   += d * R0 + t9;
    VERIFY_BITS(c, 45);
    /* [d 0 0 0 0 0 0 0 0 0 c-d*R0 r8 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[9] = c & (M >> 4); c >>= 22; c += d * (R1 << 4);
    VERIFY_BITS(r[9], 22);
    VERIFY_BITS(c, 46);
    /* [d 0 0 0 0 0 0 0 0 r9+((c-d*R1<<4)<<22)-d*R0 r8 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    /* [d 0 0 0 0 0 0 0 -d*R1 r9+(c<<22)-d*R0 r8 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    /* [r9+(c<<22) r8 r7 r6 r5 r4 r3 t2 t1 t0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */

    d    = c * (R0 >> 4) + t0;
    VERIFY_BITS(d, 56);
    /* [r9+(c<<22) r8 r7 r6 r5 r4 r3 t2 t1 d-c*R0>>4] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[0] = d & M; d >>= 26;
    VERIFY_BITS(r[0], 26);
    VERIFY_BITS(d, 30);
    /* [r9+(c<<22) r8 r7 r6 r5 r4 r3 t2 t1+d r0-c*R0>>4] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    d   += c * (R1 >> 4) + t1;
    VERIFY_BITS(d, 53);
#ifdef VERIFY
    VERIFY_CHECK(d <= 0x10000003FFFFBFUL);
#endif
    /* [r9+(c<<22) r8 r7 r6 r5 r4 r3 t2 d-c*R1>>4 r0-c*R0>>4] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    /* [r9 r8 r7 r6 r5 r4 r3 t2 d r0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
    r[1] = d & M; d >>= 26;
    VERIFY_BITS(r[1], 26);
    VERIFY_BITS(d, 27);
#ifdef VERIFY
    VERIFY_CHECK(d <= 0x4000000UL);
#endif
  /* [r9 r8 r7 r6 r5 r4 r3 t2+d r1 r0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
  d   += t2;
  VERIFY_BITS(d, 27);
  /* [r9 r8 r7 r6 r5 r4 r3 d r1 r0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */
  r[2] = d;
  VERIFY_BITS(r[2], 27);
  /* [r9 r8 r7 r6 r5 r4 r3 r2 r1 r0] = [p18 p17 p16 p15 p14 p13 p12 p11 p10 p9 p8 p7 p6 p5 p4 p3 p2 p1 p0] */

  //int debugWarning2;
  //for (int counter = 0; counter < 10; counter ++) {
  //  outputTemp.n[counter] = r[counter];
  //}
  //memoryPool_write_fe_asOutput(& outputTemp, -1 , memoryPool);
}

#undef VERIFY
#undef VERIFY_BITS
#define VERIFY_BITS(x, n) do { } while(0)


void secp256k1_fe_sqr__with_debug(secp256k1_fe *r, const secp256k1_fe *a, __global unsigned char* memoryPool) {
  //int debugWarning;
  //memoryPool_write_fe_asOutput(a, - 1, memoryPool);
  secp256k1_fe_sqr_inner__with_debug(r->n, a->n, memoryPool);
}

void secp256k1_fe_sqr(secp256k1_fe *r, const secp256k1_fe *a) {
#ifdef VERIFY
  VERIFY_CHECK(a->magnitude <= 8);
  secp256k1_fe_verify(a);
#endif
  secp256k1_fe_sqr_inner(r->n, a->n);
#ifdef VERIFY
  r->magnitude = 1;
  r->normalized = 0;
  secp256k1_fe_verify(r);
#endif
}

void secp256k1_fe_cmov(secp256k1_fe *r, const secp256k1_fe *a, int flag) {
    uint32_t mask0, mask1;
    mask0 = flag + ~((uint32_t)0);
    mask1 = ~mask0;
    r->n[0] = (r->n[0] & mask0) | (a->n[0] & mask1);
    r->n[1] = (r->n[1] & mask0) | (a->n[1] & mask1);
    r->n[2] = (r->n[2] & mask0) | (a->n[2] & mask1);
    r->n[3] = (r->n[3] & mask0) | (a->n[3] & mask1);
    r->n[4] = (r->n[4] & mask0) | (a->n[4] & mask1);
    r->n[5] = (r->n[5] & mask0) | (a->n[5] & mask1);
    r->n[6] = (r->n[6] & mask0) | (a->n[6] & mask1);
    r->n[7] = (r->n[7] & mask0) | (a->n[7] & mask1);
    r->n[8] = (r->n[8] & mask0) | (a->n[8] & mask1);
    r->n[9] = (r->n[9] & mask0) | (a->n[9] & mask1);
#ifdef VERIFY
    if (a->magnitude > r->magnitude) {
        r->magnitude = a->magnitude;
    }
    r->normalized &= a->normalized;
#endif
}

void secp256k1_fe_copy__from__global(secp256k1_fe* output, __global const secp256k1_fe* input){
  output->n[0] = input->n[0];
  output->n[1] = input->n[1];
  output->n[2] = input->n[2];
  output->n[3] = input->n[3];
  output->n[4] = input->n[4];
  output->n[5] = input->n[5];
  output->n[6] = input->n[6];
  output->n[7] = input->n[7];
  output->n[8] = input->n[8];
  output->n[9] = input->n[9];
}


//******end of field_10x26_impl.h******


//******From field_impl.h******

int secp256k1_fe_equal_var(const secp256k1_fe *a, const secp256k1_fe *b) {
    secp256k1_fe na;
    secp256k1_fe_negate(&na, a, 1);
    secp256k1_fe_add(&na, b);
    return secp256k1_fe_normalizes_to_zero_var(&na);
}

int secp256k1_fe_sqrt_var(secp256k1_fe *r, const secp256k1_fe *a) {
    secp256k1_fe x2, x3, x6, x9, x11, x22, x44, x88, x176, x220, x223, t1;
    int j;

    /** The binary representation of (p + 1)/4 has 3 blocks of 1s, with lengths in
     *  { 2, 22, 223 }. Use an addition chain to calculate 2^n - 1 for each block:
     *  1, [2], 3, 6, 9, 11, [22], 44, 88, 176, 220, [223]
     */

    secp256k1_fe_sqr(&x2, a);
    secp256k1_fe_mul(&x2, &x2, a);

    secp256k1_fe_sqr(&x3,  &x2);
    secp256k1_fe_mul(&x3, &x3, a);

    x6 = x3;
    for (j=0; j<3; j++) {
        secp256k1_fe_sqr(&x6, &x6);
    }
    secp256k1_fe_mul(&x6, &x6, &x3);

    x9 = x6;
    for (j=0; j<3; j++) {
        secp256k1_fe_sqr(&x9, &x9);
    }
    secp256k1_fe_mul(&x9, &x9, &x3);

    x11 = x9;
    for (j=0; j<2; j++) {
        secp256k1_fe_sqr(&x11, &x11);
    }
    secp256k1_fe_mul(&x11, &x11, &x2);

    x22 = x11;
    for (j=0; j<11; j++) {
        secp256k1_fe_sqr(&x22, &x22);
    }
    secp256k1_fe_mul(&x22, &x22, &x11);

    x44 = x22;
    for (j=0; j<22; j++) {
        secp256k1_fe_sqr(&x44, &x44);
    }
    secp256k1_fe_mul(&x44, &x44, &x22);

    x88 = x44;
    for (j=0; j<44; j++) {
        secp256k1_fe_sqr(&x88, &x88);
    }
    secp256k1_fe_mul(&x88, &x88, &x44);

    x176 = x88;
    for (j=0; j<88; j++) {
        secp256k1_fe_sqr(&x176, &x176);
    }
    secp256k1_fe_mul(&x176, &x176, &x88);

    x220 = x176;
    for (j=0; j<44; j++) {
        secp256k1_fe_sqr(&x220, &x220);
    }
    secp256k1_fe_mul(&x220, &x220, &x44);

    x223 = x220;
    for (j=0; j<3; j++) {
        secp256k1_fe_sqr(&x223, &x223);
    }
    secp256k1_fe_mul(&x223, &x223, &x3);

    /* The final result is then assembled using a sliding window over the blocks. */

    t1 = x223;
    for (j = 0; j < 23; j ++) {
        secp256k1_fe_sqr(&t1, &t1);
    }
    secp256k1_fe_mul(&t1, &t1, &x22);
    for (j = 0; j < 6; j ++) {
        secp256k1_fe_sqr(&t1, &t1);
    }
    secp256k1_fe_mul(&t1, &t1, &x2);
    secp256k1_fe_sqr(&t1, &t1);
    secp256k1_fe_sqr(r, &t1);

    /* Check that a square root was actually calculated */

    secp256k1_fe_sqr(&t1, r);
    return secp256k1_fe_equal_var(&t1, a);
}

void secp256k1_fe_inv(secp256k1_fe *r, const secp256k1_fe *a) {
    secp256k1_fe x2, x3, x6, x9, x11, x22, x44, x88, x176, x220, x223, t1;
    int j;

    /** The binary representation of (p - 2) has 5 blocks of 1s, with lengths in
     *  { 1, 2, 22, 223 }. Use an addition chain to calculate 2^n - 1 for each block:
     *  [1], [2], 3, 6, 9, 11, [22], 44, 88, 176, 220, [223]
     */

    secp256k1_fe_sqr(&x2, a);
    secp256k1_fe_mul(&x2, &x2, a);

    secp256k1_fe_sqr(&x3, &x2);
    secp256k1_fe_mul(&x3, &x3, a);

    x6 = x3;
    for (j=0; j<3; j++) {
      secp256k1_fe_sqr(&x6, &x6);
    }
    secp256k1_fe_mul(&x6, &x6, &x3);

    x9 = x6;
    for (j=0; j<3; j++) {
      secp256k1_fe_sqr(&x9, &x9);
    }
    secp256k1_fe_mul(&x9, &x9, &x3);

    x11 = x9;
    for (j=0; j<2; j++) {
        secp256k1_fe_sqr(&x11, &x11);
    }
    secp256k1_fe_mul(&x11, &x11, &x2);

    x22 = x11;
    for (j=0; j<11; j++) {
        secp256k1_fe_sqr(&x22, &x22);
    }
    secp256k1_fe_mul(&x22, &x22, &x11);

    x44 = x22;
    for (j=0; j<22; j++) {
        secp256k1_fe_sqr(&x44, &x44);
    }
    secp256k1_fe_mul(&x44, &x44, &x22);

    x88 = x44;
    for (j=0; j<44; j++) {
        secp256k1_fe_sqr(&x88, &x88);
    }
    secp256k1_fe_mul(&x88, &x88, &x44);

    x176 = x88;
    for (j=0; j<88; j++) {
        secp256k1_fe_sqr(&x176, &x176);
    }
    secp256k1_fe_mul(&x176, &x176, &x88);

    x220 = x176;
    for (j=0; j<44; j++) {
        secp256k1_fe_sqr(&x220, &x220);
    }
    secp256k1_fe_mul(&x220, &x220, &x44);

    x223 = x220;
    for (j=0; j<3; j++) {
        secp256k1_fe_sqr(&x223, &x223);
    }
    secp256k1_fe_mul(&x223, &x223, &x3);

    /* The final result is then assembled using a sliding window over the blocks. */

    t1 = x223;
    for (j=0; j<23; j++) {
        secp256k1_fe_sqr(&t1, &t1);
    }
    secp256k1_fe_mul(&t1, &t1, &x22);
    for (j=0; j<5; j++) {
        secp256k1_fe_sqr(&t1, &t1);
    }
    secp256k1_fe_mul(&t1, &t1, a);
    for (j=0; j<3; j++) {
        secp256k1_fe_sqr(&t1, &t1);
    }
    secp256k1_fe_mul(&t1, &t1, &x2);
    for (j=0; j<2; j++) {
        secp256k1_fe_sqr(&t1, &t1);
    }
    secp256k1_fe_mul(r, a, &t1);
}

void secp256k1_fe_inv_var(secp256k1_fe *r, const secp256k1_fe *a) {
    secp256k1_fe_inv(r, a);
}

void secp256k1_fe_inv_all_var(size_t len, __global secp256k1_fe *r,__global const secp256k1_fe *a) {
  secp256k1_fe u, globalToLocalBuffer1, globalToLocalBuffer2, globalToLocalBuffer3;
  size_t i;
  if (len < 1) {
    return;
  }

#ifdef VERIFY
  VERIFY_CHECK((r + len <= a) || (a + len <= r));
#endif
  r[0] = a[0];

  i = 0;
  while (++i < len) {
    secp256k1_fe_copy__from__global(&globalToLocalBuffer1, &r[i - 1]);
    secp256k1_fe_copy__from__global(&globalToLocalBuffer3, &a[i]);

    secp256k1_fe_mul(&globalToLocalBuffer2, &globalToLocalBuffer1, &globalToLocalBuffer3);
    secp256k1_fe_copy__to__global(&r[i], &globalToLocalBuffer2);
  }
  secp256k1_fe_copy__from__global(&globalToLocalBuffer1, &r[--i]);
  secp256k1_fe_inv_var(&u, &globalToLocalBuffer1);

  while (i > 0) {
    size_t j = i--;
    secp256k1_fe_copy__from__global(&globalToLocalBuffer1, &r[i]);
    secp256k1_fe_mul(&globalToLocalBuffer2, &globalToLocalBuffer1, &u);
    secp256k1_fe_copy__to__global(&r[j], &globalToLocalBuffer2);
    secp256k1_fe_copy__from__global(&globalToLocalBuffer3, &a[j]);
    secp256k1_fe_mul(&u, &u, &globalToLocalBuffer3);
  }
  r[0] = u;
}
//******end of field_impl.h******


//******From group_impl.h******
/** Set a group element (jacobian) equal to another which is given in affine coordinates. */
//*******************************************************
//Various versions of assigning memory coming from different address spaces
void secp256k1_gej_set_ge(secp256k1_gej *r, const secp256k1_ge *a) {
  r->infinity = a->infinity;
  r->x = a->x;
  r->y = a->y;
  secp256k1_fe_set_int(&r->z, 1);
}

void secp256k1_gej_set_ge__constant(secp256k1_gej *r, __constant const secp256k1_ge *a) {
  r->infinity = a->infinity;
  r->x = a->x;
  r->y = a->y;
  secp256k1_fe_set_int(&r->z, 1);
}

void secp256k1_gej_set_ge__global(secp256k1_gej *r, __global const secp256k1_ge *a) {
  r->infinity = a->infinity;
  r->x = a->x;
  r->y = a->y;
  secp256k1_fe_set_int(&r->z, 1);
}

void secp256k1_gej_set_ge__constant__global(__global secp256k1_gej *r, __constant const secp256k1_ge *a) {
  r->infinity = a->infinity;
  r->x = a->x;
  r->y = a->y;
  secp256k1_fe_set_int__global(&r->z, 1);
}

//*******************************************************

static void secp256k1_ge_set_gej_zinv(secp256k1_ge *r, const secp256k1_gej *a, const secp256k1_fe *zi) {
    secp256k1_fe zi2;
    secp256k1_fe zi3;
    secp256k1_fe_sqr(&zi2, zi);
    secp256k1_fe_mul(&zi3, &zi2, zi);
    secp256k1_fe_mul(&r->x, &a->x, &zi2);
    secp256k1_fe_mul(&r->y, &a->y, &zi3);
    r->infinity = a->infinity;
}

void secp256k1_ge_set_xy(secp256k1_ge *r, const secp256k1_fe *x, const secp256k1_fe *y) {
    r->infinity = 0;
    r->x = *x;
    r->y = *y;
}

int secp256k1_ge_is_infinity(const secp256k1_ge *a) {
    return a->infinity;
}

void secp256k1_ge_neg(secp256k1_ge *r, const secp256k1_ge *a) {
    *r = *a;
    secp256k1_fe_normalize_weak(&r->y);
    secp256k1_fe_negate(&r->y, &r->y, 1);
}

void secp256k1_ge_set_gej(secp256k1_ge *r, secp256k1_gej *a) {
    secp256k1_fe z2, z3;
    r->infinity = a->infinity;
    secp256k1_fe_inv(&a->z, &a->z);
    secp256k1_fe_sqr(&z2, &a->z);
    secp256k1_fe_mul(&z3, &a->z, &z2);
    secp256k1_fe_mul(&a->x, &a->x, &z2);
    secp256k1_fe_mul(&a->y, &a->y, &z3);
    secp256k1_fe_set_int(&a->z, 1);
    r->x = a->x;
    r->y = a->y;
}

static void secp256k1_ge_set_gej_var(secp256k1_ge *r, secp256k1_gej *a) {
    secp256k1_fe z2, z3;
    r->infinity = a->infinity;
    if (a->infinity) {
        return;
    }
    secp256k1_fe_inv_var(&a->z, &a->z);
    secp256k1_fe_sqr(&z2, &a->z);
    secp256k1_fe_mul(&z3, &a->z, &z2);
    secp256k1_fe_mul(&a->x, &a->x, &z2);
    secp256k1_fe_mul(&a->y, &a->y, &z3);
    secp256k1_fe_set_int(&a->z, 1);
    r->x = a->x;
    r->y = a->y;
}

void secp256k1_ge_set_all_gej_var(
  size_t len,
  secp256k1_ge *outputPoints,
  const secp256k1_gej *inputPointsJacobian,
  __global unsigned char* memoryPool
) {
  __global secp256k1_fe *az;
  __global secp256k1_fe *azi;
  secp256k1_fe globalToLocal1;
  size_t i;
  size_t count = 0;
  az = (__global secp256k1_fe *) checked_malloc(sizeof_secp256k1_fe() * len, memoryPool);
  //memoryPool_write_uint_asOutput(inputPointsJacobian[0].x.n[0], 2, memoryPool);

  for (i = 0; i < len; i++) {
    if (!inputPointsJacobian[i].infinity) {
      az[count++] = inputPointsJacobian[i].z;
    }
  }

  azi = (__global secp256k1_fe *) checked_malloc(sizeof_secp256k1_fe() * count, memoryPool);
  secp256k1_fe_inv_all_var(count, azi, az);
  memoryPool_freeMemory__global(az);

  count = 0;
  for (i = 0; i < len; i ++) {
    outputPoints[i].infinity = inputPointsJacobian[i].infinity;
    if (!inputPointsJacobian[i].infinity) {
      secp256k1_fe_copy__from__global(&globalToLocal1, &azi[count++]);
      secp256k1_ge_set_gej_zinv(&outputPoints[i], &inputPointsJacobian[i], &globalToLocal1);
    }
  }
  memoryPool_freeMemory__global(azi);
//  int usedForCompilerWarning;
//  return;
}

void secp256k1_ge_copy__from__global(secp256k1_ge* output, __global const secp256k1_ge* input) {
  output->infinity = input->infinity;
  secp256k1_fe_copy__from__global(&output->x, &input->x);
  secp256k1_fe_copy__from__global(&output->y, &input->y);
}

void secp256k1_ge_set_table_gej_var(
  size_t len,
  __global secp256k1_ge *r,
  __global const secp256k1_gej *a,
  __global const secp256k1_fe *zr
) {
  size_t i = len - 1;
  secp256k1_fe zi;
  secp256k1_gej globalToLocalGEJ1;
  secp256k1_ge globalToLocalGE1;

  if (len <= 0) {
    return;
  }
  /* Compute the inverse of the last z coordinate, and use it to compute the last affine output. */
  secp256k1_gej_copy__from__global(&globalToLocalGEJ1, &a[i]);
  secp256k1_fe_inv(&zi, &globalToLocalGEJ1.z);
  secp256k1_ge_set_gej_zinv(&globalToLocalGE1, &globalToLocalGEJ1, &zi);

  secp256k1_ge_copy__to__global(&r[i], &globalToLocalGE1);

  /* Work out way backwards, using the z-ratios to scale the x/y values. */
  while (i > 0) {
    secp256k1_fe_mul__global(&zi, &zi, &zr[i]);
    i--;
    secp256k1_gej_copy__from__global(&globalToLocalGEJ1, &a[i]);

    secp256k1_ge_set_gej_zinv(&globalToLocalGE1, &globalToLocalGEJ1, &zi);
    secp256k1_ge_copy__to__global(&r[i], &globalToLocalGE1);
  }
}

void secp256k1_ge_globalz_set_table_gej(
  size_t len, secp256k1_ge *r,
  secp256k1_fe *globalz,
  __global const secp256k1_gej *a,
  __global const secp256k1_fe *zr
) {
  size_t i = len - 1;
  secp256k1_fe zs, globalToLocalFE1;
  secp256k1_gej globalToLocal1;

  if (len > 0) {
    /* The z of the final point gives us the "global Z" for the table. */
    r[i].x = a[i].x;
    r[i].y = a[i].y;
    *globalz = a[i].z;
    r[i].infinity = 0;
    zs = zr[i];

    /* Work our way backwards, using the z-ratios to scale the x/y values. */
    while (i > 0) {
      if (i != len - 1) {
        secp256k1_fe_copy__from__global(&globalToLocalFE1, &zr[i]);
        secp256k1_fe_mul(&zs, &zs, &globalToLocalFE1);
      }
      i--;
      secp256k1_gej_copy__from__global(&globalToLocal1, &a[i]);
      secp256k1_ge_set_gej_zinv(&r[i], &globalToLocal1, &zs);
    }
  }
}

void secp256k1_gej_set_infinity(secp256k1_gej *r) {
    r->infinity = 1;
    secp256k1_fe_set_int(&r->x, 0);
    secp256k1_fe_set_int(&r->y, 0);
    secp256k1_fe_set_int(&r->z, 0);
}

void secp256k1_gej_clear(secp256k1_gej *r) {
    r->infinity = 0;
    secp256k1_fe_clear(&r->x);
    secp256k1_fe_clear(&r->y);
    secp256k1_fe_clear(&r->z);
}

void secp256k1_ge_clear(secp256k1_ge *r) {
    r->infinity = 0;
    secp256k1_fe_clear(&r->x);
    secp256k1_fe_clear(&r->y);
}

int secp256k1_ge_set_xo_var(secp256k1_ge *r, const secp256k1_fe *x, int odd) {
    secp256k1_fe x2, x3, c;
    r->x = *x;
    secp256k1_fe_sqr(&x2, x);
    secp256k1_fe_mul(&x3, x, &x2);
    r->infinity = 0;
    secp256k1_fe_set_int(&c, 7);
    secp256k1_fe_add(&c, &x3);
    if (!secp256k1_fe_sqrt_var(&r->y, &c)) {
        return 0;
    }
    secp256k1_fe_normalize_var(&r->y);
    if (secp256k1_fe_is_odd(&r->y) != odd) {
        secp256k1_fe_negate(&r->y, &r->y, 1);
    }
    return 1;
}

int secp256k1_gej_eq_x_var(const secp256k1_fe *x, const secp256k1_gej *a) {
  secp256k1_fe r, r2;
#ifdef VERIFY
  VERIFY_CHECK(!a->infinity);
#endif
  secp256k1_fe_sqr(&r, &a->z); //r = z^2
  secp256k1_fe_mul(&r, &r, x); //r = x z^2
  r2 = a->x;
  secp256k1_fe_normalize_weak(&r2);
  return secp256k1_fe_equal_var(&r, &r2);
}

void secp256k1_gej_neg(secp256k1_gej *r, const secp256k1_gej *a) {
    r->infinity = a->infinity;
    r->x = a->x;
    r->y = a->y;
    r->z = a->z;
    secp256k1_fe_normalize_weak(&r->y);
    secp256k1_fe_negate(&r->y, &r->y, 1);
}

int secp256k1_gej_is_infinity(const secp256k1_gej *a) {
    return a->infinity;
}

int secp256k1_gej_is_valid_var(const secp256k1_gej *a) {
    secp256k1_fe y2, x3, z2, z6;
    if (a->infinity) {
        return 0;
    }
    /** y^2 = x^3 + 7
     *  (Y/Z^3)^2 = (X/Z^2)^3 + 7
     *  Y^2 / Z^6 = X^3 / Z^6 + 7
     *  Y^2 = X^3 + 7*Z^6
     */
    secp256k1_fe_sqr(&y2, &a->y);
    secp256k1_fe_sqr(&x3, &a->x);
    secp256k1_fe_mul(&x3, &x3, &a->x);
    secp256k1_fe_sqr(&z2, &a->z);
    secp256k1_fe_sqr(&z6, &z2);
    secp256k1_fe_mul(&z6, &z6, &z2);
    secp256k1_fe_mul_int(&z6, 7);
    secp256k1_fe_add(&x3, &z6);
    secp256k1_fe_normalize_weak(&x3);
    return secp256k1_fe_equal_var(&y2, &x3);
}

int secp256k1_ge_is_valid_var(const secp256k1_ge *a) {
    secp256k1_fe y2, x3, c;
    if (a->infinity) {
        return 0;
    }
    /* y^2 = x^3 + 7 */
    secp256k1_fe_sqr(&y2, &a->y);
    secp256k1_fe_sqr(&x3, &a->x);
    secp256k1_fe_mul(&x3, &x3, &a->x);
    secp256k1_fe_set_int(&c, 7);
    secp256k1_fe_add(&x3, &c);
    secp256k1_fe_normalize_weak(&x3);
    return secp256k1_fe_equal_var(&y2, &x3);
}

void secp256k1_gej_double_var_with_debug(
  secp256k1_gej *r,
  const secp256k1_gej *a,
  secp256k1_fe *rzr,
  __global unsigned char* memoryPool
) {
  //int debugWarning;

  /* Operations: 3 mul, 4 sqr, 0 normalize, 12 mul_int/add/negate */
  secp256k1_fe t1, t2, t3, t4;
  /** For secp256k1, 2Q is infinity if and only if Q is infinity. This is because if 2Q = infinity,
   *  Q must equal -Q, or that Q.y == -(Q.y), or Q.y is 0. For a point on y^2 = x^3 + 7 to have
   *  y=0, x^3 must be -7 mod p. However, -7 has no cube root mod p.
   */
  r->infinity = a->infinity;
  if (r->infinity) {
    if (rzr != NULL) {
      secp256k1_fe_set_int(rzr, 1);
    }
    return;
  }

  if (rzr != NULL) {
    *rzr = a->y;
    secp256k1_fe_normalize_weak(rzr);
    secp256k1_fe_mul_int(rzr, 2);
  }

  secp256k1_fe_mul(&r->z, &a->z, &a->y);

  //int debugWarning2;
  //memoryPool_write_fe_asOutput(&r->z, - 1, memoryPool);

  secp256k1_fe_mul_int(&r->z, 2);       /* Z' = 2*Y*Z (2) */

  //int debugWarning3;
  //memoryPool_write_fe_asOutput(&r->z, - 1, memoryPool);

  //int debugWarning1000;
  secp256k1_fe_sqr__with_debug(&t1, &a->x, memoryPool);
  //return;
  //int debugWarning4;
  //memoryPool_write_fe_asOutput(&t1, - 1, memoryPool);

  secp256k1_fe_mul_int(&t1, 3);         /* T1 = 3*X^2 (3) */

  //int debugWarning5;
  //memoryPool_write_fe_asOutput(&t1, - 1, memoryPool);

  secp256k1_fe_sqr(&t2, &t1);           /* T2 = 9*X^4 (1) */

  //int debugWarning6;
  //memoryPool_write_fe_asOutput(&t2, - 1, memoryPool);

  secp256k1_fe_sqr(&t3, &a->y);

  //int debugWarning7;
  //memoryPool_write_fe_asOutput(&t3, - 1, memoryPool);

  secp256k1_fe_mul_int(&t3, 2);         /* T3 = 2*Y^2 (2) */

  //int debugWarning8;
  //memoryPool_write_fe_asOutput(&t3, - 1, memoryPool);

  secp256k1_fe_sqr(&t4, &t3);
  secp256k1_fe_mul_int(&t4, 2);         /* T4 = 8*Y^4 (2) */
  secp256k1_fe_mul(&t3, &t3, &a->x);    /* T3 = 2*X*Y^2 (1) */
  r->x = t3;
  secp256k1_fe_mul_int(&r->x, 4);       /* X' = 8*X*Y^2 (4) */
  secp256k1_fe_negate(&r->x, &r->x, 4); /* X' = -8*X*Y^2 (5) */
  secp256k1_fe_add(&r->x, &t2);         /* X' = 9*X^4 - 8*X*Y^2 (6) */
  secp256k1_fe_negate(&t2, &t2, 1);     /* T2 = -9*X^4 (2) */
  secp256k1_fe_mul_int(&t3, 6);         /* T3 = 12*X*Y^2 (6) */
  secp256k1_fe_add(&t3, &t2);           /* T3 = 12*X*Y^2 - 9*X^4 (8) */
  secp256k1_fe_mul(&r->y, &t1, &t3);    /* Y' = 36*X^3*Y^2 - 27*X^6 (1) */
  secp256k1_fe_negate(&t2, &t4, 2);     /* T2 = -8*Y^4 (3) */
  secp256k1_fe_add(&r->y, &t2);         /* Y' = 36*X^3*Y^2 - 27*X^6 - 8*Y^4 (4) */
}

void secp256k1_gej_double_var(secp256k1_gej *r, const secp256k1_gej *a, secp256k1_fe *rzr) {
  /* Operations: 3 mul, 4 sqr, 0 normalize, 12 mul_int/add/negate */
  secp256k1_fe t1, t2, t3, t4;
  /** For secp256k1, 2Q is infinity if and only if Q is infinity. This is because if 2Q = infinity,
   *  Q must equal -Q, or that Q.y == -(Q.y), or Q.y is 0. For a point on y^2 = x^3 + 7 to have
   *  y=0, x^3 must be -7 mod p. However, -7 has no cube root mod p.
   */
  r->infinity = a->infinity;
  if (r->infinity) {
    if (rzr != NULL) {
      secp256k1_fe_set_int(rzr, 1);
    }
    return;
  }
  if (rzr != NULL) {
    *rzr = a->y;
    secp256k1_fe_normalize_weak(rzr);
    secp256k1_fe_mul_int(rzr, 2);
  }
  secp256k1_fe_mul(&r->z, &a->z, &a->y);
  secp256k1_fe_mul_int(&r->z, 2);       /* Z' = 2*Y*Z (2) */
  secp256k1_fe_sqr(&t1, &a->x);
  secp256k1_fe_mul_int(&t1, 3);         /* T1 = 3*X^2 (3) */
  secp256k1_fe_sqr(&t2, &t1);           /* T2 = 9*X^4 (1) */
  secp256k1_fe_sqr(&t3, &a->y);
  secp256k1_fe_mul_int(&t3, 2);         /* T3 = 2*Y^2 (2) */
  secp256k1_fe_sqr(&t4, &t3);
  secp256k1_fe_mul_int(&t4, 2);         /* T4 = 8*Y^4 (2) */
  secp256k1_fe_mul(&t3, &t3, &a->x);    /* T3 = 2*X*Y^2 (1) */
  r->x = t3;
  secp256k1_fe_mul_int(&r->x, 4);       /* X' = 8*X*Y^2 (4) */
  secp256k1_fe_negate(&r->x, &r->x, 4); /* X' = -8*X*Y^2 (5) */
  secp256k1_fe_add(&r->x, &t2);         /* X' = 9*X^4 - 8*X*Y^2 (6) */
  secp256k1_fe_negate(&t2, &t2, 1);     /* T2 = -9*X^4 (2) */
  secp256k1_fe_mul_int(&t3, 6);         /* T3 = 12*X*Y^2 (6) */
  secp256k1_fe_add(&t3, &t2);           /* T3 = 12*X*Y^2 - 9*X^4 (8) */
  secp256k1_fe_mul(&r->y, &t1, &t3);    /* Y' = 36*X^3*Y^2 - 27*X^6 (1) */
  secp256k1_fe_negate(&t2, &t4, 2);     /* T2 = -8*Y^4 (3) */
  secp256k1_fe_add(&r->y, &t2);         /* Y' = 36*X^3*Y^2 - 27*X^6 - 8*Y^4 (4) */
}

void secp256k1_gej_double_nonzero(secp256k1_gej *r, const secp256k1_gej *a, secp256k1_fe *rzr) {
#ifdef VERIFY
    VERIFY_CHECK(!secp256k1_gej_is_infinity(a));
#endif
    secp256k1_gej_double_var(r, a, rzr);
}

void secp256k1_gej_add_var(secp256k1_gej *r, const secp256k1_gej *a, const secp256k1_gej *b, secp256k1_fe *rzr) {
    /* Operations: 12 mul, 4 sqr, 2 normalize, 12 mul_int/add/negate */
    secp256k1_fe z22, z12, u1, u2, s1, s2, h, i, i2, h2, h3, t;

    if (a->infinity) {
#ifdef VERIFY
        VERIFY_CHECK(rzr == NULL);
#endif
        *r = *b;
        return;
    }

    if (b->infinity) {
        if (rzr != NULL) {
            secp256k1_fe_set_int(rzr, 1);
        }
        *r = *a;
        return;
    }

    r->infinity = 0;
    secp256k1_fe_sqr(&z22, &b->z);
    secp256k1_fe_sqr(&z12, &a->z);
    secp256k1_fe_mul(&u1, &a->x, &z22);
    secp256k1_fe_mul(&u2, &b->x, &z12);
    secp256k1_fe_mul(&s1, &a->y, &z22);
    secp256k1_fe_mul(&s1, &s1, &b->z);
    secp256k1_fe_mul(&s2, &b->y, &z12);
    secp256k1_fe_mul(&s2, &s2, &a->z);
    secp256k1_fe_negate(&h, &u1, 1);
    secp256k1_fe_add(&h, &u2);
    secp256k1_fe_negate(&i, &s1, 1);
    secp256k1_fe_add(&i, &s2);
    if (secp256k1_fe_normalizes_to_zero_var(&h)) {
        if (secp256k1_fe_normalizes_to_zero_var(&i)) {
            secp256k1_gej_double_var(r, a, rzr);
        } else {
            if (rzr != NULL) {
                secp256k1_fe_set_int(rzr, 0);
            }
            r->infinity = 1;
        }
        return;
    }
    secp256k1_fe_sqr(&i2, &i);
    secp256k1_fe_sqr(&h2, &h);
    secp256k1_fe_mul(&h3, &h, &h2);
    secp256k1_fe_mul(&h, &h, &b->z);
    if (rzr != NULL) {
        *rzr = h;
    }
    secp256k1_fe_mul(&r->z, &a->z, &h);
    secp256k1_fe_mul(&t, &u1, &h2);
    r->x = t; secp256k1_fe_mul_int(&r->x, 2);
    secp256k1_fe_add(&r->x, &h3);
    secp256k1_fe_negate(&r->x, &r->x, 3);
    secp256k1_fe_add(&r->x, &i2);
    secp256k1_fe_negate(&r->y, &r->x, 5);
    secp256k1_fe_add(&r->y, &t);
    secp256k1_fe_mul(&r->y, &r->y, &i);
    secp256k1_fe_mul(&h3, &h3, &s1);
    secp256k1_fe_negate(&h3, &h3, 1);
    secp256k1_fe_add(&r->y, &h3);
}

void secp256k1_gej_add_zinv_var(secp256k1_gej *r, const secp256k1_gej *a, const secp256k1_ge *b, const secp256k1_fe *bzinv) {
    /* 9 mul, 3 sqr, 4 normalize, 12 mul_int/add/negate */
    secp256k1_fe az, z12, u1, u2, s1, s2, h, i, i2, h2, h3, t;

    if (b->infinity) {
        *r = *a;
        return;
    }
    if (a->infinity) {
        secp256k1_fe bzinv2, bzinv3;
        r->infinity = b->infinity;
        secp256k1_fe_sqr(&bzinv2, bzinv);
        secp256k1_fe_mul(&bzinv3, &bzinv2, bzinv);
        secp256k1_fe_mul(&r->x, &b->x, &bzinv2);
        secp256k1_fe_mul(&r->y, &b->y, &bzinv3);
        secp256k1_fe_set_int(&r->z, 1);
        return;
    }
    r->infinity = 0;

    /** We need to calculate (rx,ry,rz) = (ax,ay,az) + (bx,by,1/bzinv). Due to
     *  secp256k1's isomorphism we can multiply the Z coordinates on both sides
     *  by bzinv, and get: (rx,ry,rz*bzinv) = (ax,ay,az*bzinv) + (bx,by,1).
     *  This means that (rx,ry,rz) can be calculated as
     *  (ax,ay,az*bzinv) + (bx,by,1), when not applying the bzinv factor to rz.
     *  The variable az below holds the modified Z coordinate for a, which is used
     *  for the computation of rx and ry, but not for rz.
     */
    secp256k1_fe_mul(&az, &a->z, bzinv);

    secp256k1_fe_sqr(&z12, &az);
    u1 = a->x;
    secp256k1_fe_normalize_weak(&u1);
    secp256k1_fe_mul(&u2, &b->x, &z12);
    s1 = a->y;
    secp256k1_fe_normalize_weak(&s1);
    secp256k1_fe_mul(&s2, &b->y, &z12);
    secp256k1_fe_mul(&s2, &s2, &az);
    secp256k1_fe_negate(&h, &u1, 1);
    secp256k1_fe_add(&h, &u2);
    secp256k1_fe_negate(&i, &s1, 1);
    secp256k1_fe_add(&i, &s2);
    if (secp256k1_fe_normalizes_to_zero_var(&h)) {
        if (secp256k1_fe_normalizes_to_zero_var(&i)) {
            secp256k1_gej_double_var(r, a, NULL);
        } else {
            r->infinity = 1;
        }
        return;
    }
    secp256k1_fe_sqr(&i2, &i);
    secp256k1_fe_sqr(&h2, &h);
    secp256k1_fe_mul(&h3, &h, &h2);
    r->z = a->z;
    secp256k1_fe_mul(&r->z, &r->z, &h);
    secp256k1_fe_mul(&t, &u1, &h2);
    r->x = t;
    secp256k1_fe_mul_int(&r->x, 2);
    secp256k1_fe_add(&r->x, &h3);
    secp256k1_fe_negate(&r->x, &r->x, 3);
    secp256k1_fe_add(&r->x, &i2);
    secp256k1_fe_negate(&r->y, &r->x, 5);
    secp256k1_fe_add(&r->y, &t);
    secp256k1_fe_mul(&r->y, &r->y, &i);
    secp256k1_fe_mul(&h3, &h3, &s1);
    secp256k1_fe_negate(&h3, &h3, 1);
    secp256k1_fe_add(&r->y, &h3);
}

void secp256k1_gej_add_ge(secp256k1_gej *r, const secp256k1_gej *a, const secp256k1_ge *b) {
    /* Operations: 7 mul, 5 sqr, 4 normalize, 21 mul_int/add/negate/cmov */
    //Please note: the static keyword breaks the openCL 1.0 build.
    //static
    const secp256k1_fe fe_1 = SECP256K1_FE_CONST(0, 0, 0, 0, 0, 0, 0, 1);

    secp256k1_fe zz, u1, u2, s1, s2, t, tt, m, n, q, rr;
    secp256k1_fe m_alt, rr_alt;
    int infinity, degenerate;
#ifdef VERIFY
    VERIFY_CHECK(!b->infinity);
    VERIFY_CHECK(a->infinity == 0 || a->infinity == 1);
#endif
    /** In:
     *    Eric Brier and Marc Joye, Weierstrass Elliptic Curves and Side-Channel Attacks.
     *    In D. Naccache and P. Paillier, Eds., Public Key Cryptography, vol. 2274 of Lecture Notes in Computer Science, pages 335-345. Springer-Verlag, 2002.
     *  we find as solution for a unified addition/doubling formula:
     *    lambda = ((x1 + x2)^2 - x1 * x2 + a) / (y1 + y2), with a = 0 for secp256k1's curve equation.
     *    x3 = lambda^2 - (x1 + x2)
     *    2*y3 = lambda * (x1 + x2 - 2 * x3) - (y1 + y2).
     *
     *  Substituting x_i = Xi / Zi^2 and yi = Yi / Zi^3, for i=1,2,3, gives:
     *    U1 = X1*Z2^2, U2 = X2*Z1^2
     *    S1 = Y1*Z2^3, S2 = Y2*Z1^3
     *    Z = Z1*Z2
     *    T = U1+U2
     *    M = S1+S2
     *    Q = T*M^2
     *    R = T^2-U1*U2
     *    X3 = 4*(R^2-Q)
     *    Y3 = 4*(R*(3*Q-2*R^2)-M^4)
     *    Z3 = 2*M*Z
     *  (Note that the paper uses xi = Xi / Zi and yi = Yi / Zi instead.)
     *
     *  This formula has the benefit of being the same for both addition
     *  of distinct points and doubling. However, it breaks down in the
     *  case that either point is infinity, or that y1 = -y2. We handle
     *  these cases in the following ways:
     *
     *    - If b is infinity we simply bail by means of a VERIFY_CHECK.
     *
     *    - If a is infinity, we detect this, and at the end of the
     *      computation replace the result (which will be meaningless,
     *      but we compute to be constant-time) with b.x : b.y : 1.
     *
     *    - If a = -b, we have y1 = -y2, which is a degenerate case.
     *      But here the answer is infinity, so we simply set the
     *      infinity flag of the result, overriding the computed values
     *      without even needing to cmov.
     *
     *    - If y1 = -y2 but x1 != x2, which does occur thanks to certain
     *      properties of our curve (specifically, 1 has nontrivial cube
     *      roots in our field, and the curve equation has no x coefficient)
     *      then the answer is not infinity but also not given by the above
     *      equation. In this case, we cmov in place an alternate expression
     *      for lambda. Specifically (y1 - y2)/(x1 - x2). Where both these
     *      expressions for lambda are defined, they are equal, and can be
     *      obtained from each other by multiplication by (y1 + y2)/(y1 + y2)
     *      then substitution of x^3 + 7 for y^2 (using the curve equation).
     *      For all pairs of nonzero points (a, b) at least one is defined,
     *      so this covers everything.
     */

    secp256k1_fe_sqr(&zz, &a->z);                       /* z = Z1^2 */
    u1 = a->x; secp256k1_fe_normalize_weak(&u1);                                    /* u1 = U1 = X1*Z2^2 (1) */
    secp256k1_fe_mul(&u2, &b->x, &zz);                  /* u2 = U2 = X2*Z1^2 (1) */
    s1 = a->y; secp256k1_fe_normalize_weak(&s1);                                    /* s1 = S1 = Y1*Z2^3 (1) */
    secp256k1_fe_mul(&s2, &b->y, &zz);                  /* s2 = Y2*Z1^2 (1) */
    secp256k1_fe_mul(&s2, &s2, &a->z);                  /* s2 = S2 = Y2*Z1^3 (1) */
    t = u1; secp256k1_fe_add(&t, &u2);                  /* t = T = U1+U2 (2) */
    m = s1; secp256k1_fe_add(&m, &s2);                  /* m = M = S1+S2 (2) */
    secp256k1_fe_sqr(&rr, &t);                          /* rr = T^2 (1) */
    secp256k1_fe_negate(&m_alt, &u2, 1);                /* Malt = -X2*Z1^2 */
    secp256k1_fe_mul(&tt, &u1, &m_alt);                 /* tt = -U1*U2 (2) */
    secp256k1_fe_add(&rr, &tt);                         /* rr = R = T^2-U1*U2 (3) */
    /** If lambda = R/M = 0/0 we have a problem (except in the "trivial"
     *  case that Z = z1z2 = 0, and this is special-cased later on). */
    degenerate = secp256k1_fe_normalizes_to_zero(&m) &
                 secp256k1_fe_normalizes_to_zero(&rr);
    /* This only occurs when y1 == -y2 and x1^3 == x2^3, but x1 != x2.
     * This means either x1 == beta*x2 or beta*x1 == x2, where beta is
     * a nontrivial cube root of one. In either case, an alternate
     * non-indeterminate expression for lambda is (y1 - y2)/(x1 - x2),
     * so we set R/M equal to this. */
    rr_alt = s1;
    secp256k1_fe_mul_int(&rr_alt, 2);                                   /* rr = Y1*Z2^3 - Y2*Z1^3 (2) */
    secp256k1_fe_add(&m_alt, &u1);          /* Malt = X1*Z2^2 - X2*Z1^2 */

    secp256k1_fe_cmov(&rr_alt, &rr, !degenerate);
    secp256k1_fe_cmov(&m_alt, &m, !degenerate);
    /* Now Ralt / Malt = lambda and is guaranteed not to be 0/0.
     * From here on out Ralt and Malt represent the numerator
     * and denominator of lambda; R and M represent the explicit
     * expressions x1^2 + x2^2 + x1x2 and y1 + y2. */
    secp256k1_fe_sqr(&n, &m_alt);                       /* n = Malt^2 (1) */
    secp256k1_fe_mul(&q, &n, &t);                       /* q = Q = T*Malt^2 (1) */
    /* These two lines use the observation that either M == Malt or M == 0,
     * so M^3 * Malt is either Malt^4 (which is computed by squaring), or
     * zero (which is "computed" by cmov). So the cost is one squaring
     * versus two multiplications. */
    secp256k1_fe_sqr(&n, &n);
    secp256k1_fe_cmov(&n, &m, degenerate);                                          /* n = M^3 * Malt (2) */
    secp256k1_fe_sqr(&t, &rr_alt);                      /* t = Ralt^2 (1) */
    secp256k1_fe_mul(&r->z, &a->z, &m_alt);             /* r->z = Malt*Z (1) */
    infinity = secp256k1_fe_normalizes_to_zero(&r->z) * (1 - a->infinity);
    secp256k1_fe_mul_int(&r->z, 2);                                                 /* r->z = Z3 = 2*Malt*Z (2) */
    secp256k1_fe_negate(&q, &q, 1);                     /* q = -Q (2) */
    secp256k1_fe_add(&t, &q);                           /* t = Ralt^2-Q (3) */
    secp256k1_fe_normalize_weak(&t);
    r->x = t;                                                                       /* r->x = Ralt^2-Q (1) */
    secp256k1_fe_mul_int(&t, 2);                                                    /* t = 2*x3 (2) */
    secp256k1_fe_add(&t, &q);                           /* t = 2*x3 - Q: (4) */
    secp256k1_fe_mul(&t, &t, &rr_alt);                  /* t = Ralt*(2*x3 - Q) (1) */
    secp256k1_fe_add(&t, &n);                           /* t = Ralt*(2*x3 - Q) + M^3*Malt (3) */
    secp256k1_fe_negate(&r->y, &t, 3);                  /* r->y = Ralt*(Q - 2x3) - M^3*Malt (4) */
    secp256k1_fe_normalize_weak(&r->y);
    secp256k1_fe_mul_int(&r->x, 4);                                                 /* r->x = X3 = 4*(Ralt^2-Q) */
    secp256k1_fe_mul_int(&r->y, 4);                                                 /* r->y = Y3 = 4*Ralt*(Q - 2x3) - 4*M^3*Malt (4) */

    /** In case a->infinity == 1, replace r with (b->x, b->y, 1). */
    secp256k1_fe_cmov(&r->x, &b->x, a->infinity);
    secp256k1_fe_cmov(&r->y, &b->y, a->infinity);
    secp256k1_fe_cmov(&r->z, &fe_1, a->infinity);
    r->infinity = infinity;
}

void secp256k1_gej_rescale(secp256k1_gej *r, const secp256k1_fe *s) {
    /* Operations: 4 mul, 1 sqr */
    secp256k1_fe zz;
#ifdef VERIFY
    VERIFY_CHECK(!secp256k1_fe_is_zero(s));
#endif
    secp256k1_fe_sqr(&zz, s);
    secp256k1_fe_mul(&r->x, &r->x, &zz);                /* r->x *= s^2 */
    secp256k1_fe_mul(&r->y, &r->y, &zz);
    secp256k1_fe_mul(&r->y, &r->y, s);                  /* r->y *= s^3 */
    secp256k1_fe_mul(&r->z, &r->z, s);                  /* r->z *= s   */
}

#ifdef USE_ENDOMORPHISM
static void secp256k1_ge_mul_lambda(secp256k1_ge *r, const secp256k1_ge *a) {
    static const secp256k1_fe beta = SECP256K1_FE_CONST(
        0x7ae96a2bul, 0x657c0710ul, 0x6e64479eul, 0xac3434e9ul,
        0x9cf04975ul, 0x12f58995ul, 0xc1396c28ul, 0x719501eeul
    );
    *r = *a;
    secp256k1_fe_mul(&r->x, &r->x, &beta);
}
#endif

//******end of group_impl.h******


//******From scalar_8x32_impl.h******
/* Limbs of the secp256k1 order. */
#define SECP256K1_N_0 ((uint32_t)0xD0364141UL)
#define SECP256K1_N_1 ((uint32_t)0xBFD25E8CUL)
#define SECP256K1_N_2 ((uint32_t)0xAF48A03BUL)
#define SECP256K1_N_3 ((uint32_t)0xBAAEDCE6UL)
#define SECP256K1_N_4 ((uint32_t)0xFFFFFFFEUL)
#define SECP256K1_N_5 ((uint32_t)0xFFFFFFFFUL)
#define SECP256K1_N_6 ((uint32_t)0xFFFFFFFFUL)
#define SECP256K1_N_7 ((uint32_t)0xFFFFFFFFUL)

/* Limbs of 2^256 minus the secp256k1 order. */
#define SECP256K1_N_C_0 (~SECP256K1_N_0 + 1)
#define SECP256K1_N_C_1 (~SECP256K1_N_1)
#define SECP256K1_N_C_2 (~SECP256K1_N_2)
#define SECP256K1_N_C_3 (~SECP256K1_N_3)
#define SECP256K1_N_C_4 (1)

/* Limbs of half the secp256k1 order. */
#define SECP256K1_N_H_0 ((uint32_t)0x681B20A0UL)
#define SECP256K1_N_H_1 ((uint32_t)0xDFE92F46UL)
#define SECP256K1_N_H_2 ((uint32_t)0x57A4501DUL)
#define SECP256K1_N_H_3 ((uint32_t)0x5D576E73UL)
#define SECP256K1_N_H_4 ((uint32_t)0xFFFFFFFFUL)
#define SECP256K1_N_H_5 ((uint32_t)0xFFFFFFFFUL)
#define SECP256K1_N_H_6 ((uint32_t)0xFFFFFFFFUL)
#define SECP256K1_N_H_7 ((uint32_t)0x7FFFFFFFUL)

static void secp256k1_scalar_clear(secp256k1_scalar *r) {
    r->d[0] = 0;
    r->d[1] = 0;
    r->d[2] = 0;
    r->d[3] = 0;
    r->d[4] = 0;
    r->d[5] = 0;
    r->d[6] = 0;
    r->d[7] = 0;
}

static void secp256k1_scalar_set_int(secp256k1_scalar *r, unsigned int v) {
    r->d[0] = v;
    r->d[1] = 0;
    r->d[2] = 0;
    r->d[3] = 0;
    r->d[4] = 0;
    r->d[5] = 0;
    r->d[6] = 0;
    r->d[7] = 0;
}

static unsigned int secp256k1_scalar_get_bits(const secp256k1_scalar *a, unsigned int offset, unsigned int count) {
#ifdef VERIFY
    VERIFY_CHECK((offset + count - 1) >> 5 == offset >> 5);
#endif
    return (a->d[offset >> 5] >> (offset & 0x1F)) & ((1 << count) - 1);
}

static unsigned int secp256k1_scalar_get_bits_var(const secp256k1_scalar *a, unsigned int offset, unsigned int count) {
#ifdef VERIFY
    VERIFY_CHECK(count < 32);
    VERIFY_CHECK(offset + count <= 256);
#endif
    if ((offset + count - 1) >> 5 == offset >> 5) {
        return secp256k1_scalar_get_bits(a, offset, count);
    } else {
#ifdef VERIFY
        VERIFY_CHECK((offset >> 5) + 1 < 8);
#endif
        return ((a->d[offset >> 5] >> (offset & 0x1F)) | (a->d[(offset >> 5) + 1] << (32 - (offset & 0x1F)))) & ((((uint32_t)1) << count) - 1);
    }
}

static int secp256k1_scalar_check_overflow(const secp256k1_scalar *a) {
    int yes = 0;
    int no = 0;
    no |= (a->d[7] < SECP256K1_N_7); /* No need for a > check. */
    no |= (a->d[6] < SECP256K1_N_6); /* No need for a > check. */
    no |= (a->d[5] < SECP256K1_N_5); /* No need for a > check. */
    no |= (a->d[4] < SECP256K1_N_4);
    yes |= (a->d[4] > SECP256K1_N_4) & ~no;
    no |= (a->d[3] < SECP256K1_N_3) & ~yes;
    yes |= (a->d[3] > SECP256K1_N_3) & ~no;
    no |= (a->d[2] < SECP256K1_N_2) & ~yes;
    yes |= (a->d[2] > SECP256K1_N_2) & ~no;
    no |= (a->d[1] < SECP256K1_N_1) & ~yes;
    yes |= (a->d[1] > SECP256K1_N_1) & ~no;
    yes |= (a->d[0] >= SECP256K1_N_0) & ~no;
    return yes;
}

static int secp256k1_scalar_reduce(secp256k1_scalar *r, uint32_t overflow) {
  uint64_t t;
#ifdef VERIFY
  VERIFY_CHECK(overflow <= 1);
#endif
  t = (uint64_t)r->d[0] + overflow * SECP256K1_N_C_0;
  r->d[0] = t & 0xFFFFFFFFUL; t >>= 32;
  t += (uint64_t)r->d[1] + overflow * SECP256K1_N_C_1;
  r->d[1] = t & 0xFFFFFFFFUL; t >>= 32;
  t += (uint64_t)r->d[2] + overflow * SECP256K1_N_C_2;
  r->d[2] = t & 0xFFFFFFFFUL; t >>= 32;
  t += (uint64_t)r->d[3] + overflow * SECP256K1_N_C_3;
  r->d[3] = t & 0xFFFFFFFFUL; t >>= 32;
  t += (uint64_t)r->d[4] + overflow * SECP256K1_N_C_4;
  r->d[4] = t & 0xFFFFFFFFUL; t >>= 32;
  t += (uint64_t)r->d[5];
  r->d[5] = t & 0xFFFFFFFFUL; t >>= 32;
  t += (uint64_t)r->d[6];
  r->d[6] = t & 0xFFFFFFFFUL; t >>= 32;
  t += (uint64_t)r->d[7];
  r->d[7] = t & 0xFFFFFFFFUL;
  return overflow;
}

static int secp256k1_scalar_add(secp256k1_scalar *r, const secp256k1_scalar *a, const secp256k1_scalar *b) {
    int overflow;
    uint64_t t = (uint64_t)a->d[0] + b->d[0];
    r->d[0] = t & 0xFFFFFFFFUL; t >>= 32;
    t += (uint64_t)a->d[1] + b->d[1];
    r->d[1] = t & 0xFFFFFFFFUL; t >>= 32;
    t += (uint64_t)a->d[2] + b->d[2];
    r->d[2] = t & 0xFFFFFFFFUL; t >>= 32;
    t += (uint64_t)a->d[3] + b->d[3];
    r->d[3] = t & 0xFFFFFFFFUL; t >>= 32;
    t += (uint64_t)a->d[4] + b->d[4];
    r->d[4] = t & 0xFFFFFFFFUL; t >>= 32;
    t += (uint64_t)a->d[5] + b->d[5];
    r->d[5] = t & 0xFFFFFFFFUL; t >>= 32;
    t += (uint64_t)a->d[6] + b->d[6];
    r->d[6] = t & 0xFFFFFFFFUL; t >>= 32;
    t += (uint64_t)a->d[7] + b->d[7];
    r->d[7] = t & 0xFFFFFFFFUL; t >>= 32;
    overflow = t + secp256k1_scalar_check_overflow(r);
#ifdef VERIFY
    VERIFY_CHECK(overflow == 0 || overflow == 1);
#endif
    secp256k1_scalar_reduce(r, overflow);
    return overflow;
}

static void secp256k1_scalar_cadd_bit(secp256k1_scalar *r, unsigned int bit, int flag) {
    uint64_t t;
#ifdef VERIFY
    VERIFY_CHECK(bit < 256);
#endif
    bit += ((uint32_t) flag - 1) & 0x100;  /* forcing (bit >> 5) > 7 makes this a noop */
    t = (uint64_t)r->d[0] + (((uint32_t)((bit >> 5) == 0)) << (bit & 0x1F));
    r->d[0] = t & 0xFFFFFFFFUL; t >>= 32;
    t += (uint64_t)r->d[1] + (((uint32_t)((bit >> 5) == 1)) << (bit & 0x1F));
    r->d[1] = t & 0xFFFFFFFFUL; t >>= 32;
    t += (uint64_t)r->d[2] + (((uint32_t)((bit >> 5) == 2)) << (bit & 0x1F));
    r->d[2] = t & 0xFFFFFFFFUL; t >>= 32;
    t += (uint64_t)r->d[3] + (((uint32_t)((bit >> 5) == 3)) << (bit & 0x1F));
    r->d[3] = t & 0xFFFFFFFFUL; t >>= 32;
    t += (uint64_t)r->d[4] + (((uint32_t)((bit >> 5) == 4)) << (bit & 0x1F));
    r->d[4] = t & 0xFFFFFFFFUL; t >>= 32;
    t += (uint64_t)r->d[5] + (((uint32_t)((bit >> 5) == 5)) << (bit & 0x1F));
    r->d[5] = t & 0xFFFFFFFFUL; t >>= 32;
    t += (uint64_t)r->d[6] + (((uint32_t)((bit >> 5) == 6)) << (bit & 0x1F));
    r->d[6] = t & 0xFFFFFFFFUL; t >>= 32;
    t += (uint64_t)r->d[7] + (((uint32_t)((bit >> 5) == 7)) << (bit & 0x1F));
    r->d[7] = t & 0xFFFFFFFFUL;
#ifdef VERIFY
    VERIFY_CHECK((t >> 32) == 0);
    VERIFY_CHECK(secp256k1_scalar_check_overflow(r) == 0);
#endif
}

static void secp256k1_scalar_negate(secp256k1_scalar *r, const secp256k1_scalar *a) {
    uint32_t nonzero = 0xFFFFFFFFUL * (secp256k1_scalar_is_zero(a) == 0);
    uint64_t t = (uint64_t)(~a->d[0]) + SECP256K1_N_0 + 1;
    r->d[0] = t & nonzero; t >>= 32;
    t += (uint64_t)(~a->d[1]) + SECP256K1_N_1;
    r->d[1] = t & nonzero; t >>= 32;
    t += (uint64_t)(~a->d[2]) + SECP256K1_N_2;
    r->d[2] = t & nonzero; t >>= 32;
    t += (uint64_t)(~a->d[3]) + SECP256K1_N_3;
    r->d[3] = t & nonzero; t >>= 32;
    t += (uint64_t)(~a->d[4]) + SECP256K1_N_4;
    r->d[4] = t & nonzero; t >>= 32;
    t += (uint64_t)(~a->d[5]) + SECP256K1_N_5;
    r->d[5] = t & nonzero; t >>= 32;
    t += (uint64_t)(~a->d[6]) + SECP256K1_N_6;
    r->d[6] = t & nonzero; t >>= 32;
    t += (uint64_t)(~a->d[7]) + SECP256K1_N_7;
    r->d[7] = t & nonzero;
}

int secp256k1_scalar_is_one(const secp256k1_scalar *a) {
    return ((a->d[0] ^ 1) | a->d[1] | a->d[2] | a->d[3] | a->d[4] | a->d[5] | a->d[6] | a->d[7]) == 0;
}

static int secp256k1_scalar_is_high(const secp256k1_scalar *a) {
    int yes = 0;
    int no = 0;
    no |= (a->d[7] < SECP256K1_N_H_7);
    yes |= (a->d[7] > SECP256K1_N_H_7) & ~no;
    no |= (a->d[6] < SECP256K1_N_H_6) & ~yes; /* No need for a > check. */
    no |= (a->d[5] < SECP256K1_N_H_5) & ~yes; /* No need for a > check. */
    no |= (a->d[4] < SECP256K1_N_H_4) & ~yes; /* No need for a > check. */
    no |= (a->d[3] < SECP256K1_N_H_3) & ~yes;
    yes |= (a->d[3] > SECP256K1_N_H_3) & ~no;
    no |= (a->d[2] < SECP256K1_N_H_2) & ~yes;
    yes |= (a->d[2] > SECP256K1_N_H_2) & ~no;
    no |= (a->d[1] < SECP256K1_N_H_1) & ~yes;
    yes |= (a->d[1] > SECP256K1_N_H_1) & ~no;
    yes |= (a->d[0] > SECP256K1_N_H_0) & ~no;
    return yes;
}

static int secp256k1_scalar_cond_negate(secp256k1_scalar *r, int flag) {
    /* If we are flag = 0, mask = 00...00 and this is a no-op;
     * if we are flag = 1, mask = 11...11 and this is identical to secp256k1_scalar_negate */
    uint32_t mask = !flag - 1;
    uint32_t nonzero = 0xFFFFFFFFUL * (secp256k1_scalar_is_zero(r) == 0);
    uint64_t t = (uint64_t)(r->d[0] ^ mask) + ((SECP256K1_N_0 + 1) & mask);
    r->d[0] = t & nonzero; t >>= 32;
    t += (uint64_t)(r->d[1] ^ mask) + (SECP256K1_N_1 & mask);
    r->d[1] = t & nonzero; t >>= 32;
    t += (uint64_t)(r->d[2] ^ mask) + (SECP256K1_N_2 & mask);
    r->d[2] = t & nonzero; t >>= 32;
    t += (uint64_t)(r->d[3] ^ mask) + (SECP256K1_N_3 & mask);
    r->d[3] = t & nonzero; t >>= 32;
    t += (uint64_t)(r->d[4] ^ mask) + (SECP256K1_N_4 & mask);
    r->d[4] = t & nonzero; t >>= 32;
    t += (uint64_t)(r->d[5] ^ mask) + (SECP256K1_N_5 & mask);
    r->d[5] = t & nonzero; t >>= 32;
    t += (uint64_t)(r->d[6] ^ mask) + (SECP256K1_N_6 & mask);
    r->d[6] = t & nonzero; t >>= 32;
    t += (uint64_t)(r->d[7] ^ mask) + (SECP256K1_N_7 & mask);
    r->d[7] = t & nonzero;
    return 2 * (mask == 0) - 1;
}


/* Inspired by the macros in OpenSSL's crypto/bn/asm/x86_64-gcc.c. */

/** Add a*b to the number defined by (c0,c1,c2). c2 must never overflow. */
#define muladd(a,b) { \
    uint32_t tl, th; \
    { \
        uint64_t t = (uint64_t)a * b; \
        th = t >> 32;         /* at most 0xFFFFFFFE */ \
        tl = t; \
    } \
    c0 += tl;                 /* overflow is handled on the next line */ \
    th += (c0 < tl) ? 1 : 0;  /* at most 0xFFFFFFFF */ \
    c1 += th;                 /* overflow is handled on the next line */ \
    c2 += (c1 < th) ? 1 : 0;  /* never overflows by contract (verified in the next line) */ \
/*    VERIFY_CHECK((c1 >= th) || (c2 != 0)); */ \
}

/** Add a*b to the number defined by (c0,c1). c1 must never overflow. */
#define muladd_fast(a,b) { \
    uint32_t tl, th; \
    { \
        uint64_t t = (uint64_t)a * b; \
        th = t >> 32;         /* at most 0xFFFFFFFE */ \
        tl = t; \
    } \
    c0 += tl;                 /* overflow is handled on the next line */ \
    th += (c0 < tl) ? 1 : 0;  /* at most 0xFFFFFFFF */ \
    c1 += th;                 /* never overflows by contract (verified in the next line) */ \
/*    VERIFY_CHECK(c1 >= th);*/ \
}

/** Add 2*a*b to the number defined by (c0,c1,c2). c2 must never overflow. */
#define muladd2(a,b) { \
    uint32_t tl, th, th2, tl2; \
    { \
        uint64_t t = (uint64_t)a * b; \
        th = t >> 32;               /* at most 0xFFFFFFFE */ \
        tl = t; \
    } \
    th2 = th + th;                  /* at most 0xFFFFFFFE (in case th was 0x7FFFFFFF) */ \
    c2 += (th2 < th) ? 1 : 0;       /* never overflows by contract (verified the next line) */ \
    /*VERIFY_CHECK((th2 >= th) || (c2 != 0)); */\
    tl2 = tl + tl;                  /* at most 0xFFFFFFFE (in case the lowest 63 bits of tl were 0x7FFFFFFF) */ \
    th2 += (tl2 < tl) ? 1 : 0;      /* at most 0xFFFFFFFF */ \
    c0 += tl2;                      /* overflow is handled on the next line */ \
    th2 += (c0 < tl2) ? 1 : 0;      /* second overflow is handled on the next line */ \
    c2 += (c0 < tl2) & (th2 == 0);  /* never overflows by contract (verified the next line) */ \
    /*VERIFY_CHECK((c0 >= tl2) || (th2 != 0) || (c2 != 0)); */\
    c1 += th2;                      /* overflow is handled on the next line */ \
    c2 += (c1 < th2) ? 1 : 0;       /* never overflows by contract (verified the next line) */ \
    /*VERIFY_CHECK((c1 >= th2) || (c2 != 0));*/ \
}

/** Add a to the number defined by (c0,c1,c2). c2 must never overflow. */
#define sumadd(a) { \
    unsigned int over; \
    c0 += (a);                  /* overflow is handled on the next line */ \
    over = (c0 < (a)) ? 1 : 0; \
    c1 += over;                 /* overflow is handled on the next line */ \
    c2 += (c1 < over) ? 1 : 0;  /* never overflows by contract */ \
}

/** Add a to the number defined by (c0,c1). c1 must never overflow, c2 must be zero. */
#define sumadd_fast(a) { \
    c0 += (a);                 /* overflow is handled on the next line */ \
    c1 += (c0 < (a)) ? 1 : 0;  /* never overflows by contract (verified the next line) */ \
    /*VERIFY_CHECK((c1 != 0) | (c0 >= (a)));*/ \
    /*VERIFY_CHECK(c2 == 0);*/ \
}

/** Extract the lowest 32 bits of (c0,c1,c2) into n, and left shift the number 32 bits. */
#define extract(n) { \
    (n) = c0; \
    c0 = c1; \
    c1 = c2; \
    c2 = 0; \
}

/** Extract the lowest 32 bits of (c0,c1,c2) into n, and left shift the number 32 bits. c2 is required to be zero. */
#define extract_fast(n) { \
    (n) = c0; \
    c0 = c1; \
    c1 = 0; \
/*    VERIFY_CHECK(c2 == 0); */ \
}

static void secp256k1_scalar_reduce_512(secp256k1_scalar *r, const uint32_t *l) {
    uint64_t c;
    uint32_t n0 = l[8], n1 = l[9], n2 = l[10], n3 = l[11], n4 = l[12], n5 = l[13], n6 = l[14], n7 = l[15];
    uint32_t m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12;
    uint32_t p0, p1, p2, p3, p4, p5, p6, p7, p8;

    /* 96 bit accumulator. */
    uint32_t c0, c1, c2;

    /* Reduce 512 bits into 385. */
    /* m[0..12] = l[0..7] + n[0..7] * SECP256K1_N_C. */
    c0 = l[0]; c1 = 0; c2 = 0;
    muladd_fast(n0, SECP256K1_N_C_0);
    extract_fast(m0);
    sumadd_fast(l[1]);
    muladd(n1, SECP256K1_N_C_0);
    muladd(n0, SECP256K1_N_C_1);
    extract(m1);
    sumadd(l[2]);
    muladd(n2, SECP256K1_N_C_0);
    muladd(n1, SECP256K1_N_C_1);
    muladd(n0, SECP256K1_N_C_2);
    extract(m2);
    sumadd(l[3]);
    muladd(n3, SECP256K1_N_C_0);
    muladd(n2, SECP256K1_N_C_1);
    muladd(n1, SECP256K1_N_C_2);
    muladd(n0, SECP256K1_N_C_3);
    extract(m3);
    sumadd(l[4]);
    muladd(n4, SECP256K1_N_C_0);
    muladd(n3, SECP256K1_N_C_1);
    muladd(n2, SECP256K1_N_C_2);
    muladd(n1, SECP256K1_N_C_3);
    sumadd(n0);
    extract(m4);
    sumadd(l[5]);
    muladd(n5, SECP256K1_N_C_0);
    muladd(n4, SECP256K1_N_C_1);
    muladd(n3, SECP256K1_N_C_2);
    muladd(n2, SECP256K1_N_C_3);
    sumadd(n1);
    extract(m5);
    sumadd(l[6]);
    muladd(n6, SECP256K1_N_C_0);
    muladd(n5, SECP256K1_N_C_1);
    muladd(n4, SECP256K1_N_C_2);
    muladd(n3, SECP256K1_N_C_3);
    sumadd(n2);
    extract(m6);
    sumadd(l[7]);
    muladd(n7, SECP256K1_N_C_0);
    muladd(n6, SECP256K1_N_C_1);
    muladd(n5, SECP256K1_N_C_2);
    muladd(n4, SECP256K1_N_C_3);
    sumadd(n3);
    extract(m7);
    muladd(n7, SECP256K1_N_C_1);
    muladd(n6, SECP256K1_N_C_2);
    muladd(n5, SECP256K1_N_C_3);
    sumadd(n4);
    extract(m8);
    muladd(n7, SECP256K1_N_C_2);
    muladd(n6, SECP256K1_N_C_3);
    sumadd(n5);
    extract(m9);
    muladd(n7, SECP256K1_N_C_3);
    sumadd(n6);
    extract(m10);
    sumadd_fast(n7);
    extract_fast(m11);
#ifdef VERIFY
    VERIFY_CHECK(c0 <= 1);
#endif
    m12 = c0;

    /* Reduce 385 bits into 258. */
    /* p[0..8] = m[0..7] + m[8..12] * SECP256K1_N_C. */
    c0 = m0; c1 = 0; c2 = 0;
    muladd_fast(m8, SECP256K1_N_C_0);
    extract_fast(p0);
    sumadd_fast(m1);
    muladd(m9, SECP256K1_N_C_0);
    muladd(m8, SECP256K1_N_C_1);
    extract(p1);
    sumadd(m2);
    muladd(m10, SECP256K1_N_C_0);
    muladd(m9, SECP256K1_N_C_1);
    muladd(m8, SECP256K1_N_C_2);
    extract(p2);
    sumadd(m3);
    muladd(m11, SECP256K1_N_C_0);
    muladd(m10, SECP256K1_N_C_1);
    muladd(m9, SECP256K1_N_C_2);
    muladd(m8, SECP256K1_N_C_3);
    extract(p3);
    sumadd(m4);
    muladd(m12, SECP256K1_N_C_0);
    muladd(m11, SECP256K1_N_C_1);
    muladd(m10, SECP256K1_N_C_2);
    muladd(m9, SECP256K1_N_C_3);
    sumadd(m8);
    extract(p4);
    sumadd(m5);
    muladd(m12, SECP256K1_N_C_1);
    muladd(m11, SECP256K1_N_C_2);
    muladd(m10, SECP256K1_N_C_3);
    sumadd(m9);
    extract(p5);
    sumadd(m6);
    muladd(m12, SECP256K1_N_C_2);
    muladd(m11, SECP256K1_N_C_3);
    sumadd(m10);
    extract(p6);
    sumadd_fast(m7);
    muladd_fast(m12, SECP256K1_N_C_3);
    sumadd_fast(m11);
    extract_fast(p7);
    p8 = c0 + m12;
#ifdef VERIFY
    VERIFY_CHECK(p8 <= 2);
#endif
    /* Reduce 258 bits into 256. */
    /* r[0..7] = p[0..7] + p[8] * SECP256K1_N_C. */
    c = p0 + (uint64_t)SECP256K1_N_C_0 * p8;
    r->d[0] = c & 0xFFFFFFFFUL; c >>= 32;
    c += p1 + (uint64_t)SECP256K1_N_C_1 * p8;
    r->d[1] = c & 0xFFFFFFFFUL; c >>= 32;
    c += p2 + (uint64_t)SECP256K1_N_C_2 * p8;
    r->d[2] = c & 0xFFFFFFFFUL; c >>= 32;
    c += p3 + (uint64_t)SECP256K1_N_C_3 * p8;
    r->d[3] = c & 0xFFFFFFFFUL; c >>= 32;
    c += p4 + (uint64_t)p8;
    r->d[4] = c & 0xFFFFFFFFUL; c >>= 32;
    c += p5;
    r->d[5] = c & 0xFFFFFFFFUL; c >>= 32;
    c += p6;
    r->d[6] = c & 0xFFFFFFFFUL; c >>= 32;
    c += p7;
    r->d[7] = c & 0xFFFFFFFFUL; c >>= 32;

    /* Final reduction of r. */
    secp256k1_scalar_reduce(r, c + secp256k1_scalar_check_overflow(r));
}

//Macros used later in secp256k1_parametric_address_space.cl
//#undef sumadd
//#undef sumadd_fast
//#undef muladd
//#undef muladd_fast
//#undef muladd2
//#undef extract
//#undef extract_fast

static int secp256k1_scalar_shr_int(secp256k1_scalar *r, int n) {
    int ret;
#ifdef VERIFY
    VERIFY_CHECK(n > 0);
    VERIFY_CHECK(n < 16);
#endif
    ret = r->d[0] & ((1 << n) - 1);
    r->d[0] = (r->d[0] >> n) + (r->d[1] << (32 - n));
    r->d[1] = (r->d[1] >> n) + (r->d[2] << (32 - n));
    r->d[2] = (r->d[2] >> n) + (r->d[3] << (32 - n));
    r->d[3] = (r->d[3] >> n) + (r->d[4] << (32 - n));
    r->d[4] = (r->d[4] >> n) + (r->d[5] << (32 - n));
    r->d[5] = (r->d[5] >> n) + (r->d[6] << (32 - n));
    r->d[6] = (r->d[6] >> n) + (r->d[7] << (32 - n));
    r->d[7] = (r->d[7] >> n);
    return ret;
}

#ifdef USE_ENDOMORPHISM
static void secp256k1_scalar_split_128(secp256k1_scalar *r1, secp256k1_scalar *r2, const secp256k1_scalar *a) {
    r1->d[0] = a->d[0];
    r1->d[1] = a->d[1];
    r1->d[2] = a->d[2];
    r1->d[3] = a->d[3];
    r1->d[4] = 0;
    r1->d[5] = 0;
    r1->d[6] = 0;
    r1->d[7] = 0;
    r2->d[0] = a->d[4];
    r2->d[1] = a->d[5];
    r2->d[2] = a->d[6];
    r2->d[3] = a->d[7];
    r2->d[4] = 0;
    r2->d[5] = 0;
    r2->d[6] = 0;
    r2->d[7] = 0;
}
#endif

int secp256k1_scalar_eq(const secp256k1_scalar *a, const secp256k1_scalar *b) {
    return ((a->d[0] ^ b->d[0]) | (a->d[1] ^ b->d[1]) | (a->d[2] ^ b->d[2]) | (a->d[3] ^ b->d[3]) | (a->d[4] ^ b->d[4]) | (a->d[5] ^ b->d[5]) | (a->d[6] ^ b->d[6]) | (a->d[7] ^ b->d[7])) == 0;
}

void secp256k1_scalar_mul_shift_var(secp256k1_scalar *r, const secp256k1_scalar *a, const secp256k1_scalar *b, unsigned int shift) {
    uint32_t l[16];
    unsigned int shiftlimbs;
    unsigned int shiftlow;
    unsigned int shifthigh;
#ifdef VERIFY
    VERIFY_CHECK(shift >= 256);
#endif
    secp256k1_scalar_mul_512(l, a, b);
    shiftlimbs = shift >> 5;
    shiftlow = shift & 0x1F;
    shifthigh = 32 - shiftlow;
    r->d[0] = shift < 512 ? (l[0 + shiftlimbs] >> shiftlow | (shift < 480 && shiftlow ? (l[1 + shiftlimbs] << shifthigh) : 0)) : 0;
    r->d[1] = shift < 480 ? (l[1 + shiftlimbs] >> shiftlow | (shift < 448 && shiftlow ? (l[2 + shiftlimbs] << shifthigh) : 0)) : 0;
    r->d[2] = shift < 448 ? (l[2 + shiftlimbs] >> shiftlow | (shift < 416 && shiftlow ? (l[3 + shiftlimbs] << shifthigh) : 0)) : 0;
    r->d[3] = shift < 416 ? (l[3 + shiftlimbs] >> shiftlow | (shift < 384 && shiftlow ? (l[4 + shiftlimbs] << shifthigh) : 0)) : 0;
    r->d[4] = shift < 384 ? (l[4 + shiftlimbs] >> shiftlow | (shift < 352 && shiftlow ? (l[5 + shiftlimbs] << shifthigh) : 0)) : 0;
    r->d[5] = shift < 352 ? (l[5 + shiftlimbs] >> shiftlow | (shift < 320 && shiftlow ? (l[6 + shiftlimbs] << shifthigh) : 0)) : 0;
    r->d[6] = shift < 320 ? (l[6 + shiftlimbs] >> shiftlow | (shift < 288 && shiftlow ? (l[7 + shiftlimbs] << shifthigh) : 0)) : 0;
    r->d[7] = shift < 288 ? (l[7 + shiftlimbs] >> shiftlow)  : 0;
    secp256k1_scalar_cadd_bit(r, 0, (l[(shift - 1) >> 5] >> ((shift - 1) & 0x1f)) & 1);
}
//******end of scalar_8x32_impl.h******


//******From scalar.h******

/** Clear a scalar to prevent the leak of sensitive data. */
static void secp256k1_scalar_clear(secp256k1_scalar *r);

/** Access bits from a scalar. All requested bits must belong to the same 32-bit limb. */
static unsigned int secp256k1_scalar_get_bits(const secp256k1_scalar *a, unsigned int offset, unsigned int count);

/** Access bits from a scalar. Not constant time. */
static unsigned int secp256k1_scalar_get_bits_var(const secp256k1_scalar *a, unsigned int offset, unsigned int count);

/** Set a scalar to an unsigned integer. */
static void secp256k1_scalar_set_int(secp256k1_scalar *r, unsigned int v);

/** Add two scalars together (modulo the group order). Returns whether it overflowed. */
static int secp256k1_scalar_add(secp256k1_scalar *r, const secp256k1_scalar *a, const secp256k1_scalar *b);

/** Conditionally add a power of two to a scalar. The result is not allowed to overflow. */
static void secp256k1_scalar_cadd_bit(secp256k1_scalar *r, unsigned int bit, int flag);

/** Shift a scalar right by some amount strictly between 0 and 16, returning
 *  the low bits that were shifted off */
static int secp256k1_scalar_shr_int(secp256k1_scalar *r, int n);

/** Compute the square of a scalar (modulo the group order). */
static void secp256k1_scalar_sqr(secp256k1_scalar *r, const secp256k1_scalar *a);

/** Compute the complement of a scalar (modulo the group order). */
static void secp256k1_scalar_negate(secp256k1_scalar *r, const secp256k1_scalar *a);

/** Check whether a scalar equals zero. */
int secp256k1_scalar_is_zero(const secp256k1_scalar *a);

/** Check whether a scalar equals one. */
int secp256k1_scalar_is_one(const secp256k1_scalar *a);

/** Check whether a scalar, considered as an nonnegative integer, is even. */
static int secp256k1_scalar_is_even(const secp256k1_scalar *a);

/** Check whether a scalar is higher than the group order divided by 2. */
static int secp256k1_scalar_is_high(const secp256k1_scalar *a);

/** Conditionally negate a number, in constant time.
 * Returns -1 if the number was negated, 1 otherwise */
static int secp256k1_scalar_cond_negate(secp256k1_scalar *a, int flag);

#ifndef USE_NUM_NONE
/** Convert a scalar to a number. */
//static void secp256k1_scalar_get_num(secp256k1_num *r, const secp256k1_scalar *a);

/** Get the order of the group as a number. */
//static void secp256k1_scalar_order_get_num(secp256k1_num *r);
#endif

/** Compare two scalars. */
int secp256k1_scalar_eq(const secp256k1_scalar *a, const secp256k1_scalar *b);

#ifdef USE_ENDOMORPHISM
/** Find r1 and r2 such that r1+r2*2^128 = a. */
static void secp256k1_scalar_split_128(secp256k1_scalar *r1, secp256k1_scalar *r2, const secp256k1_scalar *a);
/** Find r1 and r2 such that r1+r2*lambda = a, and r1 and r2 are maximum 128 bits long (see secp256k1_gej_mul_lambda). */
static void secp256k1_scalar_split_lambda(secp256k1_scalar *r1, secp256k1_scalar *r2, const secp256k1_scalar *a);
#endif

/** Multiply a and b (without taking the modulus!), divide by 2**shift, and round to the nearest integer. Shift must be at least 256. */
void secp256k1_scalar_mul_shift_var(secp256k1_scalar *r, const secp256k1_scalar *a, const secp256k1_scalar *b, unsigned int shift);
//******end of scalar.h******


//******From scalar_impl.h******

static int secp256k1_scalar_is_even(const secp256k1_scalar *a) {
    /* d[0] is present and is the lowest word for all representations */
    return !(a->d[0] & 1);
}

#ifdef USE_ENDOMORPHISM
/**
 * The Secp256k1 curve has an endomorphism, where lambda * (x, y) = (beta * x, y), where
 * lambda is {0x53,0x63,0xad,0x4c,0xc0,0x5c,0x30,0xe0,0xa5,0x26,0x1c,0x02,0x88,0x12,0x64,0x5a,
 *            0x12,0x2e,0x22,0xea,0x20,0x81,0x66,0x78,0xdf,0x02,0x96,0x7c,0x1b,0x23,0xbd,0x72}
 *
 * "Guide to Elliptic Curve Cryptography" (Hankerson, Menezes, Vanstone) gives an algorithm
 * (algorithm 3.74) to find k1 and k2 given k, such that k1 + k2 * lambda == k mod n, and k1
 * and k2 have a small size.
 * It relies on constants a1, b1, a2, b2. These constants for the value of lambda above are:
 *
 * - a1 =      {0x30,0x86,0xd2,0x21,0xa7,0xd4,0x6b,0xcd,0xe8,0x6c,0x90,0xe4,0x92,0x84,0xeb,0x15}
 * - b1 =     -{0xe4,0x43,0x7e,0xd6,0x01,0x0e,0x88,0x28,0x6f,0x54,0x7f,0xa9,0x0a,0xbf,0xe4,0xc3}
 * - a2 = {0x01,0x14,0xca,0x50,0xf7,0xa8,0xe2,0xf3,0xf6,0x57,0xc1,0x10,0x8d,0x9d,0x44,0xcf,0xd8}
 * - b2 =      {0x30,0x86,0xd2,0x21,0xa7,0xd4,0x6b,0xcd,0xe8,0x6c,0x90,0xe4,0x92,0x84,0xeb,0x15}
 *
 * The algorithm then computes c1 = round(b1 * k / n) and c2 = round(b2 * k / n), and gives
 * k1 = k - (c1*a1 + c2*a2) and k2 = -(c1*b1 + c2*b2). Instead, we use modular arithmetic, and
 * compute k1 as k - k2 * lambda, avoiding the need for constants a1 and a2.
 *
 * g1, g2 are precomputed constants used to replace division with a rounded multiplication
 * when decomposing the scalar for an endomorphism-based point multiplication.
 *
 * The possibility of using precomputed estimates is mentioned in "Guide to Elliptic Curve
 * Cryptography" (Hankerson, Menezes, Vanstone) in section 3.5.
 *
 * The derivation is described in the paper "Efficient Software Implementation of Public-Key
 * Cryptography on Sensor Networks Using the MSP430X Microcontroller" (Gouvea, Oliveira, Lopez),
 * Section 4.3 (here we use a somewhat higher-precision estimate):
 * d = a1*b2 - b1*a2
 * g1 = round((2^272)*b2/d)
 * g2 = round((2^272)*b1/d)
 *
 * (Note that 'd' is also equal to the curve order here because [a1,b1] and [a2,b2] are found
 * as outputs of the Extended Euclidean Algorithm on inputs 'order' and 'lambda').
 *
 * The function below splits a in r1 and r2, such that r1 + lambda * r2 == a (mod order).
 */

static void secp256k1_scalar_split_lambda(secp256k1_scalar *r1, secp256k1_scalar *r2, const secp256k1_scalar *a) {
    secp256k1_scalar c1, c2;
    static const secp256k1_scalar minus_lambda = SECP256K1_SCALAR_CONST(
        0xAC9C52B3UL, 0x3FA3CF1FUL, 0x5AD9E3FDUL, 0x77ED9BA4UL,
        0xA880B9FCUL, 0x8EC739C2UL, 0xE0CFC810UL, 0xB51283CFUL
    );
    static const secp256k1_scalar minus_b1 = SECP256K1_SCALAR_CONST(
        0x00000000UL, 0x00000000UL, 0x00000000UL, 0x00000000UL,
        0xE4437ED6UL, 0x010E8828UL, 0x6F547FA9UL, 0x0ABFE4C3UL
    );
    static const secp256k1_scalar minus_b2 = SECP256K1_SCALAR_CONST(
        0xFFFFFFFFUL, 0xFFFFFFFFUL, 0xFFFFFFFFUL, 0xFFFFFFFEUL,
        0x8A280AC5UL, 0x0774346DUL, 0xD765CDA8UL, 0x3DB1562CUL
    );
    static const secp256k1_scalar g1 = SECP256K1_SCALAR_CONST(
        0x00000000UL, 0x00000000UL, 0x00000000UL, 0x00003086UL,
        0xD221A7D4UL, 0x6BCDE86CUL, 0x90E49284UL, 0xEB153DABUL
    );
    static const secp256k1_scalar g2 = SECP256K1_SCALAR_CONST(
        0x00000000UL, 0x00000000UL, 0x00000000UL, 0x0000E443UL,
        0x7ED6010EUL, 0x88286F54UL, 0x7FA90ABFUL, 0xE4C42212UL
    );
    VERIFY_CHECK(r1 != a);
    VERIFY_CHECK(r2 != a);
    /* these _var calls are constant time since the shift amount is constant */
    secp256k1_scalar_mul_shift_var(&c1, a, &g1, 272);
    secp256k1_scalar_mul_shift_var(&c2, a, &g2, 272);
    secp256k1_scalar_mul(&c1, &c1, &minus_b1);
    secp256k1_scalar_mul(&c2, &c2, &minus_b2);
    secp256k1_scalar_add(r2, &c1, &c2);
    secp256k1_scalar_mul(r1, r2, &minus_lambda);
    secp256k1_scalar_add(r1, r1, a);
}
#endif
//******end of scalar_impl.h******


//******From ecmult_impl.h******

/** The following two macro retrieves a particular odd multiple from a table
 *  of precomputed multiples. */
#define ECMULT_TABLE_GET_GE(r,pre,n,w) do { \
  /*VERIFY_CHECK(((n) & 1) == 1);*/ \
  /*VERIFY_CHECK((n) >= -((1 << ((w)-1)) - 1));*/ \
  /*VERIFY_CHECK((n) <=  ((1 << ((w)-1)) - 1));*/ \
  if ((n) > 0) { \
    *(r) = (pre)[((n)-1)/2]; \
  } else { \
    secp256k1_ge_neg((r), &(pre)[(-(n)-1)/2]); \
  } \
} while(0)

#define ECMULT_TABLE_GET_GE_STORAGE(r, pre, n, w) do { \
  /*VERIFY_CHECK(((n) & 1) == 1);*/ \
  /*VERIFY_CHECK((n) >= -((1 << ((w)-1)) - 1));*/ \
  /*VERIFY_CHECK((n) <=  ((1 << ((w)-1)) - 1));*/ \
  if ((n) > 0) { \
    secp256k1_ge_from_storage__global((r), &(pre)[((n)-1)/2]); \
  } else { \
    secp256k1_ge_from_storage__global((r), &(pre)[(-(n)-1)/2]); \
    secp256k1_ge_neg((r), (r)); \
  } \
} while(0)

/** Fill a table 'prej' with precomputed odd multiples of a. Prej will contain
 *  the values [1*a,3*a,...,(2*n-1)*a], so it has space for n values. zr[0] will
 *  contain prej[0].z / a.z. The other zr[i] values = prej[i].z / prej[i-1].z.
 *  Prej's Z values are undefined, except for the last value.
 */
static void secp256k1_ecmult_odd_multiples_table(
  int n,
  __global secp256k1_gej *prej,
  __global secp256k1_fe *zr,
  const secp256k1_gej *a //,
//  __global unsigned char* memoryPool
) {

  secp256k1_gej d, globalToLocal1, globalToLocal2;
  secp256k1_ge a_ge, d_ge;
  secp256k1_fe globalToLocalFE1, globalToLocalFE2;
  int i;

#ifdef VERIFY
  VERIFY_CHECK(!a->infinity);
#endif

  //int debugwarning;
  //
  //What follows are comments to a bug that was triggered on my development laptop,
  //an Intel CPU+Intel GPU system on a chip laptop, stock Ubuntu 16.04,
  //openCL 2.0 compiler using standard intel drivers as of May 2018.
  //
  //As of May 2018, this bug is system-dependent and does not manifest itself on
  //my work machine. No machines other than my development laptop and work machine have been tested yet.
  //
  //The bug has been reproduced exactly in branch:
  //
  //https://github.com/blockchaingate/Kanban/tree/fixCryptoBuild,
  //
  //commit:
  //
  //https://github.com/blockchaingate/Kanban/commit/f470f5a7b9caba1a3c7086a83240da364254640b
  //
  //The bug manifests itself by producing two different
  //computations on the CPU (C/C++ build)
  //and on the GPU (openCL 2.0 build).
  //
  //The exact (first) offending line has been identified down to a single arithmetic operation.
  //The bug is reproduced in file test_suite_1_basic_operations.cl,
  //in the last lines before the return statement.
  //
  //Here are some of the many possible causes I can speculate about.
  //
  //1. Hardware bug, manifesting itself after using enough __private memory
  //on the GPU stack.
  //2. openCL 2.0 driver error in which memory on the GPU stack is corrupted, possibly after using
  //   a sufficient ammount of it.
  //3. openCL/hardware error resulting in wrong extraction of buffers from the GPU.
  //3. A software error by myself causing corruption of certain regions of the GPU stack.
  //4. A software error by myself causing corruption of the buffers extracted from the GPU.
  //5. Any other unforeseen circumstance, caused by bad hardware,
  //   bad drivers, bad software (my error), or any combination of those.
  //
  //The bug remains unfixed at the time of writing, however at present I believe that
  //it is most likely NOT a software bug of our team but an issue specific to my development
  //laptop or drivers.
  //
  // - If the bug cause is a hardware error on my laptop, then
  //these comments can be safely ignored. The lesson to be learned is
  //we need to make sure our testing infrastructure
  //catches hardware errors with release build self-tests.
  //
  // - If this is an openCL driver error, we definitely want to investigate further,
  // as this may cause restrictions on our deployment.
  //
  // - If this is a software error by myself, we definitely need to know and fix.
  //
  //We postpone further investigation of the matter until we verify that the
  //bug is reproducible on other systems and configurations.
  //
  //
  //PLEASE do not remove these comments until we have tested with success our code on multiple machines.
  //
  //
  //
  //COMMENT OUT NEXT LINE TO TRIGGER BUG
  //Ram memory issue? What is going on?
  //stack bad? Compiler bad?
  //memoryPool_write_gej_asOutput(a, - 1, memoryPool);
  
  //int debugWarningBadReturn1;
  //secp256k1_gej_double_var_with_debug(&d, a, NULL, memoryPool);
  secp256k1_gej_double_var(&d, a, NULL);
  //return;


  //int debugwarning3;
  //memoryPool_write_gej_asOutput(&d, - 1, memoryPool);


  /*
   * Perform the additions on an isomorphism where 'd' is affine: drop the z coordinate
   * of 'd', and scale the 1P starting value's x/y coordinates without changing its z.
   */
  d_ge.x = d.x;
  d_ge.y = d.y;
  d_ge.infinity = 0;




  secp256k1_ge_set_gej_zinv(&a_ge, a, &d.z);

  //int debugwarning2;
  //memoryPool_write_ge_asOutput(&a_ge, - 1, memoryPool);


  prej[0].x = a_ge.x;
  prej[0].y = a_ge.y;
  prej[0].z = a->z;
  prej[0].infinity = 0;

  zr[0] = d.z;



  for (i = 1; i < n; i ++) {
    secp256k1_gej_copy__from__global(&globalToLocal2, &prej[i - 1]);
    //if (i == 7) {
    //  int debugwarning;
    //  //memoryPool_write_gej_asOutput(&globalToLocal2, - 1, memoryPool);
    //}
    secp256k1_fe_copy__from__global(&globalToLocalFE1, &zr[i]);
    secp256k1_gej_add_ge_var(&globalToLocal1, &globalToLocal2, &d_ge, &globalToLocalFE1);
    //<- warning: secp256k1_gej_add_ge_var modifies its last argument.
    //Failure to carry out the next command resulted in a bug.
    secp256k1_fe_copy__to__global(&zr[i], &globalToLocalFE1);
    secp256k1_gej_copy__to__global(&prej[i], &globalToLocal1);
  }

  /*
   * Each point in 'prej' has a z coordinate too small by a factor of 'd.z'. Only
   * the final point's z coordinate is actually used though, so just update that.
   */
  secp256k1_fe_copy__from__global(&globalToLocalFE2, &prej[n-1].z);
  secp256k1_fe_mul(&globalToLocalFE1, &globalToLocalFE2, &d.z);
  secp256k1_fe_copy__to__global(&prej[n-1].z, &globalToLocalFE1);
}

/** Fill a table 'pre' with precomputed odd multiples of a.
 *
 *  There are two versions of this function:
 *  - secp256k1_ecmult_odd_multiples_table_globalz_windowa which brings its
 *    resulting point set to a single constant Z denominator, stores the X and Y
 *    coordinates as ge_storage points in pre, and stores the global Z in rz.
 *    It only operates on tables sized for WINDOW_A wnaf multiples.
 *  - secp256k1_ecmult_odd_multiples_table_storage_var, which converts its
 *    resulting point set to actual affine points, and stores those in pre.
 *    It operates on tables of any size, but uses heap-allocated temporaries.
 *
 *  To compute a*P + b*G, we compute a table for P using the first function,
 *  and for G using the second (which requires an inverse, but it only needs to
 *  happen once).
 */
static void secp256k1_ecmult_odd_multiples_table_globalz_windowa(
  secp256k1_ge *pre,
  secp256k1_fe *globalz,
  const secp256k1_gej *a,
  __global unsigned char* memoryPool
  ) {
  __global secp256k1_gej* prej = (__global secp256k1_gej*) checked_malloc(sizeof_secp256k1_gej() * ECMULT_TABLE_SIZE(WINDOW_A), memoryPool);
  __global secp256k1_fe* zr =    (__global secp256k1_fe* ) checked_malloc(sizeof_secp256k1_fe()  * ECMULT_TABLE_SIZE(WINDOW_A), memoryPool);

  /* Compute the odd multiples in Jacobian form. */
  secp256k1_ecmult_odd_multiples_table(ECMULT_TABLE_SIZE(WINDOW_A), prej, zr, a/*, memoryPool*/);
  /* Bring them to the same Z denominator. */
  secp256k1_ge_globalz_set_table_gej(ECMULT_TABLE_SIZE(WINDOW_A), pre, globalz, prej, zr);
}

static void secp256k1_ecmult_odd_multiples_table_storage_var(
  int n,
  __global secp256k1_ge_storage *pre,
  const secp256k1_gej *a,
  __global unsigned char* memoryPool
) {
  __global secp256k1_gej* prej = (__global secp256k1_gej*) checked_malloc(sizeof_secp256k1_gej() * n, memoryPool);
  __global secp256k1_ge* prea  = (__global secp256k1_ge*)  checked_malloc(sizeof_secp256k1_ge()  * n, memoryPool);
  __global secp256k1_fe* zr    = (__global secp256k1_fe*)  checked_malloc(sizeof_secp256k1_fe()  * n, memoryPool);

  int i;

  secp256k1_ge globalToLocalGE;

  /* Compute the odd multiples in Jacobian form. */
  secp256k1_ecmult_odd_multiples_table(n, prej, zr, a/*, memoryPool*/);
  //int debugWarningBadOutput12;
  //return;

  /* Convert them in batch to affine coordinates. */
  secp256k1_ge_set_table_gej_var(n, prea, prej, zr);
  /* Convert them to compact storage form. */

  for (i = 0; i < n; i ++) {
    secp256k1_ge_copy__from__global(&globalToLocalGE, &prea[i]);
    secp256k1_ge_to__global__storage(&pre[i], &globalToLocalGE);
  }
  memoryPool_freeMemory__global(prea);
  memoryPool_freeMemory__global(prej);
  memoryPool_freeMemory__global(zr);
}

/** Convert a number to WNAF notation. The number becomes represented by sum(2^i * wnaf[i], i=0..bits),
 *  with the following guarantees:
 *  - each wnaf[i] is either 0, or an odd integer between -(1<<(w-1) - 1) and (1<<(w-1) - 1)
 *  - two non-zero entries in wnaf are separated by at least w-1 zeroes.
 *  - the number of set values in wnaf is returned. This number is at most 256, and at most one more
 *    than the number of bits in the (absolute value) of the input.
 */
static int secp256k1_ecmult_wnaf(int *wnaf, int len, const secp256k1_scalar *a, int w) {
  secp256k1_scalar s = *a;
  int last_set_bit = -1;
  int bit = 0;
  int sign = 1;
  int carry = 0;

#ifdef VERIFY
  VERIFY_CHECK(wnaf != NULL);
  VERIFY_CHECK(0 <= len && len <= 256);
  VERIFY_CHECK(a != NULL);
  VERIFY_CHECK(2 <= w && w <= 31);
#endif

  int i;
  for (i = 0; i < len; i ++){
    wnaf[i] = 0;
  }
  memorySet((unsigned char*) wnaf, 0, len * sizeof_int());
  if (secp256k1_scalar_get_bits(&s, 255, 1)) {
    secp256k1_scalar_negate(&s, &s);
    sign = - 1;
  }

  while (bit < len) {
    int now;
    int word;
    if (secp256k1_scalar_get_bits(&s, bit, 1) == (unsigned int)carry) {
      bit ++;
      continue;
    }

    now = w;
    if (now > len - bit) {
      now = len - bit;
    }

    word = secp256k1_scalar_get_bits_var(&s, bit, now) + carry;

    carry = (word >> (w - 1)) & 1;
    word -= carry << w;

    wnaf[bit] = sign * word;
    last_set_bit = bit;

    bit += now;
  }
#ifdef VERIFY
  CHECK(carry == 0);
  while (bit < 256) {
    CHECK(secp256k1_scalar_get_bits(&s, bit ++, 1) == 0);
  }
#endif
  return last_set_bit + 1;
}

void secp256k1_ecmult(
  __global const secp256k1_ecmult_context *multiplicationContext,
  secp256k1_gej *r,
  const secp256k1_gej *a,
  const secp256k1_scalar *na,
  const secp256k1_scalar *ng,
  __global unsigned char* memoryPool
) {
  secp256k1_ge pre_a[ECMULT_TABLE_SIZE(WINDOW_A)];
  secp256k1_ge tmpa;
  secp256k1_fe Z;
  int wnaf_na[256];
  int bits_na;
  int wnaf_ng[256];
  int bits_ng;
  int i;
  int bits;

  /* build wnaf representation for na. */
  bits_na = secp256k1_ecmult_wnaf(wnaf_na, 256, na, WINDOW_A);
  bits = bits_na;

  /* Calculate odd multiples of a.
   * All multiples are brought to the same Z 'denominator', which is stored
   * in Z. Due to secp256k1' isomorphism we can do all operations pretending
   * that the Z coordinate was 1, use affine addition formulae, and correct
   * the Z coordinate of the result once at the end.
   * The exception is the precomputed G table points, which are actually
   * affine. Compared to the base used for other points, they have a Z ratio
   * of 1/Z, so we can use secp256k1_gej_add_zinv_var, which uses the same
   * isomorphism to efficiently add with a known Z inverse.
   */
  secp256k1_ecmult_odd_multiples_table_globalz_windowa(pre_a, &Z, a, memoryPool);


  bits_ng = secp256k1_ecmult_wnaf(wnaf_ng, 256, ng, WINDOW_G);
  if (bits_ng > bits) {
    bits = bits_ng;
  }

  secp256k1_gej_set_infinity(r);

  for (i = bits - 1; i >= 0; i --) {
    int n;
    secp256k1_gej_double_var(r, r, NULL);
    if (i < bits_na && (n = wnaf_na[i])) {
      ECMULT_TABLE_GET_GE(&tmpa, pre_a, n, WINDOW_A);
      secp256k1_gej_add_ge_var(r, r, &tmpa, NULL);
    }
    if (i < bits_ng && (n = wnaf_ng[i])) {
      ECMULT_TABLE_GET_GE_STORAGE(&tmpa, *multiplicationContext->pre_g, n, WINDOW_G);
      secp256k1_gej_add_zinv_var(r, r, &tmpa, &Z);
    }
  }

  if (!r->infinity) {
    secp256k1_fe_mul(&r->z, &r->z, &Z);
  }
}

//static void secp256k1_ecmult_context_clone(
//  secp256k1_ecmult_context *dst,
//  const secp256k1_ecmult_context *src,
//  const secp256k1_callback *cb
//) {
//  if (src->pre_g == NULL) {
//    dst->pre_g = NULL;
//  } else {
//    size_t size = sizeof((*dst->pre_g)[0]) * ECMULT_TABLE_SIZE(WINDOW_G);
//    dst->pre_g = (secp256k1_ge_storage (*)[])checked_malloc(cb, size);
//    memcpy(dst->pre_g, src->pre_g, size);
//  }
//}

int secp256k1_ecmult_context_is_built(const secp256k1_ecmult_context *ctx) {
  return ctx->pre_g != NULL;
}

//******end of ecmult_impl.h******


//******From ecmult_const.h******
void secp256k1_ecmult_const(
  secp256k1_gej *r,
  const secp256k1_ge *a,
  const secp256k1_scalar *q,
  __global unsigned char* memoryPool
);
//******end of ecmult_const.h******


//******From ecmult_const_impl.h******
#ifdef USE_ENDOMORPHISM
    #define WNAF_BITS 128
#else
    #define WNAF_BITS 256
#endif
#define WNAF_SIZE(w) ((WNAF_BITS + (w) - 1) / (w))

/* This is like `ECMULT_TABLE_GET_GE` but is constant time */
#define ECMULT_CONST_TABLE_GET_GE(r,pre,n,w) do { \
    int m; \
    int abs_n = (n) * (((n) > 0) * 2 - 1); \
    int idx_n = abs_n / 2; \
    secp256k1_fe neg_y; \
    /*VERIFY_CHECK(((n) & 1) == 1);*/ \
    /*VERIFY_CHECK((n) >= -((1 << ((w)-1)) - 1));*/ \
    /*VERIFY_CHECK((n) <=  ((1 << ((w)-1)) - 1));*/ \
    /*VERIFY_SETUP(secp256k1_fe_clear(&(r)->x));*/ \
    /*VERIFY_SETUP(secp256k1_fe_clear(&(r)->y));*/ \
    for (m = 0; m < ECMULT_TABLE_SIZE(w); m++) { \
        /* This loop is used to avoid secret data in array indices. See
         * the comment in ecmult_gen_impl.h for rationale. */ \
        secp256k1_fe_cmov(&(r)->x, &(pre)[m].x, m == idx_n); \
        secp256k1_fe_cmov(&(r)->y, &(pre)[m].y, m == idx_n); \
    } \
    (r)->infinity = 0; \
    secp256k1_fe_negate(&neg_y, &(r)->y, 1); \
    secp256k1_fe_cmov(&(r)->y, &neg_y, (n) != abs_n); \
} while(0)


/** Convert a number to WNAF notation. The number becomes represented by sum(2^{wi} * wnaf[i], i=0..return_val)
 *  with the following guarantees:
 *  - each wnaf[i] an odd integer between -(1 << w) and (1 << w)
 *  - each wnaf[i] is nonzero
 *  - the number of words set is returned; this is always (WNAF_BITS + w - 1) / w
 *
 *  Adapted from `The Width-w NAF Method Provides Small Memory and Fast Elliptic Scalar
 *  Multiplications Secure against Side Channel Attacks`, Okeya and Tagaki. M. Joye (Ed.)
 *  CT-RSA 2003, LNCS 2612, pp. 328-443, 2003. Springer-Verlag Berlin Heidelberg 2003
 *
 *  Numbers reference steps of `Algorithm SPA-resistant Width-w NAF with Odd Scalar` on pp. 335
 */
static int secp256k1_wnaf_const(int *wnaf, secp256k1_scalar s, int w) {
    int global_sign;
    int skew = 0;
    int word = 0;
    /* 1 2 3 */
    int u_last;
    int u;

#ifdef USE_ENDOMORPHISM
    int flip;
    int bit;
    secp256k1_scalar neg_s;
    int not_neg_one;
    /* If we are using the endomorphism, we cannot handle even numbers by negating
     * them, since we are working with 128-bit numbers whose negations would be 256
     * bits, eliminating the performance advantage. Instead we use a technique from
     * Section 4.2 of the Okeya/Tagaki paper, which is to add either 1 (for even)
     * or 2 (for odd) to the number we are encoding, then compensating after the
     * multiplication. */
    /* Negative 128-bit numbers will be negated, since otherwise they are 256-bit */
    flip = secp256k1_scalar_is_high(&s);
    /* We add 1 to even numbers, 2 to odd ones, noting that negation flips parity */
    bit = flip ^ (s.d[0] & 1);
    /* We check for negative one, since adding 2 to it will cause an overflow */
    secp256k1_scalar_negate(&neg_s, &s);
    not_neg_one = !secp256k1_scalar_is_one(&neg_s);
    secp256k1_scalar_cadd_bit(&s, bit, not_neg_one);
    /* If we had negative one, flip == 1, s.d[0] == 0, bit == 1, so caller expects
     * that we added two to it and flipped it. In fact for -1 these operations are
     * identical. We only flipped, but since skewing is required (in the sense that
     * the skew must be 1 or 2, never zero) and flipping is not, we need to change
     * our flags to claim that we only skewed. */
    global_sign = secp256k1_scalar_cond_negate(&s, flip);
    global_sign *= not_neg_one * 2 - 1;
    skew = 1 << bit;
#else
    /* Otherwise, we just negate to force oddness */
    int is_even = secp256k1_scalar_is_even(&s);
    global_sign = secp256k1_scalar_cond_negate(&s, is_even);
#endif

    /* 4 */
    u_last = secp256k1_scalar_shr_int(&s, w);
    while (word * w < WNAF_BITS) {
        int sign;
        int even;

        /* 4.1 4.4 */
        u = secp256k1_scalar_shr_int(&s, w);
        /* 4.2 */
        even = ((u & 1) == 0);
        sign = 2 * (u_last > 0) - 1;
        u += sign * even;
        u_last -= sign * even * (1 << w);

        /* 4.3, adapted for global sign change */
        wnaf[word++] = u_last * global_sign;

        u_last = u;
    }
    wnaf[word] = u * global_sign;

#ifdef VERIFY
    VERIFY_CHECK(secp256k1_scalar_is_zero(&s));
    VERIFY_CHECK(word == WNAF_SIZE(w));
#endif
    return skew;
}


void secp256k1_ecmult_const(
  secp256k1_gej *r,
  const secp256k1_ge *a,
  const secp256k1_scalar *scalar,
  __global unsigned char* memoryPool
) {
    secp256k1_ge pre_a[ECMULT_TABLE_SIZE(WINDOW_A)];
    secp256k1_ge tmpa;
    secp256k1_fe Z;

#ifdef USE_ENDOMORPHISM
    secp256k1_ge pre_a_lam[ECMULT_TABLE_SIZE(WINDOW_A)];
    int wnaf_1[1 + WNAF_SIZE(WINDOW_A - 1)];
    int wnaf_lam[1 + WNAF_SIZE(WINDOW_A - 1)];
    int skew_1;
    int skew_lam;
    secp256k1_scalar q_1, q_lam;
#else
    int wnaf[1 + WNAF_SIZE(WINDOW_A - 1)];
#endif

    int i;
    secp256k1_scalar sc = *scalar;

    /* build wnaf representation for q. */
#ifdef USE_ENDOMORPHISM
    /* split q into q_1 and q_lam (where q = q_1 + q_lam*lambda, and q_1 and q_lam are ~128 bit) */
    secp256k1_scalar_split_lambda(&q_1, &q_lam, &sc);
    /* no need for zero correction when using endomorphism since even
     * numbers have one added to them anyway */
    skew_1   = secp256k1_wnaf_const(wnaf_1,   q_1,   WINDOW_A - 1);
    skew_lam = secp256k1_wnaf_const(wnaf_lam, q_lam, WINDOW_A - 1);
#else
    int is_zero = secp256k1_scalar_is_zero(scalar);
    /* the wNAF ladder cannot handle zero, so bump this to one .. we will
     * correct the result after the fact */
    sc.d[0] += is_zero;
#ifdef VERIFY
    VERIFY_CHECK(!secp256k1_scalar_is_zero(&sc));
#endif
    secp256k1_wnaf_const(wnaf, sc, WINDOW_A - 1);
#endif

    /* Calculate odd multiples of a.
     * All multiples are brought to the same Z 'denominator', which is stored
     * in Z. Due to secp256k1' isomorphism we can do all operations pretending
     * that the Z coordinate was 1, use affine addition formulae, and correct
     * the Z coordinate of the result once at the end.
     */
    secp256k1_gej_set_ge(r, a);
    secp256k1_ecmult_odd_multiples_table_globalz_windowa(
      pre_a, &Z, r, memoryPool
    );
    for (i = 0; i < ECMULT_TABLE_SIZE(WINDOW_A); i++) {
        secp256k1_fe_normalize_weak(&pre_a[i].y);
    }
#ifdef USE_ENDOMORPHISM
    for (i = 0; i < ECMULT_TABLE_SIZE(WINDOW_A); i++) {
        secp256k1_ge_mul_lambda(&pre_a_lam[i], &pre_a[i]);
    }
#endif

    /* first loop iteration (separated out so we can directly set r, rather
     * than having it start at infinity, get doubled several times, then have
     * its new value added to it) */
#ifdef USE_ENDOMORPHISM
    i = wnaf_1[WNAF_SIZE(WINDOW_A - 1)];
    VERIFY_CHECK(i != 0);
    ECMULT_CONST_TABLE_GET_GE(&tmpa, pre_a, i, WINDOW_A);
    secp256k1_gej_set_ge(r, &tmpa);

    i = wnaf_lam[WNAF_SIZE(WINDOW_A - 1)];
    VERIFY_CHECK(i != 0);
    ECMULT_CONST_TABLE_GET_GE(&tmpa, pre_a_lam, i, WINDOW_A);
    secp256k1_gej_add_ge(r, r, &tmpa);
#else
    i = wnaf[WNAF_SIZE(WINDOW_A - 1)];
#ifdef VERIFY
    VERIFY_CHECK(i != 0);
#endif
    ECMULT_CONST_TABLE_GET_GE(&tmpa, pre_a, i, WINDOW_A);
    secp256k1_gej_set_ge(r, &tmpa);
#endif
    /* remaining loop iterations */
    for (i = WNAF_SIZE(WINDOW_A - 1) - 1; i >= 0; i--) {
        int n;
        int j;
        for (j = 0; j < WINDOW_A - 1; ++j) {
            secp256k1_gej_double_nonzero(r, r, NULL);
        }
#ifdef USE_ENDOMORPHISM
        n = wnaf_1[i];
        ECMULT_CONST_TABLE_GET_GE(&tmpa, pre_a, n, WINDOW_A);
        VERIFY_CHECK(n != 0);
        secp256k1_gej_add_ge(r, r, &tmpa);

        n = wnaf_lam[i];
        ECMULT_CONST_TABLE_GET_GE(&tmpa, pre_a_lam, n, WINDOW_A);
        VERIFY_CHECK(n != 0);
        secp256k1_gej_add_ge(r, r, &tmpa);
#else
        n = wnaf[i];
#ifdef VERIFY
        VERIFY_CHECK(n != 0);
#endif
        ECMULT_CONST_TABLE_GET_GE(&tmpa, pre_a, n, WINDOW_A);
        secp256k1_gej_add_ge(r, r, &tmpa);
#endif
    }

    secp256k1_fe_mul(&r->z, &r->z, &Z);

#ifdef USE_ENDOMORPHISM
    {
        /* Correct for wNAF skew */
        secp256k1_ge correction = *a;
        secp256k1_ge_storage correction_1_stor;
        secp256k1_ge_storage correction_lam_stor;
        secp256k1_ge_storage a2_stor;
        secp256k1_gej tmpj;
        secp256k1_gej_set_ge(&tmpj, &correction);
        secp256k1_gej_double_var(&tmpj, &tmpj, NULL);
        secp256k1_ge_set_gej(&correction, &tmpj);
        secp256k1_ge_to_storage(&correction_1_stor, a);
        secp256k1_ge_to_storage(&correction_lam_stor, a);
        secp256k1_ge_to_storage(&a2_stor, &correction);

        /* For odd numbers this is 2a (so replace it), for even ones a (so no-op) */
        secp256k1_ge_storage_cmov(&correction_1_stor, &a2_stor, skew_1 == 2);
        secp256k1_ge_storage_cmov(&correction_lam_stor, &a2_stor, skew_lam == 2);

        /* Apply the correction */
        secp256k1_ge_from_storage(&correction, &correction_1_stor);
        secp256k1_ge_neg(&correction, &correction);
        secp256k1_gej_add_ge(r, r, &correction);

        secp256k1_ge_from_storage(&correction, &correction_lam_stor);
        secp256k1_ge_neg(&correction, &correction);
        secp256k1_ge_mul_lambda(&correction, &correction);
        secp256k1_gej_add_ge(r, r, &correction);
    }
#else
    /* correct for zero */
    r->infinity |= is_zero;
#endif
}
//******end of ecmult_const_impl.h******


//******From hash.h******
typedef struct {
    uint32_t s[32];
    uint32_t buf[16]; /* In big endian */
    size_t bytes;
} secp256k1_sha256_t;

static void secp256k1_sha256_initialize(secp256k1_sha256_t *hash);
static void secp256k1_sha256_write(secp256k1_sha256_t *hash, const unsigned char *data, size_t size);
static void secp256k1_sha256_finalize(secp256k1_sha256_t *hash, unsigned char *out32);

typedef struct {
    secp256k1_sha256_t inner, outer;
} secp256k1_hmac_sha256_t;

static void secp256k1_hmac_sha256_initialize(secp256k1_hmac_sha256_t *hash, const unsigned char *key, size_t size);
static void secp256k1_hmac_sha256_write(secp256k1_hmac_sha256_t *hash, const unsigned char *data, size_t size);
static void secp256k1_hmac_sha256_finalize(secp256k1_hmac_sha256_t *hash, unsigned char *out32);

typedef struct {
    unsigned char v[32];
    unsigned char k[32];
    int retry;
} secp256k1_rfc6979_hmac_sha256_t;

static void secp256k1_rfc6979_hmac_sha256_initialize(secp256k1_rfc6979_hmac_sha256_t *rng, const unsigned char *key, size_t keylen);
static void secp256k1_rfc6979_hmac_sha256_generate(secp256k1_rfc6979_hmac_sha256_t *rng, unsigned char *out, size_t outlen);
static void secp256k1_rfc6979_hmac_sha256_finalize(secp256k1_rfc6979_hmac_sha256_t *rng);
//******end of hash.h******


//******From hash_impl.h******
#define Ch(x,y,z) ((z) ^ ((x) & ((y) ^ (z))))
#define Maj(x,y,z) (((x) & (y)) | ((z) & ((x) | (y))))
#define Sigma0(x) (((x) >> 2 | (x) << 30) ^ ((x) >> 13 | (x) << 19) ^ ((x) >> 22 | (x) << 10))
#define Sigma1(x) (((x) >> 6 | (x) << 26) ^ ((x) >> 11 | (x) << 21) ^ ((x) >> 25 | (x) << 7))
#define sigma0(x) (((x) >> 7 | (x) << 25) ^ ((x) >> 18 | (x) << 14) ^ ((x) >> 3))
#define sigma1(x) (((x) >> 17 | (x) << 15) ^ ((x) >> 19 | (x) << 13) ^ ((x) >> 10))

#define Round(a,b,c,d,e,f,g,h,k,w) do { \
    uint32_t t1 = (h) + Sigma1(e) + Ch((e), (f), (g)) + (k) + (w); \
    uint32_t t2 = Sigma0(a) + Maj((a), (b), (c)); \
    (d) += t1; \
    (h) = t1 + t2; \
} while(0)

#ifdef WORDS_BIGENDIAN
#define BE32(x) (x)
#else
#define BE32(p) ((((p) & 0xFF) << 24) | (((p) & 0xFF00) << 8) | (((p) & 0xFF0000) >> 8) | (((p) & 0xFF000000) >> 24))
#endif

static void secp256k1_sha256_initialize(secp256k1_sha256_t *hash) {
    hash->s[0] = 0x6a09e667ul;
    hash->s[1] = 0xbb67ae85ul;
    hash->s[2] = 0x3c6ef372ul;
    hash->s[3] = 0xa54ff53aul;
    hash->s[4] = 0x510e527ful;
    hash->s[5] = 0x9b05688cul;
    hash->s[6] = 0x1f83d9abul;
    hash->s[7] = 0x5be0cd19ul;
    hash->bytes = 0;
}

/** Perform one SHA-256 transformation, processing 16 big endian 32-bit words. */
static void secp256k1_sha256_transform(uint32_t* s, const uint32_t* chunk) {
    uint32_t a = s[0], b = s[1], c = s[2], d = s[3], e = s[4], f = s[5], g = s[6], h = s[7];
    uint32_t w0, w1, w2, w3, w4, w5, w6, w7, w8, w9, w10, w11, w12, w13, w14, w15;

    Round(a, b, c, d, e, f, g, h, 0x428a2f98, w0 = BE32(chunk[0]));
    Round(h, a, b, c, d, e, f, g, 0x71374491, w1 = BE32(chunk[1]));
    Round(g, h, a, b, c, d, e, f, 0xb5c0fbcf, w2 = BE32(chunk[2]));
    Round(f, g, h, a, b, c, d, e, 0xe9b5dba5, w3 = BE32(chunk[3]));
    Round(e, f, g, h, a, b, c, d, 0x3956c25b, w4 = BE32(chunk[4]));
    Round(d, e, f, g, h, a, b, c, 0x59f111f1, w5 = BE32(chunk[5]));
    Round(c, d, e, f, g, h, a, b, 0x923f82a4, w6 = BE32(chunk[6]));
    Round(b, c, d, e, f, g, h, a, 0xab1c5ed5, w7 = BE32(chunk[7]));
    Round(a, b, c, d, e, f, g, h, 0xd807aa98, w8 = BE32(chunk[8]));
    Round(h, a, b, c, d, e, f, g, 0x12835b01, w9 = BE32(chunk[9]));
    Round(g, h, a, b, c, d, e, f, 0x243185be, w10 = BE32(chunk[10]));
    Round(f, g, h, a, b, c, d, e, 0x550c7dc3, w11 = BE32(chunk[11]));
    Round(e, f, g, h, a, b, c, d, 0x72be5d74, w12 = BE32(chunk[12]));
    Round(d, e, f, g, h, a, b, c, 0x80deb1fe, w13 = BE32(chunk[13]));
    Round(c, d, e, f, g, h, a, b, 0x9bdc06a7, w14 = BE32(chunk[14]));
    Round(b, c, d, e, f, g, h, a, 0xc19bf174, w15 = BE32(chunk[15]));

    Round(a, b, c, d, e, f, g, h, 0xe49b69c1, w0 += sigma1(w14) + w9 + sigma0(w1));
    Round(h, a, b, c, d, e, f, g, 0xefbe4786, w1 += sigma1(w15) + w10 + sigma0(w2));
    Round(g, h, a, b, c, d, e, f, 0x0fc19dc6, w2 += sigma1(w0) + w11 + sigma0(w3));
    Round(f, g, h, a, b, c, d, e, 0x240ca1cc, w3 += sigma1(w1) + w12 + sigma0(w4));
    Round(e, f, g, h, a, b, c, d, 0x2de92c6f, w4 += sigma1(w2) + w13 + sigma0(w5));
    Round(d, e, f, g, h, a, b, c, 0x4a7484aa, w5 += sigma1(w3) + w14 + sigma0(w6));
    Round(c, d, e, f, g, h, a, b, 0x5cb0a9dc, w6 += sigma1(w4) + w15 + sigma0(w7));
    Round(b, c, d, e, f, g, h, a, 0x76f988da, w7 += sigma1(w5) + w0 + sigma0(w8));
    Round(a, b, c, d, e, f, g, h, 0x983e5152, w8 += sigma1(w6) + w1 + sigma0(w9));
    Round(h, a, b, c, d, e, f, g, 0xa831c66d, w9 += sigma1(w7) + w2 + sigma0(w10));
    Round(g, h, a, b, c, d, e, f, 0xb00327c8, w10 += sigma1(w8) + w3 + sigma0(w11));
    Round(f, g, h, a, b, c, d, e, 0xbf597fc7, w11 += sigma1(w9) + w4 + sigma0(w12));
    Round(e, f, g, h, a, b, c, d, 0xc6e00bf3, w12 += sigma1(w10) + w5 + sigma0(w13));
    Round(d, e, f, g, h, a, b, c, 0xd5a79147, w13 += sigma1(w11) + w6 + sigma0(w14));
    Round(c, d, e, f, g, h, a, b, 0x06ca6351, w14 += sigma1(w12) + w7 + sigma0(w15));
    Round(b, c, d, e, f, g, h, a, 0x14292967, w15 += sigma1(w13) + w8 + sigma0(w0));

    Round(a, b, c, d, e, f, g, h, 0x27b70a85, w0 += sigma1(w14) + w9 + sigma0(w1));
    Round(h, a, b, c, d, e, f, g, 0x2e1b2138, w1 += sigma1(w15) + w10 + sigma0(w2));
    Round(g, h, a, b, c, d, e, f, 0x4d2c6dfc, w2 += sigma1(w0) + w11 + sigma0(w3));
    Round(f, g, h, a, b, c, d, e, 0x53380d13, w3 += sigma1(w1) + w12 + sigma0(w4));
    Round(e, f, g, h, a, b, c, d, 0x650a7354, w4 += sigma1(w2) + w13 + sigma0(w5));
    Round(d, e, f, g, h, a, b, c, 0x766a0abb, w5 += sigma1(w3) + w14 + sigma0(w6));
    Round(c, d, e, f, g, h, a, b, 0x81c2c92e, w6 += sigma1(w4) + w15 + sigma0(w7));
    Round(b, c, d, e, f, g, h, a, 0x92722c85, w7 += sigma1(w5) + w0 + sigma0(w8));
    Round(a, b, c, d, e, f, g, h, 0xa2bfe8a1, w8 += sigma1(w6) + w1 + sigma0(w9));
    Round(h, a, b, c, d, e, f, g, 0xa81a664b, w9 += sigma1(w7) + w2 + sigma0(w10));
    Round(g, h, a, b, c, d, e, f, 0xc24b8b70, w10 += sigma1(w8) + w3 + sigma0(w11));
    Round(f, g, h, a, b, c, d, e, 0xc76c51a3, w11 += sigma1(w9) + w4 + sigma0(w12));
    Round(e, f, g, h, a, b, c, d, 0xd192e819, w12 += sigma1(w10) + w5 + sigma0(w13));
    Round(d, e, f, g, h, a, b, c, 0xd6990624, w13 += sigma1(w11) + w6 + sigma0(w14));
    Round(c, d, e, f, g, h, a, b, 0xf40e3585, w14 += sigma1(w12) + w7 + sigma0(w15));
    Round(b, c, d, e, f, g, h, a, 0x106aa070, w15 += sigma1(w13) + w8 + sigma0(w0));

    Round(a, b, c, d, e, f, g, h, 0x19a4c116, w0 += sigma1(w14) + w9 + sigma0(w1));
    Round(h, a, b, c, d, e, f, g, 0x1e376c08, w1 += sigma1(w15) + w10 + sigma0(w2));
    Round(g, h, a, b, c, d, e, f, 0x2748774c, w2 += sigma1(w0) + w11 + sigma0(w3));
    Round(f, g, h, a, b, c, d, e, 0x34b0bcb5, w3 += sigma1(w1) + w12 + sigma0(w4));
    Round(e, f, g, h, a, b, c, d, 0x391c0cb3, w4 += sigma1(w2) + w13 + sigma0(w5));
    Round(d, e, f, g, h, a, b, c, 0x4ed8aa4a, w5 += sigma1(w3) + w14 + sigma0(w6));
    Round(c, d, e, f, g, h, a, b, 0x5b9cca4f, w6 += sigma1(w4) + w15 + sigma0(w7));
    Round(b, c, d, e, f, g, h, a, 0x682e6ff3, w7 += sigma1(w5) + w0 + sigma0(w8));
    Round(a, b, c, d, e, f, g, h, 0x748f82ee, w8 += sigma1(w6) + w1 + sigma0(w9));
    Round(h, a, b, c, d, e, f, g, 0x78a5636f, w9 += sigma1(w7) + w2 + sigma0(w10));
    Round(g, h, a, b, c, d, e, f, 0x84c87814, w10 += sigma1(w8) + w3 + sigma0(w11));
    Round(f, g, h, a, b, c, d, e, 0x8cc70208, w11 += sigma1(w9) + w4 + sigma0(w12));
    Round(e, f, g, h, a, b, c, d, 0x90befffa, w12 += sigma1(w10) + w5 + sigma0(w13));
    Round(d, e, f, g, h, a, b, c, 0xa4506ceb, w13 += sigma1(w11) + w6 + sigma0(w14));
    Round(c, d, e, f, g, h, a, b, 0xbef9a3f7, w14 + sigma1(w12) + w7 + sigma0(w15));
    Round(b, c, d, e, f, g, h, a, 0xc67178f2, w15 + sigma1(w13) + w8 + sigma0(w0));

    s[0] += a;
    s[1] += b;
    s[2] += c;
    s[3] += d;
    s[4] += e;
    s[5] += f;
    s[6] += g;
    s[7] += h;
}

static void secp256k1_sha256_write(secp256k1_sha256_t *hash, const unsigned char *data, size_t len) {
  size_t bufsize = hash->bytes & 0x3F;
  hash->bytes += len;
  int numBytesToCopy;
  while (bufsize + len >= 64) {
    /* Fill the buffer, and process it. */
    numBytesToCopy = 64 - bufsize;
    memoryCopy(((unsigned char*)hash->buf) + bufsize, data, 64 - bufsize);
    data += numBytesToCopy;
    len -= numBytesToCopy;
    secp256k1_sha256_transform(hash->s, hash->buf);
    bufsize = 0;
  }
  if (len) {
    /* Fill the buffer with what remains. */
    memoryCopy(((unsigned char*)hash->buf) + bufsize, data, len);
  }
}

static void secp256k1_sha256_finalize(secp256k1_sha256_t *hash, unsigned char *out32) {
  //Please note: the static keyword breaks the openCL 1.0 build.
  //static
  const unsigned char pad[64] = {0x80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
  uint32_t sizedesc[2];
  uint32_t out[8];
  int i = 0;
  sizedesc[0] = BE32(hash->bytes >> 29);
  sizedesc[1] = BE32(hash->bytes << 3);
  secp256k1_sha256_write(hash, pad, 1 + ((119 - (hash->bytes % 64)) % 64));
  secp256k1_sha256_write(hash, (const unsigned char*)sizedesc, 8);
  for (i = 0; i < 8; i++) {
    out[i] = BE32(hash->s[i]);
    hash->s[i] = 0;
  }
  memoryCopy(out32, (const unsigned char*)out, 32);
}

static void secp256k1_hmac_sha256_initialize(secp256k1_hmac_sha256_t *hash, const unsigned char *key, size_t keylen) {
    int n;
    unsigned char rkey[64];
    if (keylen <= 64) {
        memoryCopy(rkey, key, keylen);
        memorySet(rkey + keylen, 0, 64 - keylen);
    } else {
        secp256k1_sha256_t sha256;
        secp256k1_sha256_initialize(&sha256);
        secp256k1_sha256_write(&sha256, key, keylen);
        secp256k1_sha256_finalize(&sha256, rkey);
        memorySet(rkey + 32, 0, 32);
    }

    secp256k1_sha256_initialize(&hash->outer);
    for (n = 0; n < 64; n++) {
        rkey[n] ^= 0x5c;
    }
    secp256k1_sha256_write(&hash->outer, rkey, 64);

    secp256k1_sha256_initialize(&hash->inner);
    for (n = 0; n < 64; n++) {
        rkey[n] ^= 0x5c ^ 0x36;
    }
    secp256k1_sha256_write(&hash->inner, rkey, 64);
    memorySet(rkey, 0, 64);
}

static void secp256k1_hmac_sha256_write(secp256k1_hmac_sha256_t *hash, const unsigned char *data, size_t size) {
    secp256k1_sha256_write(&hash->inner, data, size);
}

static void secp256k1_hmac_sha256_finalize(secp256k1_hmac_sha256_t *hash, unsigned char *out32) {
  unsigned char temp[32];
  secp256k1_sha256_finalize(&hash->inner, temp);
  secp256k1_sha256_write(&hash->outer, temp, 32);
  memorySet(temp, 0, 32);
  secp256k1_sha256_finalize(&hash->outer, out32);
}


static void secp256k1_rfc6979_hmac_sha256_initialize(secp256k1_rfc6979_hmac_sha256_t *rng, const unsigned char *key, size_t keylen) {
  secp256k1_hmac_sha256_t hmac;
  //Please note: the static keyword breaks the openCL 1.0 build.
  //static
  const unsigned char zero[1] = {0x00};
  const unsigned char one[1] = {0x01};

  memorySet(rng->v, 0x01, 32); /* RFC6979 3.2.b. */
  memorySet(rng->k, 0x00, 32); /* RFC6979 3.2.c. */

  /* RFC6979 3.2.d. */
  secp256k1_hmac_sha256_initialize(&hmac, rng->k, 32);
  secp256k1_hmac_sha256_write(&hmac, rng->v, 32);
  secp256k1_hmac_sha256_write(&hmac, zero, 1);
  secp256k1_hmac_sha256_write(&hmac, key, keylen);
  secp256k1_hmac_sha256_finalize(&hmac, rng->k);
  secp256k1_hmac_sha256_initialize(&hmac, rng->k, 32);
  secp256k1_hmac_sha256_write(&hmac, rng->v, 32);
  secp256k1_hmac_sha256_finalize(&hmac, rng->v);

  /* RFC6979 3.2.f. */
  secp256k1_hmac_sha256_initialize(&hmac, rng->k, 32);
  secp256k1_hmac_sha256_write(&hmac, rng->v, 32);
  secp256k1_hmac_sha256_write(&hmac, one, 1);
  secp256k1_hmac_sha256_write(&hmac, key, keylen);
  secp256k1_hmac_sha256_finalize(&hmac, rng->k);
  secp256k1_hmac_sha256_initialize(&hmac, rng->k, 32);
  secp256k1_hmac_sha256_write(&hmac, rng->v, 32);
  secp256k1_hmac_sha256_finalize(&hmac, rng->v);
  rng->retry = 0;
}

static void secp256k1_rfc6979_hmac_sha256_generate(secp256k1_rfc6979_hmac_sha256_t *rng, unsigned char *out, size_t outlen) {
    /* RFC6979 3.2.h. */
  //Please note: the static keyword breaks the openCL 1.0 build.
  //static
  const unsigned char zero[1] = {0x00};
  if (rng->retry) {
    secp256k1_hmac_sha256_t hmac;
    secp256k1_hmac_sha256_initialize(&hmac, rng->k, 32);
    secp256k1_hmac_sha256_write(&hmac, rng->v, 32);
    secp256k1_hmac_sha256_write(&hmac, zero, 1);
    secp256k1_hmac_sha256_finalize(&hmac, rng->k);
    secp256k1_hmac_sha256_initialize(&hmac, rng->k, 32);
    secp256k1_hmac_sha256_write(&hmac, rng->v, 32);
    secp256k1_hmac_sha256_finalize(&hmac, rng->v);
  }

  while (outlen > 0) {
    secp256k1_hmac_sha256_t hmac;
    int now = outlen;
    secp256k1_hmac_sha256_initialize(&hmac, rng->k, 32);
    secp256k1_hmac_sha256_write(&hmac, rng->v, 32);
    secp256k1_hmac_sha256_finalize(&hmac, rng->v);
    if (now > 32) {
      now = 32;
    }
    memoryCopy(out, rng->v, now);
    out += now;
    outlen -= now;
  }

  rng->retry = 1;
}

static void secp256k1_rfc6979_hmac_sha256_finalize(secp256k1_rfc6979_hmac_sha256_t *rng) {
    memorySet(rng->k, 0, 32);
    memorySet(rng->v, 0, 32);
    rng->retry = 0;
}


#undef Round
#undef sigma0
#undef sigma1
#undef Sigma0
#undef Sigma1
#undef Ch
#undef Maj
#undef ReadBE32
#undef WriteBE32
//******end of hash_impl.h******


//******From ecmult_gen_impl.h******
/** Generator for secp256k1, value 'g' defined in
 *  "Standards for Efficient Cryptography" (SEC2) 2.7.1.
 */
#ifndef DEFINED_ALREADY_secp256k1_ge_const_g
#define DEFINED_ALREADY_secp256k1_ge_const_g
___static__constant secp256k1_ge secp256k1_ge_const_g = SECP256K1_GE_CONST(
    0x79BE667EUL, 0xF9DCBBACUL, 0x55A06295UL, 0xCE870B07UL,
    0x029BFCDBUL, 0x2DCE28D9UL, 0x59F2815BUL, 0x16F81798UL,
    0x483ADA77UL, 0x26A3C465UL, 0x5DA4FBFCUL, 0x0E1108A8UL,
    0xFD17B448UL, 0xA6855419UL, 0x9C47D08FUL, 0xFB10D4B8UL
);
#endif

void secp256k1_gej_copy__from__global(secp256k1_gej* output, __global const secp256k1_gej* input){
  output->infinity = input->infinity;
  secp256k1_fe_copy__from__global(&output->x, &input->x);
  secp256k1_fe_copy__from__global(&output->y, &input->y);
  secp256k1_fe_copy__from__global(&output->z, &input->z);
}

__constant static const char x_coordinate_seed_for_EC_point_with_unknown_scalar_signed[34] = "The scalar for this x is unknown\0";

void secp256k1_ecmult_gen_context_build(
  __global secp256k1_ecmult_gen_context *ctx,
  __global unsigned char* memoryPool
) {
  secp256k1_ge prec[1024];
  secp256k1_gej gj;
  secp256k1_gej nums_gej;
  // <- sizeof(secp256k1_ge_storage) returns zero on openCL 1.1, Ubuntu, NVidia Quadro K2000.
  int i, j, k;

  if (ctx->prec != NULL) {
    return;
  }
  memoryPool_writeCurrentSizeAsOutput(1, memoryPool);
  //ctx->prec = (__global secp256k1_ge_storage (*)[64][16]) checked_malloc(sizeof(*ctx->prec), memoryPool);
  //memoryPool_write_uint_asOutput(sizeof_secp256k1_ge_storage() * 16 * 64, 2, memoryPool);
  ctx->prec = (__global secp256k1_ge_storage*) checked_malloc(sizeof_secp256k1_ge_storage() * 16 * 64, memoryPool);
  /* get the generator */
  //openCL note: secp256k1_ge_const_g is always in the __constant address space.
  secp256k1_gej_set_ge__constant(&gj, &secp256k1_ge_const_g);

  /* Construct a group element with no known corresponding scalar (nothing up my sleeve). */
  {
    //Warning: the string below is used as a random seed for generating an element on the curve.
    //It is not an error message, but rather a sequence of pseudorandom bytes
    // serving as an essentail constant for the library.
    //Static does not compile in openCL 1.2
    //static
    secp256k1_fe nums_x;
    secp256k1_ge nums_ge;
    unsigned char x_coordinate_seed_for_EC_point_with_unknown_scalar[32];
    //The line below does not compile in openCL 1.2
    for (k = 0; k < 32; k ++) {
      x_coordinate_seed_for_EC_point_with_unknown_scalar[k] = (unsigned char) x_coordinate_seed_for_EC_point_with_unknown_scalar_signed[k];
    }
    secp256k1_fe_set_b32(&nums_x, x_coordinate_seed_for_EC_point_with_unknown_scalar);
    memoryPool_write_fe_asOutput(&nums_x, 2, memoryPool);
    secp256k1_ge_set_xo_var(&nums_ge, &nums_x, 0);
    secp256k1_gej_set_ge(&nums_gej, &nums_ge);
    /* Add G to make the bits in x uniformly distributed. */
    secp256k1_gej_add_ge_var__constant(&nums_gej, &nums_gej, &secp256k1_ge_const_g, NULL);
  }

  /* compute prec. */
  {
    secp256k1_gej precj[1024]; /* Jacobian versions of prec. */

    secp256k1_gej gbase;
    secp256k1_gej numsbase;
    gbase = gj; /* 16^j * G */
    numsbase = nums_gej; /* 2^j * nums. */
    for (j = 0; j < 64; j ++) {
      /* Set precj[j*16 .. j*16+15] to (numsbase, numsbase + gbase, ..., numsbase + 15*gbase). */
      precj[j * 16] = numsbase;
      for (i = 1; i < 16; i ++) {
        secp256k1_gej_add_var(&precj[j * 16 + i], &precj[j * 16 + i - 1], &gbase, NULL);
      }
      /* Multiply gbase by 16. */
      for (i = 0; i < 4; i ++) {
        secp256k1_gej_double_var(&gbase, &gbase, NULL);
      }
      /* Multiply numbase by 2. */
      secp256k1_gej_double_var(&numsbase, &numsbase, NULL);
      if (j == 62) {
        /* In the last iteration, numsbase is (1 - 2^j) * nums instead. */
        secp256k1_gej_neg(&numsbase, &numsbase);
        secp256k1_gej_add_var(&numsbase, &numsbase, &nums_gej, NULL);
      }
    }
    secp256k1_ge_set_all_gej_var(1024, prec, precj, memoryPool);
  }
  for (j = 0; j < 64; j ++) {
    for (i = 0; i < 16; i ++) {
      //original version:
      //secp256k1_ge_to__global__storage(&(*ctx->prec)[j][i], &prec[j * 16 + i]);
      secp256k1_ge_to__global__storage(&ctx->prec[j * 16 + i], &prec[j * 16 + i]);
    }
  }
  //int usedForCompilerWarning;
  //return;
  secp256k1_ecmult_gen_blind(ctx, NULL);
}

/* Setup blinding values for secp256k1_ecmult_gen. */
void secp256k1_ecmult_gen_blind(__global secp256k1_ecmult_gen_context *ctx, const unsigned char *seed32) {
  secp256k1_scalar b, blindPoint;
  secp256k1_gej gb, initialPoint;
  secp256k1_fe s;
  unsigned char nonce32[32];
  secp256k1_rfc6979_hmac_sha256_t rng;
  int retry;
  //WARNING: hard-coded sizeof(keydata) is used below.
  //Please apply extra attention if refactoring this variable.
  unsigned char keydata[64] = {0};
  if (seed32 == NULL) {
    /* When seed is NULL, reset the initial point and blinding value. */
    //Note: secp256k1_ge_const_g is in the __constant address space
    secp256k1_gej_set_ge__constant(&initialPoint, &secp256k1_ge_const_g);
    secp256k1_gej_neg(&initialPoint, &initialPoint);
    secp256k1_gej_copy__to__global(&ctx->initial, &initialPoint);
    secp256k1_scalar_set_int(&blindPoint, 1);
    secp256k1_scalar_copy__to__global(&ctx->blind, &blindPoint);
  }
  /* The prior blinding value (if not reset) is chained forward by including it in the hash. */
  secp256k1_scalar_get_b32__global(nonce32, &ctx->blind);
  /** Using a CSPRNG allows a failure free interface, avoids needing large amounts of random data,
   *   and guards against weak or adversarial seeds.  This is a simpler and safer interface than
   *   asking the caller for blinding values directly and expecting them to retry on failure.
   */
  memoryCopy(keydata, nonce32, 32);
  if (seed32 != NULL) {
    memoryCopy(keydata + 32, seed32, 32);
  }
  secp256k1_rfc6979_hmac_sha256_initialize(&rng, keydata, seed32 ? 64 : 32);
  memorySet(keydata, 0, sizeof_char64());
  /* Retry for out of range results to achieve uniformity. */
  do {
    secp256k1_rfc6979_hmac_sha256_generate(&rng, nonce32, 32);
    retry = !secp256k1_fe_set_b32(&s, nonce32);
    retry |= secp256k1_fe_is_zero(&s);
  } while (retry);
  /* Randomize the projection to defend against multiplier sidechannels. */
  secp256k1_gej_copy__from__global(&initialPoint, &ctx->initial);
  secp256k1_gej_rescale(&initialPoint, &s);
  secp256k1_gej_copy__to__global(&ctx->initial, &initialPoint);
  secp256k1_fe_clear(&s);
  do {
    secp256k1_rfc6979_hmac_sha256_generate(&rng, nonce32, 32);
    secp256k1_scalar_set_b32(&b, nonce32, &retry);
    /* A blinding value of 0 works, but would undermine the projection hardening. */
    retry |= secp256k1_scalar_is_zero(&b);
  } while (retry);
  secp256k1_rfc6979_hmac_sha256_finalize(&rng);
  memorySet(nonce32, 0, 32);
  secp256k1_ecmult_gen(ctx, &gb, &b);
  secp256k1_scalar_negate(&b, &b);
  ctx->blind = b;
  ctx->initial = gb;
  secp256k1_scalar_clear(&b);
  secp256k1_gej_clear(&gb);
}

// secp256k1_ecmult_gen_context_init must be called on each newly created generator context.
void secp256k1_ecmult_gen_context_init(secp256k1_ecmult_gen_context *ctx) {
  ctx->prec = NULL;
}

int secp256k1_ecmult_gen_context_is_built(const secp256k1_ecmult_gen_context* ctx) {
  return ctx->prec != NULL;
}

void secp256k1_ecmult_gen_context_clear(secp256k1_ecmult_gen_context *ctx) {
  memoryPool_freeMemory__global(ctx->prec);
  secp256k1_scalar_clear(&ctx->blind);
  secp256k1_gej_clear(&ctx->initial);
  ctx->prec = NULL;
}

void secp256k1_ecmult_context_init(__global secp256k1_ecmult_context* output) {
  output->pre_g = NULL;
}

void secp256k1_ecmult_context_build(
  __global secp256k1_ecmult_context* output,
  __global unsigned char* memoryPool
) {

  secp256k1_gej generatorProjective;

  if (output->pre_g != NULL) {
    return;
  }
  /* get the generator */
  //openCL note: secp256k1_ge_const_g is always in the __constant address space.
  secp256k1_gej_set_ge__constant(&generatorProjective, &secp256k1_ge_const_g);

  memoryPool_writeCurrentSizeAsOutput(1, memoryPool);
  output->pre_g = (__global secp256k1_ge_storage (*)[]) checked_malloc(
    ECMULT_TABLE_SIZE(WINDOW_G) * sizeof_secp256k1_ge_storage(),
    memoryPool
  );
  /* precompute the tables with odd multiples */
  secp256k1_ecmult_odd_multiples_table_storage_var(ECMULT_TABLE_SIZE(WINDOW_G), *output->pre_g, &generatorProjective, memoryPool);
}

void secp256k1_scalar_copy__from__global(secp256k1_scalar* output, __global const secp256k1_scalar* input) {
  output->d[0] = input->d[0];
  output->d[1] = input->d[1];
  output->d[2] = input->d[2];
  output->d[3] = input->d[3];
  output->d[4] = input->d[4];
  output->d[5] = input->d[5];
  output->d[6] = input->d[6];
  output->d[7] = input->d[7];
}

void secp256k1_ecmult_gen(
  __global const secp256k1_ecmult_gen_context *inputGeneratorContext,
  secp256k1_gej *r,
  const secp256k1_scalar *gn
) {
  secp256k1_ge add;
  secp256k1_ge_storage adds;
  secp256k1_scalar gnb, blind;
  int bits;
  int i, j;
  memorySet((unsigned char*) &adds, 0, sizeof_secp256k1_ge_storage());
  *r = inputGeneratorContext->initial;
  /* Blind scalar/point multiplication by computing (n-b)G + bG instead of nG. */
  secp256k1_scalar_copy__from__global(&blind, &inputGeneratorContext->blind);
  secp256k1_scalar_add(&gnb, gn, &blind);
  add.infinity = 0;
  for (j = 0; j < 64; j ++) {
    bits = secp256k1_scalar_get_bits(&gnb, j * 4, 4);
    for (i = 0; i < 16; i ++) {
      /** This uses a conditional move to avoid any secret data in array indexes.
       *   _Any_ use of secret indexes has been demonstrated to result in timing
       *   sidechannels, even when the cache-line access patterns are uniform.
       *  See also:
       *   "A word of warning", CHES 2013 Rump Session, by Daniel J. Bernstein and Peter Schwabe
       *    (https://cryptojedi.org/peter/data/chesrump-20130822.pdf) and
       *   "Cache Attacks and Countermeasures: the Case of AES", RSA 2006,
       *    by Dag Arne Osvik, Adi Shamir, and Eran Tromer
       *    (http://www.tau.ac.il/~tromer/papers/cache.pdf)
       */
      secp256k1_ge_storage_cmov__global(&adds, & inputGeneratorContext->prec[16 * j + i], i == bits);
      //original version:
      //secp256k1_ge_storage_cmov__global(&adds, &(*inputGeneratorContext->prec)[j][i], i == bits);
    }
    secp256k1_ge_from_storage(&add, &adds);
    secp256k1_gej_add_ge(r, r, &add);
  }
  bits = 0;
  secp256k1_ge_clear(&add);
  secp256k1_scalar_clear(&gnb);
}
//******end of ecmult_gen_impl.h******


//******From ecdsa_impl.h******

/** Group order for secp256k1 defined as 'n' in "Standards for Efficient Cryptography" (SEC2) 2.7.1
 *  sage: for t in xrange(1023, -1, -1):
 *     ..   p = 2**256 - 2**32 - t
 *     ..   if p.is_prime():
 *     ..     print '%x'%p
 *     ..     break
 *   'fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f'
 *  sage: a = 0
 *  sage: b = 7
 *  sage: F = FiniteField (p)
 *  sage: '%x' % (EllipticCurve ([F (a), F (b)]).order())
 *   'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141'
 */
___static__constant secp256k1_fe secp256k1_ecdsa_const_order_as_fe = SECP256K1_FE_CONST(
    0xFFFFFFFFUL, 0xFFFFFFFFUL, 0xFFFFFFFFUL, 0xFFFFFFFEUL,
    0xBAAEDCE6UL, 0xAF48A03BUL, 0xBFD25E8CUL, 0xD0364141UL
);

/** Difference between field and order, values 'p' and 'n' values defined in
 *  "Standards for Efficient Cryptography" (SEC2) 2.7.1.
 *  sage: p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
 *  sage: a = 0
 *  sage: b = 7
 *  sage: F = FiniteField (p)
 *  sage: '%x' % (p - EllipticCurve ([F (a), F (b)]).order())
 *   '14551231950b75fc4402da1722fc9baee'
 */
___static__constant secp256k1_fe secp256k1_ecdsa_const_p_minus_order = SECP256K1_FE_CONST(
    0, 0, 0, 1, 0x45512319UL, 0x50B75FC4UL, 0x402DA172UL, 0x2FC9BAEEUL
);

/*Same as the next function, except that it's working with the local address space.*/
int secp256k1_ecdsa_sig_serialize(
  unsigned char *sig,
  size_t* inputAvailableSizeOutputFinalSize,
  const secp256k1_scalar* ar,
  const secp256k1_scalar* as
) {
  unsigned char r[33] = {0}, s[33] = {0};
  unsigned char *rp = r, *sp = s;
  size_t lenR = 33, lenS = 33;
  secp256k1_scalar_get_b32(&r[1], ar);
  secp256k1_scalar_get_b32(&s[1], as);
  while (lenR > 1 && rp[0] == 0 && rp[1] < 0x80) {
    lenR--;
    rp++;
  }
  while (lenS > 1 && sp[0] == 0 && sp[1] < 0x80) {
    lenS--;
    sp++;
  }
  if (*inputAvailableSizeOutputFinalSize < 6 + lenS + lenR) {
    *inputAvailableSizeOutputFinalSize = 6 + lenS + lenR;
    return 0;
  }
  *inputAvailableSizeOutputFinalSize = 6 + lenS + lenR;
  sig[0] = 0x30;
  sig[1] = 4 + lenS + lenR;
  sig[2] = 0x02;
  sig[3] = lenR;
  memoryCopy(sig + 4, rp, lenR);
  sig[4 + lenR] = 0x02;
  sig[5 + lenR] = lenS;
  memoryCopy(sig + lenR + 6, sp, lenS);
  return 1;
}

/*Same as the preceding function, except that it's working with the __global address space*/
int secp256k1_ecdsa_sig_serialize__global(
  __global unsigned char *sig,
  size_t* inputAvailableSizeOutputFinalSize,
  const secp256k1_scalar* ar,
  const secp256k1_scalar* as
) {
  unsigned char r[33] = {0}, s[33] = {0};
  unsigned char *rp = r, *sp = s;
  size_t lenR = 33, lenS = 33;
  secp256k1_scalar_get_b32(&r[1], ar);
  secp256k1_scalar_get_b32(&s[1], as);
  while (lenR > 1 && rp[0] == 0 && rp[1] < 0x80) {
    lenR --;
    rp ++;
  }
  while (lenS > 1 && sp[0] == 0 && sp[1] < 0x80) {
    lenS --;
    sp ++;
  }
  if (*inputAvailableSizeOutputFinalSize < 6 + lenS + lenR) {
    *inputAvailableSizeOutputFinalSize = 6 + lenS + lenR;
    return 0;
  }
  *inputAvailableSizeOutputFinalSize = 6 + lenS + lenR;
  sig[0] = 0x30;
  sig[1] = 4 + lenS + lenR;
  sig[2] = 0x02;
  sig[3] = lenR;
  memoryCopy_to__global(sig + 4, rp, lenR);
  sig[4 + lenR] = 0x02;
  sig[5 + lenR] = lenS;
  memoryCopy_to__global(sig + lenR + 6, sp, lenS);
  return 1;
}

int secp256k1_ecdsa_sig_sign(
  __global const secp256k1_ecmult_gen_context *generatorContext,
  secp256k1_scalar *sigr,
  secp256k1_scalar *sigs,
  const secp256k1_scalar *seckey,
  const secp256k1_scalar *message,
  const secp256k1_scalar *nonce,
  int *recid
) {
  unsigned char b[32];
  secp256k1_gej rp;
  secp256k1_ge r;
  secp256k1_scalar n;
  int overflow = 0;
  secp256k1_ecmult_gen(generatorContext, &rp, nonce);
  secp256k1_ge_set_gej(&r, &rp);
  secp256k1_fe_normalize(&r.x);
  secp256k1_fe_normalize(&r.y);
  secp256k1_fe_get_b32(b, &r.x);
  secp256k1_scalar_set_b32(sigr, b, &overflow);
  if (secp256k1_scalar_is_zero(sigr)) {
    /* P.x = order is on the curve, so technically sig->r could end up zero, which would be an invalid signature. */
    secp256k1_gej_clear(&rp);
    secp256k1_ge_clear(&r);
    return 0;
  }
  if (recid) {
    *recid = (overflow ? 2 : 0) | (secp256k1_fe_is_odd(&r.y) ? 1 : 0);
  }
  secp256k1_scalar_mul(&n, sigr, seckey);
  secp256k1_scalar_add(&n, &n, message);
  secp256k1_scalar_inverse(sigs, nonce);
  secp256k1_scalar_mul(sigs, sigs, &n);
  secp256k1_scalar_clear(&n);
  secp256k1_gej_clear(&rp);
  secp256k1_ge_clear(&r);
  if (secp256k1_scalar_is_zero(sigs)) {
    return 0;
  }
  if (secp256k1_scalar_is_high(sigs)) {
    secp256k1_scalar_negate(sigs, sigs);
    if (recid) {
      *recid ^= 1;
    }
  }
  return 1;
}

int secp256k1_ecdsa_sig_recover(
  __global const secp256k1_ecmult_context *ctx,
  const secp256k1_scalar *sigr,
  const secp256k1_scalar* sigs,
  secp256k1_ge *pubkey,
  const secp256k1_scalar *message,
  int recid,
  __global unsigned char* memoryPool
) {
  unsigned char brx[32];
  secp256k1_fe fx;
  secp256k1_ge x;
  secp256k1_gej xj;
  secp256k1_scalar rn, u1, u2;
  secp256k1_gej qj;

  if (secp256k1_scalar_is_zero(sigr) || secp256k1_scalar_is_zero(sigs)) {
    return 0;
  }

  secp256k1_scalar_get_b32(brx, sigr);
  secp256k1_fe_set_b32(&fx, brx); /* brx comes from a scalar, so is less than the order; certainly less than p */
  if (recid & 2) {
    //openCL note: secp256k1_ecdsa_const_p_minus_order is always in the __constant address space.
    if (secp256k1_fe_cmp_var__constant(&fx, &secp256k1_ecdsa_const_p_minus_order) >= 0) {
      return 0;
    }
    //openCL note: secp256k1_ecdsa_const_p_minus_order is always in the __constant address space.
    secp256k1_fe_add__constant(&fx, &secp256k1_ecdsa_const_order_as_fe);
  }
  if (!secp256k1_ge_set_xo_var(&x, &fx, recid & 1)) {
    return 0;
  }
  secp256k1_gej_set_ge(&xj, &x);
  secp256k1_scalar_inverse_var(&rn, sigr);
  secp256k1_scalar_mul(&u1, &rn, message);
  secp256k1_scalar_negate(&u1, &u1);
  secp256k1_scalar_mul(&u2, &rn, sigs);
  secp256k1_ecmult(ctx, &qj, &xj, &u2, &u1, memoryPool);
  secp256k1_ge_set_gej_var(pubkey, &qj);
  return !secp256k1_gej_is_infinity(&qj);
}

char secp256k1_ecdsa_sig_verify(
  __global const secp256k1_ecmult_context *multiplicationContext,
  const secp256k1_scalar *sigr,
  const secp256k1_scalar *sigs,
  const secp256k1_ge *pubkey,
  const secp256k1_scalar *message,
  __global unsigned char* memoryPoolSignatures
) {
  unsigned char c[32];
  secp256k1_scalar sn, u1, u2;
  secp256k1_fe xr;
  secp256k1_gej pubkeyj;
  secp256k1_gej pr;
  if (secp256k1_scalar_is_zero(sigr) || secp256k1_scalar_is_zero(sigs)) {
    return 0;
  }

  secp256k1_scalar_inverse_var(&sn, sigs);
  secp256k1_scalar_mul(&u1, &sn, message);
  secp256k1_scalar_mul(&u2, &sn, sigr);
  secp256k1_gej_set_ge(&pubkeyj, pubkey);

  secp256k1_ecmult(multiplicationContext, &pr, &pubkeyj, &u2, &u1, memoryPoolSignatures);
  if (secp256k1_gej_is_infinity(&pr)) {
    return 0;
  }
  secp256k1_scalar_get_b32(c, sigr);
  secp256k1_fe_set_b32(&xr, c);

  /** We now have the recomputed R point in pr, and its claimed x coordinate (modulo n)
   *  in xr. Naively, we would extract the x coordinate from pr (requiring a inversion modulo p),
   *  compute the remainder modulo n, and compare it to xr. However:
   *
   *        xr == X(pr) mod n
   *    <=> exists h. (xr + h * n < p && xr + h * n == X(pr))
   *    [Since 2 * n > p, h can only be 0 or 1]
   *    <=> (xr == X(pr)) || (xr + n < p && xr + n == X(pr))
   *    [In Jacobian coordinates, X(pr) is pr.x / pr.z^2 mod p]
   *    <=> (xr == pr.x / pr.z^2 mod p) || (xr + n < p && xr + n == pr.x / pr.z^2 mod p)
   *    [Multiplying both sides of the equations by pr.z^2 mod p]
   *    <=> (xr * pr.z^2 mod p == pr.x) || (xr + n < p && (xr + n) * pr.z^2 mod p == pr.x)
   *
   *  Thus, we can avoid the inversion, but we have to check both cases separately.
   *  secp256k1_gej_eq_x implements the (xr * pr.z^2 mod p == pr.x) test.
   */

    //secp256k1_fe_get_b32(c, &xr);
    //memoryCopy_to__global(comments + 1, c, 32);
    //secp256k1_fe_get_b32(c, &pr.x);
    //memoryCopy_to__global(comments + 33, c, 32);
    //secp256k1_fe_get_b32(c, &pr.z);
    //memoryCopy_to__global(comments + 65, c, 32);

  if (secp256k1_gej_eq_x_var(&xr, &pr)) {
    /* pr.x == xr * pr.z^2 mod p, so the signature is valid. */
    //comments[0] = (unsigned char) 1;
    return 1;
  }
  //openCL note: secp256k1_ecdsa_const_p_minus_order is always in the __constant address space.
  if (secp256k1_fe_cmp_var__constant(&xr, &secp256k1_ecdsa_const_p_minus_order) >= 0) {
    /* xr + p >= n, so we can skip testing the second case. */
    return 0;
  }
  //openCL note: secp256k1_ecdsa_const_p_minus_order is always in the __constant address space.
  secp256k1_fe_add__constant(&xr, &secp256k1_ecdsa_const_order_as_fe);
  if (secp256k1_gej_eq_x_var(&xr, &pr)) {
    /* (xr + n) * pr.z^2 mod p == pr.
    x, so the signature is valid. */
    return 1;
  }
  return 0;
}
//******end of ecdsa_impl.h******


//******From eckey.h******
int secp256k1_eckey_pubkey_parse(
  secp256k1_ge *outputPublicKey,
  __global const unsigned char *inputPublicKey,
  size_t size
) {
  if (size == 33 && (inputPublicKey[0] == SECP256K1_TAG_PUBKEY_EVEN || inputPublicKey[0] == SECP256K1_TAG_PUBKEY_ODD)) {
    secp256k1_fe x;
    return secp256k1_fe_set_b32__global(&x, inputPublicKey + 1) &&
    secp256k1_ge_set_xo_var(outputPublicKey, &x, inputPublicKey[0] == SECP256K1_TAG_PUBKEY_ODD);
  } else if (size == 65 && (
      inputPublicKey[0] == SECP256K1_TAG_PUBKEY_UNCOMPRESSED ||
      inputPublicKey[0] == SECP256K1_TAG_PUBKEY_HYBRID_EVEN ||
      inputPublicKey[0] == SECP256K1_TAG_PUBKEY_HYBRID_ODD
  )) {
    secp256k1_fe x, y;
    if (!secp256k1_fe_set_b32__global(&x, inputPublicKey + 1) || !secp256k1_fe_set_b32__global(&y, inputPublicKey + 33)) {
      return 0;
    }
    secp256k1_ge_set_xy(outputPublicKey, &x, &y);
    if ((inputPublicKey[0] == SECP256K1_TAG_PUBKEY_HYBRID_EVEN || inputPublicKey[0] == SECP256K1_TAG_PUBKEY_HYBRID_ODD) &&
        secp256k1_fe_is_odd(&y) != (inputPublicKey[0] == SECP256K1_TAG_PUBKEY_HYBRID_ODD)) {
        return 0;
    }
    return secp256k1_ge_is_valid_var(outputPublicKey);
  } else {
      return 0;
  }
}

int secp256k1_eckey_pubkey_serialize(
  secp256k1_ge *inputOutputPublicKey,
  __global unsigned char *outputPublicKey,
  size_t *size,
  int compressed
) {
  if (secp256k1_ge_is_infinity(inputOutputPublicKey)) {
    return 0;
  }
  secp256k1_fe_normalize_var(&inputOutputPublicKey->x);
  secp256k1_fe_normalize_var(&inputOutputPublicKey->y);
  secp256k1_fe_get_b32__to__global(&outputPublicKey[1], &inputOutputPublicKey->x);
  if (compressed) {
    *size = 33;
    outputPublicKey[0] = secp256k1_fe_is_odd(&inputOutputPublicKey->y) ? SECP256K1_TAG_PUBKEY_ODD : SECP256K1_TAG_PUBKEY_EVEN;
  } else {
    *size = 65;
    outputPublicKey[0] = SECP256K1_TAG_PUBKEY_UNCOMPRESSED;
    secp256k1_fe_get_b32__to__global(&outputPublicKey[33], &inputOutputPublicKey->y);
  }
  return 1;
}
//******end of eckey.h******


///////////////////////
///////////////////////
#include "../opencl/cl/secp256k1_set_1_address_space__global.h"
#include "../opencl/cl/secp256k1_1_parametric_address_space.cl"
///////////////////////
#include "../opencl/cl/secp256k1_set_1_address_space__constant.h"
#include "../opencl/cl/secp256k1_1_parametric_address_space.cl"
///////////////////////
#include "../opencl/cl/secp256k1_set_1_address_space__default.h"
#include "../opencl/cl/secp256k1_1_parametric_address_space.cl"
///////////////////////
///////////////////////

#undef sizeof
#define sizeof sizeof

#endif //FILE_secp256k1_CL_INCLUDED_MUST_GUARD_DUE_TO_OPENCL_NON_DOCUMENTED_BEHAVIOR
