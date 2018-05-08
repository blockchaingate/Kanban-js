// This file takes as inputs address spaces, passed to the file through #defines
// Macros expected:
//
// ADDRESS_SPACE_CONSTANT
// ADDRESS_SPACE_ONE
// ADDRESS_SPACE_TWO
// APPEND_ADDRESS_SPACE
// APPEND_ADDRESS_SPACE_ONE
// APPEND_ADDRESS_SPACE_TWO


char APPEND_ADDRESS_SPACE(secp256k1_ecdsa_sig_verify)(
  ADDRESS_SPACE_ONE const secp256k1_ecmult_context *ctx, 
  ADDRESS_SPACE_TWO const secp256k1_scalar *sigr, 
  ADDRESS_SPACE_TWO const secp256k1_scalar *sigs, 
  ADDRESS_SPACE_TWO const secp256k1_ge *pubkey, 
  ADDRESS_SPACE_TWO const secp256k1_scalar *message, 
  unsigned char* comments
) {
  unsigned char c[32];
  secp256k1_scalar sn, u1, u2;
  secp256k1_fe xr;
  secp256k1_gej pubkeyj;
  secp256k1_gej pr;
  if (APPEND_ADDRESS_SPACE_TWO(secp256k1_scalar_is_zero)(sigr) || APPEND_ADDRESS_SPACE_TWO(secp256k1_scalar_is_zero)(sigs)) {
    comments[0] = (unsigned char) 7;
    return 7;
    return 0;
  }

  APPEND_ADDRESS_SPACE_TWO(secp256k1_scalar_inverse_var)(&sn, sigs);
  APPEND_ADDRESS_SPACE_TWO(secp256k1_scalar_mul)(&u1, &sn, message);
  APPEND_ADDRESS_SPACE_TWO(secp256k1_scalar_mul)(&u2, &sn, sigr);
  APPEND_ADDRESS_SPACE_TWO(secp256k1_gej_set_ge)(&pubkeyj, pubkey);

  APPEND_ADDRESS_SPACE_ONE(secp256k1_ecmult)(ctx, &pr, &pubkeyj, &u2, &u1);
  if (secp256k1_gej_is_infinity(&pr)) {
    comments[0] = (unsigned char) 8;
    return 8;
    return 0;
  }
  APPEND_ADDRESS_SPACE_TWO(secp256k1_scalar_get_b32)(c, sigr);
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
   
    secp256k1_fe_get_b32(c, &xr);
    memoryCopy(comments + 1, c, 32);
    secp256k1_fe_get_b32(c, &pr.x);
    memoryCopy(comments + 33, c, 32);    
    secp256k1_fe_get_b32(c, &pr.z);
    memoryCopy(comments + 65, c, 32);    

  if (secp256k1_gej_eq_x_var(&xr, &pr)) {
    /* pr.x == xr * pr.z^2 mod p, so the signature is valid. */
    comments[0] = (unsigned char) 1;
    return 1;
  }
  //openCL note: secp256k1_ecdsa_const_p_minus_order is always in the __constant address space.
  if (secp256k1_fe_cmp_var__constant(&xr, &secp256k1_ecdsa_const_p_minus_order) >= 0) {
    /* xr + p >= n, so we can skip testing the second case. */
    comments[0] = (unsigned char) 9;
    return 9;
    return 0;
  }
  //openCL note: secp256k1_ecdsa_const_p_minus_order is always in the __constant address space.
  secp256k1_fe_add__constant(&xr, &secp256k1_ecdsa_const_order_as_fe);
  if (secp256k1_gej_eq_x_var(&xr, &pr)) {
    /* (xr + n) * pr.z^2 mod p == pr.
    x, so the signature is valid. */
    comments[0] = (unsigned char) 1;
    return 1;
  }
  comments[0] = (unsigned char) 10;
  return 10;
  return 0;
}
