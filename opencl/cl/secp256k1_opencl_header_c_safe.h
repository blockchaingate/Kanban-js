//Header needed to convert secp256k1.cl to an openCL program.
#ifndef MACRO_secp256k1_opencl_header_c_safe_H
#define MACRO_secp256k1_opencl_header_c_safe_H
typedef struct {
  unsigned char* memory;
  unsigned int size;
  int numberOfObjectAllocated;
  unsigned int* objectStarts;
  unsigned int* objectLengths;
  unsigned char* errorBuffer;
  int deallocated;
} memoryPool;

typedef struct {
    void (*fn)(const char *text, void* data);
    const void* data;
} secp256k1_callback;

#endif //MACRO_secp256k1_opencl_header_c_safe_H