//Header needed to convert secp256k1.cl to an openCL program.
#ifndef MACRO_USE_openCL
#define MACRO_USE_openCL

#define uint32_t uint
#define uint64_t ulong

#define VERIFY_CHECK(arg)
#define NULL 0


#define __static_constant const

#define MACRO_MaxNumberOfObjectsInMemoryPool 10

typedef struct {
  unsigned char* memory;
  unsigned int size;
  int numberOfObjectAllocated;
  unsigned int* objectStarts;
  unsigned int* objectLengths;
  char* errorBuffer;
} memoryPool;

__constant memoryPool theMemoryPool;

struct secp256k1_callback;

static void *checked_malloc(const struct secp256k1_callback* cb, size_t size) {

}

void memcpy(unsigned char* destination, const unsigned char* source, int amount){
  int i;
  for (i = 0; i < amount; i ++){
    destination[i] = source[i];
  }
}
void memset (unsigned char* destination, unsigned char value, int amountToSet){
  int i;
  for (i = 0; i < amountToSet; i ++){
    destination[i] = value;
  }
}


#endif //MACRO_USE_openCL
