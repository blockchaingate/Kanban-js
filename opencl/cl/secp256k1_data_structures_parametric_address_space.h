// This file takes as inputs address spaces, passed to the file through #defines
// Macros expected:
//
// ADDRESS_SPACE_INPUTS 
// ADDRESS_SPACE_CONTEXT
// APPEND_ADDRESS_SPACE
// DO_RESERVE_STATIC_CONST

//******From field_10x26_impl.h******

// Representations of elements of the field 
//
// Z / (thePrime Z)
//
// where
//
// thePrime = 2^256 - 2^32 - 977.
//
// We represent each element of our field by a 
// large integer X, given by a sequence
// n_0, \dots, n_{9} with
//
// X = \sum_{i = 0}^{9}  n_i 2^{26 i},
//
// where 0\leq n_i < 2^{32}.
//
// The representation above is not unique  
// as the n_i's are allowed to be larger than 2^{26}. 
//
// We call a representation {n_i} ``normalized'' if 
//
// X < thePrime.
// 
// For example, the element
//
// 7 * 2^52 + 5 * 2^26 + 3
//
// is represented by 
// n_0 = 3, n_1 = 5, n_2 = 7
// (all remaining elements are zero). 
//
// To make the representation {n_i} unique, we need to have both
//
// X < thePrime
//
// and 0 \leq  n_i < 2^{26}.
//
//
// In particular, n_{10} < 2^{22} is needed.
// However, in the case that n_{10} = 2^{22} - 1 
// the inequality n_{10} < 2^{22} does not guarantee that
//
// X < thePrime 
//
// If that is the case, 
// additional reductions are needed to ensure that the 
// representation is normal. 
// 
typedef struct {
  /* X = sum(i=0..9, elem[i]*2^26) mod n */
  uint32_t n[10];
#ifdef VERIFY
  int magnitude;
  int normalized;
#endif
} secp256k1_fe;
//APPEND_ADDRESS_SPACE(secp256k1_fe);

typedef struct {
  uint32_t n[8];
} APPEND_ADDRESS_SPACE(secp256k1_fe_storage);
//******End of field_10x26_impl.h******


//******From group.h******

/** A group element of the secp256k1 curve, in affine coordinates. */
typedef struct {
  secp256k1_fe x;
  secp256k1_fe y;
  int infinity; /* whether this represents the point at infinity */
} secp256k1_ge;
//APPEND_ADDRESS_SPACE(secp256k1_ge);

/** A group element of the secp256k1 curve, in jacobian coordinates.
 *  y^2 = x^3 + 7
 *  (Y/Z^3)^2 = (X/Z^2)^3 + 7
 *  Y^2 / Z^6 = X^3 / Z^6 + 7
 *  Y^2 = X^3 + 7*Z^6
 */
typedef struct {
  secp256k1_fe x; /* actual (affine) x: secp256k1_gej.x / secp256k1_gej.z^2 */
  secp256k1_fe y; /* actual (affine) y: secp256k1_gej.y / secp256k1_gej.z^3 */
  secp256k1_fe z;
  int infinity; /* whether this represents the point at infinity */
} APPEND_ADDRESS_SPACE(secp256k1_gej);

typedef struct {
  secp256k1_fe_storage x;
  secp256k1_fe_storage y;
} secp256k1_ge_storage;
//APPEND_ADDRESS_SPACE(secp256k1_ge_storage);


//******end of group.h******
