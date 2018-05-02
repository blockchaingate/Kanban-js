//Header needed to convert secp256k1.cl to an openCL program.
#ifndef MACRO_secp256k1_opencl_header_c_safe_H
#define MACRO_secp256k1_opencl_header_c_safe_H
#define MACRO_MaxNumberOfObjectsInMemoryPool 10
typedef struct {
  unsigned char* memory;
  unsigned int totalMemory;
  int numberOfObjectAllocated;
  int* objectStarts;
  int* objectLengths;
  unsigned char* errorBuffer;
  int deallocated;
} memoryPool;

typedef struct {
    void (*fn)(const char *text, void* data);
    const void* data;
} secp256k1_callback;

#endif //MACRO_secp256k1_opencl_header_c_safe_H