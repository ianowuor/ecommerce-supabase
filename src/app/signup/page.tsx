/* src/app/signup/page.tsx */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { register } from "@/lib/api";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register({
        full_name: fullName,
        email,
        password,
        // phone and address are optional in our RegisterPayload
      });
      
      // Redirect to login after successful registration
      // If you have email confirmation enabled in Supabase, 
      // you might want to show a "Check your email" message instead.
      router.push("/login");
    } catch (err) {
      setError((err as Error).message ?? "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-center gap-[129px] pt-[60px] mb-[140px]">
      
      {/* Left Side: Featured Image */}
      <div className="hidden lg:block w-[805px] h-[781px] bg-[#CBE4E8] relative overflow-hidden rounded-r-[4px]">
        <Image 
          src="/images/auth-side.jpg" 
          alt="Shopping Illustration" 
          fill 
          className="object-contain pt-[75px]"
          priority
        />
      </div>

      {/* Right Side: Form */}
      <div className="flex flex-col w-full max-w-[371px] px-4 lg:px-0">
        <h1 className="text-[36px] font-medium leading-[48px] tracking-[4%] mb-6">Create an account</h1>
        <p className="text-[16px] mb-12">Enter your details below</p>

        <form className="flex flex-col gap-10" onSubmit={onSubmit}>
          <input 
            type="text" 
            placeholder="Name" 
            required
            className="border-b border-black/50 pb-2 outline-none focus:border-[#DB4444] transition-colors" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <input 
            type="email" 
            placeholder="Email" 
            required
            className="border-b border-black/50 pb-2 outline-none focus:border-[#DB4444] transition-colors" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            required
            minLength={6} // Supabase default min-length
            className="border-b border-black/50 pb-2 outline-none focus:border-[#DB4444] transition-colors" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <div className="flex flex-col gap-4 mt-2">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-[#DB4444] text-white py-4 rounded-[4px] font-medium hover:bg-[#c23b3b] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
            
            <button 
              type="button"
              className="flex items-center justify-center gap-4 border border-black/40 py-4 rounded-[4px] hover:bg-gray-50 transition-colors"
            >
              <Image src="/images/google-icon.png" alt="Google" width={24} height={24} />
              <span>Sign up with Google</span>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-600 p-4 mt-2">
              <p className="text-red-600 text-[14px]">{error}</p>
            </div>
          )}
        </form>

        <div className="mt-8 flex justify-center gap-4 text-[16px]">
          <span className="opacity-70">Already have account?</span>
          <Link href="/login" className="font-medium border-b border-black/50 hover:text-[#DB4444] hover:border-[#DB4444]">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}