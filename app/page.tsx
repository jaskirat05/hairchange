'use client';

import { Button } from '@/components/ui/button'
import { ArrowBigRight, Settings } from 'lucide-react'

import Link from 'next/link'
import React from 'react'
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser
} from '@clerk/nextjs'

const Page = () => {
  const { user, isLoaded } = useUser();
  const isAdmin = isLoaded && user?.publicMetadata?.role === 'admin';

  return (
  <>
    <div className='h-20 items-start p-5 flex justify-between'>
      <SignedIn>
        <UserButton/>
        {isAdmin && (
          <Link href="/admin">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Admin Panel
            </Button>
          </Link>
        )}
      </SignedIn>
    </div>
    <div className='flex flex-col items-center p-5'>
      <div> 
        <h1 className="scroll-m-20 text-foreground text-5xl font-extrabold tracking-tight lg:text-5xl opacity-80">Hair Style </h1>
          <h1 className='scroll-m-20 text-foreground text-5xl font-extrabold tracking-tight lg:text-5xl opacity-80'> Try ON</h1>
          <h3 className='mt-2 font-semibold text-muted-foreground text-sm'>AI Hair Changing App</h3>
      </div>
      <div className='px-8 mt-14 self-center'>
        <p className='text-xl'>"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu f."</p></div>
      <div className='mt-10 flex flex-col self-center items-center space-y-10'>
       <Link href="/start">
       
       <SignedOut>
        <SignInButton>
       <Button variant="default" className='p-10 bg-gradient-to-tl w-[100%] rounded-2xl from-primary to-yellow-200 to-90% font-extrabold text-lg text-white flex flex-row justify-between'>Get a new virtual Hairstyle<span className='ml-2'>
          <ArrowBigRight></ArrowBigRight>
        </span>
        </Button>
        </SignInButton>
        </SignedOut>
       </Link> 
       <Link href="/start">
       
       <SignedIn>
        
       <Button variant="default" className='p-10 bg-gradient-to-tl w-[100%] rounded-2xl from-primary to-yellow-200 to-90% font-extrabold text-lg text-white flex flex-row justify-between'>Get a new virtual Hairstyle<span className='ml-2'>
          <ArrowBigRight></ArrowBigRight>
        </span>
        </Button>
        
        </SignedIn>
       </Link> 
        <Button variant="default" className='flex flex-row justify-between p-10 bg-gradient-to-tl w-[100%] rounded-2xl from-blue-700 to-blue-300 to-95% font-bold text-lg text-white'>Buy Premium<span className='ml-2'>
          <ArrowBigRight></ArrowBigRight>
        </span>
        </Button>
        </div>
    </div>
    </>
  )
}

export default Page