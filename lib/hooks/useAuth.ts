"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";

const JWT_STORAGE_KEY = "stfu_auth_token";

interface JWTPayload {
  userId: string;
  telegramUsername?: string;
  exp?: number;
}

/** Decode JWT payload on the client without cryptographic verification (server handles that). */
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // base64url → base64
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64)) as JWTPayload;
    if (typeof payload.userId !== "string") return null;
    // Check expiry
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

let globalIsSigning = false;
let autoSignInAttemptedFor: string | null = null;

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [payload, setPayload] = useState<JWTPayload | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const isSigningRef = useRef(false);

  // On mount and on address change: decode stored JWT
  useEffect(() => {
    const stored = localStorage.getItem(JWT_STORAGE_KEY);
    if (!stored) { setPayload(null); return; }

    const decoded = decodeJWT(stored);
    if (!decoded) {
      localStorage.removeItem(JWT_STORAGE_KEY);
      setPayload(null);
      return;
    }
    // Reject token if it belongs to a different address
    if (address && decoded.userId !== address.toLowerCase()) {
      localStorage.removeItem(JWT_STORAGE_KEY);
      setPayload(null);
      return;
    }
    setPayload(decoded);
  }, [address]);

  const getToken = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(JWT_STORAGE_KEY);
  }, []);

  const signIn = useCallback(async () => {
    if (!address) throw new Error("No wallet connected");
    if (globalIsSigning || isSigningRef.current) return;

    globalIsSigning = true;
    isSigningRef.current = true;
    setIsSigning(true);
    try {
      const timestamp = Date.now();
      const lc = address.toLowerCase();
      const message = `Sign in to STFU & Execute\nWallet: ${lc}\nTimestamp: ${timestamp}`;

      const signature = await signMessageAsync({ message });

      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature, timestamp }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Sign-in failed");
      }

      const { token, user } = await res.json();
      localStorage.setItem(JWT_STORAGE_KEY, token);
      setPayload({ userId: lc, telegramUsername: user.telegramUsername ?? undefined });
      autoSignInAttemptedFor = address;
    } finally {
      globalIsSigning = false;
      isSigningRef.current = false;
      setIsSigning(false);
    }
  }, [address, signMessageAsync]);

  const signOut = useCallback(() => {
    localStorage.removeItem(JWT_STORAGE_KEY);
    setPayload(null);
  }, []);

  const refreshFromStorage = useCallback(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(JWT_STORAGE_KEY);
    if (!stored) { setPayload(null); return; }
    const decoded = decodeJWT(stored);
    setPayload(decoded);
  }, []);

  // Auto sign-in when wallet connects and no valid JWT exists
  useEffect(() => {
    if (
      isConnected &&
      address &&
      !payload &&
      !globalIsSigning &&
      autoSignInAttemptedFor !== address
    ) {
      autoSignInAttemptedFor = address;
      signIn().catch(console.error);
    }
  }, [isConnected, address, payload, signIn]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isAuthenticated: isConnected && payload !== null,
    telegramUsername: payload?.telegramUsername,
    userId: payload?.userId,
    getToken,
    signIn,
    signOut,
    refreshFromStorage,
    isSigning,
  };
}
