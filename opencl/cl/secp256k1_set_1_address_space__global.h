#ifdef ADDRESS_SPACE
#undef ADDRESS_SPACE_CONSTANT
#undef ADDRESS_SPACE
#undef APPEND_ADDRESS_SPACE
#endif 

#define ADDRESS_SPACE_CONSTANT __constant
#define ADDRESS_SPACE __global
#define APPEND_ADDRESS_SPACE(X) X ## __global



