// This file takes as inputs address spaces, passed to the file through #defines
// Macros expected:
//
// ADDRESS_SPACE_INPUTS 
// ADDRESS_SPACE_CONTEXT
// APPEND_ADDRESS_SPACE
// DO_RESERVE_STATIC_CONST

#include "../opencl/cl/secp256k1.h"
//******From group_impl.h******

void APPEND_ADDRESS_SPACE(secp256k1_gej_set_ge)(secp256k1_gej *r, ADDRESS_SPACE_CONTEXT const secp256k1_ge *a) {
   r->infinity = a->infinity;
   r->x = a->x;
   r->y = a->y;
   secp256k1_fe_set_int(&r->z, 1);
}
//******end of group_impl.h******


//******From ecmult_gen_impl.h******

#ifdef DO_RESERVE_STATIC_CONST
/** Generator for secp256k1, value 'g' defined in
 *  "Standards for Efficient Cryptography" (SEC2) 2.7.1.
 */
___static__constant secp256k1_ge secp256k1_ge_const_g = SECP256K1_GE_CONST(
    0x79BE667EUL, 0xF9DCBBACUL, 0x55A06295UL, 0xCE870B07UL,
    0x029BFCDBUL, 0x2DCE28D9UL, 0x59F2815BUL, 0x16F81798UL,
    0x483ADA77UL, 0x26A3C465UL, 0x5DA4FBFCUL, 0x0E1108A8UL,
    0xFD17B448UL, 0xA6855419UL, 0x9C47D08FUL, 0xFB10D4B8UL
);

void APPEND_ADDRESS_SPACE(secp256k1_ecmult_context_build)(
  secp256k1_ecmult_context *output, 
  const secp256k1_callback *cb
) {
  secp256k1_gej gj;

  if (output->pre_g != NULL) {
    return;
  }

  /* get the generator */
  APPEND_ADDRESS_SPACE(secp256k1_gej_set_ge)(&gj, &secp256k1_ge_const_g);

  output->pre_g = (secp256k1_ge_storage (*)[]) checked_malloc(cb, sizeof((*output->pre_g)[0]) * ECMULT_TABLE_SIZE(WINDOW_G));
  /* precompute the tables with odd multiples */
  secp256k1_ecmult_odd_multiples_table_storage_var(ECMULT_TABLE_SIZE(WINDOW_G), *output->pre_g, &gj, cb);
}

