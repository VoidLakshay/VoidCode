"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();

  const [status, setStatus] = useState("Verifying your email...");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = params.token;

        const response = await fetch(
          `/api/auth/verify-email?token=${token}`,
          {
            method: "GET",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setStatus(data.message || "Verification failed");
          return;
        }

        setStatus("Email verified successfully!");

        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } catch (error) {
        console.error(error);
        setStatus("Something went wrong");
      }
    };

    verifyEmail();
  }, [params.token, router]);

  return (
    <div>
      <h1>{status}</h1>
    </div>
  );
}