void secp256k1_ecmult_gen_context_build(
  secp256k1_ecmult_gen_context *ctx, 
  const secp256k1_callback* cb
) {
  secp256k1_ge prec[1024];
  secp256k1_gej gj;
  secp256k1_gej nums_gej;
  int i, j;

  if (ctx->prec != NULL) {
    return;
  }
  ctx->prec = (secp256k1_ge_storage (*)[64][16])checked_malloc(cb, sizeof(*ctx->prec));

  /* get the generator */
  APPEND_ADDRESS_SPACE(secp256k1_gej_set_ge)(&gj, &secp256k1_ge_const_g);

  /* Construct a group element with no known corresponding scalar (nothing up my sleeve). */
  {
    //The line below does not compile in openCL 1.2
    //static const unsigned char nums_b32[33] = "The scalar for this x is unknown";
    secp256k1_fe nums_x;
    secp256k1_ge nums_ge;
    
    //The line below does not compile in openCL 1.2
    //VERIFY_CHECK(secp256k1_fe_set_b32(&nums_x, nums_b32));
    VERIFY_CHECK(secp256k1_ge_set_xo_var(&nums_ge, &nums_x, 0));
    secp256k1_gej_set_ge(&nums_gej, &nums_ge);
    /* Add G to make the bits in x uniformly distributed. */
    secp256k1_gej_add_ge_var(&nums_gej, &nums_gej, (const secp256k1_ge*) &secp256k1_ge_const_g, NULL);
  }

  /* compute prec. */
  {
    secp256k1_gej precj[1024]; /* Jacobian versions of prec. */
    secp256k1_gej gbase;
    secp256k1_gej numsbase;
    gbase = gj; /* 16^j * G */
    numsbase = nums_gej; /* 2^j * nums. */
    for (j = 0; j < 64; j++) {
      /* Set precj[j*16 .. j*16+15] to (numsbase, numsbase + gbase, ..., numsbase + 15*gbase). */
      precj[j*16] = numsbase;
      for (i = 1; i < 16; i++) {
        secp256k1_gej_add_var(&precj[j*16 + i], &precj[j*16 + i - 1], &gbase, NULL);
      }
      /* Multiply gbase by 16. */
      for (i = 0; i < 4; i++) {
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
    secp256k1_ge_set_all_gej_var(1024, prec, precj, cb);
  }
  for (j = 0; j < 64; j++) {
    for (i = 0; i < 16; i++) {
      secp256k1_ge_to_storage(&(*ctx->prec)[j][i], &prec[j*16 + i]);
    }
  }
  secp256k1_ecmult_gen_blind(ctx, NULL);
}
#endif 

//******end of ecmult_gen_impl.h******


//******From ecmult_gen_impl.h******

/* Setup blinding values for secp256k1_ecmult_gen. */
void secp256k1_ecmult_gen_blind(secp256k1_ecmult_gen_context *ctx, const unsigned char *seed32) {
    secp256k1_scalar b;
    secp256k1_gej gb;
    secp256k1_fe s;
    unsigned char nonce32[32];
    secp256k1_rfc6979_hmac_sha256_t rng;
    int retry;
    unsigned char keydata[64] = {0};
    if (seed32 == NULL) {
        /* When seed is NULL, reset the initial point and blinding value. */
        secp256k1_gej_set_ge(&ctx->initial, (const secp256k1_ge*) &secp256k1_ge_const_g);
        secp256k1_gej_neg(&ctx->initial, &ctx->initial);
        secp256k1_scalar_set_int(&ctx->blind, 1);
    }
    /* The prior blinding value (if not reset) is chained forward by including it in the hash. */
    secp256k1_scalar_get_b32(nonce32, &ctx->blind);
    /** Using a CSPRNG allows a failure free interface, avoids needing large amounts of random data,
     *   and guards against weak or adversarial seeds.  This is a simpler and safer interface than
     *   asking the caller for blinding values directly and expecting them to retry on failure.
     */
    memoryCopy(keydata, nonce32, 32);
    if (seed32 != NULL) {
      memoryCopy(keydata + 32, seed32, 32);
    }
    secp256k1_rfc6979_hmac_sha256_initialize(&rng, keydata, seed32 ? 64 : 32);
    memorySet(keydata, 0, sizeof(keydata));
    /* Retry for out of range results to achieve uniformity. */
    do {
        secp256k1_rfc6979_hmac_sha256_generate(&rng, nonce32, 32);
        retry = !secp256k1_fe_set_b32(&s, nonce32);
        retry |= secp256k1_fe_is_zero(&s);
    } while (retry);
    /* Randomize the projection to defend against multiplier sidechannels. */
    secp256k1_gej_rescale(&ctx->initial, &s);
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
//******end of ecmult_gen_impl.h******


//******From ecdsa_impl.h******
int secp256k1_ecdsa_sig_verify(const secp256k1_ecmult_context *ctx, const secp256k1_scalar *sigr, const secp256k1_scalar *sigs, const secp256k1_ge *pubkey, const secp256k1_scalar *message) {
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
  secp256k1_ecmult(ctx, &pr, &pubkeyj, &u2, &u1);
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
  if (secp256k1_gej_eq_x_var(&xr, &pr)) {
    /* xr.x == xr * xr.z^2 mod p, so the signature is valid. */
    return 1;
  }
  if (secp256k1_fe_cmp_var(&xr, (const secp256k1_fe*) &secp256k1_ecdsa_const_p_minus_order) >= 0) {
    /* xr + p >= n, so we can skip testing the second case. */
    return 0;
  }
  secp256k1_fe_add(&xr, (const secp256k1_fe*) &secp256k1_ecdsa_const_order_as_fe);
  if (secp256k1_gej_eq_x_var(&xr, &pr)) {
    /* (xr + n) * pr.z^2 mod p == pr.x, so the signature is valid. */
    return 1;
  }
  return 0;
}

int secp256k1_ecdsa_sig_recover(const secp256k1_ecmult_context *ctx, const secp256k1_scalar *sigr, const secp256k1_scalar* sigs, secp256k1_ge *pubkey, const secp256k1_scalar *message, int recid) {
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
    VERIFY_CHECK(secp256k1_fe_set_b32(&fx, brx)); /* brx comes from a scalar, so is less than the order; certainly less than p */
    if (recid & 2) {
        if (secp256k1_fe_cmp_var(&fx, (const secp256k1_fe*) &secp256k1_ecdsa_const_p_minus_order) >= 0) {
            return 0;
        }
        secp256k1_fe_add(&fx, (const secp256k1_fe*) &secp256k1_ecdsa_const_order_as_fe);
    }
    if (!secp256k1_ge_set_xo_var(&x, &fx, recid & 1)) {
        return 0;
    }
    secp256k1_gej_set_ge(&xj, &x);
    secp256k1_scalar_inverse_var(&rn, sigr);
    secp256k1_scalar_mul(&u1, &rn, message);
    secp256k1_scalar_negate(&u1, &u1);
    secp256k1_scalar_mul(&u2, &rn, sigs);
    secp256k1_ecmult(ctx, &qj, &xj, &u2, &u1);
    secp256k1_ge_set_gej_var(pubkey, &qj);
    return !secp256k1_gej_is_infinity(&qj);
}
//******end of ecdsa_impl.h******
